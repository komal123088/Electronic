// pages/SalePage.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import api from "../api/api.js";
import EP from "../api/apiEndpoints.js";
import "../styles/theme.css";
import "../styles/SalePage.css";

/* ── helpers ── */
const timeNow = () =>
  new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
const isoDate = () => new Date().toISOString().split("T")[0];
const fmt = (n) => Number(n || 0).toLocaleString("en-PK");

const EMPTY_ROW = {
  productId: "",
  code: "",
  name: "",
  uom: "",
  rack: "",
  pcs: 1,
  rate: 0,
  amount: 0,
};

const SHOP_NAME = "Asim Electric & Electronic Store";

/* customer type → badge colors */
const TYPE_COLORS = {
  credit: { bg: "#fca5a5", color: "#7f1d1d", border: "#ef4444" },
  debit: { bg: "#93c5fd", color: "#1e3a8a", border: "#3b82f6" },
  cash: { bg: "#86efac", color: "#14532d", border: "#22c55e" },
  "raw-sale": { bg: "#fde68a", color: "#78350f", border: "#f59e0b" },
  "raw-purchase": { bg: "#d8b4fe", color: "#3b0764", border: "#a855f7" },
};

/* FIX 1: derive paymentMode from customer type */
const typeToPayment = (t) => {
  if (t === "credit" || t === "raw-sale" || t === "raw-purchase")
    return "Credit";
  if (t === "debit") return "Bank";
  return "Cash";
};

/* FIX 1: derive saleSource from customer type — exact match */
const typeToSource = (t) => {
  if (!t) return "cash";
  return t; // "credit","debit","cash","raw-sale","raw-purchase"
};

/* ─────────────────────────────────────────────────────────────
   INVOICE PRINT MODAL  (FIX 3)
───────────────────────────────────────────────────────────── */
function InvoiceModal({ sale, printType, onClose }) {
  const buildA4Html = () => {
    const rows = sale.items
      .map(
        (it, i) =>
          `<tr><td>${i + 1}</td><td>${it.name || it.description}</td><td>${it.uom || it.measurement || ""}</td><td align="right">${it.pcs || it.qty}</td><td align="right">${Number(it.rate).toLocaleString()}</td><td align="right"><b>${Number(it.amount).toLocaleString()}</b></td></tr>`,
      )
      .join("");
    return `<!DOCTYPE html><html><head><title>Invoice ${sale.invoiceNo}</title>
    <style>body{font-family:Arial,sans-serif;font-size:12px;margin:20px;color:#000}h2{text-align:center;font-size:22px;margin:0 0 2px}.sub{text-align:center;font-size:11px;color:#555;margin-bottom:10px;letter-spacing:1px;text-transform:uppercase}.meta{display:flex;justify-content:space-between;flex-wrap:wrap;gap:4px;border:1px solid #ccc;padding:6px 10px;margin:8px 0;background:#f9f9f9;font-size:11px}table{width:100%;border-collapse:collapse;margin-top:10px}th{background:#e8e8e8;border:1px solid #ccc;padding:5px 7px;text-align:left;font-size:11px}td{border:1px solid #ddd;padding:4px 7px;font-size:11px}.tots{float:right;min-width:240px;margin-top:12px;border:1px solid #ccc;padding:8px 12px;background:#f9f9f9}.tr{display:flex;justify-content:space-between;padding:3px 0;font-size:12px;border-bottom:1px dotted #eee}.tr.b{font-weight:bold;font-size:14px;border-top:2px solid #000;border-bottom:none;margin-top:6px;padding-top:6px}.tr.red{color:#c0392b}.tr.green{color:#27ae60}.thanks{text-align:center;margin-top:30px;font-size:11px;color:#888;clear:both;border-top:1px dashed #ccc;padding-top:10px}@media print{body{margin:5mm}@page{size:A4;margin:10mm}}</style></head><body>
    <h2>${SHOP_NAME}</h2><div class="sub">◆ Sale Invoice ◆</div>
    <div class="meta"><span><b>Invoice #:</b> ${sale.invoiceNo}</span><span><b>Date:</b> ${sale.invoiceDate}</span><span><b>Customer:</b> ${sale.customerName}</span><span><b>Source:</b> ${sale.saleSource} / ${sale.paymentMode}</span></div>
    <table><thead><tr><th>#</th><th>Description</th><th>UOM</th><th align="right">Pcs</th><th align="right">Rate</th><th align="right">Amount</th></tr></thead><tbody>${rows}</tbody></table>
    <div class="tots"><div class="tr"><span>Sub Total</span><span>PKR ${Number(sale.subTotal).toLocaleString()}</span></div>${sale.extraDisc > 0 ? `<div class="tr"><span>Discount</span><span style="color:red">-PKR ${Number(sale.extraDisc).toLocaleString()}</span></div>` : ""}<div class="tr b"><span>Net Total</span><span>PKR ${Number(sale.netTotal).toLocaleString()}</span></div>${sale.prevBalance > 0 ? `<div class="tr red"><span>Previous Balance</span><span>PKR ${Number(sale.prevBalance).toLocaleString()}</span></div>` : ""}<div class="tr green"><span>Received</span><span>PKR ${Number(sale.paidAmount).toLocaleString()}</span></div><div class="tr b red"><span>Balance</span><span>PKR ${Number(sale.balance).toLocaleString()}</span></div></div>
    <br style="clear:both"><div class="thanks">Thank you! — ${SHOP_NAME}</div></body></html>`;
  };

  const buildA5Html = () => {
    const rows = sale.items
      .map(
        (it, i) =>
          `<tr><td>${i + 1}</td><td>${it.name || it.description}</td><td>${it.uom || it.measurement || ""}</td><td align="right">${it.pcs || it.qty}</td><td align="right">${Number(it.rate).toLocaleString()}</td><td align="right"><b>${Number(it.amount).toLocaleString()}</b></td></tr>`,
      )
      .join("");
    return `<!DOCTYPE html><html><head><title>Invoice ${sale.invoiceNo}</title>
    <style>body{font-family:Arial,sans-serif;font-size:10px;margin:8px;color:#000}h2{text-align:center;font-size:16px;margin:0 0 2px}.sub{text-align:center;font-size:9px;color:#555;margin-bottom:6px}.meta{display:flex;justify-content:space-between;flex-wrap:wrap;gap:3px;border:1px solid #ccc;padding:4px 8px;margin:5px 0;background:#f9f9f9;font-size:9px}table{width:100%;border-collapse:collapse;margin-top:6px}th{background:#e8e8e8;border:1px solid #ccc;padding:3px 5px;text-align:left;font-size:9px}td{border:1px solid #ddd;padding:2px 5px;font-size:9px}.tots{float:right;min-width:180px;margin-top:8px;border:1px solid #ccc;padding:5px 8px;background:#f9f9f9}.tr{display:flex;justify-content:space-between;padding:2px 0;font-size:9px;border-bottom:1px dotted #eee}.tr.b{font-weight:bold;font-size:11px;border-top:2px solid #000;border-bottom:none;margin-top:4px;padding-top:4px}.tr.red{color:#c0392b}.tr.green{color:#27ae60}.thanks{text-align:center;margin-top:16px;font-size:9px;color:#888;clear:both;border-top:1px dashed #ccc;padding-top:6px}@media print{body{margin:3mm}@page{size:A5;margin:6mm}}</style></head><body>
    <h2>${SHOP_NAME}</h2><div class="sub">◆ Sale Invoice ◆</div>
    <div class="meta"><span><b>Invoice #:</b> ${sale.invoiceNo}</span><span><b>Date:</b> ${sale.invoiceDate}</span><span><b>Customer:</b> ${sale.customerName}</span><span><b>Source:</b> ${sale.saleSource} / ${sale.paymentMode}</span></div>
    <table><thead><tr><th>#</th><th>Description</th><th>UOM</th><th align="right">Pcs</th><th align="right">Rate</th><th align="right">Amount</th></tr></thead><tbody>${rows}</tbody></table>
    <div class="tots"><div class="tr"><span>Sub Total</span><span>PKR ${Number(sale.subTotal).toLocaleString()}</span></div>${sale.extraDisc > 0 ? `<div class="tr"><span>Discount</span><span style="color:red">-PKR ${Number(sale.extraDisc).toLocaleString()}</span></div>` : ""}<div class="tr b"><span>Net Total</span><span>PKR ${Number(sale.netTotal).toLocaleString()}</span></div>${sale.prevBalance > 0 ? `<div class="tr red"><span>Prev Balance</span><span>PKR ${Number(sale.prevBalance).toLocaleString()}</span></div>` : ""}<div class="tr green"><span>Received</span><span>PKR ${Number(sale.paidAmount).toLocaleString()}</span></div><div class="tr b red"><span>Balance</span><span>PKR ${Number(sale.balance).toLocaleString()}</span></div></div>
    <br style="clear:both"><div class="thanks">Thank you! — ${SHOP_NAME}</div></body></html>`;
  };

  const buildThermalHtml = () => {
    const rows = sale.items
      .map(
        (it, i) =>
          `<tr><td style="padding:2px 0">${i + 1}. ${it.name || it.description}</td><td align="right" style="padding:2px 0">${it.pcs || it.qty}×${Number(it.rate).toLocaleString()}</td><td align="right" style="padding:2px 0"><b>${Number(it.amount).toLocaleString()}</b></td></tr>`,
      )
      .join("");
    return `<!DOCTYPE html><html><head><title>Receipt</title><style>body{font-family:'Courier New',monospace;font-size:11px;width:72mm;margin:0 auto;padding:4px}h3{text-align:center;font-size:14px;margin:4px 0}.c{text-align:center;font-size:10px}hr{border:none;border-top:1px dashed #000;margin:4px 0}table{width:100%;font-size:10px;border-collapse:collapse}.t{display:flex;justify-content:space-between;font-size:11px;padding:1px 0}.t.b{font-weight:bold;font-size:12px;border-top:1px dashed #000;padding-top:3px;margin-top:2px}.t.red{color:#c0392b}.t.green{color:#27ae60}@media print{@page{size:80mm auto;margin:3mm}}</style></head><body>
    <h3>${SHOP_NAME}</h3><div class="c">★ SALE RECEIPT ★</div><hr>
    <div class="c">Invoice: <b>${sale.invoiceNo}</b> | ${sale.invoiceDate}</div>
    <div class="c"><b>${sale.customerName}</b></div><hr>
    <table><tbody>${rows}</tbody></table><hr>
    <div class="t"><span>Sub Total</span><span>${Number(sale.subTotal).toLocaleString()}</span></div>${sale.extraDisc > 0 ? `<div class="t"><span>Discount</span><span>-${Number(sale.extraDisc).toLocaleString()}</span></div>` : ""}
    <div class="t b"><span>Net Total</span><span>${Number(sale.netTotal).toLocaleString()}</span></div>${sale.prevBalance > 0 ? `<div class="t red"><span>Prev Balance</span><span>${Number(sale.prevBalance).toLocaleString()}</span></div>` : ""}<div class="t green"><span>Received</span><span>${Number(sale.paidAmount).toLocaleString()}</span></div><div class="t b red"><span>Balance</span><span>${Number(sale.balance).toLocaleString()}</span></div><hr>
    <div class="c" style="font-size:10px;margin-top:4px">Thank you! — ${SHOP_NAME}</div></body></html>`;
  };

  const doPrint = (type) => {
    let html = "";
    if (type === "Thermal") html = buildThermalHtml();
    else if (type === "A5") html = buildA5Html();
    else html = buildA4Html();
    const w = window.open(
      "",
      "_blank",
      type === "Thermal" ? "width=400,height=600" : "width=900,height=700",
    );
    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print(), 400);
  };

  useEffect(() => {
    // auto print on open
    doPrint(printType);
  }, []);

  return (
    <div
      className="xp-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="xp-modal xp-modal-lg">
        <div className="xp-modal-tb">
          <svg
            width="13"
            height="13"
            viewBox="0 0 16 16"
            fill="rgba(255,255,255,0.8)"
          >
            <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1L14 5.5z" />
          </svg>
          <span className="xp-modal-title">
            Invoice #{sale.invoiceNo} — {sale.customerName}
          </span>
          <button className="xp-cap-btn xp-cap-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="xp-modal-body">
          <div className="cs-inv-preview">
            <div className="cs-inv-shop">{SHOP_NAME}</div>
            <div className="cs-inv-sub">◆ Sale Invoice ◆</div>
            <div className="cs-inv-meta">
              <span>
                Invoice: <strong>{sale.invoiceNo}</strong>
              </span>
              <span>
                Date: <strong>{sale.invoiceDate}</strong>
              </span>
              <span>
                Customer: <strong>{sale.customerName}</strong>
              </span>
              <span>
                Source:{" "}
                <strong>
                  {sale.saleSource} / {sale.paymentMode}
                </strong>
              </span>
            </div>
            <div className="xp-table-panel">
              <table className="xp-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Description</th>
                    <th>UOM</th>
                    <th className="r">Pcs</th>
                    <th className="r">Rate</th>
                    <th className="r">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {sale.items.map((it, i) => (
                    <tr key={i}>
                      <td className="text-muted">{i + 1}</td>
                      <td>{it.name || it.description}</td>
                      <td className="text-muted">{it.uom || it.measurement}</td>
                      <td className="r">{it.pcs || it.qty}</td>
                      <td className="r xp-amt">{fmt(it.rate)}</td>
                      <td className="r xp-amt">{fmt(it.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="cs-inv-totals">
              <div className="cs-inv-total-row">
                <span>Sub Total</span>
                <span className="xp-amt">{fmt(sale.subTotal)}</span>
              </div>
              {sale.extraDisc > 0 && (
                <div className="cs-inv-total-row danger">
                  <span>Discount</span>
                  <span>-{fmt(sale.extraDisc)}</span>
                </div>
              )}
              <div className="cs-inv-total-row bold">
                <span>Net Total</span>
                <span className="xp-amt">{fmt(sale.netTotal)}</span>
              </div>
              {sale.prevBalance > 0 && (
                <div className="cs-inv-total-row danger">
                  <span>Prev Balance</span>
                  <span className="xp-amt danger">{fmt(sale.prevBalance)}</span>
                </div>
              )}
              <div className="cs-inv-total-row success">
                <span>Received</span>
                <span className="xp-amt success">{fmt(sale.paidAmount)}</span>
              </div>
              <div className="cs-inv-total-row bold danger">
                <span>Balance</span>
                <span className="xp-amt danger">{fmt(sale.balance)}</span>
              </div>
            </div>
            <div className="cs-inv-thanks">Thank you! — {SHOP_NAME}</div>
          </div>
        </div>

        <div className="xp-modal-footer">
          <button
            className="xp-btn xp-btn-sm"
            onClick={() => doPrint("Thermal")}
          >
            🖨 Thermal
          </button>
          <button className="xp-btn xp-btn-sm" onClick={() => doPrint("A5")}>
            📄 A5 Print
          </button>
          <button className="xp-btn xp-btn-sm" onClick={() => doPrint("A4")}>
            📄 A4 Print
          </button>
          <button className="xp-btn xp-btn-lg" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   PRODUCT SEARCH MODAL
───────────────────────────────────────────────────────────── */
function SearchModal({ allProducts, onSelect, onClose }) {
  const [desc, setDesc] = useState("");
  const [cat, setCat] = useState("");
  const [company, setCompany] = useState("");
  const [rows, setRows] = useState([]);
  const [hiIdx, setHiIdx] = useState(0);
  const rDesc = useRef(null);
  const rCat = useRef(null);
  const rCompany = useRef(null);
  const tbodyRef = useRef(null);

  const buildFlat = useCallback((products, d, c, co) => {
    const res = [];
    const ld = d.trim().toLowerCase(),
      lc = c.trim().toLowerCase(),
      lo = co.trim().toLowerCase();
    products.forEach((p) => {
      const ok =
        (!ld ||
          p.description?.toLowerCase().includes(ld) ||
          p.code?.toLowerCase().includes(ld)) &&
        (!lc || p.category?.toLowerCase().includes(lc)) &&
        (!lo || p.company?.toLowerCase().includes(lo));
      if (!ok) return;
      const _name = [p.category, p.description, p.company]
        .filter(Boolean)
        .join(" ");
      if (p.packingInfo?.length > 0)
        p.packingInfo.forEach((pk, i) =>
          res.push({
            ...p,
            _pi: i,
            _meas: pk.measurement,
            _rate: pk.saleRate,
            _pack: pk.packing,
            _stock: pk.openingQty || 0,
            _name,
          }),
        );
      else
        res.push({
          ...p,
          _pi: 0,
          _meas: "",
          _rate: 0,
          _pack: 1,
          _stock: 0,
          _name,
        });
    });
    return res;
  }, []);

  useEffect(() => {
    rDesc.current?.focus();
    setRows(buildFlat(allProducts, "", "", ""));
  }, [allProducts, buildFlat]);
  useEffect(() => {
    const f = buildFlat(allProducts, desc, cat, company);
    setRows(f);
    setHiIdx(f.length > 0 ? 0 : -1);
  }, [desc, cat, company, allProducts, buildFlat]);
  useEffect(() => {
    if (tbodyRef.current && hiIdx >= 0)
      tbodyRef.current.children[hiIdx]?.scrollIntoView({ block: "nearest" });
  }, [hiIdx]);

  const fk = (e, nr) => {
    if (e.key === "Escape") {
      onClose();
      return;
    }
    if (e.key === "Enter" || e.key === "ArrowDown") {
      e.preventDefault();
      nr
        ? nr.current?.focus()
        : (tbodyRef.current?.focus(), setHiIdx((h) => Math.max(0, h)));
    }
  };
  const tk = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHiIdx((i) => Math.min(i + 1, rows.length - 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHiIdx((i) => Math.max(i - 1, 0));
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (hiIdx >= 0 && rows[hiIdx]) onSelect(rows[hiIdx]);
    }
    if (e.key === "Escape") onClose();
    if (e.key === "Tab") {
      e.preventDefault();
      rDesc.current?.focus();
    }
  };

  return (
    <div
      className="xp-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="xp-modal xp-modal-lg">
        <div className="xp-modal-tb">
          <svg
            width="13"
            height="13"
            viewBox="0 0 16 16"
            fill="rgba(255,255,255,0.8)"
          >
            <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0" />
          </svg>
          <span className="xp-modal-title">Search Products</span>
          <button className="xp-cap-btn xp-cap-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="cs-modal-filters">
          <div className="cs-modal-filter-grp">
            <label className="xp-label">Description / Code</label>
            <input
              ref={rDesc}
              type="text"
              className="xp-input"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              onKeyDown={(e) => fk(e, rCat)}
              placeholder="Name / code…"
              autoComplete="off"
            />
          </div>
          <div className="cs-modal-filter-grp">
            <label className="xp-label">Category</label>
            <input
              ref={rCat}
              type="text"
              className="xp-input"
              value={cat}
              onChange={(e) => setCat(e.target.value)}
              onKeyDown={(e) => fk(e, rCompany)}
              placeholder="e.g. SMALL"
              autoComplete="off"
            />
          </div>
          <div className="cs-modal-filter-grp">
            <label className="xp-label">Company</label>
            <input
              ref={rCompany}
              type="text"
              className="xp-input"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              onKeyDown={(e) => fk(e, null)}
              placeholder="e.g. LUX"
              autoComplete="off"
            />
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 6 }}>
            <span style={{ fontSize: "var(--xp-fs-xs)", color: "#555" }}>
              {rows.length} result(s)
            </span>
            <button className="xp-btn xp-btn-sm" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
        <div className="xp-modal-body" style={{ padding: 0 }}>
          <div className="xp-table-panel" style={{ border: "none" }}>
            <div className="xp-table-scroll">
              <table className="xp-table">
                <thead>
                  <tr>
                    <th style={{ width: 36 }}>Sr.#</th>
                    <th>Barcode</th>
                    <th>Name</th>
                    <th>Meas.</th>
                    <th className="r">Rate</th>
                    <th className="r">Stock</th>
                    <th className="r">Pack</th>
                  </tr>
                </thead>
                <tbody ref={tbodyRef} tabIndex={0} onKeyDown={tk}>
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={7} className="xp-empty">
                        No products found
                      </td>
                    </tr>
                  )}
                  {rows.map((r, i) => (
                    <tr
                      key={`${r._id}-${r._pi}`}
                      style={{
                        background: i === hiIdx ? "#c3d9f5" : undefined,
                      }}
                      onClick={() => setHiIdx(i)}
                      onDoubleClick={() => onSelect(r)}
                    >
                      <td className="text-muted">{i + 1}</td>
                      <td>
                        <span className="xp-code">{r.code}</span>
                      </td>
                      <td>
                        <button className="xp-link-btn">{r._name}</button>
                      </td>
                      <td className="text-muted">{r._meas}</td>
                      <td className="r xp-amt">
                        {Number(r._rate).toLocaleString("en-PK")}
                      </td>
                      <td className="r">{r._stock}</td>
                      <td className="r">{r._pack}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="cs-modal-hint">
          ↑↓ navigate &nbsp;|&nbsp; Enter / Double-click = select &nbsp;|&nbsp;
          Esc = close &nbsp;|&nbsp; Tab = filters
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   HELD BILL PREVIEW MODAL
───────────────────────────────────────────────────────────── */
function HoldPreviewModal({ bill, onResume, onClose }) {
  if (!bill) return null;
  return (
    <div
      className="xp-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="xp-modal" style={{ width: 560 }}>
        <div className="xp-modal-tb">
          <span className="xp-modal-title">
            Hold Bill Preview — {bill.invoiceNo}
          </span>
          <button className="xp-cap-btn xp-cap-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="xp-modal-body" style={{ padding: 8 }}>
          <div
            style={{
              marginBottom: 6,
              display: "flex",
              gap: 16,
              fontSize: "var(--xp-fs-xs)",
            }}
          >
            <span>
              <b>Customer:</b> {bill.buyerName}
            </span>
            <span>
              <b>Items:</b> {bill.items.length}
            </span>
            <span>
              <b>Amount:</b>{" "}
              <span style={{ color: "var(--xp-blue-dark)", fontWeight: 700 }}>
                {Number(bill.amount).toLocaleString("en-PK")}
              </span>
            </span>
          </div>
          <div className="xp-table-panel" style={{ border: "none" }}>
            <div className="xp-table-scroll" style={{ maxHeight: 300 }}>
              <table className="xp-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Code</th>
                    <th>Name</th>
                    <th>UOM</th>
                    <th className="r">Pcs</th>
                    <th className="r">Rate</th>
                    <th className="r">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {bill.items.map((r, i) => (
                    <tr key={i}>
                      <td className="text-muted">{i + 1}</td>
                      <td className="text-muted">{r.code}</td>
                      <td>{r.name}</td>
                      <td className="text-muted">{r.uom}</td>
                      <td className="r">{r.pcs}</td>
                      <td className="r">
                        {Number(r.rate).toLocaleString("en-PK")}
                      </td>
                      <td
                        className="r"
                        style={{
                          color: "var(--xp-blue-dark)",
                          fontWeight: 700,
                        }}
                      >
                        {Number(r.amount).toLocaleString("en-PK")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            gap: 6,
            padding: "6px 10px",
            borderTop: "1px solid var(--xp-silver-5)",
            justifyContent: "flex-end",
          }}
        >
          <button className="xp-btn xp-btn-sm" onClick={onClose}>
            Cancel
          </button>
          <button
            className="xp-btn xp-btn-primary xp-btn-sm"
            onClick={() => onResume(bill.id)}
          >
            Resume This Bill
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   INLINE CUSTOMER COMBOBOX  (FIX 4: dropdown opens upward)
───────────────────────────────────────────────────────────── */
function CustomerDropdown({
  allCustomers,
  value,
  displayName,
  customerType,
  onSelect,
  onClear,
  onAddNew,
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [hiIdx, setHiIdx] = useState(0);
  const wrapRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Exclude COUNTER SALE placeholder, show real customers only
  const realCustomers = allCustomers.filter(
    (c) => c.name?.toUpperCase().trim() !== "COUNTER SALE",
  );
  const filtered =
    query.trim().length > 0
      ? realCustomers.filter((c) => {
          const q = query.toLowerCase();
          return (
            c.name?.toLowerCase().includes(q) ||
            c.code?.toLowerCase().includes(q) ||
            c.phone?.toLowerCase().includes(q)
          );
        })
      : realCustomers;

  const showAddNew = query.trim().length > 0;
  const totalRows = filtered.length + (showAddNew ? 1 : 0);

  useEffect(() => {
    const h = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target))
        setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => {
    if (!listRef.current || !open) return;
    const el = listRef.current.children[hiIdx];
    el?.scrollIntoView({ block: "nearest" });
  }, [hiIdx, open]);

  useEffect(() => {
    setHiIdx(0);
  }, [query]);

  const selectCustomer = (c) => {
    onSelect(c);
    setOpen(false);
    setQuery("");
  };

  const handleKey = (e) => {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
      e.preventDefault();
      setOpen(true);
      return;
    }
    if (e.key === "Escape") {
      setOpen(false);
      setQuery("");
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHiIdx((i) => Math.min(i + 1, totalRows - 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHiIdx((i) => Math.max(i - 1, 0));
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (hiIdx === filtered.length && showAddNew) {
        onAddNew && onAddNew(query);
        setOpen(false);
        setQuery("");
      } else if (filtered[hiIdx]) selectCustomer(filtered[hiIdx]);
    }
  };

  const typeStyle =
    customerType && TYPE_COLORS[customerType]
      ? {
          background: TYPE_COLORS[customerType].bg,
          color: TYPE_COLORS[customerType].color,
          border: `1px solid ${TYPE_COLORS[customerType].border}`,
        }
      : null;

  return (
    <div className="cdd-wrap" ref={wrapRef} style={{ position: "relative" }}>
      <div className="cdd-input-row">
        {typeStyle && (
          <span className="cdd-type-badge" style={typeStyle}>
            {customerType}
          </span>
        )}
        <input
          ref={inputRef}
          className="sl-cust-input cdd-input"
          style={{ flex: 1, minWidth: 0, cursor: "pointer" }}
          value={open ? query : value ? displayName : ""}
          placeholder={value ? displayName : "COUNTER SALE — type or ↓"}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => {
            setOpen(true);
          }}
          onKeyDown={handleKey}
          autoComplete="off"
        />
        {value && (
          <button
            className="xp-btn xp-btn-sm xp-btn-danger"
            style={{
              height: 22,
              padding: "0 5px",
              fontSize: 10,
              flexShrink: 0,
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              onClear();
              setQuery("");
              setOpen(false);
            }}
            title="Clear → Counter Sale"
          >
            ✕
          </button>
        )}
      </div>

      {/* FIX 4: dropdown opens UPWARD — bottom: 100% instead of top: 100% */}
      {open && (
        <div
          className="cdd-dropdown"
          ref={listRef}
          style={{
            position: "absolute",
            bottom: "100%",
            left: 0,
            right: 0,
            marginBottom: 2,
            maxHeight: 260,
            overflowY: "auto",
            zIndex: 9999,
            background: "#fff",
            border: "1px solid #b0b8c8",
            borderRadius: 3,
            boxShadow: "0 -4px 16px rgba(0,0,0,0.18)",
          }}
        >
          {filtered.length === 0 && !showAddNew && (
            <div className="cdd-empty">
              No customers — type a name to add new
            </div>
          )}
          {filtered.map((c, i) => {
            const tc = c.customerType || c.type || "";
            const ts = TYPE_COLORS[tc];
            return (
              <div
                key={c._id}
                className={`cdd-item${i === hiIdx ? " hi" : ""}`}
                onMouseEnter={() => setHiIdx(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  selectCustomer(c);
                }}
              >
                <span className="cdd-item-code">{c.code || "—"}</span>
                <span className="cdd-item-name">{c.name}</span>
                {tc && ts && (
                  <span
                    className="cdd-item-type"
                    style={{
                      background: ts.bg,
                      color: ts.color,
                      border: `1px solid ${ts.border}`,
                    }}
                  >
                    {tc}
                  </span>
                )}
                <span
                  className="cdd-item-bal"
                  style={{
                    color:
                      (c.currentBalance || 0) > 0 ? "var(--xp-red)" : "#999",
                  }}
                >
                  {Number(c.currentBalance || 0).toLocaleString("en-PK")}
                </span>
              </div>
            );
          })}
          {showAddNew && (
            <div
              className={`cdd-item cdd-add-new${hiIdx === filtered.length ? " hi" : ""}`}
              onMouseEnter={() => setHiIdx(filtered.length)}
              onMouseDown={(e) => {
                e.preventDefault();
                onAddNew && onAddNew(query);
                setOpen(false);
                setQuery("");
              }}
            >
              <span>
                ➕ Add &ldquo;<strong>{query}</strong>&rdquo; as new credit
                customer
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────────── */
export default function SalePage() {
  const [time, setTime] = useState(timeNow());
  const [allProducts, setAllProducts] = useState([]);
  const [allCustomers, setAllCustomers] = useState([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showHoldPreview, setShowHoldPreview] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [curRow, setCurRow] = useState({ ...EMPTY_ROW });
  const [items, setItems] = useState([]);
  const [invoiceDate, setInvoiceDate] = useState(isoDate());
  const [invoiceNo, setInvoiceNo] = useState("INV-00001");

  /* customer */
  const [customerId, setCustomerId] = useState("");
  const [buyerName, setBuyerName] = useState("COUNTER SALE");
  const [buyerCode, setBuyerCode] = useState("");
  const [customerType, setCustomerType] = useState("");
  const [prevBalance, setPrevBalance] = useState(0);

  /* financials */
  const [extraDiscount, setExtraDiscount] = useState(0);
  const [received, setReceived] = useState(0);
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [saleSource, setSaleSource] = useState("cash"); // FIX 1: default cash

  /* misc */
  const [holdBills, setHoldBills] = useState([]);
  const [editId, setEditId] = useState(null);
  const [selItemIdx, setSelItemIdx] = useState(null);
  const [msg, setMsg] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);
  const [printType, setPrintType] = useState("A5"); // FIX 2: default A5
  const [sendSms, setSendSms] = useState(false);
  const [packingOptions, setPackingOptions] = useState([]);

  /* FIX 3: invoice modal after save */
  const [showInvoice, setShowInvoice] = useState(false);
  const [savedSale, setSavedSale] = useState(null);

  const searchRef = useRef(null);
  const pcsRef = useRef(null);
  const rateRef = useRef(null);
  const addRef = useRef(null);
  const receivedRef = useRef(null);
  const discRef = useRef(null);
  const saveRef = useRef(null);

  useEffect(() => {
    const t = setInterval(() => setTime(timeNow()), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    fetchData();
  }, []);

  /* ── totals ── */
  const subTotal = items.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
  const billAmount = subTotal - (parseFloat(extraDiscount) || 0);
  const balance =
    billAmount + (parseFloat(prevBalance) || 0) - (parseFloat(received) || 0);

  useEffect(() => {
    if (paymentMode !== "Credit") {
      setReceived(billAmount + (parseFloat(prevBalance) || 0));
    }
  }, [billAmount, prevBalance, paymentMode]);

  const handlePaymentMode = (mode) => {
    setPaymentMode(mode);
    if (mode === "Credit") setReceived(0);
    else setReceived(billAmount + (parseFloat(prevBalance) || 0));
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pRes, cRes, invRes] = await Promise.all([
        api.get(EP.PRODUCTS.GET_ALL),
        api.get(EP.CUSTOMERS.GET_ALL),
        api.get(EP.SALES.NEXT_INVOICE),
      ]);
      if (pRes.data.success) setAllProducts(pRes.data.data);
      if (cRes.data.success) setAllCustomers(cRes.data.data);
      if (invRes.data.success) setInvoiceNo(invRes.data.data.invoiceNo);
    } catch {
      showMsg("Failed to load data", "error");
    }
    setLoading(false);
  };

  const refreshInvoiceNo = async () => {
    try {
      const res = await api.get(EP.SALES.NEXT_INVOICE);
      if (res.data.success) setInvoiceNo(res.data.data.invoiceNo);
    } catch {}
  };

  const showMsg = (text, type = "success") => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: "", type: "" }), 3500);
  };

  /* ── Customer select — FIX 1: auto saleSource & paymentMode ── */
  const handleCustomerSelect = (c) => {
    const type = c.customerType || c.type || "";
    setCustomerId(c._id);
    setBuyerName(c.name);
    setBuyerCode(c.code || "");
    setCustomerType(type);
    setPrevBalance(c.currentBalance || 0);

    // FIX 1: auto-derive payment mode and sale source from customer type
    const pm = typeToPayment(type);
    const ss = typeToSource(type);
    setPaymentMode(pm);
    setSaleSource(ss);

    if (pm === "Credit") setReceived(0);
    else setReceived(billAmount + (c.currentBalance || 0));
    setTimeout(() => searchRef.current?.focus(), 30);
  };

  const handleCustomerClear = () => {
    setCustomerId("");
    setBuyerName("COUNTER SALE");
    setBuyerCode("");
    setCustomerType("");
    setPrevBalance(0);
    setPaymentMode("Cash");
    setSaleSource("cash"); // FIX 1: reset to cash
    setReceived(billAmount);
  };

  const handleAddNewCustomer = (name) => {
    setBuyerName(name || "COUNTER SALE");
    setCustomerId("");
    setCustomerType("");
    showMsg(
      `"${name}" set as buyer name. Register from Customers page to track balance.`,
      "success",
    );
    setTimeout(() => searchRef.current?.focus(), 30);
  };

  /* ── Product pick ── */
  const pickProduct = (product) => {
    if (!product._id) {
      showMsg("Product ID missing", "error");
      return;
    }
    const opts = product.packingInfo?.map((pk) => pk.measurement) || [];
    setPackingOptions(opts);
    setCurRow({
      productId: product._id,
      code: product.code || "",
      name: product._name || product.description || "",
      uom: product._meas || "",
      rack: product.rack || "",
      pcs: product._pack || 1,
      rate: product._rate || 0,
      amount: (product._pack || 1) * (product._rate || 0),
    });
    setSearchText(product._name || product.description || "");
    setShowProductModal(false);
    setTimeout(() => pcsRef.current?.focus(), 30);
  };

  const updateCurRow = (field, val) => {
    setCurRow((prev) => {
      const u = { ...prev, [field]: val };
      u.amount =
        (parseFloat(field === "pcs" ? val : u.pcs) || 0) *
        (parseFloat(field === "rate" ? val : u.rate) || 0);
      return u;
    });
  };

  const addRow = () => {
    if (!curRow.name) {
      setShowProductModal(true);
      return;
    }
    if (!curRow.productId) {
      showMsg("Please select a valid product", "error");
      return;
    }
    if (parseFloat(curRow.pcs) <= 0) {
      showMsg("Qty must be > 0", "error");
      return;
    }
    if (selItemIdx !== null) {
      setItems((prev) => {
        const u = [...prev];
        u[selItemIdx] = { ...curRow };
        return u;
      });
      setSelItemIdx(null);
    } else {
      setItems((p) => [...p, { ...curRow }]);
    }
    resetCurRow();
  };

  const resetCurRow = () => {
    setCurRow({ ...EMPTY_ROW });
    setSearchText("");
    setPackingOptions([]);
    setSelItemIdx(null);
    setTimeout(() => searchRef.current?.focus(), 30);
  };

  const loadRowForEdit = (idx) => {
    setSelItemIdx(idx);
    const r = items[idx];
    setCurRow({ ...r });
    setSearchText(r.name);
    setTimeout(() => pcsRef.current?.focus(), 30);
  };

  const removeRow = () => {
    if (selItemIdx === null) return;
    setItems((p) => p.filter((_, i) => i !== selItemIdx));
    resetCurRow();
  };

  const totalQty = items.reduce((s, r) => s + (parseFloat(r.pcs) || 0), 0);

  const holdBill = () => {
    if (!items.length) return;
    setHoldBills((p) => [
      ...p,
      {
        id: Date.now(),
        invoiceNo,
        amount: billAmount,
        items: [...items],
        customerId,
        buyerName,
        buyerCode,
        customerType,
        prevBalance,
        extraDiscount,
        paymentMode,
        saleSource,
      },
    ]);
    fullReset();
    refreshInvoiceNo();
  };

  const resumeHold = (holdId) => {
    const bill = holdBills.find((b) => b.id === holdId);
    if (!bill) return;
    setItems(bill.items);
    setCustomerId(bill.customerId || "");
    setBuyerName(bill.buyerName || "COUNTER SALE");
    setBuyerCode(bill.buyerCode || "");
    setCustomerType(bill.customerType || "");
    setPrevBalance(bill.prevBalance || 0);
    setExtraDiscount(bill.extraDiscount || 0);
    setPaymentMode(bill.paymentMode || "Cash");
    setSaleSource(bill.saleSource || "cash");
    setHoldBills((p) => p.filter((b) => b.id !== holdId));
    setShowHoldPreview(null);
    resetCurRow();
  };

  const deleteHold = (holdId, e) => {
    e.stopPropagation();
    if (window.confirm("Delete this held bill?"))
      setHoldBills((p) => p.filter((b) => b.id !== holdId));
  };

  const fullReset = () => {
    setItems([]);
    setCurRow({ ...EMPTY_ROW });
    setSearchText("");
    setPackingOptions([]);
    setCustomerId("");
    setBuyerName("COUNTER SALE");
    setBuyerCode("");
    setCustomerType("");
    setPrevBalance(0);
    setExtraDiscount(0);
    setReceived(0);
    setPaymentMode("Cash");
    setSaleSource("cash"); // FIX 1
    setEditId(null);
    setSelItemIdx(null);
    setMsg({ text: "", type: "" });
    setTimeout(() => searchRef.current?.focus(), 50);
  };

  /* FIX 3: saveSale — show invoice after save */
  const saveSale = async () => {
    if (!items.length) {
      alert("Add at least one item");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        invoiceDate,
        customerId: customerId || undefined,
        customerName: buyerName || "COUNTER SALE",
        customerPhone: buyerCode,
        items: items.map((r) => ({
          productId: r.productId || undefined,
          code: r.code,
          description: r.name,
          measurement: r.uom,
          rack: r.rack,
          qty: parseFloat(r.pcs) || 1,
          rate: parseFloat(r.rate) || 0,
          disc: 0,
          amount: parseFloat(r.amount) || 0,
        })),
        subTotal,
        extraDisc: parseFloat(extraDiscount) || 0,
        discAmount: 0,
        netTotal: billAmount,
        prevBalance: parseFloat(prevBalance) || 0,
        paidAmount: parseFloat(received) || 0,
        balance,
        paymentMode,
        saleSource,
        sendSms,
        printType,
        remarks: "",
        saleType: "sale",
      };
      const { data } = editId
        ? await api.put(EP.SALES.UPDATE(editId), payload)
        : await api.post(EP.SALES.CREATE, payload);

      if (data.success) {
        showMsg(editId ? "Sale updated!" : `Saved: ${data.data.invoiceNo}`);

        // FIX 3: build savedSale object for invoice modal
        setSavedSale({
          invoiceNo: data.data.invoiceNo,
          invoiceDate,
          customerName: buyerName || "COUNTER SALE",
          saleSource,
          paymentMode,
          items: items.map((r) => ({
            name: r.name,
            uom: r.uom,
            pcs: parseFloat(r.pcs) || 1,
            rate: parseFloat(r.rate) || 0,
            amount: parseFloat(r.amount) || 0,
          })),
          subTotal,
          extraDisc: parseFloat(extraDiscount) || 0,
          netTotal: billAmount,
          prevBalance: parseFloat(prevBalance) || 0,
          paidAmount: parseFloat(received) || 0,
          balance,
        });
        setShowInvoice(true); // show invoice modal

        fullReset();
        await refreshInvoiceNo();
      } else showMsg(data.message, "error");
    } catch (e) {
      showMsg(e.response?.data?.message || "Save failed", "error");
    }
    setLoading(false);
  };

  /* ── Global shortcuts ── */
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "F2") {
        e.preventDefault();
        setShowProductModal(true);
      }
      if (e.key === "F4") {
        e.preventDefault();
        holdBill();
      }
      if (e.key === "F10" || (e.ctrlKey && e.key === "s")) {
        e.preventDefault();
        saveRef.current?.click();
      }
      if (e.key === "Escape" && !showProductModal && !showHoldPreview)
        resetCurRow();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [items, showProductModal, showHoldPreview, billAmount]);

  const EMPTY_ROWS = Math.max(0, 8 - items.length);

  return (
    <div className="sl-page">
      {showProductModal && (
        <SearchModal
          allProducts={allProducts}
          onSelect={pickProduct}
          onClose={() => {
            setShowProductModal(false);
            setTimeout(() => searchRef.current?.focus(), 30);
          }}
        />
      )}
      {showHoldPreview && (
        <HoldPreviewModal
          bill={showHoldPreview}
          onResume={resumeHold}
          onClose={() => setShowHoldPreview(null)}
        />
      )}
      {/* FIX 3: Invoice modal after save */}
      {showInvoice && savedSale && (
        <InvoiceModal
          sale={savedSale}
          printType={printType}
          onClose={() => {
            setShowInvoice(false);
            setSavedSale(null);
          }}
        />
      )}

      {/* TITLEBAR */}
      <div className="xp-titlebar">
        <svg
          width="15"
          height="15"
          viewBox="0 0 16 16"
          fill="rgba(255,255,255,0.85)"
        >
          <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v1h14V4a1 1 0 0 0-1-1zm13 4H1v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1zM2 10h2a1 1 0 0 1 0 2H2a1 1 0 0 1 0-2m4 0h6a1 1 0 0 1 0 2H6a1 1 0 0 1 0-2" />
        </svg>
        <span className="xp-tb-title">
          Sale Invoice — Asim Electric &amp; Electronic Store
        </span>
        <div className="xp-tb-actions">
          {editId && (
            <div className="sl-edit-badge">
              <svg
                width="10"
                height="10"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168z" />
              </svg>{" "}
              Editing Sale
            </div>
          )}
          <div className="xp-tb-divider" />
          <div className="sl-shortcut-hints">
            <span>F2 Product</span>
            <span>F4 Hold</span>
            <span>F10 Save</span>
          </div>
          <div className="xp-tb-divider" />
          <button className="xp-cap-btn">─</button>
          <button className="xp-cap-btn">□</button>
          <button className="xp-cap-btn xp-cap-close">✕</button>
        </div>
      </div>

      {/* ALERT */}
      {msg.text && (
        <div
          className={`xp-alert ${msg.type === "success" ? "xp-alert-success" : "xp-alert-error"}`}
          style={{ margin: "4px 10px 0", flexShrink: 0 }}
        >
          {msg.text}
        </div>
      )}

      {/* MAIN BODY */}
      <div className="sl-body">
        <div className="sl-left">
          {/* Row 1: Invoice info */}
          <div className="sl-top-bar">
            <div className="sl-sale-title-box">Sale</div>
            <div className="sl-inv-field-grp">
              <label>Invoice #</label>
              <input
                className="xp-input xp-input-sm sl-inv-input"
                value={editId ? "EDIT MODE" : invoiceNo}
                readOnly
              />
            </div>
            <div className="sl-inv-field-grp">
              <label>Date</label>
              <input
                type="date"
                className="xp-input xp-input-sm sl-date-input"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
              />
            </div>
            <div className="sl-inv-field-grp">
              <label>Time</label>
              <div className="sl-time-box">{time}</div>
            </div>
          </div>

          {/* Row 2: Entry strip */}
          <div className="sl-entry-strip">
            <div className="sl-entry-cell sl-entry-product">
              <label>
                Select Product <kbd>F2</kbd>
              </label>
              <input
                ref={searchRef}
                type="text"
                className="sl-product-input"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onClick={() => setShowProductModal(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === "ArrowDown") {
                    e.preventDefault();
                    setShowProductModal(true);
                  }
                }}
                placeholder="Enter / F2 to search…"
                readOnly={!!curRow.name}
                autoFocus
              />
            </div>
            <div className="sl-entry-cell">
              <label>Packing</label>
              {packingOptions.length > 0 ? (
                <select
                  className="sl-uom-select"
                  value={curRow.uom}
                  onChange={(e) =>
                    setCurRow((p) => ({ ...p, uom: e.target.value }))
                  }
                >
                  {packingOptions.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  className="xp-input xp-input-sm"
                  style={{ width: 65 }}
                  value={curRow.uom}
                  onChange={(e) =>
                    setCurRow((p) => ({ ...p, uom: e.target.value }))
                  }
                  onKeyDown={(e) =>
                    e.key === "Enter" && pcsRef.current?.focus()
                  }
                />
              )}
            </div>
            <div className="sl-entry-cell">
              <label>Pcs</label>
              <input
                ref={pcsRef}
                type="number"
                className="sl-num-input"
                style={{ width: 60 }}
                value={curRow.pcs}
                min={1}
                onChange={(e) => updateCurRow("pcs", e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && rateRef.current?.focus()}
                onFocus={(e) => e.target.select()}
              />
            </div>
            <div className="sl-entry-cell">
              <label>Rate</label>
              <input
                ref={rateRef}
                type="number"
                className="sl-num-input"
                style={{ width: 75 }}
                value={curRow.rate}
                min={0}
                onChange={(e) => updateCurRow("rate", e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addRef.current?.click()}
                onFocus={(e) => e.target.select()}
              />
            </div>
            <div className="sl-entry-cell">
              <label>Amount</label>
              <input
                className="sl-num-input"
                style={{ width: 80 }}
                value={Number(curRow.amount || 0).toLocaleString("en-PK")}
                readOnly
              />
            </div>
            <div className="sl-entry-cell sl-entry-btns-cell">
              <label>&nbsp;</label>
              <div className="sl-entry-btns">
                <button className="xp-btn xp-btn-sm" onClick={resetCurRow}>
                  Reset
                </button>
                <button
                  ref={addRef}
                  className="xp-btn xp-btn-primary xp-btn-sm"
                  onClick={addRow}
                >
                  {selItemIdx !== null ? "Update" : "Add"}
                </button>
                <button
                  className="xp-btn xp-btn-sm"
                  disabled={selItemIdx === null}
                  onClick={() =>
                    selItemIdx !== null && loadRowForEdit(selItemIdx)
                  }
                >
                  Edit
                </button>
                <button
                  className="xp-btn xp-btn-danger xp-btn-sm"
                  disabled={selItemIdx === null}
                  onClick={removeRow}
                >
                  Remove
                </button>
              </div>
            </div>
          </div>

          {/* Table header bar */}
          <div className="sl-table-header-bar">
            <span className="sl-table-lbl">
              {curRow.name ? (
                <span className="sl-cur-name-inline">{curRow.name}</span>
              ) : (
                "Select Product"
              )}
            </span>
            <span className="sl-table-qty">
              {totalQty.toLocaleString("en-PK")}
            </span>
          </div>

          {/* Items table */}
          <div className="sl-items-wrap">
            <table className="sl-items-table">
              <thead>
                <tr>
                  <th style={{ width: 32 }}>Sr.#</th>
                  <th style={{ width: 72 }}>code</th>
                  <th>Name</th>
                  <th style={{ width: 65 }}>UOM</th>
                  <th style={{ width: 55 }} className="r">
                    Pcs
                  </th>
                  <th style={{ width: 80 }} className="r">
                    Rate
                  </th>
                  <th style={{ width: 90 }} className="r">
                    Amount
                  </th>
                  <th style={{ width: 50 }}>Rack</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="xp-empty"
                      style={{ padding: 14 }}
                    >
                      Search and add products to start the bill
                    </td>
                  </tr>
                )}
                {items.map((r, i) => (
                  <tr
                    key={i}
                    className={selItemIdx === i ? "sl-sel-row" : ""}
                    onClick={() => setSelItemIdx(i === selItemIdx ? null : i)}
                    onDoubleClick={() => loadRowForEdit(i)}
                  >
                    <td
                      className="muted"
                      style={{
                        textAlign: "center",
                        fontSize: "var(--xp-fs-xs)",
                      }}
                    >
                      {i + 1}
                    </td>
                    <td className="muted">{r.code}</td>
                    <td style={{ fontWeight: 500 }}>{r.name}</td>
                    <td className="muted">{r.uom}</td>
                    <td className="r">{r.pcs}</td>
                    <td className="r">
                      {Number(r.rate).toLocaleString("en-PK")}
                    </td>
                    <td className="r" style={{ color: "var(--xp-blue-dark)" }}>
                      {Number(r.amount).toLocaleString("en-PK")}
                    </td>
                    <td className="muted">{r.rack}</td>
                  </tr>
                ))}
                {Array.from({ length: EMPTY_ROWS }).map((_, i) => (
                  <tr key={`e${i}`} className="sl-empty-row">
                    <td colSpan={8} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary bar */}
          <div className="sl-summary-bar">
            <div className="sl-sum-cell">
              <label>Total Qty</label>
              <input
                className="sl-sum-val"
                value={totalQty.toLocaleString("en-PK")}
                readOnly
              />
            </div>
            <div className="sl-sum-cell">
              <label>Net Amount</label>
              <input
                className="sl-sum-val"
                value={Number(subTotal).toLocaleString("en-PK")}
                readOnly
              />
            </div>
            <div className="sl-sum-cell">
              <label>Bill Amount</label>
              <input
                className="sl-sum-val"
                value={Number(billAmount).toLocaleString("en-PK")}
                readOnly
              />
            </div>
            <div className="sl-sum-cell">
              <label>Extra Discount</label>
              <input
                ref={discRef}
                type="number"
                className="sl-sum-input"
                value={extraDiscount}
                min={0}
                onChange={(e) => setExtraDiscount(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && receivedRef.current?.focus()
                }
                onFocus={(e) => e.target.select()}
              />
            </div>
            <div className="sl-sum-cell">
              <label>Received</label>
              <input
                ref={receivedRef}
                type="number"
                className="sl-sum-input"
                style={{ color: "var(--xp-green)", fontWeight: 700 }}
                value={received}
                min={0}
                onChange={(e) => setReceived(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveRef.current?.focus()}
                onFocus={(e) => e.target.select()}
              />
            </div>
            <div className="sl-sum-cell">
              <label>Balance</label>
              <input
                className={`sl-sum-val sl-bal${balance > 0 ? " danger" : balance < 0 ? " success" : ""}`}
                value={Number(balance).toLocaleString("en-PK")}
                readOnly
              />
            </div>
          </div>

          {/* ── CUSTOMER BAR ── */}
          <div className="sl-customer-bar">
            <div className="sl-cust-cell">
              <label>Code</label>
              <input
                className="sl-cust-input"
                style={{ width: 55 }}
                value={buyerCode}
                onChange={(e) => setBuyerCode(e.target.value)}
              />
            </div>

            <div className="sl-cust-cell sl-cust-buyer">
              <label>Buyer Name</label>
              <CustomerDropdown
                allCustomers={allCustomers}
                value={customerId}
                displayName={buyerName}
                customerType={customerType}
                onSelect={handleCustomerSelect}
                onClear={handleCustomerClear}
                onAddNew={handleAddNewCustomer}
              />
            </div>

            <div className="sl-cust-cell">
              <label>Prev Balance</label>
              <input
                type="number"
                className="sl-cust-input"
                style={{ width: 85 }}
                value={prevBalance}
                onChange={(e) => setPrevBalance(e.target.value)}
                onFocus={(e) => e.target.select()}
              />
            </div>

            <div className="sl-cust-cell">
              <label>Net Recv.</label>
              <input
                className="sl-cust-input sl-net-recv"
                style={{
                  color: balance > 0 ? "var(--xp-red)" : "var(--xp-green)",
                  fontWeight: 700,
                  width: 85,
                }}
                value={Number(balance).toLocaleString("en-PK")}
                readOnly
              />
            </div>

            {/* Payment Mode */}
            <div className="sl-pay-btns">
              {["Cash", "Credit", "Bank", "Cheque"].map((m) => (
                <button
                  key={m}
                  className={`sl-pay-btn${paymentMode === m ? " active-" + m.toLowerCase() : ""}`}
                  onClick={() => handlePaymentMode(m)}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: Hold Bills */}
        <div className="sl-right">
          <div className="sl-hold-panel">
            <div className="sl-hold-title">
              <span>
                Hold Bills{" "}
                <kbd
                  style={{
                    fontSize: 9,
                    background: "rgba(255,255,255,0.2)",
                    padding: "0 3px",
                    borderRadius: 2,
                  }}
                >
                  F4
                </kbd>
              </span>
              <span className="sl-hold-cnt">{holdBills.length}</span>
            </div>
            <div className="sl-hold-table-wrap">
              <table className="sl-hold-table">
                <thead>
                  <tr>
                    <th style={{ width: 24 }}>#</th>
                    <th>Bill #</th>
                    <th className="r">Amount</th>
                    <th>Customer</th>
                    <th style={{ width: 22 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {holdBills.length === 0
                    ? Array.from({ length: 8 }).map((_, i) => (
                        <tr key={i}>
                          <td colSpan={5} style={{ height: 22 }} />
                        </tr>
                      ))
                    : holdBills.map((b, i) => (
                        <tr
                          key={b.id}
                          onClick={() => setShowHoldPreview(b)}
                          onDoubleClick={() => resumeHold(b.id)}
                          title="Click = preview · Dbl-click = resume"
                        >
                          <td
                            className="muted"
                            style={{
                              textAlign: "center",
                              fontSize: "var(--xp-fs-xs)",
                            }}
                          >
                            {i + 1}
                          </td>
                          <td
                            style={{
                              fontFamily: "var(--xp-mono)",
                              fontSize: "var(--xp-fs-xs)",
                            }}
                          >
                            {b.invoiceNo}
                          </td>
                          <td
                            className="r"
                            style={{ color: "var(--xp-blue-dark)" }}
                          >
                            {Number(b.amount).toLocaleString("en-PK")}
                          </td>
                          <td
                            className="muted"
                            style={{ fontSize: "var(--xp-fs-xs)" }}
                          >
                            {b.buyerName}
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <button
                              className="xp-btn xp-btn-sm xp-btn-ico"
                              style={{
                                width: 18,
                                height: 18,
                                fontSize: 9,
                                color: "var(--xp-red)",
                              }}
                              onClick={(e) => deleteHold(b.id, e)}
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>
            <div className="sl-hold-scroll-btns">
              <button className="xp-btn xp-btn-sm xp-btn-ico">◀</button>
              <button className="xp-btn xp-btn-sm xp-btn-ico">▶</button>
            </div>
            <div style={{ padding: "4px 8px", flexShrink: 0 }}>
              <button
                className="xp-btn xp-btn-sm"
                style={{ width: "100%" }}
                onClick={holdBill}
                disabled={!items.length}
              >
                Hold Bill (F4)
              </button>
            </div>
            <div className="sl-hold-hint">
              Click = preview · Dbl-click = resume · ✕ = delete
            </div>
          </div>
        </div>
      </div>

      {/* COMMANDS BAR */}
      <div className="sl-cmd-bar">
        <button
          className="xp-btn xp-btn-sm"
          onClick={fullReset}
          disabled={loading}
        >
          Refresh
        </button>
        <button
          ref={saveRef}
          className="xp-btn xp-btn-primary xp-btn-lg"
          onClick={saveSale}
          disabled={loading}
        >
          {loading ? "Saving…" : "Save  F10"}
        </button>
        <button className="xp-btn xp-btn-sm" onClick={() => {}}>
          Edit Record
        </button>
        <button
          className="xp-btn xp-btn-danger xp-btn-sm"
          disabled={!editId}
          onClick={async () => {
            if (!editId) return;
            if (!window.confirm("Delete this sale?")) return;
            try {
              await api.delete(EP.SALES.DELETE(editId));
              showMsg("Sale deleted");
              fullReset();
              refreshInvoiceNo();
            } catch {
              showMsg("Delete failed", "error");
            }
          }}
        >
          Delete Record
        </button>
        <div className="xp-toolbar-divider" />
        <div className="sl-cmd-checks">
          <label className="sl-check-label">
            <input
              type="checkbox"
              checked={sendSms}
              onChange={(e) => setSendSms(e.target.checked)}
            />
            Send SMS
          </label>
          <label className="sl-check-label">
            <input type="checkbox" /> Print P.Bal
          </label>
          <label className="sl-check-label">
            <input type="checkbox" /> Gate Pass
          </label>
        </div>
        <div className="xp-toolbar-divider" />
        {/* FIX 2: default A5 */}
        <div className="sl-print-types">
          {["Thermal", "A4", "A5"].map((pt) => (
            <label key={pt} className="sl-check-label">
              <input
                type="radio"
                name="pt"
                checked={printType === pt}
                onChange={() => setPrintType(pt)}
              />
              {pt}
            </label>
          ))}
        </div>
        <div className="xp-toolbar-divider" />
        <span className={`sl-inv-info${editId ? " edit-mode" : ""}`}>
          {editId
            ? "✏ Editing sale record"
            : `${invoiceNo} | Items: ${items.length} | Total: ${Number(subTotal).toLocaleString("en-PK")} | ${saleSource} / ${paymentMode}`}
        </span>
        <button
          className="xp-btn xp-btn-sm"
          style={{ marginLeft: "auto" }}
          onClick={fullReset}
        >
          Close
        </button>
      </div>
    </div>
  );
}
