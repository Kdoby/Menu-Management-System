import { groupCategories, parentCodeOf, toneOf } from '../../lib/categories.js'
import CategoryArt from './CategoryArt.jsx'
import styles from './Filters.module.css'

// 카테고리는 두 단계로 고른다. 위 탭은 상위(식사·음료·디저트), 아래 칩은 그 상위의 하위 카테고리다.
// 상위 탭만 고르면 그 아래 메뉴가 모두 나온다.
export default function Filters({ keyword, minPrice, maxPrice, categoryCode, categories, categoryError, onSearch, onCategory }) {
  const handleSubmit = (event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const read = (name) => {
      const raw = String(form.get(name)).trim()
      return /^\d+$/.test(raw) ? Number(raw) : null
    }
    let min = read('minPrice')
    let max = read('maxPrice')
    // 최소가 최대보다 크면 뒤바꿔 넣은 것으로 보고 맞바꾼다.
    if (min !== null && max !== null && min > max) [min, max] = [max, min]
    onSearch({ keyword: String(form.get('q')).trim(), minPrice: min, maxPrice: max })
  }

  const groups = groupCategories(categories)
  const parentCode = categoryCode === null ? null : parentCodeOf(categoryCode, categories)
  const activeGroup = groups.find((group) => group.categoryCode === parentCode)

  const tabClass = (selected) => `body1 ${selected ? `bold ${styles.tabOn}` : `medium ${styles.tab}`}`
  const chipClass = (selected) => `label1 ${selected ? `bold ${styles.chipOn}` : `medium ${styles.chip}`}`

  return (
    <section aria-label="검색 조건" className={styles.filters}>
      {/* URL 이 바뀌면(조건 초기화 등) 입력칸도 URL 값으로 다시 채운다. */}
      <form key={`${keyword}|${minPrice ?? ''}|${maxPrice ?? ''}`} role="search" className={styles.row} onSubmit={handleSubmit}>
        <div className={`${styles.inputBox} ${styles.keyword}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <label htmlFor="q" className="srOnly">
            메뉴 이름
          </label>
          <input id="q" name="q" type="search" className={`body1 ${styles.input}`} placeholder="메뉴 이름으로 검색" defaultValue={keyword} />
        </div>

        {/* 가격 범위. 최소 이상 최대 이하이고, 한쪽만 채워도 된다. */}
        <div role="group" aria-label="가격 범위" className={`${styles.inputBox} ${styles.price}`}>
          <label htmlFor="minPrice" className="srOnly">
            최소 가격
          </label>
          <input
            id="minPrice"
            name="minPrice"
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            className={`body1 num ${styles.input} ${styles.priceInput}`}
            placeholder="최소"
            defaultValue={minPrice ?? ''}
          />
          <span className={`body2 ${styles.unit}`} aria-hidden="true">
            ~
          </span>
          <label htmlFor="maxPrice" className="srOnly">
            최대 가격
          </label>
          <input
            id="maxPrice"
            name="maxPrice"
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            className={`body1 num ${styles.input} ${styles.priceInput}`}
            placeholder="최대"
            defaultValue={maxPrice ?? ''}
          />
          <span className={`body2 ${styles.unit}`}>원</span>
        </div>

        <button type="submit" className={`body2 bold ${styles.submit}`}>
          검색
        </button>
      </form>

      {categoryError ? (
        <p role="alert" className={`label1 ${styles.error}`}>
          카테고리를 불러오지 못했어요. {categoryError}
        </p>
      ) : (
        <div className={styles.categories}>
          <div role="group" aria-label="카테고리" className={styles.tabs}>
            <button type="button" aria-pressed={parentCode === null} className={tabClass(parentCode === null)} onClick={() => onCategory(null)}>
              전체
            </button>
            {groups.map((group) => (
              <button
                key={group.categoryCode}
                type="button"
                aria-pressed={group.categoryCode === parentCode}
                className={tabClass(group.categoryCode === parentCode)}
                data-tone={toneOf(group.categoryCode, categories) ?? undefined}
                onClick={() => onCategory(group.categoryCode)}
              >
                <CategoryArt tone={toneOf(group.categoryCode, categories)} size={20} stroke={1.8} className={styles.tabIcon} />
                {group.categoryName}
              </button>
            ))}
          </div>

          {activeGroup && (
            <div role="group" aria-label={`${activeGroup.categoryName} 세부 카테고리`} className={styles.chips}>
              <button
                type="button"
                aria-pressed={categoryCode === activeGroup.categoryCode}
                className={chipClass(categoryCode === activeGroup.categoryCode)}
                onClick={() => onCategory(activeGroup.categoryCode)}
              >
                {activeGroup.categoryName} 전체
              </button>
              {activeGroup.children.map((child) => {
                const selected = child.categoryCode === categoryCode
                return (
                  <button
                    key={child.categoryCode}
                    type="button"
                    aria-pressed={selected}
                    className={chipClass(selected)}
                    onClick={() => onCategory(child.categoryCode)}
                  >
                    {child.categoryName}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
