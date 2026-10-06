# MultiSite Architecture

```text
HTTP Host ──> Site Resolver ──> siteId
                               │
                    ┌──────────┼──────────┐
                    ▼          ▼          ▼
                 Content     Blocks     Features
                MongoDB      Markdown     Code
```

공개 요청은 Host만으로 사이트를 식별합니다. 관리 요청은 로그인한 관리자의 선택 사이트를 HttpOnly 쿠키에 저장하고, 각 API가 그 값을 서버에서 다시 검증합니다. 클라이언트가 요청 본문에 임의 `siteId`를 보내도 저장 쿼리에는 사용되지 않습니다.

## Collections

- `sites`: 도메인, 상태, Theme, 활성 Feature
- `contents`: `post`와 `page` 공통 문서 모델
- `categories`: 사이트별 분류
- `menus`: 사이트별 위치 메뉴
- `redirects`: 공개된 콘텐츠의 slug 변경 기록

모든 site-scoped 컬렉션의 유일성은 `{ siteId, ... }` 복합 인덱스로 보장합니다.
