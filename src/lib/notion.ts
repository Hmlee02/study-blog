import { Client } from "@notionhq/client";
import { NotionToMarkdown } from "notion-to-md";

console.log("[DEBUG] Importing Client (Raw):", Client);

// Handle ESM/CommonJS interop issue
const NotionClient = (Client as any).default || Client;
console.log("[DEBUG] Using NotionClient:", NotionClient);

// Initialize Notion client
const notion = new NotionClient({
  auth: import.meta.env.NOTION_API_KEY,
});

console.log("[DEBUG] Notion Instance Keys:", Object.keys(notion));
if (notion.databases) {
  console.log("[DEBUG] notion.databases exists");
} else {
  console.error("[ERROR] notion.databases is undefined!");
}

const n2m = new NotionToMarkdown({ notionClient: notion });

// Types for Notion properties
interface ProjectProperties {
  id: string;
  title: string;
  slug: string;
  summary: string;
  date: string;
  published: boolean;
  cover?: string;
}

interface ReportProperties {
  id: string;
  title: string;
  slug: string;
  date: string;
  published: boolean;
}

// Extract property value from Notion page
function getPropertyValue(property: any, type: string): any {
  switch (type) {
    case "title":
      return property?.title?.[0]?.plain_text || "";
    case "rich_text":
      return property?.rich_text?.[0]?.plain_text || "";
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

// Fetch projects from Notion database
export async function getProjects(): Promise<ProjectProperties[]> {
  const databaseId = import.meta.env.NOTION_DATABASE_ID_PROJECTS;

  console.log(`[DEBUG] Projects DB ID: ${databaseId ? "Loaded (" + databaseId.slice(0, 4) + "...)" : "Not Found"}`);

  if (!databaseId) {
    console.warn("[WARN] No Project Database ID found in .env");
    return getSampleProjects();
  }

  try {
    const response = await notion.databases.query({
      database_id: databaseId,
      filter: {
        property: "Published",
        checkbox: {
          equals: true,
        },
      },
      sorts: [
        {
          property: "Date",
          direction: "descending",
        },
      ],
    });

    console.log(`[DEBUG] Projects fetched: ${response.results.length} items (Raw)`);

    if (response.results.length > 0) {
      console.log("[DEBUG] First Project Properties:", JSON.stringify((response.results[0] as any).properties, null, 2));
    } else {
      console.log("[DEBUG] No projects found in database. Check 'Published' filter or DB content.");
      // Try fetching without filter to see if filter is the issue
      if ((response as any).filter) {
        console.log("[DEBUG] Trying again without filter...");
      }
    }

    return response.results.map((page: any) => {
      // 디버깅을 위해 속성 구조를 보고 싶다면 아래 주석을 해제하세요
      // console.log(JSON.stringify(page.properties, null, 2));
      return {
        id: page.id,
        title: getPropertyValue(page.properties.Name || page.properties.제목 || page.properties.Title, "title"),
        slug: getPropertyValue(page.properties.Slug, "rich_text"),
        summary: getPropertyValue(page.properties.Summary || page.properties.요약, "rich_text"),
        date: getPropertyValue(page.properties.Date || page.properties.날짜, "date"),
        published: getPropertyValue(page.properties.Published || page.properties.게시, "checkbox"),
        cover: page.cover?.external?.url || page.cover?.file?.url || undefined,
      }
    });
  } catch (error) {
    console.error("[ERROR] Failed to fetch projects:", error);
    return getSampleProjects();
  }
}

// Fetch reports from Notion database
export async function getReports(): Promise<ReportProperties[]> {
  const databaseId = import.meta.env.NOTION_DATABASE_ID_REPORTS;

  console.log(`[DEBUG] Reports DB ID: ${databaseId ? "Loaded" : "Not Found"}`);

  if (!databaseId) {
    console.warn("[WARN] No Report Database ID found in .env");
    return getSampleReports();
  }

  try {
    const response = await notion.databases.query({
      database_id: databaseId,
      sorts: [
        {
          property: "Date",
          direction: "descending",
        },
      ],
    });

    console.log(`[DEBUG] Reports fetched: ${response.results.length} items`);

    return response.results.map((page: any) => ({
      id: page.id,
      title: getPropertyValue(page.properties.Name || page.properties.제목 || page.properties.Title, "title"),
      slug: page.id.replace(/-/g, ""),
      date: getPropertyValue(page.properties.Date || page.properties.날짜, "date"),
      published: true,
    }));
  } catch (error) {
    console.error("[ERROR] Failed to fetch reports:", error);
    return getSampleReports();
  }
}

// Get page content as markdown
export async function getPageContent(pageId: string): Promise<string> {
  try {
    const mdblocks = await n2m.pageToMarkdown(pageId);
    const mdString = n2m.toMarkdownString(mdblocks);
    return mdString.parent;
  } catch (error) {
    console.error("Failed to get page content:", error);
    return "# Content not available\n\nPlease configure Notion API to view content.";
  }
}

// Get project by slug
export async function getProjectBySlug(slug: string): Promise<ProjectProperties | null> {
  const projects = await getProjects();
  return projects.find(p => p.slug === slug) || null;
}

// Sample data for development (when Notion API is not configured)
function getSampleProjects(): ProjectProperties[] {
  return [
    {
      id: "1",
      title: "Visit Seoul Campaign",
      slug: "visit-seoul",
      summary: "AI 기반 서울 관광 캠페인 디자인 프로젝트",
      date: "2025-01-15",
      published: true,
    },
    {
      id: "2",
      title: "Design Kit Collection",
      slug: "design-kit",
      summary: "UI/UX 디자인을 위한 종합 키트 제작",
      date: "2025-01-10",
      published: true,
    },
    {
      id: "3",
      title: "Brand Identity System",
      slug: "brand-identity",
      summary: "스타트업을 위한 브랜드 아이덴티티 시스템 구축",
      date: "2025-01-05",
      published: true,
    },
  ];
}

function getSampleReports(): ReportProperties[] {
  return [
    {
      id: "r1",
      title: "2025년 1월 첫째 주",
      slug: "2025-jan-week1",
      date: "2025-01-05",
      published: true,
    },
    {
      id: "r2",
      title: "2024년 12월 넷째 주",
      slug: "2024-dec-week4",
      date: "2024-12-29",
      published: true,
    },
  ];
}

export { notion, n2m };
