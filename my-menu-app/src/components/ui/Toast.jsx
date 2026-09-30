import { useEffect } from 'react'
import styles from './Toast.module.css'

// 화면 아래에 잠깐 떴다 사라지는 알림. message 가 바뀔 때마다 3초를 다시 센다.
export default function Toast({ message, error, onDone }) {
  useEffect(() => {
    if (!message) return
    const timer = setTimeout(onDone, 3000)
    return () => clearTimeout(timer)
  }, [message, onDone])

  return (
    <div role={error ? 'alert' : 'status'} className={styles.region}>
      {message && <p className={`body2 medium ${styles.toast} ${error ? styles.error : ''}`}>{message}</p>}
    </div>
  )
}
