// Copyright © 2019, Mykos Hudson-Crisp. All rights reserved.

var deviceID = "null";
var uploadMax = 128 * 1024,
	downloadMax = 1024 * 1024;
var ramGuess = 1024 * 1024 * 1024;
if (navigator.deviceMemory) ramGuess *= navigator.deviceMemory;

var eventSrcID = 0;
var eventSrcURLs = ["/api/stream"];
var eventSrc = false;
function ConnectSuperNode(url) {
	if (eventSrc) {
		eventSrc.close();
		eventSrc = null;
	}
	if (!url) {
		url = eventSrcURLs[Math.round(eventSrcID % eventSrcURLs.length)];
		eventSrcID++;
		eventSrcID = eventSrcID % (eventSrcURLs.length * (eventSrcURLs.length + 1));
	}
	console.log("Super Node: " + url);
	eventSrc = new EventSource(url);
	eventSrc.addEventListener("error", function(x) {
		console.log("EventSource Error", x);
		ConnectSuperNode();
	});
	eventSrc.addEventListener("message", function(x) {
		console.log("EventSource Message", x);
	});
	for (var i = 0; i < dbTables.length; i++) {
		(function(t) {
			eventSrc.addEventListener(t + "update", function(x) {
				if (!db) return false;
				var sync = db.transaction([t], "readwrite");
				var store = sync.objectStore(t);
				store.put(value);
				return true;
			});
		})(dbTables[i]);
	}
}

var db = false;
var dbRequest = indexedDB.open("glib.app", 1);
var dbTables = ["users", "hosts", "posts", "groups", "tags"];
dbRequest.addEventListener("upgradeneeded", function(e) {
	var db = dbRequest.result;
	db.createObjectStore("users", { keyPath: "handle" });
	db.createObjectStore("posts", { keyPath: "url" });
	db.createObjectStore("hosts", { keyPath: "host" });
	db.createObjectStore("groups", { keyPath: "id" });
	db.createObjectStore("tags", { keyPath: "tag" });
});
dbRequest.addEventListener("success", function() {
	db = dbRequest.result;
});
function dbWrite(table, value) {
	if (!db) return false;
	var sync = db.transaction([table], "readwrite");
	var store = sync.objectStore(table);
	return store.put(value);
}
function dbRead(table, key) {
	if (!db) return false;
	var sync = db.transaction([table], "readonly");
	var store = sync.objectStore(table);
	return store.get(key);
}

var acceptJSON = { headers: { Accept: "application/json" } };
function GetNodeInfo(host) {
	return new Promise(function(resolve, reject) {
		fetch("https://" + host + "/.well-known/nodeinfo", acceptJSON)
			.then(function(r) {
				r.text()
					.then(function(t) {
						try {
							var o = JSON.parse(t);
							console.log(o);
							if (o.links) {
								var prefix = "http://nodeinfo.diaspora.software/ns/schema/";
								var best = 0;
								var url = false;
								for (var i = 0; i < o.links.length; i++) {
									if (o.links[i].rel.substr(0, prefix.length) == prefix) {
										var ver = parseFloat(o.links[i].rel.substr(prefix.length));
										if (ver > best) {
											best = ver;
											url = o.links[i].href;
										}
									}
								}
								if (url) {
									fetch(url, acceptJSON)
										.then(function(r) {
											r.text()
												.then(function(t) {
													try {
														resolve(JSON.parse(t));
													} catch (e) {
														reject(e);
													}
												})
												.catch(reject);
										})
										.catch(reject);
								} else {
									reject(new Error("server returned no nodeinfo links"));
								}
							} else {
								reject(new Error("server returned no links"));
							}
						} catch (e) {
							reject(e);
						}
					})
					.catch(reject);
			})
			.catch(reject);
	});
}

function GetWebFingerTemplate(host) {
	return new Promise(function(resolve, reject) {
		fetch("https://" + host + "/.well-known/host-meta", {
			headers: { Accept: "application/xrd+xml, application/xml" },
		})
			.then(function(r) {
				r.text()
					.then(function(t) {
						var parser = new DOMParser();
						var dom = parser.parseFromString(t, "application/xml");
						var links = dom.getElementsByTagName("Link");
						var webfinger = false;
						for (var i = 0; i < links.length; i++) {
							if (!links[i].attributes.template) continue;
							var sketchy = !links[i].attributes.rel || links[i].attributes.rel.nodeValue != "lrdd";
							if (sketchy && webfinger) continue;
							var typematch =
								links[i].attributes.type && links[i].attributes.type.nodeValue == "application/json";
							var template = links[i].attributes.template.nodeValue;
							if (!webfinger || typematch) webfinger = template;
							if (typematch) break;
						}
						resolve(webfinger);
					})
					.catch(reject);
			})
			.catch(reject);
	});
}

function GetAccountInfo(webfinger, handle) {
	return new Promise(function(resolve, reject) {
		var url = webfinger.split("{uri}").join(encodeURIComponent("acct:" + handle));
		fetch(url, acceptJSON)
			.then(function(r) {
				r.text()
					.then(function(t) {
						try {
							resolve(JSON.parse(t));
						} catch (e) {
							reject(e);
						}
					})
					.catch(reject);
			})
			.catch(reject);
	});
}

function GetActivityJSON(url) {
	return new Promise(function(resolve, reject) {
		fetch(url, { headers: { Accept: "application/activity+json" } })
			.then(function(r) {
				r.text()
					.then(function(t) {
						try {
							resolve(JSON.parse(t));
						} catch (e) {
							reject(e);
						}
					})
					.catch(reject);
			})
			.catch(reject);
	});
}

function GetAtomXML(url) {
	return new Promise(function(resolve, reject) {
		fetch(url, { headers: { Accept: "application/atom+xml" } })
			.then(function(r) {
				r.text()
					.then(function(t) {
						try {
							var parser = new DOMParser();
							var dom = parser.parseFromString(t, "application/xml");
							resolve(dom);
						} catch (e) {
							reject(e);
						}
					})
					.catch(reject);
			})
			.catch(reject);
	});
}

self.addEventListener("install", function(e) {
	e.waitUntil(
		caches.open("glib-app").then(function(cache) {
			return cache.addAll([]);
			// wait 3.5s before "really" installing the PWA...
			cache.addAll(["/", "/index.html", "/glib.webmanifest", "/service-worker.js", "/vm/glib-vm.wasm", "/glib1"]);
		}),
	);
});
self.addEventListener("sync", function(e) {
	console.log("SW sync: " + e.tag);
	// dklfjgskdjlfgh
});
self.addEventListener("notificationclose", function(e) {
	var notification = e.notification;
	var primaryKey = notification.data.primaryKey;
	console.log("Closed notification: " + primaryKey);
});
self.addEventListener("notificationclick", function(e) {
	// e.notification.data
	console.log(e);
	if (e.action === "view") {
		//clients.openWindow(...)
	}
	e.notification.close();
});
//caches.keys().then(function(names) {for (let name of names) caches.delete(name);});
