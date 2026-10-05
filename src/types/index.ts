export type Role = "owner" | "editor" | "viewer";

export interface UserSummary {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface Collaborator {
  user: UserSummary | string;
  role: Role;
  joinedAt?: Date | string;
}

export interface CanvasElement {
  id: string;
  type: "select" | "pen" | "rectangle" | "ellipse" | "line" | "arrow" | "text" | "sticky" | "eraser" | string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  points?: { x: number; y: number }[];
  text?: string;
  color?: string;
  strokeColor?: string;
  fillColor?: string;
  strokeWidth?: number;
  strokeStyle?: string;
  stickyColor?: string;
  opacity?: number;
  fontSize?: number;
  zIndex?: number;
  [key: string]: any;
}

export interface RoomDocument {
  _id: string;
  name: string;
  owner: UserSummary | string;
  inviteCode: string;
  isPublic: boolean;
  defaultRole: Role;
  collaborators: Collaborator[];
  canvasData: CanvasElement[];
  yjsState?: string;
  lastActive: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt?: string;
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
}

export type Theme = "dark" | "light";
