import axios from "axios";
import { JiraSearchResults } from "../types/issue";
import { Duration, Moment, duration } from "moment";

const url = "/rest/api/2/search";
const fields = "summary"; // comment,description
const expand = "changelog";

const format = "YYYY/MM/DD";
const defaultLastActivitySince: Duration = duration(2, "weeks");

const simpleCache: { [key: string]: JiraSearchResults | undefined } = {};

export function queryIssues(from: Moment, till: Moment, lastActivitySince: Duration = defaultLastActivitySince): Promise<JiraSearchResults> {
    const fromStr = from.format(format);
    const tillStr = till.format(format);
    const lastActivity = lastActivitySince && from.subtract(lastActivitySince).format(format) || fromStr;
    const jql = `assignee was currentUser() DURING ("${fromStr}", "${tillStr}") AND updated > "${lastActivity}"`;
    console.log(jql);

    const cacheKey = `${fromStr}-${tillStr}-${lastActivity}`;
    const cacheResult = simpleCache[cacheKey];

    console.log("cache", !!cacheResult);

    return cacheResult
        ? Promise.resolve(cacheResult)
        : axios.get<JiraSearchResults>(url, {
            params: { fields, expand, jql }
        }).then(
            ({ data }) => {
                simpleCache[cacheKey] = data;
                return data
            }
        );
}