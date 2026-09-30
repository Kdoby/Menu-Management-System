import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router'
import { fetchAllMenus } from '../api/menu.js'
import { fetchCategories } from '../api/category.js'
import { toMessage } from '../api/client.js'
import { categoryCodesFor, groupCategories, toneOf } from '../lib/categories.js'
import { formatPrice } from '../lib/format.js'
import CategoryArt from '../components/menu/CategoryArt.jsx'
import SoldOutToggle from '../components/menu/SoldOutToggle.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import Toast from '../components/ui/Toast.jsx'
import button from '../components/ui/Button.module.css'
import skeleton from '../components/ui/Skeleton.module.css'
import styles from './HomePage.module.css'

const RECENT_COUNT = 5

// 첫 화면. 갈래(식사·음료·디저트)별 판으로 목록에 들어가고, 품절 메뉴는 여기서 바로 판매를 재개한다.
export default function HomePage() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    Promise.all([fetchAllMenus(controller.signal), fetchCategories(controller.signal)])
      .then(([menus, categories]) => {
        setData({ menus, categories })
        setError(null)
      })
      .catch((err) => {
        const message = toMessage(err)
        if (message !== null) setError(message)
      })
    return () => controller.abort()
  }, [attempt])

  const [toast, setToast] = useState(null)
  const closeToast = useCallback(() => setToast(null), [])

  // 판매를 재개하면 다시 받지 않고 그 메뉴만 바꿔 끼운다. 품절 목록에서는 바로 빠진다.
  const replaceMenu = (saved) => {
    setData((prev) => ({ ...prev, menus: prev.menus.map((m) => (m.menuCode === saved.menuCode ? saved : m)) }))
    setToast({
      message: saved.orderableStatus === 'Y' ? `‘${saved.menuName}’ 판매를 다시 시작했어요.` : `‘${saved.menuName}’을(를) 품절로 표시했어요.`,
    })
  }
  const showError = (message) => setToast({ message: `품절 상태를 바꾸지 못했어요. ${message}`, error: true })

  if (error && !data) {
    return (
      <section className={styles.page}>
        <EmptyState icon="error" title="차림표를 불러오지 못했어요" description={error}>
          <button type="button" className={`body2 bold ${button.secondary}`} onClick={() => setAttempt((n) => n + 1)}>
            다시 시도
          </button>
        </EmptyState>
      </section>
    )
  }

  if (!data) return <HomeSkeleton />

  const { menus, categories } = data
  const soldOut = menus.filter((m) => m.orderableStatus !== 'Y')
  const recent = [...menus].sort((a, b) => b.menuCode - a.menuCode).slice(0, RECENT_COUNT)
  const boards = groupCategories(categories).map((group) => {
    const codes = categoryCodesFor(group.categoryCode, categories)
    const inGroup = menus.filter((m) => codes.includes(m.categoryCode))
    return {
      ...group,
      tone: toneOf(group.categoryCode, categories),
      count: inGroup.length,
      soldOut: inGroup.filter((m) => m.orderableStatus !== 'Y').length,
    }
  })

  const summary =
    menus.length === 0
      ? '아직 등록된 메뉴가 없어요. 첫 메뉴를 등록해 보세요.'
      : soldOut.length === 0
        ? `메뉴 ${menus.length}개를 모두 팔고 있어요.`
        : `판매 중 ${menus.length - soldOut.length}개, 품절 ${soldOut.length}개예요.`

  return (
    <section className={styles.page}>
      <header className={styles.intro}>
        <h1 className={`display3 bold ${styles.title}`}>오늘의 차림표</h1>
        <p className={`body1 num ${styles.summary}`}>{summary}</p>
        <div className={styles.actions}>
          <Link to="/menus/new" className={`body2 bold ${button.primary}`}>
            메뉴 등록
          </Link>
          <Link to="/menus" className={`body2 bold ${button.secondary}`}>
            전체 메뉴 보기
          </Link>
        </div>
      </header>

      {/* 갈래별 판. 누르면 그 갈래로 걸러진 목록으로 간다. */}
      <ul className={styles.boards}>
        {boards.map((board) => (
          <li key={board.categoryCode}>
            <Link to={`/menus?category=${board.categoryCode}`} className={styles.board} data-tone={board.tone ?? undefined}>
              <CategoryArt tone={board.tone} size={148} stroke={3} className={styles.boardGlyph} />
              <h2 className={`title2 bold ${styles.boardName}`}>{board.categoryName}</h2>
              <p className={`body2 medium num ${styles.boardCount}`}>
                메뉴 {board.count}개{board.soldOut > 0 && `, 품절 ${board.soldOut}개`}
              </p>
              <ul className={styles.subs} aria-label={`${board.categoryName} 세부 카테고리`}>
                {board.children.map((child) => (
                  <li key={child.categoryCode} className={`label2 medium ${styles.sub}`}>
                    {child.categoryName}
                  </li>
                ))}
              </ul>
            </Link>
          </li>
        ))}
      </ul>

      <div className={styles.columns}>
        <section className={styles.panel} aria-labelledby="home-soldout">
          <h2 id="home-soldout" className={`headline1 bold ${styles.panelTitle}`}>
            품절 메뉴
          </h2>
          {soldOut.length === 0 ? (
            <p className={`body2 ${styles.panelEmpty}`}>품절된 메뉴가 없어요.</p>
          ) : (
            <ul className={styles.rows}>
              {soldOut.map((menu) => (
                <li key={menu.menuCode} className={styles.row}>
                  <Link to={`/menus/${menu.menuCode}`} className={styles.rowMain}>
                    <span className={`body2 bold ${styles.rowName}`}>{menu.menuName}</span>
                    <span className={`label1 num ${styles.rowMeta}`}>
                      {menu.categoryName}, {formatPrice(menu.menuPrice)}
                    </span>
                  </Link>
                  <SoldOutToggle menu={menu} variant="plain" className={styles.rowAction} onChanged={replaceMenu} onError={showError} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={styles.panel} aria-labelledby="home-recent">
          <h2 id="home-recent" className={`headline1 bold ${styles.panelTitle}`}>
            최근 등록한 메뉴
          </h2>
          {recent.length === 0 ? (
            <p className={`body2 ${styles.panelEmpty}`}>등록된 메뉴가 없어요.</p>
          ) : (
            <ul className={styles.rows}>
              {recent.map((menu) => (
                <li key={menu.menuCode} className={styles.row}>
                  <Link to={`/menus/${menu.menuCode}`} className={styles.rowMain}>
                    <span className={`body2 bold ${styles.rowName}`}>{menu.menuName}</span>
                    <span className={`label1 ${styles.rowMeta}`}>{menu.categoryName}</span>
                  </Link>
                  <span className={`body2 bold num ${menu.orderableStatus === 'Y' ? styles.rowPrice : styles.rowPriceOff}`}>
                    {formatPrice(menu.menuPrice)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <Toast message={toast?.message} error={toast?.error} onDone={closeToast} />
    </section>
  )
}

// 불러오는 동안 같은 자리를 채운다.
function HomeSkeleton() {
  return (
    <section className={styles.page} aria-busy="true" aria-label="차림표를 불러오는 중">
      <div className={styles.intro} aria-hidden="true">
        <span className={`${skeleton.bone} ${styles.boneTitle}`} />
        <span className={`${skeleton.bone} ${styles.boneLine}`} />
      </div>
      <div className={styles.boards} aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span key={i} className={`${skeleton.bone} ${styles.boneBoard}`} />
        ))}
      </div>
    </section>
  )
}
