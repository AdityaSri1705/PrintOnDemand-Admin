const db = require('../../database/db');
require("dotenv").config();
const path = require('path');
const csv = require('csv-parser');
const fs = require('fs');
const baseUrl = process.env.BASEURL;

exports.getAllCoupons = async (req, res) => {
    var page = req.query.page || 1;
    var perPage = 20;
    var offset = (page-1)*perPage;
    const coupon_id =  req.params.id;

    try {
      
      const sqlCount = `SELECT COUNT(*) AS totalCoupons FROM  coupons`;
      const [countRows] = await db.query(sqlCount,[coupon_id]);
      const totalCoupons = countRows.totalCoupons;

      const sql = `SELECT * FROM coupons ORDER BY expiry_date ASC LIMIT ? OFFSET ?`;
      const coupons = await db.query(sql, [perPage, offset]);

      res.render("Coupons/index", {
        title: "Coupon Dates",
        coupons: coupons,
        baseUrl: baseUrl,
        paginationUrl:"Coupons",
        currentPage: page,
        totalPages: Math.ceil(totalCoupons/ perPage),
        message: req.flash("message"),
        error: req.flash("error"),
      });

    } catch (error) {
      console.error('Error fetching data:', error);
      res.redirect("back");
    }
   
  };
  
  exports.addCoupon = async (req, res) => {

    const coupon_id =  req.params.id;



    res.render("Coupons/add", {
      title: "Add Coupon",
      message: req.flash("message"),
      error: req.flash("error"),
    });
  };
  
  exports.insertCoupon = async (req, res) => {
    
    const { code, expiry_date, discount_amount, discount_type, user_limit, item_limit } = req.body;
    const status = 1; 
    var count = 0;
    var skip_codes =[];

   // console.log(coupon_id, title, event_date)
    try {
      for(i=0; i<10; i++){
        var scode = code[i];
        var sexpiry_date = expiry_date[i];
        var sdiscount_amount = discount_amount[i];
        var sdiscount_type = discount_type[i];
        var suser_limit = user_limit[i];
        var sitem_limit = item_limit[i];
        if(scode!=="" && sexpiry_date!=="" && sdiscount_amount!==""){
           //check the  title  is exists in  coupons table or not
          const sql = 'SELECT * FROM `coupons` WHERE code=?';
          const coupon = await db.query(sql, [scode]);
          if(coupon.length === 0)
          {
            // insert data from the  coupons table
            const sql = "INSERT INTO `coupons` SET code=?, expiry_date=?, discount_amount=?, discount_type=?, user_limit=?, item_limit=?";
            const results = await db.query(sql, [scode, sexpiry_date, sdiscount_amount, sdiscount_type, suser_limit, sitem_limit]);
            console.log('Coupon date inserted:', results.insertId);
            count++;
          }else{
            skip_codes.push(scode);
          }
        }
      
      }

      var msg = "";
      var errmsg = "";
      if (count > 0) {
          msg =`Coupon has been added successfully`;
          req.flash("message", msg);
          if(skip_codes.length>0){
            errmsg =`Sorry. ${skip_codes.join(', ')} codes(s) are already exists!`;
          }
          req.flash("error", errmsg);
          res.redirect("/admin/coupons");
      } else {
        if(skip_codes.length>0){
          msg =`Sorry. ${skip_codes.join(', ')} code(s) are already exists!`;
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
  
  exports.editCoupon = async (req, res) => {

    var id = req.params.id;
    
    try {

      //check the id  is exists in coupons table or not
      const sql = 'SELECT * FROM `coupons` WHERE id = ?';
      const couponData = await db.query(sql, [id]);
      if(couponData.length > 0)
      {

        res.render("Coupons/edit", {
          title: "Edit Coupon",
          couponData: couponData[0],
          baseUrl: baseUrl,
          message: req.flash("message"),
          error: req.flash("error"),
        });

      }else{
          req.flash("error", "Sorry. No coupon records exists!");
          res.redirect("/admin/coupons");
      }

    } catch (error) {
      console.log('Error fetching data:', error);
      res.redirect("back");
    }

  
  };
  
  exports.updateCoupon = async (req, res) => {

    const { id, code, expiry_date, discount_amount, discount_type, user_limit, item_limit } = req.body;

    try {
      //check the id  is exists in  coupons table or not
      const sql = 'SELECT * FROM `coupons` WHERE id=?';
      const addin = await db.query(sql, [id]);
      
      if(addin.length > 0)
      {

        // Update data into the  coupons table
        const sql = 'UPDATE `coupons` SET  code=?, expiry_date=?, discount_amount=?, discount_type=?, user_limit=?, item_limit=? WHERE id=?';
        const edit_results = await db.query(sql, [ code, expiry_date, discount_amount, discount_type, user_limit, item_limit, id]);
       
        if (edit_results.affectedRows > 0) {
            console.log('Coupon affected:', edit_results.affectedRows);
            req.flash("message", "Coupon has been updated successfully");
            res.redirect("back");
        } else {
          console.log(edit_results);
          req.flash("error", "Coupon record has not updated.");
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
  
  exports.deleteCoupon = async (req, res) => {
    var id = req.params.id;
    
    try {
      //check the  id  is exists in  coupons table or not
      const sql = 'SELECT * FROM `coupons` WHERE id = ?';
      const addin = await db.query(sql, [id]);
      if(addin.length > 0)
      {
      
        // Delete data from the  coupons table
        const sql = 'DELETE FROM `coupons` WHERE id=?';
        const edit_results = await db.query(sql, [id]);
       
        if (edit_results.affectedRows > 0) {
          req.flash("message", "Coupon has been deleted successfully.");
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
  
  exports.statusCoupon = async (req, res) => {
    var id = req.params.id;
    var status = req.params.status;

    try {
      //check the id  is exists in  coupons table or not
      const sql = 'SELECT * FROM ` coupons` WHERE id = ?';
      const addin = await db.query(sql, [id]);
      if(addin.length > 0)
      {
        
        // update status in the  coupons table
        const sql = "UPDATE ` coupons` SET status=?  WHERE id=?";
        const status_results = await db.query(sql, [status, id]);
    
        if (status_results.affectedRows > 0) {
          req.flash("message", "Coupon status has been updated successfully.");
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
  
  exports.addCouponCSV = async (req, res) => {

    const coupon_id =  req.params.id;


    res.render("Coupons/import", {
      title: "Import Coupon",
      message: req.flash("message"),
      error: req.flash("error"),
    });
  };

  
  exports.importCouponCSV = async (req, res) => {
    
    const {  coupon_id } = req.body;
    const status = 1; 
    var skip_codes = [];
    var promises = [];
    var count = 0;
    const csvFile = 'public/uploads/coupon_csv/' + req.files.coupon_csv[0].filename;
    
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
          console.log("Records=>",index, row.Code, row.ExpiryDate, row.DiscountAmount, row.DiscountType, row.UserLimit, row.ItemLimit);
          const formattedExpiryDate = convertDateFormat(row.ExpiryDate);
          //check the  coupon code  is exists in  coupons table or not
          const sql = 'SELECT * FROM `coupons` WHERE code=?';
          const existCode = await db.query(sql, [row.Code]);
          if(existCode.length === 0)
          {
            if(row.Coupon!=""){
              // insert data from the  coupons table
              const sql = "INSERT INTO `coupons` SET  code=?, expiry_date=?, discount_amount=?, discount_type=?, user_limit=?, item_limit=?, status='?'";
              const results = await db.query(sql, [ row.Code,  formattedExpiryDate, row.DiscountAmount, row.DiscountType, row.UserLimit, row.ItemLimit, status]);
              count++;
            }
          }else{
            skip_codes.push(row.Code);
          }

        });

        await Promise.all(promises);
        console.log("count=>",count, skip_codes);
        var msg = "";
        var err_msg = "";
        if (count > 0) {
            msg =`${count} Coupon has been added successfully`;
            req.flash("message", msg);
          res.redirect("/admin/coupon/import");
        } else {
          if(skip_codes.length>0){
            console.log(msg);
            msg =`Sorry. ${skip_codes.join(', ')} code(s) are already exists!`;
          }
          req.flash("error", msg);
          //res.redirect("back");
          res.redirect("/admin/coupon/import");
        }
       
      });
     
      

    } catch (error) {
      req.flash("error", 'Error fetching data:', error);
      console.log('Error fetching data:', error);
      res.redirect("back");
    }
  
    
  };

  // Define a function to convert date format
function convertDateFormat(dateString) {
  // Assuming the date string is in 'M/D/YYYY' format
  const parts = dateString.split('/');
  const formattedDate = `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
  return formattedDate;
}
  