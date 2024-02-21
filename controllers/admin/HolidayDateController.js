const db = require('../../database/db');
require("dotenv").config();
const path = require('path');
const csv = require('csv-parser');
const fs = require('fs');
const baseUrl = process.env.BASEURL;

exports.getAllHolidayDates = async (req, res) => {
    var page = req.query.page || 1;
    var perPage = 20;
    var offset = (page-1)*perPage;
    const holiday_id =  req.params.id;

    try {
      
      const sqlCount = `SELECT COUNT(*) AS totalHolidayDates FROM  holiday_dates WHERE holiday_id=?`;
      const [countRows] = await db.query(sqlCount,[holiday_id]);
      const totalHolidayDates = countRows.totalHolidayDates;

      const sql = `SELECT * FROM holiday_dates WHERE holiday_id=? ORDER BY event_date ASC LIMIT ? OFFSET ?`;
      const holidayDates = await db.query(sql, [holiday_id, perPage, offset]);
  
      const holiday_sql = `SELECT * FROM holidays WHERE id=?`;
      const holiday = await db.query(holiday_sql, [holiday_id]);

      res.render("HolidayDates/index", {
        title: "Holiday Dates",
        holidayDates: holidayDates,
        holiday: holiday[0],
        baseUrl: baseUrl,
        paginationUrl:"Holiday",
        currentPage: page,
        totalPages: Math.ceil(totalHolidayDates/ perPage),
        message: req.flash("message"),
        error: req.flash("error"),
      });

    } catch (error) {
      console.error('Error fetching data:', error);
      res.redirect("back");
    }
   
  };
  
  exports.addHolidayDate = async (req, res) => {

    const holiday_id =  req.params.id;

    const holiday_sql = `SELECT * FROM holidays WHERE id=?`;
    const holidayData = await db.query(holiday_sql, [holiday_id]);
    const holiday_type = holidayData[0].holiday_type;

    const holiday_sql2 = `SELECT * FROM holidays WHERE holiday_type=?`;
    const holidayList = await db.query(holiday_sql2, [holiday_type]);

    res.render("HolidayDates/add", {
      title: "Add Holiday Date",
      holidayData: holidayData[0],
      holidayList: holidayList,
      message: req.flash("message"),
      error: req.flash("error"),
    });
  };
  
  exports.insertHolidayDate = async (req, res) => {
    
    const {  holiday_id, title, subtitle, event_date } = req.body;
    const status = 1; 
    var count = 0;
    var skip_titles =[];

   // console.log(holiday_id, title, event_date)
    try {
      for(i=0; i<10; i++){
        var stitle = title[i];
        var sbtitle = subtitle[i];
        var edate = event_date[i];
        if(stitle!=="" && edate!==""){
           //check the  title  is exists in  holiday_dates table or not
          const sql = 'SELECT * FROM `holiday_dates` WHERE title=?';
          const hdate = await db.query(sql, [stitle]);
          if(hdate.length === 0)
          {
            // insert data from the  holiday_dates table
            const sql = "INSERT INTO `holiday_dates` SET holiday_id=?, title=?, subtitle=?, event_date=?, status='?'";
            const results = await db.query(sql, [holiday_id, stitle, sbtitle, edate, status]);
            console.log('Holiday date inserted:', results.insertId);
            count++;
          }else{
            skip_titles.push(stitle);
          }
        }
      
      }

      var msg = "";
      var errmsg = "";
      if (count > 0) {
          msg =`Holiday date has been added successfully`;
          req.flash("message", msg);
          if(skip_titles.length>0){
            errmsg =`Sorry. ${skip_titles.join(', ')} title(s) are already exists!`;
          }
          req.flash("error", errmsg);
          res.redirect("/admin/holiday-dates/"+holiday_id);
      } else {
        if(skip_titles.length>0){
          msg =`Sorry. ${skip_titles.join(', ')} title(s) are already exists!`;
        }
        req.flash("error", msg);
        res.redirect("back");
    
      }
    } catch (error) {
      req.flash("error", 'Error fetching data:', error);
      console.log('Error fetching data:', error);
      res.redirect("back");
    }
  
    
  };
  
  exports.editHolidayDate = async (req, res) => {

    var id = req.params.id;
    
    try {

      //check the id  is exists in  holiday_dates table or not
      const sql = 'SELECT d.*, h.title as holiday_title, h.holiday_type FROM `holiday_dates` d, `holidays` h WHERE h.id = d.holiday_id AND d.id = ?';
      const holidayData = await db.query(sql, [id]);
      if(holidayData.length > 0)
      {
        const holiday_type = holidayData[0].holiday_type;
        const holiday_sql2 = `SELECT * FROM holidays WHERE holiday_type=?`;
        const holidayList = await db.query(holiday_sql2, [holiday_type]);

        res.render("HolidayDates/edit", {
          title: "Edit Holiday Date",
          holidayData: holidayData[0],
          holidayList: holidayList,
          baseUrl: baseUrl,
          message: req.flash("message"),
          error: req.flash("error"),
        });

      }else{
          req.flash("error", "Sorry. No holiday date records exists!");
          res.redirect("/admin/holiday-date/?type_filter="+typeList[0]);
      }

    } catch (error) {
      console.log('Error fetching data:', error);
      res.redirect("back");
    }

  
  };
  
  exports.updateHolidayDate = async (req, res) => {

    const { id,  holiday_id, title, subtitle, event_date } = req.body;

    try {
      //check the id  is exists in  holiday_dates table or not
      const sql = 'SELECT * FROM `holiday_dates` WHERE id=?';
      const addin = await db.query(sql, [id]);
      
      if(addin.length > 0)
      {

        // Update data into the  holiday_dates table
        const sql = 'UPDATE `holiday_dates` SET holiday_id=?, title=?, subtitle=?, event_date=? WHERE id=?';
        const edit_results = await db.query(sql, [holiday_id, title, subtitle, event_date, id]);
       
        if (edit_results.affectedRows > 0) {
            console.log('Holiday Date affected:', edit_results.affectedRows);
            req.flash("message", "Holiday date has been updated successfully");
            res.redirect("back");
        } else {
          console.log(edit_results);
          req.flash("error", "Holiday date record has not updated.");
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
  
  exports.deleteHolidayDate = async (req, res) => {
    var id = req.params.id;
    
    try {
      //check the  id  is exists in  holiday_dates table or not
      const sql = 'SELECT * FROM `holiday_dates` WHERE id = ?';
      const addin = await db.query(sql, [id]);
      if(addin.length > 0)
      {
      
        // Delete data from the  holiday_dates table
        const sql = 'DELETE FROM ` holiday_dates` WHERE id=?';
        const edit_results = await db.query(sql, [id]);
       
        if (edit_results.affectedRows > 0) {
          req.flash("message", "Holiday date has been deleted successfully.");
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
  
  exports.statusHolidayDate = async (req, res) => {
    var id = req.params.id;
    var status = req.params.status;

    try {
      //check the id  is exists in  holiday_dates table or not
      const sql = 'SELECT * FROM ` holiday_dates` WHERE id = ?';
      const addin = await db.query(sql, [id]);
      if(addin.length > 0)
      {
        
        // update status in the  holiday_dates table
        const sql = "UPDATE ` holiday_dates` SET status=?  WHERE id=?";
        const status_results = await db.query(sql, [status, id]);
    
        if (status_results.affectedRows > 0) {
          req.flash("message", "Holiday date status has been updated successfully.");
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
  
  exports.addHolidayDateCSV = async (req, res) => {

    const holiday_id =  req.params.id;

    const holiday_sql = `SELECT * FROM holidays WHERE id=?`;
    const holidayData = await db.query(holiday_sql, [holiday_id]);
    const holiday_type = holidayData[0].holiday_type;

    const holiday_sql2 = `SELECT * FROM holidays WHERE holiday_type=?`;
    const holidayList = await db.query(holiday_sql2, [holiday_type]);

    res.render("HolidayDates/import", {
      title: "Import Holiday Date",
      holidayData: holidayData[0],
      holidayList: holidayList,
      message: req.flash("message"),
      error: req.flash("error"),
    });
  };

  
  exports.importHolidayDateCSV = async (req, res) => {
    
    const {  holiday_id } = req.body;
    const status = 1; 
    var skip_titles = [];
    var promises = [];
    var count = 0;
    const csvFile = 'public/uploads/holidaycsv/' + req.files.date_csv[0].filename;
    
    try {
      const results = [];
      var promises = [];
      fs.createReadStream(csvFile)
      .pipe(csv())
      .on('data', (row) => {
        results.push(row);
      })
      .on('end', async() => {
       
        console.log(results);
        promises = results.map(async (row, index) => {
          console.log(index, row.Holiday, row.Date, row.Subtitle, holiday_id);
          //check the  title  is exists in  holiday_dates table or not
          //const sql = 'SELECT * FROM `holiday_dates` WHERE title=? AND holiday_id=?';
          //const hdate = await db.query(sql, [row.title, holiday_id]);
          //if(hdate.length === 0)
          //{
            if(row.Holiday!=""){
              // insert data from the  holiday_dates table
              const sql = "INSERT INTO `holiday_dates` SET holiday_id=?, title=?,  event_date=?, subtitle=?, status='?'";
              const results = await db.query(sql, [holiday_id, row.Holiday, row.Date, row.Subtitle, status]);
              count++;
            }

        });

        await Promise.all(promises);
        console.log("count=>",count, skip_titles);
        var msg = "";
        var err_msg = "";
        if (count > 0) {
            msg =`${count} Holiday date has been added successfully`;
            req.flash("message", msg);
          res.redirect("/admin/holiday-date/"+holiday_id+"/import-dates");
        } else {
          if(skip_titles.length>0){
            console.log(msg);
            msg =`Sorry. ${skip_titles.join(', ')} title(s) are already exists!`;
          }
          req.flash("error", msg);
          //res.redirect("back");
          res.redirect("/admin/holiday-date/"+holiday_id+"/import-dates");
        }
       
      });
     
      

    } catch (error) {
      req.flash("error", 'Error fetching data:', error);
      console.log('Error fetching data:', error);
      res.redirect("back");
    }
  
    
  };
  