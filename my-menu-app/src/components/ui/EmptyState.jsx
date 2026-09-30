import styles from './EmptyState.module.css'

const ICONS = {
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </>
  ),
  empty: (
    <>
      <path d="M4 3v7a3 3 0 0 0 6 0V3" />
      <path d="M7 3v18" />
      <path d="M17 21V3c-2 1-3 4-3 7s1 4 3 4" />
    </>
  ),
  error: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5.5M12 16.5v.01" />
    </>
  ),
}

// 목록 자리를 대신하는 안내. 무엇이 일어났는지와 다음에 할 일을 함께 보여 준다.
// 오류일 때는 role="alert" 로 바로 읽히게 한다.
export default function EmptyState({ icon = 'search', title, description, children }) {
  const error = icon === 'error'

  return (
    <div role={error ? 'alert' : undefined} className={styles.empty}>
      <span className={`${styles.icon} ${error ? styles.iconError : ''}`} aria-hidden="true">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {ICONS[icon]}
        </svg>
      </span>
      <div className={styles.text}>
        <p className={`headline1 bold ${styles.title}`}>{title}</p>
        {description && <p className={`body2 ${styles.description}`}>{description}</p>}
      </div>
      {children && <div className={styles.actions}>{children}</div>}
    </div>
  )
}
