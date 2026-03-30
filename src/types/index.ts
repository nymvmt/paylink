export interface Product {
  id: string;
  name: string;
  price: number;
  shipping_fee: number;
  description?: string;
  sizes?: string[];
  colors?: string[];
  images?: string[];
  is_hidden: boolean;
  owner_id: string;
  sort_order: number;
  created_at: string;
}

export interface CartItem {
  productId: string;
  productName: string;
  size: string;
  color: string;
  quantity: number;
  unitPrice: number;
  shippingFee: number;
}

export type OrderStatus = 'waiting_for_deposit' | 'paid' | 'shipping' | 'delivered';

export interface Order {
  id: string;
  order_id: string;
  created_at: string;
  status: OrderStatus;
  amount: number;
  items: CartItem[];
  buyer_name: string;
  buyer_phone: string;
  shipping_address: string;
  shipping_memo?: string;
  payment_method: string;
  owner_id: string;
}

export interface PendingOrder {
  orderId: string;
  buyerName: string;
  buyerPhone: string;
  shippingAddress: string;
  shippingMemo: string;
  amount: number;
  paymentMethod: string;
  items: CartItem[];
  ownerId: string;
}

export interface BrandSettings {
  brand_name?: string;
  owner_name?: string;
  business_number?: string;
  commerce_number?: string;
  business_address?: string;
  contact_phone?: string;
  instagram?: string;
  link?: string;
  notify_email?: string;
}

// CDN 전역 선언
declare global {
  function TossPayments(clientKey: string): {
    requestPayment(method: string, options: Record<string, unknown>): void;
  };
  const daum: {
    Postcode: new (options: {
      oncomplete: (data: { zonecode: string; roadAddress: string; jibunAddress: string }) => void;
    }) => { open: () => void };
  };
}
