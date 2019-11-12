use actix_files::{Files, NamedFile};
use actix_web::{web, web::Bytes, App, HttpResponse, HttpServer, Responder};
use chrono::{offset::Utc, Duration};
use listenfd::ListenFd;
use maplit::hashmap;
use serde::Serialize;
use serde_json::to_value;
use serde_repr::Serialize_repr;
use std::collections::HashMap;

fn main() {
	let mut server = HttpServer::new(|| {
		App::new()
			.service(
				web::scope("/api").route("/fetch", web::get().to(fetch)).route("/publish", web::post().to(publish)),
			)
			.route("/", web::get().to(index))
			.service(Files::new("/", "client/dist"))
	});

	server = if let Some(l) = ListenFd::from_env().take_tcp_listener(0).unwrap() {
		server.listen(l).unwrap()
	} else {
		server.bind("127.0.0.1:8000").unwrap()
	};

	server.run().unwrap();
}

fn index() -> impl Responder {
	NamedFile::open("client/dist/index.html")
}

fn fetch() -> impl Responder {
	let host = to_value(Host {
		account: Account {
			base: BaseObject {
				id: "0".into(),
				timestamp: Utc::now().timestamp_millis(),
				r#type: ObjectType::Host,
				encrypted: false,
				signature: Some(hashmap! { "0".into() => "localhost".into() }),
				to: vec![],
			},
			key: Some("".into()),
		},
		domain: "localhost".into(),
		handle_policy: SecurityUXTradeoff::Open,
	})
	.unwrap();

	let device = to_value(Device {
		base: BaseObject {
			id: "1".into(),
			timestamp: Utc::now().timestamp_millis(),
			r#type: ObjectType::Device,
			encrypted: false,
			signature: Some(hashmap! { "1".into() => "localhost".into() }),
			to: vec![],
		},
		key: "".into(),
		platform: DevicePlatform::Server,
	})
	.unwrap();

	let conf = to_value(DeviceConfig {
		cert: Certificate {
			base: BaseObject {
				id: "2".into(),
				timestamp: Utc::now().timestamp_millis(),
				r#type: ObjectType::Certificate,
				encrypted: false,
				signature: Some(hashmap! { "2".into() => "localhost".into() }),
				to: vec![],
			},
			cert: CertificateType::DeviceConfig,
			valid: Utc::now().timestamp_millis(),
			expires: (Utc::now() + Duration::weeks(104)).timestamp_millis(),
		},
		account: "0".into(),
		device: "1".into(),
		name: "glib".into(),
		hosts: vec!["localhost".into()],
		secure: false,
		inbox: false,
		notify: false,
	})
	.unwrap();

	HttpResponse::Ok().json(vec![host, device, conf])
}

fn publish(bytes: Bytes) -> impl Responder {
	println!("{}", String::from_utf8_lossy(&bytes));
	HttpResponse::Ok()
}

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
