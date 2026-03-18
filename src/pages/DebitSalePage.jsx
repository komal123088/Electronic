import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api.js";
import EP from "../api/apiEndpoints.js";
import "../styles/theme.css";
import "../styles/CreditSalePage.css";
import "../styles/CreditCustomersPage.css";
import "../styles/DebitSalePage.css";

const isoDate = () => new Date().toISOString().split("T")[0];
const fmt = (n) => Number(n || 0).toLocaleString("en-PK");
const SHOP_NAME = "Asim Electric and Electronic Store";

const EMPTY_ROW = {
  productId: "",
  code: "",
  description: "",
  measurement: "",
  qty: 1,
  rate: 0,
  disc: 0,
  amount: 0,
};

/* ─────────────────────────────────────────────────────────────
   CUSTOMER SELECT MODAL
───────────────────────────────────────────────────────────── */
function CustomerSelectModal({ customers, onSelect, onClose }) {
  const [hiIdx, setHiIdx] = useState(0);
  const tbodyRef = useRef(null);

  useEffect(() => {
    tbodyRef.current?.focus();
  }, []);
  useEffect(() => {
    tbodyRef.current?.children[hiIdx]?.scrollIntoView({ block: "nearest" });
  }, [hiIdx]);

  const onKey = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHiIdx((i) => Math.min(i + 1, customers.length - 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHiIdx((i) => Math.max(i - 1, 0));
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (customers[hiIdx]) onSelect(customers[hiIdx]);
    }
    if (e.key === "Escape") onClose();
  };

  return (
    <div
      className="xp-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="xp-modal xp-modal-md">
        <div className="xp-modal-tb">
          <svg
            width="13"
            height="13"
            viewBox="0 0 16 16"
            fill="rgba(255,255,255,0.8)"
          >
            <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0m4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4" />
          </svg>
          <span className="xp-modal-title">
            Select Debit Customer ({customers.length} found)
          </span>
          <button className="xp-cap-btn xp-cap-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="xp-modal-body" style={{ padding: 0 }}>
          <div className="xp-table-panel" style={{ border: "none" }}>
            <div className="xp-table-scroll">
              <table className="xp-table">
                <thead>
                  <tr>
                    <th style={{ width: 32 }}>#</th>
                    <th>Name</th>
                    <th>Phone</th>
                    <th className="r">Balance</th>
                  </tr>
                </thead>
                <tbody ref={tbodyRef} tabIndex={0} onKeyDown={onKey}>
                  {customers.map((c, i) => (
                    <tr
                      key={c._id}
                      style={{
                        background: i === hiIdx ? "#c3d9f5" : undefined,
                      }}
                      onClick={() => setHiIdx(i)}
                      onDoubleClick={() => onSelect(c)}
                    >
                      <td className="text-muted">{i + 1}</td>
                      <td>
                        <button className="xp-link-btn">{c.name}</button>
                      </td>
                      <td className="text-muted">{c.phone || "—"}</td>
                      <td className="r">
                        <span
                          className={`xp-amt${(c.currentBalance || 0) > 0 ? " danger" : " muted"}`}
                        >
                          {fmt(c.currentBalance || 0)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="ds-cust-sel-hint">
          ↑↓ navigate &nbsp;|&nbsp; Enter / Double-click = select &nbsp;|&nbsp;
          Esc = close
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
    const ld = d.trim().toLowerCase(),
      lc = c.trim().toLowerCase(),
      lo = co.trim().toLowerCase();
    const res = [];
    products.forEach((p) => {
      if (
        !(
          (!ld ||
            p.description?.toLowerCase().includes(ld) ||
            p.code?.toLowerCase().includes(ld)) &&
          (!lc || p.category?.toLowerCase().includes(lc)) &&
          (!lo || p.company?.toLowerCase().includes(lo))
        )
      )
        return;
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
    tbodyRef.current?.children[hiIdx]?.scrollIntoView({ block: "nearest" });
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
            <span
              style={{
                fontSize: "var(--xp-fs-xs)",
                color: "#555",
                whiteSpace: "nowrap",
              }}
            >
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
                      <td className="r xp-amt">{fmt(r._rate)}</td>
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
   INVOICE MODAL
───────────────────────────────────────────────────────────── */
function InvoiceModal({ sale, shopName, onClose }) {
  const modeBadgeClass =
    sale.paymentMode === "Cash"
      ? "ds-inv-mode-cash"
      : sale.paymentMode === "Credit"
        ? "ds-inv-mode-credit"
        : "ds-inv-mode-partial";

  const printA4 = () => {
    const trs = sale.items
      .map(
        (it, i) =>
          `<tr><td>${i + 1}</td><td>${it.description}</td><td>${it.measurement || ""}</td><td align="right">${it.qty}</td><td align="right">${Number(it.rate).toLocaleString()}</td><td align="right">${it.disc || 0}%</td><td align="right"><b>${Number(it.amount).toLocaleString()}</b></td></tr>`,
      )
      .join("");
    const w = window.open("", "_blank", "width=900,height=700");
    w.document.write(
      `<!DOCTYPE html><html><head><title>Invoice ${sale.invoiceNo}</title><style>body{font-family:Arial,sans-serif;font-size:12px;margin:20px}h2{text-align:center;font-size:20px;margin:0}.sub{text-align:center;font-size:11px;color:#555;margin-bottom:8px}.meta{display:flex;justify-content:space-between;border:1px solid #ccc;padding:6px 10px;margin:8px 0;flex-wrap:wrap;gap:4px}table{width:100%;border-collapse:collapse;margin-top:10px}th{background:#e0e0e0;border:1px solid #ccc;padding:4px 6px;text-align:left}td{border:1px solid #ddd;padding:3px 6px}.tots{float:right;min-width:220px;margin-top:10px}.tr{display:flex;justify-content:space-between;padding:2px 0}.tr.b{font-weight:bold;font-size:14px;border-top:1px solid #000;margin-top:4px}.tr.red{color:red}.tr.g{color:green}.thanks{text-align:center;margin-top:30px;font-size:11px;color:#888}@media print{body{margin:5mm}}</style></head><body><h2>${shopName}</h2><div class="sub">DEBIT SALE INVOICE</div><div class="meta"><span><b>Invoice:</b> ${sale.invoiceNo}</span><span><b>Date:</b> ${sale.invoiceDate}</span><span><b>Mode:</b> ${sale.paymentMode}</span>${sale.customerName && sale.customerName !== "COUNTER SALE" ? `<span><b>Customer:</b> ${sale.customerName}${sale.customerPhone ? " | " + sale.customerPhone : ""}</span>` : ""}</div><table><thead><tr><th>#</th><th>Description</th><th>Meas.</th><th align="right">Qty</th><th align="right">Rate</th><th align="right">Disc%</th><th align="right">Amount</th></tr></thead><tbody>${trs}</tbody></table><div class="tots"><div class="tr"><span>Sub Total</span><span>${Number(sale.subTotal).toLocaleString()}</span></div>${sale.discAmount > 0 ? `<div class="tr"><span>Discount</span><span>-${Number(sale.discAmount).toLocaleString()}</span></div>` : ""}<div class="tr b"><span>Net Total</span><span>${Number(sale.netTotal).toLocaleString()}</span></div><div class="tr g"><span>Cash Paid</span><span>${Number(sale.paidAmount || 0).toLocaleString()}</span></div>${(sale.balance || 0) > 0 ? `<div class="tr red"><span>Balance</span><span>${Number(sale.balance).toLocaleString()}</span></div>` : ""}</div><br style="clear:both"><div class="thanks">Thank you! — ${shopName}</div></body></html>`,
    );
    w.document.close();
    setTimeout(() => w.print(), 400);
  };

  const printThermal = () => {
    const trs = sale.items
      .map(
        (it, i) =>
          `<tr><td style="padding:2px 0">${i + 1}. ${it.description}</td><td align="right">${it.qty}×${Number(it.rate).toLocaleString()}</td><td align="right"><b>${Number(it.amount).toLocaleString()}</b></td></tr>`,
      )
      .join("");
    const w = window.open("", "_blank", "width=400,height=600");
    w.document.write(
      `<!DOCTYPE html><html><head><title>Receipt</title><style>body{font-family:'Courier New',monospace;font-size:11px;width:72mm;margin:0 auto;padding:4px}h3{text-align:center;font-size:14px;margin:4px 0}.c{text-align:center;font-size:10px}hr{border:none;border-top:1px dashed #000;margin:4px 0}table{width:100%;font-size:10px;border-collapse:collapse}.t{display:flex;justify-content:space-between;font-size:11px;padding:1px 0}.t.b{font-weight:bold;border-top:1px dashed #000;padding-top:3px;margin-top:2px}.t.red{color:red}.t.g{color:green}@media print{@page{size:80mm auto;margin:3mm}}</style></head><body><h3>${shopName}</h3><div class="c">DEBIT SALE RECEIPT</div><hr><div class="c"><b>${sale.invoiceNo}</b> | ${sale.invoiceDate}</div>${sale.customerName && sale.customerName !== "COUNTER SALE" ? `<div class="c"><b>${sale.customerName}</b></div>` : ""}<hr><table><tbody>${trs}</tbody></table><hr><div class="t"><span>Sub Total</span><span>${Number(sale.subTotal).toLocaleString()}</span></div>${sale.discAmount > 0 ? `<div class="t"><span>Disc</span><span>-${Number(sale.discAmount).toLocaleString()}</span></div>` : ""}<div class="t b"><span>NET TOTAL</span><span>${Number(sale.netTotal).toLocaleString()}</span></div><div class="t g"><span>Cash Paid</span><span>${Number(sale.paidAmount || 0).toLocaleString()}</span></div>${(sale.balance || 0) > 0 ? `<div class="t red"><span>Balance</span><span>${Number(sale.balance).toLocaleString()}</span></div>` : ""}<div style="text-align:center;margin-top:8px;font-size:10px">Thank you!</div></body></html>`,
    );
    w.document.close();
    setTimeout(() => w.print(), 400);
  };

  const shareWA = () => {
    const lines = sale.items
      .map(
        (it, i) =>
          `${i + 1}. ${it.description} | ${it.qty}×${Number(it.rate).toLocaleString()} = *${Number(it.amount).toLocaleString()}*`,
      )
      .join("\n");
    const text = `*${shopName}*\nInvoice #${sale.invoiceNo} | ${sale.invoiceDate}\n${sale.customerName !== "COUNTER SALE" ? "Customer: " + sale.customerName : ""}\n${"─".repeat(26)}\n${lines}\n${"─".repeat(26)}\nNet Total: *${Number(sale.netTotal).toLocaleString()}*\nCash: ${Number(sale.paidAmount || 0).toLocaleString()}${(sale.balance || 0) > 0 ? "\nBalance: *" + Number(sale.balance).toLocaleString() + "*" : ""}\n_Thank you!_`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
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
            <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1L14 5.5z" />
          </svg>
          <span className="xp-modal-title">
            Invoice #{sale.invoiceNo} — {sale.customerName || "Counter Sale"}
          </span>
          <button className="xp-cap-btn xp-cap-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="xp-modal-body">
          <div className="cs-inv-preview">
            <div className="cs-inv-shop">{shopName}</div>
            <div className="cs-inv-sub">◆ Debit Sale Invoice ◆</div>
            <div className="cs-inv-meta">
              <span>
                Invoice: <strong>{sale.invoiceNo}</strong>
              </span>
              <span>
                Date: <strong>{sale.invoiceDate}</strong>
              </span>
              <span>
                Mode:{" "}
                <span className={`ds-inv-mode-badge ${modeBadgeClass}`}>
                  {sale.paymentMode}
                </span>
              </span>
              {sale.customerName && sale.customerName !== "COUNTER SALE" && (
                <span>
                  Customer: <strong>{sale.customerName}</strong>{" "}
                  {sale.customerPhone}
                </span>
              )}
            </div>
            <div className="xp-table-panel">
              <table className="xp-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Description</th>
                    <th>Meas</th>
                    <th className="r">Qty</th>
                    <th className="r">Rate</th>
                    <th className="r">Disc</th>
                    <th className="r">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {sale.items.map((it, i) => (
                    <tr key={i}>
                      <td className="text-muted">{i + 1}</td>
                      <td>{it.description}</td>
                      <td className="text-muted">{it.measurement}</td>
                      <td className="r">{it.qty}</td>
                      <td className="r xp-amt">{fmt(it.rate)}</td>
                      <td className="r">{it.disc || 0}%</td>
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
              {sale.discAmount > 0 && (
                <div className="cs-inv-total-row danger">
                  <span>Discount</span>
                  <span>-{fmt(sale.discAmount)}</span>
                </div>
              )}
              <div className="cs-inv-total-row bold">
                <span>Net Total</span>
                <span className="xp-amt">{fmt(sale.netTotal)}</span>
              </div>
              <div className="cs-inv-total-row success">
                <span>Cash Paid</span>
                <span className="xp-amt success">
                  {fmt(sale.paidAmount || 0)}
                </span>
              </div>
              {(sale.balance || 0) > 0 && (
                <div className="cs-inv-total-row bold danger">
                  <span>Balance</span>
                  <span className="xp-amt danger">{fmt(sale.balance)}</span>
                </div>
              )}
            </div>
            <div className="cs-inv-thanks">
              Thank you for your business! — {shopName}
            </div>
          </div>
        </div>
        <div className="xp-modal-footer">
          <button className="xp-btn xp-btn-sm" onClick={printThermal}>
            <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
              <path d="M2.5 8a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1" />
              <path d="M5 1a2 2 0 0 0-2 2v2H2a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h1v1a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-1h1a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-1V3a2 2 0 0 0-2-2z" />
            </svg>
            Thermal
          </button>
          <button className="xp-btn xp-btn-sm" onClick={printA4}>
            <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
              <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1L14 5.5z" />
            </svg>
            A4 / PDF
          </button>
          <button className="xp-btn xp-btn-wa xp-btn-sm" onClick={shareWA}>
            <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
              <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326z" />
            </svg>
            WhatsApp
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
   CUSTOMER DETAIL MODAL (with payment tabs)
───────────────────────────────────────────────────────────── */
function CustomerDetailModal({ customer, onClose, onPaymentDone }) {
  const [sales, setSales] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loadingS, setLoadingS] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payRemarks, setPayRemarks] = useState("");
  const [payMode, setPayMode] = useState("Cash");
  const [paying, setPaying] = useState(false);
  const [payMsg, setPayMsg] = useState({ text: "", type: "" });
  const [activeTab, setActiveTab] = useState("history");
  const [expanded, setExpanded] = useState(null);
  const payRef = useRef(null);

  useEffect(() => {
    loadData();
  }, [customer._id]);

  const loadData = async () => {
    setLoadingS(true);
    try {
      const [sRes, pRes] = await Promise.all([
        api.get(EP.CUSTOMERS.SALE_HISTORY(customer._id)),
        api.get(EP.PAYMENTS.BY_CUSTOMER(customer._id)),
      ]);
      if (sRes.data.success) setSales(sRes.data.data || []);
      if (pRes.data.success) setPayments(pRes.data.data?.payments || []);
    } catch {}
    setLoadingS(false);
  };

  const showPayMsg = (t, type = "success") => {
    setPayMsg({ text: t, type });
    setTimeout(() => setPayMsg({ text: "", type: "" }), 3000);
  };

  const handlePay = async () => {
    const amt = Number(payAmount);
    if (!amt || amt <= 0) {
      showPayMsg("Valid amount enter karo", "error");
      return;
    }
    setPaying(true);
    try {
      const { data } = await api.post(EP.PAYMENTS.CREATE, {
        customerId: customer._id,
        amount: amt,
        paymentMode: payMode,
        remarks: payRemarks,
        paymentDate: isoDate(),
      });
      if (data.success) {
        showPayMsg(`PKR ${fmt(amt)} payment recorded!`);
        setPayAmount("");
        setPayRemarks("");
        loadData();
        if (onPaymentDone) onPaymentDone();
      } else showPayMsg(data.message || "Failed", "error");
    } catch (e) {
      showPayMsg(e.response?.data?.message || "Failed", "error");
    }
    setPaying(false);
  };

  const sendReceipt = () => {
    const saleTxns = sales.filter((s) => s.saleType === "sale");
    const totalS = saleTxns.reduce((s, x) => s + (x.netTotal || 0), 0);
    const totalP = saleTxns.reduce((s, x) => s + (x.paidAmount || 0), 0);
    const payTotal = payments.reduce((s, p) => s + (p.amount || 0), 0);
    const sep = "━".repeat(28);
    const lines = sales
      .slice(0, 15)
      .map(
        (s, i) =>
          `${i + 1}. ${s.invoiceNo} | ${s.invoiceDate}\n PKR ${fmt(s.netTotal)} | Paid: ${fmt(s.paidAmount)} | *Bal: ${fmt(s.balance)}*`,
      )
      .join("\n");
    const text = `${SHOP_NAME}\n${sep}\nCustomer: ${customer.name}${customer.phone ? "\n" + customer.phone : ""}\nDate: ${isoDate()}\n${sep}\nTRANSACTIONS\n${lines}\n${sep}\nTotal Sales: PKR ${fmt(totalS)}\nPaid: PKR ${fmt(totalP + payTotal)}\nOutstanding: PKR ${fmt(customer.currentBalance || 0)}\n${sep}\nThank you!`;
    window.open(
      `https://wa.me/${(customer.phone || "").replace(/\D/g, "")}?text=${encodeURIComponent(text)}`,
      "_blank",
    );
  };

  const totalS = sales
    .filter((s) => s.saleType === "sale")
    .reduce((s, x) => s + (x.netTotal || 0), 0);
  const totalP = sales
    .filter((s) => s.saleType === "sale")
    .reduce((s, x) => s + (x.paidAmount || 0), 0);
  const payTotal = payments.reduce((s, p) => s + (p.amount || 0), 0);
  const due = customer.currentBalance || 0;

  return (
    <div
      className="xp-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="xp-modal">
        <div className="xp-modal-tb">
          <svg
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="rgba(255,255,255,0.8)"
          >
            <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0m4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4" />
          </svg>
          <span className="xp-modal-title">
            {customer.name}
            {customer.code && (
              <span className="xp-modal-code">{customer.code}</span>
            )}
          </span>
          {customer.phone && (
            <button
              className="xp-btn xp-btn-wa xp-btn-sm"
              onClick={sendReceipt}
              style={{ marginRight: 4 }}
            >
              <svg
                width="11"
                height="11"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326z" />
              </svg>
              Receipt
            </button>
          )}
          <button className="xp-cap-btn xp-cap-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="cc-info-strip">
          <div className="cc-info-meta">
            {customer.phone && (
              <span className="cc-info-chip">
                <svg width="11" height="11" viewBox="0 0 16 16" fill="#0a246a">
                  <path d="M3.654 1.328a.678.678 0 0 0-1.015-.063L1.605 2.3c-.483.484-.661 1.169-.45 1.77a17.6 17.6 0 0 0 4.168 6.608 17.6 17.6 0 0 0 6.608 4.168c.601.211 1.286.033 1.77-.45l1.034-1.034a.678.678 0 0 0-.063-1.015l-2.307-1.794a.68.68 0 0 0-.58-.122l-2.19.547a1.75 1.75 0 0 1-1.657-.459L5.482 8.062a1.75 1.75 0 0 1-.46-1.657l.548-2.19a.68.68 0 0 0-.122-.58z" />
                </svg>
                {customer.phone}
              </span>
            )}
            {customer.area && (
              <span className="cc-info-chip">
                <svg width="11" height="11" viewBox="0 0 16 16" fill="#0a246a">
                  <path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10m0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6" />
                </svg>
                {customer.area}
              </span>
            )}
          </div>
          <div className="cc-stat-row">
            <div className="cc-mini-stat">
              <div className="cc-mini-lbl">Total Sales</div>
              <div className="cc-mini-val">{fmt(totalS)}</div>
            </div>
            <div className="cc-mini-stat">
              <div className="cc-mini-lbl">Paid at Sale</div>
              <div className="cc-mini-val success">{fmt(totalP)}</div>
            </div>
            <div className="cc-mini-stat">
              <div className="cc-mini-lbl">Extra Payments</div>
              <div className="cc-mini-val success">{fmt(payTotal)}</div>
            </div>
            <div className="cc-mini-stat danger">
              <div className="cc-mini-lbl">Outstanding</div>
              <div className="cc-mini-val danger">{fmt(due)}</div>
            </div>
          </div>
        </div>

        <div className="xp-tab-bar">
          <button
            className={`xp-tab${activeTab === "history" ? " active" : ""}`}
            onClick={() => setActiveTab("history")}
          >
            <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 1a7 7 0 1 0 4.95 11.95l.707.707A8.001 8.001 0 1 1 8 0z" />
              <path d="M7.5 3a.5.5 0 0 1 .5.5v5.21l3.248 1.856a.5.5 0 0 1-.496.868l-3.5-2A.5.5 0 0 1 7 9V3.5a.5.5 0 0 1 .5-.5" />
            </svg>
            Transactions <span className="xp-tab-cnt">{sales.length}</span>
          </button>
          <button
            className={`xp-tab${activeTab === "payments" ? " active" : ""}`}
            onClick={() => setActiveTab("payments")}
          >
            <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
              <path d="M12.136.326A1.5 1.5 0 0 1 14 1.78V3h.5A1.5 1.5 0 0 1 16 4.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 0 13.5v-9A1.5 1.5 0 0 1 1.432 3.001L12.136.326z" />
            </svg>
            Payments <span className="xp-tab-cnt">{payments.length}</span>
          </button>
          <button
            className={`xp-tab${activeTab === "pay" ? " active" : ""}`}
            onClick={() => {
              setActiveTab("pay");
              setTimeout(() => payRef.current?.focus(), 60);
            }}
          >
            <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
              <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4" />
            </svg>
            Record Payment
          </button>
        </div>

        <div className="xp-modal-body">
          {activeTab === "history" && (
            <>
              {loadingS && <div className="xp-loading">Loading…</div>}
              {!loadingS && sales.length === 0 && (
                <div className="xp-empty">No transactions found</div>
              )}
              {!loadingS && sales.length > 0 && (
                <div className="xp-table-panel">
                  <div className="xp-table-scroll">
                    <table className="xp-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Invoice</th>
                          <th>Date</th>
                          <th className="r">Total</th>
                          <th className="r">Paid</th>
                          <th className="r">Balance</th>
                          <th>Mode</th>
                          <th style={{ width: 24 }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {sales.map((s, i) => (
                          <>
                            <tr
                              key={s._id}
                              className={
                                expanded === s._id ? "cc-row-expanded" : ""
                              }
                              onClick={() =>
                                setExpanded(expanded === s._id ? null : s._id)
                              }
                            >
                              <td className="text-muted">{i + 1}</td>
                              <td
                                style={{
                                  fontFamily: "var(--xp-mono)",
                                  fontSize: "11px",
                                  fontWeight: 700,
                                }}
                              >
                                {s.invoiceNo}
                              </td>
                              <td className="text-muted">{s.invoiceDate}</td>
                              <td className="r xp-amt">{fmt(s.netTotal)}</td>
                              <td className="r xp-amt success">
                                {fmt(s.paidAmount)}
                              </td>
                              <td className="r">
                                {(s.balance || 0) > 0 ? (
                                  <span className="xp-amt danger">
                                    {fmt(s.balance)}
                                  </span>
                                ) : (
                                  <span className="text-muted">—</span>
                                )}
                              </td>
                              <td>
                                <span className="xp-badge xp-badge-info">
                                  {s.paymentMode || "—"}
                                </span>
                              </td>
                              <td
                                style={{
                                  textAlign: "center",
                                  color: "#555",
                                  fontSize: 11,
                                }}
                              >
                                {expanded === s._id ? "▲" : "▼"}
                              </td>
                            </tr>
                            {expanded === s._id && (
                              <tr key={`${s._id}-d`}>
                                <td colSpan={8} className="cc-detail-cell">
                                  <div className="cc-detail-inner">
                                    <table
                                      className="xp-table"
                                      style={{ fontSize: "11px" }}
                                    >
                                      <thead>
                                        <tr>
                                          <th>#</th>
                                          <th>Description</th>
                                          <th>Meas</th>
                                          <th className="r">Qty</th>
                                          <th className="r">Rate</th>
                                          <th className="r">Disc%</th>
                                          <th className="r">Amount</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {(s.items || []).length === 0 && (
                                          <tr>
                                            <td
                                              colSpan={7}
                                              className="text-muted"
                                              style={{
                                                padding: "8px",
                                                textAlign: "center",
                                              }}
                                            >
                                              Items not available
                                            </td>
                                          </tr>
                                        )}
                                        {(s.items || []).map((it, j) => (
                                          <tr key={j}>
                                            <td className="text-muted">
                                              {j + 1}
                                            </td>
                                            <td>{it.description}</td>
                                            <td className="text-muted">
                                              {it.measurement || "—"}
                                            </td>
                                            <td className="r">{it.qty}</td>
                                            <td className="r xp-amt">
                                              {fmt(it.rate)}
                                            </td>
                                            <td className="r">
                                              {it.disc || 0}%
                                            </td>
                                            <td className="r xp-amt">
                                              {fmt(it.amount)}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                  <div className="cc-detail-footer">
                                    <span>
                                      Net:{" "}
                                      <strong>PKR {fmt(s.netTotal)}</strong>
                                    </span>
                                    <span style={{ color: "var(--xp-green)" }}>
                                      Paid:{" "}
                                      <strong>PKR {fmt(s.paidAmount)}</strong>
                                    </span>
                                    {(s.balance || 0) > 0 && (
                                      <span style={{ color: "var(--xp-red)" }}>
                                        Bal:{" "}
                                        <strong>PKR {fmt(s.balance)}</strong>
                                      </span>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === "payments" && (
            <>
              {payments.length === 0 && (
                <div className="xp-empty">No extra payments found</div>
              )}
              {payments.length > 0 && (
                <div className="xp-table-panel">
                  <div className="xp-table-scroll">
                    <table className="xp-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Date</th>
                          <th className="r">Amount</th>
                          <th>Mode</th>
                          <th>Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.map((p, i) => (
                          <tr key={p._id || i}>
                            <td className="text-muted">{i + 1}</td>
                            <td className="text-muted">
                              {p.paymentDate || p.createdAt?.split("T")[0]}
                            </td>
                            <td className="r xp-amt success">
                              PKR {fmt(p.amount)}
                            </td>
                            <td>
                              <span className="xp-badge xp-badge-info">
                                {p.paymentMode || "Cash"}
                              </span>
                            </td>
                            <td className="text-muted">{p.remarks || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan={2} className="text-muted">
                            Total
                          </td>
                          <td className="r xp-amt success">
                            PKR {fmt(payTotal)}
                          </td>
                          <td colSpan={2}></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === "pay" && (
            <div className="cc-pay-form">
              <div className="cc-due-banner">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <path d="M7.938 2.016A.13.13 0 0 1 8.002 2a.13.13 0 0 1 .063.016.15.15 0 0 1 .054.057l6.857 11.667c.036.06.035.124.002.183a.2.2 0 0 1-.054.06.1.1 0 0 1-.066.017H1.146a.1.1 0 0 1-.066-.017.2.2 0 0 1-.054-.06.18.18 0 0 1 .002-.183L7.884 2.073a.15.15 0 0 1 .054-.057m1.044-.45a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767z" />
                  <path d="M7.002 12a1 1 0 1 1 2 0 1 1 0 0 1-2 0M7.1 5.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0z" />
                </svg>
                <span>Outstanding Due</span>
                <strong>PKR {fmt(due)}</strong>
              </div>
              {payMsg.text && (
                <div
                  className={`xp-alert ${payMsg.type === "success" ? "xp-alert-success" : "xp-alert-error"}`}
                  style={{ marginBottom: 10 }}
                >
                  {payMsg.text}
                </div>
              )}
              <div className="cc-pay-form-row">
                <div className="xp-form-grp">
                  <label className="xp-label">Amount (PKR)</label>
                  <div className="cc-pfx-wrap">
                    <span className="cc-pfx">PKR</span>
                    <input
                      ref={payRef}
                      type="number"
                      className="xp-input xp-input-lg"
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handlePay();
                      }}
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="xp-form-grp">
                  <label className="xp-label">Mode</label>
                  <select
                    className="xp-select xp-input-lg"
                    value={payMode}
                    onChange={(e) => setPayMode(e.target.value)}
                  >
                    <option>Cash</option>
                    <option>Bank</option>
                    <option>Cheque</option>
                    <option>Online</option>
                  </select>
                </div>
              </div>
              <div className="xp-form-grp" style={{ marginBottom: 12 }}>
                <label className="xp-label">Remarks</label>
                <input
                  type="text"
                  className="xp-input xp-input-lg"
                  value={payRemarks}
                  onChange={(e) => setPayRemarks(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handlePay();
                  }}
                  placeholder="e.g. Cash received…"
                />
              </div>
              <button
                className="xp-btn xp-btn-success xp-btn-lg"
                onClick={handlePay}
                disabled={paying}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
                  <path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05" />
                </svg>
                {paying ? "Processing…" : "Record Payment"}
              </button>
            </div>
          )}
        </div>
        <div className="xp-modal-footer">
          <button className="xp-btn xp-btn-lg" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   HISTORY PANEL (right column)
───────────────────────────────────────────────────────────── */
function HistoryPanel({
  customer,
  currentSaleCredit,
  onDetailClick,
  onNavigate,
}) {
  if (!customer) {
    return (
      <div className="ds-hist-panel">
        <div className="ds-hist-empty">
          <svg
            width="32"
            height="32"
            viewBox="0 0 16 16"
            fill="var(--xp-silver-5)"
          >
            <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0m4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4" />
          </svg>
          <div>Enter phone to load debit customer</div>
          <button
            className="xp-btn xp-btn-primary xp-btn-sm"
            onClick={onNavigate}
          >
            <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
              <path d="M15 14s1 0 1-1-1-4-5-4-5 3-5 4 1 1 1 1z" />
              <path d="M11 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4" />
            </svg>
            Manage Debit Customers
          </button>
        </div>
      </div>
    );
  }

  const { custHistory, histLoading, histTotal, histPaid, currentDue } =
    customer;

  return (
    <div className="ds-hist-panel">
      <div className="ds-hist-customer-hdr">
        <div className="ds-hist-name">{customer.name}</div>
        <div className="ds-hist-sub">{customer.phone}</div>
        <div className="ds-hist-actions">
          {customer.phone && (
            <button
              className="xp-btn xp-btn-wa xp-btn-sm"
              onClick={() => {
                const text = `Assalam o Alaikum *${customer.name}*,\n\nYour outstanding balance is *Rs. ${fmt(currentDue)}*.\n\nPlease clear dues.\n\n_${SHOP_NAME}_`;
                window.open(
                  `https://wa.me/${customer.phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`,
                  "_blank",
                );
              }}
            >
              <svg
                width="10"
                height="10"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326z" />
              </svg>
              WA Reminder
            </button>
          )}
          <button className="xp-btn xp-btn-sm" onClick={onDetailClick}>
            <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
              <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1L14 5.5z" />
            </svg>
            Detail &amp; Pay
          </button>
        </div>
      </div>

      <div className="ds-hist-stats">
        <div className="ds-hstat">
          <div className="ds-hstat-lbl">Total Sales</div>
          <div className="ds-hstat-val">{fmt(histTotal)}</div>
        </div>
        <div className="ds-hstat">
          <div className="ds-hstat-lbl">Total Paid</div>
          <div className="ds-hstat-val success">{fmt(histPaid)}</div>
        </div>
        <div className="ds-hstat danger">
          <div className="ds-hstat-lbl">Current Due</div>
          <div className="ds-hstat-val danger">{fmt(currentDue)}</div>
        </div>
        {currentSaleCredit > 0 && (
          <div className="ds-hstat amber">
            <div className="ds-hstat-lbl">After This Bill</div>
            <div className="ds-hstat-val warning">
              {fmt(currentDue + currentSaleCredit)}
            </div>
          </div>
        )}
      </div>

      <div className="ds-hist-section">
        <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 1a7 7 0 1 0 4.95 11.95l.707.707A8.001 8.001 0 1 1 8 0z" />
          <path d="M7.5 3a.5.5 0 0 1 .5.5v5.21l3.248 1.856a.5.5 0 0 1-.496.868l-3.5-2A.5.5 0 0 1 7 9V3.5a.5.5 0 0 1 .5-.5" />
        </svg>
        Recent Transactions ({custHistory?.length || 0})
        <span style={{ fontWeight: 400, color: "#777" }}>
          {" "}
          — Click for details
        </span>
      </div>

      <div className="ds-hist-list-wrap">
        {histLoading && <div className="xp-loading">Loading…</div>}
        {!histLoading && (!custHistory || custHistory.length === 0) && (
          <div className="xp-empty">No history yet</div>
        )}
        {(custHistory || []).slice(0, 10).map((s) => (
          <div key={s._id} className="ds-hist-card" onClick={onDetailClick}>
            <div>
              <div className="ds-hist-card-inv">{s.invoiceNo}</div>
              <div className="ds-hist-card-date">{s.invoiceDate}</div>
            </div>
            <div>
              <div className="ds-hist-card-total">{fmt(s.netTotal)}</div>
              <div
                className={`ds-hist-card-bal${(s.balance || 0) > 0 ? " danger" : " success"}`}
              >
                {(s.balance || 0) > 0 ? `Bal: ${fmt(s.balance)}` : "✓ Clear"}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────────── */
export default function DebitSalePage() {
  const navigate = useNavigate();

  const [invoiceNo, setInvoiceNo] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(isoDate());
  const [phone, setPhone] = useState("");
  const [customer, setCustomer] = useState(null);
  const [custHistory, setCustHistory] = useState([]);
  const [histLoading, setHistLoading] = useState(false);
  const [rows, setRows] = useState([{ ...EMPTY_ROW }]);
  const [activeRow, setActiveRow] = useState(0);
  const [searchText, setSearchText] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [custMatches, setCustMatches] = useState([]);
  const [showCustSel, setShowCustSel] = useState(false);
  const [products, setProducts] = useState([]);
  const [cashPaid, setCashPaid] = useState(0);
  const [extraDisc, setExtraDisc] = useState(0);
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [msg, setMsg] = useState({ text: "", type: "" });
  const [holds, setHolds] = useState([]);
  const [showInvoice, setShowInvoice] = useState(false);
  const [savedSale, setSavedSale] = useState(null);
  const [showCustDetail, setShowCustDetail] = useState(false);

  const phoneRef = useRef(null);
  const searchRef = useRef(null);
  const cashRef = useRef(null);
  const saveRef = useRef(null);
  const rowRefs = useRef([]);

  const subTotal = rows.reduce((s, r) => s + (r.amount || 0), 0);
  const discAmt = Math.round((subTotal * (extraDisc || 0)) / 100);
  const netTotal = subTotal - discAmt;
  const cashAmt = Math.min(Number(cashPaid) || 0, netTotal);
  const creditAmt = Math.max(netTotal - cashAmt, 0);

  const histTotal = custHistory.reduce((s, x) => s + (x.netTotal || 0), 0);
  const histPaid = custHistory.reduce((s, x) => s + (x.paidAmount || 0), 0);
  const currentDue = customer?.currentBalance || 0;

  useEffect(() => {
    fetchInvoiceNo();
    fetchProducts();
  }, []);
  useEffect(() => {
    const h = (e) => {
      if (e.key === "F3") {
        e.preventDefault();
        setShowSearch(true);
      }
      if (e.key === "F5") {
        e.preventDefault();
        handleSave();
      }
      if (e.key === "F8") {
        e.preventDefault();
        holdBill();
      }
      if (e.key === "F2") {
        e.preventDefault();
        resetForm();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [rows, customer, cashPaid, extraDisc]);

  const fetchInvoiceNo = async () => {
    try {
      const { data } = await api.get(EP.SALES.NEXT_INVOICE);
      if (data.success) setInvoiceNo(data.data.invoiceNo);
    } catch {}
  };
  const fetchProducts = async () => {
    try {
      const { data } = await api.get(EP.PRODUCTS.GET_ALL);
      if (data.success) setProducts(data.data);
    } catch {}
  };

  const showMsg = (text, type = "success") => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: "", type: "" }), 3500);
  };

  const handlePhoneSearch = async () => {
    if (!phone.trim() || phone.length < 3) return;
    setPhoneLoading(true);
    try {
      const { data } = await api.get(EP.CUSTOMERS.GET_WALKIN(phone.trim()));
      if (data.success && data.data.length > 0) {
        const list = (data.data || []).filter((c) => c.type === "walkin");
        if (!list.length) {
          await createWalkinCustomer();
          return;
        }
        const exact = list.find((c) => c.phone?.trim() === phone.trim());
        if (exact) {
          selectCustomer(exact);
          showMsg(`${exact.name} selected`);
        } else {
          setCustMatches(list);
          setShowCustSel(true);
        }
      } else {
        await createWalkinCustomer();
      }
    } catch {
      showMsg("Search failed", "error");
    }
    setPhoneLoading(false);
  };

  const createWalkinCustomer = async () => {
    try {
      const { data } = await api.post(EP.CUSTOMERS.CREATE, {
        name: `Customer (${phone})`,
        phone: phone.trim(),
        type: "walkin",
      });
      if (data.success) {
        selectCustomer(data.data);
        showMsg("New debit customer created");
      }
    } catch {
      showMsg("Create failed", "error");
    }
  };

  const selectCustomer = (c) => {
    setCustomer(c);
    loadCustHistory(c._id);
    setShowCustSel(false);
    setCustMatches([]);
    setTimeout(() => searchRef.current?.focus(), 80);
  };

  const loadCustHistory = async (id) => {
    setHistLoading(true);
    try {
      const { data } = await api.get(EP.CUSTOMERS.SALE_HISTORY(id));
      if (data.success) setCustHistory(data.data);
    } catch {}
    setHistLoading(false);
  };

  const handleProductSelect = (product) => {
    const qty = rows[activeRow]?.qty || 1;
    const rate = product._rate || 0;
    setRows((prev) => {
      const next = [...prev];
      next[activeRow] = {
        ...next[activeRow],
        productId: product._id || "",
        code: product.code || "",
        description: product._name || product.description || "",
        measurement: product._meas || "",
        qty,
        rate,
        disc: next[activeRow]?.disc || 0,
        amount: qty * rate,
      };
      return next;
    });
    setSearchText(product._name || product.description || "");
    setShowSearch(false);
    setTimeout(() => rowRefs.current[activeRow]?.qty?.focus(), 30);
  };

  const updateRow = (i, field, val) => {
    setRows((prev) => {
      const next = [...prev];
      const r = { ...next[i], [field]: val };
      if (["qty", "rate", "disc"].includes(field)) {
        const q = field === "qty" ? Number(val) : Number(r.qty);
        const rt = field === "rate" ? Number(val) : Number(r.rate);
        const d = field === "disc" ? Number(val) : Number(r.disc);
        r.amount = Math.round(q * rt * (1 - d / 100));
      }
      next[i] = r;
      return next;
    });
  };

  const addRowAfter = (i) => {
    setRows((p) => {
      const n = [...p];
      n.splice(i + 1, 0, { ...EMPTY_ROW });
      return n;
    });
    setActiveRow(i + 1);
    setSearchText("");
    setTimeout(() => setShowSearch(true), 30);
  };
  const deleteRow = (i) => {
    if (rows.length === 1) {
      setRows([{ ...EMPTY_ROW }]);
      return;
    }
    setRows((p) => p.filter((_, idx) => idx !== i));
    setActiveRow(Math.max(0, i - 1));
  };

  const onRowKeyDown = (e, i, field) => {
    if (e.key === "F3") {
      e.preventDefault();
      setActiveRow(i);
      setShowSearch(true);
      return;
    }
    if (e.key === "Delete" && e.ctrlKey) {
      e.preventDefault();
      deleteRow(i);
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const order = [
        "code",
        "description",
        "measurement",
        "qty",
        "rate",
        "disc",
      ];
      const fi = order.indexOf(field);
      if (fi < order.length - 1) rowRefs.current[i]?.[order[fi + 1]]?.focus();
      else if (i === rows.length - 1) addRowAfter(i);
      else rowRefs.current[i + 1]?.code?.focus();
    }
  };

  const onCodeBlur = async (i, code) => {
    if (!code.trim()) return;
    const found = products.find(
      (p) => p.code?.toLowerCase() === code.toLowerCase(),
    );
    if (found) {
      const pk = found.packingInfo?.[0] || {};
      const desc = [found.category, found.description, found.company]
        .filter(Boolean)
        .join(" ");
      setRows((prev) => {
        const next = [...prev];
        next[i] = {
          ...next[i],
          productId: found._id,
          description: desc,
          measurement: pk.measurement || "",
          rate: pk.saleRate || 0,
          amount: (next[i].qty || 1) * (pk.saleRate || 0),
        };
        return next;
      });
      setTimeout(() => rowRefs.current[i]?.qty?.focus(), 20);
    }
  };

  const setPayFull = () => {
    setCashPaid(netTotal);
  };
  const setPayCredit = () => {
    setCashPaid(0);
  };
  const setPayPartial = () => {
    setCashPaid(Math.floor(netTotal / 2));
  };

  const holdBill = () => {
    if (!rows.some((r) => r.description)) {
      showMsg("Nothing to hold", "error");
      return;
    }
    setHolds((p) => [
      ...p,
      { id: Date.now(), rows, customer, phone, extraDisc, cashPaid, remarks },
    ]);
    resetForm();
    showMsg("Bill held");
  };
  const resumeHold = (id) => {
    const h = holds.find((x) => x.id === id);
    if (!h) return;
    setRows(h.rows);
    setCustomer(h.customer);
    setPhone(h.phone);
    setExtraDisc(h.extraDisc);
    setCashPaid(h.cashPaid);
    setRemarks(h.remarks);
    setHolds((p) => p.filter((x) => x.id !== id));
  };
  const resetForm = () => {
    setRows([{ ...EMPTY_ROW }]);
    setCustomer(null);
    setCustHistory([]);
    setPhone("");
    setExtraDisc(0);
    setCashPaid(0);
    setRemarks("");
    setSearchText("");
    fetchInvoiceNo();
    setTimeout(() => phoneRef.current?.focus(), 30);
  };

  const handleSave = async () => {
    const validRows = rows.filter((r) => r.description && r.qty > 0);
    if (!validRows.length) {
      showMsg("Add at least one item", "error");
      return;
    }
    setSaving(true);
    try {
      const actualMode =
        cashAmt <= 0 ? "Credit" : cashAmt >= netTotal ? "Cash" : "Partial";
      const payload = {
        invoiceDate,
        saleType: "sale",
        saleSource: "debit",
        paymentMode: actualMode,
        customerId: customer?._id || undefined,
        customerName: customer?.name || "COUNTER SALE",
        customerPhone: customer?.phone || phone || "",
        items: validRows,
        subTotal,
        extraDisc: Number(extraDisc),
        discAmount: discAmt,
        netTotal,
        paidAmount: cashAmt,
        balance: creditAmt,
        remarks,
      };
      const { data } = await api.post(EP.SALES.CREATE, payload);
      if (data.success) {
        setSavedSale({
          ...data.data,
          items: validRows,
          subTotal,
          discAmount: discAmt,
          netTotal,
          paidAmount: cashAmt,
          balance: creditAmt,
        });
        setShowInvoice(true);
        showMsg(`Saved: ${data.data.invoiceNo}`);
        resetForm();
      } else showMsg(data.message, "error");
    } catch (e) {
      showMsg(e.response?.data?.message || "Save failed", "error");
    }
    setSaving(false);
  };

  /* customer object passed to history panel with extra derived fields */
  const custPanelData = customer
    ? { ...customer, custHistory, histLoading, histTotal, histPaid, currentDue }
    : null;

  return (
    <div className="cs-page">
      {/* ── Modals ── */}
      {showCustDetail && customer && (
        <CustomerDetailModal
          customer={customer}
          onClose={() => setShowCustDetail(false)}
          onPaymentDone={() => {
            loadCustHistory(customer._id);
            api
              .get(EP.CUSTOMERS.GET_WALKIN(customer.phone))
              .then(({ data }) => {
                if (data.success) {
                  const c = data.data.find((x) => x._id === customer._id);
                  if (c) setCustomer(c);
                }
              })
              .catch(() => {});
          }}
        />
      )}
      {showSearch && (
        <SearchModal
          allProducts={products}
          onSelect={handleProductSelect}
          onClose={() => setShowSearch(false)}
        />
      )}
      {showCustSel && (
        <CustomerSelectModal
          customers={custMatches}
          onSelect={selectCustomer}
          onClose={() => setShowCustSel(false)}
        />
      )}
      {showInvoice && savedSale && (
        <InvoiceModal
          sale={savedSale}
          shopName={SHOP_NAME}
          onClose={() => {
            setShowInvoice(false);
            setSavedSale(null);
          }}
        />
      )}

      {/* ── Titlebar ── */}
      <div className="xp-titlebar">
        <svg
          width="15"
          height="15"
          viewBox="0 0 16 16"
          fill="rgba(255,255,255,0.85)"
        >
          <path d="M12.136.326A1.5 1.5 0 0 1 14 1.78V3h.5A1.5 1.5 0 0 1 16 4.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 0 13.5v-9A1.5 1.5 0 0 1 1.432 3.001L12.136.326z" />
        </svg>
        <span className="xp-tb-title">Debit Sale — {SHOP_NAME}</span>
        <div className="xp-tb-actions">
          <button
            className="xp-btn xp-btn-sm xp-btn-primary"
            onClick={() => navigate("/debit-customers")}
            style={{ fontSize: "var(--xp-fs-xs)" }}
          >
            <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
              <path d="M15 14s1 0 1-1-1-4-5-4-5 3-5 4 1 1 1 1z" />
              <path d="M11 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4" />
            </svg>
            Manage Customers
          </button>
          <div className="xp-tb-divider" />
          <button className="xp-cap-btn" title="Minimize">
            ─
          </button>
          <button className="xp-cap-btn" title="Maximize">
            □
          </button>
          <button className="xp-cap-btn xp-cap-close" title="Close">
            ✕
          </button>
        </div>
      </div>

      {/* ── Hint bar ── */}
      <div className="cs-hint-bar">
        <span>
          <kbd>F2</kbd> New
        </span>
        <span>
          <kbd>F3</kbd> Search Product
        </span>
        <span>
          <kbd>F5</kbd> Save
        </span>
        <span>
          <kbd>F8</kbd> Hold Bill
        </span>
        <span>
          <kbd>Enter</kbd> Next Field
        </span>
        <span>
          <kbd>Ctrl+Del</kbd> Remove Row
        </span>
      </div>

      {/* ── Alert ── */}
      {msg.text && (
        <div
          className={`xp-alert ${msg.type === "success" ? "xp-alert-success" : "xp-alert-error"}`}
          style={{ margin: "4px 10px 0" }}
        >
          {msg.text}
        </div>
      )}

      {/* ── Two-column body ── */}
      <div className="cs-body">
        {/* ════ LEFT ════ */}
        <div className="cs-left">
          {/* Header */}
          <div className="cs-header">
            <div className="cs-header-title">
              <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="var(--xp-blue-dark)"
              >
                <path d="M12.136.326A1.5 1.5 0 0 1 14 1.78V3h.5A1.5 1.5 0 0 1 16 4.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 0 13.5v-9A1.5 1.5 0 0 1 1.432 3.001L12.136.326z" />
              </svg>
              Debit Sale
            </div>
            <div className="cs-field-row">
              <label>Invoice #</label>
              <input
                className="cs-input-sm"
                value={invoiceNo}
                readOnly
                style={{ width: 110 }}
                tabIndex={-1}
              />
            </div>
            <div className="cs-field-row">
              <label>Date</label>
              <input
                type="date"
                className="cs-input-sm"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                style={{ width: 130 }}
                tabIndex={-1}
              />
            </div>
          </div>

          {/* Customer strip */}
          <div className="cs-customer-strip">
            <label>Phone / Code</label>
            <input
              ref={phoneRef}
              className="cs-phone-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handlePhoneSearch();
              }}
              placeholder="Phone → Enter to search or create…"
              tabIndex={1}
            />
            <button
              className="xp-btn xp-btn-sm"
              onClick={handlePhoneSearch}
              disabled={phoneLoading}
              tabIndex={-1}
            >
              <svg
                width="11"
                height="11"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1z" />
              </svg>
              {phoneLoading ? "…" : "Search"}
            </button>

            {customer ? (
              <div className="cs-customer-tag">
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6" />
                  <path d="M8 9c-5.333 0-8 2.667-8 4v1h16v-1c0-1.333-2.667-4-8-4" />
                </svg>
                {customer.name}
                {currentDue > 0 && (
                  <span className="due">PKR {fmt(currentDue)}</span>
                )}
                <button
                  className="xp-btn xp-btn-sm xp-btn-ico"
                  style={{ width: 18, height: 18, fontSize: 9 }}
                  onClick={() => {
                    setCustomer(null);
                    setCustHistory([]);
                    setPhone("");
                  }}
                  tabIndex={-1}
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="cs-no-customer">
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0m4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4M6.936 9.28a6 6 0 0 0-1.23-.247A7 7 0 0 0 5 9c-4 0-5 3-5 4q0 1 1 1h4.216" />
                </svg>
                Debit Customer / Counter Sale
              </div>
            )}

            {holds.length > 0 && (
              <div className="cs-hold-pills">
                {holds.map((h) => (
                  <button
                    key={h.id}
                    className="cs-hold-pill"
                    onClick={() => resumeHold(h.id)}
                    tabIndex={-1}
                  >
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                    >
                      <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1L14 5.5z" />
                    </svg>
                    {h.customer?.name || "Hold"}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product search */}
          <div className="cs-product-row">
            <label>Select Product</label>
            <input
              ref={searchRef}
              type="text"
              className="cs-product-input"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onClick={() => setShowSearch(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === "ArrowDown") {
                  e.preventDefault();
                  setShowSearch(true);
                }
              }}
              placeholder="Click or press Enter / F3 to search products…"
              readOnly={!!searchText}
              tabIndex={2}
            />
            {searchText && (
              <button
                className="xp-btn xp-btn-sm"
                onClick={() => setSearchText("")}
                tabIndex={-1}
              >
                ✕ Clear
              </button>
            )}
            <button
              className="xp-btn xp-btn-primary xp-btn-sm"
              onClick={() => setShowSearch(true)}
              tabIndex={-1}
            >
              <svg
                width="11"
                height="11"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1z" />
              </svg>
              F3
            </button>
          </div>

          {/* Items table */}
          <div className="cs-items-panel">
            <table className="cs-items-table">
              <thead>
                <tr>
                  <th style={{ width: 30 }}>#</th>
                  <th style={{ width: 75 }}>Code</th>
                  <th>Description</th>
                  <th style={{ width: 65 }}>Meas.</th>
                  <th style={{ width: 60 }} className="r">
                    Qty
                  </th>
                  <th style={{ width: 80 }} className="r">
                    Rate
                  </th>
                  <th style={{ width: 55 }} className="r">
                    Disc%
                  </th>
                  <th style={{ width: 90 }} className="r">
                    Amount
                  </th>
                  <th style={{ width: 26 }}></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => {
                  if (!rowRefs.current[i]) rowRefs.current[i] = {};
                  return (
                    <tr
                      key={i}
                      className={activeRow === i ? "active-row" : ""}
                      onClick={() => setActiveRow(i)}
                    >
                      <td
                        className="text-muted"
                        style={{
                          textAlign: "center",
                          fontSize: "var(--xp-fs-xs)",
                        }}
                      >
                        {i + 1}
                      </td>
                      <td>
                        <input
                          className="cs-cell-input w-code"
                          ref={(el) => {
                            if (rowRefs.current[i])
                              rowRefs.current[i].code = el;
                          }}
                          value={row.code}
                          onChange={(e) => updateRow(i, "code", e.target.value)}
                          onBlur={(e) => onCodeBlur(i, e.target.value)}
                          onKeyDown={(e) => onRowKeyDown(e, i, "code")}
                          tabIndex={100 + i * 10 + 1}
                        />
                      </td>
                      <td>
                        <input
                          className="cs-cell-input w-desc"
                          ref={(el) => {
                            if (rowRefs.current[i])
                              rowRefs.current[i].description = el;
                          }}
                          value={row.description}
                          onChange={(e) =>
                            updateRow(i, "description", e.target.value)
                          }
                          onKeyDown={(e) => {
                            if (e.key === "F3") {
                              e.preventDefault();
                              setActiveRow(i);
                              setShowSearch(true);
                            } else onRowKeyDown(e, i, "description");
                          }}
                          tabIndex={100 + i * 10 + 2}
                        />
                      </td>
                      <td>
                        <input
                          className="cs-cell-input w-meas"
                          ref={(el) => {
                            if (rowRefs.current[i])
                              rowRefs.current[i].measurement = el;
                          }}
                          value={row.measurement}
                          onChange={(e) =>
                            updateRow(i, "measurement", e.target.value)
                          }
                          onKeyDown={(e) => onRowKeyDown(e, i, "measurement")}
                          tabIndex={100 + i * 10 + 3}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="cs-cell-input w-num"
                          ref={(el) => {
                            if (rowRefs.current[i]) rowRefs.current[i].qty = el;
                          }}
                          value={row.qty}
                          onChange={(e) => updateRow(i, "qty", e.target.value)}
                          onKeyDown={(e) => onRowKeyDown(e, i, "qty")}
                          tabIndex={100 + i * 10 + 4}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="cs-cell-input w-num"
                          ref={(el) => {
                            if (rowRefs.current[i])
                              rowRefs.current[i].rate = el;
                          }}
                          value={row.rate}
                          onChange={(e) => updateRow(i, "rate", e.target.value)}
                          onKeyDown={(e) => onRowKeyDown(e, i, "rate")}
                          tabIndex={100 + i * 10 + 5}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="cs-cell-input w-num"
                          ref={(el) => {
                            if (rowRefs.current[i])
                              rowRefs.current[i].disc = el;
                          }}
                          value={row.disc}
                          onChange={(e) => updateRow(i, "disc", e.target.value)}
                          onKeyDown={(e) => onRowKeyDown(e, i, "disc")}
                          tabIndex={100 + i * 10 + 6}
                        />
                      </td>
                      <td className="amt">{fmt(row.amount)}</td>
                      <td style={{ textAlign: "center" }}>
                        <button
                          className="xp-btn xp-btn-sm xp-btn-ico"
                          onClick={() => deleteRow(i)}
                          tabIndex={-1}
                          style={{
                            width: 20,
                            height: 20,
                            fontSize: 9,
                            color: "var(--xp-red)",
                          }}
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Bottom: payment section + totals */}
          <div className="ds-bottom">
            <div className="ds-left-col">
              {/* Quick pay buttons */}
              <div className="ds-pay-section">
                <div className="ds-pay-title">Payment Mode</div>
                <div className="ds-qpay-row">
                  <button
                    className="ds-qpay-btn full-cash"
                    onClick={setPayFull}
                  >
                    <svg
                      width="11"
                      height="11"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                    >
                      <path d="M8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4" />
                      <path d="M0 4a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H1a1 1 0 0 1-1-1zm3 0a2 2 0 0 1-2 2v4a2 2 0 0 1 2 2h10a2 2 0 0 1 2-2V6a2 2 0 0 1-2-2z" />
                    </svg>
                    Full Cash
                  </button>
                  <button
                    className="ds-qpay-btn full-credit"
                    onClick={setPayCredit}
                  >
                    <svg
                      width="11"
                      height="11"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                    >
                      <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v1h14V4a1 1 0 0 0-1-1zm13 4H1v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1z" />
                    </svg>
                    Full Credit
                  </button>
                  <button
                    className="ds-qpay-btn partial"
                    onClick={setPayPartial}
                  >
                    <svg
                      width="11"
                      height="11"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                    >
                      <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4" />
                    </svg>
                    Partial
                  </button>
                </div>
                <div className="ds-cash-row">
                  <label>Cash Received</label>
                  <input
                    ref={cashRef}
                    type="number"
                    className="ds-cash-input"
                    value={cashPaid}
                    min={0}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setCashPaid(e.target.value);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveRef.current?.focus();
                    }}
                    tabIndex={90}
                  />
                  {creditAmt > 0 && (
                    <div className="ds-credit-badge">
                      Credit: PKR {fmt(creditAmt)}
                    </div>
                  )}
                </div>
                <div className="ds-cash-row">
                  <label>Extra Disc%</label>
                  <input
                    type="number"
                    className="xp-input xp-input-sm"
                    value={extraDisc}
                    onChange={(e) => setExtraDisc(e.target.value)}
                    style={{ width: 60, textAlign: "right" }}
                    tabIndex={89}
                  />
                </div>
                <div className="ds-cash-row">
                  <label>Remarks</label>
                  <input
                    type="text"
                    className="xp-input"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    tabIndex={91}
                    style={{ flex: 1 }}
                  />
                </div>
              </div>

              {/* Action buttons */}
              <div className="cs-btn-row">
                <button
                  className="xp-btn xp-btn-sm"
                  onClick={() => setShowSearch(true)}
                  tabIndex={-1}
                >
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                  >
                    <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001z" />
                  </svg>
                  F3 Search
                </button>
                <button
                  className="xp-btn xp-btn-sm"
                  onClick={holdBill}
                  tabIndex={-1}
                >
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                  >
                    <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1L14 5.5z" />
                  </svg>
                  F8 Hold
                </button>
                <button
                  className="xp-btn xp-btn-sm"
                  onClick={resetForm}
                  tabIndex={-1}
                >
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                  >
                    <path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2z" />
                    <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466" />
                  </svg>
                  F2 New
                </button>
                <button
                  ref={saveRef}
                  className="xp-btn xp-btn-primary xp-btn-lg"
                  onClick={handleSave}
                  disabled={saving}
                  tabIndex={92}
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                  >
                    <path d="M2 1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H9.5a1 1 0 0 0-1 1v7.293l2.646-2.647a.5.5 0 0 1 .708.708l-3.5 3.5a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L7.5 9.293V2a2 2 0 0 1 2-2H14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2z" />
                  </svg>
                  {saving ? "Saving…" : "F5 Save"}
                </button>
              </div>
            </div>

            {/* Totals box */}
            <div className="cs-totals-box">
              <div className="cs-total-row">
                <label>Sub Total</label>
                <span className="val">{fmt(subTotal)}</span>
              </div>
              {discAmt > 0 && (
                <div className="cs-total-row">
                  <label>Disc Amt</label>
                  <span className="val danger">-{fmt(discAmt)}</span>
                </div>
              )}
              <div className="cs-total-row highlight">
                <label>Net Total</label>
                <span className="val">{fmt(netTotal)}</span>
              </div>
              <div className="cs-total-row">
                <label>Cash</label>
                <span className="val success">{fmt(cashAmt)}</span>
              </div>
              <div className="cs-total-row highlight">
                <label>Credit / Balance</label>
                <span className="val danger">{fmt(creditAmt)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ════ RIGHT ════ */}
        <div className="cs-right">
          <HistoryPanel
            customer={custPanelData}
            currentSaleCredit={creditAmt}
            onDetailClick={() => {
              if (customer) setShowCustDetail(true);
            }}
            onNavigate={() => navigate("/debit-customers")}
          />
        </div>
      </div>

      {/* ── Status Bar ── */}
      <div className="xp-statusbar">
        <div className="xp-status-pane">
          <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
            <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1L14 5.5z" />
          </svg>
          Invoice: {invoiceNo || "—"}
        </div>
        <div className="xp-status-pane">
          <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6" />
          </svg>
          {customer ? customer.name : "Counter Sale"}
        </div>
        <div className="xp-status-pane">
          Items: {rows.filter((r) => r.description).length}
        </div>
        <div className="xp-status-pane">
          Net:{" "}
          <strong style={{ fontFamily: "var(--xp-mono)", marginLeft: 3 }}>
            PKR {fmt(netTotal)}
          </strong>
        </div>
        {cashAmt > 0 && (
          <div className="xp-status-pane" style={{ color: "var(--xp-green)" }}>
            Cash: PKR {fmt(cashAmt)}
          </div>
        )}
        {creditAmt > 0 && (
          <div className="xp-status-pane" style={{ color: "var(--xp-red)" }}>
            Credit: PKR {fmt(creditAmt)}
          </div>
        )}
      </div>
    </div>
  );
}
