const crypto = require('crypto');
const ALGO = 'aes-256-cbc';
const ENC= 'bf3c199c2470cb477d907b1e0917c17b';
const IV = "5183666c72eec9e4";

const encrypt = ((text) => 
{
   let cipher = crypto.createCipheriv(ALGO, ENC, IV);
   let encrypted = cipher.update(text, 'utf8', 'base64');
   encrypted += cipher.final('base64');
   return encrypted;
});

const decrypt = ((text) => 
{
   let decipher = crypto.createDecipheriv(ALGO, ENC, IV);
   let decrypted = decipher.update(text, 'base64', 'utf8');
   return (decrypted + decipher.final('utf8'));
});
const getOTP = ((cnt) => 
{
   const min = 100000;
   const max = 999999;
   return  Math.floor(Math.random() * (max - min + 1)) + min;
   //return crypto.randomBytes(cnt).toString('hex');
});

module.exports = { encrypt, decrypt, getOTP};