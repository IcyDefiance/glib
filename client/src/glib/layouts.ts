export enum CertificateType {
	GroupInvite,
	GroupMember,
	DeviceConfig,
	HumanNameAuthority,
	DomainNameAuthority,
	RadioNameAuthority,
}
export enum ObjectType {
	Custom,
	Device,
	Person,
	Group,
	Host,
	Message,
	Reaction,
	Certificate,
	Deletion,
}
export type AccountType = ObjectType.Person | ObjectType.Group | ObjectType.Host;

export type NetworkObject =
	| Certificate
	| Device
	| Host
	| Account
	| Group
	| Message
	| Reaction
	| Deletion
	| CustomObject;

/**
 * An ID generated from the other fields in the object, except the signature.
 *
 * You can merge the signatures of two objects with the same ID without changing the ID, but if the value of any other
 * field changes, so will the ID.
 */
export type AutoID = string;

/**
 * Acceptable formats:
 * * `$AccountKey`
 * * `$AccountKey@example.tld`
 * * `username@example.tld`
 *
 * Username syntax has additional constraints:
 * * Allowed characters are `A-Z`, `a-z`, `0-9`, and `-`
 * * The first character must be `A-Z` or `a-z`
 * * Comparison is not case-sensitive
 */
export type Handle = string;

/**
 * An integer value representing the number of milliseconds since January 1, 1970, 00:00:00.
 */
export type Timestamp = number;

/**
 * A public key suitable for long term signing.
 */
export type AccountKey = string;
export type AccountSignature = string; // long string... 52KB (as base64)

/**
 * A public key suitable for encryption and/or short term signing.
 */
export type DeviceKey = string;
export type DeviceSignature = string;

/**
 * Open tends to be the best UX. Closed tends to be the best security.
 */
export enum SecurityUXTradeoff {
	Open,
	Balanced,
	Closed,
}

export interface BaseObject {
	id: AutoID;
	timestamp?: Timestamp;
	/**
	 * Falsy values (including `undefined`) are taken as `ObjectType.Custom`
	 */
	type?: ObjectType;
	/**
	 * Stuff random data in here to obscure the AutoID of easily guessed messages.
	 */
	iv?: string;
	/**
	 * Enables or disables whole-object encryption.
	 * Causes `this.to` storage to double in size (+24 bytes per device listed).
	 * Also adds 32 bytes to the DTO header, but soon it will grow to 600 bytes.
	 *
	 * Easily guessed messages need `this.iv` randomized,
	 * otherwise an attacker can guess-and-check every possible message until the AutoID matches.
	 */
	encrypted: boolean;
	/**
	 * A list of `Host`, `Account`, and `Group` AutoIDs, and matching cryptographic signatures.
	 */
	signature?: Map<AutoID, AccountSignature | DeviceSignature>;
	/**
	 * A list of `Device` AutoIDs to deliver to.
	 *
	 * ## This list is *NOT* encrypted.
	 */
	to: AutoID[];
}

export interface Account extends BaseObject {
	type: AccountType;
	key: AccountKey | null;
}

/**
 * ### Starting a new domain
 * Create a Host object and public key, sign it with that same key, serve it from the API endpoint on the domain it's
 * claiming to be.
 */
export interface Host extends Account {
	type: ObjectType.Host;
	/**
	 * The DNS address of the instance. (eg. `example.tld`)
	 */
	domain: string;
	/**
	 * Policy for giving out handles.
	 * * `Open` - Anyone can claim an unused handle.
	 * * `Balanced` - Anyone can ask for a handle; an admin has to approve.
	 * * `Closed` - Handles are only given by an admin
	 */
	handlePolicy: SecurityUXTradeoff;
}

/**
 * ### Making a new user profile
 * Create a User object, key, and handle, sign it with that same key, send it to the Host that matches the handle,
 * the host adds their signature to it also and sends it back to you. Optionally fill in the real name and have it also
 * signed by whatever entity is trusted to verify real names.
 */
export interface User extends Account {
	/**
	 * Must be signed by the matching host, otherwise it will be replaced with `null` when unpacking.
	 */
	handle: Handle | null;
	/**
	 * Must be signed by a trusted authority, otherwise it will be replaced with `null` when unpacking.
	 */
	realName: string | null;
	/**
	 * Most preferred name for the account.
	 *
	 * *(Chosen by the user, vulnerable to impersonation)*
	 */
	displayName: string;
}

/**
 * ### Starting a new group
 * Create a Group object and public key, sign it with that same key, serve it from the API endpoint on the domain it's
 * claiming to be.
 */
export interface Group extends Account {
	type: ObjectType.Group;
	name: string;
	admins: Handle[];
	/**
	 * Hides the existence of the group from anyone without an invite.
	 * Secure if every group member is secure. (ie. not secure)
	 */
	unlisted: boolean;
	/**
	 * Requires people have an invite from someone in the group.
	 */
	inviteOnly: boolean;
	/**
	 * Requires posts to the group be approved by an admin before they show up on the public page.
	 */
	reviewPosts: boolean;
	/**
	 * Policy for adding people to the group.
	 * *(All policies are still subject to inviteOnly.)*
	 * * `Open` - Anyone on the network can join.
	 * * `Balanced` - Anyone can ask to join, an admin has to approve.
	 * * `Closed` - People have to be invited by an admin
	 */
	joinPolicy: SecurityUXTradeoff;
	/**
	 * Policy for posting messages to the group.
	 * *(All policies are still subject to reviewPosts.)*
	 * * `Open` - Anyone on the network can post.
	 * * `Balanced` - Only group members can post.
	 * * `Closed` - Only members with `rank >= Poster` can post.
	 */
	postPolicy: SecurityUXTradeoff;
	/**
	 * Policy for reading messages posted to the group.
	 * * `Open` - Anyone can see group posts and users.
	 * * `Balanced` - Anyone can see posts. Only members see users.
	 * * `Closed` - Only members see posts and users.
	 */
	viewPolicy: SecurityUXTradeoff;
}

export enum DevicePlatform {
	Desktop,
	Server,
	Browser,
	Phone,
	Tablet,
	Watch,
	Appliance,
}

export interface Device extends BaseObject {
	type: ObjectType.Device;
	key: DeviceKey;
	platform: DevicePlatform;
}

export interface Message extends BaseObject {
	type: ObjectType.Message;
	text: string;
	title: string | null;
	replyTo: AutoID | null;
	replaces: AutoID | null;
	tagged: AutoID[];
	author: AutoID;
}

export interface CustomObject extends BaseObject {
	type: ObjectType.Custom;
	customType: string;
}

export enum ReactionType {
	Like,
	Love,
	Laugh,
	Shock,
	WTF,
	Angry,
}

export interface Reaction extends BaseObject {
	type: ObjectType.Reaction;
	react: ReactionType;
	replyTo: AutoID;
	author: AutoID;
}

export interface Deletion extends BaseObject {
	type: ObjectType.Deletion;
	target: AutoID[];
}

export interface Certificate extends BaseObject {
	type: ObjectType.Certificate;
	cert: CertificateType;
	valid: Timestamp;
	expires: Timestamp;
}

export interface GroupInvite extends Certificate {
	cert: CertificateType.GroupInvite;
	person: Handle;
}

export enum GroupMemberRank {
	Reader,
	Poster,
	Admin,
	Owner,
}

export interface GroupMember extends Certificate {
	cert: CertificateType.GroupMember;
	person: Handle;
	rank: GroupMemberRank;
}

export interface DeviceConfig extends Certificate {
	cert: CertificateType.DeviceConfig;
	account: AutoID;
	device: AutoID;
	name: string;
	hosts: string[];
	secure: boolean;
	inbox: boolean;
	notify: boolean;
}
