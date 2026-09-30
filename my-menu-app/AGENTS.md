## 1. 화면 디자인 규칙

- 결정 요소: 디자인 토큰

### 화면 디자인

**아트보드** **담기는 것**
레이아웃: 헤더(로고·내비), 푸터
메뉴 목록: 카드 그리드, 페이지네이션, 이름 검색, 가격 조건, 카테고리 필터
메뉴 상세: 정보, 수정·삭제 버튼, 삭제 확인
메뉴 폼: 등록·수정 공용, 입력 검증
상태 모음: 빈 상태, 오류, 로딩 스켈레톤

- 색과 간격은 토큰에서만 고른다. 토큰에 없는 값을 새로 만들지 않는다.

### 사용 라이브러리

### 폴더 구조

```
src/
├─ main.jsx, App.jsx     진입점, 라우터(createBrowserRouter)
├─ api/                  서버 통신. axios 인스턴스와 result 꺼내기
├─ lib/                  화면 없는 함수(가격 표기, 카테고리 묶음)
├─ styles/               tokens.css(자동 생성), global.css
├─ components/
│  ├─ layout/            헤더·푸터
│  ├─ ui/                메뉴를 모르는 공용 부품(대화상자, 빈 상태, 알림, 페이지네이션, 버튼·스켈레톤 모양)
│  └─ menu/              메뉴 데이터를 받는 부품(카드, 필터, 품절 도장·버튼)
└─ pages/                주소 하나에 화면 하나
```

- 새 파일은 "메뉴를 아는가"로 나눈다. 메뉴를 모르면 `components/ui/`, 알면 `components/menu/`, 한 화면에서만 쓰면 그 페이지 파일 안에 둔다.
- 컴포넌트와 스타일은 같은 이름으로 나란히 둔다. `MenuCard.jsx` 옆에 `MenuCard.module.css`.
- `styles/tokens.css` 는 손으로 고치지 않는다. `design/montage.tokens.json` 을 고치고 `npm run tokens` 로 다시 만든다.
- 버튼·로딩 막대 모양은 `components/ui/Button.module.css`, `Skeleton.module.css` 를 JSX 에서 import 해 쓴다. 페이지 CSS 에는 배치만 적는다. 다른 CSS 파일에서 `composes ... from` 으로 가져오지 않는다(빌드 경고가 난다).
- 컴포넌트 파일에서는 컴포넌트만 export 한다. 상수·함수를 함께 export 하면 Fast Refresh 가 멈춘다. 그런 것은 `lib/` 에 둔다.

### 상태

### 스타일 규칙

### 옵션(제약사항)

- **메뉴 이름이 중복될 수 있다.** 표에 유일 제약이 없어서 같은 이름이 여러 건 보일 수 있다
- **정렬 API 를 쓰지 않았다.** `/api/menus/pages/sort` 가 있다. 여유가 있으면 붙여 본다

---

### 확인

```bash
npm run lint
npm run build
```

## 2. 서버 통신 규칙

### 2-1. 서버

- 주소는 http://localhost:8080 이다. baseURL 은 api/ 의 axios 인스턴스 한 곳에만 적는다.
- 서버는 5173 만 허용한다. 5174 로 뜨면 요청이 막히므로 5173 으로 다시 띄운다.

### 2-2. 데이터 요청

- 요청 주소는 menuCode · categoryCode 로 조립한다. 서버가 링크를 주지 않는다.
- 페이지 번호는 1부터 센다.

### 2-3. 응답 템플릿

정상 응답일 경우와 오류 응답일 경우의 템플릿 형태가 다르다.

```
{ "httpStatus": 200, "message": "메뉴 목록 조회 성공", "result": { "menus": [] } }
```

```
{ "code": "ERROR_CODE_00001", "description": "메뉴 조회 실패", "detail": "..." }
```

```
- result 안을 api/ 에서 꺼내 반환한다. 컴포넌트가 템플릿을 알지 않게 한다.
- 오류는 code 와 description 으로 판단한다. 오류 응답에는 httpStatus 가 없다.
- 삭제 응답의 httpStatus 는 204 지만 실제 HTTP 상태는 200 이다.
- orderableStatus 는 'Y' 또는 'N' 한 글자다.
```

### 2-5. 명세가 빠뜨린 것

명세를 뽑았다고 끝이 아니다. api-docs.json 을 열어 보면 세 군데가 비어 있다.

```
- CategoryDTO 스키마가 없다.
  필드는 categoryCode, categoryName, refCategoryCode, refCategoryName 이다.
- 최상위 카테고리(식사·음료·디저트)는 ref 두 값이 null 이다.
  메뉴는 하위 카테고리에 속한다.
- ErrorResponse 스키마가 없다. 위 오류 응답 템플릿을 따른다.
```
