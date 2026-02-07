const express = require("express");
const {
  addAddress,
  getAddresses,
  updateAddress,
  deleteAddress,
} = require("../controllers/web/v1/address-controller");
const authMiddleware = require("../middleware/authMiddleware");

const addressRoutes = express.Router();

addressRoutes.post("/add", authMiddleware, addAddress);
addressRoutes.get("/get", authMiddleware, getAddresses);
addressRoutes.put("/update/:id", authMiddleware, updateAddress);
addressRoutes.delete("/delete/:id", authMiddleware, deleteAddress);

module.exports = addressRoutes;
