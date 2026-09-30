/* LocalStorage management and defaults for Nila Inn Invoices */

import { pad, iso, addDays } from './calculations.js';

export const KEY_INV = 'nila-invoices-v1';
export const KEY_SET = 'nila-invoice-settings-v1';
export const KEY_DRAFT = 'nila-invoice-draft-v1';

export const DEFAULTS = {
  name: 'Nila Inn Residency',
  tagline: 'Where Comfort meets Tradition',
  address: 'Kuruvan Poyil, Thalavil\nEruvatti PO, Chapparappadavu\nKannur 670581, Kerala',
  phones: '+91 89218 08207 · +91 80755 83184',
  gstin: '',
  prefix: 'NIR-' + new Date().getFullYear() + '-',
  next: 1,
  room: 'A/C Room',
  rate: '',
  notes: 'Thank you for staying at Nila Inn Residency.',
};

export function loadStorage(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch (e) {
    console.error('Storage load error:', e);
    return fallback;
  }
}

export function saveStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.error('Storage save error:', e);
    return false;
  }
}

export function createBlankInvoice(settings) {
  const currentSettings = settings || DEFAULTS;
  const today = iso(new Date());
  return {
    id: null,
    number: currentSettings.prefix + pad(currentSettings.next),
    date: today,
    guest: {
      name: '',
      phone: '',
      address: '',
      count: 1,
    },
    stay: {
      room: currentSettings.room,
      inDate: today,
      inTime: '',
      outDate: addDays(today, 1),
      outTime: '',
      rate: currentSettings.rate === '' ? '' : +currentSettings.rate,
    },
    extras: [],
    discount: '',
    gst: {
      on: false,
      mode: 'auto',
    },
    pay: {
      advance: '',
      mode: 'Cash',
    },
    notes: currentSettings.notes,
  };
}
