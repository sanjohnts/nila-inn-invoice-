/* Nila Inn Residency — invoice maker
   Everything runs in the browser. Invoices and settings are stored in localStorage.
   To change the default business details, edit DEFAULTS below (or use Settings in the app). */

(function(){
  var EMBLEM = 'images/emblem.jpg';
  var KEY_INV = 'nila-invoices-v1', KEY_SET = 'nila-invoice-settings-v1', KEY_DRAFT = 'nila-invoice-draft-v1';

  /* ---------- storage (safe) ---------- */
  function load(k, fb){ try{ var v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; }catch(e){ return fb; } }
  function store(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); return true; }catch(e){ return false; } }

  var DEFAULTS = {
    name:'Nila Inn Residency', tagline:'Where Comfort meets Tradition',
    address:'Kuruvan Poyil, Thalavil\nEruvatti PO, Chapparappadavu\nKannur 670581, Kerala',
    phones:'+91 89218 08207 · +91 80755 83184', gstin:'',
    prefix:'NIR-' + new Date().getFullYear() + '-', next:1, room:'A/C Room', rate:'',
    notes:'Thank you for staying at Nila Inn Residency.'
  };
  var settings = Object.assign({}, DEFAULTS, load(KEY_SET, {}));
  var invoices = load(KEY_INV, []);

  /* ---------- helpers ---------- */
  function $(id){ return document.getElementById(id); }
  function pad(n){ return String(n).padStart(3, '0'); }
  function iso(d){ var z = new Date(d.getTime() - d.getTimezoneOffset() * 60000); return z.toISOString().slice(0, 10); }
  function addDays(s, n){ var d = new Date(s + 'T00:00:00'); d.setDate(d.getDate() + n); return iso(d); }
  function r2(n){ return Math.round((+n || 0) * 100) / 100; }
  var fmtN = new Intl.NumberFormat('en-IN', { minimumFractionDigits:2, maximumFractionDigits:2 });
  function money(n){ return '₹' + fmtN.format(r2(n)); }
  function dLong(s){ if(!s) return ''; var d = new Date(s + 'T00:00:00'); return d.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }); }
  function tLong(s){ if(!s) return ''; var p = s.split(':'), h = +p[0], m = p[1]; return ((h % 12) || 12) + ':' + m + (h < 12 ? ' AM' : ' PM'); }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; }); }
  function uid(){ return 'i' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function get(o, path){ return path.split('.').reduce(function(a, k){ return a == null ? a : a[k]; }, o); }
  function set(o, path, v){ var ks = path.split('.'), last = ks.pop(); ks.reduce(function(a, k){ return a[k]; }, o)[last] = v; }

  /* Indian numbering: lakh and crore */
  var ONES = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  var TENS = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  function two(n){ return n < 20 ? ONES[n] : TENS[Math.floor(n / 10)] + (n % 10 ? ' ' + ONES[n % 10] : ''); }
  function three(n){ var h = Math.floor(n / 100), r = n % 100; return (h ? ONES[h] + ' Hundred' + (r ? ' ' : '') : '') + (r ? two(r) : ''); }
  function words(amount){
    amount = r2(amount); var r = Math.floor(amount), p = Math.round((amount - r) * 100);
    if(r === 0 && p === 0) return 'Zero Rupees Only';
    var parts = [], cr = Math.floor(r / 1e7); r %= 1e7;
    var lk = Math.floor(r / 1e5); r %= 1e5; var th = Math.floor(r / 1000); r %= 1000;
    if(cr) parts.push(three(cr) + ' Crore'); if(lk) parts.push(two(lk) + ' Lakh'); if(th) parts.push(two(th) + ' Thousand'); if(r) parts.push(three(r));
    var s = parts.length ? 'Rupees ' + parts.join(' ') : 'Rupees Zero';
    if(p) s += ' and ' + two(p) + ' Paise';
    return s + ' Only';
  }

  /* ---------- invoice model ---------- */
  function blank(){
    var today = iso(new Date());
    return {
      id:null, number:settings.prefix + pad(settings.next), date:today,
      guest:{ name:'', phone:'', address:'', count:1 },
      stay:{ room:settings.room, inDate:today, inTime:'', outDate:addDays(today, 1), outTime:'', rate:settings.rate === '' ? '' : +settings.rate },
      extras:[], discount:'', gst:{ on:false, mode:'auto' }, pay:{ advance:'', mode:'Cash' },
      notes:settings.notes
    };
  }
  function nights(inv){
    if(!inv.stay.inDate || !inv.stay.outDate) return 1;
    var n = Math.round((new Date(inv.stay.outDate + 'T00:00:00') - new Date(inv.stay.inDate + 'T00:00:00')) / 864e5);
    return Math.max(1, n || 0);
  }
  function gstRate(inv){
    if(!inv.gst.on) return 0;
    if(inv.gst.mode !== 'auto') return +inv.gst.mode;
    var rate = +inv.stay.rate || 0;
    return rate < 1000 ? 0 : rate <= 7500 ? 5 : 18;
  }
  function totals(inv){
    var n = nights(inv), room = r2(n * (+inv.stay.rate || 0));
    var extras = inv.extras.reduce(function(a, x){ return a + r2((+x.q || 0) * (+x.r || 0)); }, 0);
    var sub = r2(room + extras), disc = Math.min(r2(+inv.discount || 0), sub), taxable = r2(sub - disc);
    var rate = gstRate(inv), gst = r2(taxable * rate / 100), cgst = r2(gst / 2), sgst = r2(gst - cgst);
    var exact = r2(taxable + gst), grand = Math.round(exact), round = r2(grand - exact);
    var paid = r2(+inv.pay.advance || 0), bal = r2(grand - paid);
    var status = grand > 0 && bal <= 0 ? 'paid' : paid > 0 ? 'part' : 'due';
    return { n:n, room:room, extras:extras, sub:sub, disc:disc, taxable:taxable, rate:rate, gst:gst, cgst:cgst, sgst:sgst, round:round, grand:grand, paid:paid, bal:bal, status:status };
  }
  var STATUS = { paid:'PAID', part:'PART PAID', due:'DUE' };

  var inv = load(KEY_DRAFT, null) || blank();

  /* ---------- editor <-> state ---------- */
  var form = $('form');
  function fill(){
    form.querySelectorAll('[data-k]').forEach(function(el){
      var v = get(inv, el.getAttribute('data-k'));
      if(el.hasAttribute('data-bool')) el.checked = !!v; else el.value = v == null ? '' : v;
    });
    renderItems();
  }
  form.addEventListener('input', function(e){
    var el = e.target, k = el.getAttribute('data-k');
    if(k){
      var v = el.hasAttribute('data-bool') ? el.checked : el.value;
      if(el.hasAttribute('data-num')) v = v === '' ? '' : +v;
      set(inv, k, v);
      if(k === 'stay.inDate' && inv.stay.outDate && inv.stay.outDate <= v){ inv.stay.outDate = addDays(v, 1); $('f-out').value = inv.stay.outDate; }
      el.closest('.field') && el.closest('.field').classList.remove('error');
    }
    var it = el.closest('.item');
    if(it){ var i = +it.getAttribute('data-i'); inv.extras[i][el.getAttribute('data-f')] = el.getAttribute('data-f') === 'd' ? el.value : (el.value === '' ? '' : +el.value); }
    update();
  });

  function renderItems(){
    var box = $('items');
    box.innerHTML = inv.extras.map(function(x, i){
      return '<div class="item" data-i="' + i + '">' +
        '<input data-f="d" value="' + esc(x.d) + '" placeholder="Description" aria-label="Description">' +
        '<input data-f="q" type="number" min="0" step="1" value="' + esc(x.q) + '" aria-label="Quantity">' +
        '<input data-f="r" type="number" min="0" step="1" value="' + esc(x.r) + '" placeholder="0" aria-label="Rate">' +
        '<button type="button" class="x" data-del="' + i + '" aria-label="Remove line">✕</button></div>';
    }).join('');
    $('itemHead').hidden = !inv.extras.length;
  }
  function addItem(d){ inv.extras.push({ d:d || '', q:1, r:'' }); renderItems(); update(); var ins = $('items').querySelectorAll('.item:last-child input'); (d ? ins[2] : ins[0]).focus(); }
  $('bAddItem').addEventListener('click', function(){ addItem(''); });
  $('quick').addEventListener('click', function(e){ var b = e.target.closest('[data-add]'); if(b) addItem(b.getAttribute('data-add')); });
  $('items').addEventListener('click', function(e){ var b = e.target.closest('[data-del]'); if(!b) return; inv.extras.splice(+b.getAttribute('data-del'), 1); renderItems(); update(); });
  $('bFull').addEventListener('click', function(){ var t = totals(inv); inv.pay.advance = t.grand; $('f-adv').value = t.grand; update(); });

  /* ---------- invoice paper ---------- */
  function render(){
    var t = totals(inv), s = settings, g = inv.guest, st = inv.stay;
    var ph = function(v, p){ return v ? esc(v) : '<span class="ph">' + p + '</span>'; };
    var rows = '<tr><td class="idx">1</td><td>' + esc(st.room || 'Room') + ' stay<small>' + dLong(st.inDate) + ' to ' + dLong(st.outDate) + '</small></td>' +
      '<td class="c num">' + t.n + ' night' + (t.n > 1 ? 's' : '') + '</td><td class="r num">' + money(st.rate) + '</td><td class="r num">' + money(t.room) + '</td></tr>';
    inv.extras.forEach(function(x, i){
      if(!x.d && !x.r) return;
      rows += '<tr><td class="idx">' + (i + 2) + '</td><td>' + ph(x.d, 'Item') + '</td><td class="c num">' + (x.q || 0) + '</td><td class="r num">' + money(x.r) + '</td><td class="r num">' + money((+x.q || 0) * (+x.r || 0)) + '</td></tr>';
    });
    var lines = '';
    lines += '<div><span>Subtotal</span><span class="num">' + money(t.sub) + '</span></div>';
    if(t.disc) lines += '<div><span>Discount</span><span class="num">− ' + money(t.disc) + '</span></div>';
    if(inv.gst.on){
      lines += '<div><span>Taxable value</span><span class="num">' + money(t.taxable) + '</span></div>';
      lines += '<div><span>CGST ' + (t.rate / 2) + '%</span><span class="num">' + money(t.cgst) + '</span></div>';
      lines += '<div><span>SGST ' + (t.rate / 2) + '%</span><span class="num">' + money(t.sgst) + '</span></div>';
    }
    if(t.round) lines += '<div><span>Round off</span><span class="num">' + (t.round > 0 ? '+ ' : '− ') + money(Math.abs(t.round)) + '</span></div>';
    lines += '<div class="grand"><span>Total</span><span class="num">' + money(t.grand) + '</span></div>';
    lines += '<div><span>Paid' + (t.paid ? ' (' + esc(inv.pay.mode) + ')' : '') + '</span><span class="num">' + money(t.paid) + '</span></div>';
    lines += '<div class="bal' + (t.bal <= 0 ? ' zero' : '') + '"><span>Balance due</span><span class="num">' + money(Math.max(0, t.bal)) + '</span></div>';

    $('paper').innerHTML =
      '<div class="p-head">' +
        '<div class="p-brand"><img src="' + EMBLEM + '" alt=""><div><h1>' + esc(s.name) + '</h1><p>' + esc(s.tagline) + '</p></div></div>' +
        '<div class="p-title"><div class="kind">' + (inv.gst.on ? 'TAX INVOICE' : 'INVOICE') + '</div><dl>' +
          '<dt>Invoice no.</dt><dd class="num">' + esc(inv.number) + '</dd><dt>Date</dt><dd>' + dLong(inv.date) + '</dd></dl></div>' +
      '</div><div class="rule"></div>' +
      '<div class="p-parties">' +
        '<div><h3>From</h3><div class="who">' + esc(s.name) + '</div><div class="lines">' + esc(s.address) + '\n' + esc(s.phones) + (s.gstin ? '\nGSTIN: ' + esc(s.gstin) : '') + '</div></div>' +
        '<div><h3>Bill to</h3><div class="who">' + ph(g.name, 'Guest name') + '</div><div class="lines">' + (g.address ? esc(g.address) + '\n' : '') + (g.phone ? esc(g.phone) : '') + '</div></div>' +
      '</div>' +
      '<div class="p-stay">' +
        '<div><h3>Check-in</h3><span>' + dLong(st.inDate) + '</span>' + (st.inTime ? '<small>' + tLong(st.inTime) + '</small>' : '') + '</div>' +
        '<div><h3>Check-out</h3><span>' + dLong(st.outDate) + '</span>' + (st.outTime ? '<small>' + tLong(st.outTime) + '</small>' : '') + '</div>' +
        '<div><h3>Nights</h3><span class="num">' + t.n + '</span></div>' +
        '<div><h3>Guests</h3><span class="num">' + (g.count || 1) + '</span></div>' +
        '<div><h3>Room</h3><span>' + esc(st.room || '') + '</span></div>' +
      '</div>' +
      '<table class="lines-t"><thead><tr><th class="idx">#</th><th>Description</th><th class="c">Qty</th><th class="r">Rate</th><th class="r">Amount</th></tr></thead><tbody>' + rows + '</tbody></table>' +
      '<div class="p-sum"><div class="words"><b>Amount in words</b>' + words(t.grand) +
        (t.grand > 0 ? '<div class="stamp ' + t.status + '">' + STATUS[t.status] + '</div>' : '') + '</div><div class="totals">' + lines + '</div></div>' +
      '<div class="p-foot"><div>' + (inv.notes ? '<h3>Notes</h3><div class="notes">' + esc(inv.notes) + '</div>' : '') + '</div>' +
        '<div class="sign"><div class="line"><b>For ' + esc(s.name) + '</b>Authorised signatory</div></div></div>';
  }

  var saveTimer;
  function update(){
    var t = totals(inv);
    $('c-nights').textContent = t.n + ' night' + (t.n > 1 ? 's' : '') + ' × ' + money(inv.stay.rate);
    $('c-room').textContent = money(t.room);
    $('c-bal').textContent = money(Math.max(0, t.bal));
    $('gstBox').hidden = !inv.gst.on;
    $('c-gstrate').value = t.rate + '%' + (inv.gst.mode === 'auto' ? ' (auto)' : '');
    render(); fit();
    clearTimeout(saveTimer); saveTimer = setTimeout(function(){ store(KEY_DRAFT, inv); }, 300);
  }

  /* scale the A4 sheet down on narrow screens */
  function fit(){
    var p = $('paper'), wrap = p.parentNode;
    p.style.transform = ''; p.style.marginBottom = '';
    if(innerWidth > 980) return;
    var avail = wrap.clientWidth - 20, w = p.offsetWidth;
    if(w > avail){ var k = avail / w; p.style.transform = 'scale(' + k + ')'; p.style.marginBottom = (-(1 - k) * p.offsetHeight) + 'px'; }
  }
  addEventListener('resize', fit);

  /* ---------- actions ---------- */
  function toast(m){ var el = $('toast'); el.textContent = m; el.classList.add('on'); clearTimeout(el._t); el._t = setTimeout(function(){ el.classList.remove('on'); }, 2200); }
  function msg(m){ $('msg').textContent = m || ''; }

  function validate(){
    var ok = true;
    if(!inv.guest.name.trim()){ $('w-name').classList.add('error'); ok = false; }
    if(!(+inv.stay.rate > 0)){ $('w-rate').classList.add('error'); ok = false; }
    msg(ok ? '' : 'Add the guest name and the rate per night to save this invoice.');
    if(!ok) setView('edit');
    return ok;
  }
  function save(){
    if(!validate()) return false;
    var isNew = !inv.id;
    if(isNew){
      if(invoices.some(function(x){ return x.number === inv.number; })){ msg('Invoice number ' + inv.number + ' is already used. Change it before saving.'); setView('edit'); return false; }
      inv.id = uid();
      if(inv.number === settings.prefix + pad(settings.next)){ settings.next = +settings.next + 1; store(KEY_SET, settings); }
    }
    var copy = JSON.parse(JSON.stringify(inv)); copy.savedAt = Date.now(); copy.total = totals(inv).grand; copy.status = totals(inv).status;
    var i = invoices.findIndex(function(x){ return x.id === inv.id; });
    if(i >= 0) invoices[i] = copy; else invoices.unshift(copy);
    store(KEY_INV, invoices); store(KEY_DRAFT, inv); refreshCount();
    toast((isNew ? 'Saved ' : 'Updated ') + inv.number);
    return true;
  }
  function startNew(){ inv = blank(); fill(); update(); msg(''); setView('edit'); $('f-gname').focus(); toast('New invoice ' + inv.number); }

  $('bSave').addEventListener('click', save);
  $('bNew').addEventListener('click', startNew);
  $('bPrint').addEventListener('click', function(){
    if(!inv.guest.name.trim() || !(+inv.stay.rate > 0)){ validate(); return; }
    if(!inv.id) save();
    setTimeout(function(){ window.print(); }, 50);
  });
  $('bWa').addEventListener('click', function(){
    var t = totals(inv), s = settings, d = String(inv.guest.phone || '').replace(/\D/g, '');
    if(d.length === 10) d = '91' + d;
    var text = s.name + '\nInvoice ' + inv.number + ' · ' + dLong(inv.date) +
      '\n\nGuest: ' + (inv.guest.name || '-') +
      '\nStay: ' + dLong(inv.stay.inDate) + ' to ' + dLong(inv.stay.outDate) + ' (' + t.n + ' night' + (t.n > 1 ? 's' : '') + ')' +
      '\nTotal: ' + money(t.grand) + '\nPaid: ' + money(t.paid) + '\nBalance due: ' + money(Math.max(0, t.bal)) +
      '\n\n' + (inv.notes || 'Thank you for staying with us.') + '\n' + s.phones;
    var url = 'https://wa.me/' + (d.length >= 11 ? d : '') + '?text=' + encodeURIComponent(text);
    var a = document.createElement('a'); a.href = url; a.target = '_blank'; a.rel = 'noopener'; document.body.appendChild(a); a.click(); a.remove();
  });

  /* ---------- tabs (small screens) ---------- */
  function setView(v){
    if(document.body.getAttribute('data-view') !== v) window.scrollTo(0, 0);
    document.body.setAttribute('data-view', v);
    document.querySelectorAll('.tabs [data-view]').forEach(function(b){ b.setAttribute('aria-selected', b.getAttribute('data-view') === v ? 'true' : 'false'); });
    if(v === 'preview') requestAnimationFrame(fit);
  }
  document.querySelector('.tabs').addEventListener('click', function(e){ var b = e.target.closest('[data-view]'); if(b) setView(b.getAttribute('data-view')); });

  /* ---------- drawers ---------- */
  function open(id){ $(id).hidden = false; }
  function close(el){ el.closest('.scrim').hidden = true; }
  document.querySelectorAll('.scrim').forEach(function(sc){
    sc.addEventListener('click', function(e){ if(e.target === sc || e.target.closest('[data-close]')) close(e.target.closest('[data-close]') || sc.firstElementChild); });
  });
  addEventListener('keydown', function(e){ if(e.key === 'Escape') document.querySelectorAll('.scrim').forEach(function(s){ s.hidden = true; }); });

  function refreshCount(){ $('savedCount').textContent = invoices.length; }
  function renderSaved(){
    var q = $('q').value.trim().toLowerCase();
    var list = invoices.filter(function(x){ return !q || [x.number, x.guest.name, x.guest.phone].join(' ').toLowerCase().indexOf(q) >= 0; });
    var month = iso(new Date()).slice(0, 7), mTotal = 0, due = 0;
    invoices.forEach(function(x){ var t = totals(x); if((x.date || '').slice(0, 7) === month) mTotal += t.grand; due += Math.max(0, t.bal); });
    $('sumBox').innerHTML = '<div><small>Invoices</small><b class="num">' + invoices.length + '</b></div>' +
      '<div><small>This month</small><b class="num">' + money(mTotal) + '</b></div>' +
      '<div><small>Balance due</small><b class="num">' + money(due) + '</b></div>';
    $('savedList').innerHTML = list.length ? list.map(function(x){
      var t = totals(x);
      return '<div class="card" data-id="' + x.id + '"><div><div class="t">' + esc(x.guest.name) + '<span class="badge ' + t.status + '">' + STATUS[t.status] + '</span></div>' +
        '<div class="s num">' + esc(x.number) + ' · ' + dLong(x.stay.inDate) + ' to ' + dLong(x.stay.outDate) + '</div></div>' +
        '<div class="amt num">' + money(t.grand) + '</div>' +
        '<div class="ops"><button class="plain" data-op="open">Open</button><button class="plain" data-op="dup">Copy as new</button><button class="plain danger" data-op="del">Delete</button></div></div>';
    }).join('') : '<div class="empty">' + (invoices.length ? 'No invoices match that search.' : 'No saved invoices yet. Fill in an invoice and press Save.') + '</div>';
  }
  $('bSaved').addEventListener('click', function(){ renderSaved(); open('savedPanel'); $('q').focus(); });
  $('q').addEventListener('input', renderSaved);
  $('savedList').addEventListener('click', function(e){
    var b = e.target.closest('[data-op]'); if(!b) return;
    var card = b.closest('.card'), id = card.getAttribute('data-id'), x = invoices.find(function(v){ return v.id === id; });
    var op = b.getAttribute('data-op');
    if(op === 'open'){ inv = JSON.parse(JSON.stringify(x)); fill(); update(); close(b); setView('preview'); toast('Opened ' + inv.number); }
    if(op === 'dup'){
      inv = JSON.parse(JSON.stringify(x)); inv.id = null; inv.number = settings.prefix + pad(settings.next); inv.date = iso(new Date());
      inv.pay.advance = ''; fill(); update(); close(b); setView('edit'); toast('Copied to new invoice ' + inv.number);
    }
    if(op === 'del'){ b.textContent = 'Tap again to delete'; b.setAttribute('data-op', 'del2'); return; }
    if(op === 'del2'){ invoices = invoices.filter(function(v){ return v.id !== id; }); store(KEY_INV, invoices); refreshCount(); renderSaved(); toast('Deleted ' + x.number); }
  });

  /* ---------- settings ---------- */
  function fillSettings(){ document.querySelectorAll('[data-s]').forEach(function(el){ el.value = settings[el.getAttribute('data-s')]; }); }
  $('bSettings').addEventListener('click', function(){ fillSettings(); open('setPanel'); });
  $('setPanel').addEventListener('input', function(e){
    var el = e.target, k = el.getAttribute('data-s'); if(!k) return;
    var v = el.value; if(el.hasAttribute('data-num')) v = v === '' ? '' : +v;
    var oldNo = settings.prefix + pad(settings.next);
    settings[k] = v; store(KEY_SET, settings);
    if(!inv.id && inv.number === oldNo && (k === 'prefix' || k === 'next')){ inv.number = settings.prefix + pad(settings.next); $('f-number').value = inv.number; }
    update();
  });
  $('bExport').addEventListener('click', function(){
    var blob = new Blob([JSON.stringify({ app:'nila-invoices', version:1, exported:new Date().toISOString(), settings:settings, invoices:invoices }, null, 2)], { type:'application/json' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'nila-invoices-backup-' + iso(new Date()) + '.json';
    document.body.appendChild(a); a.click(); setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 500);
    toast('Backup downloaded');
  });
  $('fImport').addEventListener('change', function(){
    var f = this.files[0]; if(!f) return;
    var rd = new FileReader();
    rd.onload = function(){
      try{
        var data = JSON.parse(rd.result);
        if(!data || !Array.isArray(data.invoices)) throw 0;
        var have = {}; invoices.forEach(function(x){ have[x.id] = 1; });
        var added = data.invoices.filter(function(x){ return x && x.id && !have[x.id]; });
        invoices = invoices.concat(added);
        if(data.settings) settings = Object.assign({}, DEFAULTS, data.settings, { next:Math.max(+settings.next || 1, +data.settings.next || 1) });
        store(KEY_INV, invoices); store(KEY_SET, settings); fillSettings(); refreshCount();
        toast('Restored ' + added.length + ' invoice' + (added.length === 1 ? '' : 's'));
      }catch(e){ toast('That file is not a Nila Inn invoice backup'); }
    };
    rd.readAsText(f); this.value = '';
  });

  /* ---------- start ---------- */
  fill(); update(); refreshCount();
})();