import { api } from "./api";
import { Claim } from "../types";

export interface ClaimsResponse {
  claims: Claim[];
}

export interface ClaimResponse {
  claim: Claim;
}

export interface UpdateClaimDecisionResponse {
  message: string;
  claim: Claim;
}

/**
 * Fetch all claims from GET /api/claims.
 * @param userId Optional user ID sent in x-user-id header
 * @param filters Optional query filters (itemId, claimantId, status)
 */
export async function getAllClaims(
  userId?: string | null,
  filters?: { itemId?: string; claimantId?: string; status?: string }
): Promise<Claim[]> {
  const headers: Record<string, string> = {};
  if (userId) {
    headers["x-user-id"] = userId;
  }
  const response = await api.get<ClaimsResponse>("/api/claims", {
    headers,
    params: filters,
  });
  return response.data?.claims ?? [];
}

/**
 * Fetch a single claim by ID from GET /api/claims/:id.
 * @param claimId Claim ID
 */
export async function getClaimById(claimId: string): Promise<Claim> {
  const response = await api.get<ClaimResponse>(`/api/claims/${claimId}`);
  return response.data.claim;
}

/**
 * Approve, reject, or complete a claim via PATCH /api/claims/:id.
 * @param claimId Claim ID
 * @param status 'Approved' | 'Rejected' | 'Completed'
 * @param reviewedBy Reviewer user ID
 */
export async function updateClaimDecision(
  claimId: string,
  status: "Approved" | "Rejected" | "Completed",
  reviewedBy: string
): Promise<UpdateClaimDecisionResponse> {
  const response = await api.patch<UpdateClaimDecisionResponse>(
    `/api/claims/${claimId}`,
    { status, reviewedBy }
  );
  return response.data;
}
