// 카테고리 묶음 계산. 목록 필터와 메뉴 폼이 함께 쓴다.

// 상위(ref 가 null)마다 하위 카테고리를 묶는다. 하위가 없는 상위는 뺀다.
export function groupCategories(categories) {
  return categories
    .filter((c) => c.refCategoryCode === null)
    .map((parent) => ({
      ...parent,
      children: categories.filter((c) => c.refCategoryCode === parent.categoryCode),
    }))
    .filter((group) => group.children.length > 0)
}

// 고른 코드가 상위면 자신과 그 아래 하위 코드를 모두, 하위면 그 코드 하나를 돌려준다.
// 명세상 메뉴는 하위 카테고리에 속하지만, 실제 데이터에는 상위(식사 등)에 바로 들어간 메뉴도 있어서 자신도 넣는다.
export function categoryCodesFor(code, categories) {
  const children = categories.filter((c) => c.refCategoryCode === code)
  return [code, ...children.map((c) => c.categoryCode)]
}

// 고른 코드가 속한 상위 코드. 상위를 골랐으면 그 코드 자신이다.
export function parentCodeOf(code, categories) {
  const found = categories.find((c) => c.categoryCode === code)
  if (!found) return null
  return found.refCategoryCode ?? found.categoryCode
}

// 상위 카테고리마다 색과 그림을 정한다. 카드·탭·상세가 data-tone 으로 같은 짝을 쓴다.
const TONES = { 식사: 'meal', 음료: 'drink', 디저트: 'dessert' }

export function toneOf(code, categories) {
  const parent = categories.find((c) => c.categoryCode === parentCodeOf(code, categories))
  return TONES[parent?.categoryName] ?? null
}
