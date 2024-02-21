var express = require("express");
var bodyParser = require("body-parser");
var urlencodeParser = bodyParser.urlencoded({ extended: false });
const db = require('../../database/db');
const cookie = require('cookie');
const crypto = require('../../services/crypto');
var validator = require("express-validator");
const transporter = require('../../services/mailer');


module.exports = function (app) {
    

  app.get("/login", function (req, res) {

    //getting rememberMe cookie
    const cookies = cookie.parse(req.headers.cookie || '');
    const rememberMe = cookies.rememberMe? cookies.rememberMe:'';
    var email = '';
    var pass = '';
    if(rememberMe!=''){
      var remember_text =  crypto.decrypt(cookies.rememberMe).split(';');
      var email = remember_text[0].split('=')[1];
      var pass = remember_text[1].split('=')[1];
    }
      
    res.render("Auth/auth-login", {
      message: req.flash("message"),
      error: req.flash("error"),
      email: email,
      pass: pass,
      rememberMe: rememberMe? rememberMe:0
    });
  });

  app.post("/post-login", urlencodeParser, async (req, res) => {
    
    var admin_email = req.body.email ;
    var admin_password = req.body.password;
    var remember_me = req.body.remember_me? req.body.remember_me:0;

    
    try {
      // Fetch data from the database
      const sql = 'SELECT * FROM `admins` WHERE email = ?';
      const rows = await db.query(sql, [admin_email]);
      
      if (rows.length === 0) {
          req.flash("error", "Sorry. This email is not exists!");
         // res.redirect("/login");
      } else {
       var user = rows[0];
        const hashedPassword = crypto.encrypt(admin_password);
        if(user.password==hashedPassword){
  
          if (user.status == 1) {
            user.role = 'Admin';
            
            // Assign value in session
            sess = req.session;
            sess.user = user;
            
            if(remember_me){
              var remember_text = crypto.encrypt("email="+admin_email+";password="+admin_password);
              
              // Set a long-lived cookie with the token
              res.setHeader('Set-Cookie', cookie.serialize('rememberMe', remember_text, {
                expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production', // Use secure cookie in production
                sameSite: 'strict'
              }));
              
            }
      
            res.redirect("/");
          } else {
            req.flash("error", "Your account has been disabled. Please contact to administrator.");
            res.redirect("/login");
          }
        }else{
          req.flash("error", "Incorrect email or password!");
          res.redirect("/login");
        }
        
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      res.status(500).send('Internal Server Error');
    }
    
  });

  app.get("/forgot-password", function (req, res) {
    res.render("Auth/auth-forgot-password", {
      message: req.flash("message"),
      error: req.flash("error"),
    });
  });

  app.post("/post-forgot-password", urlencodeParser, async (req, res) => {

    var admin_email = req.body.email ;

    // Fetch data from the database
    const sql = 'SELECT * FROM `admins` WHERE email = ?';
    const admin = await db.query(sql, [admin_email]);

    if (admin && admin.length > 0) {

      const password = crypto.decrypt(admin[0].password)
      const mailOptions = {
          from: process.env.SMTP_FROM_EMAIL,
          to: admin[0].email,
          subject: 'Forgot Password',
          html: `
          <h1>Dear ${admin[0].name} </h1>
          <p> These are your login cretential:</p>
          <p>Username: ${admin[0].email}</p>
          <p>Password: ${password} </p>
          <p>If you didn't sign up for this service, you can ignore this email.</p>
          <p>Thank You</p>
          <p>Support Team</p>
          `,
      };
     
      transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
              //console.log(error);
              req.flash("error", "Error sending email");
              res.redirect("/forgot-password");
          } else {
              //console.log('Email sent: ' + info.response); 
              req.flash("message", "We have e-mailed your password reset link!");
              res.redirect("/forgot-password");
          }
      });
      req.flash("message", "We have e-mailed your password reset link!");
      res.redirect("/forgot-password");
    } else {
      req.flash("error", "Sorry. This email is not exists!");
      res.redirect("/forgot-password");
    } 
  });

  app.get("/logout", function (req, res) {
    // Assign  null value in session
    sess = req.session;
    sess.user = null;

    res.redirect("/login");
  });
};
