import { iter } from "common/iter";
import * as React from "react";
import { useObservable } from "rxjs-hooks";
import { scan, tap } from "rxjs/operators";
import { Button } from "src/components/material/button";
import { LayoutGrid } from "src/components/material/layout-grid";
import { TextField } from "src/components/material/text-field";
import { Message } from "src/glib/layouts";
import { createMessage, messages$, publish } from "src/state/objects";
import styled from "styled-components";

const Container = styled(LayoutGrid)`
	max-width: 1200px;
`;

export const Home: React.FC = () => {
	const [post, setPost] = React.useState("");

	const objs = useObservable(() =>
		messages$.pipe(
			tap(msg => console.log(msg.text)),
			scan((acc: Message[], val) => [...acc, val], []),
		),
	);

	return (
		<>
			<Container className="container mt-3">
				<LayoutGrid.Cell span={12}>
					<TextField fullwidth noLabel textarea>
						<TextField.Textarea
							label="Create a new post"
							value={post}
							onChange={e => setPost(e.target.value)}
						/>
					</TextField>
					<div className="d-flex justify-content-end">
						<Button onClick={() => createPost(post)}>Submit</Button>
					</div>
				</LayoutGrid.Cell>
				<LayoutGrid.Cell span={12}>
					{objs &&
						iter(objs)
							.enumerate()
							.map(([i, obj]) => (
								<React.Fragment key={i}>
									{obj.text}
									<hr />
								</React.Fragment>
							))}
				</LayoutGrid.Cell>
			</Container>
		</>
	);
};

function createPost(post: string) {
	publish(createMessage(post, null, null, null, [], "dummy"));
}
