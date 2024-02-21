const db = require('../../database/db');
require("dotenv").config();
const path = require('path');
const fs = require('fs/promises');
const baseUrl = process.env.BASEURL;

exports.getAllPages = async (req, res) => {
    var page = req.query.page || 1;
    var perPage = (20)*1;
    var offset = (page-1)*perPage;

    try {
      const sqlCount = 'SELECT COUNT(*) AS totalPages FROM `pages`';
      const [countRows] = await db.query(sqlCount);
      const totalPages = countRows.totalPages;

      //check the email id  is exists in Pages table or not
      const sql = 'SELECT * FROM `pages` LIMIT ? OFFSET ?';
      const pages = await db.query(sql, [perPage, offset]);
    
      res.render("Pages/index", {
        title: "Pages",
        pages: pages,
        baseUrl: baseUrl,
        paginationUrl:"pages",
        currentPage: page,
        totalPages: Math.ceil(totalPages/ perPage),
        message: req.flash("message"),
        error: req.flash("error"),
      });

    } catch (error) {
      console.error('Error fetching data:', error);
      res.redirect("back");
    }
   
  };
  
  
  exports.editPage = async (req, res) => {

    var page_id = req.params.id;
    
    try {
      //check the email id  is exists in page table or not
      const sql = 'SELECT * FROM `pages` WHERE id = ?';
      const page = await db.query(sql, [page_id]);
      
      if(page.length > 0)
      {

        const user_sql = "SELECT * FROM `users` WHERE status='1'";
        const users = await db.query(user_sql);
    
        const cat_sql = "SELECT * FROM `categories` WHERE status='1'";
        const categories = await db.query(cat_sql);

        res.render("Pages/edit", {
          title: "Edit Page",
          page: page[0],
          users: users,
          categories: categories,
          baseUrl: baseUrl,
          message: req.flash("message"),
          error: req.flash("error"),
        });

      }else{
          req.flash("error", "Sorry. No page records exists!");
          res.redirect("/admin/pages");
      }

    } catch (error) {
      console.log('Error fetching data:', error);
      res.redirect("back");
    }

  
  };
  
  exports.updatePage = async (req, res) => {

    const { id, title, content, metakeywords, metadescription } = req.body;

    try {
      //check the email id  is exists in page table or not
      const sql = 'SELECT * FROM `pages` WHERE id=?';
      const page = await db.query(sql, [id]);
      
      if(page.length > 0)
      {

        var page_image = page[0].banner;
        if(req.files.page_image){
          // Delete the old page image
          if (page_image) {
            const oldPageImagePath = path.join(__dirname, '../../public/', page_image);
            await fs.access(oldPageImagePath); // Check if the file exists
            await fs.unlink(oldPageImagePath);
          }
          page_image = '/uploads/pages/' + req.files.page_image[0].filename;
        }

        
        // Update data into the page table
        const sql = "UPDATE `pages` SET  title=?,  content=?, metakeywords=?, metadescription=?, banner=? WHERE id=?";
        const edit_results = await db.query(sql, [ title, content, metakeywords, metadescription, page_image, id]);

        if (edit_results.affectedRows > 0) {
            console.log('Page affected:', edit_results.affectedRows);
            req.flash("message", "Page has been updated successfully");
            res.redirect("back");
        } else {
          console.log(edit_results);
          req.flash("error", "Page record has not updated.");
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

  exports.deleteImage = async (req, res) => {
    var id = req.params.id;
    
    try {
      //check the id is exists in page table or not
      const sql = 'SELECT * FROM `pages` WHERE id = ?';
      const page = await db.query(sql, [id]);
      if(page.length > 0)
      {

        var banner_img = page[0].banner;

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

        // Delete data from the page table
        const sql = 'UPDATE `pages` SET banner="" WHERE id=?';
        const edit_results = await db.query(sql, [id]);
       
        if (edit_results.affectedRows > 0) {
          req.flash("message", "Banner image has been deleted succesfully.");
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
  
  