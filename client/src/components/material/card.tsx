import * as React from "react";

const CardFn: React.FC<React.HTMLAttributes<HTMLDivElement>> = props => {
	return <div {...props} className={`mdc-card ${props.className || ""}`} />;
};

export const Card = Object.assign(CardFn);
