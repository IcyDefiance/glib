import { Observable, Subject } from "rxjs";
import { filter } from "rxjs/operators";
import * as Glib from "../glib/glib.js";
import { AutoID, Message, NetworkObject, ObjectType } from "../glib/layouts";

// let evtSource = new EventSource("/api/stream");
// evtSource.addEventListener("message", event =>
// 	objsS.next(Glib.Object.Unpack(JSON.parse((event as MessageEvent).data)[0].data)),
// );

// const objsS = new Subject<NetworkObject>();
// export const objs$ = objsS.asObservable();
// export const messages$ = objs$.pipe(filter(obj => obj.type == ObjectType.Message)) as Observable<Message>;

// objs$.subscribe(obj => Glib.Object.Load(obj));

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
