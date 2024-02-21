const db = require('../../database/db');
require("dotenv").config();
const path = require('path');
const fs = require('fs/promises');
const baseUrl = process.env.BASEURL;

exports.getAllStories = async (req, res) => {
    var page = req.query.page || 1;
    var perPage = (20)*1;
    var offset = (page-1)*perPage;

    try {
      const sqlCount = 'SELECT COUNT(*) AS totalStories FROM `stories`';
      const [countRows] = await db.query(sqlCount);
      const totalStories = countRows.totalStories;

   
      const sql = 'SELECT stories.*, users.first_name, users.last_name FROM `stories`, `users` WHERE stories.user_id=users.id ORDER BY id DESC LIMIT ? OFFSET ?';
      const stories = await db.query(sql, [perPage, offset]);
    
      res.render("Story/index", {
        title: "Stories",
        stories: stories,
        baseUrl: baseUrl,
        paginationUrl:"/admin/stories",
        currentPage: page,
        totalPages: Math.ceil(totalStories/ perPage),
        message: req.flash("message"),
        error: req.flash("error"),
      });

    } catch (error) {
      console.error('Error fetching data:', error);
      res.redirect("back");
    }
   
  };
  
  exports.addStory = async (req, res) => {

    
    const user_sql = "SELECT * FROM `users` WHERE status='1'";
    const users = await db.query(user_sql);

    res.render("Story/add", {
      title: "Add Story",
      users: users,
      message: req.flash("message"),
      error: req.flash("error"),
    });
  };
  
  exports.insertStory = async (req, res) => {
    
    const { user_id, comments } = req.body;
    const status = 1; 

    var story_image = "";
    if(req.files.story_image){
      story_image = '/uploads/story/' + req.files.story_image[0].filename;
    }
    console.log(req.files.story_image, story_image)
    try {
      const sql = "SELECT * FROM `stories` WHERE  user_id=?";
      const story = await db.query(sql, [user_id]);
      if(story.length === 0)
      {
        // insert data from the story table
        const sql = "INSERT INTO `stories` SET user_id=?, comments=?,  image=?, status='?'";
        const results = await db.query(sql, [user_id, comments, story_image, status]);

        if (results.insertId > 0) {
            console.log('Story inserted:', results.insertId);
            req.flash("message", "Story has been added successfully");
            res.redirect("/admin/stories");
        } else {
          req.flash("error", 'Error fetching data:', error);
          res.redirect("back");
      
        }
      }else{
          req.flash("error", "Sorry. This user comment is already exists!");
          res.redirect("back");
      }

    } catch (error) {
      req.flash("error", 'Error fetching data:', error);
      console.log('Error fetching data:', error);
      res.redirect("back");
    }
  
    
  };
  
  exports.editStory = async (req, res) => {

    var story_id = req.params.id;
    
    try {
      //check the email id  is exists in stories table or not
      const sql = 'SELECT * FROM `stories` WHERE id = ?';
      const story = await db.query(sql, [story_id]);
      
      if(story.length > 0)
      {
    
        const user_sql = "SELECT * FROM `users` WHERE status='1'";
        const users = await db.query(user_sql);
       
        res.render("Story/edit", {
          title: "Edit Story Item",
          users: users,
          story: story[0],
          baseUrl: baseUrl,
          message: req.flash("message"),
          error: req.flash("error"),
        });

      }else{
          req.flash("error", "Sorry. No story records exists!");
          res.redirect("/admin/stories");
      }

    } catch (error) {
      console.log('Error fetching data:', error);
      res.redirect("back");
    }

  
  };
  
  exports.updateStory = async (req, res) => {

    const { id, user_id, comments } = req.body;

    try {
      //check the email id  is exists in stories table or not
      const sql = 'SELECT * FROM `stories` WHERE id=?';
      const story = await db.query(sql, [id]);
      
      if(story.length > 0)
      {

        var story_image = story[0].image;
        if(req.files.story_image){
          // Delete the old story image
          if (story_image) {
            const oldStoryImagePath = path.join(__dirname, '../../public/', story_image);
            await fs.access(oldStoryImagePath); // Check if the file exists
            await fs.unlink(oldStoryImagePath);
          }
          story_image = '/uploads/story/' + req.files.story_image[0].filename;
        }

        

        // Update data into the story table
        const sql = "UPDATE `stories` SET user_id=?, comments=?, image=? WHERE id=?";
        const edit_results = await db.query(sql, [user_id, comments, story_image, id]);

        if (edit_results.affectedRows > 0) {
            console.log('Story affected:', edit_results.affectedRows);
            req.flash("message", "Story has been updated successfully");
            res.redirect("back");
        } else {
          console.log(edit_results);
          req.flash("error", "Story record has not updated.");
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
  
  exports.deleteStory = async (req, res) => {
    var id = req.params.id;
    
    try {
       //check item id  is exists in story table or not
      const sql = 'SELECT * FROM `stories` WHERE id = ?';
      const story = await db.query(sql, [id]);
      if(story.length > 0)
      {
        var story_image = story[0].image;

        // Delete the old story image
        if (story_image) {
          const oldStoryImagePath = path.join(__dirname, '../../public/', story_image);
          try {
            await fs.access(oldStoryImagePath); // Check if the file exists
            await fs.unlink(oldStoryImagePath); // Delete the file
          } catch (err) {
            console.error('Error deleting old image:', err);
          }
        }

        // Delete data from the stories table
        const sql = 'DELETE FROM `stories` WHERE id=?';
        const edit_results = await db.query(sql, [id]);
       
        if (edit_results.affectedRows > 0) {
          req.flash("message", "Story has been deleted successfully.");
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
      req.flash("error", "Oops! Could not delete story.");
      res.redirect("back");
    }
    
  }
  
  exports.statusStory = async (req, res) => {
    var id = req.params.id;
    var status = req.params.status;

    try {
      //check item id  is exists in story table or not
      const sql = 'SELECT * FROM `stories` WHERE id = ?';
      const story = await db.query(sql, [id]);
      if(story.length > 0)
      {
        
        // update status in the stories table
        const sql = "UPDATE `stories` SET status=?  WHERE id=?";
        const status_results = await db.query(sql, [status, id]);
    
        if (status_results.affectedRows > 0) {
          req.flash("message", "Story status has been updated successfully.");
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

  exports.deleteStoryImage = async (req, res) => {
    var id = req.params.id;
    
    try {
      //check the id is exists in story table or not
      const sql = 'SELECT * FROM `stories` WHERE id = ?';
      const story = await db.query(sql, [id]);
      if(story.length > 0)
      {

        var story_image = story[0].image;

        // Delete the old banner image
        if (story_image) {
          const oldBannerImagePath = path.join(__dirname, '../../public/', story_image);
          try {
            await fs.access(oldBannerImagePath); // Check if the file exists
            await fs.unlink(oldBannerImagePath); // Delete the file
          } catch (err) {
            console.error('Error deleting old image:', err);
          }
        }

        // Delete data from the stories table
        const sql = 'UPDATE `stories` SET image="" WHERE id=?';
        const edit_results = await db.query(sql, [id]);
       
        if (edit_results.affectedRows > 0) {
          req.flash("message", "Story image has been deleted succesfully.");
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
      req.flash("error", "Oops! Could not delete cover image.");
      res.redirect("back");
    }
    
  }