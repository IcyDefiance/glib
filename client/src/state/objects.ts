import { Observable, Subject } from "rxjs";
import { filter } from "rxjs/operators";
import { AutoID, Message, NetworkObject, ObjectType } from "../glib/layouts";

let evtSource = new EventSource("/api/stream");
evtSource.addEventListener("object-data", event => {
	const ev = event as MessageEvent;
	objsS.next(JSON.parse(JSON.parse(ev.data).data));
	console.log(ev);
});

const objsS = new Subject<NetworkObject>();
export const objs$ = objsS.asObservable();
export const messages$ = objs$.pipe(filter(obj => obj.type == ObjectType.Message)) as Observable<Message>;

export async function publish(obj: NetworkObject) {
	const res = await fetch("/api/publish", {
		method: "POST",
		body: JSON.stringify(obj),
		headers: { "Content-Type": "application/json" },
	});
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
