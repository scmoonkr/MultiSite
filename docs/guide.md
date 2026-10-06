# CMS Feature Page Guide

## 핵심 원칙

이 CMS의 페이지는 다음 세 가지로 구분한다.

```txt
Content = CMS 데이터/문서
Block   = Markdown 내부의 특수 UI
Feature = 코드로 구현하는 프로그램 기능
```

모든 페이지를 `contents`로 처리하지 않는다.

## Content Page

공지사항, 블로그, 소개, 설교, 자료실처럼 문서 중심인 페이지는 `contents`에서 관리한다.

```js
{
  siteId,
  contentType,
  title,
  slug,
  summary,
  markdown,
  html,
  categoryIds,
  tagIds,
  status
}
```

## Feature Page

입력, 계산, 검색, 사용자 상태, 별도 API 등 프로그램 로직이 필요한 페이지는 Feature로 구현한다.

예:

```txt
독서 진단
도서 추천
예약/신청
보험 비교
수영 기록 검색
회원 대시보드
```

Feature 코드는 MongoDB `contents`에 저장하지 않고 Vue/Nuxt 코드로 구현한다.

## Feature Registry

지원 기능은 Registry에서 관리한다.

```ts
export const featureRegistry = {
  'reading-check': {
    name: '독서 진단',
    path: '/reading-check',
    component: 'ReadingCheckPage'
  },
  'book-recommend': {
    name: '도서 추천',
    path: '/book-recommend',
    component: 'BookRecommendPage'
  },
  'sermon-archive': {
    name: '설교 아카이브',
    path: '/sermons',
    component: 'SermonArchivePage'
  }
}
```

## Site별 Feature 활성화

사이트는 필요한 기능만 활성화한다.

```js
{
  siteId: "readfit",
  enabledFeatures: [
    "reading-check",
    "book-recommend"
  ]
}
```

설정이 필요하면 다음처럼 확장한다.

```js
{
  siteId: "readfit",
  features: {
    "reading-check": {
      enabled: true,
      title: "나의 독서 수준 알아보기",
      options: {
        showHistory: true
      }
    }
  }
}
```

프로그램 로직 자체는 DB에 저장하지 않는다.

## Menu 연결

메뉴는 다음 타입을 지원한다.

```txt
page
category
feature
url
```

Feature 메뉴:

```js
{
  title: "독서 진단",
  type: "feature",
  featureKey: "reading-check"
}
```

URL을 메뉴에 중복 저장하기보다 `featureKey`를 이용해 Registry의 path를 사용한다.

## Routing

```txt
Request
  ↓
Domain 확인
  ↓
Site 조회 / siteId 결정
  ↓
요청 path 확인
  ↓
Feature Registry 조회
  ├─ Feature
  │    ↓
  │  site에서 enabled?
  │    ├─ YES → Feature Page
  │    └─ NO  → 404
  │
  └─ Feature 아님
       ↓
     Content 조회
       ├─ 존재 → Content Page
       └─ 없음 → 404
```

## Block과 Feature 차이

Block은 문서 안에 들어가는 UI다.

```md
:::imageGrid
...
:::
```

```md
:::slide
...
:::
```

Feature는 페이지 자체가 프로그램이다.

```txt
/reading-check
/book-recommend
/reservation
/member/dashboard
```

판단 기준:

```txt
문서 → Content
문서 내부 특수 표현 → Block
입력/계산/상태/API가 필요한 기능 → Feature
```

## Feature에서 Content 사용

Feature 안에서도 설명 문구 등은 CMS Content를 사용할 수 있다.

예: 독서 진단

```txt
소개 설명       → Content
질문/계산       → Feature
결과 처리       → Feature
하단 안내       → Content
```

이렇게 하면 프로그램 코드를 수정하지 않고 운영 문구를 변경할 수 있다.

## Feature 권한

Feature별 인증/권한 조건을 둘 수 있다.

```ts
{
  key: 'member-dashboard',
  auth: true
}
```

```ts
{
  key: 'admin-report',
  auth: true,
  roles: ['admin', 'manager']
}
```

접근 시 확인:

```txt
siteId
feature enabled
login 여부
role
```

## Feature API

Feature API도 siteId 기준으로 동작한다.

```txt
/api/features/reading-check
/api/features/book-recommend
```

클라이언트가 전달한 `siteId`를 그대로 신뢰하지 않는다. domain/session/권한을 기준으로 접근 가능한 사이트를 확인한다.

## Feature 디자인

Feature도 사이트의 Template/Style Family를 따른다.

```css
.feature-button {
  background: var(--color-primary);
  color: var(--color-on-primary);
}
```

Feature 내부에 사이트별 색상이나 스타일을 하드코딩하지 않는다.

## 권장 Nuxt 구조

```txt
features/
  registry.ts

  reading-check/
    components/
    composables/
    server/

  book-recommend/
    components/
    composables/
    server/

  sermon-archive/
    components/
    server/

pages/
  [...slug].vue
```

작은 프로젝트에서는:

```txt
components/
  features/
    ReadingCheckPage.vue
    BookRecommendPage.vue
    SermonArchivePage.vue

features/
  registry.ts
```

로 시작해도 된다.

## 피해야 할 구조

다음 방식은 사용하지 않는다.

```txt
모든 기능을 contents로 처리
사이트별 Nuxt 프로젝트 복제
Feature의 JavaScript/HTML/CSS를 DB에 저장
자유형 Page Builder로 Feature 구성
siteId를 무시한 Feature API
```

## 전체 구조

```txt
CMS
│
├─ Core
│   ├─ Site
│   ├─ User/Auth
│   ├─ Content
│   ├─ Category
│   ├─ Tag
│   ├─ Image
│   ├─ Menu
│   └─ Theme
│
├─ Markdown Blocks
│   ├─ notice
│   ├─ imageGrid
│   ├─ slide
│   ├─ cards
│   └─ youtube
│
└─ Features
    ├─ reading-check
    ├─ book-recommend
    ├─ sermon-archive
    └─ insurance-proposal
```

사이트는 Core 위에 필요한 Feature를 선택한다.

```txt
ReadFit
├─ CMS Core
├─ Style: blue-soft
├─ reading-check
└─ book-recommend

Church
├─ CMS Core
├─ Style: green-calm
└─ sermon-archive
```

## 최종 개발 원칙

새 페이지를 개발하기 전에 항상 다음 순서로 판단한다.

```txt
1. 단순 문서인가?
   → Content

2. 문서 내부의 특수 UI인가?
   → Markdown Block

3. 사용자 입력, 계산, 상태, API 등 프로그램 로직이 필요한가?
   → Feature
```

최종 개념:

```txt
Content      = 데이터/문서
Block        = 콘텐츠 내부 표현
Feature      = 프로그램 기능
Template     = 페이지 구조
Style Family = 디자인
Menu         = 사용자 접근 연결
```

이 경계를 유지하는 것이 CMS가 불필요하게 복잡해지는 것을 막는 핵심 원칙이다.
