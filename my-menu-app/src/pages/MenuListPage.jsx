import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { fetchFilteredMenuPage, fetchMenuPage, SORTS } from '../api/menu.js'
import { fetchCategories } from '../api/category.js'
import { toMessage } from '../api/client.js'
import { categoryCodesFor, toneOf } from '../lib/categories.js'
import MenuCard, { MenuCardSkeleton } from '../components/menu/MenuCard.jsx'
import Pagination from '../components/ui/Pagination.jsx'
import Filters from '../components/menu/Filters.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import SoldOutToggle from '../components/menu/SoldOutToggle.jsx'
import SortSelect from '../components/menu/SortSelect.jsx'
import StatusFilter from '../components/menu/StatusFilter.jsx'
import Toast from '../components/ui/Toast.jsx'
import button from '../components/ui/Button.module.css'
import styles from './MenuListPage.module.css'

const PAGE_SIZE = 12

// 쿼리스트링 값이 0 이상의 정수일 때만 숫자로 쓴다. 아니면 조건이 없는 것으로 본다.
const toCode = (raw) => (raw !== null && /^\d+$/.test(raw) ? Number(raw) : null)

export default function MenuListPage() {
  // 검색어·카테고리·가격 범위·판매 상태·정렬·페이지는 모두 URL(?q=&category=&minPrice=&maxPrice=&status=&sort=&page=)에 둔다.
  const [params, setParams] = useSearchParams()

  // 페이지는 1부터 센다. 없으면 1, 1보다 작거나 숫자가 아니면 잘못된 페이지다.
  const rawPage = params.get('page')
  const page = rawPage === null ? 1 : Number(rawPage)
  const validPage = Number.isInteger(page) && page >= 1

  const keyword = params.get('q') ?? ''
  const categoryCode = toCode(params.get('category'))
  // 주소에 최소·최대가 거꾸로 들어와도 맞바꿔 쓴다. 폼에서도 같은 값으로 보인다.
  const priceA = toCode(params.get('minPrice'))
  const priceB = toCode(params.get('maxPrice'))
  const reversed = priceA !== null && priceB !== null && priceA > priceB
  const minPrice = reversed ? priceB : priceA
  const maxPrice = reversed ? priceA : priceB
  const rawStatus = params.get('status')
  const status = rawStatus === 'onSale' || rawStatus === 'soldOut' ? rawStatus : null
  const filtering =
    keyword.trim() !== '' || categoryCode !== null || minPrice !== null || maxPrice !== null || status !== null

  // 정렬은 거르는 조건이 아니라 따로 둔다. 모르는 값이면 최신순.
  const rawSort = params.get('sort')
  const sort = rawSort !== null && Object.hasOwn(SORTS, rawSort) ? rawSort : 'latest'

  const [categories, setCategories] = useState([])
  const [categoryError, setCategoryError] = useState(null)

  // 상위 카테고리를 골랐으면 그 아래 하위 코드로 거른다. 그러려면 카테고리 목록이 먼저 와야 한다.
  // 카테고리를 못 받았으면 고른 코드 하나로만 거른다.
  const categoryReady = categoryCode === null || categories.length > 0 || categoryError !== null
  // effect 의존성으로 쓰려고 배열 대신 '3,4,5' 같은 문자열로 둔다. 조건이 없으면 빈 문자열.
  const codesKey =
    categoryCode === null ? '' : (categories.length > 0 ? categoryCodesFor(categoryCode, categories) : [categoryCode]).join(',')

  // 다시 시도를 누르면 같은 조건으로 한 번 더 요청한다.
  const [attempt, setAttempt] = useState(0)

  // 결과와 오류에 어느 조건의 것인지 함께 적어 두고, 지금 조건의 것이 아니면 불러오는 중으로 본다.
  const queryKey = `${page}|${keyword}|${codesKey}|${minPrice}|${maxPrice}|${status}|${sort}|${attempt}`
  const [result, setResult] = useState(null)
  const [failure, setFailure] = useState(null)

  useEffect(() => {
    const controller = new AbortController()
    fetchCategories(controller.signal)
      .then(setCategories)
      .catch((err) => {
        const message = toMessage(err)
        if (message !== null) setCategoryError(message)
      })
    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (!validPage || !categoryReady) return

    // StrictMode 에서 effect 가 두 번 돌거나 조건이 바뀌면 앞선 요청은 취소한다.
    const controller = new AbortController()
    const categoryCodes = codesKey === '' ? null : codesKey.split(',').map(Number)

    // 조건이 없으면 서버 페이징을, 있으면 목록을 받아 거르는 쪽을 쓴다.
    const request = filtering
      ? fetchFilteredMenuPage(
          { page, size: PAGE_SIZE, keyword, categoryCodes, minPrice, maxPrice, status, sort },
          controller.signal,
        )
      : fetchMenuPage({ page, size: PAGE_SIZE, sort }, controller.signal)

    request
      .then((data) => setResult({ ...data, key: queryKey }))
      .catch((err) => {
        const message = toMessage(err)
        if (message === null) return
        setFailure({ key: queryKey, message })
      })

    return () => controller.abort()
  }, [queryKey, validPage, categoryReady, filtering, page, keyword, codesKey, minPrice, maxPrice, status, sort])

  const current = result?.key === queryKey ? result : null
  const menus = current?.menus ?? []
  const error = failure?.key === queryKey ? failure.message : null
  const loading = !current && !error

  // 조건이 바뀌면 1페이지로 돌아간다. 빈 값은 쿼리스트링에서 뺀다.
  const updateFilters = (changes) => {
    const next = new URLSearchParams(params)
    for (const [name, value] of Object.entries(changes)) {
      if (value === null || value === '') next.delete(name)
      else next.set(name, String(value))
    }
    next.delete('page')
    setParams(next)
  }

  // 조건 초기화는 거르는 조건만 지우고 정렬은 남긴다.
  const resetFilters = () => setParams(sort === 'latest' ? {} : { sort })

  const changePage = (nextPage) => {
    const next = new URLSearchParams(params)
    next.set('page', String(nextPage))
    setParams(next)
    window.scrollTo({ top: 0 })
  }

  const total = typeof current?.total === 'number' ? current.total : null

  // 품절을 바꾸면 목록을 다시 받지 않고 그 메뉴만 바꿔 끼운다. 방금 바꾼 카드만 도장 찍는 움직임을 보인다.
  const [toast, setToast] = useState(null)
  const closeToast = useCallback(() => setToast(null), [])
  const [changedCode, setChangedCode] = useState(null)

  const replaceMenu = (saved) => {
    setResult((prev) => ({ ...prev, menus: prev.menus.map((m) => (m.menuCode === saved.menuCode ? saved : m)) }))
    setChangedCode(saved.menuCode)
    setToast({
      message: saved.orderableStatus === 'Y' ? `‘${saved.menuName}’ 판매를 다시 시작했어요.` : `‘${saved.menuName}’을(를) 품절로 표시했어요.`,
    })
  }

  const showError = (message) => setToast({ message: `품절 상태를 바꾸지 못했어요. ${message}`, error: true })

  return (
    <section className={styles.page}>
      <h1 className={`title2 bold ${styles.title}`}>메뉴 목록</h1>

      <Filters
        keyword={keyword}
        minPrice={minPrice}
        maxPrice={maxPrice}
        categoryCode={categoryCode}
        categories={categories}
        categoryError={categoryError}
        onSearch={({ keyword: q, minPrice: min, maxPrice: max }) => updateFilters({ q, minPrice: min, maxPrice: max })}
        onCategory={(code) => updateFilters({ category: code })}
      />

      {/* 개수와 정렬은 카드 바로 위에 둔다. 개수는 불러오는 동안 비워 둔다. */}
      <div className={styles.toolbar}>
        <p className={`body2 medium num ${styles.count}`} aria-live="polite">
          {total !== null && (filtering ? `찾은 메뉴 ${total}개` : `전체 ${total}개`)}
        </p>
        <div className={styles.tools}>
          <StatusFilter value={status} onChange={(value) => updateFilters({ status: value })} />
          <SortSelect value={sort} onChange={(value) => updateFilters({ sort: value === 'latest' ? null : value })} />
        </div>
      </div>

      {!validPage ? (
        <EmptyState icon="search" title="없는 페이지예요" description="페이지 번호는 1부터 시작해요.">
          <Link to="/menus" className={`body2 bold ${button.secondary}`}>
            첫 페이지로
          </Link>
        </EmptyState>
      ) : error ? (
        <EmptyState icon="error" title="메뉴를 불러오지 못했어요" description={error}>
          <button type="button" className={`body2 bold ${button.secondary}`} onClick={() => setAttempt((n) => n + 1)}>
            다시 시도
          </button>
        </EmptyState>
      ) : loading ? (
        <div className={styles.plate} aria-busy="true" aria-label="메뉴를 불러오는 중">
          {Array.from({ length: 8 }, (_, i) => (
            <MenuCardSkeleton key={i} />
          ))}
        </div>
      ) : menus.length === 0 ? (
        filtering ? (
          <EmptyState icon="search" title="조건에 맞는 메뉴가 없어요" description="검색어, 가격 범위, 카테고리, 판매 상태를 바꿔 보세요.">
            <button type="button" className={`body2 bold ${button.secondary}`} onClick={resetFilters}>
              조건 초기화
            </button>
          </EmptyState>
        ) : (
          <EmptyState icon="empty" title="아직 등록된 메뉴가 없어요" description="첫 메뉴를 등록하면 여기에 보여요.">
            <Link to="/menus/new" className={`body2 bold ${button.primary}`}>
              메뉴 등록
            </Link>
          </EmptyState>
        )
      ) : (
        <>
          <ul className={styles.plate}>
            {menus.map((menu) => (
              <li key={menu.menuCode} className={styles.item}>
                <Link to={`/menus/${menu.menuCode}`} state={{ listSearch: params.toString() }} className={styles.cardLink}>
                  <MenuCard menu={menu} tone={toneOf(menu.categoryCode, categories)} justChanged={menu.menuCode === changedCode} />
                </Link>
                {/* 링크 안에 버튼을 둘 수 없어서, 카드 밖에 두고 색 판 위로 겹친다. */}
                <SoldOutToggle menu={menu} onChanged={replaceMenu} onError={showError} className={styles.toggle} />
              </li>
            ))}
          </ul>
          <Pagination page={page} totalPages={current.totalPages} onChange={changePage} />
        </>
      )}

      <Toast message={toast?.message} error={toast?.error} onDone={closeToast} />
    </section>
  )
}
