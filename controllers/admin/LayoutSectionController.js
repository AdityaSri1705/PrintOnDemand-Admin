const db = require('../../database/db');
require("dotenv").config();
const path = require('path');
const fs = require('fs/promises');
const baseUrl = process.env.BASEURL;

exports.getAllLayoutSections = async (req, res) => {
    var page = req.query.page || 1;
    var perPage = 20;
    var offset = (page-1)*perPage;
    var layout_id = req.params.layout_id
 
    try {
      const sqlCount = 'SELECT COUNT(*) AS totalSections FROM `layout_sections` WHERE layout_id=?';
      const [countRows] = await db.query(sqlCount,[layout_id]);
      const totalSections = countRows.totalSections;

      const layout_sql = 'SELECT * FROM `layouts` WHERE id=?';
      const layoutData = await db.query(layout_sql, [layout_id]);
      
      const section_sql = 'SELECT * FROM `layout_sections` WHERE layout_id=? LIMIT ? OFFSET ?';
      const sections = await db.query(section_sql, [layout_id, perPage, offset]);

      
      const fetchPromises =  sections.map( async (row)=>{
        const idList = row.default_val.split(',').map(Number);
        const opts_sql = 'SELECT title FROM `layout_options` WHERE id IN (?)';
        const opts = await db.query(opts_sql, [idList]);
        const titles = opts.map((result) => result.title).join(', ');
        row.default_title = titles;
      });

      await Promise.all(fetchPromises); 
      //console.log(sections);
     

      res.render("LayoutSection/index", {
        title: "Sections",
        sections: sections,
        layoutData: layoutData[0],
        layout_id: layout_id,
        baseUrl: baseUrl,
        paginationUrl:"sections",
        currentPage: page,
        totalPages: Math.ceil(totalSections/ perPage),
        message: req.flash("message"),
        error: req.flash("error"),
      });

    } catch (error) {
      console.error('Error fetching data:', error);
      res.redirect("back");
    }
   
  };
  
  exports.addLayoutSection = async (req, res) => {
    var layout_id = req.params.layout_id;

    const layout_sql = 'SELECT * FROM `layouts` WHERE id=?';
    const layoutData = await db.query(layout_sql, [layout_id]);

    res.render("LayoutSection/add", {
      title: "Add Layout Section",
      layoutData: layoutData[0],
      layout_id: layout_id,
      message: req.flash("message"),
      error: req.flash("error"),
    });
  };
  
  exports.insertLayoutSection = async (req, res) => {
    
    const { title, layout_id } = req.body;
    const status = 1; 
    const default_val = '';

    try {
      //check the email id  is exists in layout_sections table or not
      const sql = 'SELECT * FROM `layout_sections` WHERE section_title=? AND layout_id=?';
      const section = await db.query(sql, [title, layout_id]);
      if(section.length === 0)
      {
        // insert data from the layout_sections table
        const sql = "INSERT INTO `layout_sections` SET section_title=?, layout_id=?, default_val=?, status='?'";
        const results = await db.query(sql, [title, layout_id, default_val, status]);

        if (results.insertId > 0) {
            console.log('Section inserted:', results.insertId);
            req.flash("message", "Layout section has been added successfully");
            res.redirect("/admin/layout/sections/"+layout_id);
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
  
  exports.editLayoutSection = async (req, res) => {

    var section_id = req.params.id;
    
    try {

     

      //check the email id  is exists in layout_sections table or not
      const sql = 'SELECT s.*, l.page, l.title as layout_title, l.slug as layout_slug FROM `layout_sections` s, `layouts` l WHERE s.layout_id=l.id AND s.id = ?';
      const section = await db.query(sql, [section_id]);

      const layoutopt_sql = `SELECT * FROM layout_options  WHERE section_id=? ORDER BY sequence ASC, id ASC`;
      var layoutOpts = await db.query(layoutopt_sql, [section_id]);
      if(layoutOpts.length===0){
        const layoutopt_sql2 = `SELECT * FROM layout_options  WHERE section_id=? ORDER BY sequence ASC, id ASC`;
        layoutOpts = await db.query(layoutopt_sql2, [section[0].clone_section]);
      }

      if(section.length > 0)
      {

        res.render("LayoutSection/edit", {
          title: "Edit Layout Section",
          section: section[0],
          layoutOpts:layoutOpts,
          baseUrl: baseUrl,
          message: req.flash("message"),
          error: req.flash("error"),
        });

      }else{
          req.flash("error", "Sorry. No section records exists!");
          res.redirect("/admin/cover/sections");
      }

    } catch (error) {
      console.log('Error fetching data:', error);
      res.redirect("back");
    }

  
  };
  
  exports.updateLayoutSection = async (req, res) => {

    const { id, title, layout_id, default_val} = req.body;

    try {
      //check the email id  is exists in layout_sections table or not
      const sql = 'SELECT * FROM `layout_sections` WHERE id=?';
      const section = await db.query(sql, [id]);
      
      if(section.length > 0)
      {

        // Update data into the layout_sections table
        const sql = 'UPDATE `layout_sections` SET section_title=? WHERE id=?';
        const edit_results = await db.query(sql, [title, id]);

        if(default_val!=""){
          var default_value = [];
          if (Array.isArray(default_val)){
            var default_value = default_val.join(',');
          }else{
            var default_value = default_val;
          }
          
          const sql = 'UPDATE `layout_sections` SET default_val=? WHERE id=?';
          const edit_results = await db.query(sql, [default_value, id]);
        }
       
        if (edit_results.affectedRows > 0) {
            console.log('Section affected:', edit_results.affectedRows);
            req.flash("message", "Layout section has been updated successfully");
            res.redirect("back");
        } else {
          console.log(edit_results);
          req.flash("error", "Layout section record has not updated.");
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
  
  exports.deleteLayoutSection = async (req, res) => {
    var id = req.params.id;
    
    try {
      //check the email id  is exists in layout_sections table or not
      const sql = 'SELECT * FROM `layout_sections` WHERE id = ?';
      const section = await db.query(sql, [id]);
      if(section.length > 0)
      {

        // Delete data from the layout_sections table
        const sql = 'DELETE FROM `layout_sections` WHERE id=?';
        const edit_results = await db.query(sql, [id]);
       
        if (edit_results.affectedRows > 0) {
          req.flash("message", "Layout section has been deleted successfully.");
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
      req.flash("error", "Oops! Could not delete layout section.");
      res.redirect("back");
    }
    
  }
  
  exports.statusLayoutSection = async (req, res) => {
    var id = req.params.id;
    var status = req.params.status;

    try {
      //check the email id  is exists in layout_sections table or not
      const sql = 'SELECT * FROM `layout_sections` WHERE id = ?';
      const section = await db.query(sql, [id]);
      if(section.length > 0)
      {
        
        // update status in the layout_sections table
        const sql = "UPDATE `layout_sections` SET status=?  WHERE id=?";
        const status_results = await db.query(sql, [status, id]);
    
        if (status_results.affectedRows > 0) {
          req.flash("message", "Layout section status has been updated successfully.");
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

  