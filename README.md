# 메뉴 관리 앱 (menu-test)

식당 메뉴를 조회·등록·수정·삭제하는 웹 앱입니다.
Spring Boot 로 만든 REST API 서버에 React 화면을 붙였고, 화면의 색·간격·글꼴은 Wanted 디자인 시스템(Montage)의 토큰에서만 가져옵니다.

| 폴더 | 역할 | 주요 기술 |
|---|---|---|
| [`chap06-spring-data-jpa/`](chap06-spring-data-jpa) | 백엔드 REST API 서버 | Java 17, Spring Boot 4.1, Spring Data JPA, MySQL, springdoc(Swagger) |
| [`my-menu-app/`](my-menu-app) | 프론트엔드 화면 | React 19, Vite 8, React Router 8, axios, CSS Modules |
| [`montage-web-main/`](montage-web-main) | 디자인 시스템 원본(참고용) | Wanted Montage. 여기서 뽑은 토큰을 프론트가 사용 |
| [`api-docs.json`](api-docs.json) | API 명세(OpenAPI) | 서버의 `/v3/api-docs` 를 저장한 것 |

---

## 아키텍처

```
 ┌──────────────── 브라우저 (localhost:5173) ────────────────┐
 │  my-menu-app (React + Vite)                              │
 │                                                          │
 │  pages/ ──▶ components/ (menu · ui · layout)              │
 │    │                                                     │
 │    └──▶ api/  axios 인스턴스 1개. 응답 템플릿에서 result 만 꺼냄 │
 └────┼─────────────────────────────────────────────────────┘
      │ HTTP/JSON  (CORS: 5173 만 허용)
 ┌────▼──────── chap06-spring-data-jpa (localhost:8080) ─────┐
 │  Controller ──▶ Service ──▶ Repository(JPA) ──▶ Entity    │
 │  ExceptionController: 오류를 { code, description, detail } 로 │
 └────┼─────────────────────────────────────────────────────┘
      │ JDBC
 ┌────▼────────────┐
 │ MySQL  menudb   │  tbl_category(2단계: 상위·하위), tbl_menu
 └─────────────────┘

 montage-web-main ──(토큰 추출)──▶ my-menu-app/design/montage.tokens.json
                                   └─ npm run tokens ─▶ src/styles/tokens.css
```

### 응답 형식

정상 응답과 오류 응답의 모양이 다릅니다. 프론트의 `api/` 가 이 차이를 흡수하므로 컴포넌트는 템플릿을 알지 못합니다.

```jsonc
// 정상
{ "httpStatus": 200, "message": "메뉴 목록 조회 성공", "result": { "menus": [] } }
// 오류 (httpStatus 없음)
{ "code": "ERROR_CODE_00001", "description": "메뉴 조회 실패", "detail": "..." }
```

---

## 실행 방법

### 준비물

- JDK 17
- MySQL 8.x
- Node.js 20.19 이상(Vite 8 요구 사항), npm

### 1) 데이터베이스

MySQL 에 root 로 접속해 아래 두 스크립트를 차례로 실행합니다.

1. [`sql/00_01_CREATE_USER_DATABASE.sql`](chap06-spring-data-jpa/sql/00_01_CREATE_USER_DATABASE.sql): `ohgiraffers` 계정(비밀번호 `ohgiraffers`)과 `menudb` 를 만듭니다.
2. [`sql/00_02_DB_SCRIPT.sql`](chap06-spring-data-jpa/sql/00_02_DB_SCRIPT.sql): `ohgiraffers` 계정으로 실행합니다. 테이블을 만들고 카테고리 12개와 메뉴 36개를 넣습니다.

### 2) 백엔드 (포트 8080)

```bash
cd chap06-spring-data-jpa
./gradlew bootRun        # Windows: gradlew.bat bootRun
```

- Swagger UI: http://localhost:8080/swagger-ui.html
- OpenAPI JSON: http://localhost:8080/v3/api-docs
- 접속 정보는 [`application.yaml`](chap06-spring-data-jpa/src/main/resources/application.yaml)에 있습니다.

### 3) 프론트엔드 (포트 5173)

```bash
cd my-menu-app
npm install
npm run dev              # http://localhost:5173
```

> 서버는 `http://localhost:5173` 에서 오는 요청만 허용합니다. Vite 가 5174 로 뜨면 요청이 막히므로, 5173 을 쓰는 다른 프로세스를 끄고 다시 띄우세요.

그 밖의 스크립트:

| 명령 | 설명 |
|---|---|
| `npm run build` | 배포용 빌드 (`dist/`) |
| `npm run lint` | ESLint 검사 |
| `npm run tokens` | `design/montage.tokens.json` 을 `src/styles/tokens.css` 로 다시 생성 |

---

## API

| 메서드 | 주소 | 설명 |
|---|---|---|
| GET | `/api/menus` | 전체 메뉴 |
| GET | `/api/menus/pages?page=&size=` | 페이징 조회 (page 는 1부터) |
| GET | `/api/menus/pages/sort?page=&size=&sortBy=&direction=` | 페이징 + 정렬 |
| GET | `/api/menus/search?menuPrice=` | 지정 가격을 **초과**하는 메뉴 |
| GET | `/api/menus/{menuCode}` | 메뉴 상세 |
| POST | `/api/menus` | 메뉴 등록 |
| PUT | `/api/menus/{menuCode}` | 메뉴 수정 |
| DELETE | `/api/menus/{menuCode}` | 메뉴 삭제 (본문의 httpStatus 는 204, 실제 HTTP 상태는 200) |
| GET | `/api/categories` | 전체 카테고리 |
| GET | `/api/categories/{categoryCode}` | 카테고리 상세 |

- 카테고리는 두 단계입니다. 최상위(식사·음료·디저트)는 `refCategoryCode` 가 `null` 이고, 메뉴는 하위 카테고리에 속합니다.
- `orderableStatus` 는 `'Y'`(판매 중) 또는 `'N'`(품절)입니다.

---

## 기능

### 기본 기능

| 화면 | 주소 | 내용 |
|---|---|---|
| 메뉴 목록 | `/menus` | 카드 그리드, 페이지네이션, 이름 검색, 가격 조건, 카테고리 필터 |
| 메뉴 상세 | `/menus/:menuCode` | 메뉴 정보, 수정·삭제 버튼, 삭제 확인 대화상자 |
| 메뉴 등록·수정 | `/menus/new`, `/menus/:menuCode/edit` | 등록과 수정이 같은 폼을 쓰고, 칸마다 입력을 검증 |
| 상태 화면 | 모든 목록·상세 | 빈 상태, 오류(다시 시도), 로딩 스켈레톤 |

### 추가 기능

- **홈 화면(`/`)**: 식사·음료·디저트별 판에서 하위 카테고리와 메뉴 수를 보여 주고, 누르면 그 카테고리로 걸러진 목록으로 갑니다. 품절 메뉴를 모아 보여 주고, 그 자리에서 판매를 재개할 수 있습니다.
- **품절 표시·판매 재개**: 목록 카드와 상세에서 바로 전환합니다. 품절 카드는 색을 빼고 도장을 찍고 가격에 취소선을 긋습니다. 목록 전체를 다시 받지 않고 바뀐 카드만 교체합니다.
- **조건 검색 확장**: 가격을 범위(최소 이상·최대 이하)로 지정하고, 판매 상태(전체·판매 중·품절)로 거를 수 있습니다. 카테고리는 상위 탭과 하위 칩의 두 단계로 고릅니다.
- **정렬**: 최신순, 가격 낮은순·높은순, 이름순을 제공합니다.
- **URL 에 조건 보존**: 검색어·카테고리·가격·상태·정렬·페이지를 모두 주소(`?q=&category=&minPrice=&maxPrice=&status=&sort=&page=`)에 담습니다. 새로고침하거나 링크를 공유해도 같은 화면이 나오고, 상세에서 목록으로 돌아오면 보던 조건과 페이지가 유지됩니다.
- **메뉴 복제**: 상세의 "복제"를 누르면 그 메뉴의 값이 채워진 등록 폼이 열립니다.
- **이름 중복 안내**: 띄어쓰기와 대소문자를 무시하고 같은 이름의 메뉴가 있으면 알려 줍니다. 서버에 유일 제약이 없으므로 저장은 막지 않습니다.
- **폼 이탈 확인**: 저장하지 않은 내용이 있을 때 다른 화면으로 이동하거나 탭을 닫으면 한 번 더 묻습니다.
- **알림(토스트)**: 품절 표시·판매 재개의 성공과 실패를 화면 아래에 3초간 띄웁니다.
- **접근성**: 삭제 확인은 `<dialog>` 로 포커스를 가두고 Esc 로 닫힙니다. 오류 안내는 `role="alert"` 로 바로 읽힙니다.
- **디자인 토큰**: Montage 토큰을 CSS 변수로 변환해 쓰며, 토큰에 없는 색·간격은 만들지 않습니다.

> 서버에는 이름·카테고리 검색 API가 없어서, 검색 조건이 있을 때는 전체 목록을 받아 브라우저에서 거르고 정렬·페이지 나누기를 합니다. 조건이 없을 때만 서버 페이징(`/pages/sort`)을 씁니다.

---

## 파일 구조

```
menu-test/
├─ api-docs.json                        API 명세(OpenAPI)
├─ chap06-spring-data-jpa/              백엔드
│  ├─ sql/                              계정·DB 생성, 테이블·샘플 데이터
│  └─ src/main/
│     ├─ resources/application.yaml     DB 접속, 페이지 번호 1부터(one-indexed)
│     └─ java/com/ohgiraffers/springdatajpa/
│        ├─ controller/                 MenuController, CategoryController
│        ├─ service/                    MenuService, CategoryService
│        ├─ repository/                 JpaRepository
│        ├─ entity/  dto/               Menu·Category 엔티티와 DTO
│        ├─ common/                     ResponseMessage(정상), ErrorResponse(오류)
│        ├─ exception/                  예외와 전역 예외 처리
│        └─ config/                     CORS(5173 허용), Swagger
├─ my-menu-app/                         프론트엔드
│  ├─ design/montage.tokens.json        디자인 토큰 원본
│  ├─ scripts/build-tokens.mjs          토큰 → tokens.css 변환
│  └─ src/
│     ├─ main.jsx, App.jsx              진입점, 라우터(createBrowserRouter)
│     ├─ api/                           axios 인스턴스(client), menu·category 요청
│     ├─ lib/                           화면 없는 함수(가격 표기, 카테고리 묶음)
│     ├─ styles/                        tokens.css(자동 생성), global.css
│     ├─ components/
│     │  ├─ layout/                     헤더·푸터
│     │  ├─ ui/                         대화상자, 빈 상태, 알림, 페이지네이션, 버튼·스켈레톤
│     │  └─ menu/                       카드, 필터, 정렬, 판매 상태, 품절 도장·버튼
│     └─ pages/                         Home, MenuList, MenuDetail, MenuForm
└─ montage-web-main/                    Wanted Montage 디자인 시스템(참고용)
```

프론트엔드의 작업 규칙(파일 배치, 스타일, 서버 통신)은 [`my-menu-app/AGENTS.md`](my-menu-app/AGENTS.md)에 정리되어 있습니다.
