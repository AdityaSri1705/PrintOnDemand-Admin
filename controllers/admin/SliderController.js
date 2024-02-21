const db = require('../../database/db');
require("dotenv").config();
const path = require('path');
const fs = require('fs/promises');
const baseUrl = process.env.BASEURL;

exports.getAllSliders = async (req, res) => {
    var page = req.query.page || 1;
    var perPage = (20)*1;
    var offset = (page-1)*perPage;

    try {
      const sqlCount = 'SELECT COUNT(*) AS totalSliders FROM `slider`';
      const [countRows] = await db.query(sqlCount);
      const totalSliders = countRows.totalSliders;

      //check the email id  is exists in Sliders table or not
      const sql = 'SELECT * FROM `slider` LIMIT ? OFFSET ?';
      const sliders = await db.query(sql, [perPage, offset]);
    
      res.render("Sliders/index", {
        title: "Sliders",
        sliders: sliders,
        baseUrl: baseUrl,
        paginationUrl:"sliders",
        currentPage: page,
        totalPages: Math.ceil(totalSliders/ perPage),
        message: req.flash("message"),
        error: req.flash("error"),
      });

    } catch (error) {
      console.error('Error fetching data:', error);
      res.redirect("back");
    }
   
  };
  
  exports.addSlider = async (req, res) => {

    const seq_sql = "SELECT max(sequence) as seq FROM `slider` WHERE status='1'";
    const maxseq = await db.query(seq_sql);
    const sequence =  maxseq[0].seq+1
    console.log(sequence);
    res.render("Sliders/add", {
      title: "Add Slider",
      sequence: sequence,
      message: req.flash("message"),
      error: req.flash("error"),
    });
  };
  
  exports.insertSlider = async (req, res) => {
    
    const { title, sequence, btn_text, btn_link } = req.body;
    const status = 1; 

    var slider_image = "";
    if(req.files.slider_image){
       slider_image = '/uploads/slider/' + req.files.slider_image[0].filename;
    }
    
    try {
      //check the email id  is exists in slider table or not
      const sql = "SELECT * FROM `slider` WHERE  title=?";
      const slider = await db.query(sql, [title]);
      if(slider.length === 0)
      {
        // insert data from the slider table
        const sql = "INSERT INTO `slider` SET title=?, image=?, sequence=?, btn_text=?, btn_link=?, status='?'";
        const results = await db.query(sql, [title, slider_image, sequence, btn_text, btn_link, status]);


        if (results.insertId > 0) {
            console.log('Slider inserted:', results.insertId);
            req.flash("message", "Slider has been added successfully");
            res.redirect("/admin/sliders");
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
  
  exports.editSlider = async (req, res) => {

    var slider_id = req.params.id;
    
    try {
      //check the email id  is exists in slider table or not
      const sql = 'SELECT * FROM `slider` WHERE id = ?';
      const slider = await db.query(sql, [slider_id]);
      
      if(slider.length > 0)
      {

        res.render("Sliders/edit", {
          title: "Edit Slider",
          slider: slider[0],
          baseUrl: baseUrl,
          message: req.flash("message"),
          error: req.flash("error"),
        });

      }else{
          req.flash("error", "Sorry. No slider records exists!");
          res.redirect("/admin/sliders");
      }

    } catch (error) {
      console.log('Error fetching data:', error);
      res.redirect("back");
    }

  
  };
  
  exports.updateSlider = async (req, res) => {

    const { id, title, sequence, btn_text, btn_link } = req.body;

    try {
      //check the email id  is exists in slider table or not
      const sql = 'SELECT * FROM `slider` WHERE id=?';
      const slider = await db.query(sql, [id]);
      
      if(slider.length > 0)
      {

        var slider_image = slider[0].image;
        if(req.files.slider_image){
          // Delete the old slider image
          if (slider_image) {
            const oldSliderImagePath = path.join(__dirname, '../../public/', slider_image);
            await fs.access(oldSliderImagePath); // Check if the file exists
            await fs.unlink(oldSliderImagePath);
          }
          slider_image = '/uploads/slider/' + req.files.slider_image[0].filename;
        }

        

        // Update data into the slider table
        const sql = "UPDATE `slider` SET title=?, sequence=?, image=?, btn_text=?, btn_link=? WHERE id=?";
        const edit_results = await db.query(sql, [title, sequence, slider_image, btn_text, btn_link, id]);
      

        if (edit_results.affectedRows > 0) {
            console.log('Slider affected:', edit_results.affectedRows);
            req.flash("message", "Slider has been updated successfully");
            res.redirect("back");
        } else {
          console.log(edit_results);
          req.flash("error", "Slider record has not updated.");
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
  
  exports.deleteSlider = async (req, res) => {
    var id = req.params.id;
    
    try {
      //check the email id  is exists in slider table or not
      const sql = 'SELECT * FROM `slider` WHERE id = ?';
      const slider = await db.query(sql, [id]);
      if(slider.length > 0)
      {
        var slider_image = slider[0].image;

        // Delete the old slider image
        if (slider_image) {
          const oldSliderImagePath = path.join(__dirname, '../../public/', slider_image);
          try {
            await fs.access(oldSliderImagePath); // Check if the file exists
            await fs.unlink(oldSliderImagePath); // Delete the file
          } catch (err) {
            console.error('Error deleting old image:', err);
          }
        }

        // Delete data from the slider table
        const sql = 'DELETE FROM `slider` WHERE id=?';
        const edit_results = await db.query(sql, [id]);
       
        if (edit_results.affectedRows > 0) {
          req.flash("message", "Slider has been deleted successfully.");
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
      req.flash("error", "Oops! Could not delete slider.");
      res.redirect("back");
    }
    
  }
  
  exports.statusSlider = async (req, res) => {
    var id = req.params.id;
    var status = req.params.status;

    try {
      //check the email id  is exists in slider table or not
      const sql = 'SELECT * FROM `slider` WHERE id = ?';
      const slider = await db.query(sql, [id]);
      if(slider.length > 0)
      {
        
        // update status in the slider table
        const sql = "UPDATE `slider` SET status=?  WHERE id=?";
        const status_results = await db.query(sql, [status, id]);
    
        if (status_results.affectedRows > 0) {
          req.flash("message", "Slider status has been updated successfully.");
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

  exports.deleteSliderImage = async (req, res) => {
    var id = req.params.id;
    
    try {
      //check the id is exists in slider table or not
      const sql = 'SELECT * FROM `slider` WHERE id = ?';
      const slider = await db.query(sql, [id]);
      if(slider.length > 0)
      {

        var slider_img = slider[0].image;

        // Delete the old banner image
        if (slider_img) {
          const oldBannerImagePath = path.join(__dirname, '../../public/', slider_img);
          try {
            await fs.access(oldBannerImagePath); // Check if the file exists
            await fs.unlink(oldBannerImagePath); // Delete the file
          } catch (err) {
            console.error('Error deleting old image:', err);
          }
        }

        // Delete data from the slider table
        const sql = 'UPDATE `slider` SET image="" WHERE id=?';
        const edit_results = await db.query(sql, [id]);
       
        if (edit_results.affectedRows > 0) {
          req.flash("message", "Slider image has been deleted succesfully.");
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
      req.flash("error", "Oops! Could not delete slider image.");
      res.redirect("back");
    }
    
  }