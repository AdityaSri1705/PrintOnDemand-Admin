var express = require("express");
var bodyParser = require("body-parser");
var urlencodeParser = bodyParser.urlencoded({ extended: false });
const verifyToken = require('../middeleware/verifyToken');
const {customCoverUpload} = require("../middeleware/imageUpload");


const {
    getHomeContent,
    getPageContent,
    getCovers,
    getLayouts,
    getAddins,
    getHolidayDates,
    getGiftCardImages,
    
    getMyAccountInfo,
    getMyOrders,
    saveprofile

} = require("../controllers/api/FrontController");

const {
    generatePDF
} = require("../controllers/api/PDFController");


const router = express.Router();

/*---------- API Routes  -------------*/

router.get("/api/V1/covers", urlencodeParser, getCovers);
router.get("/api/V1/home", urlencodeParser, getHomeContent);
router.get("/api/V1/page/:id", urlencodeParser, getPageContent);
router.get("/api/V1/layout/:type", urlencodeParser, getLayouts);
router.get("/api/V1/addins/:type", urlencodeParser, getAddins);
router.get("/api/V1/holiday-dates", urlencodeParser, getHolidayDates);
router.get("/api/V1/giftcards", urlencodeParser, getGiftCardImages);
router.post("/api/V1/review", urlencodeParser, customCoverUpload.fields([
    {
      name: "FrontCoverImg",
      maxCount: 1,
    },
    {
      name: "BackCoverImg",
      maxCount: 1,
    }
  ]), generatePDF);



router.get("/api/V1/myaccount", urlencodeParser, verifyToken, getMyAccountInfo);
router.get("/api/V1/myorders", urlencodeParser, verifyToken, getMyOrders);
router.post("/api/V1/saveprofile", urlencodeParser, verifyToken, saveprofile);
module.exports = router;