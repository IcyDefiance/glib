import * as React from "react";
import { LayoutGrid } from "src/components/material/layout-grid";
import { TextField } from "src/components/material/text-field";
import { Button } from "src/components/material/button";
import styled from "styled-components";

const Container = styled(LayoutGrid)`
	max-width: 1200px;
`;

export const Home: React.FC = () => {
	const [post, setPost] = React.useState("");

	return (
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
		</Container>
	);
};

function createPost(post: string) {
	console.log(post);
}
