# Study Blog

Notion을 CMS로 사용하는 Astro 기반 기술 블로그입니다.

**🔗 Live Site**: [https://study-blog-jade.vercel.app](https://study-blog-jade.vercel.app)

---

## 📸 Preview

| 메인 페이지 | 프로젝트 상세 |
|-------------|---------------|
| 미니멀 타이포그래피 중심 디자인 | Notion 블록 → HTML 렌더링 |

---

## 🛠 Tech Stack

### Frontend
| 기술 | 버전 | 용도 |
|------|------|------|
| **Astro** | 5.x | 정적 사이트 생성 (SSG) |
| **TypeScript** | 5.x | 타입 안정성 |
| **TailwindCSS** | 4.x | 유틸리티 기반 스타일링 |
| **Vanilla CSS** | - | 커스텀 디자인 시스템 |

### Backend / CMS
| 기술 | 용도 |
|------|------|
| **Notion API** | 콘텐츠 관리 (CMS) |
| **Native Fetch** | API 통신 (라이브러리 미사용) |

### Deployment
| 서비스 | 용도 |
|--------|------|
| **Vercel** | 호스팅 및 자동 배포 |
| **GitHub** | 버전 관리 |

---

## 📁 Project Structure

```
study-blog/
├── docs/
│   ├── TROUBLESHOOTING.md      # 트러블슈팅 가이드
│   └── NOTION_INTEGRATION_GUIDE.md  # Notion 연동 가이드
├── src/
│   ├── layouts/
│   │   └── Layout.astro        # 공통 레이아웃
│   ├── lib/
│   │   └── notion-client.ts    # Notion API 클라이언트
│   ├── pages/
│   │   ├── index.astro         # 메인 페이지
│   │   ├── projects/
│   │   │   ├── index.astro     # 프로젝트 목록 (연도 필터)
│   │   │   └── [slug].astro    # 프로젝트 상세
│   │   └── reports/
│   │       ├── index.astro     # 리포트 목록 (연도 필터)
│   │       └── [slug].astro    # 리포트 상세
│   └── styles/
│       └── global.css          # 디자인 시스템
├── .env                        # 환경변수 (git 제외)
├── .gitignore
├── astro.config.mjs
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🔨 Development Process

### Phase 1: 프로젝트 초기화
1. Astro 프로젝트 생성 (`npm create astro@latest`)
2. TailwindCSS 4.x 통합
3. TypeScript 설정

### Phase 2: Notion API 연동
1. Notion Integration 생성 및 API Key 발급
2. 데이터베이스 스키마 설계 (Projects, Reports)
3. Native Fetch 기반 API 클라이언트 구현
4. 환경변수 설정 (`.env`)

### Phase 3: 페이지 구현
1. 레이아웃 컴포넌트 (`Layout.astro`)
2. 메인 페이지 - 최신 게시물 3개 표시
3. 리스팅 페이지 - 연도별 필터 기능
4. 상세 페이지 - Notion 블록 → HTML 변환

### Phase 4: 블록 렌더링 개선
1. **연속 목록 그룹화**: 번호 목록이 1,1,1 → 1,2,3 으로 정상 표시
2. **재귀적 자식 블록 fetch**: Column, Toggle, Callout 내부 콘텐츠 지원
3. **다양한 블록 타입 지원**: 테이블, 코드, 이미지, 파일, 북마크 등

### Phase 5: 디자인 시스템
1. 타이포그래피 중심 미니멀 UI
2. `clamp()` 기반 반응형 폰트
3. 호버 애니메이션 및 트랜지션
4. 연도 필터 버튼 UI

### Phase 6: 배포
1. GitHub 레포지토리 생성
2. Vercel 연동 및 자동 배포
3. 환경변수 설정

---

## 🚀 Getting Started

### 1. 클론 및 의존성 설치
```bash
git clone https://github.com/Hmlee02/study-blog.git
cd study-blog
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

### 4. 빌드
```bash
npm run build
```

---

## 📝 Notion Database Schema

### Projects
| 속성명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| 제목 | Title | ✅ | 프로젝트 제목 |
| 게시여부 | Checkbox | ✅ | 블로그 노출 여부 |
| Slug | Text | - | URL 경로 |
| 설명 | Text | - | 요약 |
| Date | Date | - | 프로젝트 날짜 |

### Reports
| 속성명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| Name | Title | ✅ | "2025년 12월 5째 주" 형식 |
| 주요 진행 내용 | Text | - | 진행 사항 |
| 진행 결과 | Text | - | 결과 |
| 다음 주 계획 | Text | - | 계획 |
| 사용한 툴 및 기술 | Text | - | 기술 스택 |
| 인사이트 및 회고 | Text | - | 회고 |

---

## 📚 Documentation

- [트러블슈팅 가이드](./docs/TROUBLESHOOTING.md)
- [Notion API 연동 가이드](./docs/NOTION_INTEGRATION_GUIDE.md)

---

## 🐛 Known Issues & Solutions

자세한 내용은 [TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md) 참조.

| 문제 | 원인 | 해결 |
|------|------|------|
| 번호 목록 1,1,1 표시 | 각 항목마다 별도 `<ol>` 생성 | 연속 항목 그룹핑 |
| 중첩 콘텐츠 누락 | 자식 블록 미 fetch | 재귀적 children fetch |
| `attachment://` 오류 | Notion 내부 링크 | 사용자 안내 UI |
| 봇 권한 오류 | Integration 미연결 | Connections 설정 |

---

## 📄 License

MIT

---

## 👤 Author

**Hmlee02**
- GitHub: [@Hmlee02](https://github.com/Hmlee02)
