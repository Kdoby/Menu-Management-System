import styles from './SortSelect.module.css'

const SORT_LABELS = {
  latest: '최신순',
  priceAsc: '낮은 가격순',
  priceDesc: '높은 가격순',
  name: '이름순',
}

// 기본 select 를 글자처럼 보이게 다듬는다. 모바일에선 OS 선택창이 뜨고 키보드로도 바뀐다.
export default function SortSelect({ value, onChange }) {
  return (
    <div className={styles.box}>
      <label htmlFor="sort" className="srOnly">
        정렬
      </label>
      <select id="sort" className={`label1 bold ${styles.select}`} value={value} onChange={(e) => onChange(e.target.value)}>
        {Object.entries(SORT_LABELS).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>
      <svg className={styles.chevron} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
  )
}
