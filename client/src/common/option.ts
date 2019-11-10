import { Frozen, Immutable } from "./decorators";

export interface IOption<T> {
	andThen<U>(cb: (val: T) => IOption<U>): IOption<U>;
	isSome(): boolean;
	isNone(): boolean;
	map<U>(cb: (val: T) => U): IOption<U>;
	match<U>(matcher: IOptionMatcher<T, U>): U;
	unwrapOrElse(alt: () => T): T;
}

@Frozen
@Immutable
export class Some<T> implements IOption<T> {
	constructor(private val: T) {}

	andThen<U>(cb: (val: T) => IOption<U>): IOption<U> {
		return cb(this.val);
	}

	isSome(): boolean {
		return true;
	}

	isNone(): boolean {
		return false;
	}

	map<U>(cb: (val: T) => U): Some<U> {
		return some(cb(this.val));
	}

	match<U>(matcher: IOptionMatcher<T, U>): U {
		return matcher.some(this.val);
	}

	unwrapOrElse(alt: () => T): T {
		return this.val;
	}
}

@Frozen
@Immutable
export class None implements IOption<never> {
	andThen(): None {
		return this;
	}

	isSome(): boolean {
		return false;
	}

	isNone(): boolean {
		return true;
	}

	map(): None {
		return this;
	}

	match<U>(matcher: IOptionMatcher<never, U>): U {
		return matcher.none();
	}

	unwrapOrElse<T>(alt: () => T): T {
		return alt();
	}
}

export function some<T>(val: T) {
	return new Some(val);
}

export const none = new None();

export interface IOptionMatcher<T, U> {
	some: (val: T) => U;
	none: () => U;
}
