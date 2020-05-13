const mongoose = require('mongoose');

var artSchema =new mongoose.Schema({
    name:String,
    DOB:String,
    username:String,
    password:String
});

// var artSchema =new mongoose.Schema({
//     name:String,
//     DOB:String,
//     username:String,
//     password:String,
//     userArt:[{
//         desc:String,
//         img:Buffer
//     }]
// });

// var blogSchema = new mongoose.Schema({
//     blogId:String,
//     title:String,
//     blogBody:String,
//     content:{
//         authorId:String,
//         authorName:String
//     }
// });

// const blogActivity = new mongoose.Schema({
//     blogId:String,
//     blogLike:String,
//     blogComment:{
//         commentCount:String,
//         comment:String
//     }   
// })

module.exports = mongoose.model('user',artSchema)
