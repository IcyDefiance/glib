import { isElectron } from "common/util";
import * as React from "react";
import { BrowserRouter, HashRouter, Link, Route, Switch } from "react-router-dom";
import styled from "styled-components";
import { TopAppBar } from "./material/top-app-bar";
import { Home } from "./pages/home/home";
import { Profile } from "./pages/profile/profile";
import { TitleBar } from "./title-bar";

const Content = styled.div`
	width: 100vw;
	height: calc(100vh - 32px);
	overflow: auto;

	.mdc-top-app-bar--dense-fixed-adjust {
		display: none;
	}
`;

export const App: React.FC = () => {
	const electron = isElectron();

	const inner = (
		<>
			{electron && <TitleBar />}
			<Content className="position-relative">
				{!electron && (
					<TopAppBar dense className="position-static">
						<TopAppBar.Title>
							<Link to="/">Glib</Link>
						</TopAppBar.Title>
					</TopAppBar>
				)}
				<Switch>
					<Route path="/profile/:handle">
						<Profile />
					</Route>
					<Route path="/">
						<Home />
					</Route>
				</Switch>
			</Content>
		</>
	);

	// TODO: split into multiple entry points
	return electron ? <HashRouter>{inner}</HashRouter> : <BrowserRouter>{inner}</BrowserRouter>;
};
