import * as React from "react";
import { MDCTextField } from "@material/textfield/index";

export interface TextFieldProps {
	children: React.ReactNode;
}

export const TextField: React.FC<TextFieldProps> = ({ children }) => {
	const ref = React.useCallback((el: HTMLElement | null) => {
		if (el) {
			new MDCTextField(el);
		}
	}, []);

	return (
		<div ref={ref} className="mdc-text-field">
			{children}
			<div className="mdc-line-ripple"></div>
		</div>
	);
};

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = props => (
	<>
		<input {...props} className={`mdc-text-field__input ${props.className || ""}`} />
		<div className="mdc-line-ripple"></div>
	</>
);
