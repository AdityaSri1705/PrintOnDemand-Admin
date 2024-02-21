var app = require('express')();

var express = require('express');
require("dotenv").config();
var path = require('path');
var http = require('http').Server(app);
var validator = require('express-validator');
const db = require('./database/db'); // Adjust the path as needed
var cors = require("cors");


// import controller
var AuthController = require('./controllers/admin/AuthController');

// import Router file
var pageRouter = require('./routers/route');
var authRouter = require("./routers/AuthRoute");
var userRouter = require("./routers/userRoute");
var adminRouter = require("./routers/adminRoute");
var pagesRouter = require("./routers/pagesRoute");
var sliderRouter = require("./routers/sliderRoute");
var coverCategoryRouter = require("./routers/coverCategoryRoute");
var coverItemRouter = require("./routers/coverItemRoute");
var layoutRouter = require("./routers/layoutRoute");
var calenderRouter = require("./routers/calenderRoute");
var addinsRouter = require("./routers/addinsRoute");
var couponRouter = require("./routers/couponRoute");
var holidayDateRouter = require("./routers/holidayDateRoute"); 
var quoteRouter = require("./routers/quoteRoute");
var storyRouter = require("./routers/storyRoute");
var giftCardRouter = require("./routers/giftCardRoute");
var orderRouter = require("./routers/orderRoute");
var frontRouter = require("./routers/frontRoute");
var cartRouter = require("./routers/cartRoute");




var session = require('express-session');
var bodyParser = require('body-parser');
var flash = require('connect-flash');
var i18n = require("i18n-express");
app.use(bodyParser.json());
app.use(cors());
const tokenBlacklist = new Set();
//app.use(bodyParser.urlencoded({ extended: true })); 

app.use(session({
  key: 'user_sid',
  secret: 'somerandonstuffs',
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: 1200000
  }
}));

app.use(session({ resave: false, saveUninitialized: true, secret: 'nodedemo' }));
app.use(flash());
app.use(i18n({
  translationsPath: path.join(__dirname, 'i18n'), // <--- use here. Specify translations files path.
  siteLangs: ["es", "en", "de", "ru", "it", "fr"],
  textsVarName: 'translation'
}));
const allowCrossDomain = (req, res, next) => {
  res.header(`Access-Control-Allow-Origin`, `https://becomingyourbestplanner.com`);
  res.header(`Access-Control-Allow-Headers`, `Content-Type`);
  next();
};
app.use(allowCrossDomain);
app.use("/uploads", (req, res, next) => {
  // setting the response headers
  res.setHeader(
    "Access-Control-Allow-Origin",
    "https://becomingyourbestplanner.com"
  );
  // cache control header
  // next middleware or route handler
  next();
});

//app.use('/public', express.static('public'));
app.use(express.static(__dirname + '/public'));
app.use('/uploads', express.static('public/uploads'));


app.get('/layouts/', function (req, res) {
  res.render('view');
});

// Define middleware to pass common parameters
app.use((req, res, next) => {
  res.locals.SiteTitle = process.env.APP_NAME; // Example common parameter
  res.locals.currentUser = req.session.user;  // Example user information
  // You can add more common parameters here as needed
  next();
});


// apply controller
AuthController(app);

//For set layouts of html view
var expressLayouts = require('express-ejs-layouts');
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(expressLayouts);

// Define All Route 
pageRouter(app);
app.use(authRouter);
app.use(userRouter);
app.use(adminRouter);
app.use(pagesRouter);
app.use(sliderRouter);
app.use(coverCategoryRouter);
app.use(coverItemRouter);
app.use(layoutRouter);
app.use(calenderRouter);
app.use(addinsRouter);
app.use(couponRouter);
app.use(holidayDateRouter);
app.use(quoteRouter);
app.use(storyRouter);
app.use(giftCardRouter);
app.use(orderRouter);
app.use(frontRouter);
app.use(cartRouter);

app.get('/', function (req, res) {
  res.redirect('/');
});



http.listen(8000, function () {
  console.log('listening on *:8000');
});