export type UserRole = "User" | "Admin";
export type UserStatus = "Active" | "Suspended";
export type ItemType = "Lost" | "Found";
export type ItemStatus =
  | "Active"
  | "Pending Claim"
  | "Reserved"
  | "Delivered"
  | "Received"
  | "Solved"
  | "Hidden";

export type ClaimStatus = "Pending" | "Approved" | "Rejected" | "Completed";

export interface Category {
  id: string;
  name: string;
  icon?: string | null;
  active: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  avatar: string;
  password?: string;
}

export type SafeUser = User;

export interface Item {
  id: string;
  type: ItemType;
  title: string;
  categoryId: string;
  description: string;
  location: string;
  reportDate: string;
  image: string;
  reporterId: string;
  status: ItemStatus;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  itemId: string;
  senderId: string;
  receiverId: string;
  text: string;
  sentAt: string;
  read: boolean;
}

export interface ClaimAnswers {
  identifyingDetail: string;
  lossContext: string;
  privateEvidence: string;
}

export interface Claim {
  id: string;
  itemId: string;
  claimantId: string;
  answers: ClaimAnswers;
  handoverMethod: string;
  status: ClaimStatus;
  reviewedBy: string | null;
  createdAt: string;
}

export type NotificationType = "Message" | "Claim" | "Match" | "Status" | "Admin";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedId: string | null;
  read: boolean;
  createdAt: string;
}

export interface ConversationThread {
  conversationId: string;
  item: Item;
  participant: User;
  latestMessage: Message | null;
  unreadCount: number;
}