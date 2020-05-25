const mongoose = require('mongoose');
 var artSchema =new mongoose.Schema({
       
        name:String,
        DOB:String,
        username:{
            type: String,
            unique: true,
            required: true
        },
        password:String,
       
        userArt:[{
            filename:String,
            desc:String
        }]
    });
module.exports = mongoose.model('userdata',artSchema)    