import { remote } from "electron";

const windowAny = window as any;

windowAny.minimize = () => remote.getCurrentWindow().minimize();
windowAny.maximize = () => {
	const win = remote.getCurrentWindow();
	win.isMaximized() ? win.restore() : win.maximize();
};
