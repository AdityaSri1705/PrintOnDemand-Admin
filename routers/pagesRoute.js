var express = require("express");
var bodyParser = require("body-parser");
var urlencodeParser = bodyParser.urlencoded({ extended: false });
const isAdminAllowed = require("../middeleware/isAdmin");
const {pageupload} = require("../middeleware/imageUpload");



const {
    getAllPages,
    editPage,
    updatePage,
    deleteImage
} = require("../controllers/admin/PageController");

const router = express.Router();

/*---------- WEB Routes  -------------*/

router.get("/admin/pages", isAdminAllowed, getAllPages);

router.get("/admin/page/edit/:id", isAdminAllowed, editPage);

router.post(
    "/admin/page/update",
    pageupload.fields([
      {
        name: "page_image",
        maxCount: 1,
      }
    ]),
    isAdminAllowed,
    updatePage
  );
router.get("/admin/page/delete-image/:id", isAdminAllowed, deleteImage);

/*---------- WEB Routes  -------------*/

module.exports = router;