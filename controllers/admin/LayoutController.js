const db = require('../../database/db');
require("dotenv").config();
const path = require('path');
const fs = require('fs/promises');
const baseUrl = process.env.BASEURL;

exports.getAllLayouts = async (req, res) => {
    var page = req.query.page || 1;
    var perPage = 20;
    var offset = (page-1)*perPage;
    const page_filter =  req.query.page_filter || 'DailySingle';

    var cons = "";
    if(page_filter!=""){
      cons = " WHERE slug='"+page_filter+"'";
    }
 
    try {
      const sqlCount = `SELECT COUNT(*) AS totalLayouts FROM layouts ${cons}`;
      const [countRows] = await db.query(sqlCount);
      const totalLayouts = countRows.totalLayouts;

      //check the email id  is exists in Layouts table or not
      const layout_sql = `SELECT * FROM layouts  ${cons} ORDER BY id LIMIT ? OFFSET ?`;
      const layouts = await db.query(layout_sql, [perPage, offset]);

      const page_sql = `SELECT distinct slug, page as title FROM layouts ORDER BY page`;
      const pageList = await db.query(page_sql);
    
      res.render("Layout/index", {
        title: "Layouts",
        layouts: layouts,
        pageList: pageList,
        page_filter: page_filter,
        baseUrl: baseUrl,
        paginationUrl:"layouts",
        currentPage: page,
        totalPages: Math.ceil(totalLayouts/ perPage),
        message: req.flash("message"),
        error: req.flash("error"),
      });

    } catch (error) {
      console.log('Error fetching data:', error);
      res.redirect("back");
    }
   
  };
  
  exports.addLayout = async (req, res) => {
    res.render("Layout/add", {
      title: "Add Layout",
      message: req.flash("message"),
      error: req.flash("error"),
    });
  };
  
  exports.insertLayout = async (req, res) => {
    
    const { page, slug, title } = req.body;
    const status = 1; 
    const isDefault = req.body.isDefault | 0;

    var left_image = "";
    var right_image = "";
    /*if(req.files.left_image){
      left_image = '/uploads/layouts/' + req.files.left_image[0].filename;
    }
    if(req.files.right_image){
      right_image = '/uploads/layouts/' + req.files.right_image[0].filename;
    }*/
    
    try {
      //check the email id  is exists in layout table or not
      const sql = 'SELECT * FROM `layouts` WHERE title=? AND page=?';
      const layout = await db.query(sql, [title, page]);
      if(layout.length === 0)
      {
        // insert data from the layout table
        const sql = "INSERT INTO `layouts` SET slug=?, page=?, title=?, left_image=?, right_image=? isDefault=?, status='?'";
        const results = await db.query(sql, [slug, page, title, left_image, right_image, isDefault, status]);

        if (results.insertId > 0) {
            console.log('Layout inserted:', results.insertId);
            req.flash("message", "Layout has been added successfully");
            res.redirect("/admin/layouts");
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
  
  exports.editLayout = async (req, res) => {

    var layout_id = req.params.id;
    
    try {
      //check the email id  is exists in layout table or not
      const sql = 'SELECT * FROM `layouts` WHERE id = ?';
      const layout = await db.query(sql, [layout_id]);
     
      if(layout.length > 0)
      {

        res.render("Layout/edit", {
          title: "Edit Layout",
          layoutData: layout[0],
          baseUrl: baseUrl,
          message: req.flash("message"),
          error: req.flash("error"),
        });
       

      }else{
          req.flash("error", "Sorry. No layout records exists!");
          res.redirect("/admin/layouts");
      }

    } catch (error) {
      console.log('Error fetching data:', error);
      res.redirect("back");
    }

  
  };
  
  exports.updateLayout = async (req, res) => {

    const { id, title } = req.body;
    const isDefault = req.body.isDefault | 0;

    try {
      //check the email id  is exists in layout table or not
      const sql = 'SELECT * FROM `layouts` WHERE id=?';
      const layout = await db.query(sql, [id]);
      if(layout.length > 0)
      {

        var left_image = layout[0].left_image;
        var right_image = layout[0].right_image;
        /*if(req.files.left_image){
          // Delete the old left_image image
          if (left_image) {
            const oldLeftImagePath = path.join(__dirname, '../../public/', left_image);
            await fs.access(oldLeftImagePath); // Check if the file exists
            await fs.unlink(oldLeftImagePath);
          }
          left_image = '/uploads/layouts/' + req.files.left_image[0].filename;
        }
        if(req.files.right_image){
          // Delete the old right_image image
          if (right_image) {
            const oldRightImagePath = path.join(__dirname, '../../public/', right_image);
            await fs.access(oldRightImagePath); // Check if the file exists
            await fs.unlink(oldRightImagePath);
          }
          right_image = '/uploads/layouts/' + req.files.right_image[0].filename;
        }*/

        // Update data into the layout table
        const sql = 'UPDATE `layouts` SET title=?, isDefault=?, left_image=?, right_image=? WHERE id=?';
        const edit_results = await db.query(sql, [title, isDefault, left_image, right_image, id]);
       
        if (edit_results.affectedRows > 0) {
            console.log('Layout affected:', edit_results.affectedRows);
            req.flash("message", "Layout has been updated successfully");
            res.redirect("back");
        } else {
          console.log(edit_results);
          req.flash("error", "Layout record has not updated.");
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
  
  exports.deleteLayout = async (req, res) => {
    var id = req.params.id;
    
    try {
      //check the email id  is exists in layout table or not
      const sql = 'SELECT * FROM `layouts` WHERE id = ?';
      const layout = await db.query(sql, [id]);
      if(layout.length > 0)
      {
        var left_image = layout[0].left_image;
        var right_image = layout[0].right_image;
        // Delete the old layout image
        /*if (left_image) {
          const oldLeftImagePath = path.join(__dirname, '../../public/', left_image);
          try {
            await fs.access(oldLeftImagePath); // Check if the file exists
            await fs.unlink(oldLeftImagePath); // Delete the file
          } catch (err) {
            console.error('Error deleting old image:', err);
          }
        }
        if (right_image) {
          const oldRightImagePath = path.join(__dirname, '../../public/', right_image);
          try {
            await fs.access(oldRightImagePath); // Check if the file exists
            await fs.unlink(oldRightImagePath); // Delete the file
          } catch (err) {
            console.error('Error deleting old image:', err);
          }
        }*/

       
         // Delete data from the layout_sections table
         const section_sql = 'DELETE FROM `layout_sections` WHERE layout_id=?';
         const section_results = await db.query(section_sql, [id]);

         //delete layout options images 
        const imgsql = "SELECT * FROM `layout_options` WHERE layout_id=?";
        const options_results =  db.query(imgsql, [id]);
        if (options_results.length>0) {
          options_results.forEach( async (img)=>{
             const oldLeftImagePath = path.join(__dirname, '../../public/', img.left_image);
              try {
                
                await fs.access(oldLeftImagePath); // Check if the file exists
                await fs.unlink(oldLeftImagePath); // Delete the file
              } catch (err) {
                console.error('Error deleting old image:', err);
              }
              const oldRightImagePath = path.join(__dirname, '../../public/', img.right_image);
              try {
                
                await fs.access(oldRightImagePath); // Check if the file exists
                await fs.unlink(oldRightImagePath); // Delete the file
              } catch (err) {
                console.error('Error deleting old image:', err);
              }
             
          }); 
        }
         // Delete data from the layout_options table
         const opts_sql = 'DELETE FROM `layout_options` WHERE layout_id=?';
         const opts_results = await db.query(opts_sql, [id]);

       
        // Delete data from the layout table
        const del_sql = 'DELETE FROM `layouts` WHERE id=?';
        const edit_results = await db.query(del_sql, [id]);

        if (edit_results.affectedRows > 0) {
          req.flash("message", "Layout has been deleted successfully.");
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
      req.flash("error", "Oops! Could not delete layout.");
      res.redirect("back");
    }
    
  }
  
  exports.statusLayout = async (req, res) => {
    var id = req.params.id;
    var status = req.params.status;

    try {
      //check the email id  is exists in layout table or not
      const sql = 'SELECT * FROM `layouts` WHERE id = ?';
      const layout = await db.query(sql, [id]);
      if(layout.length > 0)
      {
        
        // update status in the layout table
        const sql = "UPDATE `layouts` SET status=?  WHERE id=?";
        const status_results = await db.query(sql, [status, id]);
    
        if (status_results.affectedRows > 0) {
          req.flash("message", "Layout status has been updated successfully.");
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

  /*exports.deleteLayoutImage = async (req, res) => {
    var type = req.params.type;
    var id = req.params.id;
    
    try {
      //check the id is exists in layout table or not
      const sql = 'SELECT * FROM `layouts` WHERE id = ?';
      const layout = await db.query(sql, [id]);
      if(layout.length > 0)
      {

        if (type=="left_image") {
          var left_img = layout[0].left_image;

          // Delete the old left_img image
          if (left_img) {
            const oldLeftImagePath = path.join(__dirname, '../../public/', left_img);
            try {
              await fs.access(oldLeftImagePath); // Check if the file exists
              await fs.unlink(oldLeftImagePath); // Delete the file
            } catch (err) {
              console.error('Error deleting old image:', err);
            }
          }

          // Delete data from the layout table
          const sql = 'UPDATE `layouts` SET left_image="" WHERE id=?';
          const edit_results = await db.query(sql, [id]);

          if (edit_results.affectedRows > 0) {
            req.flash("message", "Layout image has been deleted succesfully.");
            res.redirect("back");
          }else{
            req.flash("error", `Sorry! Could not delete with id ${id}.`);
            res.redirect("back");
          }
      }else{
        var right_img = layout[0].right_image;

        // Delete the old right_img image
        if (right_img) {
          const oldRightImagePath = path.join(__dirname, '../../public/', right_img);
          try {
            await fs.access(oldRightImagePath); // Check if the file exists
            await fs.unlink(oldRightImagePath); // Delete the file
          } catch (err) {
            console.error('Error deleting old image:', err);
          }
        }

        // Delete data from the layout table
        const sql = 'UPDATE `layouts` SET right_image="" WHERE id=?';
        const edit_results = await db.query(sql, [id]);

        if (edit_results.affectedRows > 0) {
          req.flash("message", "Layout image has been deleted succesfully.");
          res.redirect("back");
        }else{
          req.flash("error", `Sorry! Could not delete with id ${id}.`);
          res.redirect("back");
        }
      }
       
       

      }else{
        req.flash("error", `Sorry! Could not delete with id ${id}. Maybe id is wrong`);
        res.redirect("back");
      }

    } catch (error) {
      console.log('Error fetching data:', error);
      req.flash("error", "Oops! Could not delete  image.");
      res.redirect("back");
    }
    
  }*/