# Study Blog (Astro + Notion)

Notion을 CMS로 사용하는 Astro 기반 기술 블로그입니다.

## 🚀 Features

- **Notion API 통합**: Projects와 Weekly Reports 데이터베이스 연동
- **동적 콘텐츠 렌더링**: Notion 블록(텍스트, 이미지, 목록, 코드, 테이블 등) → HTML 변환
- **연도별 필터링**: 리스팅 페이지에서 연도별 게시물 필터
- **반응형 디자인**: 미니멀 타이포그래피 중심 UI

## 📦 Tech Stack

- **Framework**: Astro 5.x
- **Styling**: TailwindCSS 4.x + Vanilla CSS
- **CMS**: Notion API (Native fetch)
- **Deployment**: Vercel (예정)

## 🔧 Setup

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경변수 설정
`.env` 파일 생성:
```env
NOTION_API_KEY=secret_xxx
NOTION_DATABASE_ID_PROJECTS=xxx
NOTION_DATABASE_ID_REPORTS=xxx
```

### 3. 개발 서버 실행
```bash
npm run dev
```

## 📝 Notion Database 설정

### Projects DB 필수 속성
| 속성명 | 타입 | 설명 |
|--------|------|------|
| 제목 (Title) | Title | 프로젝트 제목 |
| 게시여부 | Checkbox | 블로그 노출 여부 |
| Slug | Text | URL 경로 (선택) |
| 설명 | Text | 요약 설명 |
| Date/날짜 | Date | 프로젝트 날짜 (선택) |

### Reports DB 필수 속성
| 속성명 | 타입 | 설명 |
|--------|------|------|
| Name | Title | "2025년 12월 5째 주" 형식 |
| 주요 진행 내용 | Text | 주간 진행 사항 |
| 진행 결과 | Text | 결과 요약 |
| 다음 주 계획 | Text | 다음 주 계획 |
| 사용한 툴 및 기술 | Text | 사용 기술 |
| 인사이트 및 회고 | Text | 회고 |

## 🐛 Troubleshooting (Notion API)

### 1. 블록 콘텐츠가 안 보임
**원인**: Notion API는 1단계 블록만 반환. `has_children: true`인 블록(Column, Toggle 등)의 자식은 별도 fetch 필요.

**해결**: `getPageContent()`에서 재귀적으로 children fetch 구현.

```typescript
if (block.has_children) {
    html += await fetchChildrenHtml(block.id);
}
```

### 2. 번호 목록이 1, 1, 1로 표시
**원인**: 각 `numbered_list_item`마다 별도의 `<ol>` 태그 생성.

**해결**: 연속된 목록 항목들을 하나의 `<ol>`로 그룹핑.

```typescript
if (block.type === "numbered_list_item") {
    html += "<ol>";
    while (i < blocks.length && blocks[i].type === "numbered_list_item") {
        html += `<li>${text}</li>`;
        i++;
    }
    html += "</ol>";
}
```

### 3. 파일/임베드 링크 오류 (`attachment://`)
**원인**: Notion 내부 링크(`attachment://`)는 외부에서 접근 불가.

**해결**: URL 스킴 체크 후 사용자에게 안내 메시지 표시.

```typescript
if (fileUrl.startsWith("attachment:")) {
    html += `<div>⚠️ Notion 내부 링크는 블로그에서 열 수 없습니다.</div>`;
}
```

### 4. Notion 봇 권한 오류
**증상**: `Could not find database` 또는 `Unauthorized` 오류.

**해결**:
1. Notion 페이지 우측 상단 "..." → "Connections" → Integration 추가
2. `.env`의 `NOTION_API_KEY`가 올바른지 확인

## 📁 Project Structure

```
/
├── src/
│   ├── layouts/
│   │   └── Layout.astro       # 공통 레이아웃
│   ├── lib/
│   │   └── notion-client.ts   # Notion API 클라이언트
│   ├── pages/
│   │   ├── index.astro        # 메인페이지
│   │   ├── projects/
│   │   │   ├── index.astro    # 프로젝트 목록
│   │   │   └── [slug].astro   # 프로젝트 상세
│   │   └── reports/
│   │       ├── index.astro    # 리포트 목록
│   │       └── [slug].astro   # 리포트 상세
│   └── styles/
│       └── global.css         # 글로벌 스타일
├── .env                       # 환경변수 (git 제외)
└── package.json
```

## 🚀 Deployment

```bash
npm run build
```

Vercel, Netlify 등에서 자동 배포 가능.

## 📄 License

MIT
