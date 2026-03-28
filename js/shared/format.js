export const fmt = n => `${n.toLocaleString()}원`;

export const itemLabel = i => [i.productName, i.size, i.color].filter(Boolean).join(' / ');

export function renderKVRows(rows, itemRows) {
  return rows.map(([k, v]) =>
    `<div class="flex justify-between"><span class="text-gray-500">${k}</span><span class="font-medium">${v}</span></div>`
  ).join('') + (itemRows ? `<div class="border-t border-gray-100 pt-2 mt-2 space-y-1">${itemRows}</div>` : '');
}
