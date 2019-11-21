import * as Glib from "../glib/glib.js";
import { AutoID, Message, NetworkObject, ObjectType } from "../glib/layouts";
import { register } from "src/service-worker-api";

(async () => {
	const sw = await register();

	let streaming = false;

	const tabid = Math.random();
	const poll = async () => {
		const res = await fetch(`sw/should-stream?id=${tabid}`);
		if (!streaming) {
			streaming = await res.json();
			if (streaming) {
				// start stream
				console.log("streaming");
			}
		}
	};

	window.addEventListener("storage", poll);
	window.addEventListener("beforeunload", () => {
		if (streaming) {
			window.removeEventListener("storage", poll);
			sw.active!.postMessage("end-stream");
			localStorage.setItem("end-stream", "");
		}
	});

	setInterval(poll, 60000);
	poll();
})();

export async function publish(obj: NetworkObject) {
	Glib.Object.Publish(obj);
}

export function createMessage(
	text: string,
	title: string | null,
	replyTo: AutoID | null,
	replaces: AutoID | null,
	tagged: AutoID[],
	author: AutoID,
): Message {
	return {
		id: "dummy",
		type: ObjectType.Message,
		encrypted: false,
		to: [],
		text,
		title,
		replyTo,
		replaces,
		tagged,
		author,
	};
}
