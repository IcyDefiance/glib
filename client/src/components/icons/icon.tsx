import * as React from "react";
import styled from "styled-components";
import { IconDefinition } from "./icons";

export interface IconProps extends React.HTMLAttributes<HTMLOrSVGElement> {
	icon: IconDefinition;
}

const Svg = styled.svg`
	width: 1em;
`;

export function Icon(props: IconProps) {
	const htmlProps = { ...props };
	delete htmlProps.icon;

	return (
		<Svg {...htmlProps} viewBox="0 0 24 24">
			{props.icon.paths.map((p, i) => (
				<path key={i} fill={p.fill} d={p.path} />
			))}
		</Svg>
	);
}
