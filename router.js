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
    console.log('Grid connection successful');
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
        // console.log('from /');
        userdata.find({},(err,document)=>{
            if(err) console.log(err);
            else{
                res.send({document:document})
            }
        });
        
    });

    //get a particular User-data
    app.get('/getUser',authenticateToken,(req,res)=>{
        // console.log(req.user);
        userdata.find({},(err,data)=>{
            if(err) console.log(err)
            else{
                res.json({doc:data.filter(post=> post.username===req.user.username)});
            }
        })
        
    })

     //upload image
    app.post('/image', upload.single('img'), (req, res, err) => {
        console.log('from /image');
        if (err) res.status(400).json({status:"uploading image failed"});
        else{
            res.status(201).json({});
        }
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
                if(err) res.json({error:err.errmsg,
                error2:'UserName already Exist '})
                else{
                    res.send({status:"success"});
                }
            });

        }catch{
            res.status(500).json({err:'error'});
        }     
    });

    //login
    app.post('/login',(req,res)=>{
        const username = req.body.username;
        const password = req.body.password;
        // console.log(req.body);
        userdata.findOne({username:username},(err,data)=>{
            if(err) return res.status(500).json({err:`${err}`});
            else{
                // console.log(data);
               if(data){
                    bcrypt.compare(password, data.password, function(err, result) {
                        if(result === true){
                            const accessToken = jwt.sign({username:username},process.env.ACCESS_TOKEN_SECRET,{ expiresIn: '1h' });
                            return res.json({
                                token:accessToken,
                                username:data.username,
                                id:data._id,
                                message:"login successfull"
                            });
                        }else{
                            return res.status(403).json({message:'Wrong PassWord'});
                        }
                    });
               }else{
                   return res.status(406).json({message:'user not found'});
               }
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
        }).then(resolve=>{
            console.log('data added succefully');
            res.json({status:"success"})
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
        // console.log(req.body);
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
   
    //middle ware for authentication
    function authenticateToken(req,res,next){
        // console.log(req.headers);
        const authHeader = req.headers['authorization']
        const token = authHeader && authHeader.split(' ')[1];
       
        // console.log(token);

        if(token == null) return res.sendStatus(403).josn({token:'token not available'});
        jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,user)=>{
            if(err) return res.sendStatus(403).json({err:`${err}`})
            req.user = user
            next()
        });
    }
}



