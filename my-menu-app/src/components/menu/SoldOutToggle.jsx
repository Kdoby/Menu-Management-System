import { useState } from 'react'
import { changeOrderable } from '../../api/menu.js'
import { toMessage } from '../../api/client.js'
import button from '../ui/Button.module.css'
import styles from './SoldOutToggle.module.css'

const ICONS = {
  // 품절 표시: 꼬리표
  mark: (
    <>
      <path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9Z" />
      <circle cx="7.5" cy="7.5" r="1.2" />
    </>
  ),
  // 판매 재개: 되돌리기 화살표
  resume: (
    <>
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5" />
    </>
  ),
}

// 품절 표시 ↔ 판매 재개. 요청이 끝나면 저장된 메뉴를 onChanged 로 넘긴다.
// overlay 는 카드 위에 떠 있는 동그란 버튼(마우스를 올리면 글자가 펼쳐짐), plain 은 상세의 보통 버튼.
export default function SoldOutToggle({ menu, variant = 'overlay', onChanged, onError, className }) {
  const [busy, setBusy] = useState(false)
  const soldOut = menu.orderableStatus !== 'Y'
  const label = soldOut ? '판매 재개' : '품절 표시'

  const toggle = async () => {
    setBusy(true)
    try {
      onChanged(await changeOrderable(menu, soldOut ? 'Y' : 'N'))
    } catch (err) {
      onError(toMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      aria-label={variant === 'overlay' ? `${menu.menuName} ${label}` : undefined}
      aria-busy={busy}
      disabled={busy}
      className={`${variant === 'plain' ? 'body2' : 'label1'} bold ${styles.toggle} ${variant === 'plain' ? button.secondary : styles.overlay} ${className ?? ''}`}
      onClick={toggle}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {ICONS[soldOut ? 'resume' : 'mark']}
      </svg>
      <span className={styles.label}>{label}</span>
    </button>
  )
}
