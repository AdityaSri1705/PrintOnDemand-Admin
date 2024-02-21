const db = require('../../database/db');
require("dotenv").config();
const path = require('path');
const fs = require('fs/promises');
const baseUrl = process.env.BASEURL;
const typeList = ['Reflection', 'Habits', 'Fitness-and-Food', 'Work', 'Family', 'Vision-and-Goals', 'Other']; 

exports.getAllAddins = async (req, res) => {
    var page = req.query.page || 1;
    var perPage = 20;
    var offset = (page-1)*perPage;
    const type_filter =  req.query.type_filter || 'Reflection';

    var cons = "";
    if(type_filter!=""){
      cons = " WHERE type='"+type_filter+"'";
    }


    try {
      
      const sqlCount = `SELECT COUNT(*) AS totalAddins FROM addins_templates  ${cons}`;
      const [countRows] = await db.query(sqlCount);
      const totalAddins = countRows.totalAddins;

      const sql = `SELECT * FROM addins_templates ${cons}  LIMIT ? OFFSET ?`;
      const addins = await db.query(sql, [perPage, offset]);
  
      res.render("AddinsTemplate/index", {
        title: "Addins Templates",
        addins: addins,
        typeList: typeList,
        type_filter: type_filter,
        baseUrl: baseUrl,
        paginationUrl:"addins",
        currentPage: page,
        totalPages: Math.ceil(totalAddins/ perPage),
        message: req.flash("message"),
        error: req.flash("error"),
      });

    } catch (error) {
      console.error('Error fetching data:', error);
      res.redirect("back");
    }
   
  };
  
  exports.addAddin = async (req, res) => {

    const type_filter =  req.query.type_filter || 13;

    res.render("AddinsTemplate/add", {
      title: "Add Addins Template",
      typeList: typeList,
      type_filter: type_filter,
      message: req.flash("message"),
      error: req.flash("error"),
    });
  };
  
  exports.insertAddin = async (req, res) => {
    
    const { addin_type, title } = req.body;
    const status = 1; 
    const isDefault = req.body.isDefault | 0;

    var image1 = "";
    var image2 = "";
    var print_image1 = "";
    var print_image2 = "";

    if(req.files.image1){
      image1 = '/uploads/addins/' + req.files.image1[0].filename;
    }
    if(req.files.image2){
      image2 = '/uploads/addins/' + req.files.image2[0].filename;
    }
    if(req.files.print_image1){
      print_image1 = '/uploads/addins/print/' + req.files.print_image1[0].filename;
    }
    if(req.files.print_image2){
      print_image2 = '/uploads/addins/print/' + req.files.print_image2[0].filename;
    }
    
    try {
      //check the email id  is exists in addins_templates table or not
      const sql = 'SELECT * FROM `addins_templates` WHERE title=?';
      const addin = await db.query(sql, [title]);
      if(addin.length === 0)
      {
        // insert data from the addins_templates table
        const sql = "INSERT INTO `addins_templates` SET type=?, title=?, image=?, image2=?, print_image=?, print_image2=?, isDefault=?, status='?'";
        const results = await db.query(sql, [addin_type, title, image1, image2, print_image1, print_image2, isDefault, status]);

        if (results.insertId > 0) {
            console.log('Addins inserted:', results.insertId);
            req.flash("message", "Addins template has been added successfully");
            res.redirect("/admin/addins/?type_filter="+addin_type);
        } else {
          req.flash("error", 'Error fetching data:', error);
          res.redirect("back");
      
        }
      }else{
          req.flash("error", "Sorry. This title is already exists!");
          res.redirect("back");
      }

    } catch (error) {
      req.flash("error", 'Error fetching data:', error);
      console.log('Error fetching data:', error);
      res.redirect("back");
    }
  
    
  };
  
  exports.editAddin = async (req, res) => {

    var addin_id = req.params.id;
    
    try {

      //check the id  is exists in addins_templates table or not
      const sql = 'SELECT * FROM `addins_templates` WHERE id = ?';
      const addin = await db.query(sql, [addin_id]);
      if(addin.length > 0)
      {

        res.render("AddinsTemplate/edit", {
          title: "Edit Addins",
          addin: addin[0],
          typeList: typeList,
          baseUrl: baseUrl,
          message: req.flash("message"),
          error: req.flash("error"),
        });

      }else{
          req.flash("error", "Sorry. No addin tempalte records exists!");
          res.redirect("/admin/addins/?type_filter="+typeList[0]);
      }

    } catch (error) {
      console.log('Error fetching data:', error);
      res.redirect("back");
    }

  
  };
  
  exports.updateAddin = async (req, res) => {

    const { id, addin_type, title } = req.body;
    const isDefault = req.body.isDefault | 0;

    try {
      //check the id  is exists in addins_templates table or not
      const sql = 'SELECT * FROM `addins_templates` WHERE id=?';
      const addin = await db.query(sql, [id]);
      
      if(addin.length > 0)
      {

        var image1 = addin[0].image;
        var image2 = addin[0].image2;
        var print_image1 = addin[0].print_image;
        var print_image2 = addin[0].print_image2;
        if(req.files.image1){
          // Delete the old image 1
          await delete_image(image1);
          image1 = '/uploads/addins/' + req.files.image1[0].filename;
        }

        if(req.files.image2){
          // Delete the old image 2
          await delete_image(image2);
          image2 = '/uploads/addins/' + req.files.image2[0].filename;
        }

        if(req.files.print_image1){
          // Delete the old print_image
          await delete_image(print_image1);
          print_image1 = '/uploads/addins/print/' + req.files.print_image1[0].filename;
        }

        if(req.files.print_image2){
          // Delete the old print_image2 
          await delete_image(print_image2);
          print_image2 = '/uploads/addins/print/' + req.files.print_image2[0].filename;
        }

        // Update data into the addins_templates table
        const sql = 'UPDATE `addins_templates` SET type=?, title=?, image=?, image2=?, print_image=?, print_image2=?, isDefault=? WHERE id=?';
        const edit_results = await db.query(sql, [addin_type, title, image1, image2, print_image1, print_image2, isDefault, id]);
       
        if (edit_results.affectedRows > 0) {
            console.log('Addins affected:', edit_results.affectedRows);
            req.flash("message", "Addins template has been updated successfully");
            res.redirect("back");
        } else {
          console.log(edit_results);
          req.flash("error", "Addins template record has not updated.");
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
  
  exports.deleteAddin = async (req, res) => {
    var id = req.params.id;
    
    try {
      //check the email id  is exists in addins_templates table or not
      const sql = 'SELECT * FROM `addins_templates` WHERE id = ?';
      const addin = await db.query(sql, [id]);
      if(addin.length > 0)
      {
        var image1 = addin[0].image;
        var image2 = addin[0].image2;
        var print_image1 = addin[0].print_image;
        var print_image2 = addin[0].print_image2;

        // Delete the old image
        if (image1) {
          await delete_image(image1);
        }
        // Delete the old image2
        if (image2) {
          await delete_image(image2);
        }
        // Delete the old print_image
        if (print_image1) {
          await delete_image(print_image1);
        }
        // Delete the old print_image2
        if (print_image2) {
          await delete_image(print_image2);
        }

        // Delete data from the addins_templates table
        const sql = 'DELETE FROM `addins_templates` WHERE id=?';
        const edit_results = await db.query(sql, [id]);
       
        if (edit_results.affectedRows > 0) {
          req.flash("message", "Addins template has been deleted successfully.");
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
      req.flash("error", "Oops! Could not delete addin.");
      res.redirect("back");
    }
    
  }
  
  exports.statusAddin = async (req, res) => {
    var id = req.params.id;
    var status = req.params.status;

    try {
      //check the email id  is exists in addins_templates table or not
      const sql = 'SELECT * FROM `addins_templates` WHERE id = ?';
      const addin = await db.query(sql, [id]);
      if(addin.length > 0)
      {
        
        // update status in the addins_templates table
        const sql = "UPDATE `addins_templates` SET status=?  WHERE id=?";
        const status_results = await db.query(sql, [status, id]);
    
        if (status_results.affectedRows > 0) {
          req.flash("message", "Addins template status has been updated successfully.");
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

  exports.deleteAddinImage = async (req, res) => {
    var id = req.params.id;
    var type = req.params.type;
    
    try {
      //check the id is exists in addins_templates table or not
      const sql = 'SELECT * FROM `addins_templates` WHERE id = ?';
      const addin = await db.query(sql, [id]);
      if(addin.length > 0)
      {

        var col="";
        var title="";
        if(type=="image")
        {
          await delete_image(addin[0].image);
          col="image";
          title="Left image";
        }else if(type=="image2"){
          await delete_image(addin[0].image2);
          col="image2";
          title="Right image";
        }else if(type=="print_image"){
          await delete_image(addin[0].print_image);
          col="print_image";
          title="Print left image";
        }else if(type=="print_image2"){
          await delete_image(addin[0].print_image2);
          col="print_image2";
          title="Print right image";
        }

        // Delete data from the addins_templates table
        const sql = `UPDATE addins_templates SET ${col}="" WHERE id=?`;
        const edit_results = await db.query(sql, [id]);
       
        if (edit_results.affectedRows > 0) {
          req.flash("message", `${title} has been deleted succesfully.`);
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
      req.flash("error", "Oops! Could not delete addin template image.");
      res.redirect("back");
    }
    
  }

  const delete_image = async(imgurl)=>{
    if (imgurl) {
      const oldImagePath = path.join(__dirname, '../../public/', imgurl);
      try {
        await fs.access(oldImagePath); // Check if the file exists
        await fs.unlink(oldImagePath); // Delete the file
      } catch (err) {
        console.error('Error deleting old image:', err);
      }
    }
  }