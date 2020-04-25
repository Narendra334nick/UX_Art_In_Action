const express = require('express');
const app = express();
const port = process.env.PORT || 5000;
const mongoose = require('mongoose');
module.exports = app;


require('./router')(app);

mongoose.connect('mongodb+srv://mongoDbNarendra:Narendra334@cluster0-cooyo.mongodb.net/test?retryWrites=true&w=majority',{
  useNewUrlParser: true,
  useUnifiedTopology: true
});


app.listen(port,()=>console.log(`server running at http://localhost:${port}!`));