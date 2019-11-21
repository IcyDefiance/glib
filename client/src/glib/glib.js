// Copyright Â© 2019, Mykos Hudson-Crisp. All rights reserved.

const CryptoCodecVM = require("../../bin/crypto-codec");

(function() {
	var uploadMax = 128 * 1024,
		downloadMax = 1024 * 1024;
	var ramGuess = 1024 * 1024 * 1024;
	if (navigator.deviceMemory) ramGuess *= navigator.deviceMemory;
	var sw = null;
	var objectCache = {};
	var vm = new CryptoCodecVM();
	vm.then(BootVM);
	if (navigator.serviceWorker) {
		navigator.serviceWorker.register("/service-worker.js");
		navigator.serviceWorker.ready.then(function(reg) {
			sw = reg;
		});
	}
	window.addEventListener(
		"message",
		function(e) {
			console.log(e);
		},
		false,
	);

	var sessionID = null;
	var since = Date.now() - 1000 * 60 * 60 * 24 * 7;
	if (window.localStorage) {
		if (localStorage.since) {
			var s = parseFloat(localStorage.since);
			if (!isNaN(s)) since = s;
		}
		localStorage.since = since;
	}
	var eventSrc = new EventSource("/api/stream?since=" + since);
	var timeOffset = 0;
	var timeMargin = 5000;
	eventSrc.addEventListener("error", function(x) {
		console.log("EventSource Error", x);
	});
	eventSrc.addEventListener("session-id", function(x) {
		console.log("Session ID: " + x.data);
		sessionID = x;
	});
	eventSrc.addEventListener("server-time", function(x) {
		var serverTime = parseFloat(x.data);
		var offset = serverTime - Date.now();
		if (Math.abs(offset - timeOffset) > timeMargin) {
			timeOffset = offset;
		} else {
			var minOffset = Math.min(timeOffset, offset);
			timeOffset = (offset + minOffset) / 2;
		}
	});
	eventSrc.addEventListener("message", function(x) {
		console.log(x.data);
		var o = JSON.parse(x.data);
		for (var i = 0; i < o.length; i++) {
			var oi = o[i];
			if (o[i].time > since) {
				since = oi.time;
			}
			try {
				dbWrite("blobs", oi);
				// FIXME import object
			} catch (e) {}
		}
	});

	function displayNotification(x) {
		if (Notification.permission == "granted") {
			navigator.serviceWorker.getRegistration().then(function(reg) {
				reg.showNotification("Title", {
					body: x.data,
					icon: "/images/icon-192.png",
					vibrate: [100, 50, 100],
					data: {
						dateOfArrival: Date.now(),
					},
					actions: [
						{ action: "view", title: "View message", icon: "images/icon-192.png" },
						{ action: "close", title: "Ignore", icon: "images/icon-192.png" },
					],
				});
			});
		} else {
			Notification.requestPermission(function(status) {
				console.log("Notification permission status:", status);
			});
		}
	}

	var db = false;
	function dbOpen(resolve, reject) {
		if (db) return resolve && resolve(db);
		var dbRequest = indexedDB.open("glib.app", 1);
		dbRequest.addEventListener("upgradeneeded", function(e) {
			db = dbRequest.result;
			db.createObjectStore("blobs", { keyPath: "time" });
			db.createObjectStore("objects", { keyPath: "id" });
			var cache = db.createObjectStore("cache", { keyPath: "handle" });
			cache.createIndex("handle,key", ["handle", "key"], { unique: false });
		});
		if (reject) dbRequest.addEventListener("error", reject);
		dbRequest.addEventListener("success", function() {
			db = dbRequest.result;
			if (resolve) resolve(db);
		});
	}
	function dbWrite(table, value) {
		return new Promise(function(resolve, reject) {
			dbOpen(function(db) {
				var sync = db.transaction([table], "readwrite");
				var store = sync.objectStore(table);
				var request = store.put(value);
				request.addEventListener("error", reject);
				request.addEventListener("success", function() {
					resolve(request.result);
				});
			}, reject);
		});
	}
	function dbRead(table, key) {
		return new Promise(function(resolve, reject) {
			dbOpen(function(db) {
				var sync = db.transaction([table], "readonly");
				var store = sync.objectStore(table);
				var request = store.get(value);
				request.addEventListener("error", reject);
				request.addEventListener("success", function() {
					resolve(request);
				});
			}, reject);
		});
	}

	function BootVM() {
		var seedBytes = 64;
		var seedPtr = vm._malloc(seedBytes);
		var seedMem = vm.HEAPU8.subarray(seedPtr, seedPtr + seedBytes);
		var x = 0,
			y = 0,
			idx = 0;
		var handleMouse = function(e) {
			x = e.pageX;
			y = e.pageY;
			crypto.getRandomValues(seedMem);
			vm.HEAPU8[seedPtr + idx] ^= Math.floor(Date.now());
			idx = (idx + 1) & 63;
			vm.HEAPU8[seedPtr + idx] ^= Math.floor(x);
			idx = (idx + 1) & 63;
			vm.HEAPU8[seedPtr + idx] ^= Math.floor(y);
			idx = (idx + 1) & 63;
			vm._Seed(seedPtr, seedBytes);
		};
		document.addEventListener("mousemove", handleMouse, false);
		document.addEventListener("mouseenter", handleMouse, false);
		var timeDelay = 100;
		var seedRefresh = function() {
			crypto.getRandomValues(seedMem);
			vm.HEAPU8[seedPtr + idx] ^= Math.floor(Date.now());
			idx = (idx + 1) & 63;
			vm.HEAPU8[seedPtr + idx] ^= Math.floor(x);
			idx = (idx + 1) & 63;
			vm.HEAPU8[seedPtr + idx] ^= Math.floor(y);
			idx = (idx + 1) & 63;
			vm._Seed(seedPtr, seedBytes);
			timeDelay += Math.floor((timeDelay * timeDelay) / 1000);
			if (timeDelay > 10000) timeDelay = 10000;
			setTimeout(seedRefresh, timeDelay);
		};
		seedRefresh();
		doOnLoad();
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
									links[i].attributes.type &&
									links[i].attributes.type.nodeValue == "application/json";
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
	/*
	var u = db ? new URL(e.request.url) : {};
		if (u.pathname == "/api/fetch2") {
			fetch(e.request.clone());
			e.respondWith(new Promise(function(resolve, reject) {
				try {
					var request = dbRead(u.searchParams.get("table"), u.searchParams.get("key"));
					request.addEventListener("error", reject);
					request.addEventListener("success", function() {
						var o = request.result ? request.result : {};
						resolve(new Response(JSON.stringify(o), {status: 200, statusText: "OK"}));
					});
				} catch(err) {
					reject(err);
				}
			}));
			return;
		} else if (u.pathname == "/api/publish2") {
			fetch(e.request.clone());
			e.respondWith(new Promise(function(resolve, reject) {
				try {
					e.request.json().then(function(value) {
						var request = dbWrite(u.searchParams.get("table"), value);
						request.addEventListener("error", reject);
						request.addEventListener("success", function() {
							resolve(new Response('{"ok":true}', {status: 200, statusText: "OK"}));
						});
					});
				} catch(err) {
					reject(err);
				}
			}));
			return;
		}
	*/
	function PublishObject(obj) {
		var bin = PackObject(obj);
		dbWrite("objects", obj).then(function() {
			if (sw) sw.sync.register(obj.id);
		});
		fetch("/api/publish", { method: "POST", body: bin });
		return bin;
	}

	var p2p = null;
	window.ListenP2P = ListenP2P;
	function ListenP2P() {
		if (p2p) return;
		p2p = new RTCPeerConnection({ iceServers: [{ url: "stun:stun.l.google.com:19302" }] });
		var stun = [];
		var sendStunInfo = function() {
			console.log(stun);
		};
		var timeout = setTimeout(sendStunInfo, 2500);
		p2p.addEventListener("icecandidate", function(x) {
			if (!x.candidate) {
				clearTimeout(timeout);
				sendStunInfo();
				return;
			}
			stun.push(x.candidate);
		});
		p2p.addEventListener("datachannel", function(e) {
			var ch = e.channel;
			ch.onerror = function(x) {
				console.log("p2p.ondatachannel.onerror", x);
			};
			ch.onmessage = function(x) {
				console.log("p2p.ondatachannel.onmessage", x);
			};
			ch.onopen = function(x) {
				console.log("p2p.ondatachannel.onopen", x);
			};
			ch.onclose = function(x) {
				console.log("p2p.ondatachannel.onclose", x);
			};
		});
		var ch = p2p.createDataChannel("glib.app-v1", { ordered: false });
		window.ch = ch;
		ch.onerror = function(x) {
			console.log("ch.onerror", x);
		};
		ch.onmessage = function(x) {
			console.log("ch.onmessage", x);
		};
		ch.onopen = function(x) {
			console.log("ch.onopen", x);
			ch.send("test1");
		};
		ch.onclose = function(x) {
			console.log("ch.onclose", x);
		};

		var remoteConnection = new RTCPeerConnection();
		remoteConnection.ondatachannel = function(e) {
			console.log("rc.odc");
			e.channel.onopen = function() {
				e.channel.send("test2");
			};
			e.channel.onmessage = function(e) {
				console.log("ecom", e);
			};
		};
		remoteConnection.onicecandidate = e => {
			console.log(e.candidate);
			if (e.candidate) p2p.addIceCandidate(e.candidate);
		};
		p2p.createOffer()
			.then(offer => p2p.setLocalDescription(offer))
			.then(() => remoteConnection.setRemoteDescription(p2p.localDescription))
			.then(() => remoteConnection.createAnswer())
			.then(answer => remoteConnection.setLocalDescription(answer))
			.then(() => p2p.setRemoteDescription(remoteConnection.localDescription));

		window.p2p = p2p;
		return p2p;
	}

	function Host(hostname) {
		this.hostname = hostname;
		this.subscriber = {};
		Host.cache[hostname] = this;
	}
	Host.cache = {};
	Host.validKeys = {
		webfinger: function(h) {
			h.fediProbe();
		},
		nodeinfo: function(h) {
			h.fediProbe();
		},
	};
	Host.Get = function(domain) {
		if (!domain) return null;
		var h = domain.replace(/[^\w\-\.]+/g, "");
		if (!Host.cache[h]) {
			return new Host(h);
		}
		return Host.cache[h];
	};
	Host.prototype.fediProbe = function(resolve) {
		var o = this;
		try {
			GetWebFingerTemplate(o.hostname).then(function(x) {
				o.set("webfinger", x);
			});
			GetNodeInfo(o.hostname).then(function(x) {
				o.set("nodeinfo", x);
			});
		} catch (e) {}
	};
	Host.prototype.set = function(k, v) {
		this[k] = v;
		if (!this.subscriber[k]) return;
		for (var i = 0; i < this.subscriber[k].length; i++) {
			var f = this.subscriber[k][i];
			f(this, f);
		}
	};
	Host.prototype.subscribe = function(key, callback) {
		var initFunc = Host.validKeys[key];
		if (initFunc && initFunc !== true && !this[key]) initFunc(this);
		if (!initFunc || !callback) return false;
		if (!this.subscriber[key]) {
			this.subscriber[key] = [];
		}
		if (this.subscriber[key].indexOf(callback) == -1) {
			this.subscriber[key].push(callback);
		}
		callback(this, callback);
		return callback;
	};
	Host.prototype.unsubscribe = function(key, callback) {
		if (!this.subscriber[key]) return false;
		var newList = [];
		for (var i = 0; i < this.subscriber[key].length; i++) {
			if (this.subscriber[key][i] == callback) continue;
			newList.push(this.subscriber[key][i]);
		}
		var r = newList.length < this.subscriber[key].length;
		this.subscriber[key] = newList;
		return r;
	};

	function User(handle) {
		this.handle = handle;
		this.subscriber = {};
		User.cache[handle] = this;
	}
	User.cache = {};
	User.validKeys = {
		handle: true,
		webfinger: function(u) {
			u.fediProbe();
		},
		displayName: function(u) {
			u.infoQuery();
		},
		realName: function(u) {
			u.infoQuery();
		},
		key: function(u) {
			u.infoQuery();
		},
	};
	User.Get = function(handle) {
		var deal = handle.split("@");
		if (!deal[0]) return false;
		if (deal.length > 2) return false;
		if (deal[1]) {
			deal[1] = deal[1].replace(/[^\w\-\.]+/g, "");
		}
		if (!deal[1]) {
			deal[1] = "glib.app";
		}
		var h = deal[0] + "@" + deal[1];
		if (!User.cache[h]) {
			var u = new User(h);
			u.host = Host.Get(deal[1]);
		}
		return User.cache[h];
	};
	User.prototype.connect = function() {};
	User.prototype.infoQuery = function(f, t) {
		this.host.subscribe("key", function(h, f) {
			if (!h.key) return;
			h.unsubscribe(f);
			// FIXME q
		});
	};
	User.prototype.fediProbe = function(f, t) {
		var u = this;
		u.host.subscribe("webfinger", function(h, f) {
			if (!h.webfinger) return;
			h.unsubscribe(f);
			GetAccountInfo(h.webfinger, u.handle).then(function(info) {
				u.set("webfinger", info);
			});
		});
	};
	User.prototype.set = function(k, v) {
		this[k] = v;
		if (!this.subscriber[k]) return;
		for (var i = 0; i < this.subscriber[k].length; i++) {
			var f = this.subscriber[k][i];
			f(this, f);
		}
	};
	User.prototype.subscribe = function(key, callback) {
		var initFunc = User.validKeys[key];
		if (initFunc && initFunc !== true && !this[key]) initFunc(this);
		if (!initFunc || !callback) return false;
		if (!this.subscriber[key]) {
			this.subscriber[key] = [];
		}
		if (this.subscriber[key].indexOf(callback) == -1) {
			this.subscriber[key].push(callback);
		}
		callback(this, callback);
		return callback;
	};
	User.prototype.unsubscribe = function(key, callback) {
		if (!this.subscriber[key]) return false;
		var newList = [];
		for (var i = 0; i < this.subscriber[key].length; i++) {
			if (this.subscriber[key][i] == callback) continue;
			newList.push(this.subscriber[key][i]);
		}
		var r = newList.length < this.subscriber[key].length;
		this.subscriber[key] = newList;
		return r;
	};

	function Query(type, subject) {
		this.type = type;
		this.subject = subject;
	}

	var loadList = [];
	function OnLoad(f) {
		if (loadList === false) {
			return f();
		}
		loadList.push(f);
	}
	function doOnLoad() {
		while (loadList.length) {
			loadList.shift()();
		}
		loadList = false;
	}

	function str2ptr(str) {
		if (!str) return 0;
		var ptr = vm._malloc(str.length + 1);
		for (var i = 0; i < str.length; i++) {
			vm.HEAPU8[ptr + i] = str.charCodeAt(i);
		}
		vm.HEAPU8[ptr + str.length] = 0;
		return ptr;
	}
	function ptr2str(ptr, free, maxlen) {
		if (!ptr) return null;
		var str = "";
		for (var i = 0; !maxlen || i < maxlen; i++) {
			var c = vm.HEAPU8[ptr + i];
			if (!c) break;
			str += String.fromCharCode(c);
		}
		if (free) vm._free(ptr);
		return str;
	}
	function PackObject(o, flags) {
		if (!flags) flags = 0;
		var json = JSON.stringify(o);
		var jsonPtr = str2ptr(json);
		var objPtr = vm._PackObject(jsonPtr, flags);
		vm._free(jsonPtr);
		if (!objPtr) throw new Error(ptr2str(vm._GetPackError(), false));
		o.id = ptr2str(vm._GetPackID(), false);
		var len =
			vm.HEAPU8[objPtr + 0] |
			(vm.HEAPU8[objPtr + 1] << 8) |
			(vm.HEAPU8[objPtr + 2] << 16) |
			(vm.HEAPU8[objPtr + 3] << 24);
		var buf = new Uint8Array(len);
		for (var i = 0; i < len; i++) {
			buf[i] = vm.HEAPU8[objPtr + i + 4];
		}
		vm._free(objPtr);
		return buf;
	}
	function UnpackObject(o) {
		var ptr = vm._malloc(o.length + 4) + 4;
		if (typeof o == "string") {
			for (var i = 0; i < o.length; i++) {
				vm.HEAPU8[ptr + i] = o.charCodeAt(i);
			}
		} else {
			vm.HEAPU8.subarray(ptr, ptr + o.length).set(o);
		}
		var jsonPtr = vm._UnpackObject(ptr, o.length);
		vm._free(ptr - 4);
		if (!jsonPtr) throw new Error(ptr2str(vm._GetPackError(), false));
		var json = ptr2str(jsonPtr, true);
		console.log(json);
		return JSON.parse(json);
	}
	function LoadObject(o) {
		var json = JSON.stringify(o);
		var jsonPtr = str2ptr(json);
		var r = vm._LoadObject(jsonPtr);
		vm._free(jsonPtr);
		return r;
	}
	function AccountKeygen() {
		var ptr = vm._AccountKeygen();
		if (!ptr) throw new Error("KeygenError: unknown error");
		var json = ptr2str(ptr, true);
		return JSON.parse(json);
	}
	function DeviceKeygen() {
		var ptr = vm._DeviceKeygen();
		if (!ptr) throw new Error("KeygenError: unknown error");
		var json = ptr2str(ptr, true);
		return JSON.parse(json);
	}

	var glib = {
		Query: Query,
		Object: { Pack: PackObject, Unpack: UnpackObject, Load: LoadObject, Publish: PublishObject },
		Host: Host,
		User: User,
		Group: null,
		OnLoad: OnLoad,
		VM: vm,
	};
	if (typeof window == "object") window.Glib = glib;
	if (typeof module == "object") module.exports = glib;
})();
