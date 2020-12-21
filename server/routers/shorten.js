const express = require("express");
const router = express.Router();

const {nanoid} = require("nanoid");

const DBUtils = require("../utils/db");
const {dbCollection, serverUrl} = require("../config/config");

const baseUrlRegex = /https?:\/\/(www.)?[-a-zA-Z0-9@:%._+~#=]{1,256}.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/;

/* Generate random ID, make sure it doesn't exist in database */
async function genId(length) {
	// TODO: Use a scalabe approach to generating ID's (Probably base62 encoding with a counter)

	const MAX_TRIES = 500; // How many times to try regenerating the ID before throwing an error
	let tries = 0,
		id;
	do {
		id = nanoid(length);
		if (++tries > MAX_TRIES) throw new Error("Reached maximum number of tries to generate an short ID!");
	} while (await DBUtils.findDocument(dbCollection, {urlSlug: id}));
	return id;
}

/* Calculate short URL expiration date */
function calcExpirationDate(minutes) {
	const min = Number(minutes);
	if (!min) throw new Error("String to Number conversion error!");
	if (min <= 0) throw new Error("Number of minutes must be equal or greater than 1!");

	const curDate = new Date();
	const calculated = curDate.setMinutes(curDate.getMinutes() + min);
	return new Date(calculated);
}

/* Sanitize clicks to make sure we got a valid number of clicks */
function sanitizeClicks(clicks) {
	const clks = Number(clicks);
	if (!clks) throw new Error("String to Number conversion error!");
	if (clks <= 0) throw new Error("Number of clicks must be equal or greater than 1!");
	return clks;
}

router.post("/shorten", async function (req, res) {
	try {
		const data = req.body;
		let {baseUrl, urlSlug, clickLimited, clickLimitedClicks, timeLimited, timeLimitedTime} = data;
		// Check if there is data

		if (!data || !Object.keys(data).length) {
			return res.status(400).send({
				error: {
					reason: "noData",
					message: "No data provided!",
				},
			});
		}

		// Check base url's validity
		if (!baseUrl.length || (baseUrl && !baseUrlRegex.test(baseUrl))) {
			return res.status(400).send({
				error: {
					reason: "baseUrl",
					message: "Invalid URL! Please check the URL you've provided!",
				},
			});
		}

		// Custom options
		if (timeLimited) data.expireAt = calcExpirationDate(timeLimitedTime);
		delete data.timeLimitedTime; // We won't be needing that in our database

		if (clickLimited) data.clicksLeft = sanitizeClicks(clickLimitedClicks);
		delete data.clickLimitedClicks;

		data.urlSlug = urlSlug || (await genId(5)); // Use custom url slug if exists, generate random one if not

		await DBUtils.insertDocument(dbCollection, data); // Insert into database

		/* Repond with shortened URL */
		res.status(201).send({
			success: {
				message: "Successfully generated short URL!",
				generatedUrl: `${serverUrl}${data.urlSlug}`,
				expireAfter: {
					time: timeLimitedTime,
					clicks: clickLimitedClicks,
				},
			},
		});
	} catch (err) {
		// Duplicate short URL in database
		if (err.code === 11000) {
			return res.status(409).send({
				error: {
					reason: "urlSlug",
					message:
						"This custom URL slug already exists! Please try another or leave blank to get a random one",
				},
			});
		}

		// Schema validation failed
		if (err.code === 121) {
			return res.status(400).send({
				error: {
					reason: "invalidData",
					message: "Invalid data provided!",
				},
			});
		}

		// Default error
		console.log("An unexpected error has occured!\n", err);
		return res.status(418).send({
			error: {
				reason: "unknown",
				message: "An unexpected error has occured!",
			},
		});
	}
});

module.exports = router;
