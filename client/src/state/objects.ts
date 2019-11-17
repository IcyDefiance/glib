import { Observable, Subject } from "rxjs";
import { filter } from "rxjs/operators";
import { PackObject, UnpackObject } from "../glib/glib";
import { AutoID, Message, NetworkObject, ObjectType } from "../glib/layouts";

let evtSource = new EventSource("/api/stream");
evtSource.addEventListener("message", event =>
	objsS.next(UnpackObject(JSON.parse((event as MessageEvent).data)[0].data)),
);

const objsS = new Subject<NetworkObject>();
export const objs$ = objsS.asObservable();
export const messages$ = objs$.pipe(filter(obj => obj.type == ObjectType.Message)) as Observable<Message>;

objs$.subscribe(obj => console.log("stream", obj));

export async function publish(obj: NetworkObject) {
	console.log("publish", obj);
	const body = PackObject(obj);
	const headers = { "Content-Type": "application/octet-stream" };
	const res = await fetch("/api/publish", { method: "POST", body, headers });
	return res.json();
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
