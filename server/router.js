const express = require("express");
const router = express.Router();

router.use(express.json());

/* Routers */
const shorten = require("./routers/shorten");
router.use("/api/", shorten);

const redirect = require("./routers/redirect");
router.use("/", redirect);

module.exports = router;
