import * as React from "react";
import * as ReactDOM from "react-dom";
import { App } from "./components/app";
import "./styles.scss";

document.body.className = "mdc-typography";
ReactDOM.render(<App />, document.getElementById("app"));
