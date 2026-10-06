# MultiSite CMS

`docs/guide.md`의 Content / Block / Feature 경계를 따르는 Node.js + Nuxt + MongoDB 멀티사이트 CMS입니다. `insuredesign`의 화면 구성 방식은 참고했지만, 멀티사이트 데이터 모델과 요청 처리는 새로 구현했습니다.

## 핵심 구조

- 하나의 Nuxt 코드베이스를 모든 사이트가 공유합니다.
- 공개 API는 요청 `Host`를 `sites.domains`와 비교해 서버에서 `siteId`를 결정합니다.
- 관리 API는 URL/본문의 `siteId`를 사용하지 않고, 서명된 관리자 세션과 사이트 선택 쿠키로 범위를 결정합니다.
- 글과 페이지는 `contents`, 분류는 `categories`, 내비게이션은 `menus`에 사이트별로 저장됩니다.
- Markdown 안의 `:::notice`는 Block으로 렌더링됩니다.
- `/reading-check`는 Feature Registry의 코드 기능이며, 사이트에서 활성화한 경우에만 열립니다.

## 설치 및 실행

```powershell
Copy-Item .env.example .env
npm install
npm run db:init
npm run db:seed
npm run dev
```

기존 서버에서 사용하던 MongoDB 환경변수도 그대로 사용할 수 있습니다.

```env
MONGODB_ADDR=221.143.48.153:4529
MONGO_USERNAME=...
MONGO_PWD=...
MONGO_DBNAME=MultiSite
```

`MONGODB_URI`가 있으면 URI를 우선 사용하고, 없으면 위 네 값을 조합합니다. 관리자·공개 API 모두 동일한 MongoDB 연결 풀을 사용하며, 연결 상태는 `GET /api/health`에서 확인할 수 있습니다.

`.env`의 `ADMIN_KEY`와 `SESSION_SECRET`은 반드시 변경하세요. 관리화면은 `http://localhost:3000/backend`입니다.

샘플 사이트:

- `http://localhost:3000` 또는 `http://readfit.localhost:3000` — ReadFit
- `http://community.localhost:3000` — Community Notes

`*.localhost`가 환경에서 해석되지 않으면 hosts 파일에 `127.0.0.1 readfit.localhost community.localhost`를 추가합니다.

## 주요 경로

```text
app/features/registry.ts       Feature Registry
server/utils/site.ts          Host → Site 결정
server/api/public             도메인 기반 공개 API
server/api/admin              세션/선택 사이트 기반 관리 API
scripts/init-db.mjs           siteId 복합 인덱스
scripts/seed.mjs              두 사이트 예제 데이터
```

## 보안 원칙

운영에서는 프록시가 외부의 임의 `X-Forwarded-Host`를 제거하고 실제 Host로 다시 설정해야 합니다. 또한 TLS 환경에서 실행하고 충분히 긴 관리자 키와 세션 비밀값을 사용하세요.

# git
https://github.com/scmoonkr/MultiSite
