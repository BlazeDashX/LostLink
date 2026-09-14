import { api } from "./api";
import { User, UserStatus } from "../types";

export interface UsersResponse {
  users: User[];
}

export interface UpdateUserResponse {
  message: string;
  user: User;
}

/**
 * Fetch all users from GET /api/users.
 * Requires the caller to be authenticated as an Admin.
 * @param userId Authenticated admin user ID (sent in x-user-id header)
 */
export async function getAllUsers(userId?: string | null): Promise<User[]> {
  const headers: Record<string, string> = {};
  if (userId) {
    headers["x-user-id"] = userId;
  }
  const response = await api.get<UsersResponse>("/api/users", { headers });
  return response.data.users;
}

/**
 * Update a user's status via PATCH /api/users/:id.
 * @param adminId Authenticated admin user ID (sent in x-user-id header)
 * @param targetUserId ID of the user to update
 * @param status New status ('Active' | 'Suspended')
 */
export async function updateUserStatus(
  adminId: string | null,
  targetUserId: string,
  status: UserStatus
): Promise<UpdateUserResponse> {
  const headers: Record<string, string> = {};
  if (adminId) {
    headers["x-user-id"] = adminId;
  }
  const response = await api.patch<UpdateUserResponse>(
    /api/users/,
    { status },
    { headers }
  );
  return response.data;
}
