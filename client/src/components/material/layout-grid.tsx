import * as React from "react";

const LayoutGridFn: React.FC<React.HTMLAttributes<HTMLDivElement>> = props => {
	return (
		<div {...props} className={`mdc-layout-grid ${props.className || ""}`}>
			<div className="mdc-layout-grid__inner">{props.children}</div>
		</div>
	);
};

export interface CellProps extends React.HTMLAttributes<HTMLDivElement> {
	span?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
}
const Cell: React.FC<CellProps> = props => {
	const classes = [];
	props.span && classes.push(`mdc-layout-grid__cell--span-${props.span}`);
	props.className && classes.push(props.className);

	const htmlProps = { ...props };
	delete htmlProps.span;

	return <div {...props} className={`mdc-layout-grid__cell ${classes.join(" ")}`} />;
};

export const LayoutGrid = Object.assign(LayoutGridFn, { Cell });
