# Notion API 연동 가이드

이 문서는 Astro 프로젝트에서 Notion을 CMS로 사용하기 위한 연동 방법을 설명합니다.

---

## 1. Notion Integration 생성

### Step 1: Integration 생성
1. [Notion Developers](https://www.notion.so/my-integrations) 접속
2. `+ New integration` 클릭
3. 이름 입력 (예: `Study Blog`)
4. 워크스페이스 선택
5. `Submit` 클릭

### Step 2: API Key 복사
- 생성된 Integration의 `Internal Integration Secret` 복사
- `secret_` 또는 `ntn_`으로 시작하는 키

---

## 2. 데이터베이스 설정

### Step 1: 데이터베이스 생성
Notion에서 새 데이터베이스 생성 (Inline 또는 Full Page)

### Step 2: Integration 연결
1. 데이터베이스 페이지 열기
2. 우측 상단 `...` → `Connections` → Integration 추가
3. 생성한 Integration 선택

### Step 3: 데이터베이스 ID 확인
URL에서 데이터베이스 ID 추출:
```
https://www.notion.so/workspace/1234567890abcdef1234567890abcdef?v=...
                              └─────────── Database ID ───────────┘
```

---

## 3. 환경변수 설정

### 로컬 개발 환경
프로젝트 루트에 `.env` 파일 생성:

```env
# Notion API
NOTION_API_KEY=secret_xxxxxxxxxxxxxxxxxxxxxxx

# Database IDs
NOTION_DATABASE_ID_PROJECTS=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NOTION_DATABASE_ID_REPORTS=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Vercel 배포 환경
1. Vercel 프로젝트 → Settings → Environment Variables
2. 위 변수들을 동일하게 추가
3. Redeploy 실행

---

## 4. API 클라이언트 구현

### 기본 구조

```typescript
// src/lib/notion-client.ts

const NOTION_API_KEY = import.meta.env.NOTION_API_KEY;
const NOTION_VERSION = "2022-06-28";

// Fetch Helper
async function fetchNotion(endpoint: string, method = "GET", body?: any) {
    const response = await fetch(`https://api.notion.com/v1${endpoint}`, {
        method,
        headers: {
            "Authorization": `Bearer ${NOTION_API_KEY}`,
            "Notion-Version": NOTION_VERSION,
            "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
        throw new Error(`Notion API Error: ${response.status}`);
    }

    return response.json();
}
```

### 데이터베이스 쿼리

```typescript
export async function getProjects() {
    const databaseId = import.meta.env.NOTION_DATABASE_ID_PROJECTS;
    
    const response = await fetchNotion(`/databases/${databaseId}/query`, "POST", {
        filter: {
            property: "게시여부",
            checkbox: { equals: true },
        },
        sorts: [
            { timestamp: "created_time", direction: "descending" },
        ],
    });

    return response.results.map(page => ({
        id: page.id,
        title: page.properties.제목?.title[0]?.plain_text || "",
        // ... 기타 속성 매핑
    }));
}
```

### 페이지 콘텐츠 가져오기

```typescript
export async function getPageContent(pageId: string) {
    const response = await fetchNotion(`/blocks/${pageId}/children`);
    
    // 블록 → HTML 변환
    return blocksToHtml(response.results);
}
```

---

## 5. 속성 타입별 데이터 추출

### Title
```typescript
page.properties.Name?.title[0]?.plain_text || ""
```

### Rich Text
```typescript
page.properties.설명?.rich_text[0]?.plain_text || ""
```

### Date
```typescript
page.properties.Date?.date?.start || ""
```

### Checkbox
```typescript
page.properties.게시여부?.checkbox || false
```

### Select
```typescript
page.properties.Category?.select?.name || ""
```

### Multi-select
```typescript
page.properties.Tags?.multi_select.map(t => t.name) || []
```

### URL
```typescript
page.properties.Link?.url || ""
```

---

## 6. 블록 타입별 렌더링

### 지원 블록 타입

| 블록 타입 | 설명 | HTML 변환 |
|-----------|------|-----------|
| `paragraph` | 문단 | `<p>` |
| `heading_1` | 제목 1 | `<h1>` |
| `heading_2` | 제목 2 | `<h2>` |
| `heading_3` | 제목 3 | `<h3>` |
| `bulleted_list_item` | 점 목록 | `<ul><li>` |
| `numbered_list_item` | 번호 목록 | `<ol><li>` |
| `image` | 이미지 | `<figure><img>` |
| `code` | 코드 블록 | `<pre><code>` |
| `quote` | 인용 | `<blockquote>` |
| `divider` | 구분선 | `<hr>` |
| `callout` | 콜아웃 | `<div>` (styled) |
| `toggle` | 토글 | `<details><summary>` |
| `table` | 테이블 | `<table>` |
| `file` | 파일 | `<a>` (다운로드 링크) |
| `bookmark` | 북마크 | `<a>` |
| `embed` | 임베드 | `<iframe>` |
| `video` | 비디오 | `<a>` 또는 `<video>` |

### 중첩 블록 처리
`column_list`, `toggle`, `callout` 등은 `has_children: true` 속성을 가지며,
자식 블록을 별도로 fetch해야 합니다.

---

## 7. 커스텀 도메인 및 SEO

### Astro에서 메타 태그 설정

```astro
---
// src/layouts/Layout.astro
const { title, description } = Astro.props;
---
<html>
<head>
    <title>{title}</title>
    <meta name="description" content={description} />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
</head>
<body>
    <slot />
</body>
</html>
```

---

## 8. 캐싱 전략

### SSG (Static Site Generation)
- `npm run build` 시 모든 페이지가 정적 HTML로 빌드됨
- Notion 데이터가 변경되면 **재빌드 필요**

### ISR (Incremental Static Regeneration)
Vercel에서 ISR 활성화:
```javascript
// astro.config.mjs
export default defineConfig({
    output: 'hybrid', // 또는 'server'
});
```

### Webhook으로 자동 재빌드
1. Notion Automation 또는 Zapier 설정
2. Vercel Deploy Hook URL로 POST 요청

---

## 참고 링크

- [Notion API 공식 문서](https://developers.notion.com/docs)
- [Notion API Reference](https://developers.notion.com/reference)
- [Astro 공식 문서](https://docs.astro.build)
- [Vercel 배포 가이드](https://vercel.com/docs)
