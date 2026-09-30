import styles from './SoldOutStamp.module.css'

// 차림표에 붙이는 품절 도장. animate 면 방금 찍힌 것처럼 한 번 내려찍는다.
export default function SoldOutStamp({ size = 'small', animate = false, className }) {
  return (
    <span className={`${size === 'small' ? 'label1' : 'heading2'} bold ${styles.stamp} ${styles[size]} ${animate ? styles.animate : ''} ${className ?? ''}`}>
      품절
    </span>
  )
}
