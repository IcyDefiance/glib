/**
 * Freeze constructor and prototype.
 * @param target Target.
 */
// tslint:disable-next-line: ban-types
export function Frozen(target: Function): void {
	Object.freeze(target);
	Object.freeze(target.prototype);
}

/**
 * Make all class instances immutable
 * @param target Target.
 */
export function Immutable<T extends { new (...args: any[]): object }>(
	target: T
): T {
	return class extends target {
		constructor(...args: any[]) {
			super(...args);
			Object.freeze(this);
		}
	};
}
