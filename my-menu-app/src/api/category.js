import { getResult } from './client.js'

// 카테고리 전체. 상위(식사·음료·디저트)는 refCategoryCode·refCategoryName 이 null 이다.
export async function fetchCategories(signal) {
  const result = await getResult('/api/categories', { signal })
  return result.categories
}
