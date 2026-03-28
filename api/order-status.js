const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const VALID_STATUSES = ['waiting_for_deposit', 'paid', 'shipping', 'delivered'];

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ message: '로그인이 필요합니다.' });
  const { data: { user } } = await supabase.auth.getUser(auth.slice(7));
  if (!user) return res.status(401).json({ message: '로그인이 필요합니다.' });

  const { id, status } = req.body;
  if (!id || !status) return res.status(400).json({ message: 'id, status required' });
  if (!VALID_STATUSES.includes(status)) return res.status(400).json({ message: '유효하지 않은 상태입니다.' });

  const { data: order } = await supabase.from('orders').select('owner_id').eq('id', id).single();
  if (!order) return res.status(404).json({ message: '주문을 찾을 수 없습니다.' });
  if (order.owner_id !== user.id) return res.status(403).json({ message: '권한이 없습니다.' });

  const { error } = await supabase.from('orders').update({ status }).eq('id', id);
  if (error) return res.status(500).json({ message: error.message });

  return res.status(200).json({ success: true });
};
