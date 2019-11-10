use actix_files::{Files, NamedFile};
use actix_web::{web, App, HttpServer, Responder};
use listenfd::ListenFd;

fn main() {
	let mut server =
		HttpServer::new(|| App::new().route("/", web::get().to(index)).service(Files::new("/", "client/dist")));

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
