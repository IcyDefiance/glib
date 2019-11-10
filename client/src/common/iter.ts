import { Frozen, Immutable } from "./decorators";
import { IOption, some, none } from "./option";

export function iter<T>(iterable: { [key: string]: T }): Iter<[string, T]>;
export function iter<T>(iterable: Iterable<T>): Iter<T>;
export function iter<T>(iterable: Iterable<T> | { [key: string]: T }): any {
	if ((iterable as any)[Symbol.iterator]) {
		return new BasicIter(iterable as Iterable<T>);
	} else {
		return new ObjIter(iterable as { [key: string]: T });
	}
}

@Frozen
export abstract class Iter<T> implements Iterable<T> {
	protected abstract inner(): Iterable<T>;

	[Symbol.iterator](): Iterator<T> {
		return this.inner()[Symbol.iterator]();
	}

	// --- OPERATORS ---

	enumerate(): Iter<[number, T]> {
		return this.makeTransform(enumerate);
	}

	filter(cb: (item: T) => boolean): Iter<T> {
		return this.makeTransform(filter, cb);
	}

	flatten<U>(this: Iter<Iterable<U>>): Iter<U> {
		return new TransformIter(this.inner(), flatten);
	}

	inspect(cb: (item: T) => void): Iter<T> {
		return this.makeTransform(inspect, cb);
	}

	map<U>(cb: (item: T) => U): Iter<U> {
		return this.makeTransform(map, cb);
	}

	skip(count: number): Iter<T> {
		return this.makeTransform(skip, count);
	}

	// --- COLLECTORS ---

	any(cb: (item: T) => boolean): boolean {
		for (const item of this.inner()) {
			if (cb(item)) {
				return true;
			}
		}
		return false;
	}

	eq(other: Iterable<T>): boolean {
		const left = this.inner()[Symbol.iterator]();
		const right = other[Symbol.iterator]();
		while (true) {
			const x1 = left.next();
			const x2 = right.next();
			if (x1.done && x2.done) {
				return true;
			} else if (x1.done || x2.done || x1.value !== x2.value) {
				return false;
			}
		}
	}

	nth(index: number): IOption<T> {
		for (const item of this.inner()) {
			if (index <= 0) {
				return some(item);
			}

			--index;
		}

		return none;
	}

	toArray(): T[] {
		return Array.from(this.inner());
	}

	toGroupMap<K, V>(this: Iter<[K, V]>): Map<K, V[]> {
		const ret = new Map<K, V[]>();
		for (const [key, val] of this.inner()) {
			let array = ret.get(key);
			if (!array) {
				array = [];
				ret.set(key, array);
			}
			array.push(val);
		}
		return ret;
	}

	toMap<K, V>(this: Iter<[K, V]>): Map<K, V> {
		return new Map(this.inner());
	}

	// --- PRIVATE ---

	private makeTransform<U, Args extends any[]>(
		func: (iter: Iterable<T>, ...args: Args) => IterableIterator<U>,
		...args: Args
	): TransformIter<T, U> {
		return new TransformIter(this.inner(), iter => func(iter, ...args));
	}
}

function* enumerate<T>(iter: Iterable<T>): IterableIterator<[number, T]> {
	let i = 0;
	for (const item of iter) {
		yield [i, item];
		i++;
	}
}

function* filter<T>(
	iter: Iterable<T>,
	cb: (item: T) => boolean
): IterableIterator<T> {
	for (const item of iter) {
		if (cb(item)) {
			yield item;
		}
	}
}

function* flatten<T>(iter: Iterable<Iterable<T>>): IterableIterator<T> {
	for (const sub of iter) {
		for (const item of sub) {
			yield item;
		}
	}
}

function* inspect<T>(
	iter: Iterable<T>,
	cb: (item: T) => void
): IterableIterator<T> {
	for (const item of iter) {
		cb(item);
		yield item;
	}
}

function* map<T, U>(
	iter: Iterable<T>,
	cb: (item: T) => U
): IterableIterator<U> {
	for (const item of iter) {
		yield cb(item);
	}
}

function* skip<T>(iter: Iterable<T>, count: number): IterableIterator<T> {
	for (const item of iter) {
		if (count <= 0) {
			yield item;
		} else {
			count--;
		}
	}
}

@Frozen
@Immutable
class BasicIter<T> extends Iter<T> {
	constructor(private iter: Iterable<T>) {
		super();
	}

	protected inner(): Iterable<T> {
		return this.iter;
	}
}

@Frozen
@Immutable
class ObjIter<T> extends Iter<[string, T]> {
	constructor(private obj: { [key: string]: T }) {
		super();
	}

	*[Symbol.iterator](): Iterator<[string, T]> {
		for (const key in this.obj) {
			if (this.obj.hasOwnProperty(key)) {
				yield [key, this.obj[key]];
			}
		}
	}

	protected inner(): Iterable<[string, T]> {
		return this;
	}
}

@Frozen
@Immutable
class TransformIter<I, O> extends Iter<O> {
	constructor(
		private iter: Iterable<I>,
		private transform: (iterable: Iterable<I>) => Iterator<O>
	) {
		super();
	}

	[Symbol.iterator](): Iterator<O> {
		return this.transform(this.iter);
	}

	protected inner(): Iterable<O> {
		return this;
	}
}
