export function register(): Promise<ServiceWorkerRegistration> {
	return new Promise((resolve, reject) =>
		window.addEventListener("load", () =>
			navigator.serviceWorker
				.register("/service-worker.js")
				.then(resolve)
				.catch(reject),
		),
	);
}
