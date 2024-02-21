var express = require("express");
var bodyParser = require("body-parser");
var urlencodeParser = bodyParser.urlencoded({ extended: false });
const isAdminAllowed = require("../middeleware/isAdmin");
const {giftcardupload} = require("../middeleware/imageUpload");


const {
    getAllGiftCards,
    addGiftCard,
    insertGiftCard,
    editGiftCard,
    updateGiftCard,
    deleteGiftCard,
    statusGiftCard,
    deleteGiftCardImage
} = require("../controllers/admin/GiftCardController");


const router = express.Router();

/*---------- WEB Routes  -------------*/

router.get("/admin/giftcards", isAdminAllowed, getAllGiftCards);

router.get("/admin/giftcard/create", isAdminAllowed, addGiftCard);

router.post(
    "/admin/giftcard/save",
    giftcardupload.fields([
      {
        name: "giftcard_image",
        maxCount: 1,
      }
    ]),
    isAdminAllowed,
    insertGiftCard
  );

router.get("/admin/giftcard/edit/:id", isAdminAllowed, editGiftCard);

router.post(
    "/admin/giftcard/update",
    giftcardupload.fields([
      {
        name: "giftcard_image",
        maxCount: 1,
      }
    ]),
    isAdminAllowed,
    updateGiftCard
  );

router.get("/admin/giftcard/delete/:id", isAdminAllowed, deleteGiftCard);

router.get("/admin/giftcard/status/:id/:status", isAdminAllowed, statusGiftCard);

router.get("/admin/giftcard/delete-image/:id", isAdminAllowed, deleteGiftCardImage);

/*---------- WEB Routes  -------------*/

module.exports = router;