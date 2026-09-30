import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { fetchMenu, removeMenu } from '../api/menu.js'
import { fetchCategories } from '../api/category.js'
import { toMessage } from '../api/client.js'
import { parentCodeOf, toneOf } from '../lib/categories.js'
import { formatPrice } from '../lib/format.js'
import CategoryArt from '../components/menu/CategoryArt.jsx'
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import SoldOutStamp from '../components/menu/SoldOutStamp.jsx'
import SoldOutToggle from '../components/menu/SoldOutToggle.jsx'
import Toast from '../components/ui/Toast.jsx'
import button from '../components/ui/Button.module.css'
import skeleton from '../components/ui/Skeleton.module.css'
import styles from './MenuDetailPage.module.css'

export default function MenuDetailPage() {
  const { menuCode } = useParams()

  // 목록에서 들어왔으면 보던 조건·페이지로 돌아간다.
  const location = useLocation()
  const listSearch = location.state?.listSearch
  const backTo = listSearch ? `/menus?${listSearch}` : '/menus'

  // 결과와 오류에 어느 메뉴의 것인지 함께 적어 두고, 지금 메뉴의 것이 아니면 불러오는 중으로 본다.
  const [result, setResult] = useState(null)
  const [failure, setFailure] = useState(null)

  useEffect(() => {
    const controller = new AbortController()

    fetchMenu(menuCode, controller.signal)
      .then((menu) => setResult({ code: menuCode, menu }))
      .catch((err) => {
        const message = toMessage(err)
        if (message === null) return
        setFailure({ code: menuCode, message })
      })

    return () => controller.abort()
  }, [menuCode])

  // 카테고리는 색과 상위 이름을 붙이는 데만 쓴다. 못 받으면 없이 보여 준다.
  const [categories, setCategories] = useState([])

  useEffect(() => {
    const controller = new AbortController()
    fetchCategories(controller.signal)
      .then(setCategories)
      .catch(() => {})
    return () => controller.abort()
  }, [])

  const menu = result?.code === menuCode ? result.menu : null
  const error = failure?.code === menuCode ? failure.message : null

  return (
    <section className={styles.page}>
      <nav aria-label="위치" className={`label1 medium ${styles.breadcrumb}`}>
        <Link to={backTo} className={styles.crumbLink}>
          메뉴 목록
        </Link>
        <span aria-hidden="true">/</span>
        <span className={styles.crumbCurrent}>{menu?.menuName ?? '메뉴 상세'}</span>
      </nav>

      {!menu && !error && (
        <div className={styles.card} aria-busy="true" aria-label="메뉴를 불러오는 중">
          <div className={styles.head} aria-hidden="true">
            <span className={`${skeleton.bone} ${styles.boneShort}`} />
            <span className={`${skeleton.bone} ${styles.boneName}`} />
            <span className={`${skeleton.bone} ${styles.bonePrice}`} />
          </div>
        </div>
      )}

      {error && (
        <EmptyState icon="error" title="메뉴를 찾지 못했어요" description={error}>
          <Link to={backTo} className={`body2 bold ${button.secondary} ${styles.secondary}`}>
            목록으로
          </Link>
        </EmptyState>
      )}

      {menu && <MenuInfo key={menu.menuCode} menu={menu} categories={categories} backTo={backTo} />}
    </section>
  )
}

function MenuInfo({ menu: loaded, categories, backTo }) {
  // 주문 상태를 바로 바꿀 수 있어서, 받은 메뉴를 고쳐 쓸 수 있게 상태로 둔다.
  const [menu, setMenu] = useState(loaded)
  const orderable = menu.orderableStatus === 'Y'

  const [toast, setToast] = useState(null)
  const closeToast = useCallback(() => setToast(null), [])

  // 방금 품절로 바꿨을 때만 도장 찍는 움직임을 보인다.
  const [justChanged, setJustChanged] = useState(false)

  const handleSoldOutChanged = (saved) => {
    setMenu(saved)
    setJustChanged(true)
    setToast({ message: saved.orderableStatus === 'Y' ? '판매를 다시 시작했어요.' : '품절로 표시했어요.' })
  }
  const tone = toneOf(menu.categoryCode, categories)
  const parent = categories.find((c) => c.categoryCode === parentCodeOf(menu.categoryCode, categories))
  const categoryPath = parent && parent.categoryCode !== menu.categoryCode ? `${parent.categoryName} / ${menu.categoryName}` : menu.categoryName
  const navigate = useNavigate()

  // 삭제는 바로 하지 않고 확인 대화상자에서 한 번 더 받는다.
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

  const openConfirm = () => {
    setDeleteError(null)
    setConfirming(true)
  }

  const handleDelete = async () => {
    setDeleting(true)
    setDeleteError(null)
    try {
      await removeMenu(menu.menuCode)
      // 지운 뒤에는 목록으로. 뒤로가기로 지운 메뉴의 상세에 다시 오지 않게 기록을 바꾼다.
      navigate(backTo, { replace: true })
    } catch (err) {
      setDeleteError(toMessage(err))
      setDeleting(false)
    }
  }

  return (
    <article className={styles.card} data-tone={orderable ? (tone ?? undefined) : 'off'}>
      <CategoryArt tone={tone} size={220} stroke={4} className={styles.glyph} />
      <div className={styles.head}>
        <span className={`label1 bold ${styles.category}`}>{categoryPath}</span>
        <h1 className={`title1 bold ${styles.name}`}>{menu.menuName}</h1>
        <div className={styles.priceRow}>
          <span className={`display3 bold num ${orderable ? styles.price : styles.priceOff}`}>{formatPrice(menu.menuPrice)}</span>
          {!orderable && <SoldOutStamp size="large" animate={justChanged} />}
        </div>
      </div>

      <dl className={styles.info}>
        <div className={styles.row}>
          <dt className={`body2 medium ${styles.term}`}>메뉴 코드</dt>
          <dd className="body2 num">{menu.menuCode}</dd>
        </div>
        <div className={styles.row}>
          <dt className={`body2 medium ${styles.term}`}>카테고리</dt>
          <dd className="body2">{categoryPath}</dd>
        </div>
        <div className={styles.row}>
          <dt className={`body2 medium ${styles.term}`}>판매 상태</dt>
          <dd className={`body2 ${orderable ? '' : 'bold'}`}>{orderable ? '판매 중' : '품절'}</dd>
        </div>
      </dl>

      <div className={styles.actions}>
        <Link to={backTo} className={`body2 bold ${button.secondary} ${styles.secondary}`}>
          목록으로
        </Link>
        {/* 이 메뉴의 값을 채운 등록 폼을 연다. 저장 전까지는 아무것도 만들지 않는다. */}
        <Link
          to="/menus/new"
          state={{ copyFrom: menu }}
          className={`body2 bold ${button.secondary} ${styles.secondary}`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="8" y="8" width="13" height="13" rx="2" />
            <path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" />
          </svg>
          복제
        </Link>
        <span className={styles.spacer} />
        <SoldOutToggle
          menu={menu}
          variant="plain"
          className={styles.soldOutToggle}
          onChanged={handleSoldOutChanged}
          onError={(message) => setToast({ message: `품절 상태를 바꾸지 못했어요. ${message}`, error: true })}
        />
        <button type="button" className={`body2 bold ${button.danger} ${styles.delete}`} onClick={openConfirm}>
          삭제
        </button>
        <Link to={`/menus/${menu.menuCode}/edit`} className={`body2 bold ${button.primary} ${styles.edit}`}>
          수정
        </Link>
      </div>

      <ConfirmDialog
        open={confirming}
        title="메뉴를 삭제할까요?"
        description={`‘${menu.menuName}’을(를) 목록에서 지워요. 삭제한 메뉴는 되돌릴 수 없어요.`}
        confirmLabel="삭제"
        busy={deleting}
        error={deleteError}
        onConfirm={handleDelete}
        onCancel={() => setConfirming(false)}
      />

      <Toast message={toast?.message} error={toast?.error} onDone={closeToast} />
    </article>
  )
}
