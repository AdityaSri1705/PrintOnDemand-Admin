var express = require("express");
var bodyParser = require("body-parser");
var urlencodeParser = bodyParser.urlencoded({ extended: false });
const isAdminAllowed = require("../middeleware/isAdmin");
const {storyupload} = require("../middeleware/imageUpload");


const {
    getAllStories,
    addStory,
    insertStory,
    editStory,
    updateStory,
    deleteStory,
    statusStory,
    deleteStoryImage

} = require("../controllers/admin/StoryController");


const router = express.Router();

/*---------- WEB Routes  -------------*/

router.get("/admin/stories", isAdminAllowed, getAllStories);

router.get("/admin/story/create", isAdminAllowed, addStory);

router.post(
    "/admin/story/save",
    storyupload.fields([
      {
        name: "story_image",
        maxCount: 1,
      }
    ]),
    isAdminAllowed,
    insertStory
  );

router.get("/admin/story/edit/:id", isAdminAllowed, editStory);

router.post(
    "/admin/story/update",
    storyupload.fields([
      {
        name: "story_image",
        maxCount: 1,
      }
    ]),
    isAdminAllowed,
    updateStory
  );

router.get("/admin/story/delete/:id", isAdminAllowed, deleteStory);

router.get("/admin/story/status/:id/:status", isAdminAllowed, statusStory);
router.get("/admin/story/delete-image/:id", isAdminAllowed, deleteStoryImage);

/*---------- WEB Routes  -------------*/

module.exports = router;