const user = require('./model');
const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');

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

    app.post('/signup',async (req,res)=>{
       
        try{
            const salt = await bcrypt.genSalt();
            const hashPassword = await bcrypt.hash(req.body.password,salt)
            
            console.log("salt:",salt)
            console.log("hash:",hashPassword);

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
        console.log(req.body);
        
        user.findOne({username:req.body.username},(err,data)=>{
            console.log(bcrypt.compare(req.body.password,data.password));
            if(err) console.log(err);
            else{
                if(bcrypt.compare(req.body.password,data.password)){
                    res.send("login successful")
                }else{
                    res.send('Invalid User')
                }   
            }         
        })
        
        
    })
}

