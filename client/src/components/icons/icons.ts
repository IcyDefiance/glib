const currentColor = "currentColor";
const none = "none";

export const miDatabasePlus: IconDefinition = {
	paths: [
		{
			path:
				"M18,14H20V17H23V19H20V22H18V19H15V17H18V14M12,3C16.42,3 20,4.79 20,7C20,9.21 16.42,11 12,11C7.58," +
				"11 4,9.21 4,7C4,4.79 7.58,3 12,3M4,9C4,11.21 7.58,13 12,13C16.42,13 20,11.21 20,9V9L20,12.08L19," +
				"12C16.41,12 14.2,13.64 13.36,15.94L12,16C7.58,16 4,14.21 4,12V9M4,14C4,16.21 7.58,18 12,18H13C13," +
				"19.05 13.27,20.04 13.75,20.9L12,21C7.58,21 4,19.21 4,17V14Z",
			fill: currentColor,
		},
	],
};
export const miDelete: IconDefinition = {
	paths: [
		{
			path: "M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z",
			fill: currentColor,
		},
	],
};
export const miInformation: IconDefinition = {
	paths: [
		{
			path:
				"M13,9H11V7H13M13,17H11V11H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z",
			fill: currentColor,
		},
	],
};
export const miWindowClose: IconDefinition = {
	paths: [
		{
			path:
				"M13.46,12L19,17.54V19H17.54L12,13.46L6.46,19H5V17.54L10.54,12L5,6.46V5H6.46L12,10.54L17.54,5H19V6.46L13.46,12Z",
			fill: currentColor,
		},
	],
};
export const miWindowMaximize: IconDefinition = {
	paths: [{ path: "M4,4H20V20H4V4M6,8V18H18V8H6Z", fill: currentColor }],
};
export const miWindowMinimize: IconDefinition = {
	paths: [{ path: "M20,14H4V10H20", fill: currentColor }],
};

export interface IconDefinition {
	paths: {
		path: string;
		fill: string;
	}[];
}
