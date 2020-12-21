const MongoClient = require("mongodb").MongoClient;

let _db;

const {dbUrl, dbName, dbCollection} = require("../config/config");

/* Initialize Mongo database */
(async function initDB() {
	const schema = {
		required: ["baseUrl", "urlSlug", "clickLimited", "timeLimited"],
		properties: {
			baseUrl: {
				bsonType: "string",
			},
			urlSlug: {
				bsonType: "string",
			},
			clickLimited: {
				bsonType: "bool",
			},
			clicksLeft: {
				bsonType: "number",
			},
			timeLimited: {
				bsonType: "bool",
			},
			expireAt: {
				bsonType: "date",
			},
		},
	};

	const client = new MongoClient(dbUrl, {useUnifiedTopology: true});

	try {
		await client.connect();
		console.log("Connected to DB successfully!");

		_db = client.db(dbName);

		/* Create a collection if doesn't exist */
		if (!(await _db.listCollections({}, {nameOnly: true}).toArray()).length)
			await _db.createCollection("urls", {validator: {$jsonSchema: schema}});

		const collection = _db.collection("urls");
		collection.createIndex({urlSlug: 1}, {unique: true});
		collection.createIndex({expireAt: 1}, {expireAfterSeconds: 0});

		return _db;
	} catch (err) {
		console.log("Database Error: ", err);
	}
})();

async function insertDocument(col, query) {
	try {
		return await _db.collection(col).insertOne(query);
	} catch (err) {
		console.log(err);
		throw err;
	}
}

async function findDocument(col, query) {
	try {
		return await _db.collection(col).findOne(query);
	} catch (err) {
		console.log(err);
		throw err;
	}
}

async function updateOne(col, filter, update) {
	try {
		return await _db.collection(col).updateOne(filter, update);
	} catch (err) {
		console.log(err);
		throw err;
	}
}

async function deleteOne(col, query) {
	try {
		return await _db.collection(col).deleteOne(query);
	} catch (err) {
		console.log(err);
		throw err;
	}
}

module.exports = {insertDocument, findDocument, updateOne, deleteOne};
