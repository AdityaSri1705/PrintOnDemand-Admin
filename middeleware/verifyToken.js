const jwt = require('jsonwebtoken');
require("dotenv").config();
const path = require('path');
const JSONWEBTOKEN_KEY = process.env.JSONWEBTOKEN_KEY;
const tokenBlacklist = require('./tokenBlackList');


// Middleware to verify token
function verifyToken(req, res, next) {
  var token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ message: 'Token missing' });
  }

  if (tokenBlacklist.has(token)) {
    return res.status(401).json({ message: 'Token invalid' });
  }
  token = token.replace('Bearer ','');
  jwt.verify(token, JSONWEBTOKEN_KEY, (err, decoded) => {

    if (err) {
      return res.status(401).json({ message: 'Token expired or invalid' });
    }

    // Attach the decoded user information to the request for further processing
    req.user = decoded;
   
    next();
  });
}

module.exports = verifyToken;