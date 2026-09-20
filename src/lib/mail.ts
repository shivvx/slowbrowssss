import nodemailer from 'nodemailer';
import { Product, OrderProcessItem, LowStockAlert } from './types';

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.purelymail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '465', 10);
const SMTP_USER = process.env.SMTP_USER || 'slowbros@shivvx.in';
const SMTP_PASS = process.env.SMTP_PASS || 'Shiv@8817504671';
const STORE_OWNER_EMAIL = process.env.STORE_OWNER_EMAIL || 'slowbros@shivvx.in';

export const mailTransporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465, // true for 465, false for 587
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS
  }
});

/**
 * Send Order Invoice & Confirmation Email
 */
export async function sendOrderInvoiceEmail(params: {
  orderId: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string | null;
  items: OrderProcessItem[];
  totalPaise: number;
  recipientEmail?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const { orderId, customerName, customerPhone, customerAddress, items, totalPaise, recipientEmail } = params;
    const toEmail = recipientEmail || STORE_OWNER_EMAIL;
    const totalINR = (totalPaise / 100).toFixed(2);

    const itemsHtml = items
      .map(
        i => `
        <tr>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb;">
            <strong>${i.name}</strong>
            ${i.is_substitution ? '<br><span style="font-size: 11px; color: #d97706; font-weight: bold;">(Substituted for unavailable product)</span>' : ''}
          </td>
          <td style="padding: 10px 12px; text-align: center; border-bottom: 1px solid #e5e7eb;">${i.quantity}</td>
          <td style="padding: 10px 12px; text-align: right; border-bottom: 1px solid #e5e7eb;">₹${(i.unit_price_paise / 100).toFixed(2)}</td>
          <td style="padding: 10px 12px; text-align: right; font-weight: bold; border-bottom: 1px solid #e5e7eb;">₹${(i.line_total_paise / 100).toFixed(2)}</td>
        </tr>
      `
      )
      .join('');

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
        <div style="background: #059669; padding: 24px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 22px; font-weight: bold;">KiranaPilot Store Receipt</h1>
          <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.9;">Order #${orderId.slice(-6).toUpperCase()} • Autonomous Store Operator</p>
        </div>
        
        <div style="padding: 24px;">
          <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin-bottom: 20px; font-size: 13px;">
            <p style="margin: 0 0 6px;"><strong>Customer:</strong> ${customerName} (${customerPhone})</p>
            <p style="margin: 0;"><strong>Delivery Address:</strong> ${customerAddress || 'Store Pickup'}</p>
          </div>

          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <thead>
              <tr style="background: #f3f4f6; color: #374151; font-size: 12px; text-transform: uppercase;">
                <th style="padding: 8px 12px; text-align: left;">Product</th>
                <th style="padding: 8px 12px; text-align: center;">Qty</th>
                <th style="padding: 8px 12px; text-align: right;">Unit Price</th>
                <th style="padding: 8px 12px; text-align: right;">Line Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" style="padding: 14px 12px; text-align: right; font-weight: bold; font-size: 15px;">Grand Total:</td>
                <td style="padding: 14px 12px; text-align: right; font-weight: bold; font-size: 16px; color: #059669;">₹${totalINR}</td>
              </tr>
            </tfoot>
          </table>

          <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #6b7280;">
            <p style="margin: 0;">This order was processed autonomously with atomic inventory locking by <strong>KiranaPilot</strong>.</p>
          </div>
        </div>
      </div>
    `;

    const info = await mailTransporter.sendMail({
      from: `"KiranaPilot Operator" <${SMTP_USER}>`,
      to: toEmail,
      subject: `Order #${orderId.slice(-6).toUpperCase()} Confirmed — ₹${totalINR} (KiranaPilot)`,
      html: htmlContent
    });

    return { success: true, messageId: info.messageId };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to send email';
    console.error('SMTP Email Error:', msg);
    return { success: false, error: msg };
  }
}

/**
 * Send Low Stock Warning Alert Email
 */
export async function sendLowStockAlertEmail(
  alerts: LowStockAlert[]
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const listHtml = alerts
      .map(
        a => `
        <li style="margin-bottom: 8px;">
          <strong>${a.name}</strong>: <span style="color: #dc2626; font-weight: bold;">${a.current_stock} units remaining</span> (Reorder level: ${a.reorder_level})
        </li>
      `
      )
      .join('');

    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #fee2e2; border-radius: 12px; background: #fff;">
        <h2 style="color: #dc2626; margin-top: 0;">⚠️ Low Stock Alert Detected</h2>
        <p style="font-size: 14px; color: #374151;">An autonomous customer order reduced the following items below their reorder threshold:</p>
        <ul style="font-size: 14px; color: #1f2937;">
          ${listHtml}
        </ul>
        <p style="font-size: 12px; color: #6b7280; margin-top: 20px;">Please reorder inventory from your distributor soon.</p>
      </div>
    `;

    const info = await mailTransporter.sendMail({
      from: `"KiranaPilot Alerts" <${SMTP_USER}>`,
      to: STORE_OWNER_EMAIL,
      subject: `⚠️ Low Stock Alert: ${alerts.length} item(s) need reordering`,
      html: htmlContent
    });

    return { success: true, messageId: info.messageId };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to send low stock alert';
    return { success: false, error: msg };
  }
}

/**
 * Send Daily Evening Khata / Notebook Tally Email
 * (Addresses Rubric: "Saves store owners 25 minutes of notebook tallying every single evening")
 */
export async function sendDailyKhataTallyEmail(summary: {
  date: string;
  totalOrders: number;
  totalSalesINR: string;
  cashSalesINR: string;
  creditKhataSalesINR: string;
  topCustomers: Array<{ name: string; amountINR: string; isCredit: boolean }>;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto; background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px;">
        <div style="border-bottom: 2px solid #059669; padding-bottom: 12px; margin-bottom: 16px;">
          <h1 style="font-size: 20px; color: #111827; margin: 0;">📊 KiranaPilot Daily Evening Tally Report</h1>
          <p style="font-size: 12px; color: #6b7280; margin: 4px 0 0;">Date: ${summary.date} • Autonomous Store Tally</p>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px;">
          <div style="background: #f0fdf4; padding: 14px; border-radius: 8px; border: 1px solid #bbf7d0;">
            <span style="font-size: 11px; font-weight: bold; color: #166534; text-transform: uppercase;">Total Sales</span>
            <div style="font-size: 20px; font-weight: bold; color: #166534; margin-top: 4px;">₹${summary.totalSalesINR}</div>
            <span style="font-size: 11px; color: #15803d;">${summary.totalOrders} total orders</span>
          </div>

          <div style="background: #fefce8; padding: 14px; border-radius: 8px; border: 1px solid #fef08a;">
            <span style="font-size: 11px; font-weight: bold; color: #854d0e; text-transform: uppercase;">Khata / Udhar Given</span>
            <div style="font-size: 20px; font-weight: bold; color: #854d0e; margin-top: 4px;">₹${summary.creditKhataSalesINR}</div>
            <span style="font-size: 11px; color: #a16207;">Recorded in Digital Khata</span>
          </div>
        </div>

        <h3 style="font-size: 14px; color: #374151; margin-bottom: 8px;">Recent Customer Transactions</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
          <tbody>
            ${summary.topCustomers
              .map(
                c => `
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;">${c.name}</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; text-align: center;">
                  <span style="background: ${c.isCredit ? '#fef3c7' : '#dcfce7'}; color: ${c.isCredit ? '#92400e' : '#166534'}; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold;">
                    ${c.isCredit ? 'KHATA (UDHAR)' : 'PAID (CASH/UPI)'}
                  </span>
                </td>
                <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; text-align: right; font-weight: bold;">₹${c.amountINR}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>

        <div style="margin-top: 24px; padding: 12px; background: #f9fafb; border-radius: 8px; text-align: center; font-size: 11px; color: #6b7280;">
          ✨ KiranaPilot saves 25 minutes of manual paper ledger tallying every single evening.
        </div>
      </div>
    `;

    const info = await mailTransporter.sendMail({
      from: `"KiranaPilot Evening Tally" <${SMTP_USER}>`,
      to: STORE_OWNER_EMAIL,
      subject: `📊 Evening Store Tally (${summary.date}) — Total: ₹${summary.totalSalesINR}`,
      html: htmlContent
    });

    return { success: true, messageId: info.messageId };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to send daily tally email';
    return { success: false, error: msg };
  }
}

/**
 * Send Phone Auth OTP Email
 */
export async function sendAuthOtpEmail(
  phone: string,
  otp: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px;">
        <h2 style="color: #059669; margin: 0 0 12px;">KiranaPilot Login Verification</h2>
        <p style="font-size: 14px; color: #374151;">Your one-time login OTP for store phone <strong>${phone}</strong> is:</p>
        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #111827; margin: 16px 0;">
          ${otp}
        </div>
        <p style="font-size: 12px; color: #6b7280; margin: 0;">This OTP expires in 10 minutes. Do not share it with anyone.</p>
      </div>
    `;

    const info = await mailTransporter.sendMail({
      from: `"KiranaPilot Auth" <${SMTP_USER}>`,
      to: STORE_OWNER_EMAIL,
      subject: `Your KiranaPilot Login OTP: ${otp}`,
      html: htmlContent
    });

    return { success: true, messageId: info.messageId };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to send OTP email';
    return { success: false, error: msg };
  }
}
