import { api } from "./api";

export interface AdminStats {
  users: {
    total: number;
    active: number;
    suspended: number;
  };
  items: {
    total: number;
    active: number;
    solved: number;
    pendingClaim: number;
    hidden: number;
  };
  claims: {
    total: number;
    pending: number;
    approved: number;
    completed: number;
  };
}

interface AdminStatsResponse {
  users: AdminStats["users"];
  items: AdminStats["items"];
  claims: AdminStats["claims"];
}

/**
 * Fetch admin dashboard metrics from GET /api/admin/stats.
 * Requires the caller to be authenticated as an Admin.
 * @param userId Authenticated admin user ID (sent in x-user-id header)
 * @returns Promise<AdminStats>
 */
export async function getAdminStats(userId?: string | null): Promise<AdminStats> {
  const headers: Record<string, string> = {};
  if (userId) {
    headers["x-user-id"] = userId;
  }
  const response = await api.get<AdminStatsResponse>("/api/admin/stats", { headers });
  return response.data;
}
