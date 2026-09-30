import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header.jsx';
import InvoiceForm from './components/InvoiceForm.jsx';
import InvoicePreview from './components/InvoicePreview.jsx';
import SavedDrawer from './components/SavedDrawer.jsx';
import SettingsDrawer from './components/SettingsDrawer.jsx';
import AuthModal from './components/AuthModal.jsx';
import Toast from './components/Toast.jsx';

import {
  KEY_INV,
  KEY_SET,
  KEY_DRAFT,
  DEFAULTS,
  loadStorage,
  saveStorage,
  createBlankInvoice,
} from './utils/storage.js';

import {
  pad,
  iso,
  dateLong,
  money,
  totals,
  uid,
} from './utils/calculations.js';

import { getMe, logoutUser } from './services/api.js';

import './App.css';

export default function App() {
  const [settings, setSettings] = useState(() =>
    Object.assign({}, DEFAULTS, loadStorage(KEY_SET, {}))
  );
  const [invoices, setInvoices] = useState(() => loadStorage(KEY_INV, []));
  const [invoice, setInvoice] = useState(() => {
    const draft = loadStorage(KEY_DRAFT, null);
    return draft || createBlankInvoice(settings);
  });

  const [activeView, setActiveView] = useState('edit');
  const [savedDrawerOpen, setSavedDrawerOpen] = useState(false);
  const [settingsDrawerOpen, setSettingsDrawerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [validationError, setValidationError] = useState('');
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  const toastTimerRef = useRef(null);

  // Show temporary toast message
  const triggerToast = (msg) => {
    setToastMessage(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage('');
    }, 2200);
  };

  // Verify authentication on mount
  useEffect(() => {
    getMe()
      .then((currUser) => {
        if (currUser) setUser(currUser);
      })
      .catch((err) => {
        console.warn('Auth check notice:', err.message);
      })
      .finally(() => {
        setAuthChecked(true);
      });
  }, []);

  // Save draft to localStorage whenever invoice state changes
  useEffect(() => {
    saveStorage(KEY_DRAFT, invoice);
  }, [invoice]);

  // Handle escape key to close drawers
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSavedDrawerOpen(false);
        setSettingsDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle item actions
  const handleAddItem = (d = '') => {
    const nextExtras = [...(invoice.extras || []), { d, q: 1, r: '' }];
    setInvoice({ ...invoice, extras: nextExtras });
  };

  const handleUpdateItem = (index, field, value) => {
    const nextExtras = [...(invoice.extras || [])];
    nextExtras[index] = { ...nextExtras[index], [field]: value };
    setInvoice({ ...invoice, extras: nextExtras });
  };

  const handleRemoveItem = (index) => {
    const nextExtras = (invoice.extras || []).filter((_, i) => i !== index);
    setInvoice({ ...invoice, extras: nextExtras });
  };

  const handleQuickAdd = (description) => {
    handleAddItem(description);
  };

  const handleMarkFullPaid = () => {
    const t = totals(invoice);
    setInvoice({
      ...invoice,
      pay: {
        ...(invoice.pay || {}),
        advance: t.grand,
      },
    });
  };

  // Validate form
  const validateInvoice = () => {
    const guestName = invoice.guest?.name?.trim();
    const rate = +invoice.stay?.rate;
    if (!guestName || !(rate > 0)) {
      setValidationError('Add the guest name and the rate per night to save this invoice.');
      setActiveView('edit');
      return false;
    }
    setValidationError('');
    return true;
  };

  // Save current invoice
  const handleSaveInvoice = () => {
    if (!validateInvoice()) return false;

    const isNew = !invoice.id;
    let currentSettings = { ...settings };
    let currentInvoice = { ...invoice };

    if (isNew) {
      if (invoices.some((x) => x.number === currentInvoice.number)) {
        setValidationError(
          `Invoice number ${currentInvoice.number} is already used. Change it before saving.`
        );
        setActiveView('edit');
        return false;
      }
      currentInvoice.id = uid();

      // Auto-increment next number if matching default prefix and next
      if (currentInvoice.number === currentSettings.prefix + pad(currentSettings.next)) {
        currentSettings.next = +currentSettings.next + 1;
        setSettings(currentSettings);
        saveStorage(KEY_SET, currentSettings);
      }
    }

    const t = totals(currentInvoice);
    const copy = {
      ...currentInvoice,
      savedAt: Date.now(),
      total: t.grand,
      status: t.status,
    };

    let updatedList;
    const existingIndex = invoices.findIndex((x) => x.id === currentInvoice.id);
    if (existingIndex >= 0) {
      updatedList = [...invoices];
      updatedList[existingIndex] = copy;
    } else {
      updatedList = [copy, ...invoices];
    }

    setInvoices(updatedList);
    setInvoice(currentInvoice);
    saveStorage(KEY_INV, updatedList);
    saveStorage(KEY_DRAFT, currentInvoice);

    triggerToast((isNew ? 'Saved ' : 'Updated ') + currentInvoice.number);
    return true;
  };

  // Start a new blank invoice
  const handleNewInvoice = () => {
    const newInv = createBlankInvoice(settings);
    setInvoice(newInv);
    setValidationError('');
    setActiveView('edit');
    triggerToast('New invoice ' + newInv.number);
  };

  // Print invoice
  const handlePrint = () => {
    if (!validateInvoice()) return;
    if (!invoice.id) {
      handleSaveInvoice();
    }
    setTimeout(() => {
      window.print();
    }, 50);
  };

  // Send WhatsApp message
  const handleWhatsApp = () => {
    const t = totals(invoice);
    const s = settings;
    let phoneDigits = String(invoice.guest?.phone || '').replace(/\D/g, '');
    if (phoneDigits.length === 10) phoneDigits = '91' + phoneDigits;

    const text =
      `${s.name}\nInvoice ${invoice.number} · ${dateLong(invoice.date)}\n\n` +
      `Guest: ${invoice.guest?.name || '-'}\n` +
      `Stay: ${dateLong(invoice.stay?.inDate)} to ${dateLong(invoice.stay?.outDate)} (${t.n} ${t.n > 1 ? 'nights' : 'night'})\n` +
      `Total: ${money(t.grand)}\nPaid: ${money(t.paid)}\nBalance due: ${money(Math.max(0, t.bal))}\n\n` +
      `${invoice.notes || 'Thank you for staying with us.'}\n${s.phones}`;

    const url = `https://wa.me/${phoneDigits.length >= 11 ? phoneDigits : ''}?text=${encodeURIComponent(text)}`;
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  // Open existing saved invoice
  const handleOpenSavedInvoice = (x) => {
    setInvoice(JSON.parse(JSON.stringify(x)));
    setValidationError('');
    setActiveView('preview');
    triggerToast('Opened ' + x.number);
  };

  // Duplicate invoice
  const handleDuplicateSavedInvoice = (x) => {
    const dup = JSON.parse(JSON.stringify(x));
    dup.id = null;
    dup.number = settings.prefix + pad(settings.next);
    dup.date = iso(new Date());
    if (dup.pay) dup.pay.advance = '';
    setInvoice(dup);
    setValidationError('');
    setActiveView('edit');
    triggerToast('Copied to new invoice ' + dup.number);
  };

  // Delete invoice
  const handleDeleteSavedInvoice = (id) => {
    const target = invoices.find((v) => v.id === id);
    const updated = invoices.filter((v) => v.id !== id);
    setInvoices(updated);
    saveStorage(KEY_INV, updated);
    triggerToast(`Deleted ${target?.number || 'invoice'}`);
  };

  // Update Settings
  const handleUpdateSettings = (newSettings) => {
    const oldPrefix = settings.prefix + pad(settings.next);
    setSettings(newSettings);
    saveStorage(KEY_SET, newSettings);

    // If current invoice is still unedited new, update its number
    if (!invoice.id && invoice.number === oldPrefix) {
      setInvoice((prev) => ({
        ...prev,
        number: newSettings.prefix + pad(newSettings.next),
      }));
    }
  };

  // Import Backup
  const handleImportBackup = (data) => {
    const existingIds = new Set(invoices.map((x) => x.id));
    const addedInvoices = data.invoices.filter((x) => x && x.id && !existingIds.has(x.id));
    const mergedInvoices = [...invoices, ...addedInvoices];

    let mergedSettings = settings;
    if (data.settings) {
      mergedSettings = Object.assign({}, DEFAULTS, data.settings, {
        next: Math.max(+settings.next || 1, +data.settings.next || 1),
      });
      setSettings(mergedSettings);
      saveStorage(KEY_SET, mergedSettings);
    }

    setInvoices(mergedInvoices);
    saveStorage(KEY_INV, mergedInvoices);
    triggerToast(`Restored ${addedInvoices.length} invoice${addedInvoices.length === 1 ? '' : 's'}`);
  };

  // Logout
  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
    setSettingsDrawerOpen(false);
    triggerToast('Logged out');
  };

  return (
    <>
      <Header
        savedCount={invoices.length}
        onNew={handleNewInvoice}
        onOpenSaved={() => setSavedDrawerOpen(true)}
        onOpenSettings={() => setSettingsDrawerOpen(true)}
        onWhatsApp={handleWhatsApp}
        onSave={handleSaveInvoice}
        onPrint={handlePrint}
        activeView={activeView}
        setActiveView={setActiveView}
      />

      <main className="app" data-view={activeView}>
        <InvoiceForm
          invoice={invoice}
          onChange={setInvoice}
          onAddItem={handleAddItem}
          onUpdateItem={handleUpdateItem}
          onRemoveItem={handleRemoveItem}
          onQuickAdd={handleQuickAdd}
          onMarkFullPaid={handleMarkFullPaid}
          validationError={validationError}
          setValidationError={setValidationError}
        />

        <InvoicePreview invoice={invoice} settings={settings} />
      </main>

      {/* Saved Invoices Drawer */}
      <SavedDrawer
        isOpen={savedDrawerOpen}
        onClose={() => setSavedDrawerOpen(false)}
        invoices={invoices}
        onOpenInvoice={handleOpenSavedInvoice}
        onDuplicateInvoice={handleDuplicateSavedInvoice}
        onDeleteInvoice={handleDeleteSavedInvoice}
      />

      {/* Settings Drawer */}
      <SettingsDrawer
        isOpen={settingsDrawerOpen}
        onClose={() => setSettingsDrawerOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        user={user}
        onLogout={handleLogout}
        invoices={invoices}
        onImportBackup={handleImportBackup}
        onToast={triggerToast}
      />

      {/* Auth Modal when not signed in */}
      {authChecked && !user && (
        <AuthModal
          onLoginSuccess={(loggedInUser) => {
            setUser(loggedInUser);
            triggerToast(`Welcome, ${loggedInUser.name}!`);
          }}
        />
      )}

      {/* Toast notifications */}
      <Toast message={toastMessage} />
    </>
  );
}
