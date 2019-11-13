mod layouts;

use actix_files::{Files, NamedFile};
use actix_web::{
	http::header::{CacheControl, CacheDirective, ACCESS_CONTROL_ALLOW_ORIGIN},
	middleware::Logger,
	web,
	web::{Bytes, Query},
	App, HttpResponse, HttpServer, Responder,
};
use chrono::{prelude::*, serde::ts_milliseconds};
use futures::sync::mpsc::{channel, Sender};
use lazy_static::lazy_static;
use listenfd::ListenFd;
use serde::{Deserialize, Serialize};
use serde_json::to_string;
use std::{
	collections::{HashSet, VecDeque},
	sync::{Mutex, RwLock},
};

const MAX_OBJECTS: usize = 256;

lazy_static! {
	static ref OBJECTS: RwLock<VecDeque<Event>> = RwLock::default();
	static ref STREAMS: Mutex<Vec<Sender<Bytes>>> = Mutex::default();
	static ref EPOCH: DateTime<Utc> = Utc.ymd(1970, 1, 1).and_hms(0, 0, 0);
}

fn main() {
	std::env::set_var("RUST_LOG", "actix_web=info");
	env_logger::init();

	let mut server = HttpServer::new(|| {
		App::new()
			.wrap(Logger::default())
			.service(
				web::scope("/api")
					.route("/fetch", web::get().to(fetch))
					.route("/publish", web::post().to(publish))
					.route("/stream", web::get().to(stream)),
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

#[derive(Deserialize)]
struct FetchParams {
	#[serde(with = "ts_milliseconds")]
	#[serde(default = "epoch")]
	since: DateTime<Utc>,
}
fn fetch(query: Query<FetchParams>) -> impl Responder {
	let mut ok = HttpResponse::Ok();
	let objs = OBJECTS.read().unwrap();
	if query.since == *EPOCH {
		ok.json(&*objs)
	} else {
		ok.json(objs.iter().filter(|x| x.time >= query.since).collect::<Vec<&Event>>())
	}
}

fn publish(body: String) -> impl Responder {
	let event = Event { time: Utc::now(), data: body };
	let res = HttpResponse::Ok().content_type("application/json").json(&event);

	{
		let mut closed = HashSet::new();
		let mut streams = STREAMS.lock().unwrap();
		for (i, send) in streams.iter_mut().enumerate() {
			if !send
				.try_send(format!("event: object-data\ndata: {}\n\n", to_string(&event).unwrap()).into())
				.map(|_| true)
				.unwrap_or_else(|e| e.is_full())
			{
				closed.insert(i);
			}
		}
		if closed.len() > 0 {
			println!("closed");
			*streams =
				streams.iter().enumerate().filter(|(i, _)| !closed.contains(i)).map(|(_, send)| send.clone()).collect();
		}
	}

	{
		let mut objs = OBJECTS.write().unwrap();
		if objs.len() == MAX_OBJECTS {
			objs.pop_front();
		}
		objs.push_back(event);
	}

	res
}

fn stream() -> impl Responder {
	let (mut send, rec) = channel(1024 * 1024);
	send.try_send(format!("event: server-time\ndata: {}\n\n", Utc::now().timestamp_millis()).into()).unwrap();
	STREAMS.lock().unwrap().push(send);
	HttpResponse::Ok()
		.content_type("text/event-stream")
		.set(CacheControl(vec![CacheDirective::NoStore]))
		.header(ACCESS_CONTROL_ALLOW_ORIGIN, "*")
		.streaming(rec)
}

#[derive(Serialize)]
struct Event {
	#[serde(with = "ts_milliseconds")]
	time: DateTime<Utc>,
	data: String,
}

fn epoch() -> DateTime<Utc> {
	*EPOCH
}
