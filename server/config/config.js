/* Server Config */
const serverUrl = process.env.NODE_ENV ? "https://micronurl.herokuapp.com/" : "http://localhost:3000/";

/* Database Config */
const dbName = "short-urls";
const dbCollection = "urls";

const dbUrl = process.env.NODE_ENV
	? `mongodb+srv://owner:${process.env.DB_KEY}@urlshortener.v6jvw.mongodb.net/${dbName}?retryWrites=true&w=majority`
	: "mongodb://localhost:27017";

module.exports = {serverUrl, dbUrl, dbName, dbCollection};
