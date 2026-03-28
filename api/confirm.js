const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const {
    paymentKey,
    orderId,
    amount,
    paymentMethod,
    buyerName,
    buyerPhone,
    shippingAddress,
    shippingMemo,
    ownerId,
  } = req.body;

  // 1. Toss 결제 승인
  const tossRes = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${process.env.TOSS_SECRET_KEY}:`).toString('base64')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ paymentKey, orderId, amount }),
  });

  if (!tossRes.ok) {
    const err = await tossRes.json();
    return res.status(400).json({ message: err.message || '결제 승인 실패' });
  }

  const tossData = await tossRes.json();

  // 가상계좌: WAITING_FOR_DEPOSIT 상태로 저장
  const isVirtualAccount = tossData.method === '가상계좌';
  const initialStatus = isVirtualAccount ? 'waiting_for_deposit' : 'paid';

  // 2. Supabase orders insert
  const { error: dbErr } = await supabase.from('orders').insert({
    order_id: orderId,
    owner_id: ownerId || null,
    status: initialStatus,
    payment_key: paymentKey,
    payment_method: paymentMethod,
    amount,
    items: req.body.items || null,
    buyer_name: buyerName,
    buyer_phone: buyerPhone,
    shipping_address: shippingAddress,
    shipping_memo: shippingMemo,
  });

  if (dbErr) {
    console.error('DB insert error:', dbErr);
    // 승인은 됐으므로 200 반환, 에러는 로그만
  }

  // 3. Gmail 이메일
  // 수신 이메일: 브랜드별 settings.notify_email → 없으면 환경변수 NOTIFY_EMAIL → 없으면 스킵
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    let notifyEmail = process.env.NOTIFY_EMAIL || null;
    if (ownerId) {
      const { data: setting } = await supabase
        .from('settings')
        .select('value')
        .eq('owner_id', ownerId)
        .eq('key', 'notify_email')
        .single();
      if (setting?.value) notifyEmail = setting.value;
    }

    if (notifyEmail) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
      });
      const itemRows = (req.body.items || []).map(i =>
        `<tr><td>${[i.productName, i.size, i.color].filter(Boolean).join(' / ')}</td><td>× ${i.quantity}</td><td>${(i.unitPrice * i.quantity).toLocaleString()}원</td></tr>`
      ).join('');
      await transporter.sendMail({
        from: process.env.GMAIL_USER,
        to: notifyEmail,
        subject: `[${isVirtualAccount ? '입금대기' : '주문접수'}] ${buyerName} — ${amount.toLocaleString()}원`,
        html: `
          <h2>새 주문이 접수되었습니다</h2>
          <table border="1" cellpadding="6" style="border-collapse:collapse">
            <tr><td>주문번호</td><td>${orderId}</td></tr>
            <tr><td>결제수단</td><td>${paymentMethod}</td></tr>
            <tr><td>결제금액</td><td>${amount.toLocaleString()}원</td></tr>
            <tr><td>구매자</td><td>${buyerName}</td></tr>
            <tr><td>연락처</td><td>${buyerPhone}</td></tr>
            <tr><td>배송지</td><td>${shippingAddress}</td></tr>
            ${shippingMemo ? `<tr><td>배송 메모</td><td>${shippingMemo}</td></tr>` : ''}
            ${itemRows}
          </table>
        `,
      }).catch(e => console.error('Gmail error:', e));
    }
  }

  // 가상계좌 정보 반환
  if (isVirtualAccount && tossData.virtualAccount) {
    const va = tossData.virtualAccount;
    return res.status(200).json({
      success: true,
      virtualAccount: {
        bankName: va.bankCode ? va.bankName : va.bank,
        accountNumber: va.accountNumber,
        dueDate: va.dueDate,
      },
    });
  }

  return res.status(200).json({ success: true });
};
