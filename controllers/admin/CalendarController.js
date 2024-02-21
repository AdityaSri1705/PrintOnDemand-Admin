const db = require('../../database/db');
require("dotenv").config();
const path = require('path');
const fs = require('fs/promises');
const baseUrl = process.env.BASEURL;

exports.getAllCalendars = async (req, res) => {
    var page = req.query.page || 1;
    var perPage = 20;
    var offset = (page-1)*perPage;
    const layout_filter =  req.query.layout_filter || 13;

    var cons = "";
    if(layout_filter!=""){
      cons = " WHERE layout_id='"+layout_filter+"'";
    }


    try {
      
      const sqlCount = `SELECT COUNT(*) AS totalCalendars FROM calendar_templates  ${cons}`;
      const [countRows] = await db.query(sqlCount);
      const totalCalendars = countRows.totalCalendars;

      const sql = `SELECT c.*, l.title as layout_title FROM calendar_templates c LEFT JOIN layouts l ON c.layout_id=l.id  ${cons}  LIMIT ? OFFSET ?`;
      const calendars = await db.query(sql, [perPage, offset]);

      const layout_sql = `SELECT id, slug, title FROM layouts WHERE slug='CalendarView'`;
      const layoutList = await db.query(layout_sql);
    
      res.render("CalenderTemplate/index", {
        title: "Calendar Templates",
        calendars: calendars,
        layoutList: layoutList,
        layout_filter: layout_filter,
        baseUrl: baseUrl,
        paginationUrl:"calendars",
        currentPage: page,
        totalPages: Math.ceil(totalCalendars/ perPage),
        message: req.flash("message"),
        error: req.flash("error"),
      });

    } catch (error) {
      console.error('Error fetching data:', error);
      res.redirect("back");
    }
   
  };
  
  exports.addCalendar = async (req, res) => {

    const layout_filter =  req.query.layout_filter || 13;


    const layout_sql = `SELECT id, slug, title FROM layouts WHERE slug='CalendarView'`;
    const layoutList = await db.query(layout_sql);

    res.render("CalenderTemplate/add", {
      title: "Add Calendar Template",
      layoutList: layoutList,
      layout_filter: layout_filter,
      message: req.flash("message"),
      error: req.flash("error"),
    });
  };
  
  exports.insertCalendar = async (req, res) => {
    
    const { layout_id, title } = req.body;
    const status = 1; 
    const isDefault = req.body.isDefault | 0;

    var image1 = "";
    var image2 = "";
    var print_image1 ="";
    var print_image2 = "";

    if(req.files.image1){
      image1 = '/uploads/calendars/' + req.files.image1[0].filename;
    }
    if(req.files.image2){
      image2 = '/uploads/calendars/' + req.files.image2[0].filename;
    }
    if(req.files.print_image1){
      print_image1 = '/uploads/calendars/print/' + req.files.print_image1[0].filename;
    }
    if(req.files.print_image2){
      print_image2 = '/uploads/calendars/print/' + req.files.print_image2[0].filename;
    }
    
    try {
      //check the email id  is exists in calendar_templates table or not
      const sql = 'SELECT * FROM `calendar_templates` WHERE title=?';
      const calendar = await db.query(sql, [title]);
      if(calendar.length === 0)
      {
        // insert data from the calendar_templates table
        const sql = "INSERT INTO `calendar_templates` SET layout_id=?, title=?, image=?, image2=?, print_image=?, print_image2=?, isDefault=?, status='?'";
        const results = await db.query(sql, [layout_id, title, image1, image2, print_image1, print_image2, isDefault, status]);

        if (results.insertId > 0) {
            console.log('Calendar inserted:', results.insertId);
            req.flash("message", "Calendar template has been added successfully");
            res.redirect("/admin/calendar/?layout_filter="+layout_id);
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
  
  exports.editCalendar = async (req, res) => {

    var calendar_id = req.params.id;
    
    try {

      const layout_sql = `SELECT id, slug, title FROM layouts WHERE slug='CalendarView'`;
      const layoutList = await db.query(layout_sql);

      //check the id  is exists in calendar_templates table or not
      const sql = 'SELECT * FROM `calendar_templates` WHERE id = ?';
      const calendar = await db.query(sql, [calendar_id]);
      if(calendar.length > 0)
      {

        res.render("CalenderTemplate/edit", {
          title: "Edit Calendar",
          calendar: calendar[0],
          layoutList: layoutList,
          baseUrl: baseUrl,
          message: req.flash("message"),
          error: req.flash("error"),
        });

      }else{
          req.flash("error", "Sorry. No calendar tempalte records exists!");
          res.redirect("/admin/calendar/?layout_filter="+calendar[0].layout_id);
      }

    } catch (error) {
      console.log('Error fetching data:', error);
      res.redirect("back");
    }

  
  };
  
  exports.updateCalendar = async (req, res) => {

    const { id, layout_id, title } = req.body;
    const isDefault = req.body.isDefault | 0;
console.log(req.files)
    try {
      //check the id  is exists in calendar_templates table or not
      const sql = 'SELECT * FROM `calendar_templates` WHERE id=?';
      const calendar = await db.query(sql, [id]);
      
      if(calendar.length > 0)
      {

        var image1 = calendar[0].image || '';
        var image2 = calendar[0].image2 || '';
        var print_image1 = calendar[0].print_image1 || '';
        var print_image2 = calendar[0].print_image2 || '';

        if(req.files.image1){
          // Delete the old image
          await delete_image(image1);
          image1 = '/uploads/calendars/' + req.files.image1[0].filename;
        }
        
        if(req.files.image2){
          // Delete the old image2
          await delete_image(image2);
          image2 = '/uploads/calendars/' + req.files.image2[0].filename;
        }
      
        if(req.files.print_image1){
          // Delete the old print_image
          await delete_image(print_image1);
          print_image1 = '/uploads/calendars/print/' + req.files.print_image1[0].filename;
        }
  
        if(req.files.print_image2){
          // Delete the old print_image2
          await delete_image(print_image2);
          print_image2 = '/uploads/calendars/print/' + req.files.print_image2[0].filename;
        }


        // Update data into the calendar_templates table
        const sql = 'UPDATE `calendar_templates` SET layout_id=?, title=?, image=?, image2=?, print_image=?, print_image2=?, isDefault=? WHERE id=?';
        const edit_results = await db.query(sql, [layout_id, title, image1, image2, print_image1, print_image2, isDefault, id]);
       
        if (edit_results.affectedRows > 0) {
            console.log('Calendar affected:', edit_results.affectedRows);
            req.flash("message", "Calendar template has been updated successfully");
            res.redirect("back");
        } else {
          console.log(edit_results);
          req.flash("error", "Calendar template record has not updated.");
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
  
  exports.deleteCalendar = async (req, res) => {
    var id = req.params.id;
    
    try {
      //check the email id  is exists in calendar_templates table or not
      const sql = 'SELECT * FROM `calendar_templates` WHERE id = ?';
      const calendar = await db.query(sql, [id]);
      if(calendar.length > 0)
      {
        var image1 = calendar[0].image;
        var image2 = calendar[0].image2;
        var print_image1 = calendar[0].print_image;
        var print_image2 = calendar[0].print_image2;

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

        // Delete data from the calendar_templates table
        const sql = 'DELETE FROM `calendar_templates` WHERE id=?';
        const edit_results = await db.query(sql, [id]);
       
        if (edit_results.affectedRows > 0) {
          req.flash("message", "Calendar template has been deleted successfully.");
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
      req.flash("error", "Oops! Could not delete calendar.");
      res.redirect("back");
    }
    
  }
  
  exports.statusCalendar = async (req, res) => {
    var id = req.params.id;
    var status = req.params.status;

    try {
      //check the email id  is exists in calendar_templates table or not
      const sql = 'SELECT * FROM `calendar_templates` WHERE id = ?';
      const calendar = await db.query(sql, [id]);
      if(calendar.length > 0)
      {
        
        // update status in the calendar_templates table
        const sql = "UPDATE `calendar_templates` SET status=?  WHERE id=?";
        const status_results = await db.query(sql, [status, id]);
    
        if (status_results.affectedRows > 0) {
          req.flash("message", "Calendar template status has been updated successfully.");
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

  exports.deleteCalendarImage = async (req, res) => {
    var id = req.params.id;
    var type = req.params.type;
    try {
      //check the id is exists in calendar_templates table or not
      const sql = 'SELECT * FROM `calendar_templates` WHERE id = ?';
      const calendar = await db.query(sql, [id]);
      if(calendar.length > 0)
      {
        var col="";
        var title="";
        if(type=="image")
        {
          await delete_image(calendar[0].image);
          col="image";
          title="Left image";
        }else if(type=="image2"){
          await delete_image(calendar[0].image2);
          col="image2";
          title="Right image";
        }else if(type=="print_image"){
          await delete_image(calendar[0].print_image);
          col="print_image";
          title="Print left image";
        }else if(type=="print_image2"){
          await delete_image(calendar[0].print_image2);
          col="print_image2";
          title="Print right image";
        }

        // Delete data from the calendar_templates table
        const sql = `UPDATE calendar_templates SET ${col}="" WHERE id=?`;
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
      req.flash("error", "Oops! Could not delete calender template image.");
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