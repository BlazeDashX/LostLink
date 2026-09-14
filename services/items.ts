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
