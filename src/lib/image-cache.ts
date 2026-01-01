/**
 * Notion 이미지 캐싱 유틸리티
 * 
 * Notion API의 파일 URL은 약 1시간 후 만료됩니다.
 * 이 모듈은 빌드 시점에 이미지를 로컬에 다운로드하여 영구 저장합니다.
 */

import { createHash } from 'crypto';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// 캐시된 이미지가 저장될 디렉토리 (프로젝트 루트 기준)
const CACHE_DIR = 'public/images/notion';

// URL에서 파일 확장자 추출
function getExtension(url: string): string {
    try {
        const urlPath = new URL(url).pathname;
        const ext = urlPath.split('.').pop()?.toLowerCase();
        // 지원하는 이미지 확장자
        if (ext && ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif'].includes(ext)) {
            return ext;
        }
    } catch {
        // URL 파싱 실패 시 기본값
    }
    return 'jpg';
}

// URL을 해시하여 고유 파일명 생성
function generateFileName(url: string): string {
    // URL에서 쿼리스트링 제거 (만료 토큰 등 제외)
    const urlWithoutQuery = url.split('?')[0];
    const hash = createHash('md5').update(urlWithoutQuery).digest('hex').slice(0, 12);
    const ext = getExtension(url);
    return `${hash}.${ext}`;
}

/**
 * Notion 이미지를 로컬에 캐시하고 로컬 경로를 반환
 * 
 * @param notionUrl - Notion에서 제공한 이미지 URL
 * @returns 로컬 이미지 경로 (예: /images/notion/abc123.jpg)
 */
export async function cacheImage(notionUrl: string): Promise<string> {
    // 이미 로컬 경로인 경우 그대로 반환
    if (notionUrl.startsWith('/')) {
        return notionUrl;
    }

    const fileName = generateFileName(notionUrl);
    const relativePath = `/images/notion/${fileName}`;
    const absolutePath = join(process.cwd(), CACHE_DIR, fileName);

    // 디렉토리 생성 (없으면)
    const cacheDir = join(process.cwd(), CACHE_DIR);
    if (!existsSync(cacheDir)) {
        mkdirSync(cacheDir, { recursive: true });
    }

    // 이미 캐시된 파일이 있으면 바로 반환
    if (existsSync(absolutePath)) {
        console.log(`[ImageCache] Using cached: ${fileName}`);
        return relativePath;
    }

    // 이미지 다운로드
    try {
        console.log(`[ImageCache] Downloading: ${fileName}`);
        const response = await fetch(notionUrl);

        if (!response.ok) {
            console.error(`[ImageCache] Failed to download: ${response.status}`);
            return notionUrl; // 실패 시 원본 URL 반환
        }

        const buffer = Buffer.from(await response.arrayBuffer());
        writeFileSync(absolutePath, buffer);
        console.log(`[ImageCache] Saved: ${fileName}`);

        return relativePath;
    } catch (error) {
        console.error(`[ImageCache] Error downloading image:`, error);
        return notionUrl; // 에러 시 원본 URL 반환 (graceful fallback)
    }
}
