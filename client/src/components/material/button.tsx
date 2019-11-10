import * as React from "react";
import { MDCRipple } from "@material/ripple";
import { IconProps, Icon as SvgIcon } from "../icons/icon";

export interface ButtonProps
	extends React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> {
	dense?: boolean;
	color?: "primary" | "danger" | "muted";
}

const ButtonFn: React.FC<ButtonProps> = props => {
	const ref = React.useCallback((el: HTMLElement | null) => {
		if (el) {
			new MDCRipple(el);
		}
	}, []);

	const color = !props.color || props.color === "primary" ? "" : `mdc-button-${props.color}`;
	const dense = props.dense ? "mdc-button--dense" : "";

	const htmlProps = { ...props };
	delete htmlProps.color;
	delete htmlProps.dense;

	return (
		<button ref={ref} {...htmlProps} className={`mdc-button ${color} ${dense} ${props.className || ""}`}>
			{props.children}
		</button>
	);
};

const Icon: React.FC<IconProps> = props => (
	<SvgIcon {...props} className={`mdc-button__icon ${props.className || ""}`} />
);

const Label: React.FC<React.HTMLAttributes<HTMLDivElement>> = props => (
	<span {...props} className={`mdc-button__label ${props.className || ""}`} />
);

export const Button = Object.assign(ButtonFn, { Icon, Label });
