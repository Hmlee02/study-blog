# Notion API 트러블슈팅 가이드

이 문서는 Astro + Notion 블로그 개발 과정에서 발생한 문제들과 해결 방법을 정리합니다.

---

## 1. 블록 콘텐츠가 렌더링되지 않음

### 증상
- 프로젝트 상세 페이지에서 일부 텍스트, 이미지가 보이지 않음
- Notion에서는 보이지만 블로그에서는 누락됨

### 원인
Notion API의 `/blocks/{block_id}/children` 엔드포인트는 **1단계 블록만 반환**합니다.

만약 블록이 `has_children: true` 속성을 가지고 있다면 (예: Column, Toggle, Callout 등), 해당 블록의 자식 콘텐츠는 **별도의 API 호출**로 가져와야 합니다.

### 해결
재귀적으로 자식 블록을 fetch하는 함수 구현:

```typescript
// 블록에 자식이 있으면 재귀적으로 가져오기
async function fetchChildrenHtml(blockId: string): Promise<string> {
    const response = await fetchNotion(`/blocks/${blockId}/children`, "GET");
    if (response.results && response.results.length > 0) {
        return await blocksToHtml(response.results);
    }
    return "";
}

// 각 블록 처리 시 has_children 체크
if (block.has_children) {
    html += await fetchChildrenHtml(block.id);
}
```

### 영향받는 블록 타입
- `column_list` / `column`
- `toggle`
- `callout`
- `synced_block`
- 중첩된 `bulleted_list_item` / `numbered_list_item`

---

## 2. 번호 목록이 1, 1, 1로 표시됨

### 증상
```
1. 첫 번째 항목
1. 두 번째 항목
1. 세 번째 항목
```
번호가 증가하지 않고 모두 1로 시작함.

### 원인
기존 코드에서 각 `numbered_list_item`마다 별도의 `<ol>` 태그를 생성:

```typescript
// 잘못된 코드
case "numbered_list_item":
    html += `<ol><li>${text}</li></ol>`; // 각각 독립된 <ol>
    break;
```

HTML에서 `<ol>` 태그는 시작할 때마다 번호가 1부터 다시 시작합니다.

### 해결
연속된 목록 항목들을 하나의 `<ol>` 태그로 그룹핑:

```typescript
// 올바른 코드
if (block.type === "numbered_list_item") {
    html += "<ol>";
    while (i < blocks.length && blocks[i].type === "numbered_list_item") {
        const text = blocks[i].numbered_list_item.rich_text.map(t => t.plain_text).join("");
        html += `<li>${text}</li>`;
        i++;
    }
    html += "</ol>";
    continue;
}
```

동일한 로직이 `bulleted_list_item`에도 적용됩니다.

---

## 3. 파일/임베드 링크 오류 (attachment://)

### 증상
- 파일 블록이나 임베드 블록에서 링크가 작동하지 않음
- 브라우저 콘솔에 `attachment://` 관련 오류

### 원인
Notion 내부에서 드래그 앤 드롭으로 첨부한 파일은 `attachment://` 스킴을 사용합니다.
이 링크는 **Notion 앱 내부에서만 유효**하며, 외부(API, 웹)에서는 접근할 수 없습니다.

### 해결
1. URL 스킴 체크 후 사용자에게 안내 메시지 표시:

```typescript
if (fileUrl.startsWith("attachment:")) {
    html += `<div class="warning">
        ⚠️ Notion 내부 링크(attachment://)는 블로그에서 열 수 없습니다.
        Notion에서 '/file' 명령어로 파일을 직접 업로드해주세요.
    </div>`;
} else {
    // 정상 처리
}
```

2. **Notion에서의 올바른 파일 첨부 방법**:
   - `/file` 또는 `/pdf` 명령어 사용
   - 파일을 직접 업로드 (드래그 앤 드롭 X)
   - 외부 URL 사용 (Google Drive, S3 등)

---

## 4. Notion 봇 권한 오류

### 증상
```
Error: Could not find database with ID: xxx
```
또는
```
Error: Unauthorized
```

### 원인
Notion API Integration(봇)이 해당 데이터베이스에 **접근 권한이 없음**.

### 해결
1. Notion 페이지/데이터베이스 열기
2. 우측 상단 `...` 메뉴 클릭
3. `Connections` (또는 `연결`) 클릭
4. 생성한 Integration 추가

![Integration 추가](https://www.notion.so/images/integrations/connection-dropdown.png)

### 확인 방법
```bash
curl -X POST 'https://api.notion.com/v1/databases/{database_id}/query' \
  -H 'Authorization: Bearer secret_xxx' \
  -H 'Notion-Version: 2022-06-28'
```

---

## 5. 환경변수 미설정

### 증상
- 개발 환경에서는 작동하지만 Vercel 배포 후 데이터가 안 보임
- 빈 페이지 또는 오류 메시지

### 원인
`.env` 파일은 `.gitignore`에 포함되어 있어 Git에 푸시되지 않습니다.
Vercel에서 별도로 환경변수를 설정해야 합니다.

### 해결
1. [Vercel 프로젝트 설정](https://vercel.com) → Settings → Environment Variables
2. 환경변수 추가:
   - `NOTION_API_KEY`
   - `NOTION_DATABASE_ID_PROJECTS`
   - `NOTION_DATABASE_ID_REPORTS`
3. **Redeploy** 실행

---

## 6. 마크다운 파일 fetch 실패

### 증상
Notion에 첨부된 `.md` 파일 내용이 블로그에서 보이지 않음.

### 원인
1. 파일 URL이 `attachment://` 스킴인 경우 (3번 참조)
2. Notion 파일 URL은 **시간 제한**이 있어 만료될 수 있음

### 해결
서버 사이드에서 빌드 시점에 파일 fetch:

```typescript
if (fileName.endsWith(".md")) {
    try {
        const response = await fetch(fileUrl);
        if (response.ok) {
            const content = await response.text();
            html += `<pre>${escapeHtml(content)}</pre>`;
        }
    } catch (e) {
        html += `<p>⚠️ 파일을 불러올 수 없습니다.</p>`;
    }
}
```


⚠️ **주의**: Notion 파일 URL은 약 1시간 후 만료됩니다. 이 프로젝트에서는 **이미지 캐싱**을 통해 해결했습니다. 자세한 내용은 7번 섹션을 참조하세요.

---

## 7. 이미지 URL 만료 ✅ 해결됨

### 증상
- Notion에서 업로드한 이미지가 빌드 후 시간이 지나면 깨짐
- 브라우저 개발자 도구에서 이미지 요청이 403 또는 404 에러

### 원인
Notion API에서 반환하는 `file` 타입 URL은 **약 1시간 후 만료**됩니다. 정적 사이트 빌드 후 시간이 지나면 이미지 링크가 더 이상 작동하지 않습니다.

### 해결
**빌드 시점에 이미지를 로컬에 다운로드하여 영구 저장**

1. 이미지 캐싱 유틸리티 생성 (`src/lib/image-cache.ts`):

```typescript
import { createHash } from 'crypto';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const CACHE_DIR = 'public/images/notion';

export async function cacheImage(notionUrl: string): Promise<string> {
    // URL 해시로 고유 파일명 생성
    const hash = createHash('md5').update(notionUrl.split('?')[0]).digest('hex').slice(0, 12);
    const fileName = `${hash}.jpg`;
    const localPath = `/images/notion/${fileName}`;
    const absolutePath = join(process.cwd(), CACHE_DIR, fileName);

    // 이미 캐시된 경우 바로 반환
    if (existsSync(absolutePath)) return localPath;

    // 이미지 다운로드 및 저장
    const response = await fetch(notionUrl);
    const buffer = Buffer.from(await response.arrayBuffer());
    writeFileSync(absolutePath, buffer);
    
    return localPath;
}
```

2. `notion-client.ts`에서 이미지 블록 처리 시 적용:

```typescript
case "image":
    let imgUrl = block.image.type === "external" 
        ? block.image.external.url 
        : block.image.file.url;
    
    // Notion file URL 캐싱 (만료 방지)
    if (block.image.type === "file") {
        imgUrl = await cacheImage(imgUrl);
    }
    
    html += `<img src="${imgUrl}" />`;
    break;
```

### 결과
- 빌드 시 이미지가 `public/images/notion/`에 자동 저장됨
- 배포 후에도 이미지가 영구적으로 작동
- 외부 스토리지(S3, Cloudinary 등) 불필요

### 주의사항
- Notion에서 이미지 변경 시 **재빌드 필요**
- 외부 URL 이미지(`external` 타입)는 이미 영구적이므로 캐싱 제외

---

## 참고 자료

- [Notion API 공식 문서](https://developers.notion.com/docs)
- [Block Object Reference](https://developers.notion.com/reference/block)
- [Astro 공식 문서](https://docs.astro.build)
