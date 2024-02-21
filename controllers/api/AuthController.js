const db = require('../../database/db');
const crypto = require('../../services/crypto');
const transporter = require('../../services/mailer');
require("dotenv").config();
const path = require('path');
const fs = require('fs');
//const fs = require('fs/promises');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const baseUrl = process.env.BASEURL;
const JSONWEBTOKEN_KEY = process.env.JSONWEBTOKEN_KEY;
const tokenBlacklist = require('../../middeleware/tokenBlackList');


/* ------------ Supportive Functions ---------------------------*/

const updateImagesPath = async(users)=>{
  return users.map(user => ({
    ...user,
    profile_img: (user.profile_img && user.profile_img!="")? user.profile_img.replace('/uploads', baseUrl+'/uploads'):'',
    banner: (user.banner && user.banner!="")? user.banner.replace('/uploads', baseUrl+'/uploads'):''
  }));
}

const titleCase = (s) => s.replace(/\b\w/g, c => c.toUpperCase());

const generateRandomPassword = (length) => {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$";
  let password = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }

  return password;
}
/* ------------ API ---------------------------*/


exports.apiLogin = async (req, res) => {
    //validate request
    if (!req.body) {
     res.status(400).send({
       status: false,
       result: "",
       errors: "Request parameters can not be empty!",
     });
   }
 
   const { email, password } = req.body;
 
   try {
     // Query the database for the user with the given email
     const sql = "SELECT * FROM `users` WHERE email = ?";
     var results = await db.query(sql, [email]);
     if (results.length === 0) {
        res.status(200).send({ 
          status: false, 
          result: "",
          errors: "Wrong Email and password.",
        });

     }else{

     // if(results[0].email_verified_at!== null)
     // {
        results = results.map(user => ({
          ...user,
          profile_img: (user.profile_img && user.profile_img!="")? user.profile_img.replace('/uploads', baseUrl+'/uploads'):'',
          banner: (user.banner && user.banner!="")? user.banner.replace('/uploads', baseUrl+'/uploads'):''
        }));
        const user = results[0];
  
        // Compare the provided password with the hashed password in the database
        const user_password = crypto.decrypt(user.password);
    
        if(req.body.password==user_password)
        {

          //getting save dairy data
          const SAVE_SQL = "SELECT * FROM user_savedata WHERE user_id=? ORDER BY created_at DESC LIMIT 1"
          const SAVE_Result = await db.query(SAVE_SQL, [user.id]);
  
          var DiaryData = [];
          if(SAVE_Result.length){
            DiaryData = SAVE_Result[0].diarydata;
          }
         
          // Create a JWT token
          const token = jwt.sign({ userId: user.id }, JSONWEBTOKEN_KEY, { expiresIn: '4h' });
          res.status(200).send({ 
            status: true, 
            result: { user: user, token: token, saveDairy:DiaryData }, 
            errors: "" 
          });
        }else{
          res.status(200).send({ 
            status: false, 
            result: "",
            errors: "Wrong Email and password."
          });
        }
      /*}else{
        res.status(200).send({ 
          status: false, 
          result: "",
          errors: "Please verify your email."
        });
      }*/
        
     }
     
     
 
   }catch (error) {
     res.status(500).send({ status: false, result: "", errors:error });
   }
 }


 exports.apiLogout = async (req, res) => {
   //validate request
   if (!req.body) {
     res.status(400).send({
       status: false,
       result: "",
       errors: "Request parameters can not be empty!",
     });
    
   }
   const token = req.headers.authorization;
 
   if (token) {
     tokenBlacklist.add(token);
   }
 
   res.status(200).send({
     status: true,
     result: "",
     errors: "Logged out Successfully",
   });
 
 }
 
 // create and save new user
 exports.apiRegister = async (req, res) => {
   //validate request
   if (!req.body) {
     res.status(400).send({
       status: false,
       result: "",
       errors: "Request parameters can not be empty!",
     });
   }
 
   const {email, password, confirm_password } = req.body;
   const status = 1; 

 
   try { 
    
     //check the email id  is exists in user table or not
     const sql = 'SELECT * FROM `users` WHERE email=?';
     const results = await db.query(sql, [email]);
     if(results.length === 0)
     {
      if(email!="" & password!="" & confirm_password!="")
      {

        if(password!=confirm_password){
            res.status(200).send({ status: false, result: "", errors: "Both password is not matched." });
        }else{
          const hashedPassword = crypto.encrypt(password);
          //const verificationToken = crypto.getOTP(6);
          const verificationToken = generateRandomPassword(10);
          const verificationLink = `${process.env.FRONTEND_URL}/verify/${verificationToken}`;


          const match = email.match(/^(.+)@/);
          const name = match ? match[1] : null;
          // insert data from the user table
          const insert_sql = "INSERT INTO `users` SET email=?, password=?, email_verify_code=?, status='?'";
          const result2 = await db.query(insert_sql, [ email, hashedPassword, verificationToken, status]);
        
          
          if (result2.insertId > 0) {

            const sql = 'SELECT * FROM `users` WHERE id=?';
            const user = await db.query(sql, [result2.insertId]);

            //adding user data in ActiveCampaign
            const activeUser = {
              email: user[0].email
            }
            addContactActiveCampaign(activeUser);

  
              const mailOptions = {
                  from: process.env.SMTP_FROM_EMAIL,
                  to: user[0].email,
                  subject: 'Email Verification',
                  html: `
                  <h1>Dear ${ titleCase(email)}</h1>
                  <p>Thank you for registering! To verify your email, please use this code below:</p>
                  <strong><a href="${verificationLink}">${verificationLink}</a></strong>
                  <p>If you didn't sign up for this service, you can ignore this email.</p>
                  <p>Thank you</p>
                  <p>Support Team</p>
                  <p>${process.env.APP_NAME}</p>
                  `,
              };
              //console.log(mailOptions);
      
              transporter.sendMail(mailOptions, (error, info) => {
                  if (error) {
                      console.log(error);
                      res.status(500).send({status: false, result: "", errors: "Error sending email" });
                  } else {
                      console.log('Email sent: ' + info.response); 
                      res.status(200).send({ 
                        status: true, 
                        result: "Thank you for register. We have sent a verification email", 
                        errors: "" 
                      });  
                  }
              });
          
              /*res.status(200).send({ 
                status: true, 
                result: "Thank you for register. We have sent a verification email", 
                errors: "" 
              }); */ 
          } else {
            res.status(200).send({status: false, result: "", errors: "Unable to regiter. Please contact to administrator." });
          }

        }
      }else{
        res.status(200).send({status: false, result: "", errors: "Required fields should not empty" });
      }
       
     }else{
       res.status(200).send({ status: false, result: "", errors: "Sorry. This email is already exists!" });
     }
 
   } catch (error) {
     res.status(500).send({ status: false, result: "", errors:error, errorData: "Error: "+error });
   }
 }
 
 // create and save new user
 exports.apiRegisterWithGoogle = async (req, res) => {
  //validate request
  if (!req.body) {
    res.status(400).send({
      status: false,
      result: "",
      errors: "Request parameters can not be empty!",
    });
  }

  const {first_name, last_name, email, google_login, profile_image} = req.body;
  const status = 1; 

  try { 
   
    //check the email id  is exists in user table or not
    const sql = 'SELECT * FROM `users` WHERE email=?';
    var results = await db.query(sql, [email]);
    if(results.length === 0)
    {
 
      //upload facebook profile image on our server
      const imageStream = await axios.get(profile_image, { responseType: 'stream' });

      // Save the fetched image to the server
      const timestamp = Date.now();
      const fileName = `user-${timestamp}.jpg`;
      const profile_img = `/uploads/users/${fileName}`;
      const writer = fs.createWriteStream(`public/${profile_img}`);
      imageStream.data.pipe(writer);

      writer.on('finish', () => {
        console.error('Image uploaded successfully', 'imageUrl'+ profile_img);
      });

      writer.on('error', (err) => {
        profile_img = '';
        console.error(err);
      });
      
       // insert data from the user table
       const currentDate = new Date();
       const insert_sql = "INSERT INTO `users` SET first_name=?, last_name=?, email=?, profile_img=?, google_login=?, email_verified_at=?, status='?'";
       const result2 = await db.query(insert_sql, [ first_name, last_name, email, profile_img, google_login, currentDate, status]);
       
       if (result2.insertId > 0) {

          const sql = 'SELECT * FROM `users` WHERE id=?';
          var userData = await db.query(sql, [result2.insertId]);
          userData = await updateImagesPath(userData);

          const user = userData[0];

           //adding user data in ActiveCampaign
          const activeUser = {
            first_name:user.first_name,
            last_name: user.last_name,
            email: user.email
          }
        addContactActiveCampaign(activeUser);

          const mailOptions = {
              from: process.env.SMTP_FROM_EMAIL,
              to: userData[0].email,
              subject: `Thankyou for register on ${process.env.APP_NAME}`,
              html: `
              <h1>Dear ${ userData[0].first_name}</h1>
              <p>Thank you for registering! </p>
              <p>If you didn't sign up for this service, you can ignore this email.</p>
              <p>Thank you</p>
              <p>Support Team</p>
              <p>${process.env.APP_NAME}</p>
              `,
          };
        
    
          transporter.sendMail(mailOptions, (error, info) => {
              if (error) {
                  console.log(error);
                  res.status(500).send({status: false, result: "", errors: "Error sending email" });
              } else {
                  console.log('Email sent: ' + info.response); 
                  res.status(200).send({ 
                    status: true, 
                    result: "Thank you for register.", 
                    errors: "" 
                  });  
              }
          });
      

          // Create a JWT token
          const token = jwt.sign({ userId: user.id }, JSONWEBTOKEN_KEY, { expiresIn: '1h' });
          res.status(200).send({ 
            status: true, 
            result: { user: user, token: token }, 
            errors: "" 
          }); 

       } else {
         res.status(404).send({status: false, result: "", errors: "Unable to insert record in db" });
       }
      
    }else{
        const userData = await updateImagesPath(results);

        // Create a JWT token
        const token = jwt.sign({ userId: userData[0].id }, JSONWEBTOKEN_KEY, { expiresIn: '1h' });
        
        //getting save dairy data
        const SAVE_SQL = "SELECT * FROM user_savedata WHERE user_id=? ORDER BY created_at DESC LIMIT 1"
        const SAVE_Result = await db.query(SAVE_SQL, [userData[0].id]);
       
        var DiaryData = [];
        if(SAVE_Result.length){
          DiaryData = SAVE_Result.diarydata;
        }

        res.status(200).send({ 
          status: true, 
          result: { user: userData[0], token: token, saveDairy:DiaryData }, 
          errors: "" 
        }); 

    }

  } catch (error) {
    res.status(500).send({ status: false, result: "", errors: " Error: "+error, errorData: error });
  }
}

 //  email verification 
exports.apiEmailVerify = async (req, res) => {
    //validate request
    if (!req.body) {
      res.status(400).send({
        status: false,
        result: "",
        errors: "Request parameters can not be empty!",
      });
    }
    
    const token = req.params.token;
  
    try {
      //check the email id  is exists in user table or not
      const sql = 'SELECT * FROM `users` WHERE email_verify_code=?';
      var user = await db.query(sql, [token]);
      if(user.length > 0)
      {
        const currentDate = new Date();
        const token_sql = "UPDATE `users` SET email_verify_code=?, email_verified_at=? WHERE id=?";
        const result = await db.query(token_sql, ['',currentDate, user[0].id]);

        user = await updateImagesPath(user);
        if(result.affectedRows>0){
          res.status(200).send({ 
            status: true, 
            result: { user: user, "message": "Email verified successfully" }, 
            errors: "" 
          });
        }else{
          res.status(200).send({status: false, result: "", errors: "Sorry. token is expired" });
        }
        

      }else{
          res.status(200).send({status: false, result: "", errors: "Sorry. Invalid verification token." });
      }
  
    } catch (error) {
      res.status(500).send({status: false, result: "", errors: 'Error fetching data:'+error });
    }
  
};
  

// Get profile
exports.apiProfile = async (req, res) => {
  //validate request
  if (!req.body) {
    res.status(400).send({
      status: false,
      result: "",
      errors: "Request parameters can not be empty!",
    });
  }

  user_id = req.user.userId;

  try {
    //check the email id  is exists in user table or not
    const sql = 'SELECT * FROM `users` WHERE id=?';
    var user = await db.query(sql, [user_id]);
    if(user.length > 0)
    {

      user = await updateImagesPath(user);
      res.status(200).send({ 
        status: true, 
        result: { user: user }, 
        errors: "" 
      });
    }else{
        res.status(200).send({status: false, result: "", errors: "Not found user with id " + id });
    }
  }catch (error) {
    res.status(500).send({ status: false, result: "", errors:'Error fetching data:'+error });
  }

}

// Update profile
exports.apiProfileUpdate = async (req, res) => {
    //validate request
    if (!req.body) {
      res.status(400).send({
        status: false,
        result: "",
        errors: "Request parameters can not be empty!",
      });
    }
    
    // Handle multer error specifically for incorrect image type
    if (req.fileValidationError) {
      return res.status(400).send({status: false, result: "", errors: req.fileValidationError.message });
    }
  
    const user_id = req.user.userId;
  
    const { first_name, last_name, email, phone, gender, about, latitude, longitude } = req.body;
  
    try {
      //check the user  is exists in user table or not
      const sql = 'SELECT * FROM `users` WHERE id=?';
      const user = await db.query(sql, [user_id]);
      if(user.length > 0)
      {
        //check the email id  is exists in user table or not
        const sql = 'SELECT * FROM `users` WHERE email=? AND id!=?';
        const user2 = await db.query(sql, [email, user_id]);
        if(user2.length > 0)
        {
            res.status(200).send({status: false, result: "", errors: "Email is already exists. please try another Email." });  
        }else{
            var profile_img = user[0].profile_img;
            var banner_img = user[0].banner;
            
            if(req.files.profile_image){
                // Delete the old profile image
                if (profile_img) {
                  const oldProfileImagePath = path.join(__dirname,'../../public/', profile_img);
                  //await fs.access(oldProfileImagePath); // Check if the file exists
                 // await fs.unlink(oldProfileImagePath);
                }
                profile_img = '/uploads/users/' + req.files.profile_image[0].filename;
            }
          

            // Update data into the user table
            const sql = 'UPDATE `users` SET first_name=?, last_name=?, email=?, phone=?, gender=?, about=?, latitude=?, longitude=?, profile_img=?, banner=? WHERE id=?';
            const edit_results = await db.query(sql, [first_name, last_name, email, phone, gender, about, latitude, longitude, profile_img, banner_img, user_id]);
            
            const updated_sql = 'SELECT * FROM `users` WHERE id=?';
            var updated_user = await db.query(updated_sql, [user_id]);

            updated_user = await updateImagesPath(updated_user);
            
            if (edit_results.affectedRows > 0) {
                res.status(200).send({ 
                    status: true, 
                    result: { user: updated_user }, 
                    errors: "" 
                });

            } else {
                res.status(200).send({status: false, result: "", errors: "Profile record has not updated" });
            }
        }
      }else{
        res.status(200).send({status: false, result: "", errors: "Sorry unable to update profile." });  
      }
  
    } catch (error) {
      res.status(404).send({status: false, result: "", errors: 'Error fetching data:'+error });
    }
  
  };

// Update a new idetified user by user id
exports.apiChangePassword = async (req, res) => {
    //validate request
    if (!req.body) {
      res.status(400).send({
        status: false,
        result: "",
        errors: "Request parameters can not be empty!",
      });
    }
    
    const { current_password, new_password, confirm_password } = req.body;
  
    const user_id = req.user.userId;
  
    try {
      //check the email id  is exists in user table or not
      const sql = 'SELECT * FROM `users` WHERE id=?';
      const user = await db.query(sql, [user_id]);
      
      if(user.length > 0)
      {
  
            hashedPassword = crypto.encrypt(current_password);
            if(hashedPassword == user[0].password)
            {
              if(new_password==confirm_password)
              {
                newHashedPassword = crypto.encrypt(new_password);
                // Update data into the user table
                const sql = 'UPDATE `users` SET password=? WHERE id=?';
                const edit_results = await db.query(sql, [newHashedPassword,  user_id]);
                if (edit_results.affectedRows > 0) {
                    res.status(200).send({ 
                      status: true, 
                      result: "Password has been updated successfully", 
                      errors: "" 
                    });
  
                } else {
                  res.status(200).send({status: false, result: "", errors: "Password has not updated" });
                }
              }else{
                  res.status(200).send({status: false, result: "", errors: "Both new Passwords are not matched" });
              }
   
            }else{
              res.status(200).send({status: false, result: "", errors: "Current password is not matched" });
            }
            
      }else{
          res.status(200).send({status: false, result: "", errors: "Sorry. Cannot updated with id "+user_id+". Maybe user_id is wrong" });
      }
  
    } catch (error) {
      res.status(404).send({status: false, result: "", errors: 'Error fetching data:'+error });
    }
  
  };

// send otp for password change  to user
exports.apiForgotPassword = async (req, res) => {
    //validate request
    if (!req.body) {
      res.status(400).send({
        status: false,
        result: "",
        errors: "Request parameters can not be empty!",
      });
    }
    
    const { email } = req.body;
  
    try {
      //check the email id  is exists in user table or not
      const sql = 'SELECT * FROM `users` WHERE email=?';
      const user = await db.query(sql, [email]);
      
      if(user.length > 0)
      {
          //const verificationToken = crypto.getOTP(6);
          const verificationToken = generateRandomPassword(10);
          const verificationLink = `${process.env.FRONTEND_URL}/change-password/${verificationToken}`;

          const currentDate = new Date();
          const twoDaysAfter = new Date(currentDate);
          twoDaysAfter.setDate(currentDate.getDate() + 2);
          const otp_type = 'change-password';

          // insert data from the user table
          const insert_sql = "INSERT INTO `user_verification_codes` SET user_id=?, otp=?, type=?, expire_at=?";
          const result2 = await db.query(insert_sql, [user[0].id, verificationToken, otp_type, twoDaysAfter]);

          const mailOptions = {
            from: process.env.SMTP_FROM_EMAIL,
            to: user[0].email,
            subject: 'Password Reset OTP',
            html: `
            <h1>Password Reset OTP</h1>
            <h3>Dear ${user[0].first_name} ${user[0].last_name}</h3>
            <p>Reset password link is given below:<br><p> 
            <p><strong><a href="${verificationLink}">${verificationLink}</a></strong></p>
            <p>If you didn't request for change password, you can ignore this email.</p>
            `,
        };
        //console.log(mailOptions);
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error);
                res.status(500).send('Error sending email');
            } else {
                console.log('Email sent: ' + info.response);   
                res.status(200).send({ 
                  status: true, 
                  result: "Password reset email sent to your email address", 
                  errors: "",
                  verificationLink: verificationLink
                });
            }
        });
        
        /*res.status(200).send({ 
          status: true, 
          result: "Password reset email sent to your email address", 
          errors: "",
          verificationLink: verificationLink
        });*/

      }else{
          res.status(200).send({status: false, result: "", errors: "Sorry. "+email+" not exists in our records" });
      }
  
    } catch (error) {
      res.status(404).send({status: false, result: "", errors: 'Error fetching data:'+error });
    }
  
};


// checking password code and then send to change password form
exports.apiSendPasswordEmail = async (req, res) => {
    //validate request
    if (!req.body) {
      res.status(400).send({
        status: false,
        result: "",
        errors: "Request parameters can not be empty!",
      });
    }
    
    const { password_token } = req.body;
  
    try {
      //check the email id  is exists in user table or not
      const sql = "SELECT * FROM `user_verification_codes` WHERE otp=? AND type='change-password'";
      const result = await db.query(sql, [password_token]); 
      if(result.length > 0)
      {
        //delete otp
        //const del_sql = "DELETE FROM `user_verification_codes` WHERE id=?";
       // const del_result = await db.query(del_sql, [result[0].id]); 

        const currentDate = new Date();
        if(result[0].expire_at>currentDate){

          res.status(200).send({ 
            status: true, 
            result: {user_id: result[0].user_id, message: "Token is valid"}, 
            errors: "" 
          });

        }else{
          res.status(200).send({status: false, result: "", errors: "Sorry. token is expired." });
        }

      }else{
          res.status(200).send({status: false, result: "", errors: "Sorry. token is invalid." });
      }
  
    } catch (error) {
      res.status(404).send({status: false, result: "", errors: 'Error fetching data:'+error });
    }
  
};

// update password
exports.apiUpdatePassword = async (req, res) => {
    //validate request
    if (!req.body) {
      res.status(400).send({
        status: false,
        result: "",
        errors: "Request parameters can not be empty!",
      });
    }
    
    const {user_id,  new_password, confirm_password } = req.body;
  
    try {
      //check the email id  is exists in user table or not
      const sql = 'SELECT * FROM `users` WHERE id=?';
      const user = await db.query(sql, [user_id]);
      
      if(user.length > 0)
      {
        
        if(new_password==confirm_password)
        {
          newHashedPassword = crypto.encrypt(new_password);
          // Update data into the user table
          const sql = 'UPDATE `users` SET password=? WHERE id=?';
          const edit_results = await db.query(sql, [newHashedPassword,  user_id]);
          if (edit_results.affectedRows > 0) {
              res.status(200).send({ 
                status: true, 
                result: "Password has been changed successfully", 
                errors: "" 
              });

          } else {
            res.status(200).send({status: false, result: "", errors: "Sorry. Unable to change password. <br>Please contact to administrator." });
          }
        }else{
            res.status(200).send({status: false, result: "", errors: "Both new Passwords are not matched" });
        }
   
      }else{
          res.status(404).send({status: false, result: "", errors: "Sorry. this user id is not exists." });
      }
  
    } catch (error) {
      res.status(404).send({status: false, result: "", errors: 'Error fetching data:'+error });
    }
  
};

const addContactActiveCampaign = (user)=>{
  const ACTIVECAMPAIGN_URL = process.env.ACTIVECAMPAIGN_URL;
  const ACTIVECAMPAIGN_TOKEN = process.env.ACTIVECAMPAIGN_TOKEN;
  const LISTID = process.env.ACTIVECAMPAIGN_LISTID2;
  const ACCOUNT_NAME = process.env.ACTIVECAMPAIGN_ACCOUNT_NAME;
  
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers':'Origin, X-Requested-With, Content-Type, Accept',
    'Content-Type': 'application/x-www-form-urlencoded', // Example header
    'API-TOKEN': `${ACTIVECAMPAIGN_TOKEN}`, // Example authorization header
  };
  const postData = new URLSearchParams();
  postData.append('api_action', 'contact_add');
  postData.append('api_output', 'json');
  postData.append('email', user.email);
  postData.append('first_name', user.first_name || '');
  postData.append('last_name', user.last_name || '');
  postData.append('phone', user.phone || '');
  postData.append('customer_acct_name', ACCOUNT_NAME);
  postData.append(`p[${LISTID}]`, LISTID);
  postData.append(`status[${LISTID}]`, 1);
  //postData.append(`instantresponders[${LISTID}]`, headers,LISTID);

  //console.log("ACTIVECAMPAIGN request=>", postData);

  axios.post(
    `${ACTIVECAMPAIGN_URL}/admin/api.php`, postData,{ headers }
  ).then(response => {
    console.log("ACTIVECAMPAIGN response=>", response.data);
    
    
   
  }).catch(error => {
    console.error('Error fetching ACTIVECAMPAIGN response data:', error);
    
  }); 
}

  