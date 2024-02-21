const db = require('../../database/db');
const crypto = require('../../services/crypto');
require("dotenv").config();
const path = require('path');
const fs = require('fs/promises');
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

/* ------------ API ---------------------------*/


// create and save new user
exports.apiCreateUser = async (req, res) => {
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

  const { first_name, last_name, email, phone, gender, about, latitude, longitude } = req.body;
  const hashedPassword = crypto.encrypt(req.body.password);
  const status = 1; 
  
    var profile_img = "";
    var banner_img = "";
    
    if(req.files.profile_image){
      profile_img = '/uploads/users/' + req.files.profile_image[0].filename;
    }
    if(req.files.banner_image){
      banner_img ='/uploads/users/' + req.files.banner_image[0].filename;
    }

  try {
    //check the email id  is exists in user table or not
    const sql = 'SELECT * FROM `users` WHERE email=?';
    const results = await db.query(sql, [email]);
    if(results.length === 0)
    {
      // insert data from the user table
      const insert_sql = "INSERT INTO `users` SET first_name=?, last_name=?, email=?, password=?, phone=?, gender=?, about=?, profile_img=?, banner=?, latitude=?, longitude=?, status='?'";
      const result2 = await db.query(insert_sql, [first_name, last_name, email, hashedPassword, phone, gender, about, profile_img, banner_img, latitude, longitude, status]);


      const sql = 'SELECT * FROM `users` WHERE id=?';
      var user = await db.query(sql, [result2.insertId]);
      user = await updateImagesPath(user);
      if (result2.insertId > 0) {
          //console.log('User inserted:', result2.insertId);
          res.status(201).send({ 
            status: true, 
            result: { user: user }, 
            errors: "" 
          });

      } else {
        res.status(404).send({status: false, result: "", errors: "Error: "+error });
      }
    }else{
      res.status(404).send({ status: false, result: "", errors: "Sorry. This email is already exists!" });
    }

  } catch (error) {
    res.status(500).send({ status: false, result: "", errors:"Error: "+error });
  }
}

// retrieve and return all users
exports.apiAllUsers = async (req, res) => {
  //validate request
  if (!req.body) {
    res.status(400).send({
      status: false,
      result: "",
      errors: "Request parameters can not be empty!",
    });
  }

  try {
    //check the email id  is exists in user table or not
    const sql = 'SELECT * FROM `users`';
    var users = await db.query(sql);
    if(users.length > 0)
    {

      users = await updateImagesPath(users);
      res.status(200).send({ 
        status: true, 
        result: { users: users }, 
        errors: "" 
      });
    }else{
        res.status(404).send({status: false, result: "", errors: "Not found user" });
    }
  }catch (error) {
    res.status(500).send({ status: false, result: "", errors:'Error fetching data:'+error });
  }

}

// retrieve and return  retrive and return a single user
exports.apiFindUser = async (req, res) => {
    //validate request
    if (!req.body) {
      res.status(400).send({
        status: false,
        result: "",
        errors: "Request parameters can not be empty!",
      });
    }

    user_id = req.params.id;

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
          res.status(404).send({status: false, result: "", errors: "Not found user with id " + id });
      }
    }catch (error) {
      res.status(500).send({ status: false, result: "", errors:'Error fetching data:'+error });
    }

}

// retrieve and return all users by search
exports.apiUserBySearch = async (req, res) => {
  //validate request
  if (!req.body) {
    res.status(400).send({
      status: false,
      result: "",
      errors: "Request parameters can not be empty!",
    });
  }

  const { search_term } = req.body;

  try {
    //check the email id  is exists in user table or not
    const sql = 'SELECT * FROM `users` WHERE first_name=? OR last_name=? OR email=? OR phone=?';
    const users = await db.query(sql, [search_term, search_term, search_term, search_term]);
    if(users.length > 0)
    {

      users = await updateImagesPath(users);

      res.status(200).send({ 
        status: true, 
        result: { users: users }, 
        errors: "" 
      });
    }else{
        res.status(404).send({status: false, result: "", errors: "Not found user with " + search_term });
    }
  }catch (error) {
    res.status(500).send({ status: false, result: "", errors:'Error fetching data:'+error });
  }

}


// Update a new idetified user by user id
exports.apiUpdate = async (req, res) => {
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

  const user_id = req.params.id;

  const { first_name, last_name, email, phone, gender, about, latitude, longitude } = req.body;

  try {
    //check the email id  is exists in user table or not
    const sql = 'SELECT * FROM `users` WHERE id=?';
    const user = await db.query(sql, [user_id]);
    
    if(user.length > 0)
    {

      const sql = 'SELECT * FROM `users` WHERE email=? AND id!=?';
      const user2 = await db.query(sql, [email, user_id]);
      if(user2.length > 0)
      {
        res.status(404).send({status: false, result: "", errors: "Email is already exists. please try another Email." });  
      }else{
          var hashedPassword = user[0].password;
          var profile_img = user[0].profile_img;
          var banner_img = user[0].banner;
          
          if(req.body.password!=""){
            hashedPassword = crypto.encrypt(req.body.password);
          }
          if(req.files.profile_image){
            // Delete the old profile image
            if (profile_img) {
              const oldProfileImagePath = path.join(__dirname, '../../public/', profile_img);
              await fs.access(oldProfileImagePath); // Check if the file exists
              await fs.unlink(oldProfileImagePath);
            }
            profile_img = '/uploads/users/' + req.files.profile_image[0].filename;
          }
          if(req.files.banner_image){
            // Delete the old banner image
            if (banner_img) {
              const oldBannerImagePath = path.join(__dirname, '../../public/', banner_img);
              await fs.access(oldBannerImagePath); // Check if the file exists
              await fs.unlink(oldBannerImagePath);
            }

            banner_img ='/uploads/users/' + req.files.banner_image[0].filename;
          }

          // Update data into the user table
          const sql = 'UPDATE `users` SET first_name=?, last_name=?, email=?, password=?, phone=?, gender=?, about=?, latitude=?, longitude=?, profile_img=?, banner=? WHERE id=?';
          const edit_results = await db.query(sql, [first_name, last_name, email, hashedPassword, phone, gender, about, latitude, longitude, profile_img, banner_img, user_id]);
        
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
            res.status(404).send({status: false, result: "", errors: "User record has not updated" });
          }
      }
    }else{
        res.status(404).send({status: false, result: "", errors: "Sorry. Cannot updated with id ${user_id}. Maybe user_id is wrong" });
    }

  } catch (error) {
    res.status(404).send({status: false, result: "", errors: 'Error fetching data:'+error });
  }

};

// Delete a user with specified user id in the request
exports.apiDelete = async (req, res) => {
  //validate request
  if (!req.params) {
    res.status(400).send({
      status: false,
      result: "",
      errors: "Request parameters can not be empty!",
    });
  }

  const id = req.params.id;
  try {
    //check the email id  is exists in user table or not
    const sql = 'SELECT * FROM `users` WHERE id = ?';
    const user = await db.query(sql, [id]);
    if(user.length > 0)
    {

      var profile_img = user[0].profile_img;
      var banner_img = user[0].banner;

      // Delete the old profile image
      if (profile_img) {
        const oldProfileImagePath = path.join(__dirname, '../../public/', profile_img);
        try {
          await fs.access(oldProfileImagePath); // Check if the file exists
          await fs.unlink(oldProfileImagePath); // Delete the file
        } catch (err) {
          console.error('Error deleting old image:', err);
        }
      }

      // Delete the old banner image
      if (banner_img) {
        const oldBannerImagePath = path.join(__dirname, '../../public/', banner_img);
        try {
          await fs.access(oldBannerImagePath); // Check if the file exists
          await fs.unlink(oldBannerImagePath); // Delete the file
        } catch (err) {
          console.error('Error deleting old image:', err);
        }
      }

      // Delete data from the user table
      const sql = 'DELETE FROM `users` WHERE id=?';
      const edit_results = await db.query(sql, [id]);
     
      if (edit_results.affectedRows > 0) {
        res.status(200).send({
          status: true,
          result: { message: "User was deleted successfully!" },
          errors: "",
        });
      }else{
        res.status(404).send({
          status: false,
          result: "",
          errors: `Cannot Delete with id ${id}. Maybe id is wrong`,
        });
      }

    }else{
      res.status(404).send({
        status: false,
        result: "",
        errors: `Cannot Delete with id ${id}. Maybe id is wrong`,
      });
    }

  } catch (error) {
    res.status(500).send({
      status: false,
      result: "",
      errors: "Could not delete User with id=" + id,
    });
  }

}






  