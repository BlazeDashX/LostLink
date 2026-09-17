import { api } from "./api";
import { ConversationThread, Message } from "@/types";

export interface SendMessagePayload {
  itemId: string;
  senderId: string;
  receiverId: string;
  text: string;
}

export interface SendMessageResponse {
  message: string;
  data: Message;
}

export interface FindOrCreateConversationResponse {
  message: string;
  conversation: any;
  isExisting: boolean;
}

/**
 * Fetch all conversation threads for a specific user.
 * @param userId Authenticated user ID
 */
export async function getConversations(
  userId: string
): Promise<ConversationThread[]> {
  const response = await api.get<{ conversations: ConversationThread[] }>(
    "/api/conversations",
    {
      params: { userId },
      headers: { "x-user-id": userId },
    }
  );

  return response.data.conversations || [];
}

/**
 * Find an existing conversation thread for an item and 2 participants,
 * or create a new thread if one doesn't exist yet.
 */
export async function findOrCreateConversation(
  itemId: string,
  participantOneId: string,
  participantTwoId: string,
  userId?: string | null
): Promise<FindOrCreateConversationResponse> {
  const headers: Record<string, string> = {};
  if (userId) {
    headers["x-user-id"] = userId;
  }

  const response = await api.post<FindOrCreateConversationResponse>(
    "/api/conversations",
    {
      itemId,
      participantOneId,
      participantTwoId,
    },
    { headers }
  );

  return response.data;
}

/**
 * Load all messages in a conversation thread.
 * @param conversationId Unique conversation ID
 * @param userId Authenticated user ID
 */
export async function getMessages(
  conversationId: string,
  userId?: string | null
): Promise<Message[]> {
  const headers: Record<string, string> = {};
  if (userId) {
    headers["x-user-id"] = userId;
  }

  const response = await api.get<{ messages: Message[] }>(
    `/api/conversations/${conversationId}/messages`,
    { headers }
  );

  return response.data.messages || [];
}

/**
 * Send a new message in a conversation thread and notify the recipient.
 * @param conversationId Unique conversation ID
 * @param payload Message details
 * @param userId Authenticated sender ID
 */
export async function sendMessage(
  conversationId: string,
  payload: SendMessagePayload,
  userId?: string | null
): Promise<Message> {
  const headers: Record<string, string> = {};
  if (userId || payload.senderId) {
    headers["x-user-id"] = userId || payload.senderId;
  }

  const response = await api.post<SendMessageResponse>(
    `/api/conversations/${conversationId}/messages`,
    payload,
    { headers }
  );

  return response.data.data;
}

/**
 * Mark all unread messages in a conversation as read by the current user.
 * @param conversationId Unique conversation ID
 * @param userId Reader's user ID
 */
export async function markAsRead(
  conversationId: string,
  userId: string
): Promise<{ updatedCount: number }> {
  const response = await api.patch<{ message: string; updatedCount: number }>(
    `/api/conversations/${conversationId}/read`,
    { userId },
    {
      headers: { "x-user-id": userId },
    }
  );

  return { updatedCount: response.data.updatedCount || 0 };
}

/**
 * Fetch thread metadata for a conversation.
 * @param conversationId Unique conversation ID
 * @param userId Authenticated user ID
 */
export async function getConversationDetails(
  conversationId: string,
  userId?: string | null
): Promise<any> {
  const headers: Record<string, string> = {};
  if (userId) {
    headers["x-user-id"] = userId;
  }

  const response = await api.get<{ conversation: any }>(
    `/api/conversations/${conversationId}`,
    { headers }
  );

  return response.data.conversation;
}
