// Copyright © 2019, Mykos Hudson-Crisp. All rights reserved.

const CryptoCodecVM = require("../../bin/crypto-codec");

(function() {
	var swReg = null;
	var vm = new CryptoCodecVM();
	if (navigator.serviceWorker) {
		navigator.serviceWorker.register("/service-worker.js");
		navigator.serviceWorker.ready.then(function(reg) {
			swReg = reg;
			vm.then(BootVM);
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

	function dbWrite(t, o, local) {
		var url = "/api/publish?table=" + encodeURIComponent(t);
		if (local) url += "&local=yes";
		return fetch(url, { method: "POST", body: JSON.stringify(o) });
	}
	function dbRead(t, k, local) {
		var url = "/api/fetch?table=" + encodeURIComponent(t) + "&key=" + encodeURIComponent(k);
		if (local) url += "&local=yes";
		return fetch(url).then(function(x) {
			return x.json();
		});
	}

	var con = new RTCPeerConnection({ iceServers: [{ url: "stun:stun.l.google.com:19302" }] });
	con.onicecandidate = function(x) {
		//User.AddICECandidate(localConnection, e);
	};
	con.ondatachannel = function(e) {
		var ch = e.channel;
		//ch.onerror =
		//ch.onmessage =
		//ch.onopen =
		//ch.onclose =
	};

	function Host(hostname) {
		this.hostname = hostname;
		this.subscriber = {};
		Host.cache[hostname] = this;
	}
	Host.cache = {};
	Host.validKeys = ["webfinger", "nodeinfo"];
	Host.Get = function(domain) {
		var h = domain.replace(/[^\w\-\.]+/g, "");
		if (!Host.cache[h]) {
			return new Host(h);
		}
		return Host.cache[h];
	};
	Host.prototype.probe = function(resolve) {
		var o = this;
		try {
			GetWebFingerTemplate(o.hostname)
				.then(function(x) {
					o.set("webfinger", x);
				})
				.catch(function(x) {
					o.set("webfinger", false);
				});
			GetNodeInfo(o.hostname)
				.then(function(x) {
					o.set("nodeinfo", x);
				})
				.catch(function(x) {
					o.set("nodeinfo", false);
				});
		} catch (e) {
			//GetHostCache
		}
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
		if (Host.validKeys.indexOf(key) == -1) return false;
		if (!callback) return false;
		callback(this[key]);
		if (!this.subscriber[key]) {
			this.subscriber[key] = [];
		}
		if (this.subscriber[key].indexOf(callback) != -1) return false;
		this.subscriber[key].push(callback);
		return true;
	};
	Host.prototype.unsubscribe = function(key, callback) {
		if (Host.validKeys.indexOf(key) == -1) return false;
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
	User.validKeys = ["displayName", "hostname", "username"];
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
			u.set("username", deal[0]);
			u.set("hostname", deal[1]);
			u.set("host", Host.Get(deal[1]));
		}
		return User.cache[h];
	};
	User.prototype.connect = function() {};
	User.prototype.probe = function(f) {
		var h = Host.Get(this.hosthame);
		var needsProbe = true;
		h.subscribe("webfinger", function(h, f) {
			if (h.webfinger) {
				needsProbe = false;
			}
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
		if (User.validKeys.indexOf(key) == -1) return false;
		if (!callback) return false;
		if (!this.subscriber[key]) {
			this.subscriber[key] = [];
		}
		if (this.subscriber[key].indexOf(callback) != -1) return false;
		this.subscriber[key].push(callback);
		return true;
	};
	User.prototype.unsubscribe = function(key, callback) {
		if (User.validKeys.indexOf(key) == -1) return false;
		if (!this.subscriber[key]) return false;
		var newList = [];
		for (var i = 0; i < this.subscriber[key].length; i++) {
			newList.push(this.subscriber[key][i]);
		}
		var r = newList.length < this.subscriber[key].length;
		this.subscriber[key] = newList;
		return r;
	};

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

	//dbWrite("users", {handle: "handle", test: "test"});

	var glib = {
		Host: Host,
		User: User,
		PackObject: PackObject,
		UnpackObject: UnpackObject,
		AccountKeygen: AccountKeygen,
		DeviceKeygen: DeviceKeygen,
		OnLoad: OnLoad,
		VM: vm,
	};
	if (typeof window == "object") window.Glib = glib;
	if (typeof module == "object") module.exports = glib;
})();
