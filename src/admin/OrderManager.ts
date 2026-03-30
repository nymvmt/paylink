import { supabase } from '../shared/supabaseClient';
import type { AuthService } from './AuthService';
import type { Order } from '../types';

const STATUS_MAP: Record<string, string> = {
  waiting_for_deposit: '입금 대기',
  paid: '배송 전',
  shipping: '배송 중',
  delivered: '배송 완료',
};

export class OrderManager {
  constructor(private auth: AuthService) {}

  async load(): Promise<void> {
    const { data, error } = await supabase.from('orders')
      .select('*').eq('owner_id', this.auth.currentUser!.id).order('created_at', { ascending: false });
    const orders: Order[] = error ? [] : (data || []);
    const el = document.getElementById('orders-table')!;
    if (orders.length === 0) {
      el.innerHTML = '<p class="text-sm text-gray-400 text-center py-8">주문이 없습니다.</p>';
      return;
    }
    el.innerHTML = `
      <table class="text-xs border-collapse whitespace-nowrap">
        <thead>
          <tr class="border-b border-gray-200 text-left text-gray-400">
            <th class="py-2 pr-4 font-medium">주문번호</th>
            <th class="py-2 pr-4 font-medium">주문일시</th>
            <th class="py-2 pr-4 font-medium">구매자</th>
            <th class="py-2 pr-4 font-medium">연락처</th>
            <th class="py-2 pr-4 font-medium">금액</th>
            <th class="py-2 pr-4 font-medium">배송 상태</th>
            <th class="py-2 font-medium">상품</th>
          </tr>
        </thead>
        <tbody>${orders.map(o => this._row(o)).join('')}</tbody>
      </table>`;
  }

  async updateStatus(id: string, nextStatus: string): Promise<boolean> {
    const res = await fetch('/api/order-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${await this.auth.getToken()}` },
      body: JSON.stringify({ id, status: nextStatus }),
    });
    if (!res.ok) { alert('상태 변경에 실패했습니다.'); return false; }
    return true;
  }

  private _row(o: Order): string {
    const items = (o.items || []).map(i =>
      [i.productName, i.size, i.color].filter(Boolean).join('/') + `×${i.quantity}`
    ).join(', ');
    const d = o.created_at ? new Date(o.created_at) : null;
    const dt = d ? d.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }) : '-';
    const status = o.status || 'paid';
    const editableStatuses = Object.entries(STATUS_MAP).filter(([val]) => val !== 'waiting_for_deposit');
    const statusCell = status === 'waiting_for_deposit'
      ? `<span class="text-gray-400">${STATUS_MAP['waiting_for_deposit']}</span>`
      : `<select onchange="updateOrderStatus('${o.id}', this.value)" class="border border-gray-200 rounded px-1 py-0.5 bg-white focus:outline-none focus:border-gray-400 text-xs">
          ${editableStatuses.map(([val, label]) => `<option value="${val}" ${val === status ? 'selected' : ''}>${label}</option>`).join('')}
        </select>`;
    return `<tr class="border-b border-gray-100 hover:bg-gray-50">
      <td class="py-2 pr-4 font-mono text-gray-400">${o.order_id || '-'}</td>
      <td class="py-2 pr-4 text-gray-500">${dt}</td>
      <td class="py-2 pr-4">${o.buyer_name || '-'}</td>
      <td class="py-2 pr-4">${o.buyer_phone || '-'}</td>
      <td class="py-2 pr-4">${(o.amount || 0).toLocaleString()}원</td>
      <td class="py-2 pr-4">${statusCell}</td>
      <td class="py-2 text-gray-500">${items || '-'}</td>
    </tr>`;
  }
}
