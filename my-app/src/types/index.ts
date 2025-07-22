export interface User {
  id: string;
  name: string;
  email: string;
  profilePictureUrl?: string;
  picture?: string;
}

export interface Group {
  id: number;
  name: string;
  imageUrl?: string;
  address?: string;
  city?: string;
  stateOrProvince?: string;
  country?: string;
  postalCode?: string;
  events?: Event[];
}

export interface Event {
  id: number;
  date: string;
  title: string;
  description: string;
  attendees?: User[];
  group?: Group;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  picture: string;
} 