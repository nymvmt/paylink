const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { orderId, buyerPhone } = req.body;
  if (!orderId || !buyerPhone) return res.status(400).json({ message: '주문번호와 전화번호를 입력해주세요.' });

  const phoneDigits = buyerPhone.replace(/\D/g, '');

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('order_id', orderId)
    .single();

  if (error || !data) return res.status(404).json({ message: '주문을 찾을 수 없습니다.' });
  if (data.buyer_phone.replace(/\D/g, '') !== phoneDigits) {
    return res.status(404).json({ message: '주문을 찾을 수 없습니다.' });
  }

  return res.status(200).json(data);
};
