const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function authenticate(req) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return null;
  const { data: { user } } = await supabase.auth.getUser(auth.slice(7));
  return user || null;
}

module.exports = async function handler(req, res) {
  const user = await authenticate(req);
  if (!user) return res.status(401).json({ message: '로그인이 필요합니다.' });

  if (req.method === 'DELETE') {
    const { id } = req.body;
    if (!id) return res.status(400).json({ message: 'id required' });

    const { data: product } = await supabase.from('products').select('owner_id').eq('id', id).single();
    if (!product) return res.status(404).json({ message: '상품을 찾을 수 없습니다.' });
    if (product.owner_id !== user.id) return res.status(403).json({ message: '권한이 없습니다.' });

    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) return res.status(500).json({ message: error.message });
    return res.status(200).json({ success: true });
  }

  if (req.method !== 'POST') return res.status(405).end();

  const { id, name, price, shipping_fee, description, sizes, colors, images, is_hidden } = req.body;

  if (id) {
    const { data: product } = await supabase.from('products').select('owner_id').eq('id', id).single();
    if (!product) return res.status(404).json({ message: '상품을 찾을 수 없습니다.' });
    if (product.owner_id !== user.id) return res.status(403).json({ message: '권한이 없습니다.' });

    const patch = {};
    if (name !== undefined) patch.name = name;
    if (price !== undefined) patch.price = price;
    if (shipping_fee !== undefined) patch.shipping_fee = shipping_fee;
    if (description !== undefined) patch.description = description;
    if (sizes !== undefined) patch.sizes = sizes;
    if (colors !== undefined) patch.colors = colors;
    if (images !== undefined) patch.images = images;
    if (is_hidden !== undefined) patch.is_hidden = is_hidden;

    const { error } = await supabase.from('products').update(patch).eq('id', id);
    if (error) return res.status(500).json({ message: error.message });
    return res.status(200).json({ success: true });
  } else {
    const { data, error } = await supabase
      .from('products')
      .insert({ name, price, shipping_fee, description, sizes, colors, images, owner_id: user.id })
      .select('id')
      .single();
    if (error) return res.status(500).json({ message: error.message });
    return res.status(200).json({ success: true, id: data.id });
  }
};
