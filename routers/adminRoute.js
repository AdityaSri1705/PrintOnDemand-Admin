const express = require("express");
var bodyParser = require("body-parser");
var urlencodeParser = bodyParser.urlencoded({ extended: false });
const isAdminAllowed = require("../middeleware/isAdmin");

const {
    getAllAdmins,
    addAdmin,
    insertAdmin,
    editAdmin,
    updateAdmin,
    deleteAdmin,
    statusAdmin,
    deleteAdminImage,
    profileAdmin,
    updateProfileAdmin,
    changePasswordAdmin,
    updatePasswordAdmin,

} = require("../controllers/admin/AdminController");

const {adminupload} = require("../middeleware/imageUpload")

const router = express.Router();


/*---------- WEB Routes  -------------*/

router.get("/admin/admins", isAdminAllowed, getAllAdmins);

router.get("/admin/admins/create", isAdminAllowed, addAdmin);

router.post(
    "/admin/admins/save",
    adminupload.fields([
      {
        name: "admin_image",
        maxCount: 1,
      }
    ]),
    isAdminAllowed,
    insertAdmin
  );

router.get("/admin/admins/edit/:id", isAdminAllowed, editAdmin);

router.post(
    "/admin/admins/update",
    adminupload.fields([
      {
        name: "admin_image",
        maxCount: 1,
      }
    ]),
    isAdminAllowed,
    updateAdmin
  );

router.get("/admin/admins/delete/:id", isAdminAllowed, deleteAdmin);

router.get("/admin/admins/status/:id/:status", isAdminAllowed, statusAdmin);

router.get("/admin/admins/delete-image/:id", isAdminAllowed, deleteAdminImage);

router.get("/admin/profile", isAdminAllowed, profileAdmin);

router.post(
    "/admin/update-profile",
    adminupload.fields([
      {
        name: "admin_image",
        maxCount: 1,
      }
    ]),
    isAdminAllowed,
    updateProfileAdmin
);

router.get("/admin/change-password", isAdminAllowed, changePasswordAdmin);

router.post("/admin/update-password", urlencodeParser, isAdminAllowed, updatePasswordAdmin);

/*---------- WEB Routes  -------------*/


module.exports = router;