const db = require('../../database/db');
require("dotenv").config();
const path = require('path');
const csv = require('csv-parser');
const fs = require('fs');
const baseUrl = process.env.BASEURL;

exports.getAllQuotes = async (req, res) => {
    var page = req.query.page || 1;
    var perPage = 20;
    var offset = (page-1)*perPage;
    const quote_id =  req.params.id;

    try {
      
      const sqlCount = `SELECT COUNT(*) AS totalQuotes FROM  quotes `;
      const [countRows] = await db.query(sqlCount);
      const totalQuotes = countRows.totalQuotes;

      const sql = `SELECT * FROM quotes  ORDER BY created_at DESC LIMIT ? OFFSET ?`;
      const quotes = await db.query(sql, [perPage, offset]);
  

      res.render("Quotes/index", {
        title: "Quotes",
        quoteData: quotes,
        baseUrl: baseUrl,
        paginationUrl:"Quote",
        currentPage: page,
        totalPages: Math.ceil(totalQuotes/ perPage),
        message: req.flash("message"),
        error: req.flash("error"),
      });

    } catch (error) {
      console.error('Error fetching data:', error);
      res.redirect("back");
    }
   
  };
  
  exports.addQuote = async (req, res) => {

    res.render("Quotes/add", {
      title: "Add Quote",
      message: req.flash("message"),
      error: req.flash("error"),
    });
  };
  
  exports.insertQuote = async (req, res) => {
    
    const {  quote_id, quote, author } = req.body;
    const status = 1; 
    var count = 0;
    var skip_titles =[];

   // console.log(quote_id, title, event_date)
    try {
      for(i=0; i<10; i++){
        var squote = quote[i];
        var sauthor = author[i];

        if(squote!=="" && sauthor!==""){
           //check the  quote  is exists in  quotes table or not
          const sql = 'SELECT * FROM `quotes` WHERE quote_text=?';
          const result = await db.query(sql, [squote]);
          if(result.length === 0)
          {
            // insert data from the  quotes table
            const len = squote.length;
            var type = 0;
            if(len>75){
              type=3;
            }else if(len>51 && len<=75){
              type=2;
            }else{
              type=1;
            }
            const sql = "INSERT INTO `quotes` SET quote_text=?, author=?, characters=?, type=?, status='?'";
            const results = await db.query(sql, [squote, sauthor, len, type, status]);
            console.log('Quote inserted:', results.insertId);
            count++;
          }else{
            skip_titles.push(stitle);
          }
        }
      
      }

      var msg = "";
      var errmsg = "";
      if (count > 0) {
          msg =`Quotes  have been added successfully`;
          req.flash("message", msg);
          if(skip_titles.length>0){
            errmsg =`Sorry. ${skip_titles.join(', ')} quote(s) are already exists!`;
          }
          req.flash("error", errmsg);
          res.redirect("/admin/quotes/");
      } else {
        if(skip_titles.length>0){
          msg =`Sorry. ${skip_titles.join(', ')} quote(s) are already exists!`;
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
  
  exports.editQuote = async (req, res) => {

    var id = req.params.id;
    
    try {

      //check the id  is exists in  quotes table or not
      const sql = 'SELECT * FROM `quotes` WHERE id = ?';
      const quoteData = await db.query(sql, [id]);
      if(quoteData.length > 0)
      {

        res.render("Quotes/edit", {
          title: "Edit Quote",
          quoteData: quoteData[0],
          baseUrl: baseUrl,
          message: req.flash("message"),
          error: req.flash("error"),
        });

      }else{
          req.flash("error", "Sorry. No quote records exists!");
          res.redirect("/admin/quotes/");
      }

    } catch (error) {
      console.log('Error fetching data:', error);
      res.redirect("back");
    }

  
  };
  
  exports.updateQuote = async (req, res) => {

    const { id,  quote, author } = req.body;

    try {
      //check the id  is exists in  quotes table or not
      const sql = 'SELECT * FROM `quotes` WHERE id=?';
      const result = await db.query(sql, [id]);
      
      if(result.length > 0)
      {
        const len = quote.length;
        var type = 0;
        if(len>75){
          type=3;
        }else if(len>51 && len<=75){
          type=2;
        }else{
          type=1;
        }
        // Update data into the  quotes table
        const sql = 'UPDATE `quotes` SET quote_text=?, author=?, characters=?, type=? WHERE id=?';
        const edit_results = await db.query(sql, [quote, author, len, type, id]);
       
        if (edit_results.affectedRows > 0) {
            console.log('Quote affected:', edit_results.affectedRows);
            req.flash("message", "Quote has been updated successfully");
            res.redirect("back");
        } else {
          console.log(edit_results);
          req.flash("error", "Quote record has not updated.");
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
  
  exports.deleteQuote = async (req, res) => {
    var id = req.params.id;
    
    try {
      //check the  id  is exists in  quotes table or not
      const sql = 'SELECT * FROM `quotes` WHERE id = ?';
      const result = await db.query(sql, [id]);
      if(result.length > 0)
      {
      
        // Delete data from the  quotes table
        const sql = 'DELETE FROM `quotes` WHERE id=?';
        const edit_results = await db.query(sql, [id]);
       
        if (edit_results.affectedRows > 0) {
          req.flash("message", "Quote has been deleted successfully.");
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
  
  exports.statusQuote = async (req, res) => {
    var id = req.params.id;
    var status = req.params.status;

    try {
      //check the id  is exists in  quotes table or not
      const sql = 'SELECT * FROM `quotes` WHERE id = ?';
      const result = await db.query(sql, [id]);
      if(result.length > 0)
      {
        
        // update status in the  quotes table
        const sql = "UPDATE `quotes` SET status=?  WHERE id=?";
        const status_results = await db.query(sql, [status, id]);
    
        if (status_results.affectedRows > 0) {
          req.flash("message", "Quote status has been updated successfully.");
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
  
  exports.addQuoteCSV = async (req, res) => {


    res.render("Quotes/import", {
      title: "Import Quotes",
      message: req.flash("message"),
      error: req.flash("error"),
    });
  };

  
  exports.importQuoteCSV = async (req, res) => {
    
    const status = 1; 
    var skip_titles = [];
    var promises = [];
    var count = 0;
    const csvFile = 'public/uploads/quotecsv/' + req.files.quote_csv[0].filename;
    
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
          console.log(index, row.Quote, row.Author, row.Gender, row.Characters);
          //check the  title  is exists in  quote_dates table or not
          //const sql = 'SELECT * FROM `quote_dates` WHERE title=? AND quote_id=?';
          //const hdate = await db.query(sql, [row.title, quote_id]);
          //if(hdate.length === 0)
          //{
            if(row.Quote!=""){
              // insert data from the  quotes table
              const len = row.Quote.length;
              var type = 0;
              if(len>75){
                type=3;
              }else if(len>51 && len<=75){
                type=2;
              }else{
                type=1;
              }
              const sql = "INSERT INTO `quotes` SET quote_text=?, author=?, characters=?, type=?, status='?'";
              const results = await db.query(sql, [row.Quote, row.Author, len, type, status]);
              count++;
            }

        });

        await Promise.all(promises);
        console.log("count=>",count, skip_titles);
        var msg = "";
        var err_msg = "";
        if (count > 0) {
            msg =`${count} Quotes have been added successfully`;
            req.flash("message", msg);
          res.redirect("/admin/quote/import");
        } else {
          if(skip_titles.length>0){
            console.log(msg);
            msg =`Sorry. ${skip_titles.join(', ')} quote(s) are already exists!`;
          }
          req.flash("error", msg);
          //res.redirect("back");
          res.redirect("/admin/quote/import");
        }
       
      });
     
      

    } catch (error) {
      req.flash("error", 'Error fetching data:', error);
      console.log('Error fetching data:', error);
      res.redirect("back");
    }
  
    
  };
  