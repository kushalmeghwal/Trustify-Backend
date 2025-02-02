const express = require("express");
const router = express.Router();
const { getUsers, registerUsers,updateContactsList } = require("../Controllers/userControle");

router.get("/login", getUsers);
router.post("/registerUser", registerUsers);
router.post("/updateContactList", updateContactsList);

module.exports = router;
