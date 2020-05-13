const mongoose = require('mongoose');
 var artSchema =new mongoose.Schema({
       
        name:String,
        DOB:String,
        username:String,
        password:String,
       
        userArt:[{
            filename:String,
            desc:String
        }]
    });
module.exports = mongoose.model('userdata',artSchema)    