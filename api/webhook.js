const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { eventType, data } = req.body;

  // 가상계좌 입금 완료 이벤트만 처리
  if (eventType !== 'DEPOSIT_CALLBACK') {
    return res.status(200).json({ received: true });
  }

  const { paymentKey, orderId, status } = data || {};

  if (status !== 'DONE' || !paymentKey || !orderId) {
    return res.status(200).json({ received: true });
  }

  // Toss API에서 결제 정보 재조회 (webhook 위변조 방지)
  const tossRes = await fetch(`https://api.tosspayments.com/v1/payments/orders/${orderId}`, {
    headers: {
      Authorization: `Basic ${Buffer.from(`${process.env.TOSS_SECRET_KEY}:`).toString('base64')}`,
    },
  });

  if (!tossRes.ok) return res.status(200).json({ received: true });

  const payment = await tossRes.json();
  if (payment.status !== 'DONE' || payment.paymentKey !== paymentKey) {
    return res.status(200).json({ received: true });
  }

  // 주문 status 업데이트
  const { data: order, error } = await supabase
    .from('orders')
    .update({ status: 'paid' })
    .eq('order_id', orderId)
    .eq('status', 'waiting_for_deposit')
    .select('*')
    .single();

  if (error || !order) return res.status(200).json({ received: true });

  // 입금 완료 이메일 발송
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    let notifyEmail = process.env.NOTIFY_EMAIL || null;
    if (order.owner_id) {
      const { data: setting } = await supabase
        .from('settings')
        .select('value')
        .eq('owner_id', order.owner_id)
        .eq('key', 'notify_email')
        .single();
      if (setting?.value) notifyEmail = setting.value;
    }

    if (notifyEmail) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
      });
      const itemRows = (order.items || []).map(i =>
        `<tr><td>${[i.productName, i.size, i.color].filter(Boolean).join(' / ')}</td><td>× ${i.quantity}</td><td>${(i.unitPrice * i.quantity).toLocaleString()}원</td></tr>`
      ).join('');
      await transporter.sendMail({
        from: process.env.GMAIL_USER,
        to: notifyEmail,
        subject: `[입금확인] ${order.buyer_name} — ${(order.amount || 0).toLocaleString()}원`,
        html: `
          <h2>가상계좌 입금이 확인되었습니다</h2>
          <table border="1" cellpadding="6" style="border-collapse:collapse">
            <tr><td>주문번호</td><td>${order.order_id}</td></tr>
            <tr><td>결제금액</td><td>${(order.amount || 0).toLocaleString()}원</td></tr>
            <tr><td>구매자</td><td>${order.buyer_name}</td></tr>
            <tr><td>연락처</td><td>${order.buyer_phone}</td></tr>
            <tr><td>배송지</td><td>${order.shipping_address}</td></tr>
            ${order.shipping_memo ? `<tr><td>배송 메모</td><td>${order.shipping_memo}</td></tr>` : ''}
            ${itemRows}
          </table>
        `,
      }).catch(e => console.error('Gmail error:', e));
    }
  }

  return res.status(200).json({ received: true });
};
