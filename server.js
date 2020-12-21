const express = require("express");
const app = express();
const {serverUrl} = require("./server/config/config");

const helmet = require("helmet");

const Router = require("./server/router");

// Setup Content-Security-Policty for JQuery and Bootstrap
app.use(
	helmet({
		contentSecurityPolicy: {
			directives: {
				...helmet.contentSecurityPolicy.getDefaultDirectives(),
				"script-src": [
					"'self'",
					"https://code.jquery.com/jquery-3.5.1.slim.min.js",
					"https://cdn.jsdelivr.net/npm/bootstrap@4.5.3/dist/js/bootstrap.bundle.min.js",
				],
			},
		},
	})
);

app.use(express.static("./server/public"));
app.use(Router);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`Started server at: ${serverUrl}:${PORT}`));
