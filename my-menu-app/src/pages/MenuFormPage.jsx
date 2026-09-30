import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useBeforeUnload, useBlocker, useLocation, useNavigate, useParams } from 'react-router'
import { createMenu, fetchAllMenus, fetchMenu, updateMenu } from '../api/menu.js'
import { fetchCategories } from '../api/category.js'
import { toMessage } from '../api/client.js'
import { groupCategories } from '../lib/categories.js'
import { formatPrice } from '../lib/format.js'
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import button from '../components/ui/Button.module.css'
import skeleton from '../components/ui/Skeleton.module.css'
import styles from './MenuFormPage.module.css'

const EMPTY = { menuName: '', menuPrice: '', categoryCode: '', orderableStatus: 'Y' }

// 등록(/menus/new)과 수정(/menus/:menuCode/edit)이 함께 쓰는 화면.
// 상세의 "복제"로 오면 등록 화면에 그 메뉴의 값이 채워진다(state.copyFrom).
export default function MenuFormPage() {
  const { menuCode } = useParams()
  const editing = menuCode !== undefined
  const location = useLocation()
  const copyFrom = editing ? null : (location.state?.copyFrom ?? null)

  const [categories, setCategories] = useState([])
  const [categoryError, setCategoryError] = useState(null)

  // 수정일 때 불러온 메뉴. 어느 메뉴의 것인지 함께 적어 둔다.
  const [loaded, setLoaded] = useState(null)
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
    if (!editing) return

    const controller = new AbortController()
    fetchMenu(menuCode, controller.signal)
      .then((menu) => setLoaded({ code: menuCode, menu }))
      .catch((err) => {
        const message = toMessage(err)
        if (message !== null) setFailure({ code: menuCode, message })
      })
    return () => controller.abort()
  }, [editing, menuCode])

  // 이름 중복을 알리려고 전체 메뉴를 한 번 받아 둔다. 서버에 이름 검색이 없다.
  // 못 받으면 중복 안내 없이 폼만 쓴다.
  const [allMenus, setAllMenus] = useState([])

  useEffect(() => {
    const controller = new AbortController()
    fetchAllMenus(controller.signal)
      .then(setAllMenus)
      .catch(() => {})
    return () => controller.abort()
  }, [])

  // 등록일 때는 menuCode 와 loaded?.code 가 둘 다 undefined 라 같게 나오므로, 수정일 때만 비교한다.
  const menu = editing && loaded?.code === menuCode ? loaded.menu : null
  const error = editing && failure?.code === menuCode ? failure.message : null

  if (editing && error) {
    return (
      <section className={styles.page}>
        <EmptyState icon="error" title="고칠 메뉴를 불러오지 못했어요" description={error}>
          <Link to="/menus" className={`body2 bold ${button.secondary} ${styles.cancel}`}>
            목록으로
          </Link>
        </EmptyState>
      </section>
    )
  }

  if (editing && !menu) {
    return (
      <section className={styles.page}>
        <div className={styles.card} aria-busy="true" aria-label="메뉴를 불러오는 중">
          {[0, 1, 2].map((i) => (
            <div key={i} className={styles.field} aria-hidden="true">
              <span className={`${skeleton.bone} ${styles.boneLabel}`} />
              <span className={`${skeleton.bone} ${styles.boneInput}`} />
            </div>
          ))}
        </div>
      </section>
    )
  }

  const source = editing ? menu : copyFrom
  const initial = source
    ? {
        menuName: source.menuName,
        menuPrice: String(source.menuPrice),
        categoryCode: String(source.categoryCode),
        orderableStatus: source.orderableStatus,
      }
    : EMPTY

  // 등록 ↔ 수정, 다른 메뉴로 옮겨 가면 입력 상태를 새로 시작한다.
  // 등록은 이동할 때마다(복제 → 헤더의 메뉴 등록 등) location.key 가 바뀌어 새 폼이 된다.
  return (
    <MenuForm
      key={menuCode ?? `new-${location.key}`}
      menuCode={menuCode}
      copyFrom={copyFrom}
      initial={initial}
      categories={categories}
      categoryError={categoryError}
      allMenus={allMenus}
    />
  )
}

// 띄어쓰기와 대소문자를 무시하고 이름을 견준다. '관측용파스타' 와 '관측용 파스타' 는 같은 이름이다.
const nameKey = (name) => name.replace(/\s+/g, '').toLowerCase()

// 같은 이름의 다른 메뉴. 수정 중이면 고치는 메뉴 자신은 뺀다.
function findSameName(name, allMenus, menuCode) {
  const key = nameKey(name)
  if (key === '') return []
  return allMenus.filter((m) => nameKey(m.menuName) === key && String(m.menuCode) !== String(menuCode))
}

// 비어 있거나 잘못된 칸마다 알릴 문구를 모은다. 없으면 빈 객체.
function validate(values) {
  const errors = {}
  if (values.menuName.trim() === '') errors.menuName = '메뉴 이름을 입력해 주세요.'
  if (values.menuPrice.trim() === '') errors.menuPrice = '가격을 입력해 주세요.'
  else if (!/^\d+$/.test(values.menuPrice.trim())) errors.menuPrice = '가격은 0 이상의 정수로 입력해 주세요.'
  if (values.categoryCode === '') errors.categoryCode = '카테고리를 선택해 주세요.'
  return errors
}

function MenuForm({ menuCode, copyFrom, initial, categories, categoryError, allMenus }) {
  const editing = menuCode !== undefined
  const navigate = useNavigate()

  // 복제로 왔으면 이름 칸을 골라 두어 바로 새 이름을 칠 수 있게 한다.
  const nameRef = useRef(null)
  useEffect(() => {
    if (copyFrom) nameRef.current.select()
  }, [copyFrom])

  const [values, setValues] = useState(initial)
  // 이름이 겹쳐도 저장은 막지 않는다. 표에 유일 제약이 없어서 같은 이름이 허용된다.
  const sameName = findSameName(values.menuName, allMenus, menuCode)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)

  // 처음 채워진 값에서 하나라도 바뀌었으면 저장 안 한 내용이 있는 것으로 본다.
  const dirty = Object.keys(initial).some((name) => values[name] !== initial[name])

  // 저장에 성공해 상세로 옮겨 갈 때는 묻지 않는다. 이동이 상태 갱신보다 먼저라 ref 로 표시한다.
  const leavingRef = useRef(false)

  // 앱 안에서 다른 화면으로 옮겨 가려 하면 붙잡는다. 같은 화면 안의 이동(주소 뒤 ?·# 만 바뀜)은 두고 본다.
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirty && !leavingRef.current && currentLocation.pathname !== nextLocation.pathname,
  )

  // 탭을 닫거나 새로고침하면 브라우저 기본 경고를 띄운다. 문구는 브라우저가 정한다.
  useBeforeUnload(
    useCallback(
      (event) => {
        if (dirty && !leavingRef.current) event.preventDefault()
      },
      [dirty],
    ),
  )

  const change = (event) => {
    const { name, value } = event.target
    setValues((prev) => ({ ...prev, [name]: value }))
    // 고친 칸의 오류는 바로 지운다.
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const found = validate(values)
    setErrors(found)
    if (Object.keys(found).length > 0) return

    const payload = {
      menuName: values.menuName.trim(),
      menuPrice: Number(values.menuPrice.trim()),
      categoryCode: Number(values.categoryCode),
      orderableStatus: values.orderableStatus === 'N' ? 'N' : 'Y',
    }

    setSaving(true)
    setSaveError(null)
    try {
      const saved = editing ? await updateMenu(menuCode, payload) : await createMenu(payload)
      // 저장이 끝나면 그 메뉴의 상세로 간다. 뒤로가기로 폼에 다시 오지 않게 기록을 바꾼다.
      leavingRef.current = true
      navigate(`/menus/${saved.menuCode}`, { replace: true })
    } catch (err) {
      setSaveError(toMessage(err))
      setSaving(false)
    }
  }

  const fieldClass = (name) => `${styles.control} ${errors[name] ? styles.invalid : ''}`
  const cancelTo = editing ? `/menus/${menuCode}` : copyFrom ? `/menus/${copyFrom.menuCode}` : '/menus'

  return (
    <section className={styles.page}>
      <form noValidate className={styles.card} onSubmit={handleSubmit}>
        <div className={styles.head}>
          <h1 className={`title2 bold ${styles.title}`}>{editing ? '메뉴 수정' : copyFrom ? '메뉴 복제' : '메뉴 등록'}</h1>
          <p className={`body2 ${styles.hint}`}>
            {copyFrom
              ? `‘${copyFrom.menuName}’의 내용을 가져왔어요. 이름을 바꿔 새 메뉴로 등록하세요.`
              : '모든 칸을 채워야 저장할 수 있어요.'}
          </p>
        </div>

        {saveError && (
          <p role="alert" className={`body2 ${styles.banner}`}>
            {saveError}
          </p>
        )}

        <div className={styles.field}>
          <label htmlFor="menuName" className={`label1 bold ${styles.label}`}>
            메뉴 이름
          </label>
          <input
            ref={nameRef}
            id="menuName"
            name="menuName"
            type="text"
            className={`body1 ${fieldClass('menuName')}`}
            placeholder="예: 열무김치라떼"
            value={values.menuName}
            onChange={change}
            aria-invalid={Boolean(errors.menuName)}
            aria-describedby={
              [errors.menuName && 'menuName-error', sameName.length > 0 && 'menuName-same'].filter(Boolean).join(' ') || undefined
            }
          />
          {errors.menuName && (
            <span id="menuName-error" className={`caption1 medium ${styles.error}`}>
              {errors.menuName}
            </span>
          )}
          <div role="status">
            {sameName.length > 0 && (
              <div id="menuName-same" className={styles.same}>
                <svg className={styles.sameIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 3 2 20h20Z" />
                  <path d="M12 10v4M12 17v.01" />
                </svg>
                <div className={styles.sameBody}>
                  <p className={`label1 bold ${styles.sameTitle}`}>같은 이름의 메뉴가 이미 {sameName.length}개 있어요</p>
                  <ul className={styles.sameList}>
                    {sameName.slice(0, 3).map((m) => (
                      <li key={m.menuCode} className="label1">
                        <a href={`/menus/${m.menuCode}`} target="_blank" rel="noreferrer" className={styles.sameLink}>
                          {m.menuName}
                        </a>
                        <span className={`num ${styles.sameMeta}`}>
                          코드 {m.menuCode}, {m.categoryName}, {formatPrice(m.menuPrice)}
                          {m.orderableStatus !== 'Y' && ', 품절'}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {sameName.length > 3 && <p className={`caption1 ${styles.sameMeta}`}>외 {sameName.length - 3}개</p>}
                  <p className={`caption1 ${styles.sameMeta}`}>이름이 같아도 저장할 수 있어요. 목록에서 헷갈리지 않게 이름을 조금 바꾸는 걸 권해요.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={styles.field}>
          <label htmlFor="menuPrice" className={`label1 bold ${styles.label}`}>
            가격
          </label>
          <div className={`${fieldClass('menuPrice')} ${styles.priceBox}`}>
            <input
              id="menuPrice"
              name="menuPrice"
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              className={`body1 num ${styles.bare}`}
              placeholder="0"
              value={values.menuPrice}
              onChange={change}
              aria-invalid={Boolean(errors.menuPrice)}
              aria-describedby={errors.menuPrice ? 'menuPrice-error' : undefined}
            />
            <span className={`body2 ${styles.unit}`}>원</span>
          </div>
          {errors.menuPrice && (
            <span id="menuPrice-error" className={`caption1 medium ${styles.error}`}>
              {errors.menuPrice}
            </span>
          )}
        </div>

        <div className={styles.field}>
          <label htmlFor="categoryCode" className={`label1 bold ${styles.label}`}>
            카테고리
          </label>
          <select
            id="categoryCode"
            name="categoryCode"
            className={`body1 ${fieldClass('categoryCode')}`}
            value={values.categoryCode}
            onChange={change}
            aria-invalid={Boolean(errors.categoryCode)}
            aria-describedby={errors.categoryCode ? 'categoryCode-error' : undefined}
          >
            <option value="">카테고리 선택</option>
            {groupCategories(categories).map((group) => (
              <optgroup key={group.categoryCode} label={group.categoryName}>
                {group.children.map((child) => (
                  <option key={child.categoryCode} value={String(child.categoryCode)}>
                    {child.categoryName}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          {errors.categoryCode && (
            <span id="categoryCode-error" className={`caption1 medium ${styles.error}`}>
              {errors.categoryCode}
            </span>
          )}
          {categoryError && (
            <span role="alert" className={`caption1 medium ${styles.error}`}>
              {categoryError}
            </span>
          )}
        </div>

        <fieldset className={styles.fieldset}>
          <legend className={`label1 bold ${styles.label} ${styles.legend}`}>판매 상태</legend>
          <div className={styles.segment}>
            <label className={`body2 ${values.orderableStatus === 'Y' ? `bold ${styles.optionOn}` : `medium ${styles.option}`}`}>
              <input type="radio" name="orderableStatus" value="Y" checked={values.orderableStatus === 'Y'} onChange={change} />
              판매 중
            </label>
            <label className={`body2 ${values.orderableStatus === 'N' ? `bold ${styles.optionOn}` : `medium ${styles.option}`}`}>
              <input type="radio" name="orderableStatus" value="N" checked={values.orderableStatus === 'N'} onChange={change} />
              품절
            </label>
          </div>
        </fieldset>

        <div className={styles.actions}>
          <Link to={cancelTo} className={`body2 bold ${button.secondary} ${styles.cancel}`}>
            취소
          </Link>
          <button type="submit" className={`body2 bold ${button.primary} ${styles.submit}`} disabled={saving}>
            {saving ? '저장 중…' : editing ? '변경 내용 저장' : '메뉴 등록'}
          </button>
        </div>
      </form>

      <ConfirmDialog
        open={blocker.state === 'blocked'}
        title="저장하지 않고 나갈까요?"
        description={editing ? '고친 내용이 저장되지 않고 사라져요.' : '입력한 내용이 저장되지 않고 사라져요.'}
        cancelLabel="계속 작성"
        confirmLabel="나가기"
        onConfirm={() => blocker.proceed?.()}
        onCancel={() => blocker.reset?.()}
      />
    </section>
  )
}
