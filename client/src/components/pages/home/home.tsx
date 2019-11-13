import * as React from "react";
import { useObservable } from "rxjs-hooks";
import { createAccount, user$ } from "src/state/user";
import { Button } from "../../material/button";

const evtSource = new EventSource("/api/stream");
evtSource.addEventListener("object-data", ev => console.log(ev));

export const Home: React.FC = () => {
	const user = useObservable(() => user$);

	return (
		<div className="mt-3">
			{user &&
				user.match({
					some: key => <>Logged in. Public key: {key.key}</>,
					none: () => <Button onClick={() => createAccount()}>Create Account</Button>,
				})}
		</div>
	);
};
