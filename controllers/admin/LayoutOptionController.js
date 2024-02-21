const db = require('../../database/db');
require("dotenv").config();
const path = require('path');
const fs = require('fs/promises');
const baseUrl = process.env.BASEURL;

exports.getAllLayoutOptions = async (req, res) => {
    var page = req.query.page || 1;
    var perPage = 20;
    var offset = (page-1)*perPage;
    const layout_id =  req.params.layout_id;
    const section_filter =  req.query.section_filter || '';

    var cons = "";
    var cons2 = "";
    if(layout_id!=""){
      cons = " AND o.layout_id='"+layout_id+"'";
      cons2 = " AND o.layout_id='"+layout_id+"'";
    }
    if(section_filter!=""){
      cons2 += " AND o.section_id='"+section_filter+"'";
    }
  
 
    try {
      
      const layout_sql = 'SELECT * FROM `layouts` WHERE id=?';
      const layoutData = await db.query(layout_sql, [layout_id]);


      const section_sql = `SELECT * FROM layout_sections o WHERE 1  ${cons} ORDER BY id`;
      const sections = await db.query(section_sql);

      const sqlCount = `SELECT COUNT(*) AS totalLayoutOpts FROM layout_options o LEFT JOIN layout_sections s ON o.section_id=s.id  WHERE 1 ${cons2} `;
      const [countRows] = await db.query(sqlCount);
      const totalLayoutOpts = countRows.totalLayoutOpts;

      const layoutopt_sql = `SELECT o.*, s.section_title FROM layout_options o LEFT JOIN layout_sections s ON o.section_id=s.id WHERE 1 ${cons2} ORDER BY section_id,  id LIMIT ? OFFSET ?`;
      const layoutOpts = await db.query(layoutopt_sql, [perPage, offset]);
   
  
      res.render("LayoutOption/index", {
        title: "Layout Options",
        layoutData: layoutData[0],
        sections: sections,
        layoutOpts: layoutOpts,
        section_filter: section_filter,
        baseUrl: baseUrl,
        paginationUrl:"layouts",
        currentPage: page,
        totalPages: Math.ceil(totalLayoutOpts/ perPage),
        message: req.flash("message"),
        error: req.flash("error"),
      });

    } catch (error) {
      console.error('Error fetching data:', error);
      res.redirect("back");
    }
   
  };
  
  exports.addLayoutOption = async (req, res) => {

    var layout_id = req.params.layout_id;

    const layout_sql = 'SELECT * FROM `layouts` WHERE id=?';
    const layoutData = await db.query(layout_sql, [layout_id]);

    const section_sql = 'SELECT * FROM `layout_sections` WHERE layout_id=?';
    const sectionList = await db.query(section_sql, [layout_id]);

    res.render("LayoutOption/add", {
      title: "Add Layout Option",
      layoutData: layoutData[0],
      sectionList: sectionList,
      message: req.flash("message"),
      error: req.flash("error"),
    });
  };
  
  exports.insertLayoutOption = async (req, res) => {
    
    const { layout_id, section_id, title, opttype, hint } = req.body;
    const status = 1; 

    var left_image = "";
    if(req.files.left_image){
      left_image = '/uploads/layouts/' + req.files.left_image[0].filename;
    }
    if(req.files.right_image){
      right_image = '/uploads/layouts/' + req.files.right_image[0].filename;
    }
    
    try {
      
      const sql = 'SELECT * FROM `layout_options` WHERE title=? AND section_id=?';
      const layout = await db.query(sql, [title, section_id]);
      if(layout.length === 0)
      {
        // insert data from the layout_options table
        const sql = "INSERT INTO `layout_options` SET layout_id=?, section_id=?, title=?, type=?, hint=?, left_image=?, right_image=?,  status='?'";
        const results = await db.query(sql, [layout_id, section_id, title,  opttype, hint, left_image, right_image, status]);

        if (results.insertId > 0) {
            console.log('Layout inserted:', results.insertId);
            req.flash("message", "Layout Option has been added successfully");
            res.redirect("/admin/layout/options/"+layout_id+"/?section_filter="+section_id);
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
  
  exports.editLayoutOption = async (req, res) => {

    var id = req.params.id;
    
    try {
      //check the id  is exists in layout_options table or not
      const sql = `SELECT o.*, s.section_title, l.title as layout_title FROM layout_options o
      LEFT JOIN layout_sections s ON s.id = o.section_id
      LEFT JOIN layouts l ON l.id = o.layout_id WHERE o.id = ?`;
      const optData = await db.query(sql, [id]);
      

      if(optData.length > 0)
      {

        res.render("LayoutOption/edit", {
          title: "Edit Layout Option",
          optData: optData[0],
          baseUrl: baseUrl,
          message: req.flash("message"),
          error: req.flash("error"),
        });
       

      }else{
          req.flash("error", "Sorry. No layout option records exists!");
          res.redirect("/admin/layouts");
      }

    } catch (error) {
      console.log('Error fetching data:', error);
      res.redirect("back");
    }

  
  };
  
  exports.updateLayoutOption = async (req, res) => {

    const {id, title, opttype, hint } = req.body;

    try {
      //check the id  is exists in layout table or not
      const sql = 'SELECT * FROM `layout_options` WHERE id=?';
      const layoutOpt = await db.query(sql, [id]);
      
      if(layoutOpt.length > 0)
      {

        var left_image = layoutOpt[0].left_image;
        var right_image = layoutOpt[0].right_image;
        var print_left_image = layoutOpt[0].print_left_image;
        var print_right_image = layoutOpt[0].print_right_image;
        if(req.files.left_image && left_image!="blank"){
          // Delete the old left_image image
          await delete_image(left_image);
          left_image = '/uploads/layouts/' + req.files.left_image[0].filename;
        }
        if(req.files.right_image && right_image!="blank"){
          // Delete the old right_image image
          await delete_image(right_image);
          right_image = '/uploads/layouts/' + req.files.right_image[0].filename;
        }
        if(req.files.print_left_image && print_left_image!="blank"){
          // Delete the old left_image image
          await delete_image(print_left_image);
          print_left_image = '/uploads/layouts/print/' + req.files.print_left_image[0].filename;
        }
        if(req.files.print_right_image && print_right_image!="blank"){
          // Delete the old right_image image
          await delete_image(print_right_image);
          print_right_image = '/uploads/layouts/print/' + req.files.print_right_image[0].filename;
        }

        // Update data into the layout_options table
        const sql = 'UPDATE `layout_options` SET title=?, type=?, hint=?, left_image=?, right_image=?, print_left_image=?, print_right_image=? WHERE id=?';
        const edit_results = await db.query(sql, [ title, opttype, hint, left_image, right_image, print_left_image, print_right_image, id]);
       
        if (edit_results.affectedRows > 0) {
            console.log('Layout option affected:', edit_results.affectedRows);
            req.flash("message", "Layout Option has been updated successfully");
            res.redirect("back");
        } else {
          console.log(edit_results);
          req.flash("error", "Layout Option record has not updated.");
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
  
  exports.deleteLayoutOption = async (req, res) => {
    var id = req.params.id;
    
    try {
      //check the id  is exists in layout_options table or not
      const sql = 'SELECT * FROM `layout_options` WHERE id = ?';
      const layoutOpt = await db.query(sql, [id]);
      if(layoutOpt.length > 0)
      {
        var left_image = layoutOpt[0].left_image;
        var right_image = layoutOpt[0].right_image;
        var print_left_image = layoutOpt[0].print_left_image;
        var print_right_image = layoutOpt[0].print_right_image;

        // Delete the old left_image image
        if (left_image && left_image!="blank") {
          await delete_image(left_image);
        }
         // Delete the old right_image image
        if (right_image && right_image!="blank") {
          await delete_image(right_image);
        }
        // Delete the old print_left_image image
        if (print_left_image && print_left_image!="blank") {
          await delete_image(print_left_image);
        }
         // Delete the old print_right_image image
        if (print_right_image && print_right_image!="blank") {
          await delete_image(print_right_image);
        }

         // Delete data from the layout_options table
         const opts_sql = 'DELETE FROM `layout_options` WHERE id=?';
         const opts_results = await db.query(opts_sql, [id]);

        if (opts_results.affectedRows > 0) {
          req.flash("message", "Layout Option has been deleted successfully.");
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
      req.flash("error", "Oops! Could not delete layout option.");
      res.redirect("back");
    }
    
  }
  
  exports.statusLayoutOption = async (req, res) => {
    var id = req.params.id;
    var status = req.params.status;

    try {
      //check the id  is exists in layout_options table or not
      const sql = 'SELECT * FROM `layout_options` WHERE id = ?';
      const layout = await db.query(sql, [id]);
      if(layout.length > 0)
      {
        
        // update status in the layout_options table
        const sql = "UPDATE `layout_options` SET status=?  WHERE id=?";
        const status_results = await db.query(sql, [status, id]);
    
        if (status_results.affectedRows > 0) {
          req.flash("message", "Layout Option status has been updated successfully.");
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

  exports.deleteLayoutOptionImage = async (req, res) => {
    var type = req.params.type;
    var id = req.params.id;
    
    try {
      //check the id is exists in layout_options table or not
      const sql = 'SELECT * FROM `layout_options` WHERE id = ?';
      const layoutOpt = await db.query(sql, [id]);
      if(layoutOpt.length > 0)
      {

        var col="";
        var title="";
        if(type=="left_image")
        {
          await delete_image(layoutOpt[0].left_image);
          title="Left image";
        }else if(type=="right_image"){
          await delete_image(layoutOpt[0].right_image);
          title="Right image";
        }else if(type=="print_left_image"){
          await delete_image(layoutOpt[0].print_left_image);
          title="Print left image";
        }else if(type=="print_right_image"){
          await delete_image(layoutOpt[0].print_right_image);
          title="Print right image";
        }

        // Delete data from the layout_options table
        const sql = `UPDATE layout_options SET ${type}="" WHERE id=?`;
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
      req.flash("error", "Oops! Could not delete layout option image.");
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


  exports.editRenewalOption = async (req, res) => {

    var id = req.params.id;
    
    try {
      //check the id  is exists in layout_options table or not
      const sql = `SELECT o.*, s.section_title, l.title as layout_title FROM layout_options o
      LEFT JOIN layout_sections s ON s.id = o.section_id
      LEFT JOIN layouts l ON l.id = o.layout_id WHERE o.id = ?`;
      const optData = await db.query(sql, ['320']);
      

      if(optData.length > 0)
      {

        res.render("LayoutOption/renewal-edit", {
          title: "Edit Renewal Option",
          optData: optData[0],
          baseUrl: baseUrl,
          message: req.flash("message"),
          error: req.flash("error"),
        });
       

      }else{
          req.flash("error", "Sorry. No Renewal option records exists!");
          res.redirect("/admin/renewal-template");
      }

    } catch (error) {
      console.log('Error fetching data:', error);
      res.redirect("back");
    }

  
  };
  
  exports.updateRenewalOption = async (req, res) => {

    const {id } = req.body;

    try {
      //check the id  is exists in layout table or not
      const sql = 'SELECT * FROM `layout_options` WHERE id=?';
      const layoutOpt = await db.query(sql, [id]);
      
      if(layoutOpt.length > 0)
      {

        var print_left_image = layoutOpt[0].print_left_image;
        var print_right_image = layoutOpt[0].print_right_image;
        if(req.files.print_left_image && print_left_image!="blank"){
          // Delete the old left_image image
          await delete_image(print_left_image);
          print_left_image = '/uploads/layouts/print/' + req.files.print_left_image[0].filename;
        }
        if(req.files.print_right_image && print_right_image!="blank"){
          // Delete the old right_image image
          await delete_image(print_right_image);
          print_right_image = '/uploads/layouts/print/' + req.files.print_right_image[0].filename;
        }

        // Update data into the layout_options table
        const sql = 'UPDATE `layout_options` SET print_left_image=?, print_right_image=? WHERE id=?';
        const edit_results = await db.query(sql, [ print_left_image, print_right_image, id]);
       
        if (edit_results.affectedRows > 0) {
            console.log('Renewal templates affected:', edit_results.affectedRows);
            req.flash("message", "Renewal templates has been updated successfully");
            res.redirect("back");
        } else {
          console.log(edit_results);
          req.flash("error", "Renewal templates  has not updated.");
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

  exports.deleteRenewalImage = async (req, res) => {
    var type = req.params.type;
    var id = req.params.id;
    
    try {
      //check the id is exists in layout_options table or not
      const sql = 'SELECT * FROM `layout_options` WHERE id = ?';
      const layoutOpt = await db.query(sql, [id]);
      if(layoutOpt.length > 0)
      {

        var col="";
        var title="";
        if(type=="print_left_image"){
          await delete_image(layoutOpt[0].print_left_image);
          title="Print left image";
        }else if(type=="print_right_image"){
          await delete_image(layoutOpt[0].print_right_image);
          title="Print right image";
        }

        // Delete data from the layout_options table
        const sql = `UPDATE layout_options SET ${type}="" WHERE id=?`;
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
      req.flash("error", "Oops! Could not delete layout option image.");
      res.redirect("back");
    }
    
  }