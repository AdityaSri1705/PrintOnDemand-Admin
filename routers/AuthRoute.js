
var express = require("express");
var bodyParser = require("body-parser");
var urlencodeParser = bodyParser.urlencoded({ extended: false });

const {noupload, userupload} = require("../middeleware/imageUpload");
const verifyToken = require('../middeleware/verifyToken');


const {
    apiRegister,
    apiProfile,
    apiProfileUpdate,
    apiLogin,
    apiRegisterWithGoogle,
    apiLogout,
    apiChangePassword,
    apiForgotPassword,
    apiSendPasswordEmail,
    apiUpdatePassword,
    apiEmailVerify
  
  } = require("../controllers/api/AuthController");

  
const router = express.Router();

/*---------- API Routes  -------------*/

//router.post("/api/V1/login", noupload, apiLogin);         //for body-form-data
router.post("/api/V1/login", urlencodeParser, apiLogin);  //for body-www-form-urlencoded
router.post("/api/V1/change-password", urlencodeParser, verifyToken, apiChangePassword);
router.get("/api/V1/logout", urlencodeParser, verifyToken, apiLogout);

router.post(
  "/api/V1/login-with-google-auth",
  userupload.fields([
    {
      name: "profile_image",
      maxCount: 1,
    },
  ]),
  urlencodeParser,
  apiRegisterWithGoogle
);

router.post(
    "/api/V1/register",
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
    urlencodeParser,
    apiRegister
  );
router.get("/api/V1/profile", urlencodeParser, verifyToken, apiProfile);
router.post(
  "/api/V1/profile/update",
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
  urlencodeParser,
  verifyToken,
  apiProfileUpdate
);

router.post("/api/V1/forgot-password", urlencodeParser, apiForgotPassword);
router.post("/api/V1/send-password-token", urlencodeParser, apiSendPasswordEmail);
router.post("/api/V1/update-password", urlencodeParser, apiUpdatePassword);
router.get("/api/V1/verify/:token", urlencodeParser, apiEmailVerify);

/*---------- API Routes  -------------*/

module.exports = router;