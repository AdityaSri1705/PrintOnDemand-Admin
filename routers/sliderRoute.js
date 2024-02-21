var express = require("express");
var bodyParser = require("body-parser");
var urlencodeParser = bodyParser.urlencoded({ extended: false });
const isAdminAllowed = require("../middeleware/isAdmin");
const {sliderupload} = require("../middeleware/imageUpload");


const {
    getAllSliders,
    addSlider,
    insertSlider,
    editSlider,
    updateSlider,
    deleteSlider,
    statusSlider,
    deleteSliderImage
} = require("../controllers/admin/SliderController");


const router = express.Router();

/*---------- WEB Routes  -------------*/

router.get("/admin/sliders", isAdminAllowed, getAllSliders);

router.get("/admin/slider/create", isAdminAllowed, addSlider);

router.post(
    "/admin/slider/save",
    sliderupload.fields([
      {
        name: "slider_image",
        maxCount: 1,
      }
    ]),
    isAdminAllowed,
    insertSlider
  );

router.get("/admin/slider/edit/:id", isAdminAllowed, editSlider);

router.post(
    "/admin/slider/update",
    sliderupload.fields([
      {
        name: "slider_image",
        maxCount: 1,
      }
    ]),
    isAdminAllowed,
    updateSlider
  );

router.get("/admin/slider/delete/:id", isAdminAllowed, deleteSlider);

router.get("/admin/slider/status/:id/:status", isAdminAllowed, statusSlider);

router.get("/admin/slider/delete-image/:id", isAdminAllowed, deleteSliderImage);

/*---------- WEB Routes  -------------*/

module.exports = router;