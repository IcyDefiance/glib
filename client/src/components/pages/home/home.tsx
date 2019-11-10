import * as React from "react";
import { Link } from "react-router-dom";
import * as Glib from "../../../glib/glib.js";
import { Button } from "../../material/button";

Glib.OnLoad(() => {});

function accountKeygen() {
	const start = Date.now();
	const key = Glib.AccountKeygen();
	const end = Date.now();
	console.log((end - start) / 1000);
	console.log(key);
}

function deviceKeygen() {
	const start = Date.now();
	const key = Glib.AccountKeygen();
	const end = Date.now();
	console.log((end - start) / 1000);
	console.log(key);
}

export const Home: React.FC = () => (
	<div className="mt-3">
		<Link to="/profile/Gargron@mastodon.social">Gargron@mastodon.social</Link>
		<br />
		<Link to="/profile/rms@gnusocial.no">rms@gnusocial.no</Link>
		<br />
		<Button onClick={() => accountKeygen()}>Account Keygen</Button>
		<br />
		<Button onClick={() => deviceKeygen()}>Device Keygen</Button>
	</div>
);
