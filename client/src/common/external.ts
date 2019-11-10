import { Observable } from "rxjs";

let passivesData: Observable<PassiveSkillTree> | null = null;
export function getPassivesData(): Observable<PassiveSkillTree> {
	if (!passivesData) {
		passivesData = (window as any).readPassivesData();
	}
	return passivesData!;
}

export interface PassiveSkillTree {
	assets: {
		[key: string]: {
			[key: string]: string;
		};
	};
	constants: {
		skillsPerOrbit: number[];
		orbitRadii: number[];
	};
	groups: PassiveGroups;
	imageRoot: string;
	imageZoomLevels: number[];
	nodes: {
		[key: string]: {
			id: number;
			/** Name of the node */
			dn: string;
			/** Path relative to the root to node icon */
			icon: string;
			o: number;
			oidx: number;
		};
	};
	skillSprites: {
		normalActive: SkillSprite[];
		notableActive: SkillSprite[];
		keystoneActive: SkillSprite[];
		normalInactive: SkillSprite[];
		notableInactive: SkillSprite[];
		keystoneInactive: SkillSprite[];
		mastery: SkillSprite[];
	};
}

export interface PassiveGroups {
	[key: string]: {
		x: number;
		y: number;
		oo: {
			[key: string]: number;
		};
		n: number[];
	};
}

export interface SkillSprite {
	filename: string;
	coords: {
		[key: string]: SpriteCoords;
	};
}

export interface SpriteCoords {
	x: number;
	y: number;
	w: number;
	h: number;
}
