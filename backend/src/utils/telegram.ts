export async function sendTelegramNotification(
  chatId: string,
  text: string
): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || !chatId || !text) {
    console.warn('Telegram notification skipped: missing token, chat_id, or text');
    return false;
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
      }),
    });
    type TelegramResponse = { ok: boolean; [key: string]: unknown };
    const data = await res.json() as TelegramResponse;
    if (!data.ok) {
      console.warn('Telegram sendMessage failed:', data);
    }
    return data.ok;
  } catch (e) {
    console.error('Telegram notification error:', e);
    return false;
  }
}

function tgRound(v: number): number {
  const mult = 100;
  return Math.round((v + Number.EPSILON) * mult) / mult;
}

export function formatDeliveryNotification(order: {
  orderNumber: string;
  email: string;
  username?: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  items?: Array<{ productName?: string; quantity: number; price: number; link?: string; smmServiceId?: string; smmOrderId?: string; smmProvider?: string }>;
  createdAt?: string;
  deliveryNote?: string;
}): string {
  const itemsList = order.items
    ?.map(
      (item, i) => {
        let line = `${i + 1}. ${item.productName || 'Product'} x${item.quantity} — ${tgRound(item.price).toFixed(2)} BDT`;
        if (item.link) line += `\n   🔗 ${item.link}`;
        if (item.smmServiceId) line += `\n   🆔 Service: ${item.smmServiceId}`;
        if (item.smmOrderId) line += `\n   📦 SMM Order: ${item.smmOrderId}`;
        return line;
      }
    )
    .join('\n');

  return (
    `<b>✅ Order Delivered!</b>\n` +
    `━━━━━━━━━━━━━━━━\n` +
    `<b>Order:</b> ${order.orderNumber}\n` +
    `<b>Email:</b> ${order.email}\n` +
    `<b>Username:</b> ${order.username || 'N/A'}\n` +
    `<b>Amount:</b> ${tgRound(order.amount).toFixed(2)} ${order.currency}\n` +
    `<b>Payment:</b> ${order.paymentMethod}\n` +
    (itemsList ? `\n<b>Items:</b>\n${itemsList}\n` : '') +
    (order.deliveryNote ? `━━━━━━━━━━━━━━━━\n<b>Note:</b> ${order.deliveryNote}\n` : '') +
    `━━━━━━━━━━━━━━━━\n` +
    `<i>Delivered successfully by admin</i>`
  );
}

export function formatOrderNotification(order: {
  orderNumber: string;
  email: string;
  username?: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  status: string;
  items?: Array<{ productName?: string; quantity: number; price: number; link?: string; smmServiceId?: string; smmProvider?: string }>;
  createdAt?: string;
}): string {
  const itemsList = order.items
    ?.map(
      (item, i) => {
        let line = `${i + 1}. ${item.productName || 'Product'} x${item.quantity} — ${tgRound(item.price).toFixed(2)} BDT`;
        if (item.link) line += `\n   🔗 ${item.link}`;
        if (item.smmServiceId) line += `\n   🆔 Service: ${item.smmServiceId}`;
        if (item.smmProvider) line += `\n   📡 Provider: ${item.smmProvider}`;
        return line;
      }
    )
    .join('\n');

  return (
    `<b>🆕 New Order Created!</b>\n` +
    `━━━━━━━━━━━━━━━━\n` +
    `<b>Order:</b> ${order.orderNumber}\n` +
    `<b>Email:</b> ${order.email}\n` +
    `<b>Username:</b> ${order.username || 'N/A'}\n` +
    `<b>Amount:</b> ${tgRound(order.amount).toFixed(2)} ${order.currency}\n` +
    `<b>Payment:</b> ${order.paymentMethod}\n` +
    `<b>Status:</b> ${order.status}\n` +
    `<b>Date:</b> ${order.createdAt ? new Date(order.createdAt).toLocaleString('en-BD') : new Date().toLocaleString('en-BD')}\n` +
    (itemsList ? `\n<b>Items:</b>\n${itemsList}\n` : '') +
    `━━━━━━━━━━━━━━━━`
  );
}
