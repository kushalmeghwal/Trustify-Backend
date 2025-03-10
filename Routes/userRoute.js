const express = require("express");
const router = express.Router();
const { getUsers, registerUsers,updateContactsList } = require("../Controllers/userController");

router.get("/login", getUsers);
router.post("/registerUser", registerUsers);
router.post("/updateContactList", updateContactsList);

module.exports = router;
