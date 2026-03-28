# Paylink

옷 쇼핑몰을 위한 간단한 결제 랜딩페이지.
회원가입 없이 구매 완료, Google 로그인으로 상품 관리.

## 환경변수
`.env.local` 파일 생성 (Vercel 배포 시 대시보드에서 입력):
```env
TOSS_CLIENT_KEY=
TOSS_SECRET_KEY=
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GMAIL_USER=
GMAIL_APP_PASSWORD=
NOTIFY_EMAIL=
```

## 로컬 개발
```bash
npm install
vercel dev
```
