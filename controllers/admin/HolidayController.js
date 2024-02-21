const db = require('../../database/db');
require("dotenv").config();
const path = require('path');
const fs = require('fs/promises');
const baseUrl = process.env.BASEURL;
const typeList = ['National-Holidays', 'Religious-Holidays']; 

exports.getAllHolidays = async (req, res) => {
    var page = req.query.page || 1;
    var perPage = 20;
    var offset = (page-1)*perPage;
    const type_filter =  req.query.type_filter || 'National-Holidays';

    var cons = "";
    if(type_filter!=""){
      cons = " WHERE holiday_type='"+type_filter+"'";
    }


    try {
      
      const sqlCount = `SELECT COUNT(*) AS totalHolidays FROM holidays  ${cons}`;
      const [countRows] = await db.query(sqlCount);
      const totalHolidays = countRows.totalHolidays;

      const sql = `SELECT * FROM holidays ${cons}  LIMIT ? OFFSET ?`;
      const holidays = await db.query(sql, [perPage, offset]);

      res.render("Holiday/index", {
        title: "Holidays",
        holidays: holidays,
        typeList: typeList,
        type_filter: type_filter,
        baseUrl: baseUrl,
        paginationUrl:"holiday",
        currentPage: page,
        totalPages: Math.ceil(totalHolidays/ perPage),
        message: req.flash("message"),
        error: req.flash("error"),
      });

    } catch (error) {
      console.error('Error fetching data:', error);
      res.redirect("back");
    }
   
  };
  
  exports.addHoliday = async (req, res) => {

    const type_filter =  req.query.type_filter || 13;

    res.render("Holiday/add", {
      title: "Add Holiday",
      typeList: typeList,
      type_filter: type_filter,
      message: req.flash("message"),
      error: req.flash("error"),
    });
  };
  
  exports.insertHoliday = async (req, res) => {
    
    const { holiday_type, title } = req.body;
    const status = 1; 

    try {
      //check the email id  is exists in holidays table or not
      const sql = 'SELECT * FROM `holidays` WHERE title=?';
      const addin = await db.query(sql, [title]);
      if(addin.length === 0)
      {
        // insert data from the addins_templates table
        const sql = "INSERT INTO `holidays` SET holiday_type=?, title=?, status='?'";
        const results = await db.query(sql, [holiday_type, title, status]);

        if (results.insertId > 0) {
            console.log('Holiday inserted:', results.insertId);
            req.flash("message", "Holiday has been added successfully");
            res.redirect("/admin/holidays/?type_filter="+holiday_type);
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
  
  exports.editHoliday = async (req, res) => {

    var id = req.params.id;
    
    try {

      //check the id  is exists in holidays table or not
      const sql = 'SELECT * FROM `holidays` WHERE id = ?';
      const holiday = await db.query(sql, [id]);
      if(holiday.length > 0)
      {

        res.render("Holiday/edit", {
          title: "Edit Holiday",
          holiday: holiday[0],
          typeList: typeList,
          baseUrl: baseUrl,
          message: req.flash("message"),
          error: req.flash("error"),
        });

      }else{
          req.flash("error", "Sorry. No holiday records exists!");
          res.redirect("/admin/holiday/?type_filter="+typeList[0]);
      }

    } catch (error) {
      console.log('Error fetching data:', error);
      res.redirect("back");
    }

  
  };
  
  exports.updateHoliday = async (req, res) => {

    const { id, holiday_type, title } = req.body;

    try {
      //check the id  is exists in holidays table or not
      const sql = 'SELECT * FROM `holidays` WHERE id=?';
      const holiday = await db.query(sql, [id]);
      console.log(id);
      if(holiday.length > 0)
      {
        // Update data into the holidays table
        const sql = 'UPDATE `holidays` SET holiday_type=?, title=? WHERE id=?';
        const edit_results = await db.query(sql, [holiday_type, title, id]);
       
        if (edit_results.affectedRows > 0) {
            console.log('Holiday affected:', edit_results.affectedRows);
            req.flash("message", "Holiday has been updated successfully");
            res.redirect("back");
        } else {
          console.log(edit_results);
          req.flash("error", "Holiday record has not updated.");
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
  
  exports.deleteHoliday = async (req, res) => {
    var id = req.params.id;
    
    try {
      //check the id  is exists in holidays table or not
      const sql = 'SELECT * FROM `holidays` WHERE id = ?';
      const holiday = await db.query(sql, [id]);
      if(holiday.length > 0)
      {

        // Delete data from the holidays table
        const sql = 'DELETE FROM `holidays` WHERE id=?';
        const edit_results = await db.query(sql, [id]);
       
        if (edit_results.affectedRows > 0) {
          req.flash("message", "Holiday has been deleted successfully.");
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
  
  exports.statusHoliday = async (req, res) => {
    var id = req.params.id;
    var status = req.params.status;

    try {
      //check the id  is exists in holidays table or not
      const sql = 'SELECT * FROM `holidays` WHERE id = ?';
      const holiday = await db.query(sql, [id]);
      if(holiday.length > 0)
      {
        
        // update status in the holidays table
        const sql = "UPDATE `holidays` SET status=?  WHERE id=?";
        const status_results = await db.query(sql, [status, id]);
    
        if (status_results.affectedRows > 0) {
          req.flash("message", "Holiday status has been updated successfully.");
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