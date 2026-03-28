const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ message: '로그인이 필요합니다.' });
  const { data: { user } } = await supabase.auth.getUser(auth.slice(7));
  if (!user) return res.status(401).json({ message: '로그인이 필요합니다.' });

  const { fileName, fileData, contentType } = req.body;

  if (!ALLOWED_TYPES.includes(contentType)) {
    return res.status(400).json({ message: '이미지 파일(JPEG/PNG/WebP/GIF)만 업로드 가능합니다.' });
  }

  const buffer = Buffer.from(fileData, 'base64');
  if (buffer.length > MAX_BYTES) {
    return res.status(400).json({ message: '파일 크기는 5MB 이하여야 합니다.' });
  }

  const ext = (fileName.split('.').pop() || 'jpg').toLowerCase();
  const path = `${user.id}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from('product-images')
    .upload(path, buffer, { contentType, upsert: true });

  if (error) return res.status(500).json({ message: error.message });

  const { data } = supabase.storage.from('product-images').getPublicUrl(path);
  return res.status(200).json({ url: data.publicUrl });
};
