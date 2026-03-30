import { fmt, itemLabel, renderKVRows } from '../shared/format';
import type { Order } from '../types';

const STATUS_KO: Record<string, string> = {
  waiting_for_deposit: '입금 대기',
  paid: '배송 전',
  shipping: '배송 중',
  delivered: '배송 완료',
};

export class OrderService {
  async lookup(orderId: string, buyerPhone: string): Promise<Order> {
    const res = await fetch('/api/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, buyerPhone }),
    });
    if (!res.ok) {
      const { message } = await res.json();
      throw new Error(message || '주문을 찾을 수 없습니다.');
    }
    return res.json();
  }

  render(order: Order): string {
    const itemRows = (order.items || []).map(i =>
      `<div class="flex justify-between"><span class="text-gray-500">${itemLabel(i)} × ${i.quantity}</span><span>${fmt(i.unitPrice * i.quantity)}</span></div>`
    ).join('');
    const rows: [string, string][] = [
      ['주문번호', order.order_id],
      ['주문상태', STATUS_KO[order.status] || order.status],
      ['결제금액', fmt(order.amount || 0)],
      ['받는 분', order.buyer_name],
      ['연락처', order.buyer_phone],
      ['배송지', order.shipping_address],
      ...(order.shipping_memo ? [['배송 메모', order.shipping_memo] as [string, string]] : []),
    ];
    return renderKVRows(rows, itemRows);
  }
}
