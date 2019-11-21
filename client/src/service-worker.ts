import { differenceInMinutes } from "date-fns";
import { openDB } from "idb";
import { registerRoute, RouteHandlerCallbackContext } from "workbox-routing";
import { NetworkFirst } from "workbox-strategies";

const dbPromise = openDB("glib.app/sw", 1, {
	upgrade: (db, _, _1, _2) => {
		db.createObjectStore("state");
	},
});

registerRoute(/\.js$/, new NetworkFirst(), "GET");

registerRoute(
	/sw\/should-stream/,
	async (context: RouteHandlerCallbackContext) => {
		const now = new Date();
		const [streamingId, streamingTime] = (await getStreamingState()) || [null, null];
		const id = Number(new URL(context.request!.url).searchParams.get("id")!);

		if (streamingId === null || id === streamingId || differenceInMinutes(now, streamingTime!) >= 2) {
			await setStreamingState(id, now);
			return makeStreamingResponse(true);
		} else {
			return makeStreamingResponse(false);
		}
	},
	"GET",
);

addEventListener("message", async event => {
	if (event.data === "end-stream") {
		const db = await dbPromise;
		db.delete("state", "streaming");
	}
});

async function getStreamingState(): Promise<[number, Date] | null> {
	const db = await dbPromise;
	const streaming = await db.get("state", "streaming");
	if (streaming) {
		const [id, time] = JSON.parse(streaming) as [number, number];
		return [id, new Date(time)];
	} else {
		return null;
	}
}

async function setStreamingState(id: number, time: Date) {
	const db = await dbPromise;
	db.delete("state", "streaming");
	db.add("state", JSON.stringify([id, time]), "streaming");
}

function makeStreamingResponse(val: boolean) {
	return new Response(JSON.stringify(val));
}
