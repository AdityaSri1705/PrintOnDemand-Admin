const db = require('../../database/db');
const crypto = require('../../services/crypto');
require("dotenv").config();
const path = require('path');
const fs = require('fs/promises');
const baseUrl = process.env.BASEURL;

exports.getAllUsers = async (req, res) => {
    var page = req.query.page || 1;
    var perPage = 20;
    var offset = (page-1)*perPage;
 
    try {
      const sqlCount = 'SELECT COUNT(*) AS totalUsers FROM `users`';
      const [countRows] = await db.query(sqlCount);
      const totalUsers = countRows.totalUsers;

      //check the email id  is exists in user table or not
      const sql = 'SELECT * FROM `users` ORDER BY id DESC LIMIT ? OFFSET ?';
      const users = await db.query(sql, [perPage, offset]);
     
      res.render("Users/index", {
        title: "Users",
        users: users,
        baseUrl: baseUrl,
        paginationUrl:"users",
        currentPage: page,
        totalPages: Math.ceil(totalUsers/ perPage),
        message: req.flash("message"),
        error: req.flash("error"),
      });

    } catch (error) {
      console.error('Error fetching data:', error);
      res.redirect("back");
    }
   
  };
  
  exports.addUser = async (req, res) => {
    res.render("Users/add", {
      title: "Add User",
      message: req.flash("message"),
      error: req.flash("error"),
    });
  };
  
  exports.insertUser = async (req, res) => {
    
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
      const user = await db.query(sql, [email]);
      if(user.length === 0)
      {
        // insert data from the user table
        const sql = "INSERT INTO `users` SET first_name=?, last_name=?, email=?, password=?, phone=?, gender=?, about=?, profile_img=?, banner=?, latitude=?, longitude=?, status='?'";
        const results = await db.query(sql, [first_name, last_name, email, hashedPassword, phone, gender, about, profile_img, banner_img, latitude, longitude, status]);

        if (results.insertId > 0) {
            console.log('User inserted:', results.insertId);
            req.flash("message", "User registered successfully");
            res.redirect("/admin/users");
        } else {
          req.flash("error", 'Error fetching data:', error);
          res.redirect("back");
      
        }
      }else{
          req.flash("error", "Sorry. This email is not exists!");
          res.redirect("back");
      }

    } catch (error) {
      req.flash("error", 'Error fetching data:', error);
      console.log('Error fetching data:', error);
      res.redirect("back");
    }
  
    
  };
  
  exports.editUser = async (req, res) => {

    var user_id = req.params.id;
    
    try {
      //check the email id  is exists in user table or not
      const sql = 'SELECT * FROM `users` WHERE id = ?';
      const user = await db.query(sql, [user_id]);
      if(user.length > 0)
      {

        res.render("Users/edit", {
          title: "Edit User",
          user: user[0],
          baseUrl: baseUrl,
          message: req.flash("message"),
          error: req.flash("error"),
        });

      }else{
          req.flash("error", "Sorry. No user records exists!");
          res.redirect("/admin/users");
      }

    } catch (error) {
      console.log('Error fetching data:', error);
      res.redirect("back");
    }

  
  };
  
  exports.updateUser = async (req, res) => {
    
    const { id, first_name, last_name, email, phone, gender, about, latitude, longitude } = req.body;

    try {
      //check the email id  is exists in user table or not
      const sql = 'SELECT * FROM `users` WHERE id=?';
      const user = await db.query(sql, [id]);
      
      if(user.length > 0)
      {
       
        var profile_img = user[0].profile_img;
        var banner_img = user[0].banner;
        
      
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
        const sql = 'UPDATE `users` SET first_name=?, last_name=?, email=?, phone=?, gender=?, about=?, latitude=?, longitude=?, profile_img=?, banner=? WHERE id=?';
        const edit_results = await db.query(sql, [first_name, last_name, email, phone, gender, about, latitude, longitude, profile_img, banner_img, id]);
       
        if (edit_results.affectedRows > 0) {
            console.log('User affected:', edit_results.affectedRows);
            req.flash("message", "User has been updated successfully");
            res.redirect("back");
        } else {
          console.log(edit_results);
          req.flash("error", "User record has not updated");
          res.redirect("back");
  
        }
      }else{
          req.flash("error", "Sorry. Cannot updated with id ${id}. Maybe id is wrong");
          res.redirect("back");
      }

    } catch (error) {
      req.flash("error", 'Error fetching data:', error);
      console.log('Error fetching data:', error);
      res.redirect("back");
    }
  };
  
  exports.deleteUser = async (req, res) => {
    var id = req.params.id;
    
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
          req.flash("message", "User has been deleted succesfully.");
          res.redirect("back");
        }else{
          req.flash("error", `Sorry! Could not delete with id ${id}.`);
          res.redirect("back");
        }

      }else{
        req.flash("error", `Sorry! Could not delete with id ${id}. Maybe id is wrong`);
        res.redirect("back");
      }

    } catch (error) {
      console.log('Error fetching data:', error);
      req.flash("error", "Oops! Could not delete user.");
      res.redirect("back");
    }
    
  }
  
  exports.statusUser = async (req, res) => {
    var id = req.params.id;
    var status = req.params.status;

    try {
      //check the email id  is exists in user table or not
      const sql = 'SELECT * FROM `users` WHERE id = ?';
      const user = await db.query(sql, [id]);
      if(user.length > 0)
      {
        
        // update status in the user table
        const sql = "UPDATE `users` SET status=?  WHERE id=?";
        const status_results = await db.query(sql, [status, id]);
    
        if (status_results.affectedRows > 0) {
          req.flash("message", "User status has been updated succesfully.");
          res.redirect("back");
        }else{
          req.flash("error", `Sorry! Could not update status with id ${id}.`);
          res.redirect("back");
        }

      }else{
        req.flash("error", `Sorry! Could not update status with id ${id}. Maybe id is wrong`);
        res.redirect("back");
      }

    } catch (error) {
      console.log('Error fetching data:', error);
      req.flash("error", "Oops! Could not could update status.");
      res.redirect("back");
    }
    
  }
  exports.pendingUser = async (req, res) => {
    var id = req.params.id;

    var statusCode = 1;

    try {
      //check the email id  is exists in user table or not
      const sql = 'SELECT * FROM `users` WHERE id = ?';
      const user = await db.query(sql, [id]);
      if(user.length > 0)
      {
        
        // update status in the user table
        const sql = "UPDATE `users` SET status='?'  WHERE id=?";
        const status_results = await db.query(sql, [statusCode, id]);
    
        if (status_results.affectedRows > 0) {
          req.flash("message", "User  has been approved succesfully.");
          res.redirect("back");
        }else{
          req.flash("error", `Sorry! Could approved with id ${id}.`);
          res.redirect("back");
        }

      }else{
        req.flash("error", `Sorry! Could not update status with id ${id}. Maybe id is wrong`);
        res.redirect("back");
      }

    } catch (error) {
      console.log('Error fetching data:', error);
      req.flash("error", "Oops! Could not could update status.");
      res.redirect("back");
    }
    
  }

  exports.deleteUserImage = async (req, res) => {
    var id = req.params.id;
    var type = req.params.type;
    
    try {
      //check the id is exists in users table or not
      const sql = 'SELECT * FROM `users` WHERE id = ?';
      const user = await db.query(sql, [id]);
      if(user.length > 0)
      {
        if(type=="banner"){
          var banner_img = user[0].banner;

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
          const sql = 'UPDATE `users` SET banner="" WHERE id=?';
          const edit_results = await db.query(sql, [id]);

          if (edit_results.affectedRows > 0) {
            req.flash("message", "Banner image has been deleted succesfully.");
            res.redirect("back");
          }else{
            req.flash("error", `Sorry! Could not delete with id ${id}.`);
            res.redirect("back");
          }

        }else{
          var profile_img = user[0].profile_img;

          // Delete the old banner image
          if (profile_img) {
            const oldBannerImagePath = path.join(__dirname, '../../public/', profile_img);
            try {
              await fs.access(oldBannerImagePath); // Check if the file exists
              await fs.unlink(oldBannerImagePath); // Delete the file
            } catch (err) {
              console.error('Error deleting old image:', err);
            }
          }

          // Delete data from the user table
          const sql = 'UPDATE `users` SET profile_img="" WHERE id=?';
          const edit_results = await db.query(sql, [id]);

          if (edit_results.affectedRows > 0) {
            req.flash("message", "Profile image has been deleted succesfully.");
            res.redirect("back");
          }else{
            req.flash("error", `Sorry! Could not delete with id ${id}.`);
            res.redirect("back");
          }

        }
        
        

      }else{
        req.flash("error", `Sorry! Could not delete with id ${id}. Maybe id is wrong`);
        res.redirect("back");
      }

    } catch (error) {
      console.log('Error fetching data:', error);
      req.flash("error", "Oops! Could not delete banner image.");
      res.redirect("back");
    }
    
  }