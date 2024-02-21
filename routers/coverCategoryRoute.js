var express = require("express");
var bodyParser = require("body-parser");
var urlencodeParser = bodyParser.urlencoded({ extended: false });
const isAdminAllowed = require("../middeleware/isAdmin");

const {
    getAllCoverCategories,
    addCoverCategory,
    insertCoverCategory,
    editCoverCategory,
    updateCoverCategory,
    deleteCoverCategory,
    statusCoverCategory

} = require("../controllers/admin/CoverCategoryController");

const router = express.Router();

/*---------- WEB Routes  -------------*/

router.get("/admin/cover/categories", isAdminAllowed, getAllCoverCategories);

router.get("/admin/cover/category/create", isAdminAllowed, addCoverCategory);

router.post("/admin/cover/category/save", urlencodeParser, isAdminAllowed, insertCoverCategory);

router.get("/admin/cover/category/edit/:id", isAdminAllowed, editCoverCategory);

router.post("/admin/cover/category/update", urlencodeParser, isAdminAllowed, updateCoverCategory);

router.get("/admin/cover/category/delete/:id", isAdminAllowed, deleteCoverCategory);

router.get("/admin/cover/category/status/:id/:status", isAdminAllowed, statusCoverCategory);

/*---------- WEB Routes  -------------*/


module.exports = router;