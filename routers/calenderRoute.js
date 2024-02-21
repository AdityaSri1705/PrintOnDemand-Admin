const express = require("express");
var bodyParser = require("body-parser");
var urlencodeParser = bodyParser.urlencoded({ extended: false });
const isAdminAllowed = require("../middeleware/isAdmin");

const {
    getAllCalendars,
    addCalendar,
    insertCalendar,
    editCalendar,
    updateCalendar,
    deleteCalendar,
    statusCalendar,
    deleteCalendarImage

} = require("../controllers/admin/CalendarController");


const {calendarupload} = require("../middeleware/imageUpload")

const router = express.Router();


/*---------- WEB Routes  -------------*/

router.get("/admin/calendar", isAdminAllowed, getAllCalendars);

router.get("/admin/calendar/create", isAdminAllowed, addCalendar);

router.post(
    "/admin/calendar/save",
    calendarupload.fields([
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
    insertCalendar
  );

router.get("/admin/calendar/edit/:id", isAdminAllowed, editCalendar);

router.post(
    "/admin/calendar/update",
    calendarupload.fields([
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
    updateCalendar
  );

router.get("/admin/calendar/delete/:id", isAdminAllowed, deleteCalendar);

router.get("/admin/calendar/status/:id/:status", isAdminAllowed, statusCalendar);

router.get("/admin/calendar/delete-image/:type/:id", isAdminAllowed, deleteCalendarImage);

/*---------- WEB Routes  -------------*/


module.exports = router;