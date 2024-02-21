var express = require("express");
var bodyParser = require("body-parser");
var urlencodeParser = bodyParser.urlencoded({ extended: false });
const verifyToken = require('../middeleware/verifyToken');
const isAdminAllowed = require("../middeleware/isAdmin");


const {
    getAllOrders,
    viewOrder,
    updateOrder,
    deleteOrder,
    statusOrder,
    pendingOrder
} = require("../controllers/admin/OrderController");

/*const {
  apiUpdate,
  apiDelete,
  apiAllOrders,
  apiFindOrder,
  apiOrderBySearch,
} = require("../controllers/api/OrderController");*/


const router = express.Router();


/*---------- WEB Routes  -------------*/

router.get("/admin/Orders", isAdminAllowed, getAllOrders);

router.get("/admin/Order/view/:id", isAdminAllowed,viewOrder);

router.post(
  "/admin/Order/update",
  urlencodeParser,
  isAdminAllowed,
  updateOrder
);

router.get("/admin/Order/delete/:id", isAdminAllowed, deleteOrder);

router.get("/admin/Order/approve/:id", isAdminAllowed, pendingOrder);
router.get("/admin/Order/status/:id/:status", isAdminAllowed, statusOrder);



/*---------- WEB Routes  -------------*/

/*---------- API Routes  -------------*/
/*router.post(
  "/api/V1/Order/update/:id",
  verifyToken,
  apiUpdate
);
router.delete("/api/V1/deleteOrder/:id", verifyToken, apiDelete);
router.get("/api/V1/allOrders", verifyToken, apiAllOrders);
router.get("/api/V1/Order/:id", verifyToken, apiFindOrder);
router.post("/api/V1/Ordersearch", verifyToken, apiOrderBySearch);

//router.get("/api/V1/Order/:id/verify/:token", apiVerifyOrder);*/

/*---------- API Routes  -------------*/

module.exports = router;