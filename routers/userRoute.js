var express = require("express");
var bodyParser = require("body-parser");
var urlencodeParser = bodyParser.urlencoded({ extended: false });
const verifyToken = require('../middeleware/verifyToken');
const isAdminAllowed = require("../middeleware/isAdmin");
const {noupload, userupload} = require("../middeleware/imageUpload");


const {
    getAllUsers,
    addUser,
    insertUser,
    editUser,
    updateUser,
    deleteUser,
    statusUser,
    pendingUser,
    deleteUserImage
} = require("../controllers/admin/UserController");

const {
  apiCreateUser,
  apiUpdate,
  apiDelete,
  apiAllUsers,
  apiFindUser,
  apiUserBySearch,
  apiLogin,
  apiLogout,
  apiChangePassword

} = require("../controllers/api/UserController");


const router = express.Router();


/*---------- WEB Routes  -------------*/

router.get("/admin/users", isAdminAllowed, getAllUsers);

router.get("/admin/user/create", isAdminAllowed, addUser);

router.post(
    "/admin/user/save",
    userupload.fields([
      {
        name: "profile_image",
        maxCount: 1,
      },
      {
        name: "banner_image",
        maxCount: 1,
      },
    ]),
    isAdminAllowed,
    insertUser
  );

  router.get("/admin/user/edit/:id", isAdminAllowed, editUser);

  router.post(
    "/admin/user/update",
    userupload.fields([
      {
        name: "banner_image",
        maxCount: 1,
      },
      {
        name: "profile_image",
        maxCount: 1,
      },
    ]),
    isAdminAllowed,
    updateUser
  );

router.get("/admin/user/delete/:id", isAdminAllowed, deleteUser);

router.get("/admin/user/approve/:id", isAdminAllowed, pendingUser);
router.get("/admin/user/status/:id/:status", isAdminAllowed, statusUser);
router.get("/admin/user/delete-image/:id/:type", isAdminAllowed, deleteUserImage);

/*---------- WEB Routes  -------------*/

/*---------- API Routes  -------------*/
router.post(
  "/api/V1/user/create",
  userupload.fields([
    {
      name: "banner_image",
      maxCount: 1,
    },
    {
      name: "profile_image",
      maxCount: 1,
    },
  ]),
  verifyToken,
  apiCreateUser
);
router.post(
  "/api/V1/user/update/:id",
  userupload.fields([
    {
      name: "banner_image",
      maxCount: 1,
    },
    {
      name: "profile_image",
      maxCount: 1,
    },
  ]),
  verifyToken,
  apiUpdate
);
router.delete("/api/V1/deleteuser/:id", verifyToken, apiDelete);
router.get("/api/V1/allusers", verifyToken, apiAllUsers);
router.get("/api/V1/user/:id", verifyToken, apiFindUser);
router.post("/api/V1/usersearch", verifyToken, apiUserBySearch);

//router.get("/api/V1/user/:id/verify/:token", apiVerifyuser);

/*---------- API Routes  -------------*/

module.exports = router;