let isElectronCache: boolean | null = null;
export function isElectron(): boolean {
	if (isElectronCache === null) {
		isElectronCache = navigator.userAgent.includes("Electron");
	}
	return isElectronCache;
}
