const mongoose = require('mongoose');

var artSchema =new mongoose.Schema({
    img :{
        data:Buffer,
        contentType:String
    }
});

module.exports = mongoose.model('image',artSchema)