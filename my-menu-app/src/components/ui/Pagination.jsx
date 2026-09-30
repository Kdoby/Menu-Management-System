import styles from './Pagination.module.css'

const WINDOW = 5

// 현재 페이지를 가운데 두고 최대 5개 번호를 보여 준다. 페이지는 1부터 센다.
function pageNumbers(page, totalPages) {
  const start = Math.max(1, Math.min(page - Math.floor(WINDOW / 2), totalPages - WINDOW + 1))
  const end = Math.min(totalPages, start + WINDOW - 1)
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
}

export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null

  return (
    <nav aria-label="페이지" className={styles.pagination}>
      <button
        type="button"
        aria-label="이전 페이지"
        className={styles.arrow}
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m15 18-6-6 6-6" />
        </svg>
      </button>

      {pageNumbers(page, totalPages).map((n) => (
        <button
          key={n}
          type="button"
          aria-current={n === page ? 'page' : undefined}
          className={`body2 num ${n === page ? `bold ${styles.current}` : `medium ${styles.number}`}`}
          onClick={() => onChange(n)}
        >
          {n}
        </button>
      ))}

      <button
        type="button"
        aria-label="다음 페이지"
        className={styles.arrow}
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m9 18 6-6-6-6" />
        </svg>
      </button>
    </nav>
  )
}
