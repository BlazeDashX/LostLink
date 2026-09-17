import { Notification } from "@/types";
import { api } from "./api";

interface NotificationsResponse {
  notifications: Notification[];
  unreadCount?: number;
}

interface NotificationResponse {
  message: string;
  notification: Notification;
}

interface MarkAllResponse {
  message: string;
  updatedCount: number;
}

function authHeaders(userId?: string | null) {
  const headers: Record<string, string> = {};
  if (userId) {
    headers["x-user-id"] = userId;
  }
  return headers;
}

export async function getNotifications(
  userId?: string | null
): Promise<Notification[]> {
  const response = await api.get<NotificationsResponse>("/api/notifications", {
    headers: authHeaders(userId),
  });
  return response.data.notifications ?? [];
}

export async function markNotificationRead(
  notificationId: string,
  userId?: string | null
): Promise<Notification> {
  const response = await api.patch<NotificationResponse>(
    `/api/notifications/${notificationId}`,
    { read: true },
    { headers: authHeaders(userId) }
  );
  return response.data.notification;
}

export async function markAllNotificationsRead(
  userId?: string | null
): Promise<MarkAllResponse> {
  const response = await api.patch<MarkAllResponse>(
    "/api/notifications/read-all",
    {},
    { headers: authHeaders(userId) }
  );
  return response.data;
}
