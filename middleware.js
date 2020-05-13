var jwt = require('express-jwt');
require('dotenv').config();

var middleware = jwt({
    secret:process.env.ACCESS_TOKEN_SECRET,
})

module.exports = { middleware };