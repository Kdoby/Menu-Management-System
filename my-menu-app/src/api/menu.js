import { deleteResult, getResult, postResult, putResult } from './client.js'

// 전체 조회. 검색·페이징 없이 모든 메뉴를 받는다.
export async function fetchAllMenus(signal) {
  const result = await getResult('/api/menus', { signal })
  return result.menus
}

// 화면에서 고르는 정렬 기준. 서버 정렬 API(sortBy·direction)와 화면 정렬(compare)이 같은 순서를 낸다.
// 값이 같으면 최신(메뉴 코드가 큰 것)을 앞에 둔다.
const byLatest = (a, b) => b.menuCode - a.menuCode
export const SORTS = {
  latest: { sortBy: 'menuCode', direction: 'desc', compare: byLatest },
  priceAsc: { sortBy: 'menuPrice', direction: 'asc', compare: (a, b) => a.menuPrice - b.menuPrice || byLatest(a, b) },
  priceDesc: { sortBy: 'menuPrice', direction: 'desc', compare: (a, b) => b.menuPrice - a.menuPrice || byLatest(a, b) },
  name: { sortBy: 'menuName', direction: 'asc', compare: (a, b) => a.menuName.localeCompare(b.menuName, 'ko') || byLatest(a, b) },
}

// 페이지 단위 조회(정렬 포함). page 는 1부터 센다.
export async function fetchMenuPage({ page = 1, size = 12, sort = 'latest' }, signal) {
  const { sortBy, direction } = SORTS[sort]
  const result = await getResult('/api/menus/pages/sort', { params: { page, size, sortBy, direction }, signal })
  return {
    menus: result.content,
    page: result.number,
    totalPages: result.totalPages,
    total: result.totalElements,
    first: result.first,
    last: result.last,
  }
}

// 지정한 가격을 "초과"하는 메뉴만 온다. 이하가 아니다. 페이징은 없다.
export async function searchMenusOverPrice(menuPrice, signal) {
  const result = await getResult('/api/menus/search', { params: { menuPrice }, signal })
  return result.menus
}

// 서버에는 이름·카테고리 검색이 없다.
// 조건이 있으면 목록을 받아 여기서 거르고 페이지를 나눠, fetchMenuPage 와 같은 모양으로 돌려준다.
// categoryCodes 는 하위 카테고리 코드 배열이다. 상위 카테고리를 고르면 그 아래 코드가 모두 온다.
// 가격은 minPrice 이상 maxPrice 이하. status 는 'onSale'(판매 중) 또는 'soldOut'(품절).
export async function fetchFilteredMenuPage(
  { page = 1, size = 12, keyword = '', categoryCodes = null, minPrice = null, maxPrice = null, status = null, sort = 'latest' },
  signal,
) {
  // 서버 검색은 "초과"만 된다. 가격이 정수라 (최소 - 1) 초과가 곧 최소 이상이다.
  const base = minPrice > 0 ? await searchMenusOverPrice(minPrice - 1, signal) : await fetchAllMenus(signal)

  const word = keyword.trim().toLowerCase()
  const matched = base
    .filter(
      (menu) =>
        (word === '' || menu.menuName.toLowerCase().includes(word)) &&
        (categoryCodes === null || categoryCodes.includes(menu.categoryCode)) &&
        (maxPrice === null || menu.menuPrice <= maxPrice) &&
        (status === null || (status === 'soldOut') === (menu.orderableStatus !== 'Y')),
    )
    .sort(SORTS[sort].compare)

  const totalPages = Math.ceil(matched.length / size)
  return {
    menus: matched.slice((page - 1) * size, page * size),
    page,
    totalPages,
    total: matched.length,
    first: page === 1,
    last: page >= totalPages,
  }
}

export async function fetchMenu(menuCode, signal) {
  const result = await getResult(`/api/menus/${menuCode}`, { signal })
  return result.menu
}

// 등록. menuCode 는 서버가 채우므로 보내지 않는다. orderableStatus 는 'Y' 또는 'N'.
export async function createMenu({ menuName, menuPrice, categoryCode, orderableStatus }) {
  const result = await postResult('/api/menus', { menuName, menuPrice, categoryCode, orderableStatus })
  return result.menu
}

// 수정. 본문은 등록과 같은 모양이고, 바꾸지 않은 값도 함께 보낸다.
export async function updateMenu(menuCode, { menuName, menuPrice, categoryCode, orderableStatus }) {
  const result = await putResult(`/api/menus/${menuCode}`, { menuName, menuPrice, categoryCode, orderableStatus })
  return result.menu
}

// 삭제. 지운 메뉴의 코드를 돌려준다.
export async function removeMenu(menuCode) {
  const result = await deleteResult(`/api/menus/${menuCode}`)
  return result.deletedMenuCode
}

// 주문 가능 여부만 바꾼다. 서버에 부분 수정이 없어서 나머지 값도 그대로 함께 보낸다.
export async function changeOrderable(menu, orderableStatus) {
  const { menuCode, menuName, menuPrice, categoryCode } = menu
  return updateMenu(menuCode, { menuName, menuPrice, categoryCode, orderableStatus })
}
