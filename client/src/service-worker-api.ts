export function register() {
	if (navigator.serviceWorker) {
		// Use the window load event to keep the page load performant
		window.addEventListener("load", () => navigator.serviceWorker.register("/service-worker.js"));
	}
}
