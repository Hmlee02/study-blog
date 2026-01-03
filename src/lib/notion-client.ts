
import { cacheImage } from './image-cache';

const NOTION_API_KEY = import.meta.env.NOTION_API_KEY;
const NOTION_VERSION = "2022-06-28";

// Types for Notion properties
export interface ProjectProperties {
    id: string;
    title: string;
    slug: string;
    summary: string;
    date: string;
    published: boolean;
    cover?: string;
    _raw?: any;
}

export interface ReportProperties {
    id: string;
    title: string;
    slug: string;
    date: string;
    published: boolean;
    // Extended properties
    progress: string;
    results: string;
    plan: string;
    tools: string;
    insight: string;
    _raw?: any;
}

export interface WorkProperties {
    id: string;
    title: string;
    slug: string;
    thumbnail?: string;  // GIF/이미지 파일 URL (캐시됨)
    description: string;
    memo?: string;       // 메모 필드
    category?: string;
    tags?: string[];     // 태그 필드 (Multi-select)
    tool?: string[];     // 툴 필드 (Multi-select)
    font?: string[];     // 폰트 필드 (Multi-select)
    published: boolean;
    _raw?: any;
}

// Fetch helper
async function fetchNotion(endpoint: string, method: string = "GET", body?: any) {
    const headers = {
        "Authorization": `Bearer ${NOTION_API_KEY}`,
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json",
    };

    const response = await fetch(`https://api.notion.com/v1${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Notion API Error: ${response.status} ${response.statusText} - ${errorBody}`);
    }

    return response.json();
}

// Convert rich_text block to HTML with annotations (bold, italic, etc.)
function richTextToHtml(richTextArray: any[]): string {
    if (!richTextArray || !Array.isArray(richTextArray)) return "";

    // 먼저 모든 텍스트를 합침
    let fullText = richTextArray.map((t: any) => {
        let text = t.plain_text || "";
        const annotations = t.annotations;

        // HTML 이스케이프 (먼저 처리)
        text = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

        if (!annotations) return text;

        // 서식 적용
        if (annotations.code) {
            text = `<code>${text}</code>`;
        }
        if (annotations.bold) {
            text = `<strong>${text}</strong>`;
        }
        if (annotations.italic) {
            text = `<em>${text}</em>`;
        }
        if (annotations.strikethrough) {
            text = `<s>${text}</s>`;
        }
        if (annotations.underline) {
            text = `<u>${text}</u>`;
        }

        // 링크 처리
        if (t.href) {
            text = `<a href="${t.href}" target="_blank">${text}</a>`;
        }

        return text;
    }).join("");

    // 줄바꿈이 있으면 리스트로 변환
    if (fullText.includes("\n")) {
        const lines = fullText.split("\n").filter(line => line.trim() !== "");
        if (lines.length > 1) {
            // 여러 줄이면 불렛 리스트로 변환
            return `<ul class="rich-text-list">${lines.map(line => `<li>${line.trim()}</li>`).join("")}</ul>`;
        }
    }

    return fullText;
}

// Simple Markdown to HTML parser for attached files
function parseMarkdownToHtml(markdown: string): string {
    // Escape HTML first
    let html = markdown
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    // Code blocks (```...```) - 먼저 처리
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
        return `<pre class="md-code-block"><code>${code.trim()}</code></pre>`;
    });

    // Inline code (`...`)
    html = html.replace(/`([^`]+)`/g, '<code class="md-inline-code">$1</code>');

    // Headers (### -> h3, ## -> h2, # -> h1)
    html = html.replace(/^### (.+)$/gm, '<h4 class="md-h4">$1</h4>');
    html = html.replace(/^## (.+)$/gm, '<h3 class="md-h3">$1</h3>');
    html = html.replace(/^# (.+)$/gm, '<h2 class="md-h2">$1</h2>');

    // Bold (**text** or __text__)
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');

    // Italic (*text* or _text_) - 볼드 처리 후에 진행
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    html = html.replace(/_([^_]+)_/g, '<em>$1</em>');

    // Horizontal rule (--- or ***)
    html = html.replace(/^(-{3,}|\*{3,})$/gm, '<hr class="md-hr"/>');

    // Unordered lists (- item or * item)
    html = html.replace(/^[\-\*] (.+)$/gm, '<li class="md-li">$1</li>');
    // Wrap consecutive li elements in ul
    html = html.replace(/(<li class="md-li">[\s\S]*?<\/li>)(\s*<li class="md-li">)/g, '$1$2');
    html = html.replace(/(<li class="md-li">.*<\/li>)/gs, (match) => {
        if (!match.startsWith('<ul')) {
            return `<ul class="md-ul">${match}</ul>`;
        }
        return match;
    });

    // Ordered lists (1. item)
    html = html.replace(/^\d+\. (.+)$/gm, '<li class="md-oli">$1</li>');
    html = html.replace(/(<li class="md-oli">.*<\/li>)/gs, (match) => {
        if (!match.startsWith('<ol')) {
            return `<ol class="md-ol">${match}</ol>`;
        }
        return match;
    });

    // Links [text](url)
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" class="md-link">$1</a>');

    // Blockquotes (> text)
    html = html.replace(/^&gt; (.+)$/gm, '<blockquote class="md-blockquote">$1</blockquote>');

    // Paragraphs - wrap remaining text lines
    const lines = html.split('\n');
    html = lines.map(line => {
        const trimmed = line.trim();

        // Skip already processed elements
        if (trimmed.startsWith('<h') ||
            trimmed.startsWith('<pre') ||
            trimmed.startsWith('<ul') ||
            trimmed.startsWith('<ol') ||
            trimmed.startsWith('<li') ||
            trimmed.startsWith('<hr') ||
            trimmed.startsWith('<blockquote') ||
            trimmed.startsWith('</') ||
            trimmed === '') {
            return line;
        }

        return `<p class="md-p">${trimmed}</p>`;
    }).join('\n');

    // Clean up duplicate wrapper tags
    html = html.replace(/<\/ul>\s*<ul class="md-ul">/g, '');
    html = html.replace(/<\/ol>\s*<ol class="md-ol">/g, '');

    return html;
}

// Extract property value from Notion page
function getPropertyValue(property: any, type: string): any {
    switch (type) {
        case "title":
            // title도 여러 블록일 수 있으므로 모두 합침
            return property?.title?.map((t: any) => t.plain_text).join("") || "";
        case "rich_text":
            // 모든 rich_text 블록을 합쳐서 반환 (불렛, 여러 줄 지원)
            return property?.rich_text?.map((t: any) => t.plain_text).join("") || "";
        case "rich_text_html":
            // 서식 포함된 HTML로 반환
            return richTextToHtml(property?.rich_text);
        case "date":
            return property?.date?.start || "";
        case "checkbox":
            return property?.checkbox || false;
        case "url":
            return property?.url || "";
        default:
            return "";
    }
}

// Helper to parse report title for sorting
// Format: "YYYY년 M월 N째 주" -> Sort Key (Integer)
function parseReportTitle(title: string): number {
    const yearMatch = title.match(/(\d{4})년/);
    const monthMatch = title.match(/(\d{1,2})월/);
    const weekMatch = title.match(/(첫|둘|셋|넷|다섯)째/);

    if (!yearMatch || !monthMatch) return 0; // Invalid format, sort to end

    const year = parseInt(yearMatch[1]);
    const month = parseInt(monthMatch[1]);

    let week = 0;
    if (weekMatch) {
        switch (weekMatch[1]) {
            case "첫": week = 1; break;
            case "둘": week = 2; break;
            case "셋": week = 3; break;
            case "넷": week = 4; break;
            case "다섯": week = 5; break;
        }
    }

    // YYYYMMW (e.g., 2025011)
    return year * 1000 + month * 10 + week;
}

// Fetch projects from Notion database
export async function getProjects(): Promise<ProjectProperties[]> {
    const databaseId = import.meta.env.NOTION_DATABASE_ID_PROJECTS?.trim();

    if (!databaseId) {
        return getSampleProjects();
    }

    try {
        console.log(`[DEBUG] Querying Projects DB: ${databaseId}`);
        const response = await fetchNotion(`/databases/${databaseId}/query`, "POST", {
            filter: {
                property: "게시여부",
                checkbox: {
                    equals: true,
                },
            },
            sorts: [
                {
                    timestamp: "created_time",
                    direction: "descending",
                },
            ],
        });

        if (response.results.length === 0) {
            return [];
        }

        return response.results.map((page: any) => ({
            id: page.id,
            title: getPropertyValue(page.properties.제목 || page.properties.Title || page.properties.Name, "title"),
            slug: getPropertyValue(page.properties.Slug, "rich_text") || page.id,
            summary: getPropertyValue(page.properties.설명 || page.properties.Summary || page.properties.요약, "rich_text"),
            // Date 우선순위: Date/날짜/기간 속성 -> 없으면 created_time
            date: getPropertyValue(page.properties.Date || page.properties.날짜 || page.properties.기간, "date") || (page.created_time || "").split('T')[0],
            published: getPropertyValue(page.properties.게시여부 || page.properties.Published || page.properties.게시, "checkbox"),
            cover: page.cover?.external?.url || page.cover?.file?.url || undefined,
            _raw: page.properties
        }));
    } catch (error: any) {
        console.error("[ERROR] Fetched Projects Failed:", error);
        const samples = getSampleProjects();
        samples[0].title = `⚠️ 오류: ${error.message.slice(0, 100)}`;
        return samples;
    }
}

// Fetch reports from Notion database
export async function getReports(): Promise<ReportProperties[]> {
    const databaseId = import.meta.env.NOTION_DATABASE_ID_REPORTS?.trim();

    if (!databaseId) {
        return getSampleReports();
    }

    try {
        const response = await fetchNotion(`/databases/${databaseId}/query`, "POST", {
            // sorts 제거 (클라이언트 사이드 정렬 사용)
        });

        const reports = response.results.map((page: any) => ({
            id: page.id,
            title: getPropertyValue(page.properties.Name || page.properties.제목 || page.properties.Title || page.properties["주차"], "title"),
            slug: page.id.replace(/-/g, ""),
            date: getPropertyValue(page.properties.Date || page.properties.날짜 || page.properties["기간"], "date"),
            published: true,
            // Extended properties mapping (HTML로 반환하여 bold/italic 등 서식 지원)
            progress: getPropertyValue(page.properties["주요 진행 내용"], "rich_text_html"),
            results: getPropertyValue(page.properties["진행 결과"], "rich_text_html"),
            plan: getPropertyValue(page.properties["다음 주 계획"], "rich_text_html"),
            tools: getPropertyValue(page.properties["사용한 툴 및 기술"], "rich_text_html"),
            insight: getPropertyValue(page.properties["인사이트 및 회고"], "rich_text_html"),
            _raw: page.properties
        }));

        // Sort by Title (Latest first)
        reports.sort((a: any, b: any) => {
            const scoreA = parseReportTitle(a.title);
            const scoreB = parseReportTitle(b.title);
            return scoreB - scoreA;
        });

        return reports;

    } catch (error: any) {
        console.error("[ERROR] Fetched Reports Failed:", error);
        const samples = getSampleReports();
        samples[0].title = `⚠️ 오류: ${error.message.slice(0, 100)}`;
        return samples;
    }
}

// Fetch works from Notion database (Gallery)
export async function getWorks(): Promise<WorkProperties[]> {
    const databaseId = import.meta.env.NOTION_DATABASE_ID_3DGALLERY?.trim();

    if (!databaseId) {
        console.warn("[WARN] NOTION_DATABASE_ID_3DGALLERY not set");
        return [];
    }

    try {
        console.log(`[DEBUG] Querying Works DB: ${databaseId}`);
        const response = await fetchNotion(`/databases/${databaseId}/query`, "POST", {
            sorts: [
                {
                    timestamp: "created_time",
                    direction: "descending",
                },
            ],
        });

        if (response.results.length === 0) {
            return [];
        }

        // Process works with thumbnail caching
        const works: WorkProperties[] = [];

        for (const page of response.results) {
            // Extract thumbnail from Files & Media property
            // Try common property names: 썸네일, Thumbnail, Preview, 파일, File
            const thumbnailProp = page.properties.썸네일 ||
                page.properties.Thumbnail ||
                page.properties.Preview ||
                page.properties.파일 ||
                page.properties.File ||
                page.properties.미리보기;

            let thumbnailUrl: string | undefined;

            if (thumbnailProp?.files && thumbnailProp.files.length > 0) {
                const file = thumbnailProp.files[0];
                const rawUrl = file.type === "external" ? file.external.url : file.file?.url;

                if (rawUrl) {
                    // Cache the image/GIF to prevent URL expiration
                    thumbnailUrl = await cacheImage(rawUrl);
                }
            }

            // Extract category from Select property
            const categoryProp = page.properties.카테고리 ||
                page.properties.Category ||
                page.properties.분류;
            const category = categoryProp?.select?.name || undefined;

            // Extract tags from Multi-select property
            const tagsProp = page.properties.태그 ||
                page.properties.Tags ||
                page.properties.Tag ||
                page.properties.분류태그;
            const tags = tagsProp?.multi_select?.map((t: any) => t.name) || [];

            works.push({
                id: page.id,
                title: getPropertyValue(page.properties.이름 || page.properties.Name || page.properties.제목 || page.properties.Title, "title"),
                slug: page.id.replace(/-/g, ""),
                thumbnail: thumbnailUrl,
                description: getPropertyValue(page.properties.설명 || page.properties.Description || page.properties.요약 || page.properties.Summary, "rich_text"),
                memo: getPropertyValue(page.properties.메모 || page.properties.Memo || page.properties.Note || page.properties.노트, "rich_text"),
                category,
                tags,
                tool: (page.properties.툴 || page.properties.Tool || page.properties.도구)?.multi_select?.map((t: any) => t.name) || [],
                font: (page.properties.폰트 || page.properties.Font || page.properties.글꼴)?.multi_select?.map((t: any) => t.name) || [],
                published: true,
                _raw: page.properties
            });
        }

        return works;

    } catch (error: any) {
        console.error("[ERROR] Fetched Works Failed:", error);
        return [];
    }
}

// Custom Block Parser (HTML output for set:html)
// Supports: lists grouping, recursive children fetch, column/toggle/callout
export async function getPageContent(pageId: string): Promise<string> {
    try {
        console.log(`[DEBUG] Fetching blocks for page: ${pageId}`);
        const response = await fetchNotion(`/blocks/${pageId}/children`, "GET");

        if (!response.results) return "";

        return await blocksToHtml(response.results);

    } catch (error: any) {
        console.error("[ERROR] Failed to fetch page content:", error);
        return `<p>⚠️ 본문을 불러오는 중 오류가 발생했습니다: ${error.message}</p>`;
    }
}

// Convert blocks array to HTML with list grouping and recursive children
async function blocksToHtml(blocks: any[]): Promise<string> {
    let html = "";
    let i = 0;

    while (i < blocks.length) {
        const block = blocks[i];
        if (!block.type) { i++; continue; }

        // Group consecutive list items
        if (block.type === "bulleted_list_item") {
            html += "<ul>";
            while (i < blocks.length && blocks[i].type === "bulleted_list_item") {
                const text = blocks[i].bulleted_list_item.rich_text.map((t: any) => t.plain_text).join("");
                html += `<li>${text}</li>`;
                // Recursive children
                if (blocks[i].has_children) {
                    html += await fetchChildrenHtml(blocks[i].id);
                }
                i++;
            }
            html += "</ul>";
            continue;
        }

        if (block.type === "numbered_list_item") {
            html += "<ol>";
            while (i < blocks.length && blocks[i].type === "numbered_list_item") {
                const text = blocks[i].numbered_list_item.rich_text.map((t: any) => t.plain_text).join("");
                html += `<li>${text}</li>`;
                // Recursive children
                if (blocks[i].has_children) {
                    html += await fetchChildrenHtml(blocks[i].id);
                }
                i++;
            }
            html += "</ol>";
            continue;
        }

        // Single block processing
        html += await blockToHtml(block);
        i++;
    }

    return html;
}

// Fetch children of a block and convert to HTML
async function fetchChildrenHtml(blockId: string): Promise<string> {
    try {
        const response = await fetchNotion(`/blocks/${blockId}/children`, "GET");
        if (response.results && response.results.length > 0) {
            return await blocksToHtml(response.results);
        }
    } catch (e) {
        console.error(`[ERROR] Failed to fetch children for ${blockId}:`, e);
    }
    return "";
}

// Convert single block to HTML
async function blockToHtml(block: any): Promise<string> {
    let html = "";

    switch (block.type) {
        case "paragraph":
            const text = block.paragraph.rich_text.map((t: any) => t.plain_text).join("");
            if (text.trim()) html += `<p>${text}</p>`;
            break;
        case "heading_1":
            const h1 = block.heading_1.rich_text.map((t: any) => t.plain_text).join("");
            html += `<h1>${h1}</h1>`;
            break;
        case "heading_2":
            const h2 = block.heading_2.rich_text.map((t: any) => t.plain_text).join("");
            html += `<h2>${h2}</h2>`;
            break;
        case "heading_3":
            const h3 = block.heading_3.rich_text.map((t: any) => t.plain_text).join("");
            html += `<h3>${h3}</h3>`;
            break;
        case "image":
            let imgUrl = block.image.type === "external" ? block.image.external.url : block.image.file.url;
            // Notion file URL 캐싱 (만료 방지)
            if (block.image.type === "file") {
                imgUrl = await cacheImage(imgUrl);
            }
            const caption = block.image.caption?.[0]?.plain_text || "";
            html += `<figure><img src="${imgUrl}" alt="${caption}" /><figcaption>${caption}</figcaption></figure>`;
            break;
        case "code":
            const code = block.code.rich_text.map((t: any) => t.plain_text).join("");
            const safeCode = code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
            html += `<pre><code>${safeCode}</code></pre>`;
            break;
        case "quote":
            const quote = block.quote.rich_text.map((t: any) => t.plain_text).join("");
            html += `<blockquote>${quote}</blockquote>`;
            break;
        case "divider":
            html += `<hr />`;
            break;
        case "callout":
            const calloutText = block.callout.rich_text.map((t: any) => t.plain_text).join("");
            const icon = block.callout.icon?.emoji || "💡";
            html += `<div class="notion-callout">
                <span class="callout-icon">${icon}</span>
                <div class="callout-content">
                    <span>${calloutText}</span>`;
            if (block.has_children) {
                html += await fetchChildrenHtml(block.id);
            }
            html += `</div></div>`;
            break;
        case "toggle":
            const toggleText = block.toggle.rich_text.map((t: any) => t.plain_text).join("");
            html += `<details><summary style="cursor:pointer; font-weight:bold;">${toggleText}</summary>`;
            if (block.has_children) {
                html += await fetchChildrenHtml(block.id);
            }
            html += `</details>`;
            break;
        case "column_list":
            html += `<div style="display:flex; gap:1em;">`;
            if (block.has_children) {
                html += await fetchChildrenHtml(block.id);
            }
            html += `</div>`;
            break;
        case "column":
            html += `<div style="flex:1;">`;
            if (block.has_children) {
                html += await fetchChildrenHtml(block.id);
            }
            html += `</div>`;
            break;
        case "file":
            const fileUrl = block.file.type === "external" ? block.file.external.url : block.file.file.url;
            const fileName = block.file.caption?.[0]?.plain_text || "Attached File";
            if (fileName.endsWith(".md") || fileUrl.includes(".md")) {
                if (fileUrl.startsWith("attachment:")) {
                    html += `<div class="attached-file-warning">
                        <strong>⚠️ 지원되지 않는 파일 링크</strong><br/>
                        Notion 내부 링크(attachment://)는 블로그에서 열 수 없습니다.
                    </div>`;
                } else {
                    try {
                        const mdResponse = await fetch(fileUrl);
                        if (mdResponse.ok) {
                            const mdContent = await mdResponse.text();
                            const parsedHtml = parseMarkdownToHtml(mdContent);
                            html += `<div class="attached-file-container">
                                <div class="attached-file-header">
                                    <span class="attached-file-icon">📄</span>
                                    <span class="attached-file-name">${fileName}</span>
                                </div>
                                <div class="attached-file-content">${parsedHtml}</div>
                            </div>`;
                        }
                    } catch (e) {
                        html += `<p>⚠️ Error fetching file</p>`;
                    }
                }
            } else {
                html += `<p><a href="${fileUrl}" target="_blank">📎 ${fileName} (Download)</a></p>`;
            }
            break;
        case "pdf":
            const pdfUrl = block.pdf.type === "external" ? block.pdf.external.url : block.pdf.file.url;
            html += `<p><a href="${pdfUrl}" target="_blank">📄 View PDF</a></p>`;
            break;
        case "bookmark":
            const bookmarkUrl = block.bookmark.url;
            html += `<p><a href="${bookmarkUrl}" target="_blank">🔖 ${bookmarkUrl}</a></p>`;
            break;
        case "embed":
            const embedUrl = block.embed.url;
            if (embedUrl.startsWith("attachment:")) {
                html += `<div class="p-4 bg-yellow-50 text-yellow-800 rounded border border-yellow-200 my-4 text-sm">
                    <strong>⚠️ 지원되지 않는 임베드 링크</strong>
                </div>`;
            } else {
                html += `<div style="margin:20px 0;"><iframe src="${embedUrl}" style="width:100%; height:400px; border:none; border-radius:8px;"></iframe></div>`;
            }
            break;
        case "video":
            const videoUrl = block.video.type === "external" ? block.video.external.url : block.video.file.url;
            html += `<p><a href="${videoUrl}" target="_blank">🎥 Watch Video</a></p>`;
            break;
        case "table":
            // Tables need children fetch
            if (block.has_children) {
                html += `<table style="width:100%; border-collapse:collapse; margin:1em 0;">`;
                html += await fetchTableRows(block.id);
                html += `</table>`;
            }
            break;
        default:
            // Unsupported block with children - still fetch children
            if (block.has_children) {
                html += await fetchChildrenHtml(block.id);
            }
            break;
    }

    return html;
}

// Fetch table rows
async function fetchTableRows(tableId: string): Promise<string> {
    try {
        const response = await fetchNotion(`/blocks/${tableId}/children`, "GET");
        let rows = "";
        for (const row of response.results) {
            if (row.type === "table_row") {
                rows += "<tr>";
                for (const cell of row.table_row.cells) {
                    const cellText = cell.map((t: any) => t.plain_text).join("");
                    rows += `<td style="border:1px solid #ddd; padding:8px;">${cellText}</td>`;
                }
                rows += "</tr>";
            }
        }
        return rows;
    } catch (e) {
        return "";
    }
}


// Get project by slug
export async function getProjectBySlug(slug: string): Promise<ProjectProperties | null> {
    const projects = await getProjects();
    return projects.find(p => p.slug === slug) || null;
}

// Sample data methods
function getSampleProjects(): ProjectProperties[] {
    return [];
}

function getSampleReports(): ReportProperties[] {
    return [
        {
            id: "r1",
            title: "Sample Report",
            slug: "sample",
            date: "2025-01-01",
            published: true,
            progress: "Sample progress",
            results: "Sample results",
            plan: "Sample plan",
            tools: "Sample tools",
            insight: "Sample insight"
        }
    ];
}
