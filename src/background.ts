import { queryIssues } from "./api/jira";
import * as moment from "moment";

function polling() {
    const now = moment();
    // queryIssues(now.startOf("week"), now.endOf("week"), moment.duration(1, "month")).then(
    //     success => console.log("jira fetch success", success),
    //     failure => console.log("jira fetch failure", failure)
    // );
}

polling();

