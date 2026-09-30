import styles from './StatusFilter.module.css'

const OPTIONS = [
  { value: null, label: '전체' },
  { value: 'onSale', label: '판매 중' },
  { value: 'soldOut', label: '품절' },
]

// 판매 상태로 거르는 세 칸짜리 선택. 폼의 판매 상태 선택과 같은 모양을 작게 쓴다.
export default function StatusFilter({ value, onChange }) {
  return (
    <div role="group" aria-label="판매 상태" className={styles.segment}>
      {OPTIONS.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.label}
            type="button"
            aria-pressed={selected}
            className={`label1 ${selected ? `bold ${styles.on}` : `medium ${styles.off}`}`}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
