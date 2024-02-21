const express = require("express");
var bodyParser = require("body-parser");
var urlencodeParser = bodyParser.urlencoded({ extended: false });
const isAdminAllowed = require("../middeleware/isAdmin");

const {couponupload} = require("../middeleware/imageUpload");

const {
    getAllCoupons,
    addCoupon,
    insertCoupon,
    editCoupon,
    updateCoupon,
    deleteCoupon,
    statusCoupon,
    addCouponCSV,
    importCouponCSV
} = require("../controllers/admin/CouponController");


const router = express.Router();


/*---------- WEB Routes  -------------*/

router.get("/admin/coupons", isAdminAllowed, getAllCoupons);

router.get("/admin/coupon/create", isAdminAllowed, addCoupon);

router.post(
    "/admin/coupon/save",
    urlencodeParser,
    isAdminAllowed,
    insertCoupon
  );

router.get("/admin/coupon/edit/:id", isAdminAllowed, editCoupon);

router.post(
  "/admin/coupon/update",
  urlencodeParser,
  isAdminAllowed,
  updateCoupon
);

router.get("/admin/coupon/delete/:id", isAdminAllowed, deleteCoupon);

router.get("/admin/coupon/status/:id/:status", isAdminAllowed, statusCoupon);

router.get("/admin/coupon/import", isAdminAllowed, addCouponCSV);

router.post(
  "/admin/coupon/import-csv",
  couponupload.fields([
    {
      name: "coupon_csv",
      maxCount: 1,
    },
  ]),
  isAdminAllowed,
  importCouponCSV
);

/*---------- WEB Routes  -------------*/


module.exports = router;