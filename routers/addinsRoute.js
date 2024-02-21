const express = require("express");
var bodyParser = require("body-parser");
var urlencodeParser = bodyParser.urlencoded({ extended: false });
const isAdminAllowed = require("../middeleware/isAdmin");


const {
    getAllAddins,
    addAddin,
    insertAddin,
    editAddin,
    updateAddin,
    deleteAddin,
    statusAddin,
    deleteAddinImage
   

} = require("../controllers/admin/AddinsController");


const {addinsupload} = require("../middeleware/imageUpload")

const router = express.Router();


/*---------- WEB Routes  -------------*/

router.get("/admin/addins", isAdminAllowed, getAllAddins);

router.get("/admin/addins/create", isAdminAllowed, addAddin);

router.post(
    "/admin/addins/save",
    addinsupload.fields([
      {
        name: "image1",
        maxCount: 1,
      },
      {
        name: "image2",
        maxCount: 1,
      },
      {
        name: "print_image1",
        maxCount: 1,
      },
      {
        name: "print_image2",
        maxCount: 1,
      }
    ]),
    isAdminAllowed,
    insertAddin
  );

router.get("/admin/addins/edit/:id", isAdminAllowed, editAddin);

router.post(
  "/admin/addins/update",
  addinsupload.fields([
    {
      name: "image1",
      maxCount: 1,
    },
    {
      name: "image2",
      maxCount: 1,
    },
    {
      name: "print_image1",
      maxCount: 1,
    },
    {
      name: "print_image2",
      maxCount: 1,
    }
  ]),
  isAdminAllowed,
  updateAddin
);

router.get("/admin/addins/delete/:id", isAdminAllowed, deleteAddin);

router.get("/admin/addins/status/:id/:status", isAdminAllowed, statusAddin);

router.get("/admin/addins/delete-image/:type/:id", isAdminAllowed, deleteAddinImage);

/*---------- WEB Routes  -------------*/


module.exports = router;