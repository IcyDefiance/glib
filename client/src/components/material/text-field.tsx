import * as React from "react";
import { MDCTextField } from "@material/textfield/index";

export interface TextFieldProps extends React.HTMLAttributes<HTMLDivElement> {
	fullwidth?: boolean;
	noLabel?: boolean;
	textarea?: boolean;
}

export const TextFieldFn: React.FC<TextFieldProps> = props => {
	const ref = React.useCallback((el: HTMLElement | null) => el && new MDCTextField(el), []);

	const classes = [];
	props.fullwidth && classes.push("mdc-text-field--fullwidth");
	props.noLabel && classes.push("mdc-text-field--no-label");
	props.textarea && classes.push("mdc-text-field--textarea");
	props.className && classes.push(props.className);

	const htmlProps = { ...props };
	delete htmlProps.fullwidth;
	delete htmlProps.noLabel;
	delete htmlProps.textarea;

	return (
		<div ref={ref} {...htmlProps} className={`mdc-text-field ${classes.join(" ")}`}>
			{props.children}
		</div>
	);
};

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = props => (
	<>
		<input {...props} className={`mdc-text-field__input ${props.className || ""}`} />
		<div className="mdc-line-ripple"></div>
	</>
);

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
	label?: string;
}
export const Textarea: React.FC<TextareaProps> = props => {
	const htmlProps = { ...props };
	delete htmlProps.label;

	return (
		<>
			<textarea {...htmlProps} className={`mdc-text-field__input ${props.className || ""}`} />
			<div className="mdc-notched-outline mdc-notched-outline--upgraded">
				<div className="mdc-notched-outline__leading"></div>
				{props.label && (
					<div className="mdc-notched-outline__notch">
						<label className="mdc-floating-label">{props.label}</label>
					</div>
				)}
				<div className="mdc-notched-outline__trailing"></div>
			</div>
		</>
	);
};

export const TextField = Object.assign(TextFieldFn, { Input, Textarea });
