const db = require('../../database/db');
require("dotenv").config();
const path = require('path');
const fs = require('fs/promises');
const baseUrl = process.env.BASEURL;

exports.getAllGiftCards = async (req, res) => {
    var page = req.query.page || 1;
    var perPage = (20)*1;
    var offset = (page-1)*perPage;

    try {
      const sqlCount = 'SELECT COUNT(*) AS totalGiftCards FROM `gift_cards`';
      const [countRows] = await db.query(sqlCount);
      const totalGiftCards = countRows.totalGiftCards;

      //check the  id  is exists in GiftCards table or not
      const sql = 'SELECT * FROM `gift_cards` LIMIT ? OFFSET ?';
      const giftcards = await db.query(sql, [perPage, offset]);
    
      res.render("GiftCard/index", {
        title: "Gift Cards",
        giftcards: giftcards,
        baseUrl: baseUrl,
        paginationUrl:"giftcard",
        currentPage: page,
        totalPages: Math.ceil(totalGiftCards/ perPage),
        message: req.flash("message"),
        error: req.flash("error"),
      });

    } catch (error) {
      console.error('Error fetching data:', error);
      res.redirect("back");
    }
   
  };
  
  exports.addGiftCard = async (req, res) => {

    const seq_sql = "SELECT max(sequence) as seq FROM `gift_cards` WHERE status='1'";
    const maxseq = await db.query(seq_sql);
    const sequence =  maxseq[0].seq+1

    res.render("GiftCard/add", {
      title: "Add Gift Card",
      sequence: sequence,
      message: req.flash("message"),
      error: req.flash("error"),
    });
  };
  
  exports.insertGiftCard = async (req, res) => {
    

    const { title, sequence } = req.body;
    const status = 1; 

    var giftcard_image = "";
    if(req.files.giftcard_image){
      giftcard_image = '/uploads/giftcard/' + req.files.giftcard_image[0].filename;
    }
    
    try {
      //check the id  is exists in gift_cards table or not
      const sql = "SELECT * FROM `gift_cards` WHERE  title=?";
      const gcimg = await db.query(sql, [title]);
      if(gcimg.length === 0)
      {
        // insert data from the gift_cards table
        const sql = "INSERT INTO `gift_cards` SET title=?, image=?, sequence=?, status='?'";
        const results = await db.query(sql, [title, giftcard_image, sequence, status]);


        if (results.insertId > 0) {
            console.log('Gift card image inserted:', results.insertId);
            req.flash("message", "Gift card image has been added successfully");
            res.redirect("/admin/giftcards");
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
  
  exports.editGiftCard = async (req, res) => {

    var giftcard_id = req.params.id;
    
    try {
      //check the  id  is exists in gift_cards table or not
      const sql = 'SELECT * FROM `gift_cards` WHERE id = ?';
      const giftcard = await db.query(sql, [giftcard_id]);
      
      if(giftcard.length > 0)
      {

        res.render("GiftCard/edit", {
          title: "Edit Gift Card",
          giftcard: giftcard[0],
          baseUrl: baseUrl,
          message: req.flash("message"),
          error: req.flash("error"),
        });

      }else{
          req.flash("error", "Sorry. No gift card records exists!");
          res.redirect("/admin/giftcards");
      }

    } catch (error) {
      console.log('Error fetching data:', error);
      res.redirect("back");
    }

  
  };
  
  exports.updateGiftCard = async (req, res) => {

    const { id, title, sequence } = req.body;

    try {
      //check the id  is exists in gift_cards table or not
      const sql = 'SELECT * FROM `gift_cards` WHERE id=?';
      const giftcard = await db.query(sql, [id]);
      
      if(giftcard.length > 0)
      {

        var giftcard_image = giftcard[0].image;
        if(req.files.giftcard_image){
          // Delete the old giftcard image
          if (giftcard_image) {
            const oldGiftCardImagePath = path.join(__dirname, '../../public/', giftcard_image);
            await fs.access(oldGiftCardImagePath); // Check if the file exists
            await fs.unlink(oldGiftCardImagePath);
          }
          giftcard_image = '/uploads/giftcard/' + req.files.giftcard_image[0].filename;
        }

        

        // Update data into the gift_cards table
        const sql = "UPDATE `gift_cards` SET title=?, image=?, sequence=? WHERE id=?";
        const edit_results = await db.query(sql, [title, giftcard_image, sequence, id]);
      

        if (edit_results.affectedRows > 0) {
            console.log('Gift Card affected:', edit_results.affectedRows);
            req.flash("message", "Gift card image has been updated successfully");
            res.redirect("back");
        } else {
          console.log(edit_results);
          req.flash("error", "Gift Card record has not updated.");
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
  
  exports.deleteGiftCard = async (req, res) => {
    var id = req.params.id;
    
    try {
      //check the id  is exists in gift_cards table or not
      const sql = 'SELECT * FROM `gift_cards` WHERE id = ?';
      const giftcard = await db.query(sql, [id]);
      if(giftcard.length > 0)
      {
        var giftcard_image = giftcard[0].image;

        // Delete the old giftcard image
        if (giftcard_image) {
          const oldGiftCardImagePath = path.join(__dirname, '../../public/', giftcard_image);
          try {
            await fs.access(oldGiftCardImagePath); // Check if the file exists
            await fs.unlink(oldGiftCardImagePath); // Delete the file
          } catch (err) {
            console.error('Error deleting old image:', err);
          }
        }

        // Delete data from the gift_cards table
        const sql = 'DELETE FROM `gift_cards` WHERE id=?';
        const edit_results = await db.query(sql, [id]);
       
        if (edit_results.affectedRows > 0) {
          req.flash("message", "Gift card image has been deleted successfully.");
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
      req.flash("error", "Oops! Could not delete giftcard.");
      res.redirect("back");
    }
    
  }
  
  exports.statusGiftCard = async (req, res) => {
    var id = req.params.id;
    var status = req.params.status;

    try {
      //check the id  is exists in gift_cards table or not
      const sql = 'SELECT * FROM `gift_cards` WHERE id = ?';
      const giftcard = await db.query(sql, [id]);
      if(giftcard.length > 0)
      {
        
        // update status in the gift_cards table
        const sql = "UPDATE `gift_cards` SET status=?  WHERE id=?";
        const status_results = await db.query(sql, [status, id]);
    
        if (status_results.affectedRows > 0) {
          req.flash("message", "Gift card image status has been updated successfully.");
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

  exports.deleteGiftCardImage = async (req, res) => {
    var id = req.params.id;
    
    try {
      //check the id is exists in gift_cards table or not
      const sql = 'SELECT * FROM `gift_cards` WHERE id = ?';
      const giftcard = await db.query(sql, [id]);
      if(giftcard.length > 0)
      {

        var giftcard_img = giftcard[0].image;

        // Delete the old giftcard image
        if (giftcard_img) {
          const oldGiftCardImagePath = path.join(__dirname, '../../public/', giftcard_img);
          try {
            await fs.access(oldGiftCardImagePath); // Check if the file exists
            await fs.unlink(oldGiftCardImagePath); // Delete the file
          } catch (err) {
            console.error('Error deleting old image:', err);
          }
        }

        // Delete data from the gift_cards table
        const sql = 'UPDATE `gift_cards` SET image="" WHERE id=?';
        const edit_results = await db.query(sql, [id]);
       
        if (edit_results.affectedRows > 0) {
          req.flash("message", "Gift card image has been deleted succesfully.");
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
      req.flash("error", "Oops! Could not delete gift card image.");
      res.redirect("back");
    }
    
  }