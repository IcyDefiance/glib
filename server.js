const fs = require("fs");
const tls = require("tls");
const url = require("url");
const repl = require("repl");
const path = require("path");
const http = require("http");
const https = require("https");
const crypto = require("crypto");

var config = JSON.parse(fs.readFileSync("config.json").toString("utf-8"));
var objects = [];
var session = {};

function http_handler(req, res) {
	if (config.https_only) {
		res.statusCode = 301;
		res.setHeader("Location", "https://" + req.headers.host + req.url);
		res.end();
		return true;
	}
	return https_handler(req, res);
}
function https_handler(req, res) {
	console.log(
		req.connection.remoteAddress + ": " + req.method + " " + req.url
	);
	var postdata = "";
	req.on("data", function(data) {
		postdata += data;
		if (postdata.length > config.max_post) {
			req.connection.destroy();
		}
	});
	var u = url.parse(req.url, true);
	if (u.pathname == "/api/publish") {
		req.on("end", function() {
			var e = { time: Date.now(), data: postdata };
			objects.push(e);
			var bytes = 0;
			var index = null;
			for (var i = objects.length - 1; i--; ) {
				var b = bytes + objects[i].data.length;
				if (b >= config.cache_size) break;
				bytes = b;
				index = i;
			}
			if (index !== null) {
				objects = objects.slice(index);
			}
			var je = JSON.stringify(e);
			res.statusCode = 200;
			res.setHeader("Content-Type", "application/json");
			res.end(je);
			for (var id in session) {
				session[id].res.write(
					"event: object-data\ndata: " + je + "\n\n"
				);
			}
		});
		return;
	}
	if (u.pathname == "/api/fetch") {
		res.statusCode = 200;
		res.setHeader("Content-Type", "application/json");
		if (u.query.since) {
			var cutoff = parseFloat(u.query.since);
			var since = [];
			for (var i = 0; i < objects.length; i++) {
				if (objects[i].time <= cutoff) continue;
				since.push(objects[i]);
			}
			res.end(JSON.stringify(since));
		} else {
			res.end(JSON.stringify(objects));
		}
		return;
	}
	if (u.pathname == "/api/stream") {
		res.statusCode = 200;
		res.setHeader("Cache-Control", "no-store");
		res.setHeader("Content-Type", "text/event-stream");
		res.setHeader("Transfer-Encoding", "chunked");
		res.setHeader("Access-Control-Allow-Origin", "*");

		var sesId = crypto.randomBytes(12).toString("base64");
		session[sesId] = { id: sesId, req: req, res: res, u: u };
		res.write("event: session-id\ndata: " + sesId + "\n\n");
		res.write("event: server-time\ndata: " + Date.now() + "\n\n");
		return;
	}
	if (u.pathname.indexOf("..") == -1 && u.pathname[0] == "/") {
		var path = config.public_dir + u.pathname;
		try {
			var stat = fs.statSync(path);
			if (stat.isDirectory()) {
				if (path[path.length - 1] != "/") path += "/";
				path += "index.html";
				stat = fs.statSync(path);
			}
			if (stat.isDirectory()) throw null;
			var fileSize = stat.size;
			var fileext = path.split(".").pop();
			var filemime = config.mime_type[fileext];
			if (!filemime) filemime = config.mime_default;
			var range = req.headers.range;
			if (range) {
				var parts = range
					.split("bytes=")
					.join("")
					.split("-");
				var start = parseInt(parts[0], 10);
				var end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
				var chunksize = end - start + 1;
				var file = fs.createReadStream(path, { start, end });
				var head = {
					"Content-Range": `bytes ${start}-${end}/${fileSize}`,
					"Accept-Ranges": "bytes",
					"Content-Length": chunksize,
					"Content-Type": filemime
				};
				res.writeHead(206, head);
				file.pipe(res);
			} else {
				var head = {
					"Content-Length": fileSize,
					"Content-Type": filemime
				};
				res.writeHead(200, head);
				fs.createReadStream(path).pipe(res);
			}
			return;
		} catch (e) {}
	}
	res.statusCode = 404;
	res.setHeader("Content-Type", "text/plain");
	res.end("(404) " + u.pathname);
}
const https_options = {
	SNICallback: function(domain, cb) {
		if (!false) {
			cb(true, null);
			return null;
		}
		cb(null, cert);
		return cert;
	}
};

var http_server = http.createServer(http_handler);
http_server.listen(config.http_port, config.hostname, () => {
	console.log(
		`Server running: http://${config.hostname}:${config.http_port}/`
	);
});

var https_server = https.createServer(https_options, https_handler);
https_server.listen(config.https_port, config.hostname, () => {
	console.log(
		`Server running: https://${config.hostname}:${config.https_port}/`
	);
});
