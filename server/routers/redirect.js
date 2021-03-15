const express = require("express");
const router = express.Router();

const DBUtils = require("../utils/db");

const {dbCollection} = require("../config/config");

const browsers = ["firefox", "seamonkey", "chrome", "chromium", "safari", "opera", "opr", "msie", "trident"];

function isBrowser(userAgent) {
	return browsers.find((browser) => userAgent.toLowerCase().includes(browser));
}

router.get("/:id", async function (req, res) {
	try {
		const userAgent = req.header("User-Agent");
		if (!isBrowser(userAgent)) return res.status(401).end(); // Prevent applications from consuming clicks on preview display

		if (!req.params.id) return res.status(404).end();
		const data = await DBUtils.findDocument(dbCollection, {urlSlug: req.params.id});

		if (data) {
			// Check if click limited
			if (data.clickLimited) {
				await DBUtils.updateOne(
					dbCollection,
					{clicksLeft: {$exists: true}},
					{$set: {clicksLeft: data.clicksLeft - 1}} // Decrement clicks left
				);

				if (data.clicksLeft <= 1) await DBUtils.deleteOne(dbCollection, {urlSlug: data.urlSlug}); // Remove entery from database if no more clicks left
			}

			res.redirect(data.baseUrl);
			// Redirect to stored URL
		} else {
			// TODO: Make a 404 page
			return res.status(404).end();
		}
	} catch (err) {
		console.log("An unexpected error has occured!\n", err);
		return res.status(500).send({
			error: {
				reason: "unknown",
				message: "An unexpected error has occured!",
			},
		});
	}
});

module.exports = router;
