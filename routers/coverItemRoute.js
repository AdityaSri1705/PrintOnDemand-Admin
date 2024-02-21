var express = require("express");
var bodyParser = require("body-parser");
var urlencodeParser = bodyParser.urlencoded({ extended: false });
const isAdminAllowed = require("../middeleware/isAdmin");
const {coverupload, coverpdfupload} = require("../middeleware/imageUpload");


const {
    getAllCoverItems,
    addCoverItem,
    insertCoverItem,
    editCoverItem,
    updateCoverItem,
    deleteCoverItem,
    statusCoverItem,
    deleteCoverItemImage,
    deleteCoverItemPdf

} = require("../controllers/admin/CoverItemController");



const router = express.Router();

/*---------- WEB Routes  -------------*/

router.get("/admin/covers", isAdminAllowed, getAllCoverItems);

router.get("/admin/cover/create", isAdminAllowed, addCoverItem);

router.post(
    "/admin/cover/save",
    coverupload.fields([
      {
        name: "cover_frontimg",
        maxCount: 1,
      },
      {
        name: "cover_backimg",
        maxCount: 1,
      },
      
      {
        name: "cover_otherimages",
        maxCount: 10,
      },
      {
        name: "cover_pdf",
        maxCount: 1,
      }
      
    ]),
    isAdminAllowed,
    insertCoverItem
  );

router.get("/admin/cover/edit/:id", isAdminAllowed, editCoverItem);

router.post(
    "/admin/cover/update",
    coverupload.fields([
      {
        name: "cover_frontimg",
        maxCount: 1,
      },
      {
        name: "cover_backimg",
        maxCount: 1,
      },
      {
        name: "cover_otherimages",
        maxCount: 10,
      },
      {
        name: "cover_pdf",
        maxCount: 1,
      },
    ]),

    isAdminAllowed,
    updateCoverItem
  );

router.get("/admin/cover/delete/:id", isAdminAllowed, deleteCoverItem);

router.get("/admin/cover/status/:id/:status", isAdminAllowed, statusCoverItem);

router.get("/admin/cover/delete-image/:type/:id/:imgid?", isAdminAllowed, deleteCoverItemImage);

router.get("/admin/cover/delete-pdf/:id", isAdminAllowed, deleteCoverItemPdf);


/*---------- WEB Routes  -------------*/

module.exports = router;