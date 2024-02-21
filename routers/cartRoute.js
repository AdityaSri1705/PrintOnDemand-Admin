const express = require("express");
var bodyParser = require("body-parser");
var urlencodeParser = bodyParser.urlencoded({ extended: false });
const verifyToken = require("../middeleware/verifyToken");
const verifyPrintToken = require("../middeleware/verifyPrintToken");

const {
    apiSavePregress,
    apiAddCart,
    apiGetCart,
    apiUpdateCart,
    apiDeleteCartItem,
    apiUpdateShippingInfo,
    apiCheckCoupon,
    apiRemoveCoupon,
    apiStripePayment,
    apiAddGiftCard

} = require("../controllers/api/CartController");

const {
    apiSendItemToPrint,
    apiOrderPrintingStatus,
    apiOrderShippingStatus,
    apiOrderPrintError

} = require("../controllers/api/PrintController");

const router = express.Router();

router.post("/api/V1/saveProgress", 
            urlencodeParser, 
            verifyToken, 
            apiSavePregress);

router.post("/api/V1/addCart", 
            urlencodeParser,  
            verifyToken,
            apiAddCart);

router.post("/api/V1/addGiftCard", 
            urlencodeParser,  
            verifyToken,
            apiAddGiftCard);

router.get("/api/V1/getCart/:cartId", 
            urlencodeParser, 
            verifyToken,
            apiGetCart);

router.post("/api/V1/updateCart", 
            urlencodeParser,
            verifyToken, 
            apiUpdateCart);

router.post("/api/V1/deleteCartItem", 
            urlencodeParser,
            verifyToken,
            apiDeleteCartItem);

router.post("/api/V1/updateShippingInfo", 
            urlencodeParser,
            verifyToken,
            apiUpdateShippingInfo);

router.get("/api/V1/checkCoupon/:CartID/:Coupon", 
            urlencodeParser, 
            verifyToken,
            apiCheckCoupon);
        
router.get("/api/V1/removeCoupon/:CartID", 
            urlencodeParser, 
            verifyToken,
            apiRemoveCoupon);
router.post("/api/V1/process-payment", 
            urlencodeParser,
            verifyToken,
            apiStripePayment);

router.get("/api/V1/sendtoprint/:CartID", 
            urlencodeParser,
            verifyToken,  
            apiSendItemToPrint);

router.put("/printing/:orderKey1", 
            urlencodeParser,
            verifyPrintToken,
            apiOrderPrintingStatus);

router.put("/shipped/:orderKey1", 
            urlencodeParser,
            verifyPrintToken,
            apiOrderShippingStatus);

router.put("/error/:orderKey1", 
            urlencodeParser,
            verifyPrintToken,
            apiOrderPrintError);

module.exports = router;