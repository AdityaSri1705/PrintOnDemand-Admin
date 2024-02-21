const express = require("express");
var bodyParser = require("body-parser");
var urlencodeParser = bodyParser.urlencoded({ extended: false });
const isAdminAllowed = require("../middeleware/isAdmin");

const {holidayupload} = require("../middeleware/imageUpload");

const {
    getAllHolidays,
    addHoliday,
    insertHoliday,
    editHoliday,
    updateHoliday,
    deleteHoliday,
    statusHoliday,
} = require("../controllers/admin/HolidayController");

const {
  getAllHolidayDates,
  addHolidayDate,
  insertHolidayDate,
  editHolidayDate,
  updateHolidayDate,
  deleteHolidayDate,
  statusHolidayDate,
  addHolidayDateCSV,
  importHolidayDateCSV
} = require("../controllers/admin/HolidayDateController");

const router = express.Router();


/*---------- WEB Routes  -------------*/

router.get("/admin/holidays", isAdminAllowed, getAllHolidays);

router.get("/admin/holiday/create", isAdminAllowed, addHoliday);

router.post(
    "/admin/holiday/save",
    urlencodeParser,
    isAdminAllowed,
    insertHoliday
  );

router.get("/admin/holiday/edit/:id", isAdminAllowed, editHoliday);

router.post(
  "/admin/holiday/update",
  urlencodeParser,
  isAdminAllowed,
  updateHoliday
);

router.get("/admin/holiday/delete/:id", isAdminAllowed, deleteHoliday);

router.get("/admin/holiday/status/:id/:status", isAdminAllowed, statusHoliday);





/*---------- WEB Routes  -------------*/

router.get("/admin/holiday-dates/:id", isAdminAllowed, getAllHolidayDates);

router.get("/admin/holiday-date/:id/create", isAdminAllowed, addHolidayDate);

router.post(
    "/admin/holiday-date/save",
    urlencodeParser,
    isAdminAllowed,
    insertHolidayDate
  );

router.get("/admin/holiday-date/edit/:id", isAdminAllowed, editHolidayDate);

router.post(
  "/admin/holiday-date/update",
  urlencodeParser,
  isAdminAllowed,
  updateHolidayDate
);

router.get("/admin/holiday-date/delete/:id", isAdminAllowed, deleteHolidayDate);

router.get("/admin/holiday-date/status/:id/:status", isAdminAllowed, statusHolidayDate);

router.get("/admin/holiday-date/:id/import-dates", isAdminAllowed, addHolidayDateCSV);

router.post(
  "/admin/holiday-date/import-csv",
  holidayupload.fields([
    {
      name: "date_csv",
      maxCount: 1,
    },
  ]),
  isAdminAllowed,
  importHolidayDateCSV
);
/*---------- WEB Routes  -------------*/


module.exports = router;