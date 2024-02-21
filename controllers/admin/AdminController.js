const db = require('../../database/db');
const crypto = require('../../services/crypto');
require("dotenv").config();
const path = require('path');
const fs = require('fs/promises');
const baseUrl = process.env.BASEURL;

exports.getAllAdmins = async (req, res) => {
    var page = req.query.page || 1;
    var perPage = 20;
    var offset = (page-1)*perPage;
 
    try {
      const sqlCount = "SELECT COUNT(*) AS totalAdmins FROM `admins` WHERE role!='SuperAdmin'";
      const [countRows] = await db.query(sqlCount);
      const totalAdmins = countRows.totalAdmins;

      //check the email id  is exists in Admins table or not
      const sql = "SELECT * FROM `admins` WHERE role!='SuperAdmin' LIMIT ? OFFSET ?";
      const admins = await db.query(sql, [perPage, offset]);
    
      res.render("Admin/index", {
        title: "Admins",
        admins: admins,
        baseUrl: baseUrl,
        paginationUrl:"admins",
        currentPage: page,
        totalPages: Math.ceil(totalAdmins/ perPage),
        message: req.flash("message"),
        error: req.flash("error"),
      });

    } catch (error) {
      console.error('Error fetching data:', error);
      res.redirect("back");
    }
   
  };
  
  exports.addAdmin = async (req, res) => {
    res.render("Admin/add", {
      title: "Add Admin",
      message: req.flash("message"),
      error: req.flash("error"),
    });
  };
  
  exports.insertAdmin = async (req, res) => {
    
    const { name, email, gender, phone } = req.body;
    const role = 'Admin';
    const status = 1; 

    const hashedPassword = crypto.encrypt(req.body.password);

    var admin_image = "";
    if(req.files.admin_image){
        admin_image = '/uploads/admins/' + req.files.admin_image[0].filename;
    }
    
    try {
      //check the email id  is exists in admin table or not
      const sql = "SELECT * FROM `admins` WHERE email=?";
      const admin = await db.query(sql, [email]);
      if(admin.length === 0)
      {
        // insert data from the admin table
        const sql = "INSERT INTO `admins` SET role=?, name=?, email=?, password=?, gender=?, phone=?, image=?, status='?'";
        const results = await db.query(sql, [role, name, email, hashedPassword, gender, phone, admin_image, status]);

        if (results.insertId > 0) {
            console.log('Admin inserted:', results.insertId);
            req.flash("message", "Admin has been added successfully");
            res.redirect("/admin/admins");
        } else {
          req.flash("error", 'Error fetching data:', error);
          res.redirect("back");
      
        }
      }else{
          req.flash("error", "Sorry. This email is already exists!");
          res.redirect("back");
      }

    } catch (error) {
      req.flash("error", 'Error fetching data:', error);
      console.log('Error fetching data:', error);
      res.redirect("back");
    }
  
    
  };
  
  exports.editAdmin = async (req, res) => {

    var admin_id = req.params.id;
    
    try {
      //check the email id  is exists in admin table or not
      const sql = 'SELECT * FROM `admins` WHERE id = ?';
      const admin = await db.query(sql, [admin_id]);
      if(admin.length > 0)
      {

        res.render("Admin/edit", {
          title: "Edit Admin",
          admin: admin[0],
          baseUrl: baseUrl,
          message: req.flash("message"),
          error: req.flash("error"),
        });

      }else{
          req.flash("error", "Sorry. No admin records exists!");
          res.redirect("/admin/admins");
      }

    } catch (error) {
      console.log('Error fetching data:', error);
      res.redirect("back");
    }

  
  };
  
  exports.updateAdmin = async (req, res) => {

    const { id, name, email, gender, phone } = req.body;

    try {
      //check the email id  is exists in admin table or not
      const sql = 'SELECT * FROM `admins` WHERE id=?';
      const admin = await db.query(sql, [id]);
      
      if(admin.length > 0)
      {
        const sql2 = "SELECT * FROM `admins` WHERE email=? AND id!=?";
        const result = await db.query(sql2, [email, id]);
        if(result.length > 0)
        {
          req.flash("error", "Sorry. This email is already exists!");
          res.redirect("back");
        }else{

        
          var hashedPassword = admin[0].password;
          var admin_image = admin[0].image;

          if(req.body.password!=""){
            hashedPassword = crypto.encrypt(req.body.password);
        }

          if(req.files.admin_image){
            // Delete the old admin image
            if (admin_image) {
              const oldAdminImagePath = path.join(__dirname, '../../public/', admin_image);
              await fs.access(oldAdminImagePath); // Check if the file exists
              await fs.unlink(oldAdminImagePath);
            }
            admin_image = '/uploads/admins/' + req.files.admin_image[0].filename;
          }

          // Update data into the admin table
          const sql = 'UPDATE `admins` SET name=?, email=?, password=?, gender=?, phone=?, image=? WHERE id=?';
          const edit_results = await db.query(sql, [name, email, hashedPassword, gender, phone,  admin_image, id]);
        
          if (edit_results.affectedRows > 0) {
              console.log('Admin affected:', edit_results.affectedRows);
              req.flash("message", "Admin has been updated successfully");
              res.redirect("back");

          } else {
            console.log(edit_results);
            req.flash("error", "Admin record has not updated.");
            res.redirect("back");
    
          }
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
  
  exports.deleteAdmin = async (req, res) => {
    var id = req.params.id;
    
    try {
      //check the email id  is exists in admin table or not
      const sql = 'SELECT * FROM `admins` WHERE id = ?';
      const admin = await db.query(sql, [id]);
      if(admin.length > 0)
      {
        var admin_image = admin[0].image;

        // Delete the old admin image
        if (admin_image) {
          const oldAdminImagePath = path.join(__dirname, '../../public/', admin_image);
          try {
            await fs.access(oldAdminImagePath); // Check if the file exists
            await fs.unlink(oldAdminImagePath); // Delete the file
          } catch (err) {
            console.error('Error deleting old image:', err);
          }
        }

        // Delete data from the admin table
        const sql = 'DELETE FROM `admins` WHERE id=?';
        const edit_results = await db.query(sql, [id]);
       
        if (edit_results.affectedRows > 0) {
          req.flash("message", "Admin has been deleted succesfully.");
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
      req.flash("error", "Oops! Could not delete admin.");
      res.redirect("back");
    }
    
  }
  
  exports.statusAdmin = async (req, res) => {
    var id = req.params.id;
    var status = req.params.status;

    try {
      //check the email id  is exists in admin table or not
      const sql = 'SELECT * FROM `admins` WHERE id = ?';
      const admin = await db.query(sql, [id]);
      if(admin.length > 0)
      {
        
        // update status in the admin table
        const sql = "UPDATE `admins` SET status=? WHERE id=?";
        const status_results = await db.query(sql, [status, id]);
    
        if (status_results.affectedRows > 0) {
          req.flash("message", "Admin status has been updated succesfully.");
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

  exports.profileAdmin = async (req, res) => {
    //console.log(req.session.user);
    const admin_id = req.session.user.id;
    
    try {
      //check the email id  is exists in admin table or not
      const sql = 'SELECT * FROM `admins` WHERE id = ?';
      const admin = await db.query(sql, [admin_id]);
      res.render("Admin/profile", {
        title: "Profile",
        admin: admin[0],
        baseUrl: baseUrl,
        message: req.flash("message"),
        error: req.flash("error"),
      });

    } catch (error) {
      console.log('Error fetching data:', error);
      res.redirect("back");
    }

  
  };
  
  exports.updateProfileAdmin = async (req, res) => {
    
    const { name, email, gender, phone } = req.body;
    const admin_id = req.session.user.id;

    try {
      //check the email id  is exists in admin table or not
      const sql = 'SELECT * FROM `admins` WHERE id=?';
      const admin = await db.query(sql, [admin_id]);
      
      if(admin.length > 0)
      {
        var admin_image = admin[0].image;
        if(req.files.admin_image){
          // Delete the old admin image
          if (admin_image) {
            const oldAdminImagePath = path.join(__dirname, '../../public/', admin_image);
            await fs.access(oldAdminImagePath); // Check if the file exists
            await fs.unlink(oldAdminImagePath);
          }
          admin_image = '/uploads/admins/' + req.files.admin_image[0].filename;
        }

        // Update data into the admin table
        const sql = 'UPDATE `admins` SET name=?, email=?, gender=?, phone=?, image=? WHERE id=?';
        const edit_results = await db.query(sql, [name, email, gender, phone,  admin_image, admin_id]);
       
        if (edit_results.affectedRows > 0) {
            const sql2 = 'SELECT * FROM `admins` WHERE id = ?';
            const admin = await db.query(sql2, [admin_id]);
            admin[0].role = 'Admin';
            req.session.user = admin[0];

            console.log('Admin affected:', edit_results.affectedRows);
            req.flash("message", "Profile has been updated successfully");
            res.redirect("back");
        } else {
          console.log(edit_results);
          req.flash("error", "Profile record has not updated.");
          res.redirect("back");
  
        }
      }else{
          req.flash("error", "Sorry. Cannot updated with id ${id}. Maybe id is wrong");
          res.redirect("back");
      }

    } catch (error) {
      req.flash("error", 'Error fetching data:', error);
      res.redirect("back");
    }
  };

  exports.changePasswordAdmin = async (req, res) => {

    const admin_id = req.session.user.id; 
    //console.log(req.session);
    
    try {
      //check the email id  is exists in admin table or not
      const sql = 'SELECT * FROM `admins` WHERE id = ?';
      const admin = await db.query(sql, [admin_id]);
      res.render("Admin/change-password", {
        title: "Change Password",
        admin: admin[0],
        baseUrl: baseUrl,
        message: req.flash("message"),
        error: req.flash("error"),
      });

    } catch (error) {
      console.log('Error fetching data:', error);
      res.redirect("back");
    }

  };

  exports.updatePasswordAdmin = async (req, res) => {

    const { old_password, new_password, confirm_password } = req.body; 
    const admin_id = req.session.user.id;

    try {
      //check the email id  is exists in admin table or not
      const sql = 'SELECT * FROM `admins` WHERE id=?';
      const admin = await db.query(sql, [admin_id]);
      
      if(admin.length > 0)
      {
        const old_hashedPassword = crypto.encrypt(old_password);
        const new_hashedPassword = crypto.encrypt(new_password);
        const oldPassword = admin[0].password;
       
        if(old_hashedPassword!=oldPassword){
          req.flash("error", "Old Password is wrong.");
          res.redirect("back");
        }else if(new_password!=confirm_password){
          req.flash("error", "New passwords are not matched.");
          res.redirect("back");
        }else{

          // Update data into the admin table
          const sql = 'UPDATE `admins` SET password=? WHERE id=?';
          const edit_results = await db.query(sql, [new_hashedPassword, admin_id]);
        
          if (edit_results.affectedRows > 0) {
              req.flash("message", "Password has been updated successfully");
              res.redirect("back");
          } else {
            req.flash("error", "Password has not updated.");
            res.redirect("back");
    
          }

        }
      
        
      }else{
          req.flash("error", "Sorry. Cannot updated with id ${admin_id}. Maybe id is wrong");
         // res.redirect("back");
      }

    } catch (error) {
      req.flash("error", 'Error fetching data:', error);
      console.log('Error fetching data:', error);
      //res.redirect("back");
    }
  };

  exports.deleteAdminImage = async (req, res) => {
    var id = req.params.id;
    
    try {
      //check the id is exists in admins table or not
      const sql = 'SELECT * FROM `admins` WHERE id = ?';
      const admin = await db.query(sql, [id]);
      if(admin.length > 0)
      {

        var admin_img = admin[0].image;

        // Delete the old banner image
        if (admin_img) {
          const oldBannerImagePath = path.join(__dirname, '../../public/', admin_img);
          try {
            await fs.access(oldBannerImagePath); // Check if the file exists
            await fs.unlink(oldBannerImagePath); // Delete the file
          } catch (err) {
            console.error('Error deleting old image:', err);
          }
        }

        // Delete data from the admins table
        const sql = 'UPDATE `admins` SET image="" WHERE id=?';
        const edit_results = await db.query(sql, [id]);
       
        if (edit_results.affectedRows > 0) {
          req.flash("message", "Admin image has been deleted succesfully.");
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
      req.flash("error", "Oops! Could not delete banner image.");
      res.redirect("back");
    }
    
  }