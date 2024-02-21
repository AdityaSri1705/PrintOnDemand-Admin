const jwt = require('jsonwebtoken');
require("dotenv").config();
const path = require('path');
const PRINT_API_KEY = process.env.PRINT_API_KEY;


// Middleware to verify token
function verifyPrintToken(req, res, next) {
  const headers = req.headers;
  const token = headers['x-api-key']

  if (!token) {
    return res.status(401).json({ message: 'Token missing' });
  }
  //console.log(PRINT_API_KEY, token)
  if(token===PRINT_API_KEY){
    next();
  }else{
    return res.status(401).json({ message: 'Invalid Token' });
  }
  
}

module.exports = verifyPrintToken;