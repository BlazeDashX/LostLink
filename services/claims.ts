import { api } from "./api";
import { Claim, ClaimAnswers, ClaimStatus, ItemStatus } from "@/types";

export interface SubmitClaimPayload {
  itemId: string;
  claimantId?: string;
  answers: ClaimAnswers;
  handoverMethod: string;
}

export interface SubmitClaimResponse {
  message: string;
  claim: Claim;
}

export interface ClaimsFilter {
  itemId?: string;
  claimantId?: string;
  reporterId?: string;
  status?: ClaimStatus;
}

export interface ClaimDecisionResponse {
  message: string;
  claim: Claim;
  itemStatus?: ItemStatus;
}

/**
 * Submit an ownership claim for an item.
 * @param payload Claim details
 * @param userId Authenticated claimant ID (sent in x-user-id header)
 */
export async function submitClaim(
  payload: SubmitClaimPayload,
  userId?: string | null
): Promise<SubmitClaimResponse> {
  const headers: Record<string, string> = {};
  if (userId) {
    headers["x-user-id"] = userId;
  }

  const response = await api.post<SubmitClaimResponse>(
    "/api/claims",
    {
      itemId: payload.itemId,
      claimantId: payload.claimantId || userId,
      answers: payload.answers,
      handoverMethod: payload.handoverMethod,
    },
    { headers }
  );

  return response.data;
}

/**
 * Retrieve claims matching query filters.
 */
export async function getClaims(
  filters?: ClaimsFilter,
  userId?: string | null
): Promise<Claim[]> {
  const headers: Record<string, string> = {};
  if (userId) {
    headers["x-user-id"] = userId;
  }

  const response = await api.get<{ claims: Claim[] }>("/api/claims", {
    params: filters,
    headers,
  });

  return response.data.claims || [];
}

/**
 * Fetch a single claim by its unique ID.
 */
export async function getClaimById(
  claimId: string,
  userId?: string | null
): Promise<Claim> {
  const headers: Record<string, string> = {};
  if (userId) {
    headers["x-user-id"] = userId;
  }

  const response = await api.get<{ claim: Claim }>(`/api/claims/${claimId}`, {
    headers,
  });

  return response.data.claim;
}

/**
 * Approve, reject, or mark a claim as completed.
 * @param claimId Unique claim ID
 * @param status Decision: 'Approved' | 'Rejected' | 'Completed'
 * @param userId Authenticated user performing the decision
 */
export async function updateClaimDecision(
  claimId: string,
  status: ClaimStatus,
  userId?: string | null
): Promise<ClaimDecisionResponse> {
  const headers: Record<string, string> = {};
  if (userId) {
    headers["x-user-id"] = userId;
  }

  const response = await api.patch<ClaimDecisionResponse>(
    `/api/claims/${claimId}`,
    {
      status,
      reviewedBy: userId,
    },
    { headers }
  );

  return response.data;
}
