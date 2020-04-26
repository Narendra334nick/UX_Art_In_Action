require('dotenv').config();
const user = require('./model');
const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

module.exports  = function(app){
   
    app.use(express.json());
    app.use(bodyParser.urlencoded({
        extended: false
    }));
    app.use(bodyParser.json());

    app.get('/',(req,res)=>{
        user.find({},(err,document)=>{
            if(err) console.log(err);
            else{
                res.send({documents:document})
            }
        });
        
    });


    app.get('/getUser',authenticateToken,(req,res)=>{
        console.log(req.user);
        user.find({},(err,data)=>{
            if(err) console.log(err)
            else{
                res.json(data.filter(post=> post.username===req.user.username));
            }
        })
        
    })


    app.post('/signup',async (req,res)=>{
       
        try{
            const salt = await bcrypt.genSalt();
            const hashPassword = await bcrypt.hash(req.body.password,salt)
            
            // console.log("salt:",salt)
            // console.log("hash:",hashPassword);

            var newItem = new user({
                name:req.body.name,
                DOB:req.body.DOB,
                username:req.body.username,
                password:hashPassword
            })

            user.create(newItem,function(err){
                if(err) console.log(err)
                else{
                    res.send({status:"success"});
                }
            });

        }catch{
            res.status(500).send();
        }     
    });

    
    app.post('/login',async (req,res)=>{
        const username = req.body.username;
        const password = req.body.password;
        user.findOne({username:username},(err,data)=>{
            if(err) console.log(err);
            else{
                bcrypt.compare(password, data.password, function(err, result) {
                    if(result === true){
                        const accessToken = jwt.sign({username:username},process.env.ACCESS_TOKEN_SECRET);
                        res.json(accessToken);
                    }else{
                        res.send('Wrong password')
                    }
                });
            }         
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

