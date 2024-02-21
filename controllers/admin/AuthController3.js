var express = require("express");
var bodyParser = require("body-parser");
var urlencodeParser = bodyParser.urlencoded({ extended: false });
const db = require('../../database/db');
const cookie = require('cookie');
const crypto = require('../../services/crypto');
var validator = require("express-validator");
const router = express.Router();

var axios = require("axios");
var MockAdapter = require("axios-mock-adapter");

// This sets the mock adapter on the default instance
var mock = new MockAdapter(axios);

let users = [
  {
    id: 1,
    username: "admin",
    password: "123456",
    email: "admin@themesbrand.com",
  },
];

// Mock GET request to /users when param `searchText` is 'John'
mock.onGet("/users", { params: { searchText: "John" } }).reply(200, {
  users: users,
});


    
  router.get("/register", function (req, res) {
    if (req.user) {
      res.redirect("Dashboard/index");
    } else {
      res.render("Auth/auth-register", {
        message: req.flash("message"),
        error: req.flash("error"),
      });
    }
  });

  router.post("/post-register", urlencodeParser, function (req, res) {
    let tempUser = {
      username: req.body.username,
      email: req.body.email,
      password: req.body.password,
    };
    users.push(tempUser);

    // Assign value in session
    sess = req.session;
    sess.user = tempUser;

    res.redirect("/");
  });

  router.get("/login", async (req, res) => {

    //getting rememberMe cookie
    const cookies = cookie.parse(req.headers.cookie || '');
    const rememberMe = cookies.rememberMe? cookies.rememberMe:'';
    var email = '';
    var pass = '';
    if(rememberMe!=''){
      var remember_text =  crypto.decrypt(cookies.rememberMe).split(';');
      var email = remember_text[0].split('=')[1];
      var pass = remember_text[1].split('=')[1];
      console.log(email, pass);
    }
      
    res.render("Auth/auth-login", {
      message: req.flash("message"),
      error: req.flash("error"),
      email: email,
      pass: pass,
      rememberMe: rememberMe? rememberMe:0,
    });
  });

  router.post("/post-login", async (req, res) => {
    
    var admin_email = req.body.email ;
    var admin_password = req.body.password;
    var remember_me = req.body.remember_me? req.body.remember_me:0;

    try {
      // Fetch data from the database
      const sql = 'SELECT * FROM `admins` WHERE email = ?';
      const rows = await db.query(sql, [admin_email]);

      if (rows.length === 0) {
          req.flash("error", "Sorry. This email is not exists!");
          res.redirect("/login");
      } else {
        var user = rows[0];

        if(user.password==admin_password){
  
          if (user.status == 1) {
            user.role = 'Admin';
            
            // Assign value in session
            sess = req.session;
            sess.user = user;
            console.log(sess.user);
            
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
  
      // Pass the fetched data to the .ejs template
      //res.render('profile', { records: rows });
    } catch (error) {
      console.error('Error fetching data:', error);
      res.status(500).send('Internal Server Error');
    }
    
    
    
    
    
    
    
  });

  router.get("/forgot-password", function (req, res) {
    res.render("Auth/auth-forgot-password", {
      message: req.flash("message"),
      error: req.flash("error"),
    });
  });

  router.post("/post-forgot-password", urlencodeParser, function (req, res) {
    const validUser = users.filter((usr) => usr.email === req.body.email);
    if (validUser["length"] === 1) {
      req.flash("message", "We have e-mailed your password reset link!");
      res.redirect("/forgot-password");
    } else {
      req.flash("error", "Email Not Found !!");
      res.redirect("/forgot-password");
    }
  });

  router.get("/logout", function (req, res) {
    // Assign  null value in session
    sess = req.session;
    sess.user = null;

    res.redirect("/login");
  });

  module.exports = router;
