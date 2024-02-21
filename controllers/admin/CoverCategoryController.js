const db = require('../../database/db');
require("dotenv").config();
const path = require('path');
const fs = require('fs/promises');
const baseUrl = process.env.BASEURL;

exports.getAllCoverCategories = async (req, res) => {
    var page = req.query.page || 1;
    var perPage = 20;
    var offset = (page-1)*perPage;
 
    try {
      const sqlCount = 'SELECT COUNT(*) AS totalCategories FROM `cover_categories`';
      const [countRows] = await db.query(sqlCount);
      const totalCategories = countRows.totalCategories;

     
      const sql = 'SELECT * FROM `cover_categories` LIMIT ? OFFSET ?';
      const categories = await db.query(sql, [perPage, offset]);
    
      res.render("CoverCategory/index", {
        title: "Categories",
        categories: categories,
        baseUrl: baseUrl,
        paginationUrl:"categories",
        currentPage: page,
        totalPages: Math.ceil(totalCategories/ perPage),
        message: req.flash("message"),
        error: req.flash("error"),
      });

    } catch (error) {
      console.error('Error fetching data:', error);
      res.redirect("back");
    }
   
  };
  
  exports.addCoverCategory = async (req, res) => {
    res.render("CoverCategory/add", {
      title: "Add Cover Category",
      message: req.flash("message"),
      error: req.flash("error"),
    });
  };
  
  exports.insertCoverCategory = async (req, res) => {
    
    const { title } = req.body;
    const status = 1; 

    try {
      //check the email id  is exists in cover_categories table or not
      const sql = 'SELECT * FROM `cover_categories` WHERE title=?';
      const category = await db.query(sql, [title]);
      if(category.length === 0)
      {
        // insert data from the cover_categories table
        const sql = "INSERT INTO `cover_categories` SET title=?, status='?'";
        const results = await db.query(sql, [title, status]);

        if (results.insertId > 0) {
            console.log('Category inserted:', results.insertId);
            req.flash("message", "Cover category has been added successfully");
            res.redirect("/admin/cover/categories");
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
  
  exports.editCoverCategory = async (req, res) => {

    var category_id = req.params.id;
    
    try {
      //check the email id  is exists in cover_categories table or not
      const sql = 'SELECT * FROM `cover_categories` WHERE id = ?';
      const category = await db.query(sql, [category_id]);
      if(category.length > 0)
      {

        res.render("CoverCategory/edit", {
          title: "Edit Cover Category",
          category: category[0],
          baseUrl: baseUrl,
          message: req.flash("message"),
          error: req.flash("error"),
        });

      }else{
          req.flash("error", "Sorry. No category records exists!");
          res.redirect("/admin/cover/categories");
      }

    } catch (error) {
      console.log('Error fetching data:', error);
      res.redirect("back");
    }

  
  };
  
  exports.updateCoverCategory = async (req, res) => {

    const { id, title } = req.body;

    try {
      //check the email id  is exists in cover_categories table or not
      const sql = 'SELECT * FROM `cover_categories` WHERE id=?';
      const category = await db.query(sql, [id]);
      
      if(category.length > 0)
      {

        // Update data into the cover_categories table
        const sql = 'UPDATE `cover_categories` SET title=? WHERE id=?';
        const edit_results = await db.query(sql, [title,  id]);
       
        if (edit_results.affectedRows > 0) {
            console.log('Category affected:', edit_results.affectedRows);
            req.flash("message", "Cover category has been updated successfully");
            res.redirect("back");
        } else {
          console.log(edit_results);
          req.flash("error", "Cover category record has not updated.");
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
  
  exports.deleteCoverCategory = async (req, res) => {
    var id = req.params.id;
    
    try {
      //check the email id  is exists in cover_categories table or not
      const sql = 'SELECT * FROM `cover_categories` WHERE id = ?';
      const category = await db.query(sql, [id]);
      if(category.length > 0)
      {

        // Delete data from the cover_categories table
        const sql = 'DELETE FROM `cover_categories` WHERE id=?';
        const edit_results = await db.query(sql, [id]);
       
        if (edit_results.affectedRows > 0) {
          req.flash("message", "Cover category has been deleted successfully.");
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
      req.flash("error", "Oops! Could not delete cover category.");
      res.redirect("back");
    }
    
  }
  
  exports.statusCoverCategory = async (req, res) => {
    var id = req.params.id;
    var status = req.params.status;

    try {
      //check the email id  is exists in cover_categories table or not
      const sql = 'SELECT * FROM `cover_categories` WHERE id = ?';
      const category = await db.query(sql, [id]);
      if(category.length > 0)
      {
        
        // update status in the cover_categories table
        const sql = "UPDATE `cover_categories` SET status=?  WHERE id=?";
        const status_results = await db.query(sql, [status, id]);
    
        if (status_results.affectedRows > 0) {
          req.flash("message", "Cover category status has been updated successfully.");
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

  