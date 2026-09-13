import { api } from "./api";
import { Category } from "@/types";

export interface CategoriesResponse {
  message?: string;
  categories: Category[];
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
