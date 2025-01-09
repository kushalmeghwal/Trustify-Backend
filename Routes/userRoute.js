const express = require("express");
const router = express.Router();
const { getUsers, registerUsers } = require("../Controllers/userControle");

router.get("/login", getUsers);
router.post("/registerUser", registerUsers);

module.exports = router;
