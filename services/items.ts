import { api } from "./api";
import { Category, Item, ItemType } from "@/types";

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

/**
 * Fetch categories from the Neon PostgreSQL database via Express API.
 * @param activeOnly optional flag to fetch only active categories
 * @returns Promise<Category[]>
 */
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

/**
 * Submit a new lost/found item report to the backend API.
 * @param payload Item data
 * @param userId Authenticated user ID (sent in x-user-id header)
 * @returns Promise<CreateItemResponse>
 */
export async function createItem(
  payload: CreateItemPayload,
  userId?: string | null
): Promise<CreateItemResponse> {
  const headers: Record<string, string> = {};
  if (userId) {
    headers["x-user-id"] = userId;
  }
  const response = await api.post<CreateItemResponse>("/api/items", payload, {
    headers,
  });
  return response.data;
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

export interface ItemResponse {
  item: Item;
}

/**
 * Fetch a single item by its ID from the Neon PostgreSQL database via Express API.
 * @param id Item ID
 * @returns Promise<Item>
 */
export async function getItemById(id: string): Promise<Item> {
  const response = await api.get<ItemResponse>(`/api/items/${id}`);
  return response.data.item;
}

/**
 * Update an existing lost/found item report using PATCH /api/items/:id.
 * @param id Item ID
 * @param payload Updated item data
 * @param userId Authenticated user ID (sent in x-user-id header for server authorization)
 * @returns Promise<UpdateItemResponse>
 */
export async function updateItem(
  id: string,
  payload: UpdateItemPayload,
  userId?: string | null
): Promise<UpdateItemResponse> {
  const headers: Record<string, string> = {};
  if (userId) {
    headers["x-user-id"] = userId;
  }
  const response = await api.patch<UpdateItemResponse>(`/api/items/${id}`, payload, {
    headers,
  });
  return response.data;
}

export interface DeleteItemResponse {
  message: string;
  id: string;
}

/**
 * Permanently delete a lost/found item report using DELETE /api/items/:id.
 * @param id Item ID to delete
 * @param userId Authenticated user ID (sent in x-user-id header for server authorization)
 * @returns Promise<DeleteItemResponse>
 */
export async function deleteItem(
  id: string,
  userId?: string | null
): Promise<DeleteItemResponse> {
  const headers: Record<string, string> = {};
  if (userId) {
    headers["x-user-id"] = userId;
  }
  const response = await api.delete<DeleteItemResponse>(`/api/items/${id}`, {
    headers,
  });
  return response.data;
}

export interface MyReportsResponse {
  items: Item[];
}

/**
 * Fetch all item reports belonging to the authenticated user.
 * The server determines ownership from the auth session — not from client data.
 * @param userId Authenticated user ID (sent in x-user-id header)
 * @returns Promise<Item[]>
 */
export async function getMyReports(userId?: string | null): Promise<Item[]> {
  const headers: Record<string, string> = {};
  if (userId) {
    headers["x-user-id"] = userId;
  }
  const response = await api.get<MyReportsResponse>("/api/items", {
    params: { mine: "true" },
    headers,
  });
  return response.data.items ?? [];
}

export interface AllItemsResponse {
  items: Item[];
}

/**
 * Fetch all items from the database (Admin only).
 * @param userId Authenticated admin user ID (sent in x-user-id header)
 * @returns Promise<Item[]>
 */
export async function getAllItems(userId?: string | null): Promise<Item[]> {
  const headers: Record<string, string> = {};
  if (userId) {
    headers["x-user-id"] = userId;
  }
  const response = await api.get<AllItemsResponse>("/api/items", {
    headers,
  });
  return response.data.items ?? [];
}
