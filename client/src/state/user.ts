import { BehaviorSubject } from "rxjs";
import { none, Option, some } from "../common/option";
import * as Glib from "../glib/glib.js";

Glib.OnLoad(() => {});

const userBS = new BehaviorSubject<Option<{ key: string; secret: string }>>(none);
export const user$ = userBS.asObservable();

export function createAccount() {
	const start = Date.now();
	const key = Glib.AccountKeygen();
	const end = Date.now();
	console.log(`${(end - start) / 1000} secs`, key);
	userBS.next(some(key));
}

function deviceKeygen() {
	const start = Date.now();
	const key = Glib.DeviceKeygen();
	const end = Date.now();
	console.log(`${(end - start) / 1000} secs`, key);
}
