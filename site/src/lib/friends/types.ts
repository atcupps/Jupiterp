export type FriendVisibility = 'full' | 'busy_free' | 'off';

export interface SharedScheduleSnapshot {
	scheduleName: string;
	selections: unknown[];
	term: 'Fall' | 'Spring' | 'Winter' | 'Summer';
	year: number;
}

export interface FriendProfile {
	id: string;
	email: string | null;
	displayName: string | null;
	friendCode: string;
	friendsVisibility: FriendVisibility;
}

export interface IncomingFriendRequest {
	id: string;
	from: FriendProfile;
	createdAt: string;
}

export interface OutgoingFriendRequest {
	id: string;
	to: FriendProfile;
	createdAt: string;
}

export interface FriendRecord {
	id: string;
	friend: FriendProfile;
	visibility: FriendVisibility;
	createdAt: string;
}

export interface FriendsSummary {
	selfProfile: FriendProfile;
	incoming: IncomingFriendRequest[];
	outgoing: OutgoingFriendRequest[];
	friends: FriendRecord[];
}

export interface FriendScheduleResponse {
	visibility: FriendVisibility;
	friendName: string;
	schedule: SharedScheduleSnapshot | null;
	message: string | null;
}
