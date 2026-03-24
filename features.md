# 옷 구매 랜딩페이지 — Feature 명세

## 스택
| 구성 | 선택 |
|------|------|
| Frontend | HTML (단일 파일) |
| Hosting + API | Vercel (무료) |
| 결제 | Toss Payments |
| DB | Supabase |
| 알림 | Resend (이메일) |

---

## 사용자 유형
| 유형 | 설명 |
|------|------|
| Admin | 상품 정보 직접 입력/수정 |
| Customer | 회원가입 없이 구매 |

---

## Feature 1 — 랜딩페이지 (Customer)

> 회원가입 없이 접근 가능. 비로그인 상태로 전체 구매 플로우 완료.

- [ ] 상품 이미지 슬라이더 (5장)
- [ ] 상품명, 가격 표시
- [ ] 옵션 선택 UI (사이즈, 컬러)
- [ ] 배송비 안내 (4,000원 일괄)
- [ ] 결제 버튼 → Feature 2 (결제창) 호출

---

## Feature 2 — 결제창 (Customer)

> 랜딩페이지에서 결제 버튼 클릭 시 진입.

- [ ] 구매자 정보 입력
  - 이름, 연락처
  - 배송지 주소, 배송 메모 (선택)
- [ ] 결제수단 선택
  - 퀵계좌이체 (수수료 2.0%, 최저 건당 200원)
  - 토스페이 (간편결제)
- [ ] Toss 결제창 호출 → 승인 처리
- [ ] 결제 완료 화면
  - 주문 정보 요약

- [ ] 운영자 이메일 알림 자동 발송 (Resend)
  - 주문 접수 시


---

## Feature 3 — 상품 관리 (Admin)

> Admin 전용 페이지. 로그인 필요 (Supabase Auth).

- [ ] Admin 로그인 (이메일/비밀번호)
- [ ] 상품 정보 입력/수정
  - 상품명
  - 가격
  - 이미지 5장 업로드
  - 옵션 설정 (사이즈 목록, 컬러 목록)
  - 배송비
- [ ] 저장 즉시 랜딩페이지에 반영

---

## DB 구조

### products 테이블
```sql
products
├── id            uuid        PK
├── name          text        상품명
├── price         integer     가격
├── shipping_fee  integer     배송비 (기본 4000)
├── sizes         text[]      옵션 사이즈 목록
├── colors        text[]      옵션 컬러 목록
└── images        text[]      이미지 URL 목록 (최대 5장)
```

### orders 테이블
```sql
orders
├── id                uuid        PK
├── created_at        timestamp
├── status            text        'pending' | 'paid' | 'cancelled'
├── payment_key       text        Toss 결제 고유키
├── payment_method    text        'quick_account' | 'tosspay'
├── amount            integer     결제금액

├── option_size       text
├── option_color      text
├── buyer_name        text
├── buyer_phone       text
├── shipping_address  text
└── shipping_memo     text
```

---

## API

| 엔드포인트 | 설명 |
|-----------|------|
| `POST /api/confirm` | Toss 결제 승인 처리 |


---

## Phase 2 — 추후 추가
- [ ] 카카오페이 결제
- [ ] 재고 관리 (옵션별 수량)
- [ ] Admin 주문 목록 조회 + 상태 변경
- [ ] 카카오 알림톡

---

## 미결 사항
- [x] 정산 받을 사업자 계좌 전달
- [x] Toss Payments 사업자 계정 가입
- [x] 통신판매업 신고번호 확인

---

## 환경변수 (.env)

```env
# Toss Payments
TOSS_CLIENT_KEY=
TOSS_SECRET_KEY=

# Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Resend
RESEND_API_KEY=
RESEND_TO_EMAIL=
```

> 로컬: `.env.local` 파일로 관리 (git 제외)
> 배포: Vercel 대시보드 → Environment Variables 에 직접 입력
