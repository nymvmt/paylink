# Paylink

옷 구매 랜딩페이지. 스택/기능 명세는 `features.md` 참고.

## 구조
```
index.html      # 랜딩페이지
admin.html      # Admin 상품 관리
api/confirm.js  # Vercel Serverless — Toss 결제 승인
```

## 규칙
- JS는 HTML `<script>` 인라인. 외부 라이브러리는 CDN. npm 빌드 없음.
- `TOSS_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY` 는 `api/` 서버에서만.
- DB 쓰기는 `SERVICE_ROLE_KEY` 사용. `ANON_KEY`는 클라이언트 노출 허용.
