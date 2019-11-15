let evtSource = new EventSource("/api/stream");
evtSource.addEventListener("object-data", ev => console.log(ev));
