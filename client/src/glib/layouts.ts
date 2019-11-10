/**
 * An ID generated from the other fields in the object, except the signature.
 *
 * You can merge the signatures of two objects with the same ID without changing the ID, but if the value of any other
 * field changes, so will the ID.
 */
type AutoID = string;
type Domain = string;
/**
 * Format: `username@example.com` OR `$AccountID@example.com`
 *
 * The host is required after usernames, but optional after AccountIDs
 *
 * ### Username constraints
 * * Allowed characters are`A-Z`, `a-z`, `0-9`, and `-`
 * * The first character must be `A-Z` or `a-z`
 * * Comparison is not case-sensitive
 */
type Handle = string;
/**
 * An integer value representing the number of milliseconds since January 1, 1970, 00:00:00.
 */
type Timestamp = number;
type PublicKey = string;
/**
 * A cryptographic signature on the id.
 */
type Signature = Map<string, string>;

type NetworkObject = Certificate | Host | Account | Message | Reaction | Deletion;

interface Verification {
	fields: string[];
	signer: AutoID;
	signature: Signature;
}

interface Certificate extends BaseObject {
	type: "Certificate";
	valid: Timestamp;
	expires: Timestamp;
	subject: AutoID;
	signer: AutoID;
	signature: Signature;
}

/**
 * ### Starting a new domain
 * Create a Host object and public key, sign it with that same key, serve it from the API endpoint on the domain it's
 * claiming to be.
 */
interface Host extends BaseObject {
	type: "Host";
	publicKey: PublicKey;
	domain: Domain;
	signature: Signature;
}

/**
 * ### Making a new account
 * Create an Account object, key, and handle, sign it with that same key, send it to the Host that matches the handle,
 * the host adds their signature to it also and sends it back to you. Optionally fill in the real name and have it also
 * signed by whatever entity is trusted to verify real names.
 */
interface Account extends BaseObject {
	type: "Account";
	/**
	 * Must be signed by the host, otherwise it will be replaced with `null` when unpacking.
	 */
	handle: Handle | null;
	displayName: string;
	publicKey: PublicKey;
	/**
	 * Must be signed by a trusted authority, otherwise it will be replaced with `null` when unpacking.
	 */
	realName: string | null;
	signature: Signature;
}

interface Message extends BaseObject {
	type: "Message";
	to: AutoID[];
	text: string;
	tagged: AutoID[];
	author: AutoID;
	signature: Signature;
}

interface Reaction extends BaseObject {
	type: "Reaction";
	message: AutoID;
	author: AutoID;
	signature: Signature;
}

interface Deletion extends BaseObject {
	type: "Deletion";
	target: AutoID;
	signature: Signature;
}

interface BaseObject {
	id: AutoID;
	timestamp: Timestamp;
	type: string;
}
