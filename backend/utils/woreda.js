const normalizeWoreda = (value) =>
  (value || '')
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

const buildWoredaRegex = (value) => {
  const normalized = normalizeWoreda(value);
  if (!normalized) return null;

  const pattern = normalized.split('').join('\\W*');
  return new RegExp(pattern, 'i');
};

const isSameWoreda = (left, right) => normalizeWoreda(left) === normalizeWoreda(right);

module.exports = {
  normalizeWoreda,
  buildWoredaRegex,
  isSameWoreda
};
