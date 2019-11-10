import { BehaviorSubject } from "rxjs";

const messagesBS = new BehaviorSubject<IMessageIndexed[]>([]);
export const messages$ = messagesBS.asObservable();

export function addMessage(newMsg: IMessage) {
	const msgs = messagesBS.value;
	let index = 0;
	if (msgs.length > 0) {
		index = msgs[msgs.length - 1].index + 1;
	}
	messagesBS.next([...msgs, { ...newMsg, index }]);
}

export interface IMessageIndexed extends IMessage {
	index: number;
}

export interface IMessage {
	from: string;
	text: string;
}
