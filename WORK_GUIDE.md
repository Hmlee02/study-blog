# 📘 Astro + Notion 기술 블로그 구축 마스터 가이드

본 문서는 UI/UX 디자이너의 관점에서 **Astro**와 **Notion API**를 결합하여, 노션의 미니멀한 감성을 담은 기술 블로그를 구축하기 위한 전체 로드맵입니다.

---

## 1. 프로젝트 개요 및 기술 스택
HTML/CSS 지식을 기반으로 가장 빠르고 아름다운 블로그를 만드는 것을 목표로 합니다.

* **Framework:** Astro (HTML 중심의 정적 사이트 생성기)
* **CMS:** Notion API (콘텐츠 관리 및 데이터베이스)
* **Styling:** Tailwind CSS (유틸리티 기반 스타일링)
* **UI Library:** shadcn/ui (미니멀한 컴포넌트 라이브러리)
* **Rendering:** @notionhq/client, notion-to-md (데이터 변환)

---

## 2. 노션 데이터베이스(DB) 선행 작업 가이드
이미지 분석 결과에 따른 최적의 DB 구조 제안입니다.

### 2.1. 결과물(Design Made with AI) 갤러리 정비
기존 갤러리 뷰를 유지하되, 각 페이지 상단에 다음 **속성(Property)**을 추가하세요.
* **Slug (Text):** URL 주소용 (예: `visit-seoul`, `design-kit`)
* **Published (Checkbox):** 체크된 글만 블로그에 노출
* **Date (Date):** 게시글 정렬 및 발행일 표시용
* **Summary (Text):** 카드 UI에서 보여줄 짧은 요약문

### 2.2. 주간 리포트(Weekly Report)의 데이터베이스화
현재 텍스트/토글 방식에서 **'리스트' 또는 '표' 보기 데이터베이스**로 변경을 권장합니다.
* **제목:** `2025년 6월 넷째 주` 형식으로 페이지 생성
* **본문:** 기존 토글 내부 내용(진행 내용, 결과 등)을 해당 페이지 본문에 작성
* **효과:** Astro가 전체 리포트 목록을 자동으로 수집할 수 있습니다.

### 2.3. 페이지 계층 구조 관리
* `Database(최상위 페이지)` > `A/B 페이지` > `원본 테이블들` 구조를 유지하세요.
* **ID 기반 접근:** 노션 API는 경로가 아닌 고유 Database ID로 접근하므로 위치는 자유롭습니다.
* **권한 설정:** 최상위 페이지에서 API 연결(Connection)을 추가하면 하위 모든 테이블에 자동으로 권한이 상속됩니다.

---

## 3. 환경 설정 및 설치 프로세스

### 3.1. 프로젝트 초기화
```bash
# 1. Astro 프로젝트 생성
npm create astro@latest my-tech-blog

# 2. shadcn/ui 사용을 위한 React 및 Tailwind 통합
npx astro add react
npx astro add tailwind

# 3. shadcn/ui 초기 설정 (Style: New York, Base Color: Gray 권장)
npx shadcn-ui@latest init

# 4. 필수 라이브러리 설치
npm install @notionhq/client notion-to-md

### 3.2. 환경 변수 (.env) 설정
* 코드 스니펫
NOTION_API_KEY=your_secret_key_here
NOTION_DATABASE_ID_PROJECTS=your_projects_db_id
NOTION_DATABASE_ID_REPORTS=your_reports_db_id

---

## 4. 디자인 가이드 (Notion-like Minimalism)
* shadcn/ui를 활용하여 노션의 정갈한 느낌을 구현하는 지침입니다.

### 4.1. 타이포그래피 및 레이아웃
* **Font:** 시스템 기본 산세리프(ui-sans-serif)를 사용합니다.
* **Width:** 메인 너비를 max-w-4xl로 제한하여 가독성을 높입니다.
* **Background:** 부드러운 미색(#fbfcfa) 배경을 추천합니다.

### 4.2. shadcn/ui 컴포넌트 커스텀
* **Borders:** 연한 회색 실선(border-gray-200)을 사용합니다.
* **Shadows:** 그림자는 배제하거나 가장 약한 shadow-sm만 적용합니다.
* **Interactions:** 호버 시 미묘한 배경색 변화(hover:bg-gray-50)만 줍니다.

---

## 5. 에이전트 구축 워크플로우
* **데이터 소스 연결:** Notion SDK로 빌드 시점에 데이터를 가져옵니다.
* **레이아웃 설계:** src/layouts/Layout.astro에 공통 구조를 만듭니다.
* **목록 페이지:** index.astro에서 프로젝트와 리포트 목록을 렌더링합니다.
* **상세 페이지:** [slug].astro에서 본문을 마크다운으로 변환 후 출력합니다.
* **배포:** Vercel 연동 및 노션 업데이트 시 자동 빌드 웹훅을 설정합니다.