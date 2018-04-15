import * as React from "react";
import moment = require("moment");
import { HashRouter } from "react-router-dom";
import { Route } from "react-router";

import {Helper} from "./Helper";

export const Main = () => <HashRouter>
    <Route exact path="/">{
        ({ location }) => {
            const dateStr = location.search && location.search.match("date=([0-9\-]*)")[1] || moment();
            const date = moment
                .utc(dateStr, "YYYY-MM-DD")
                .startOf("week");

            return <Helper date={date}/>;
        }
    }</Route>
</HashRouter>;