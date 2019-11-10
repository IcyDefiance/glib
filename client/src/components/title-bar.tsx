import * as React from "react";
import styled from "styled-components";
import { miWindowClose, miWindowMaximize, miWindowMinimize } from "./icons/icons";
import { Button } from "./material/button";
import { Link } from "react-router-dom";

declare function minimize(): void;
declare function maximize(): void;

const TitleWrap = styled.div`
	-webkit-app-region: drag;
	user-select: none;
	position: fixed;
	z-index: 2147483647;
	top: 0;
	right: 0;
	left: 0;
	background-color: #191a1c;

	> * > * {
		-webkit-app-region: no-drag;
	}
`;

const TitleLink = styled(Link)`
	color: #6c757d;

	&:hover {
		color: #868e96;
		text-decoration: none;
	}
`;

const TitleAdjust = styled.div`
	height: 32px;
`;

export const TitleBar: React.FC = () => {
	return (
		<>
			<TitleWrap className="d-flex align-items-stretch">
				<div className="flex-grow-1 d-flex align-items-center pl-2">
					<TitleLink to="/">Glib</TitleLink>
				</div>
				<div>
					<Button
						type="button"
						color="muted"
						dense
						tabIndex={-1}
						className="rounded-0 px-0"
						onClick={() => minimize()}
					>
						<Button.Icon icon={miWindowMinimize} className="mr-0" />
					</Button>
					<Button
						type="button"
						color="muted"
						dense
						tabIndex={-1}
						className="rounded-0 px-0"
						onClick={() => maximize()}
					>
						<Button.Icon icon={miWindowMaximize} className="mr-0" />
					</Button>
					<Button
						type="button"
						color="danger"
						dense
						tabIndex={-1}
						className="rounded-0 px-0"
						onClick={() => window.close()}
					>
						<Button.Icon icon={miWindowClose} className="text-muted mr-0" />
					</Button>
				</div>
			</TitleWrap>
			<TitleAdjust />
		</>
	);
};
