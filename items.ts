import { Category, ClaimStatus, Item, ItemType, SafeUser } from "@/types";
import { api } from "./api";

export interface CategoriesResponse {
  message?: string;
  categories: Category[];
}

export interface CreateItemPayload {
  type: ItemType;
  title: string;
  categoryId: string;
  description: string;
  location: string;
  reportDate: string;
  image?: string;
  reporterId?: string;
}

export interface CreateItemResponse {
  message: string;
  item: Item;
}

export interface UpdateItemPayload {
  type?: ItemType;
  title?: string;
  categoryId?: string;
  description?: string;
  location?: string;
  reportDate?: string;
  image?: string;
  status?: string;
}

export interface UpdateItemResponse {
  message: string;
  item: Item;
}

export interface ReporterSummary {
  id: string;
  name: string;
  role: SafeUser["role"];
  avatar: string | null;
}

export interface ItemClaimSummary {
  id: string;
  status: ClaimStatus;
}

export interface ItemResponse {
  item: Item;
  reporter?: ReporterSummary | null;
  currentUserClaim?: ItemClaimSummary | null;
}

export interface ItemDetailsResponse {
  item: Item;
  reporter: ReporterSummary | null;
  currentUserClaim: ItemClaimSummary | null;
}

export interface DeleteItemResponse {
  message: string;
  id: string;
}

export interface MyReportsResponse {
  items: Item[];
}

export interface AllItemsResponse {
  items: Item[];
}

export interface GetItemsOptions {
  userId?: string | null;
  type?: ItemType;
  search?: string;
}

function authHeaders(userId?: string | null) {
  const headers: Record<string, string> = {};
  if (userId) {
    headers["x-user-id"] = userId;
  }
  return headers;
}

export async function getCategories(activeOnly: boolean = false): Promise<Category[]> {
  const params = activeOnly ? { active: "true" } : undefined;
  const response = await api.get<CategoriesResponse | Category[]>("/api/categories", {
    params,
  });

  if (Array.isArray(response.data)) {
    return response.data;
  }

  if (response.data && Array.isArray((response.data as CategoriesResponse).categories)) {
    return (response.data as CategoriesResponse).categories;
  }

  return [];
}

export async function getItems(options: GetItemsOptions = {}): Promise<Item[]> {
  const params: Record<string, string> = { scope: "public" };

  if (options.type) {
    params.type = options.type;
  }

  if (options.search?.trim()) {
    params.search = options.search.trim();
  }

  const response = await api.get<AllItemsResponse>("/api/items", {
    headers: authHeaders(options.userId),
    params,
  });

  return response.data.items ?? [];
}

export async function createItem(
  payload: CreateItemPayload,
  userId?: string | null
): Promise<CreateItemResponse> {
  const response = await api.post<CreateItemResponse>("/api/items", payload, {
    headers: authHeaders(userId),
  });
  return response.data;
}

export async function getItemById(
  id: string,
  userId?: string | null
): Promise<Item> {
  const response = await api.get<ItemResponse>(`/api/items/${id}`, {
    headers: authHeaders(userId),
  });
  return response.data.item;
}

export async function getItemDetails(
  id: string,
  userId?: string | null
): Promise<ItemDetailsResponse> {
  const response = await api.get<ItemResponse>(`/api/items/${id}`, {
    headers: authHeaders(userId),
  });

  return {
    item: response.data.item,
    reporter: response.data.reporter ?? null,
    currentUserClaim: response.data.currentUserClaim ?? null,
  };
}

export async function updateItem(
  id: string,
  payload: UpdateItemPayload,
  userId?: string | null
): Promise<UpdateItemResponse> {
  const response = await api.patch<UpdateItemResponse>(`/api/items/${id}`, payload, {
    headers: authHeaders(userId),
  });
  return response.data;
}

export async function deleteItem(
  id: string,
  userId?: string | null
): Promise<DeleteItemResponse> {
  const response = await api.delete<DeleteItemResponse>(`/api/items/${id}`, {
    headers: authHeaders(userId),
  });
  return response.data;
}

export async function getMyReports(userId?: string | null): Promise<Item[]> {
  const response = await api.get<MyReportsResponse>("/api/items", {
    params: { mine: "true" },
    headers: authHeaders(userId),
  });
  return response.data.items ?? [];
}

export async function getAllItems(userId?: string | null): Promise<Item[]> {
  const response = await api.get<AllItemsResponse>("/api/items", {
    headers: authHeaders(userId),
  });
  return response.data.items ?? [];
}
