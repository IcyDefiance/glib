use serde::Serialize;
use serde_repr::Serialize_repr;
use std::collections::HashMap;

type AutoID = String;
type Timestamp = i64;
type Signature = String;
type AccountKey = String;
type DeviceKey = String;

#[allow(dead_code)]
#[derive(Serialize_repr)]
#[repr(u8)]
enum CertificateType {
	GroupInvite,
	GroupMember,
	DeviceConfig,
	HumanNameAuthority,
	DomainNameAuthority,
	RadioNameAuthority,
}

#[allow(dead_code)]
#[derive(Serialize_repr)]
#[repr(u8)]
enum DevicePlatform {
	Desktop,
	Server,
	Browser,
	Phone,
	Tablet,
	Watch,
	Appliance,
}

#[allow(dead_code)]
#[derive(Serialize_repr)]
#[repr(u8)]
enum ObjectType {
	Certificate,
	Device,
	Host,
	Account,
	Group,
	Message,
	Reaction,
	Deletion,
	Custom,
}

#[allow(dead_code)]
#[derive(Serialize_repr)]
#[repr(u8)]
enum SecurityUXTradeoff {
	Open,
	Balanced,
	Closed,
}

#[derive(Serialize)]
struct BaseObject {
	id: AutoID,
	timestamp: Timestamp,
	r#type: ObjectType,
	encrypted: bool,
	signature: Option<HashMap<AutoID, Signature>>,
	to: Vec<AutoID>,
}

#[derive(Serialize)]
struct Account {
	#[serde(flatten)]
	base: BaseObject,
	key: Option<AccountKey>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct Host {
	#[serde(flatten)]
	account: Account,
	domain: String,
	handle_policy: SecurityUXTradeoff,
}

#[derive(Serialize)]
struct Device {
	#[serde(flatten)]
	base: BaseObject,
	key: DeviceKey,
	platform: DevicePlatform,
}

#[derive(Serialize)]
struct Certificate {
	#[serde(flatten)]
	base: BaseObject,
	cert: CertificateType,
	valid: Timestamp,
	expires: Timestamp,
}

#[derive(Serialize)]
struct DeviceConfig {
	#[serde(flatten)]
	cert: Certificate,
	account: AutoID,
	device: AutoID,
	name: String,
	hosts: Vec<String>,
	secure: bool,
	inbox: bool,
	notify: bool,
}
