const multer = require("multer");
const path = require('path');

const filefilter = (req, file, cb) => {
  // if(file.mimetype === 'video/mp4' || file.mimetype === 'video/mkv'){
  //     cb(null,true);
  // }else{
  //     cb(null,false);
  // }
  //if (!file.originalname.match(/\.(mp4|webp|MPEG-4|mkv|mov|png|jpg|jpeg)$/)) {
  if (!file.originalname.match(/\.(webp|png|jpg|jpeg)$/)) {
     cb(new Error("Only webp, png, jpg or jpeg image files are allowed"));
  }
  cb(null, true);
};

const CSVfilefilter = (req, file, cb) => {
  // if(file.mimetype === 'video/mp4' || file.mimetype === 'video/mkv'){
  //     cb(null,true);
  // }else{
  //     cb(null,false);
  // }
  //if (!file.originalname.match(/\.(mp4|webp|MPEG-4|mkv|mov|png|jpg|jpeg)$/)) {
  if (!file.originalname.match(/\.(csv)$/)) {
     cb(new Error("Only csv files are allowed"));
  }
  cb(null, true);
};

const PDFfilefilter = (req, file, cb) => {
  // if(file.mimetype === 'video/mp4' || file.mimetype === 'video/mkv'){
  //     cb(null,true);
  // }else{
  //     cb(null,false);
  // }
  //if (!file.originalname.match(/\.(mp4|webp|MPEG-4|mkv|mov|png|jpg|jpeg)$/)) {
  if (!file.originalname.match(/\.(pdf)$/)) {
     cb(new Error("Only PDF files are allowed"));
  }
  cb(null, true);
};

//upload user images
const userstorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads/users");
  },
  filename: (req, file, cb) => {
    // cb(
    //   null,
    //   new Date().toISOString().replace(/:/g, "-") + "-" + file.originalname
    // );
    cb(null, Date.now() + '_'+ file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_') )
  },
});

//upload user image
const userupload = multer({
  storage: userstorage,
  limits: { fieldSize: 25 * 1024 * 1024 },
  fileFilter: filefilter,
});



//upload category images
const categorystorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads/category");
  },
  filename: (req, file, cb) => {
    // cb(
    //   null,
    //   new Date().toISOString().replace(/:/g, "-") + "-" + file.originalname
    // );
    cb(null, Date.now() + '_'+ file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_') )
  },
});


//upload category image
const categoryupload = multer({
  storage: categorystorage,
  limits: { fieldSize: 25 * 1024 * 1024 },
  fileFilter: filefilter,
});

//upload admin images
const adminstorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads/admins");
  },
  filename: (req, file, cb) => {
    // cb(
    //   null,
    //   new Date().toISOString().replace(/:/g, "-") + "-" + file.originalname
    // );
    cb(null, Date.now() + '_'+ file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_') )
  },
});


//upload admin image
const adminupload = multer({
  storage: adminstorage,
  limits: { fieldSize: 25 * 1024 * 1024 },
  fileFilter: filefilter,
});

//upload product images
const productstorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads/products");
  },
  filename: (req, file, cb) => {
    // cb(
    //   null,
    //   new Date().toISOString().replace(/:/g, "-") + "-" + file.originalname
    // );
    cb(null, Date.now() + '_'+ file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_') )
  },
});


//upload product image
const productupload = multer({
  storage: productstorage,
  limits: { fieldSize: 25 * 1024 * 1024 },
  fileFilter: filefilter,
});

//upload slider images
const sliderstorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads/slider");
  },
  filename: (req, file, cb) => {
    // cb(
    //   null,
    //   new Date().toISOString().replace(/:/g, "-") + "-" + file.originalname
    // );
    cb(null, Date.now() + '_'+ file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_') )
  },
});

//upload slider image
const sliderupload = multer({
  storage: sliderstorage,
  limits: { fieldSize: 25 * 1024 * 1024 },
  fileFilter: filefilter,
});

//upload giftcard images
const giftcardstorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads/giftcard");
  },
  filename: (req, file, cb) => {
    // cb(
    //   null,
    //   new Date().toISOString().replace(/:/g, "-") + "-" + file.originalname
    // );
    cb(null, Date.now() + '_'+ file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_') )
  },
});

//upload giftcard image
const giftcardupload = multer({
  storage: giftcardstorage,
  limits: { fieldSize: 25 * 1024 * 1024 },
  fileFilter: filefilter,
});

//upload page banner
const pagestorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads/pages");
  },
  filename: (req, file, cb) => {
    // cb(
    //   null,
    //   new Date().toISOString().replace(/:/g, "-") + "-" + file.originalname
    // );
    cb(null, Date.now() + '_'+ file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_') )
  },
});

//upload page banner
const pageupload = multer({
  storage: pagestorage,
  limits: { fieldSize: 25 * 1024 * 1024 },
  fileFilter: filefilter,
});

//upload cover image
const coverstorage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'cover_pdf') {
      cb(null, 'public/uploads/cover_pdf');
    } else if (file.fieldname === 'cover_frontimg' || file.fieldname === 'cover_backimg' || file.fieldname === 'cover_otherimages') {
      cb(null, 'public/uploads/covers');
    }
  },
  filename: (req, file, cb) => {
    console.log(req,file)
    // cb(
    //   null,
    //   new Date().toISOString().replace(/:/g, "-") + "-" + file.originalname
    // );
    cb(null, Date.now() + '_'+ file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_') )
  },
});

//upload cover image
const coverupload = multer({
  storage: coverstorage,
  limits: { fieldSize: 25 * 1024 * 1024 },
  fileFilter: coverFilter,
});

// Define file filter for both image and PDF
function coverFilter(req, file, cb) {
  console.log(file.fieldname)
  if (file.fieldname === 'cover_pdf' && file.mimetype === 'application/pdf') {
    cb(null, true);
  } else if ((file.fieldname === 'cover_frontimg' || file.fieldname === 'cover_backimg' || file.fieldname === 'cover_otherimages')  && file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type!'));
  }
}


//upload story image
const storystorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads/story");
  },
  filename: (req, file, cb) => {
    // cb(
    //   null,
    //   new Date().toISOString().replace(/:/g, "-") + "-" + file.originalname
    // );
    cb(null, Date.now() + '_'+ file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_') )
  },
});

//upload story image
const storyupload = multer({
  storage: storystorage,
  limits: { fieldSize: 25 * 1024 * 1024 },
  fileFilter: filefilter,
});

//upload layout image
const layoutstorage = multer.diskStorage({
  
  destination: (req, file, cb) => {
   // cb(null, "public/uploads/layouts");
    
    const folder = (file.fieldname === 'print_left_image' || file.fieldname === 'print_right_image') ? '/print' : '';
    cb(null, path.join('public/uploads/layouts', folder));
  },
  filename: (req, file, cb) => {
    // cb(
    //   null,
    //   new Date().toISOString().replace(/:/g, "-") + "-" + file.originalname
    // );
    cb(null, Date.now() + '_'+ file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_') )
  },
});

//upload layout image
const layoutupload = multer({
  storage: layoutstorage,
  limits: { fieldSize: 25 * 1024 * 1024 },
  fileFilter: filefilter,
});


//upload calendar template image
const calendarstorage = multer.diskStorage({
  
  destination: (req, file, cb) => {
    console.log(file.fieldname);
    const folder = (file.fieldname === 'print_image1' || file.fieldname === 'print_image2') ? '/print' : '';
    cb(null, path.join('public/uploads/calendars', folder));
    //cb(null, "public/uploads/calendars");
  },
  filename: (req, file, cb) => {
    // cb(
    //   null,
    //   new Date().toISOString().replace(/:/g, "-") + "-" + file.originalname
    // );
    cb(null, Date.now() + '_'+ file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_') )
  },
});

//upload calendar template image
const calendarupload = multer({
  storage: calendarstorage,
  limits: { fieldSize: 25 * 1024 * 1024 },
  fileFilter: filefilter,
});

//upload addins template image
const addinsstorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = (file.fieldname === 'print_image1' || file.fieldname === 'print_image2') ? '/print' : '';
    cb(null, path.join('public/uploads/addins', folder));
    //cb(null, "public/uploads/addins");
  },
  filename: (req, file, cb) => {
    // cb(
    //   null,
    //   new Date().toISOString().replace(/:/g, "-") + "-" + file.originalname
    // );
    cb(null, Date.now() + '_'+ file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_') )
  },
});

//upload addins template image
const addinsupload = multer({
  storage: addinsstorage,
  limits: { fieldSize: 25 * 1024 * 1024 },
  fileFilter: filefilter,
});


//upload holiday csv
const holidaystorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads/holidaycsv");
  },
  filename: (req, file, cb) => {
    // cb(
    //   null,
    //   new Date().toISOString().replace(/:/g, "-") + "-" + file.originalname
    // );
    cb(null, Date.now() + '_'+ file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_') )
  },
});

//upload addins template image
const holidayupload = multer({
  storage: holidaystorage,
  limits: { fieldSize: 25 * 1024 * 1024 },
  fileFilter: CSVfilefilter,
});

//upload quote csv
const quotestorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads/quotecsv");
  },
  filename: (req, file, cb) => {
    // cb(
    //   null,
    //   new Date().toISOString().replace(/:/g, "-") + "-" + file.originalname
    // );
    cb(null, Date.now() + '_'+ file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_') )
  },
});

//upload quote csv
const quoteupload = multer({
  storage: quotestorage,
  limits: { fieldSize: 25 * 1024 * 1024 },
  fileFilter: CSVfilefilter,
});

//upload custom cover image
const customCoverImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/pdfs");
  },
  filename: (req, file, cb) => {
    // cb(
    //   null,
    //   new Date().toISOString().replace(/:/g, "-") + "-" + file.originalname
    // );
    cb(null, Date.now() + '_'+ file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_') )
  },
});

//upload custom cover image
const customCoverUpload = multer({
  storage: customCoverImageStorage,
  limits: { fieldSize: 25 * 1024 * 1024 },
  fileFilter: filefilter,
});



//upload coupon csv
const couponstorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads/coupon_csv");
  },
  filename: (req, file, cb) => {
    // cb(
    //   null,
    //   new Date().toISOString().replace(/:/g, "-") + "-" + file.originalname
    // );
    cb(null, Date.now() + '_'+ file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_') )
  },
});

//upload coupon template image
const couponupload = multer({
  storage: couponstorage,
  limits: { fieldSize: 25 * 1024 * 1024 },
  fileFilter: CSVfilefilter,
});

const noupload = multer().none();
module.exports = { noupload, userupload, categoryupload, adminupload, productupload, sliderupload, giftcardupload, pageupload, coverupload, storyupload, layoutupload, calendarupload, addinsupload, holidayupload, quoteupload, customCoverUpload, couponupload};
