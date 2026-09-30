import React, { useEffect, useRef } from 'react';
import {
  money,
  totals,
  dateLong,
  timeLong,
  words,
  STATUS,
} from '../utils/calculations.js';

export default function InvoicePreview({ invoice, settings }) {
  const paperRef = useRef(null);
  const wrapRef = useRef(null);

  const t = totals(invoice);
  const s = settings;
  const g = invoice.guest;
  const st = invoice.stay;

  // Responsive scaling of the A4 preview on mobile screens
  useEffect(() => {
    function fit() {
      const p = paperRef.current;
      const wrap = wrapRef.current;
      if (!p || !wrap) return;

      p.style.transform = '';
      p.style.marginBottom = '';

      if (window.innerWidth > 980) return;

      const avail = wrap.clientWidth - 20;
      const w = p.offsetWidth;
      if (w > avail) {
        const k = avail / w;
        p.style.transform = `scale(${k})`;
        p.style.marginBottom = `${-(1 - k) * p.offsetHeight}px`;
      }
    }

    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [invoice]);

  return (
    <section className="preview" ref={wrapRef} aria-label="Invoice preview">
      <article className="paper" ref={paperRef} id="paper">
        {/* Paper Header */}
        <div className="p-head">
          <div className="p-brand">
            <img src="/images/emblem.jpg" alt="" />
            <div>
              <h1>{s.name || 'Nila Inn Residency'}</h1>
              <p>{s.tagline || 'Where Comfort meets Tradition'}</p>
            </div>
          </div>
          <div className="p-title">
            <div className="kind">{invoice.gst?.on ? 'TAX INVOICE' : 'INVOICE'}</div>
            <dl>
              <dt>Invoice no.</dt>
              <dd className="num">{invoice.number}</dd>
              <dt>Date</dt>
              <dd>{dateLong(invoice.date)}</dd>
            </dl>
          </div>
        </div>

        <div className="rule" />

        {/* Parties */}
        <div className="p-parties">
          <div>
            <h3>From</h3>
            <div className="who">{s.name}</div>
            <div className="lines">
              {s.address}
              {'\n'}
              {s.phones}
              {s.gstin ? `\nGSTIN: ${s.gstin}` : ''}
            </div>
          </div>
          <div>
            <h3>Bill to</h3>
            <div className="who">
              {g.name ? g.name : <span className="ph">Guest name</span>}
            </div>
            <div className="lines">
              {g.address ? `${g.address}\n` : ''}
              {g.phone || ''}
            </div>
          </div>
        </div>

        {/* Stay Summary */}
        <div className="p-stay">
          <div>
            <h3>Check-in</h3>
            <span>{dateLong(st.inDate)}</span>
            {st.inTime ? <small>{timeLong(st.inTime)}</small> : null}
          </div>
          <div>
            <h3>Check-out</h3>
            <span>{dateLong(st.outDate)}</span>
            {st.outTime ? <small>{timeLong(st.outTime)}</small> : null}
          </div>
          <div>
            <h3>Nights</h3>
            <span className="num">{t.n}</span>
          </div>
          <div>
            <h3>Guests</h3>
            <span className="num">{g.count || 1}</span>
          </div>
          <div>
            <h3>Room</h3>
            <span>{st.room || ''}</span>
          </div>
        </div>

        {/* Lines Table */}
        <table className="lines-t">
          <thead>
            <tr>
              <th className="idx">#</th>
              <th>Description</th>
              <th className="c">Qty</th>
              <th className="r">Rate</th>
              <th className="r">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="idx">1</td>
              <td>
                {st.room || 'Room'} stay
                <small>
                  {dateLong(st.inDate)} to {dateLong(st.outDate)}
                </small>
              </td>
              <td className="c num">{t.n} {t.n > 1 ? 'nights' : 'night'}</td>
              <td className="r num">{money(st.rate)}</td>
              <td className="r num">{money(t.room)}</td>
            </tr>
            {invoice.extras && invoice.extras.map((x, i) => {
              if (!x.d && !x.r) return null;
              return (
                <tr key={i}>
                  <td className="idx">{i + 2}</td>
                  <td>{x.d || <span className="ph">Item</span>}</td>
                  <td className="c num">{x.q || 0}</td>
                  <td className="r num">{money(x.r)}</td>
                  <td className="r num">{money((+x.q || 0) * (+x.r || 0))}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Totals & Words */}
        <div className="p-sum">
          <div className="words">
            <b>Amount in words</b>
            {words(t.grand)}
            {t.grand > 0 && (
              <div className={`stamp ${t.status}`}>
                {STATUS[t.status]}
              </div>
            )}
          </div>
          <div className="totals">
            <div>
              <span>Subtotal</span>
              <span className="num">{money(t.sub)}</span>
            </div>
            {t.disc > 0 && (
              <div>
                <span>Discount</span>
                <span className="num">− {money(t.disc)}</span>
              </div>
            )}
            {invoice.gst?.on && (
              <>
                <div>
                  <span>Taxable value</span>
                  <span className="num">{money(t.taxable)}</span>
                </div>
                <div>
                  <span>CGST {(t.rate / 2)}%</span>
                  <span className="num">{money(t.cgst)}</span>
                </div>
                <div>
                  <span>SGST {(t.rate / 2)}%</span>
                  <span className="num">{money(t.sgst)}</span>
                </div>
              </>
            )}
            {t.round !== 0 && (
              <div>
                <span>Round off</span>
                <span className="num">
                  {t.round > 0 ? '+ ' : '− '}
                  {money(Math.abs(t.round))}
                </span>
              </div>
            )}
            <div className="grand">
              <span>Total</span>
              <span className="num">{money(t.grand)}</span>
            </div>
            <div>
              <span>
                Paid{t.paid ? ` (${invoice.pay?.mode || 'Cash'})` : ''}
              </span>
              <span className="num">{money(t.paid)}</span>
            </div>
            <div className={`bal ${t.bal <= 0 ? 'zero' : ''}`}>
              <span>Balance due</span>
              <span className="num">{money(Math.max(0, t.bal))}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-foot">
          <div>
            {invoice.notes && (
              <>
                <h3>Notes</h3>
                <div className="notes">{invoice.notes}</div>
              </>
            )}
          </div>
          <div className="sign">
            <div className="line">
              <b>For {s.name}</b>
              Authorised signatory
            </div>
          </div>
        </div>
      </article>
    </section>
  );
}
