const express = require("express");
const router = express.Router();
const { getUsers, registerUsers,updateContactsList } = require("../Controllers/userController");

router.post("/login", getUsers);
router.post("/register", registerUsers);
router.post("/updateContactList", updateContactsList);

module.exports = router;
