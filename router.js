require('dotenv').config();
const multer  = require('multer');
const mongoose = require('mongoose');
const cors = require('cors');
const GridFsStorage = require('multer-gridfs-storage');
//requiring
const userdata = require('./model2');
const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const url ="mongodb+srv://mongoDbNarendra:Narendra334@cluster0-cooyo.mongodb.net/test?retryWrites=true&w=majority"
const crypto = require('crypto');
const Grid = require('gridfs-stream');
const conn = mongoose.createConnection(url);
const middleware = require('./middleware');

// Create storage engine
const storage = new GridFsStorage({
    url: url,
    file: (req, file) => {
      return new Promise((resolve, reject) => {
        crypto.randomBytes(16, (err, buf) => {
          if (err) {
            return reject(err)
          }
          const filename = file.originalname
          const fileInfo = {
            filename: filename,
            bucketName: 'uploads',
          }
          resolve(fileInfo)
        })
      })
    },
})
const upload = multer({ storage })

let gfs;
conn.once('open',()=>{
    gfs = Grid(conn.db,mongoose.mongo)
    gfs.collection('uploads')
    console.log('connection successful');
})

module.exports  = function(app){
   
    app.use(express.json());
    app.use(bodyParser.urlencoded({
        extended: false
    }));
    app.use(bodyParser.json());
    app.use(cors());

    //get all the data
    app.get('/',(req,res)=>{
        console.log('from /');
        userdata.find({},(err,document)=>{
            if(err) console.log(err);
            else{
                res.send({document:document})
            }
        });
        
    });

    //getUser
    app.get('/getUser',authenticateToken,(req,res)=>{
        console.log(req.user);
        userdata.find({},(err,data)=>{
            if(err) console.log(err)
            else{
                res.json(data.filter(post=> post.username===req.user.username));
            }
        })
        
    })

     //upload image
    app.post('/image', upload.single('img'), (req, res, err) => {
        console.log('from /image');
        if (err) console.log(err)
        console.log(req.file);
        res.status(201).send()
    })

    //retrieve image
    app.get('/image/:filename',(req,res)=>{
        gfs.files.findOne({filename:req.params.filename},(err,file)=>{
            //check if file
            console.log(file);
            if(!file || file.length===0){
                return res.status(404).json({
                    err:"no file exist",
                })
            }

            //check if image
            if(file.contentType === 'image/jpeg' || file.contentType==='image/png'){
                const readstream = gfs.createReadStream(file.filename)
                readstream.pipe(res)
            }else{
                res.status(404).json({
                    err:"image not found",
                })
            }
        })
    })

    //signup
    app.post('/signup',async (req,res)=>{
        // console.log(req.body)
       
        try{
            const salt = await bcrypt.genSalt();
            const hashPassword = await bcrypt.hash(req.body.password,salt)
            
            // console.log("salt:",salt)
            // console.log("hash:",hashPassword);

            var newItem = new userdata({
                name:req.body.name,
                DOB:req.body.dob,
                username:req.body.username,
                password:hashPassword
            })

            userdata.create(newItem,function(err){
                if(err) console.log(err)
                else{
                    res.send({status:"success"});
                }
            });

        }catch{
            res.status(500).send();
        }     
    });

    //login
    app.post('/login',async (req,res)=>{
        const username = req.body.username;
        const password = req.body.password;
        // console.log(req.body);
        userdata.findOne({username:username},(err,data)=>{
            if(err) console.log(err);
            else{
                bcrypt.compare(password, data.password, function(err, result) {
                    if(result === true){
                        const accessToken = jwt.sign({username:username},process.env.ACCESS_TOKEN_SECRET,{ expiresIn: '1h' });
                        res.json({
                            token:accessToken,
                            username:data.username,
                            id:data._id,
                            messgae:"login successfull"

                        });
                    }else{
                        res.send('Invalid User')
                    }
                });
            }         
        })     
    })

    //Add UserData and image filename using postreq
    app.post('/addImage/',(req,res)=>{
        const {username,filename,desc} = req.body;
        userdata.update({username:username},
            {$push:{
                userArt:{
                'filename':filename,
                'desc':desc
                }
            }
        }).then(res=>{
            console.log('data added succefully');
        })
        .catch(err=>{
            res.json({
                err:`${err}`
            });
        });
    });

    //deleting a user post
    app.post('/delete/',(req,res)=>{
        const {username,id} = req.body;
        console.log(req.body);
        userdata.findOneAndUpdate({username:username},{
            $pull:{
                userArt:{_id:id}
        }}).then(resolve=>{
            res.send({status:'success'})
        }).catch(err=>{
            res.json({
                err:`${err}`
            });
        })
    })
   

    function authenticateToken(req,res,next){
        const authHeader = req.headers['authorization']
        const token = authHeader && authHeader.split(' ')[1];
       
        console.log(token);

        if(token == null) return res.sendStatus(403)
        jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,user)=>{
            if(err) return res.sendStatus(403)
            req.user = user
            next()
        });
    }
}


