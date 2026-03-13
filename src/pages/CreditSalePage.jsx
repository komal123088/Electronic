import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/CreditSalePage.css";
import api from "../api/api.js";
import EP from "../api/apiEndpoints.js";

const isoDate = () => new Date().toISOString().split("T")[0];
const fmt = (n) => Number(n || 0).toLocaleString("en-PK");

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

// ═══════════════════════════════════════════════════════════════════════════
// CUSTOMER SEARCH MODAL — exact match auto-selects
// ═══════════════════════════════════════════════════════════════════════════
function CustomerSearchModal({ searchTerm, onSelect, onAddNew, onClose }) {
  const [query, setQuery] = useState(searchTerm || "");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hiIdx, setHiIdx] = useState(0);
  const inputRef = useRef(null);
  const tbodyRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    if (query.trim().length >= 1) doSearch(query);
  }, []);

  const doSearch = async (q) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.get(EP.CUSTOMERS.GET_CREDIT(q.trim()));
      if (data.success) {
        // Client-side bhi filter karo — sirf credit type
        const list = (data.data || []).filter((c) => c.type === "credit");
        setResults(list);
        setHiIdx(0);
        // ── EXACT MATCH: phone, name, or code exactly matches → auto-select ──
        const ql = q.trim().toLowerCase();
        const exact = list.find(
          (c) =>
            c.phone?.trim() === q.trim() ||
            c.name?.toLowerCase() === ql ||
            c.code?.toLowerCase() === ql,
        );
        if (exact) {
          onSelect(exact);
          return;
        }
      }
    } catch {
      setResults([]);
    }
    setLoading(false);
  };

  const handleQueryChange = (e) => {
    setQuery(e.target.value);
    doSearch(e.target.value);
  };

  const inputKeyDown = (e) => {
    if (e.key === "Escape") {
      onClose();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (results.length > 0) {
        tbodyRef.current?.focus();
        setHiIdx(0);
      }
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (results.length === 1) {
        onSelect(results[0]);
        return;
      }
      if (results.length > 1) {
        tbodyRef.current?.focus();
        setHiIdx(0);
      }
    }
  };

  const tableKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHiIdx((i) => Math.min(i + 1, results.length - 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (hiIdx === 0) {
        inputRef.current?.focus();
        return;
      }
      setHiIdx((i) => Math.max(i - 1, 0));
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (results[hiIdx]) onSelect(results[hiIdx]);
    }
    if (e.key === "Escape") {
      onClose();
    }
  };

  useEffect(() => {
    tbodyRef.current?.children[hiIdx]?.scrollIntoView({ block: "nearest" });
  }, [hiIdx]);

  return (
    <div
      className="cs-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="csm-window">
        <div className="csm-titlebar">
          <span>👤 Search Credit Customer</span>
          <button className="cs-close-x" onClick={onClose} tabIndex={-1}>
            ✕
          </button>
        </div>
        <div className="csm-search-row">
          <span className="csm-label">Search:</span>
          <input
            ref={inputRef}
            className="csm-input"
            value={query}
            onChange={handleQueryChange}
            onKeyDown={inputKeyDown}
            placeholder="Name / phone / code… (exact match auto-selects)"
            autoComplete="off"
          />
          {loading && <span className="csm-loading">…</span>}
          <span className="csm-count">{results.length} found</span>
          <button
            className="cs-btn cs-btn-primary"
            onClick={() => onAddNew(query)}
            tabIndex={-1}
          >
            ➕ Add New
          </button>
          <button className="cs-btn" onClick={onClose} tabIndex={-1}>
            Cancel
          </button>
        </div>
        <div className="csm-table-wrap">
          <table className="csm-table">
            <thead>
              <tr>
                <th style={{ width: 32 }}>#</th>
                <th>Name</th>
                <th style={{ width: 120 }}>Phone</th>
                <th className="r" style={{ width: 100 }}>
                  Current Due
                </th>
                <th style={{ width: 70 }}>Status</th>
              </tr>
            </thead>
            <tbody
              ref={tbodyRef}
              tabIndex={0}
              onKeyDown={tableKeyDown}
              style={{ outline: "none" }}
            >
              {!loading && results.length === 0 && (
                <tr>
                  <td colSpan={5} className="cs-empty">
                    No customer found — press ➕ Add New to create
                  </td>
                </tr>
              )}
              {results.map((c, i) => (
                <tr
                  key={c._id}
                  className={
                    i === hiIdx ? "csm-hi" : i % 2 === 0 ? "even" : "odd"
                  }
                  onClick={() => setHiIdx(i)}
                  onDoubleClick={() => onSelect(c)}
                  style={{ cursor: "pointer" }}
                >
                  <td className="c">{i + 1}</td>
                  <td className="bold">{c.name}</td>
                  <td>{c.phone || "—"}</td>
                  <td
                    className={`r bold ${(c.currentBalance || 0) > 0 ? "red" : "green"}`}
                  >
                    {fmt(c.currentBalance || 0)}
                  </td>
                  <td className="c">
                    <span
                      className={`cs-badge ${(c.currentBalance || 0) > 0 ? "sale" : ""}`}
                    >
                      {(c.currentBalance || 0) > 0 ? "Due" : "Clear"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="csm-footer">
          ↑↓ navigate | Enter / Double-click = select | Exact match =
          auto-select | Esc = close
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PRODUCT SEARCH MODAL
// ═══════════════════════════════════════════════════════════════════════════
function SearchModal({ allProducts, onSelect, onClose }) {
  const [desc, setDesc] = useState("");
  const [cat, setCat] = useState("");
  const [company, setCompany] = useState("");
  const [rows, setRows] = useState([]);
  const [hiIdx, setHiIdx] = useState(0);
  const rDesc = useRef(null),
    rCat = useRef(null),
    rCompany = useRef(null),
    tbodyRef = useRef(null);

  const buildFlat = useCallback((products, d, c, co) => {
    const ld = d.trim().toLowerCase(),
      lc = c.trim().toLowerCase(),
      lo = co.trim().toLowerCase();
    const res = [];
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
      if (p.packingInfo?.length > 0) {
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
      } else {
        res.push({
          ...p,
          _pi: 0,
          _meas: "",
          _rate: 0,
          _pack: 1,
          _stock: 0,
          _name,
        });
      }
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

  const filterKey = (e, nextRef) => {
    if (e.key === "Escape") {
      onClose();
      return;
    }
    if (e.key === "Enter" || e.key === "ArrowDown") {
      e.preventDefault();
      if (nextRef) nextRef.current?.focus();
      else {
        tbodyRef.current?.focus();
        setHiIdx((h) => Math.max(0, h));
      }
    }
  };
  const tableKey = (e) => {
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
    if (e.key === "Escape") {
      onClose();
    }
    if (e.key === "Tab") {
      e.preventDefault();
      rDesc.current?.focus();
    }
  };

  return (
    <div
      className="sm-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="sm-window">
        <div className="sm-titlebar">
          <span>🔍 Search Products</span>
          <button className="sm-close-btn" onClick={onClose} tabIndex={-1}>
            ✕
          </button>
        </div>
        <div className="sm-filters">
          <div className="sm-filter-field">
            <span className="sm-filter-label">Description</span>
            <input
              ref={rDesc}
              type="text"
              className="sm-filter-input w200"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              onKeyDown={(e) => filterKey(e, rCat)}
              placeholder="Name / code…"
              autoComplete="off"
            />
          </div>
          <div className="sm-filter-field">
            <span className="sm-filter-label">Category</span>
            <input
              ref={rCat}
              type="text"
              className="sm-filter-input w140"
              value={cat}
              onChange={(e) => setCat(e.target.value)}
              onKeyDown={(e) => filterKey(e, rCompany)}
              placeholder="e.g. SMALL"
              autoComplete="off"
            />
          </div>
          <div className="sm-filter-field">
            <span className="sm-filter-label">Company</span>
            <input
              ref={rCompany}
              type="text"
              className="sm-filter-input w130"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              onKeyDown={(e) => filterKey(e, null)}
              placeholder="e.g. LUX"
              autoComplete="off"
            />
          </div>
          <div className="sm-filters-right">
            <span className="sm-count">{rows.length} result(s)</span>
            <button className="cs-btn" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
        <div className="sm-products-box">
          <span className="sm-products-legend">Products</span>
          <div className="sm-products-scroll">
            <table className="sm-table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>Sr.#</th>
                  <th style={{ width: 75 }}>Barcode</th>
                  <th>Name</th>
                  <th style={{ width: 90 }}>Measurement</th>
                  <th className="r" style={{ width: 70 }}>
                    Rate
                  </th>
                  <th className="r" style={{ width: 70 }}>
                    Stock
                  </th>
                  <th className="r" style={{ width: 55 }}>
                    Pack
                  </th>
                </tr>
              </thead>
              <tbody
                ref={tbodyRef}
                tabIndex={0}
                onKeyDown={tableKey}
                style={{ outline: "none" }}
              >
                {rows.length === 0 && (
                  <tr>
                    <td className="empty" colSpan={7}>
                      No products found
                    </td>
                  </tr>
                )}
                {rows.map((r, i) => (
                  <tr
                    key={`${r._id}-${r._pi}`}
                    className={
                      i === hiIdx ? "hi" : i % 2 === 0 ? "even" : "odd"
                    }
                    onClick={() => setHiIdx(i)}
                    onDoubleClick={() => onSelect(r)}
                  >
                    <td style={{ textAlign: "center" }}>{i + 1}</td>
                    <td style={{ fontWeight: "bold" }}>{r.code}</td>
                    <td>{r._name}</td>
                    <td>{r._meas}</td>
                    <td className="r">{r._rate}</td>
                    <td className="r">{r._stock}</td>
                    <td className="r">{r._pack}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="sm-footer">
          ↑↓ navigate | Enter / Double-click = select | Esc = close | Tab =
          filters
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// INVOICE MODAL — Thermal, A4/PDF, WhatsApp detailed
// ═══════════════════════════════════════════════════════════════════════════
function InvoiceModal({ sale, shopName, onClose }) {
  const buildA4Html = () => {
    const rows = sale.items
      .map(
        (it, i) =>
          `<tr><td>${i + 1}</td><td>${it.description}</td><td>${it.measurement || ""}</td><td align="right">${it.qty}</td><td align="right">${Number(it.rate).toLocaleString()}</td><td align="right">${it.disc || 0}%</td><td align="right"><b>${Number(it.amount).toLocaleString()}</b></td></tr>`,
      )
      .join("");
    const totalDue = (sale.netTotal || 0) + (sale.prevBalance || 0);
    return `<!DOCTYPE html><html><head><title>Invoice ${sale.invoiceNo}</title>
    <style>
      body{font-family:Arial,sans-serif;font-size:12px;margin:20px;color:#000}
      h2{text-align:center;font-size:22px;margin:0 0 2px}
      .sub{text-align:center;font-size:11px;color:#555;margin-bottom:10px;letter-spacing:1px;text-transform:uppercase}
      .meta{display:flex;justify-content:space-between;flex-wrap:wrap;gap:4px;border:1px solid #ccc;padding:6px 10px;margin:8px 0;background:#f9f9f9;font-size:11px}
      table{width:100%;border-collapse:collapse;margin-top:10px}
      th{background:#e8e8e8;border:1px solid #ccc;padding:5px 7px;text-align:left;font-size:11px}
      td{border:1px solid #ddd;padding:4px 7px;font-size:11px}
      .tots{float:right;min-width:240px;margin-top:12px;border:1px solid #ccc;padding:8px 12px;background:#f9f9f9}
      .tr{display:flex;justify-content:space-between;padding:3px 0;font-size:12px;border-bottom:1px dotted #eee}
      .tr.b{font-weight:bold;font-size:14px;border-top:2px solid #000;border-bottom:none;margin-top:6px;padding-top:6px}
      .tr.red{color:#c0392b}.tr.green{color:#27ae60}
      .thanks{text-align:center;margin-top:30px;font-size:11px;color:#888;clear:both;border-top:1px dashed #ccc;padding-top:10px}
      @media print{body{margin:5mm}@page{margin:10mm}}
    </style></head><body>
    <h2>${shopName}</h2>
    <div class="sub">◆ Credit Sale Invoice ◆</div>
    <div class="meta">
      <span><b>Invoice #:</b> ${sale.invoiceNo}</span>
      <span><b>Date:</b> ${sale.invoiceDate}</span>
      <span><b>Customer:</b> ${sale.customerName}${sale.customerPhone ? " | " + sale.customerPhone : ""}</span>
      <span><b>Prev Balance:</b> PKR ${Number(sale.prevBalance || 0).toLocaleString()}</span>
    </div>
    <table><thead><tr><th>#</th><th>Description</th><th>Meas.</th><th align="right">Qty</th><th align="right">Rate</th><th align="right">Disc%</th><th align="right">Amount</th></tr></thead>
    <tbody>${rows}</tbody></table>
    <div class="tots">
      <div class="tr"><span>Sub Total</span><span>PKR ${Number(sale.subTotal).toLocaleString()}</span></div>
      ${sale.discAmount > 0 ? `<div class="tr"><span>Discount</span><span style="color:red">-PKR ${Number(sale.discAmount).toLocaleString()}</span></div>` : ""}
      <div class="tr b"><span>Net Total</span><span>PKR ${Number(sale.netTotal).toLocaleString()}</span></div>
      <div class="tr red"><span>Previous Balance</span><span>PKR ${Number(sale.prevBalance || 0).toLocaleString()}</span></div>
      <div class="tr b red"><span>Total Due</span><span>PKR ${Number(totalDue).toLocaleString()}</span></div>
      <div class="tr green"><span>Paid This Time</span><span>PKR ${Number(sale.paidAmount || 0).toLocaleString()}</span></div>
      <div class="tr b red"><span>Remaining Balance</span><span>PKR ${Number(sale.balance || 0).toLocaleString()}</span></div>
    </div>
    <br style="clear:both">
    <div class="thanks">Thank you for your business! — ${shopName}</div>
    </body></html>`;
  };

  const buildThermalHtml = () => {
    const rows = sale.items
      .map(
        (it, i) =>
          `<tr><td style="padding:2px 0">${i + 1}. ${it.description}</td><td align="right" style="padding:2px 0">${it.qty}×${Number(it.rate).toLocaleString()}</td><td align="right" style="padding:2px 0"><b>${Number(it.amount).toLocaleString()}</b></td></tr>`,
      )
      .join("");
    const totalDue = (sale.netTotal || 0) + (sale.prevBalance || 0);
    return `<!DOCTYPE html><html><head><title>Receipt</title>
    <style>
      body{font-family:'Courier New',monospace;font-size:11px;width:72mm;margin:0 auto;padding:4px}
      h3{text-align:center;font-size:14px;margin:4px 0}
      .c{text-align:center;font-size:10px}
      hr{border:none;border-top:1px dashed #000;margin:4px 0}
      table{width:100%;font-size:10px;border-collapse:collapse}
      .t{display:flex;justify-content:space-between;font-size:11px;padding:1px 0}
      .t.b{font-weight:bold;font-size:12px;border-top:1px dashed #000;padding-top:3px;margin-top:2px}
      .t.red{color:#c0392b}.t.green{color:#27ae60}
      @media print{@page{size:80mm auto;margin:3mm}}
    </style></head><body>
    <h3>${shopName}</h3>
    <div class="c">★ CREDIT SALE RECEIPT ★</div><hr>
    <div class="c">Invoice: <b>${sale.invoiceNo}</b> | ${sale.invoiceDate}</div>
    <div class="c"><b>${sale.customerName}</b>${sale.customerPhone ? " | " + sale.customerPhone : ""}</div><hr>
    <table><tbody>${rows}</tbody></table><hr>
    <div class="t"><span>Sub Total</span><span>${Number(sale.subTotal).toLocaleString()}</span></div>
    ${sale.discAmount > 0 ? `<div class="t"><span>Discount</span><span>-${Number(sale.discAmount).toLocaleString()}</span></div>` : ""}
    <div class="t b"><span>Net Total</span><span>${Number(sale.netTotal).toLocaleString()}</span></div>
    <div class="t red"><span>Prev Balance</span><span>${Number(sale.prevBalance || 0).toLocaleString()}</span></div>
    <div class="t b red"><span>Total Due</span><span>${Number(totalDue).toLocaleString()}</span></div>
    <div class="t green"><span>Paid</span><span>${Number(sale.paidAmount || 0).toLocaleString()}</span></div>
    <div class="t b red"><span>Balance</span><span>${Number(sale.balance || 0).toLocaleString()}</span></div><hr>
    <div class="c" style="font-size:10px;margin-top:4px">Thank you! — ${shopName}</div>
    </body></html>`;
  };

  const printA4 = () => {
    const w = window.open("", "_blank", "width=900,height=700");
    w.document.write(buildA4Html());
    w.document.close();
    setTimeout(() => w.print(), 400);
  };
  const printThermal = () => {
    const w = window.open("", "_blank", "width=400,height=600");
    w.document.write(buildThermalHtml());
    w.document.close();
    setTimeout(() => w.print(), 400);
  };

  const shareWhatsApp = () => {
    const lines = sale.items
      .map(
        (it, i) =>
          `${i + 1}. ${it.description}\n    ${it.qty} × PKR ${Number(it.rate).toLocaleString()}${it.disc ? ` (-${it.disc}%)` : ""} = *PKR ${Number(it.amount).toLocaleString()}*`,
      )
      .join("\n");
    const totalDue = (sale.netTotal || 0) + (sale.prevBalance || 0);
    const sep = "━".repeat(28);
    const text = `🏪 *${shopName}*
${"─".repeat(32)}
🧾 *Invoice #${sale.invoiceNo}*
📅 Date: ${sale.invoiceDate}
👤 Customer: *${sale.customerName}*${sale.customerPhone ? "\n📞 Phone: " + sale.customerPhone : ""}
${sep}
*ITEMS PURCHASED:*
${lines}
${sep}
📊 *BILL SUMMARY*
Sub Total:         PKR ${Number(sale.subTotal).toLocaleString()}${sale.discAmount > 0 ? `\nDiscount:         -PKR ${Number(sale.discAmount).toLocaleString()}` : ""}
Net Total:         *PKR ${Number(sale.netTotal).toLocaleString()}*
Previous Balance:  PKR ${Number(sale.prevBalance || 0).toLocaleString()}
${"─".repeat(30)}
*Total Due:        PKR ${Number(totalDue).toLocaleString()}*
Paid This Time:    PKR ${Number(sale.paidAmount || 0).toLocaleString()}
*⚠️ Remaining:    PKR ${Number(sale.balance || 0).toLocaleString()}*
${sep}
_Thank you for your business!_
_${shopName}_`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const totalDue = (sale.netTotal || 0) + (sale.prevBalance || 0);

  return (
    <div
      className="cs-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="cs-inv-modal">
        <div className="cs-modal-title">
          🧾 Invoice #{sale.invoiceNo} — {sale.customerName}
          <button className="cs-close-x" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="cs-inv-preview">
          <div className="cs-inv-shop">{shopName}</div>
          <div className="cs-inv-sub">CREDIT SALE INVOICE</div>
          <div className="cs-inv-meta">
            <span>
              Invoice: <b>{sale.invoiceNo}</b>
            </span>
            <span>
              Date: <b>{sale.invoiceDate}</b>
            </span>
            <span>
              Customer: <b>{sale.customerName}</b> {sale.customerPhone}
            </span>
          </div>
          <table className="cs-inv-table">
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
                  <td>{i + 1}</td>
                  <td>{it.description}</td>
                  <td>{it.measurement}</td>
                  <td className="r">{it.qty}</td>
                  <td className="r">{fmt(it.rate)}</td>
                  <td className="r">{it.disc || 0}%</td>
                  <td className="r bold">{fmt(it.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="cs-inv-totals">
            <div className="cs-inv-tr">
              <span>Sub Total</span>
              <span>{fmt(sale.subTotal)}</span>
            </div>
            {sale.discAmount > 0 && (
              <div className="cs-inv-tr">
                <span>Discount</span>
                <span>-{fmt(sale.discAmount)}</span>
              </div>
            )}
            <div className="cs-inv-tr bold">
              <span>Net Total</span>
              <span>{fmt(sale.netTotal)}</span>
            </div>
            <div className="cs-inv-tr red">
              <span>Prev Balance</span>
              <span>{fmt(sale.prevBalance || 0)}</span>
            </div>
            <div className="cs-inv-tr bold red">
              <span>Total Due</span>
              <span>{fmt(totalDue)}</span>
            </div>
            <div className="cs-inv-tr green">
              <span>Paid</span>
              <span>{fmt(sale.paidAmount || 0)}</span>
            </div>
            <div className="cs-inv-tr bold red">
              <span>Balance</span>
              <span>{fmt(sale.balance || 0)}</span>
            </div>
          </div>
          <div className="cs-inv-thanks">Thank you for your business!</div>
        </div>
        <div className="cs-inv-actions">
          <button className="cs-btn" onClick={printThermal}>
            🖨 Thermal Print
          </button>
          <button className="cs-btn" onClick={printA4}>
            📄 A4 Print / PDF
          </button>
          <button className="cs-btn cs-btn-wa" onClick={shareWhatsApp}>
            📱 WhatsApp (Full Detail)
          </button>
          <button className="cs-btn" onClick={onClose}>
            ✕ Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CUSTOMER DETAIL MODAL — click history row
// ═══════════════════════════════════════════════════════════════════════════
function CustomerDetailModal({ sale, customer, onClose, onPaymentDone }) {
  const [payAmount, setPayAmount] = useState("");
  const [payRemarks, setPayRemarks] = useState("");
  const [paying, setPaying] = useState(false);
  const [payMsg, setPayMsg] = useState({ text: "", type: "" });
  const [payments, setPayments] = useState([]);
  const [loadingPay, setLoadPay] = useState(false);
  const payRef = useRef(null);

  useEffect(() => {
    if (sale?._id) loadPayments();
    setTimeout(() => payRef.current?.focus(), 100);
  }, [sale?._id]);

  const loadPayments = async () => {
    setLoadPay(true);
    try {
      const { data } = await api.get(`/api/payments?saleId=${sale._id}`);
      if (data.success) setPayments(data.data || []);
    } catch {
      setPayments([]);
    }
    setLoadPay(false);
  };

  const showPayMsg = (text, type = "success") => {
    setPayMsg({ text, type });
    setTimeout(() => setPayMsg({ text: "", type: "" }), 3000);
  };

  const handlePay = async () => {
    const amt = Number(payAmount);
    if (!amt || amt <= 0) {
      showPayMsg("Enter a valid amount", "error");
      return;
    }
    setPaying(true);
    try {
      const { data } = await api.post("/api/payments", {
        customerId: customer._id,
        saleId: sale._id,
        invoiceNo: sale.invoiceNo,
        amount: amt,
        remarks: payRemarks,
        paymentDate: isoDate(),
      });
      if (data.success) {
        showPayMsg(`✅ Payment of PKR ${fmt(amt)} recorded!`, "success");
        setPayAmount("");
        setPayRemarks("");
        loadPayments();
        if (onPaymentDone) onPaymentDone();
      } else showPayMsg(data.message || "Payment failed", "error");
    } catch (e) {
      showPayMsg(e.response?.data?.message || "Payment failed", "error");
    }
    setPaying(false);
  };

  if (!sale) return null;
  const totalPaidLater = payments.reduce((s, p) => s + (p.amount || 0), 0);
  const currentBalance = Math.max(0, (sale.balance || 0) - totalPaidLater);

  return (
    <div
      className="cs-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="cdm-modal">
        <div className="cdm-titlebar">
          <span>
            🧾 Invoice #{sale.invoiceNo} &nbsp;|&nbsp; 👤 {customer?.name}
          </span>
          <button className="cs-close-x" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="cdm-body">
          <div className="cdm-left">
            <div className="cdm-section-title">📦 Items Purchased</div>
            <div className="cdm-items-wrap">
              <table className="cdm-table">
                <thead>
                  <tr>
                    <th style={{ width: 28 }}>#</th>
                    <th>Description</th>
                    <th style={{ width: 70 }}>Meas</th>
                    <th className="r" style={{ width: 45 }}>
                      Qty
                    </th>
                    <th className="r" style={{ width: 72 }}>
                      Rate
                    </th>
                    <th className="r" style={{ width: 48 }}>
                      Disc%
                    </th>
                    <th className="r" style={{ width: 80 }}>
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(sale.items || []).map((it, i) => (
                    <tr key={i} className={i % 2 === 0 ? "even" : "odd"}>
                      <td className="c">{i + 1}</td>
                      <td>{it.description}</td>
                      <td>{it.measurement}</td>
                      <td className="r">{it.qty}</td>
                      <td className="r">{fmt(it.rate)}</td>
                      <td className="r">{it.disc || 0}%</td>
                      <td className="r bold">{fmt(it.amount)}</td>
                    </tr>
                  ))}
                  {(!sale.items || sale.items.length === 0) && (
                    <tr>
                      <td colSpan={7} className="cs-empty">
                        No items
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="cdm-totals-box">
              <div className="cdm-tot-row">
                <span>Sub Total</span>
                <span>{fmt(sale.subTotal)}</span>
              </div>
              {sale.discAmount > 0 && (
                <div className="cdm-tot-row">
                  <span>Discount</span>
                  <span className="red">-{fmt(sale.discAmount)}</span>
                </div>
              )}
              <div className="cdm-tot-row bold">
                <span>Net Total</span>
                <span>{fmt(sale.netTotal)}</span>
              </div>
              <div className="cdm-tot-row">
                <span>Prev Balance</span>
                <span className="red">{fmt(sale.prevBalance || 0)}</span>
              </div>
              <div className="cdm-tot-row bold big red">
                <span>Total Due</span>
                <span>
                  {fmt((sale.netTotal || 0) + (sale.prevBalance || 0))}
                </span>
              </div>
              <div className="cdm-tot-row green">
                <span>Initial Paid</span>
                <span>{fmt(sale.paidAmount || 0)}</span>
              </div>
              <div className="cdm-tot-row green">
                <span>Later Payments</span>
                <span>{fmt(totalPaidLater)}</span>
              </div>
              <div
                className={`cdm-tot-row bold big ${currentBalance > 0 ? "red" : "green"}`}
              >
                <span>Current Balance</span>
                <span>{fmt(currentBalance)}</span>
              </div>
            </div>
            <div className="cdm-meta-row">
              <span>
                📅 <b>{sale.invoiceDate}</b>
              </span>
              <span>
                📞 <b>{customer?.phone || "—"}</b>
              </span>
              <span>
                💳 <b>{sale.paymentMode || "Credit"}</b>
              </span>
            </div>
            {sale.remarks && (
              <div className="cdm-remarks">📝 {sale.remarks}</div>
            )}
          </div>
          <div className="cdm-right">
            <div className="cdm-pay-box">
              <div className="cdm-section-title">💰 Record Credit Payment</div>
              <div className="cdm-pay-balance">
                Outstanding:{" "}
                <span className="red bold">PKR {fmt(currentBalance)}</span>
              </div>
              {payMsg.text && (
                <div
                  className={`cs-msg ${payMsg.type}`}
                  style={{ margin: "4px 0", fontSize: 12 }}
                >
                  {payMsg.text}
                </div>
              )}
              <div className="cdm-pay-form">
                <div className="cdm-pay-field">
                  <label>Amount (PKR)</label>
                  <input
                    ref={payRef}
                    type="number"
                    className="cdm-pay-input"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handlePay();
                    }}
                    placeholder="Enter amount…"
                  />
                </div>
                <div className="cdm-pay-field">
                  <label>Remarks</label>
                  <input
                    type="text"
                    className="cdm-pay-input"
                    value={payRemarks}
                    onChange={(e) => setPayRemarks(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handlePay();
                    }}
                    placeholder="e.g. Cash received…"
                  />
                </div>
                <button
                  className="cs-btn cs-btn-primary cdm-pay-btn"
                  onClick={handlePay}
                  disabled={paying}
                >
                  {paying ? "Processing…" : "✅ Record Payment"}
                </button>
              </div>
            </div>
            <div className="cdm-pay-history">
              <div className="cdm-section-title">
                🕒 Payment History{" "}
                <span className="cdm-ph-count">({payments.length})</span>
              </div>
              <div className="cdm-ph-scroll">
                <table className="cdm-ph-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th className="r">Amount</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingPay && (
                      <tr>
                        <td colSpan={3} className="cs-empty">
                          Loading…
                        </td>
                      </tr>
                    )}
                    {!loadingPay && payments.length === 0 && (
                      <tr>
                        <td colSpan={3} className="cs-empty">
                          No payments yet
                        </td>
                      </tr>
                    )}
                    {payments.map((p, i) => (
                      <tr
                        key={p._id || i}
                        className={i % 2 === 0 ? "even" : "odd"}
                      >
                        <td>{p.paymentDate || p.createdAt?.split("T")[0]}</td>
                        <td className="r green bold">{fmt(p.amount)}</td>
                        <td>{p.remarks || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {payments.length > 0 && (
                <div className="cdm-ph-total">
                  Total Paid Later:{" "}
                  <span className="green bold">{fmt(totalPaidLater)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="cdm-footer">
          <button className="cs-btn" onClick={onClose}>
            ✕ Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// HISTORY PANEL (right side) — with WhatsApp history + Manage Customers btn
// ═══════════════════════════════════════════════════════════════════════════
function HistoryPanel({
  customer,
  currentSaleTotal,
  onSaleClick,
  onManageCustomers,
}) {
  const [sales, setSales] = useState([]);
  const [loading, setLoad] = useState(false);

  useEffect(() => {
    if (customer?._id) loadHistory();
    else setSales([]);
  }, [customer?._id]);

  const loadHistory = async () => {
    setLoad(true);
    try {
      const { data } = await api.get(EP.CUSTOMERS.SALE_HISTORY(customer._id));
      if (data.success) setSales(data.data);
    } catch {}
    setLoad(false);
  };

  // Send full purchasing history via WhatsApp
  const sendHistoryWhatsApp = () => {
    if (!customer || !sales.length) return;
    const saleTxns = sales.filter((s) => s.saleType === "sale");
    const totalSales = saleTxns.reduce((s, x) => s + (x.netTotal || 0), 0);
    const totalPaid = saleTxns.reduce((s, x) => s + (x.paidAmount || 0), 0);
    const sep = "━".repeat(28);
    const invoiceLines = sales
      .slice(0, 20)
      .map(
        (s, i) =>
          `${i + 1}. ${s.invoiceNo} | ${s.invoiceDate}\n    Amount: PKR ${Number(s.netTotal || 0).toLocaleString()} | Paid: ${Number(s.paidAmount || 0).toLocaleString()} | *Bal: ${Number(s.balance || 0).toLocaleString()}*`,
      )
      .join("\n");
    const text = `🏪 *ASIM ELECTRIC & ELECTRONIC STORE*
${sep}
👤 *Customer: ${customer.name}*${customer.phone ? "\n📞 Phone: " + customer.phone : ""}
📅 Statement Date: ${isoDate()}
${sep}
📋 *TRANSACTION HISTORY*
(Showing last ${Math.min(sales.length, 20)} of ${sales.length} records)

${invoiceLines}
${sep}
📊 *ACCOUNT SUMMARY*
Total Purchases:   PKR ${Number(totalSales).toLocaleString()}
Total Paid:        PKR ${Number(totalPaid).toLocaleString()}
*Outstanding Due:  PKR ${Number(customer.currentBalance || 0).toLocaleString()}*
${sep}
_For queries, please contact us._
_Thank you for your business!_`;

    const phoneNum = customer.phone?.replace(/\D/g, "") || "";
    window.open(
      `https://wa.me/${phoneNum}?text=${encodeURIComponent(text)}`,
      "_blank",
    );
  };

  if (!customer) {
    return (
      <div className="cs-hist-empty">
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>👤</div>
          <div
            style={{
              marginBottom: 16,
              color: "var(--text-muted)",
              fontStyle: "italic",
            }}
          >
            Enter phone to load customer
          </div>
          <button className="cs-btn cs-manage-btn" onClick={onManageCustomers}>
            👥 Manage Customers
          </button>
        </div>
      </div>
    );
  }

  const saleTxns = sales.filter((s) => s.saleType === "sale");
  const returnTxns = sales.filter((s) => s.saleType === "return");
  const totalSales = saleTxns.reduce((s, x) => s + (x.netTotal || 0), 0);
  const totalPaid = saleTxns.reduce((s, x) => s + (x.paidAmount || 0), 0);
  const totalReturn = returnTxns.reduce((s, x) => s + (x.netTotal || 0), 0);
  const prevBalance = customer.currentBalance || 0;

  return (
    <div className="cs-hist-panel">
      {/* Customer header + action buttons */}
      <div className="cs-hist-header">
        <div className="cs-hist-name">{customer.name}</div>
        <div className="cs-hist-phone">
          {customer.phone}
          {customer.code && ` | ${customer.code}`}
        </div>
        <div className="cs-hist-panel-actions">
          <button
            className="cs-hist-action-btn cs-hist-wa-btn"
            onClick={sendHistoryWhatsApp}
            title="Send full purchase history via WhatsApp"
            disabled={!sales.length}
          >
            📱 WhatsApp History
          </button>
          <button
            className="cs-hist-action-btn"
            onClick={onManageCustomers}
            title="Go to Manage Customers page"
          >
            👥 Manage
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="cs-hist-cards">
        <div className="cs-hcard">
          <div className="cs-hcard-l">Total Sales</div>
          <div className="cs-hcard-v">{fmt(totalSales)}</div>
        </div>
        <div className="cs-hcard">
          <div className="cs-hcard-l">Total Paid</div>
          <div className="cs-hcard-v green">{fmt(totalPaid)}</div>
        </div>
        <div className="cs-hcard">
          <div className="cs-hcard-l">Returns</div>
          <div className="cs-hcard-v green">{fmt(totalReturn)}</div>
        </div>
        <div className={`cs-hcard ${prevBalance > 0 ? "danger" : "ok"}`}>
          <div className="cs-hcard-l">Current Due</div>
          <div className="cs-hcard-v bold">{fmt(prevBalance)}</div>
        </div>
        {currentSaleTotal > 0 && (
          <div className="cs-hcard danger">
            <div className="cs-hcard-l">After This Sale</div>
            <div className="cs-hcard-v bold">
              {fmt(prevBalance + currentSaleTotal)}
            </div>
          </div>
        )}
      </div>

      <div className="cs-hist-label">
        Transaction History ({sales.length})
        <span className="cs-hist-hint"> — Click for details & payment</span>
      </div>
      <div className="cs-hist-table-wrap">
        <table className="cs-hist-table">
          <thead>
            <tr>
              <th style={{ width: 95 }}>Invoice</th>
              <th style={{ width: 85 }}>Date</th>
              <th className="r" style={{ width: 78 }}>
                Amount
              </th>
              <th className="r" style={{ width: 70 }}>
                Paid
              </th>
              <th className="r" style={{ width: 72 }}>
                Balance
              </th>
              <th style={{ width: 46 }}>Type</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="cs-empty">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && sales.length === 0 && (
              <tr>
                <td colSpan={6} className="cs-empty">
                  No history yet
                </td>
              </tr>
            )}
            {sales.map((s, i) => (
              <tr
                key={s._id}
                className={`cs-hist-row ${i % 2 === 0 ? "even" : "odd"}`}
                onClick={() => onSaleClick && onSaleClick(s)}
                title="Click to view details & record payment"
                style={{ cursor: "pointer" }}
              >
                <td className="blue">{s.invoiceNo}</td>
                <td>{s.invoiceDate}</td>
                <td className="r bold">{fmt(s.netTotal)}</td>
                <td className="r">{fmt(s.paidAmount)}</td>
                <td className={`r ${s.balance > 0 ? "red" : ""}`}>
                  {fmt(s.balance)}
                </td>
                <td className="c">
                  <span className={`cs-badge ${s.saleType}`}>{s.saleType}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════
export default function CreditSalePage() {
  const SHOP_NAME = "Asim Electric and Electronic Store";
  const navigate = useNavigate();

  const [invoiceNo, setInvoiceNo] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(isoDate());
  const [phone, setPhone] = useState("");
  const [customer, setCustomer] = useState(null);
  const [rows, setRows] = useState([{ ...EMPTY_ROW }]);
  const [activeRow, setActiveRow] = useState(0);
  const [extraDisc, setExtraDisc] = useState(0);
  const [paid, setPaid] = useState(0);
  const [remarks, setRemarks] = useState("");
  const [products, setProducts] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [showInvoice, setShowInvoice] = useState(false);
  const [savedSale, setSavedSale] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ text: "", type: "" });
  const [holds, setHolds] = useState([]);
  const [showCustSearch, setShowCustSearch] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const phoneRef = useRef(null);
  const searchRef = useRef(null);
  const paidRef = useRef(null);
  const saveRef = useRef(null);
  const rowRefs = useRef([]);

  const subTotal = rows.reduce((s, r) => s + (r.amount || 0), 0);
  const discAmt = Math.round((subTotal * (extraDisc || 0)) / 100);
  const netTotal = subTotal - discAmt;
  const prevBal = customer?.currentBalance || 0;
  const totalDue = netTotal + prevBal;
  const balance = totalDue - (Number(paid) || 0);

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
  }, [rows, customer, paid, extraDisc]);

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

  const handlePhoneSearch = () => setShowCustSearch(true);

  const handleCustomerSelect = (c) => {
    setCustomer(c);
    setPhone(c.phone || "");
    setShowCustSearch(false);
    showMsg(`✅ ${c.name} — Due: ${fmt(c.currentBalance || 0)}`);
    setTimeout(() => searchRef.current?.focus(), 80);
  };

  const handleAddNewCustomer = async (nameOrPhone) => {
    const trimmed = nameOrPhone.trim();
    if (!trimmed) return;
    const isPhone = /^[0-9+\-\s]{7,}$/.test(trimmed);
    try {
      const payload = isPhone
        ? { name: "New Customer", phone: trimmed, type: "credit" }
        : { name: trimmed, phone: phone.trim(), type: "credit" };
      const { data } = await api.post(EP.CUSTOMERS.CREATE, payload);
      if (data.success) {
        setCustomer(data.data);
        setPhone(data.data.phone || phone.trim());
        setShowCustSearch(false);
        showMsg(`✅ Customer added: ${data.data.name}`);
      } else showMsg(data.message || "Add failed", "error");
    } catch {
      showMsg("Add failed", "error");
    }
  };

  const handleProductSelect = (product) => {
    const qty = rows[activeRow]?.qty || 1,
      rate = product._rate || 0;
    const item = {
      productId: product._id || "",
      code: product.code || "",
      description: product._name || product.description || "",
      measurement: product._meas || "",
      qty,
      rate,
      disc: rows[activeRow]?.disc || 0,
      amount: qty * rate,
    };
    setRows((prev) => {
      const next = [...prev];
      next[activeRow] = { ...next[activeRow], ...item };
      return next;
    });
    setSearchText(product._name || product.description || "");
    setShowSearch(false);
    setTimeout(() => rowRefs.current[activeRow]?.qty?.focus(), 30);
  };

  const updateRow = (i, field, val) => {
    setRows((prev) => {
      const next = [...prev],
        r = { ...next[i], [field]: val };
      if (["qty", "rate", "disc"].includes(field)) {
        const q = field === "qty" ? Number(val) : Number(r.qty),
          rt = field === "rate" ? Number(val) : Number(r.rate),
          d = field === "disc" ? Number(val) : Number(r.disc);
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
    setTimeout(() => rowRefs.current[i + 1]?.code?.focus(), 30);
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
      const pk = found.packingInfo?.[0] || {},
        desc = [found.category, found.description, found.company]
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

  const holdBill = () => {
    if (!rows.some((r) => r.description)) {
      showMsg("Nothing to hold", "error");
      return;
    }
    setHolds((p) => [
      ...p,
      { id: Date.now(), rows, customer, phone, extraDisc, paid, remarks },
    ]);
    resetForm();
    showMsg("Bill held (F8)");
  };
  const resumeHold = (id) => {
    const h = holds.find((x) => x.id === id);
    if (!h) return;
    setRows(h.rows);
    setCustomer(h.customer);
    setPhone(h.phone);
    setExtraDisc(h.extraDisc);
    setPaid(h.paid);
    setRemarks(h.remarks);
    setHolds((p) => p.filter((x) => x.id !== id));
  };
  const resetForm = () => {
    setRows([{ ...EMPTY_ROW }]);
    setCustomer(null);
    setPhone("");
    setExtraDisc(0);
    setPaid(0);
    setRemarks("");
    setSearchText("");
    fetchInvoiceNo();
    setTimeout(() => phoneRef.current?.focus(), 30);
  };

  const handleSave = async () => {
    if (!customer) {
      showMsg("Select a credit customer first", "error");
      phoneRef.current?.focus();
      return;
    }
    const validRows = rows.filter((r) => r.description && r.qty > 0);
    if (!validRows.length) {
      showMsg("Add at least one item", "error");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        invoiceDate,
        saleType: "sale",
        paymentMode: "Credit",
        customerId: customer._id,
        customerName: customer.name,
        customerPhone: customer.phone || phone,
        items: validRows,
        subTotal,
        extraDisc: Number(extraDisc),
        discAmount: discAmt,
        netTotal,
        prevBalance: prevBal,
        paidAmount: Number(paid),
        balance,
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
          prevBalance: prevBal,
          paidAmount: Number(paid),
          balance,
        });
        setShowInvoice(true);
        showMsg(`✅ ${data.data.invoiceNo} saved`);
        resetForm();
      } else showMsg(data.message, "error");
    } catch (e) {
      showMsg(e.response?.data?.message || "Save failed", "error");
    }
    setSaving(false);
  };

  const handleSaleRowClick = (sale) => {
    setSelectedSale(sale);
    setShowDetailModal(true);
  };
  const handlePaymentDone = async () => {
    if (!customer?._id) return;
    try {
      const { data } = await api.get(EP.CUSTOMERS.GET_CREDIT(customer.phone));
      if (data.success && data.data.length > 0) setCustomer(data.data[0]);
    } catch {}
  };

  return (
    <div className="cs-page">
      {showSearch && (
        <SearchModal
          allProducts={products}
          onSelect={handleProductSelect}
          onClose={() => setShowSearch(false)}
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
      {showCustSearch && (
        <CustomerSearchModal
          searchTerm={phone}
          onSelect={handleCustomerSelect}
          onAddNew={handleAddNewCustomer}
          onClose={() => setShowCustSearch(false)}
        />
      )}
      {showDetailModal && selectedSale && (
        <CustomerDetailModal
          sale={selectedSale}
          customer={customer}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedSale(null);
          }}
          onPaymentDone={handlePaymentDone}
        />
      )}

      <div className="cs-shortcuts">
        F2=New | F3=Search | F5=Save | F8=Hold | Enter=Next field |
        Ctrl+Del=Remove row
      </div>
      {msg.text && <div className={`cs-msg ${msg.type}`}>{msg.text}</div>}

      <div className="cs-body">
        <div className="cs-left">
          <div className="cs-header-bar">
            <div className="cs-header-title">💳 Credit Sale</div>
            <div className="cs-header-fields">
              <div className="cs-hf">
                <span>Invoice #</span>
                <input
                  className="cs-hinput bold"
                  value={invoiceNo}
                  readOnly
                  tabIndex={-1}
                />
              </div>
              <div className="cs-hf">
                <span>Date</span>
                <input
                  type="date"
                  className="cs-hinput"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  tabIndex={-1}
                />
              </div>
            </div>
          </div>

          <div className="cs-cust-bar">
            <span className="cs-cust-label">📞 Phone/Code</span>
            <input
              ref={phoneRef}
              className="cs-cust-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handlePhoneSearch();
              }}
              placeholder="Type phone/name → Enter to search…"
              tabIndex={1}
            />
            <button
              className="cs-btn"
              onClick={handlePhoneSearch}
              tabIndex={-1}
            >
              🔍 Search
            </button>
            {customer ? (
              <div className="cs-cust-loaded">
                <span className="cs-cust-name">✅ {customer.name}</span>
                <span className="cs-cust-bal">
                  Due:{" "}
                  <b className="red">{fmt(customer.currentBalance || 0)}</b>
                </span>
                <button
                  className="cs-cust-clear"
                  onClick={() => {
                    setCustomer(null);
                    setPhone("");
                  }}
                  tabIndex={-1}
                >
                  ✕
                </button>
              </div>
            ) : (
              <span className="cs-cust-none">⚠️ No customer selected</span>
            )}
            {holds.length > 0 &&
              holds.map((h) => (
                <button
                  key={h.id}
                  className="cs-hold-btn"
                  onClick={() => resumeHold(h.id)}
                  tabIndex={-1}
                >
                  📋 {h.customer?.name || "Hold"}
                </button>
              ))}
          </div>

          <div className="cs-search-bar">
            <span className="cs-search-label">Select Product</span>
            <input
              ref={searchRef}
              type="text"
              className={`cs-search-input${searchText ? " filled" : ""}`}
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
              tabIndex={3}
            />
            {searchText && (
              <button
                className="cs-btn"
                onClick={() => setSearchText("")}
                tabIndex={-1}
              >
                ✕ Clear
              </button>
            )}
          </div>

          <div className="cs-table-wrap">
            <table className="cs-table">
              <thead>
                <tr>
                  <th style={{ width: 30 }}>#</th>
                  <th style={{ width: 78 }}>Code</th>
                  <th>Description</th>
                  <th style={{ width: 78 }}>Meas.</th>
                  <th style={{ width: 62 }}>Qty</th>
                  <th style={{ width: 82 }}>Rate</th>
                  <th style={{ width: 58 }}>Disc%</th>
                  <th style={{ width: 88 }}>Amount</th>
                  <th style={{ width: 26 }}></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => {
                  if (!rowRefs.current[i]) rowRefs.current[i] = {};
                  return (
                    <tr
                      key={i}
                      className={
                        i === activeRow
                          ? "cs-row-active"
                          : i % 2 === 0
                            ? "cs-row-even"
                            : "cs-row-odd"
                      }
                      onClick={() => setActiveRow(i)}
                    >
                      <td className="c">{i + 1}</td>
                      <td>
                        <input
                          className="cs-cell full"
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
                          className="cs-cell full"
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
                          className="cs-cell"
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
                          className="cs-cell r"
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
                          className="cs-cell r"
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
                          className="cs-cell r"
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
                      <td className="r bold">{fmt(row.amount)}</td>
                      <td className="c">
                        <button
                          className="cs-del-row"
                          onClick={() => deleteRow(i)}
                          tabIndex={-1}
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

          <div className="cs-footer">
            <div className="cs-footer-left">
              <div className="cs-remarks-row">
                <span>Remarks</span>
                <input
                  className="cs-remarks-input"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") paidRef.current?.focus();
                  }}
                  tabIndex={90}
                />
              </div>
              <div className="cs-footer-btns">
                <button
                  className="cs-btn"
                  onClick={() => setShowSearch(true)}
                  tabIndex={-1}
                >
                  🔍 F3
                </button>
                <button className="cs-btn" onClick={holdBill} tabIndex={-1}>
                  📋 F8
                </button>
                <button className="cs-btn" onClick={resetForm} tabIndex={-1}>
                  🔄 F2
                </button>
                <button
                  ref={saveRef}
                  className="cs-btn cs-btn-primary"
                  onClick={handleSave}
                  disabled={saving}
                  tabIndex={91}
                >
                  {saving ? "Saving…" : "💾 F5 Save"}
                </button>
              </div>
            </div>
            <div className="cs-totals">
              <div className="cs-tr">
                <span>Sub Total</span>
                <span>{fmt(subTotal)}</span>
              </div>
              <div className="cs-tr">
                <span>Extra Disc%</span>
                <input
                  type="number"
                  className="cs-tot-input"
                  value={extraDisc}
                  onChange={(e) => setExtraDisc(e.target.value)}
                  tabIndex={89}
                />
              </div>
              <div className="cs-tr">
                <span>Disc Amt</span>
                <span className="red">-{fmt(discAmt)}</span>
              </div>
              <div className="cs-tr bold big">
                <span>Net Total</span>
                <span>{fmt(netTotal)}</span>
              </div>
              <div className="cs-tr">
                <span>Prev Balance</span>
                <span className="red">{fmt(prevBal)}</span>
              </div>
              <div className="cs-tr bold red">
                <span>Total Due</span>
                <span>{fmt(totalDue)}</span>
              </div>
              <div className="cs-tr">
                <span>Paid</span>
                <input
                  ref={paidRef}
                  type="number"
                  className="cs-tot-input green"
                  value={paid}
                  onChange={(e) => setPaid(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveRef.current?.focus();
                  }}
                  tabIndex={90}
                />
              </div>
              <div className={`cs-tr bold ${balance > 0 ? "red" : "green"}`}>
                <span>Balance</span>
                <span>{fmt(balance)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="cs-right">
          <HistoryPanel
            customer={customer}
            currentSaleTotal={netTotal}
            onSaleClick={handleSaleRowClick}
            onManageCustomers={() => navigate("/credit-customers")}
          />
        </div>
      </div>
    </div>
  );
}
