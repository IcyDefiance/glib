import { differenceInMinutes } from "date-fns";
import { openDB } from "idb";
import { registerRoute, RouteHandlerCallbackContext } from "workbox-routing";
import { NetworkFirst } from "workbox-strategies";

const dbPromise = openDB("streaming", 1, {
	upgrade: (db, _, _1, _2) => {
		db.createObjectStore("streaming");
	},
});

registerRoute(/\.js$/, new NetworkFirst(), "GET");

registerRoute(
	/sw\/should-stream/,
	async (context: RouteHandlerCallbackContext) => {
		const now = new Date();
		const [streamingId, streamingTime] = (await getStreamingState()) || [null, null];
		const id = Number(new URL(context.request!.url).searchParams.get("id")!);

		console.log(streamingId, streamingTime, id);

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
	console.log(event.data);
	if (event.data === "end-stream") {
		const db = await dbPromise;
		db.delete("streaming", "key");
	}
});

async function getStreamingState(): Promise<[number, Date] | null> {
	const db = await dbPromise;
	const streaming = await db.get("streaming", "key");
	if (streaming) {
		const [id, time] = JSON.parse(streaming) as [number, number];
		return [id, new Date(time)];
	} else {
		return null;
	}
}

async function setStreamingState(id: number, time: Date) {
	const db = await dbPromise;
	db.delete("streaming", "key");
	db.add("streaming", JSON.stringify([id, time]), "key");
}

function makeStreamingResponse(val: boolean) {
	return new Response(JSON.stringify(val));
}
