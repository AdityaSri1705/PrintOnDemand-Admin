const db = require('../../database/db');
const crypto = require('../../services/crypto');
require("dotenv").config();
const path = require('path');
const fs = require('fs/promises');
const baseUrl = process.env.BASEURL;

exports.getAllOrders = async (req, res) => {
    var page = req.query.page || 1;
    var perPage = 20;
    var offset = (page-1)*perPage;
 
    try {
      const sqlCount = 'SELECT COUNT(*) AS totalOrders FROM `orders` o LEFT JOIN `users` u ON u.id=o.user_id LEFT JOIN `order_status` s ON s.id=o.order_status_id WHERE s.id>0 AND payment_status=1';
      const [countRows] = await db.query(sqlCount);
      const totalOrders = countRows.totalOrders;

      //check the email id  is exists in order table or not
      const sql = 'SELECT o.*, u.first_name, u.last_name, s.title as status_title FROM `orders` o  LEFT JOIN `users` u ON u.id=o.user_id LEFT JOIN `order_status` s ON s.id=o.order_status_id WHERE s.id>0 AND payment_status=1 ORDER BY id DESC LIMIT ? OFFSET ?';
      const orders = await db.query(sql, [perPage, offset]);
     
      res.render("Orders/index", {
        title: "Orders",
        orders: orders,
        baseUrl: baseUrl,
        paginationUrl:"orders",
        currentPage: page,
        totalPages: Math.ceil(totalOrders/ perPage),
        message: req.flash("message"),
        error: req.flash("error"),
      });

    } catch (error) {
      console.error('Error fetching data:', error);
      res.redirect("back");
    }
   
  };
  
  
  
  
  
  exports.viewOrder = async (req, res) => {

    var order_id = req.params.id;
    
    try {
      //check the email id  is exists in order table or not
      const sql = 'SELECT o.*, u.first_name, u.last_name, s.title as status_title FROM `orders` o  LEFT JOIN `users` u ON u.id=o.user_id LEFT JOIN `order_status` s ON s.id=o.order_status_id WHERE o.id = ?';
      const order = await db.query(sql, [order_id]);
      if(order.length > 0)
      {

        const items_sql = "SELECT o.*, c.title as cover_title, c.front_image, c.cover_pdf FROM `order_items` o LEFT JOIN `cover_items` c ON o.cover_id=c.id WHERE order_id=?";
        const orderItems = await db.query(items_sql, [order_id]);

        const itemstatus_sql = "SELECT * FROM `order_status`";
        const orderStatus = await db.query(itemstatus_sql);

        res.render("Orders/view", {
          title: "Order Detail",
          order: order[0],
          orderItems: orderItems,
          orderStatus: orderStatus,
          baseUrl: baseUrl,
          message: req.flash("message"),
          error: req.flash("error"),
        });

      }else{
          req.flash("error", "Sorry. No order records exists!");
          res.redirect("/admin/orders");
      }

    } catch (error) {
      console.log('Error fetching data:', error);
      res.redirect("back");
    }

  
  };
  
  exports.updateOrder = async (req, res) => {
    
    const { id, status_id, status_reason } = req.body;
    console.log(req.body);
    console.log(id, status_id, status_reason)
    try {
      //check the email id  is exists in order table or not
      const sql = 'SELECT * FROM `orders` WHERE id=?';
      const order = await db.query(sql, [id]);
      
      if(order.length > 0)
      {

        // Update data into the order table
        const sql = 'UPDATE `orders` SET order_status_id=?, notes=? WHERE id=?';
        const edit_results = await db.query(sql, [status_id, status_reason, id]);

        const status_sql = 'INSERT INTO `order_status_log` SET order_id=?, status_id=?, notes=?';
        const add_results = await db.query(status_sql, [id, status_id, status_reason]);
       
        if (edit_results.affectedRows > 0) {
            console.log('Order affected:', edit_results.affectedRows);
            req.flash("message", "Order has been updated successfully");
            res.redirect("back");
        } else {
          console.log(edit_results);
          req.flash("error", "Order record has not updated");
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
  
  exports.deleteOrder = async (req, res) => {
    var id = req.params.id;
    
    try {
      //check the email id  is exists in order table or not
      const sql = 'SELECT * FROM `orders` WHERE id = ?';
      const order = await db.query(sql, [id]);
      if(order.length > 0)
      {

        var profile_img = order[0].profile_img;
        var banner_img = order[0].banner;

        // Delete the old profile image
        if (profile_img) {
          const oldProfileImagePath = path.join(__dirname, '../../public/', profile_img);
          try {
            await fs.access(oldProfileImagePath); // Check if the file exists
            await fs.unlink(oldProfileImagePath); // Delete the file
          } catch (err) {
            console.error('Error deleting old image:', err);
          }
        }

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

        // Delete data from the order table
        const sql = 'DELETE FROM `orders` WHERE id=?';
        const edit_results = await db.query(sql, [id]);
       
        if (edit_results.affectedRows > 0) {
          req.flash("message", "Order has been deleted succesfully.");
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
      req.flash("error", "Oops! Could not delete order.");
      res.redirect("back");
    }
    
  }
  
  exports.statusOrder = async (req, res) => {
    var id = req.params.id;
    var status = req.params.status;

    try {
      //check the email id  is exists in order table or not
      const sql = 'SELECT * FROM `orders` WHERE id = ?';
      const order = await db.query(sql, [id]);
      if(order.length > 0)
      {
        
        // update status in the order table
        const sql = "UPDATE `orders` SET status=?  WHERE id=?";
        const status_results = await db.query(sql, [status, id]);
    
        if (status_results.affectedRows > 0) {
          req.flash("message", "Order status has been updated succesfully.");
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
  exports.pendingOrder = async (req, res) => {
    var id = req.params.id;

    var statusCode = 1;

    try {
      //check the email id  is exists in order table or not
      const sql = 'SELECT * FROM `orders` WHERE id = ?';
      const order = await db.query(sql, [id]);
      if(order.length > 0)
      {
        
        // update status in the order table
        const sql = "UPDATE `orders` SET status='?'  WHERE id=?";
        const status_results = await db.query(sql, [statusCode, id]);
    
        if (status_results.affectedRows > 0) {
          req.flash("message", "Order  has been approved succesfully.");
          res.redirect("back");
        }else{
          req.flash("error", `Sorry! Could approved with id ${id}.`);
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

  exports.deleteOrderImage = async (req, res) => {
    var id = req.params.id;
    var type = req.params.type;
    
    try {
      //check the id is exists in orders table or not
      const sql = 'SELECT * FROM `orders` WHERE id = ?';
      const order = await db.query(sql, [id]);
      if(order.length > 0)
      {
        if(type=="banner"){
          var banner_img = order[0].banner;

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
          // Delete data from the order table
          const sql = 'UPDATE `orders` SET banner="" WHERE id=?';
          const edit_results = await db.query(sql, [id]);

          if (edit_results.affectedRows > 0) {
            req.flash("message", "Banner image has been deleted succesfully.");
            res.redirect("back");
          }else{
            req.flash("error", `Sorry! Could not delete with id ${id}.`);
            res.redirect("back");
          }

        }else{
          var profile_img = order[0].profile_img;

          // Delete the old banner image
          if (profile_img) {
            const oldBannerImagePath = path.join(__dirname, '../../public/', profile_img);
            try {
              await fs.access(oldBannerImagePath); // Check if the file exists
              await fs.unlink(oldBannerImagePath); // Delete the file
            } catch (err) {
              console.error('Error deleting old image:', err);
            }
          }

          // Delete data from the order table
          const sql = 'UPDATE `orders` SET profile_img="" WHERE id=?';
          const edit_results = await db.query(sql, [id]);

          if (edit_results.affectedRows > 0) {
            req.flash("message", "Profile image has been deleted succesfully.");
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
      req.flash("error", "Oops! Could not delete banner image.");
      res.redirect("back");
    }
    
  }