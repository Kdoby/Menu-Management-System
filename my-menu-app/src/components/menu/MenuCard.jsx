import { formatPrice } from '../../lib/format.js'
import CategoryArt from './CategoryArt.jsx'
import SoldOutStamp from './SoldOutStamp.jsx'
import skeleton from '../ui/Skeleton.module.css'
import styles from './MenuCard.module.css'

// 위는 상위 카테고리 색 판과 그림, 아래는 이름과 가격.
// 품절이면 색을 빼고 도장을 찍고 가격에 취소선을 긋는다. 품절 표시 버튼은 목록이 카드 위에 겹쳐 둔다.
// justChanged 는 방금 품절로 바꾼 카드라 도장을 찍는 움직임을 보여 준다.
export default function MenuCard({ menu, tone, justChanged = false }) {
  const soldOut = menu.orderableStatus !== 'Y'

  return (
    <article className={`${styles.card} ${soldOut ? styles.soldOut : ''}`} data-tone={soldOut ? 'off' : (tone ?? undefined)}>
      <div className={styles.art}>
        <span className={`label2 bold ${styles.category}`}>{menu.categoryName}</span>
        <CategoryArt tone={tone} size={88} stroke={3} className={styles.glyph} />
        {soldOut && <SoldOutStamp animate={justChanged} className={styles.stamp} />}
      </div>
      <div className={styles.body}>
        <h2 className={`headline1 bold ${styles.name}`}>{menu.menuName}</h2>
        <span className={`heading1 bold num ${styles.price}`}>{formatPrice(menu.menuPrice)}</span>
      </div>
    </article>
  )
}

// 불러오는 동안 카드 자리를 같은 모양으로 채운다.
export function MenuCardSkeleton() {
  return (
    <div className={styles.card} aria-hidden="true">
      <span className={`${skeleton.bone} ${styles.boneArt}`} />
      <div className={styles.body}>
        <span className={`${skeleton.bone} ${styles.boneName}`} />
        <span className={`${skeleton.bone} ${styles.bonePrice}`} />
      </div>
    </div>
  )
}
