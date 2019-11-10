import * as React from "react";

const LayoutGridFn: React.FC<React.HTMLAttributes<HTMLDivElement>> = props => {
	return (
		<div {...props} className={`mdc-layout-grid ${props.className || ""}`}>
			<div className="mdc-layout-grid__inner">{props.children}</div>
		</div>
	);
};

const Cell: React.FC<React.HTMLAttributes<HTMLDivElement>> = props => (
	<div {...props} className={`mdc-layout-grid__cell ${props.className || ""}`} />
);

export const LayoutGrid = Object.assign(LayoutGridFn, { Cell });
