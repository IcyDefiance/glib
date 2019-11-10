import * as React from "react";
import { useObservable } from "rxjs-hooks";
import { messages$, addMessage } from "src/state/chat";
import styled from "styled-components";
import { TextField, Input } from "../material/text-field";

const From = styled.span`
	color: #0ff;
`;

const Messages: React.FC<React.HTMLAttributes<HTMLDivElement>> = props => {
	const messages = useObservable(() => messages$);

	let inner;
	if (messages && messages.length > 0) {
		inner = messages.map(msg => (
			<div className="msg" key={msg.index}>
				<From>{msg.from}</From> <span className="text">{msg.text}</span>
			</div>
		));
	} else {
		inner = "Chat is empty";
	}

	return (
		<div {...props} className={`d-flex flex-column justify-content-end ${props.className}`}>
			{inner}
		</div>
	);
};

export const Chat: React.FC = () => {
	const [text, setText] = React.useState("");

	function onKeyUp(event: React.KeyboardEvent<HTMLDivElement>) {
		if (event.keyCode == 13) {
			addMessage({ from: "icydefiance", text });
			setText("");
		}
	}

	return (
		<div className="d-flex flex-column" style={{ height: "100vh" }}>
			<Messages className="flex-grow-1"></Messages>
			<TextField>
				<Input onKeyUp={onKeyUp} value={text} onChange={e => setText(e.currentTarget.value)}></Input>
			</TextField>
		</div>
	);
};
