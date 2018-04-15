export interface AvatarUrls {
    "48x48": string;
    "24x24": string;
    "16x16": string;
    "32x32": string;
}

export interface Author {
    self: string;
    name: string;
    key: string;
    emailAddress: string;
    avatarUrls: AvatarUrls;
    displayName: string;
    active: boolean;
    timeZone: string;
}

export interface UpdateAuthor {
    self: string;
    name: string;
    key: string;
    emailAddress: string;
    avatarUrls: AvatarUrls;
    displayName: string;
    active: boolean;
    timeZone: string;
}

export interface Comment {
    self: string;
    id: string;
    author: Author;
    body: string;
    updateAuthor: UpdateAuthor;
    created: Date;
    updated: Date;
}

export interface Comments {
    comments: Comment[];
    maxResults: number;
    total: number;
    startAt: number;
}

export interface Fields {
    summary: string;
    description: string;
    comment: Comments;
}

export interface Item {
    field: string;
    fieldtype: string;
    from: string;
    fromString: string;
    to: string;
    toString: string;
}

export interface History {
    id: string;
    author: Author;
    created: Date;
    items: Item[];
}

export interface Changelog {
    startAt: number;
    maxResults: number;
    total: number;
    histories: History[];
}

export interface Issue {
    expand: string;
    id: string;
    self: string;
    key: string;
    fields: Fields;
    changelog: Changelog;
}

export interface JiraSearchResults {
    expand: string;
    startAt: number;
    maxResults: number;
    total: number;
    issues: Issue[];
}