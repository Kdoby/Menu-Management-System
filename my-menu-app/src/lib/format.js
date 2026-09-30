// 화면 표기용 함수. 컴포넌트 파일에 함께 두면 Fast Refresh 가 동작하지 않아 따로 둔다.

export const formatPrice = (won) => `${Number(won).toLocaleString('ko-KR')}원`
