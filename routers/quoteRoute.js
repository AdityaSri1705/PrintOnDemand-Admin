const express = require("express");
var bodyParser = require("body-parser");
var urlencodeParser = bodyParser.urlencoded({ extended: false });
const isAdminAllowed = require("../middeleware/isAdmin");

const {quoteupload} = require("../middeleware/imageUpload");

const {
  getAllQuotes,
  addQuote,
  insertQuote,
  editQuote,
  updateQuote,
  deleteQuote,
  statusQuote,
  addQuoteCSV,
  importQuoteCSV
} = require("../controllers/admin/QuoteController");

const router = express.Router();


/*---------- WEB Routes  -------------*/

router.get("/admin/quotes", isAdminAllowed, getAllQuotes);

router.get("/admin/quote/create", isAdminAllowed, addQuote);

router.post(
    "/admin/quote/save",
    urlencodeParser,
    isAdminAllowed,
    insertQuote
  );

router.get("/admin/quote/edit/:id", isAdminAllowed, editQuote);

router.post(
  "/admin/quote/update",
  urlencodeParser,
  isAdminAllowed,
  updateQuote
);

router.get("/admin/quote/delete/:id", isAdminAllowed, deleteQuote);

router.get("/admin/quote/status/:id/:status", isAdminAllowed, statusQuote);


router.get("/admin/quote/import", isAdminAllowed, addQuoteCSV);

router.post(
  "/admin/quote/import-csv",
  quoteupload.fields([
    {
      name: "quote_csv",
      maxCount: 1,
    },
  ]),
  isAdminAllowed,
  importQuoteCSV
);
/*---------- WEB Routes  -------------*/


module.exports = router;