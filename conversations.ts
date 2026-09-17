import { api } from "./api";

export interface ConversationRecord {
  id: string;
  itemId?: string;
  item_id?: string;
  participantOneId?: string;
  participant_one_id?: string;
  participantTwoId?: string;
  participant_two_id?: string;
  createdAt?: string;
  created_at?: string;
}

export interface FindOrCreateConversationPayload {
  itemId: string;
  participantOneId: string;
  participantTwoId: string;
}

export interface FindOrCreateConversationResponse {
  message: string;
  conversation: ConversationRecord;
  isExisting: boolean;
}

export async function findOrCreateConversation(
  payload: FindOrCreateConversationPayload
): Promise<FindOrCreateConversationResponse> {
  const response = await api.post<FindOrCreateConversationResponse>(
    "/api/conversations",
    payload
  );
  return response.data;
}
