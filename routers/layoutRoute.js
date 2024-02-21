const express = require("express");
var bodyParser = require("body-parser");
var urlencodeParser = bodyParser.urlencoded({ extended: false });
const isAdminAllowed = require("../middeleware/isAdmin");

const {
    getAllLayouts,
   // addLayout,
   // insertLayout,
    editLayout,
    updateLayout,
    //deleteLayout,
    statusLayout,
   // deleteLayoutImage,

} = require("../controllers/admin/LayoutController");

const {
  getAllLayoutSections,
  //addLayoutSection,
  //insertLayoutSection,
  editLayoutSection,
  updateLayoutSection,
 // deleteLayoutSection,
  statusLayoutSection,

} = require("../controllers/admin/LayoutSectionController");

const {
  getAllLayoutOptions,
  addLayoutOption,
  insertLayoutOption,
  editLayoutOption,
  updateLayoutOption,
  deleteLayoutOption,
  statusLayoutOption,
  deleteLayoutOptionImage,

  editRenewalOption,
  updateRenewalOption,
  deleteRenewalImage

} = require("../controllers/admin/LayoutOptionController");

const {layoutupload} = require("../middeleware/imageUpload")

const router = express.Router();


/*---------- WEB Routes  -------------*/

router.get("/admin/layouts", isAdminAllowed, getAllLayouts);

/*router.get("/admin/layout/create", isAdminAllowed, addLayout);

router.post(
    "/admin/layout/save",
    layoutupload.fields([
      {
        name: "left_image",
        maxCount: 1,
      },
      {
        name: "right_image",
        maxCount: 1,
      }
    ]),
    isAdminAllowed,
    insertLayout
  );*/

router.get("/admin/layout/edit/:id", isAdminAllowed, editLayout);

router.post(
    "/admin/layout/update",
    layoutupload.fields([
      {
        name: "left_image",
        maxCount: 1,
      },
      {
        name: "right_image",
        maxCount: 1,
      }
    ]),
    isAdminAllowed,
    updateLayout
  );

//router.get("/admin/layout/delete/:id", isAdminAllowed, deleteLayout);

router.get("/admin/layout/status/:id/:status", isAdminAllowed, statusLayout);

//router.get("/admin/layout/delete-image/:type/:id", isAdminAllowed, deleteLayoutImage);





router.get("/admin/layout/sections/:layout_id", isAdminAllowed, getAllLayoutSections);

/*router.get("/admin/layout/section/:layout_id/create", isAdminAllowed, addLayoutSection);

router.post(
    "/admin/layout/section/save",
    urlencodeParser,
    isAdminAllowed,
    insertLayoutSection
  );*/

router.get("/admin/layout/section/edit/:id", isAdminAllowed, editLayoutSection);

router.post(
    "/admin/layout/section/update",
    urlencodeParser,
    isAdminAllowed,
    updateLayoutSection
  );

//router.get("/admin/layout/section/delete/:id", isAdminAllowed, deleteLayoutSection);

router.get("/admin/layout/section/status/:id/:status", isAdminAllowed, statusLayoutSection);



router.get("/admin/layout/options/:layout_id", isAdminAllowed, getAllLayoutOptions);

router.get("/admin/layout/option/:layout_id/create", isAdminAllowed, addLayoutOption);

router.post(
    "/admin/layout/option/save",
    layoutupload.fields([
      {
        name: "left_image",
        maxCount: 1,
      },
      {
        name: "right_image",
        maxCount: 1,
      },
      {
        name: "print_left_image",
        maxCount: 1,
      },
      {
        name: "print_right_image",
        maxCount: 1,
      }
    ]),
    isAdminAllowed,
    insertLayoutOption
  );

router.get("/admin/layout/option/edit/:id", isAdminAllowed, editLayoutOption);

router.post(
    "/admin/layout/option/update",
    layoutupload.fields([
      {
        name: "left_image",
        maxCount: 1,
      },
      {
        name: "right_image",
        maxCount: 1,
      },
      {
        name: "print_left_image",
        maxCount: 1,
      },
      {
        name: "print_right_image",
        maxCount: 1,
      }
    ]),
    isAdminAllowed,
    updateLayoutOption
  );

router.get("/admin/layout/option/delete/:id", isAdminAllowed, deleteLayoutOption);

router.get("/admin/layout/option/status/:id/:status", isAdminAllowed, statusLayoutOption);

router.get("/admin/layout/option/delete-image/:type/:id", isAdminAllowed, deleteLayoutOptionImage);



router.get("/admin/renewal-template", isAdminAllowed, editRenewalOption);

router.post(
    "/admin/renewal-template/update",
    layoutupload.fields([
      {
        name: "print_left_image",
        maxCount: 1,
      },
      {
        name: "print_right_image",
        maxCount: 1,
      }
    ]),
    isAdminAllowed,
    updateRenewalOption
  );

  router.get("/admin/renewal-template/delete-image/:type/:id", isAdminAllowed, deleteRenewalImage);

/*---------- WEB Routes  -------------*/





module.exports = router;