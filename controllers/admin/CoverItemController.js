const db = require('../../database/db');
require("dotenv").config();
const path = require('path');
const fs = require('fs/promises');
const baseUrl = process.env.BASEURL;

exports.getAllCoverItems = async (req, res) => {
    const page = req.query.page || 1;
    const perPage = 20;
    const offset = (page-1)*perPage;
    const category_filter =  req.query.category || '';

    var cons = "";
    if(category_filter!=""){
      cons = " WHERE cat_id='"+category_filter+"'";
    }

    try {
      const sqlCount = `SELECT COUNT(*) AS totalCoverItems FROM cover_items ${cons}`;
      const [countRows] = await db.query(sqlCount);
      const totalCovers = countRows.totalCoverItems;

      const sql = `SELECT c.*, cc.title AS cat_title, COUNT(ci.id) AS imageCount
      FROM cover_items c
      LEFT JOIN cover_images ci ON c.id = ci.cover_id
      LEFT JOIN cover_categories cc ON c.cat_id = cc.id  ${cons}
      GROUP BY c.id   ORDER BY c.id DESC LIMIT ? OFFSET ?`;
      const covers = await db.query(sql, [perPage, offset]);   
 
      const cat_sql = `SELECT * FROM cover_categories WHERE status='1'`;
      const categories = await db.query(cat_sql);

      
      res.render("Cover/index", {
        title: "Cover Items",
        covers: covers,
        categories: categories,
        category_filter: category_filter,
        baseUrl: baseUrl,
        paginationUrl:"/admin/cover",
        currentPage: page,
        totalPages: Math.ceil(totalCovers/ perPage),
        message: req.flash("message"),
        error: req.flash("error"),
      });

    } catch (error) {
      console.error('Error fetching data:', error);
      res.redirect("back");
    }
   
  };
  
  exports.addCoverItem = async (req, res) => {

    const cat_sql = "SELECT * FROM `cover_categories` WHERE status='1'";
    const categories = await db.query(cat_sql);

    res.render("Cover/add", {
      title: "Add Cover Item",
      categories: categories,
      message: req.flash("message"),
      error: req.flash("error"),
    });
  };
  
  exports.insertCoverItem = async (req, res) => {
    
    const { cat_id, title, description, price } = req.body;
    const status = 1; 

    var front_image = "";
    if(req.files.cover_frontimg){
      front_image = '/uploads/covers/' + req.files.cover_frontimg[0].filename;
    }
    var back_image = "";
    if(req.files.cover_backimg){
      back_image = '/uploads/covers/' + req.files.cover_backimg[0].filename;
    }
    var cover_pdf = "";
    if(req.files.cover_pdf){
      cover_pdf = '/uploads/cover_pdf/' + req.files.cover_pdf[0].filename;
    }
    
    
    try {
      //check the email id  is exists in cover_items table or not
      const sql = "SELECT * FROM `cover_items` WHERE  cat_id=? AND title=?";
      const coveritem = await db.query(sql, [cat_id, title]);
      if(coveritem.length === 0)
      {
        // insert data from the coveritem table
        const sql = "INSERT INTO `cover_items` SET cat_id=?, title=?, description=?, price=?, front_image=?, back_image=?, cover_pdf=?, status='?'";
        const results = await db.query(sql, [cat_id, title, description, price, front_image, back_image, cover_pdf, status]);


        //adding addition images in cover_otherimages table
        if(req.files.cover_otherimages && req.files.cover_otherimages.length>0){
            otherimages = req.files.cover_otherimages;
            otherimages.forEach((img)=>{
                var cimage = '/uploads/covers/' + img.filename;
                const imgsql = "INSERT INTO `cover_images` SET cover_id=?, image=?";
                const img_results =  db.query(imgsql, [results.insertId,cimage]);
            });         
        }

        if (results.insertId > 0) {
            console.log('Cover Item inserted:', results.insertId);
            req.flash("message", "Cover Item has been added successfully");
            res.redirect("/admin/covers");
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
  
  exports.editCoverItem = async (req, res) => {

    var cover_id = req.params.id;
    
    try {
      //check the email id  is exists in cover_items table or not
      const sql = 'SELECT * FROM `cover_items` WHERE id = ?';
      const cover = await db.query(sql, [cover_id]);
      
      if(cover.length > 0)
      {
    
        const cat_sql = "SELECT * FROM `cover_categories` WHERE status='1'";
        const categories = await db.query(cat_sql);

        const img_sql = "SELECT * FROM `cover_images` WHERE cover_id=?";
        const  cover_images = await db.query(img_sql,[cover_id]);

        res.render("Cover/edit", {
          title: "Edit Cover Item",
          categories: categories,
          cover_images: cover_images,
          cover: cover[0],
          baseUrl: baseUrl,
          message: req.flash("message"),
          error: req.flash("error"),
        });

      }else{
          req.flash("error", "Sorry. No cover item records exists!");
          res.redirect("/admin/coveritems");
      }

    } catch (error) {
      console.log('Error fetching data:', error);
      res.redirect("back");
    }

  
  };
  
  exports.updateCoverItem = async (req, res) => {

    const { id, cat_id, title, description, price } = req.body;

    try {
      //check the email id  is exists in cover_items table or not
      const sql = 'SELECT * FROM `cover_items` WHERE id=?';
      const coveritem = await db.query(sql, [id]);
      
      if(coveritem.length > 0)
      {

        var front_image = coveritem[0].front_image;
        if(req.files.cover_frontimg){
          // Delete the old coveritem image
          if (front_image) {
            const oldCoverFrontImagePath = path.join(__dirname, '../../public/', front_image);
            await fs.access(oldCoverFrontImagePath); // Check if the file exists
            await fs.unlink(oldCoverFrontImagePath);
          }
          front_image = '/uploads/covers/' + req.files.cover_frontimg[0].filename;
        }

        var back_image = coveritem[0].back_image;
        if(req.files.cover_backimg){
          // Delete the old coveritem image
          if (back_image) {
            const oldCoverBackImagePath = path.join(__dirname, '../../public/', back_image);
            await fs.access(oldCoverBackImagePath); // Check if the file exists
            await fs.unlink(oldCoverBackImagePath);
          }
          back_image = '/uploads/covers/' + req.files.cover_backimg[0].filename;
        }


        var cover_pdf = coveritem[0].cover_pdf;
        if(req.files.cover_pdf){
          // Delete the old coveritem image
          if (cover_pdf) {
            const oldCoverPDFPath = path.join(__dirname, '../../public/', cover_pdf);
            await fs.access(oldCoverPDFPath); // Check if the file exists
            await fs.unlink(oldCoverPDFPath);
          }
          cover_pdf = '/uploads/cover_pdf/' + req.files.cover_pdf[0].filename;
        }

        // Update data into the coveritem table
        const sql = "UPDATE `cover_items` SET cat_id=?, title=?, description=?, price=?, front_image=?, back_image=?, cover_pdf=? WHERE id=?";
        const edit_results = await db.query(sql, [cat_id, title, description, price, front_image, back_image, cover_pdf, id]);
       
        //adding addition images in cover_otherimages table
        if(req.files.cover_otherimages && req.files.cover_otherimages.length>0){
          otherimages = req.files.cover_otherimages;
          otherimages.forEach((img)=>{
              var cimage = '/uploads/covers/' + img.filename;
              const imgsql = "INSERT INTO `cover_images` SET cover_id=?, image=?";
              const img_results =  db.query(imgsql, [id,cimage]);
              
          });         
        }


        if (edit_results.affectedRows > 0) {
            console.log('CoverItem affected:', edit_results.affectedRows);
            req.flash("message", "Cover Item has been updated successfully");
            res.redirect("back");
        } else {
          console.log(edit_results);
          req.flash("error", "Cover Item record has not updated.");
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
  
  exports.deleteCoverItem = async (req, res) => {
    var id = req.params.id;
    
    try {
       //check item id  is exists in coveritem table or not
      const sql = 'SELECT * FROM `cover_items` WHERE id = ?';
      const coveritem = await db.query(sql, [id]);
      if(coveritem.length > 0)
      {
        var front_image = coveritem[0].front_image;
        var back_image = coveritem[0].back_image;

        // Delete the old coveritem image
        if (front_image) {
          const oldCoverFrontImagePath = path.join(__dirname, '../../public/', front_image);
          try {
            await fs.access(oldCoverFrontImagePath); // Check if the file exists
            await fs.unlink(oldCoverFrontImagePath); // Delete the file
          } catch (err) {
            console.error('Error deleting old image:', err);
          }
        }
        // Delete the old coveritem back image
        if (back_image) {
          const oldCoverBackImagePath = path.join(__dirname, '../../public/', back_image);
          try {
            await fs.access(oldCoverBackImagePath); // Check if the file exists
            await fs.unlink(oldCoverBackImagePath); // Delete the file
          } catch (err) {
            console.error('Error deleting old image:', err);
          }
        }
       
       /* const imgsql = "SELECT * FROM `cover_images` WHERE cover_id=?";
        const img_results = await db.query(imgsql, [id]);
        console.log(img_results);
        if (img_results) {
          img_results.forEach( async (img)=>{
             const oldCoverExtraImagePath = path.join(__dirname, '../../public/', img.image);
              try {
                
                await fs.access(oldCoverExtraImagePath); // Check if the file exists
                await fs.unlink(oldCoverExtraImagePath); // Delete the file
              } catch (err) {
                console.error('Error deleting old image:', err);
              }
             
          }); 
          const imgsql = "DELETE `cover_images` WHERE cover_id=?";
          const img_results =  db.query(imgsql, [id]);        
        }*/
          

        // Delete data from the cover_items table
        const sql = 'DELETE FROM `cover_items` WHERE id=?';
        const edit_results = await db.query(sql, [id]);
       
        if (edit_results.affectedRows > 0) {
          req.flash("message", "Cover Item has been deleted successfully.");
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
      req.flash("error", "Oops! Could not delete coveritem.");
      res.redirect("back");
    }
    
  }
  
  exports.statusCoverItem = async (req, res) => {
    var id = req.params.id;
    var status = req.params.status;

    try {
      //check item id  is exists in coveritem table or not
      const sql = 'SELECT * FROM `cover_items` WHERE id = ?';
      const coveritem = await db.query(sql, [id]);
      if(coveritem.length > 0)
      {
        
        // update status in the cover_items table
        const sql = "UPDATE `cover_items` SET status=?  WHERE id=?";
        const status_results = await db.query(sql, [status, id]);
    
        if (status_results.affectedRows > 0) {
          req.flash("message", "Cover Item status has been updated successfully.");
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

  exports.deleteCoverItemImage = async (req, res) => {
    var id = req.params.id;
    var type = req.params.type;
    var imgid = req.params.imgid? req.params.imgid : 0;
    try {
      
      //check the id is exists in coveritem table or not
      const sql = 'SELECT * FROM `cover_items` WHERE id = ?';
      const coveritem = await db.query(sql, [id]);
      if(coveritem.length > 0)
      {
        if(type=="frontImage"){
          var front_image = coveritem[0].front_image;

          // Delete the old front image
          if (front_image) {
            const oldCoverFrontImagePath = path.join(__dirname, '../../public/', front_image);
            try {
              await fs.access(oldCoverFrontImagePath); // Check if the file exists
              await fs.unlink(oldCoverFrontImagePath); // Delete the file
            } catch (err) {
              console.error('Error deleting old image:', err);
            }
          }
  
          // Delete data from the cover_items table
          const sql = 'UPDATE `cover_items` SET front_image="" WHERE id=?';
          const edit_results = await db.query(sql, [id]);

          if (edit_results.affectedRows > 0) {
            req.flash("message", "Cover Item image has been deleted succesfully.");
            res.redirect("back");
          }else{
            req.flash("error", `Sorry! Could not delete with id ${id}.`);
            res.redirect("back");
          }

        }else if(type=="backImage"){
          var back_image = coveritem[0].back_image;

          // Delete the old back image
          if (back_image) {
            const oldCoverBackImagePath = path.join(__dirname, '../../public/', back_image);
            try {
              await fs.access(oldCoverBackImagePath); // Check if the file exists
              await fs.unlink(oldCoverBackImagePath); // Delete the file
            } catch (err) {
              console.error('Error deleting old image:', err);
            }
          }
  
          // Delete data from the cover_items table
          const sql = 'UPDATE `cover_items` SET back_image="" WHERE id=?';
          const edit_results = await db.query(sql, [id]);

          if (edit_results.affectedRows > 0) {
            req.flash("message", "Cover Item image has been deleted succesfully.");
            res.redirect("back");
          }else{
            req.flash("error", `Sorry! Could not delete with id ${id}.`);
            res.redirect("back");
          }

        }else if(type=="extraImage"){

          //check the id is exists in cover_images table or not
          const sql = 'SELECT * FROM `cover_images` WHERE id = ? AND cover_id=?';
          const coverimage = await db.query(sql, [imgid, id]);
          if(coverimage.length > 0)
          {
              // Delete the old banner image
              if (coverimage) {
                const oldExtraImagePath = path.join(__dirname, '../../public/', coverimage[0].image);
                try {
                  await fs.access(oldExtraImagePath); // Check if the file exists
                  await fs.unlink(oldExtraImagePath); // Delete the file
                } catch (err) {
                  console.error('Error deleting other image:', err);
                }
              }
      
              // Delete data from the cover_items table
              const sql = 'DELETE FROM `cover_images` WHERE id = ? AND cover_id=?';
              const edit_results = await db.query(sql, [imgid, id]);

              if (edit_results.affectedRows > 0) {
                req.flash("message", "Cover Item image has been deleted succesfully.");
                res.redirect("back");
              }else{
                req.flash("error", `Sorry! Could not delete with id ${id}.`);
                res.redirect("back");
              }
          }
        }
       
       
        

      }else{
        req.flash("error", `Sorry! Could not found with id ${id}. Maybe id is wrong`);
        res.redirect("back");
      }

    } catch (error) {
      console.log('Error fetching data:', error);
      req.flash("error", "Oops! Could not delete cover image.");
      res.redirect("back");
    }
    
  }

  exports.deleteCoverItemPdf = async (req, res) => {
    var id = req.params.id;
    try {
      
      //check the id is exists in coveritem table or not
      const sql = 'SELECT * FROM `cover_items` WHERE id = ?';
      const coveritem = await db.query(sql, [id]);
      if(coveritem.length > 0)
      {
        var cover_pdf = coveritem[0].cover_pdf;

        // Delete the old front image
        if (cover_pdf) {
          const oldCoverPDFPath = path.join(__dirname, '../../public/', cover_pdf);
          try {
            await fs.access(oldCoverPDFPath); // Check if the file exists
            await fs.unlink(oldCoverPDFPath); // Delete the file
          } catch (err) {
            console.error('Error deleting old image:', err);
          }
        }

        // Delete data from the cover_items table
        const sql = 'UPDATE `cover_items` SET cover_pdf="" WHERE id=?';
        const edit_results = await db.query(sql, [id]);

        if (edit_results.affectedRows > 0) {
          req.flash("message", "Cover PDF has been deleted succesfully.");
          res.redirect("back");
        }else{
          req.flash("error", `Sorry! Could not delete with id ${id}.`);
          res.redirect("back");
        }
       
       
        

      }else{
        req.flash("error", `Sorry! Could not found with id ${id}. Maybe id is wrong`);
        res.redirect("back");
      }

    } catch (error) {
      console.log('Error fetching data:', error);
      req.flash("error", "Oops! Could not delete cover image.");
      res.redirect("back");
    }
    
  }