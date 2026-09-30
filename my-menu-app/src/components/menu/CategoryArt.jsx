// 상위 카테고리를 나타내는 선 그림. 메뉴 사진 자리를 대신한다. 색은 부모의 --tone-ink 를 따른다.
// 크기를 키워도 선 굵기는 stroke(px) 그대로 둔다.
const PATHS = {
  meal: (
    <>
      <path d="M3 12h18a9 9 0 0 1-18 0Z" />
      <path d="M8 21h8" />
      <path d="M9 3.5c-1 1.2 1 2.3 0 3.5M15 3.5c-1 1.2 1 2.3 0 3.5M12 2.5c-1 1.2 1 2.3 0 3.5" />
    </>
  ),
  drink: (
    <>
      <path d="M5.5 8h13l-1.6 13H7.1Z" />
      <path d="M4.5 8h15" />
      <path d="m12.5 8 2-5.5H18" />
      <path d="M6.6 13h10.8" />
    </>
  ),
  dessert: (
    <>
      <path d="M4 21h16v-8H4Z" />
      <path d="M4 16.5c2.7 1.4 5.3-1.4 8 0s5.3-1.4 8 0" />
      <path d="M12 13V9.5" />
      <path d="M12 4.5c.9.9.9 2 0 2.8-.9-.8-.9-1.9 0-2.8Z" />
    </>
  ),
  plain: (
    <>
      <path d="M4 3v7a3 3 0 0 0 6 0V3" />
      <path d="M7 3v18" />
      <path d="M17 21V3c-2 1-3 4-3 7s1 4 3 4" />
    </>
  ),
}

export default function CategoryArt({ tone, size = 48, stroke = 2, className }) {
  return (
    <svg
      className={`categoryArt ${className ?? ''}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[tone] ?? PATHS.plain}
    </svg>
  )
}
