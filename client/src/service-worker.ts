import { registerRoute } from "workbox-routing";
import { StaleWhileRevalidate } from "workbox-strategies";

registerRoute(/\.js$/, new StaleWhileRevalidate());
