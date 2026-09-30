/* Utility calculation and formatting functions for Nila Inn Invoices */

export function pad(n) {
  return String(n).padStart(3, '0');
}

export function iso(d) {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 10);
}

export function addDays(s, n) {
  if (!s) return '';
  const d = new Date(s + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return iso(d);
}

export function r2(n) {
  return Math.round((+n || 0) * 100) / 100;
}

const fmtN = new Intl.NumberFormat('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function money(n) {
  return '₹' + fmtN.format(r2(n));
}

export function dateLong(s) {
  if (!s) return '';
  const d = new Date(s + 'T00:00:00');
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function timeLong(s) {
  if (!s) return '';
  const p = s.split(':');
  const h = +p[0];
  const m = p[1];
  return ((h % 12) || 12) + ':' + m + (h < 12 ? ' AM' : ' PM');
}

export function uid() {
  return 'i' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/* Indian numbering words converter (Lakh and Crore) */
const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen'
];
const TENS = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
];

function two(n) {
  return n < 20 ? ONES[n] : TENS[Math.floor(n / 10)] + (n % 10 ? ' ' + ONES[n % 10] : '');
}

function three(n) {
  const h = Math.floor(n / 100);
  const r = n % 100;
  return (h ? ONES[h] + ' Hundred' + (r ? ' ' : '') : '') + (r ? two(r) : '');
}

export function words(amount) {
  amount = r2(amount);
  let r = Math.floor(amount);
  const p = Math.round((amount - r) * 100);

  if (r === 0 && p === 0) return 'Zero Rupees Only';

  const parts = [];
  const cr = Math.floor(r / 1e7);
  r %= 1e7;
  const lk = Math.floor(r / 1e5);
  r %= 1e5;
  const th = Math.floor(r / 1000);
  r %= 1000;

  if (cr) parts.push(three(cr) + ' Crore');
  if (lk) parts.push(two(lk) + ' Lakh');
  if (th) parts.push(two(th) + ' Thousand');
  if (r) parts.push(three(r));

  let s = parts.length ? 'Rupees ' + parts.join(' ') : 'Rupees Zero';
  if (p) s += ' and ' + two(p) + ' Paise';
  return s + ' Only';
}

export function nights(inv) {
  if (!inv.stay.inDate || !inv.stay.outDate) return 1;
  const inD = new Date(inv.stay.inDate + 'T00:00:00');
  const outD = new Date(inv.stay.outDate + 'T00:00:00');
  const n = Math.round((outD - inD) / 864e5);
  return Math.max(1, n || 0);
}

export function gstRate(inv) {
  if (!inv.gst.on) return 0;
  if (inv.gst.mode !== 'auto') return +inv.gst.mode;
  const rate = +inv.stay.rate || 0;
  return rate < 1000 ? 0 : rate <= 7500 ? 5 : 18;
}

export function totals(inv) {
  const n = nights(inv);
  const room = r2(n * (+inv.stay.rate || 0));
  const extras = (inv.extras || []).reduce(
    (a, x) => a + r2((+x.q || 0) * (+x.r || 0)),
    0
  );
  const sub = r2(room + extras);
  const disc = Math.min(r2(+inv.discount || 0), sub);
  const taxable = r2(sub - disc);
  const rate = gstRate(inv);
  const gst = r2((taxable * rate) / 100);
  const cgst = r2(gst / 2);
  const sgst = r2(gst - cgst);
  const exact = r2(taxable + gst);
  const grand = Math.round(exact);
  const round = r2(grand - exact);
  const paid = r2(+inv.pay.advance || 0);
  const bal = r2(grand - paid);
  const status = grand > 0 && bal <= 0 ? 'paid' : paid > 0 ? 'part' : 'due';

  return {
    n,
    room,
    extras,
    sub,
    disc,
    taxable,
    rate,
    gst,
    cgst,
    sgst,
    round,
    grand,
    paid,
    bal,
    status,
  };
}

export const STATUS = {
  paid: 'PAID',
  part: 'PART PAID',
  due: 'DUE',
};
