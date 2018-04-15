import {Issue} from "../types/issue";
import {Moment} from "moment";
import {DateRange, extendMoment} from "moment-range";
import * as _moment from "moment";
const moment = extendMoment(_moment);
import * as React from "react";
import Timeline from 'react-calendar-timeline/lib'
import Dock from "react-dock";
import {
    Button,
    Card,
    CardTitle,
    Col,
    Container,
    FormGroup,
    Input,
    InputGroup, InputGroupAddon,
    Label, Nav, NavItem, NavLink,
    Row, TabContent, TabPane
} from "reactstrap";
import 'bootstrap/dist/css/bootstrap.min.css';

import {queryIssues} from "../api/jira";

interface Props {
    date: Moment
}

interface State {
    issues: Issue[];
    isDockOpen: Boolean;
    activeTab: "timeline" | "info" | "settings"
    disabledTickets: string[];
    blacklistedTickets: string[];
    statusSettings: { [status: string]: "track" | "ignore" | undefined },
}

interface StatusChange {
    ticket: string;
    statusBefore: string | null;
    statusAfter: string | null;
    range: DateRange;
}

interface AssigneeChange {
    ticket: string;
    userBefore: string | null;
    userAfter: string | null;
    range: DateRange;
}

function weekIssues(date: Moment, f: (arr: Issue[]) => void): void {
    queryIssues(date.clone().startOf("week"), date.clone().endOf("week")).then(
        success => f(success.issues)
    );
}

export class Helper extends React.PureComponent<Props, State> {
    constructor(props) {
        super(props);
        this.state = {
            issues: [],
            isDockOpen: true,
            activeTab: "timeline",
            disabledTickets: [],
            blacklistedTickets: [],
            statusSettings: {
                "In Progress": "track",
                "Ready for Review": "track"
            }
        };

        weekIssues(props.date, (issues) => this.setState({ issues }))
    }

    componentWillReceiveProps(props) {
        weekIssues(props.date, (issues) => this.setState({ issues }))
    }

    onTicketCheck(checked: Boolean, key: string): void {
        const { disabledTickets } = this.state;

        if (checked) this.setState({ disabledTickets: disabledTickets.filter(k => k !== key) });
        else this.setState({ disabledTickets: [key, ...disabledTickets] })
    }

    render() {
        const { issues, isDockOpen, activeTab, disabledTickets, statusSettings } = this.state;
        const { date } = this.props;
        const statusChanges: StatusChange[] = [];
        const assigneeChanges: AssigneeChange[] = [];

        const statuses: Set<string> = new Set();
        const range = moment.rangeFromInterval("week", 1, date);

        for (const { changelog, key } of issues) if (!disabledTickets.includes(key)) {
            let statusStart, statusEnd, userStart, userEnd: Date;
            let endStatus, endUser: string;
            for (const {items, created} of changelog.histories) {
                const statusItems = items.filter(i => i.field === "status");
                const assigneeItems = items.filter(i => i.field === "assignee");

                if (statusItems.length) {
                    statusStart = statusEnd;
                    statusEnd = created;

                    for (const {fromString, toString} of statusItems) {
                        statuses.add(fromString);
                        statuses.add(toString);
                        endStatus = toString;

                        statusChanges.push({
                            ticket: key,
                            statusBefore: fromString,
                            statusAfter: toString,
                            range: moment.range(statusStart, statusEnd)
                        });
                    }
                }

                if (assigneeItems.length) {
                    userStart = userEnd;
                    userEnd = created;

                    for (const {fromString, toString} of assigneeItems) {
                        endUser = toString;

                        assigneeChanges.push({
                            ticket: key,
                            userBefore: fromString,
                            userAfter: toString,
                            range: moment.range(userStart, userEnd)
                        });
                    }
                }
            }

            if (endStatus) statusChanges.push({
                ticket: key,
                statusBefore: endStatus,
                statusAfter: null,
                range: moment.range(statusEnd, null)
            });

            if (endUser) assigneeChanges.push({
                ticket: key,
                userBefore: endUser,
                userAfter: null,
                range: moment.range(userEnd, null)
            });
        }

        const ticketList = issues.map(({ key, fields }) => <li key={key}>
            <FormGroup check>
                <Label check>
                    <Input
                        type="checkbox"
                        onChange={(e) => this.onTicketCheck(e.currentTarget.checked, key) }
                        checked={!disabledTickets.includes(key)}
                    />
                    <a href={`/browse/${key}`}><b>{key}</b></a>
                    {" - "}
                    <span>{fields.summary}</span>
                </Label>
            </FormGroup>
        </li>);

        const statusList = Array.from(statuses).map(status => <InputGroup key={status}>
            <Input value={statusSettings[status] || "ignore"} type="select">
                <option value="ignore">Ignore Status</option>
                <option value="track">Track Status</option>
            </Input>
            <InputGroupAddon addonType="append">{status}</InputGroupAddon>
        </InputGroup>);

        const ticketStatusList = statusChanges
            .filter(c => c.range.overlaps(range) && statusSettings[c.statusBefore] === "track")
            .sort((a, b) => a.range.start.valueOf() - b.range.start.valueOf());

        const format = "YYYY/MM/DD HH:mm";
        const completeStatusList = ticketStatusList.map(({ticket, statusBefore, statusAfter, range}) => <li key={ticket + range.start.valueOf()}>
            {ticket} ({statusBefore} - {statusAfter || "..."}): {range.start.format(format)} - {statusAfter && range.end.format(format) || "..."}
        </li>);

        const completeAssigneeList = assigneeChanges
            .filter(c => c.range.overlaps(range))
            .map(({ticket, userBefore, userAfter, range}) => <li key={ticket + range.start.valueOf()}>
                {ticket} ({userBefore || "..."} - {userAfter || "..."}): {userBefore && range.start.format(format) || "..."} - {userAfter && range.end.format(format) || "..."}
            </li>);

        const StatusSettings = () => <Card body>
            <CardTitle>Status settings:</CardTitle>
            { statusList }
        </Card>;

        const TaskList = () => <Card body>
            <CardTitle>Tasks you've been assigned to this week:</CardTitle>
            <ul>{ ticketList }</ul>
        </Card>;

        const StatusList = () => <Card body>
            <CardTitle>Complete Status Change List:</CardTitle>
            <ul>{ completeStatusList }</ul>
        </Card>;

        const AssigneeList = () => <Card body>
            <CardTitle>Complete Assignment Change List:</CardTitle>
            <ul>{ completeAssigneeList }</ul>
        </Card>;

        const groups = issues
            .filter(i => !disabledTickets.includes(i.key) && ticketStatusList.some(s => s.ticket === i.key))
            .map((i, idx) => ({
                id: idx,
                title: i.key,
                rightTitle: i.fields.summary
            }));

        const items = ticketStatusList.map((t, idx) => ({
            id: idx,
            group: groups.findIndex(g => g.title === t.ticket),
            title: t.statusBefore,
            start_time: t.range.start,
            end_time: t.range.end
        }));

        const TaskTimeline = () => <Timeline
            groups={groups}
            items={items}
            defaultTimeStart={range.start}
            defaultTimeEnd={range.end}
            height={430}
        />;

        return <>
            <Dock position="bottom" fluid isVisible={isDockOpen} dimMode="none">
                <Button color="danger" className="float-right" onClick={() => this.setState({isDockOpen: false})}>Close</Button>
                <Nav tabs>
                    <NavItem>
                        <NavLink
                            className={activeTab === "timeline" && "active" || null}
                            onClick={() => this.setState({activeTab: "timeline"})}
                        >Timeline</NavLink>
                    </NavItem>
                    <NavItem>
                        <NavLink
                            className={activeTab === "info" && "active" || null}
                            onClick={() => this.setState({activeTab: "info"})}
                        >Info</NavLink>
                    </NavItem>
                    <NavItem>
                        <NavLink
                            className={activeTab === "settings" && "active" || null}
                            onClick={() => this.setState({activeTab: "settings"})}
                        >Settings</NavLink>
                    </NavItem>
                </Nav>
                <Container fluid>
                    <TabContent activeTab={activeTab}>
                        <TabPane tabId="timeline">
                            <Row>
                                <Col><TaskTimeline/></Col>
                            </Row>
                        </TabPane>
                        <TabPane tabId="info">
                            <Row>
                                <Col><StatusList/></Col>
                                <Col><AssigneeList/></Col>
                            </Row>
                        </TabPane>
                        <TabPane tabId="settings">
                            <Row>
                                <Col md={6}><StatusSettings/></Col>
                                <Col md={6}><TaskList/></Col>
                            </Row>
                        </TabPane>
                    </TabContent>
                </Container>
            </Dock>
        </>;
    }
}