import { queryIssues } from "./api/jira";
import * as moment from "moment";
import * as $ from "jquery";
import * as React from "react";
import * as ReactDOM from "react-dom";
import {Main} from "./components/Main";

const div = document.createElement("div");
div.id = "tempo-helper";

function init(attempt = 0): void {
    if (attempt > 5) return;

    const target = document.querySelector(".ttw-main-container");
    if (target) {
        target.parentNode.insertBefore(div, target.nextSibling);
        ReactDOM.render(<Main/>, div);
    } else setTimeout(() => init(attempt + 1), 1000);
}

init();