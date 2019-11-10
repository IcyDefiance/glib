import { Frozen, Immutable } from "./decorators";

@Frozen
@Immutable
export class Rect {
	constructor(public x: number, public y: number, public width: number, public height: number) {}

	contains(coord: Vec2): boolean {
		return coord.x >= this.x && coord.y >= this.y && coord.x < this.width && coord.y < this.height;
	}
}

@Frozen
@Immutable
export class Vec2 {
	constructor(public x: number, public y: number) {}

	add(rhs: Vec2) {
		return new Vec2(this.x + rhs.x, this.y + rhs.y);
	}

	mul(s: number): Vec2 {
		return new Vec2(this.x * s, this.y * s);
	}
}

@Frozen
@Immutable
export class Vec3 {
	static readonly unitX = new Vec3(1, 0, 0);
	static readonly unitY = new Vec3(0, 1, 0);
	static readonly unitZ = new Vec3(0, 0, 1);
	static readonly unitNX = new Vec3(-1, 0, 0);
	static readonly unitNY = new Vec3(0, -1, 0);
	static readonly unitNZ = new Vec3(0, 0, -1);

	constructor(public x: number, public y: number, public z: number) {}

	add(rhs: Vec3) {
		return new Vec3(this.x + rhs.x, this.y + rhs.y, this.z + rhs.z);
	}

	cross(rhs: Vec3): Vec3 {
		return new Vec3(
			this.y * rhs.z - this.z * rhs.y,
			this.z * rhs.x - this.x * rhs.z,
			this.x * rhs.y - this.y * rhs.x,
		);
	}

	mul(s: number): Vec3 {
		return new Vec3(this.x * s, this.y * s, this.z * s);
	}

	xy(): Vec2 {
		return new Vec2(this.x, this.y);
	}
}

@Frozen
@Immutable
export class Quat {
	static from_axis_angle(axis: Vec3, angle: number): Quat {
		const halfAngle = angle * 0.5;
		let sin = Math.sin(halfAngle);
		let cos = Math.cos(halfAngle);
		return new Quat(axis.mul(sin), cos);
	}

	static from_angle_z(theta: number): Quat {
		return Quat.from_axis_angle(Vec3.unitZ, theta);
	}

	constructor(public v: Vec3, public s: number) {}

	mulv(rhs: Vec3): Vec3 {
		const tmp = this.v.cross(rhs).add(rhs.mul(this.s));
		return this.v
			.cross(tmp)
			.mul(2)
			.add(rhs);
	}
}
