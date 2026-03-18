import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api.js";
import EP from "../api/apiEndpoints.js";
import "../styles/theme.css";
import "../styles/CreditSalePage.css";

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

/* ─────────────────────────────────────────────────────────────
   CUSTOMER SEARCH MODAL
───────────────────────────────────────────────────────────── */
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
        const list = (data.data || []).filter((c) => c.type === "credit");
        setResults(list);
        setHiIdx(0);
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
    if (e.key === "Escape") onClose();
  };

  useEffect(() => {
    tbodyRef.current?.children[hiIdx]?.scrollIntoView({ block: "nearest" });
  }, [hiIdx]);

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
          <span className="xp-modal-title">Search Credit Customer</span>
          <button className="xp-cap-btn xp-cap-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="cs-modal-filters">
          <div className="cs-modal-filter-grp" style={{ flex: 2 }}>
            <label className="xp-label">Search (Name / Phone / Code)</label>
            <div className="xp-search-wrap">
              <svg
                className="xp-search-icon"
                width="12"
                height="12"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0" />
              </svg>
              <input
                ref={inputRef}
                className="xp-input"
                value={query}
                onChange={handleQueryChange}
                onKeyDown={inputKeyDown}
                placeholder="Exact match auto-selects…"
                autoComplete="off"
              />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 5 }}>
            <span style={{ fontSize: "var(--xp-fs-xs)", color: "#555" }}>
              {results.length} found
            </span>
            <button
              className="xp-btn xp-btn-primary xp-btn-sm"
              onClick={() => onAddNew(query)}
              tabIndex={-1}
            >
              + Add New
            </button>
            <button
              className="xp-btn xp-btn-sm"
              onClick={onClose}
              tabIndex={-1}
            >
              Cancel
            </button>
          </div>
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
                    <th className="r">Current Due</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody ref={tbodyRef} tabIndex={0} onKeyDown={tableKeyDown}>
                  {loading && (
                    <tr>
                      <td colSpan={5} className="xp-loading">
                        Searching…
                      </td>
                    </tr>
                  )}
                  {!loading && results.length === 0 && (
                    <tr>
                      <td colSpan={5} className="xp-empty">
                        No customer found — press Add New to create
                      </td>
                    </tr>
                  )}
                  {results.map((c, i) => (
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
                      <td>
                        <span
                          className={`xp-badge ${(c.currentBalance || 0) > 0 ? "xp-badge-due" : "xp-badge-clear"}`}
                        >
                          {(c.currentBalance || 0) > 0 ? "Due" : "Clear"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="cs-modal-hint">
          ↑↓ navigate &nbsp;|&nbsp; Enter / Double-click = select &nbsp;|&nbsp;
          Exact match = auto-select &nbsp;|&nbsp; Esc = close
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
              onKeyDown={(e) => filterKey(e, rCat)}
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
              onKeyDown={(e) => filterKey(e, rCompany)}
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
              onKeyDown={(e) => filterKey(e, null)}
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
                    <th>Measurement</th>
                    <th className="r">Rate</th>
                    <th className="r">Stock</th>
                    <th className="r">Pack</th>
                  </tr>
                </thead>
                <tbody ref={tbodyRef} tabIndex={0} onKeyDown={tableKey}>
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
          Esc = close &nbsp;|&nbsp; Tab = back to filters
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   INVOICE MODAL
───────────────────────────────────────────────────────────── */
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
    <style>body{font-family:Arial,sans-serif;font-size:12px;margin:20px;color:#000}h2{text-align:center;font-size:22px;margin:0 0 2px}.sub{text-align:center;font-size:11px;color:#555;margin-bottom:10px;letter-spacing:1px;text-transform:uppercase}.meta{display:flex;justify-content:space-between;flex-wrap:wrap;gap:4px;border:1px solid #ccc;padding:6px 10px;margin:8px 0;background:#f9f9f9;font-size:11px}table{width:100%;border-collapse:collapse;margin-top:10px}th{background:#e8e8e8;border:1px solid #ccc;padding:5px 7px;text-align:left;font-size:11px}td{border:1px solid #ddd;padding:4px 7px;font-size:11px}.tots{float:right;min-width:240px;margin-top:12px;border:1px solid #ccc;padding:8px 12px;background:#f9f9f9}.tr{display:flex;justify-content:space-between;padding:3px 0;font-size:12px;border-bottom:1px dotted #eee}.tr.b{font-weight:bold;font-size:14px;border-top:2px solid #000;border-bottom:none;margin-top:6px;padding-top:6px}.tr.red{color:#c0392b}.tr.green{color:#27ae60}.thanks{text-align:center;margin-top:30px;font-size:11px;color:#888;clear:both;border-top:1px dashed #ccc;padding-top:10px}@media print{body{margin:5mm}@page{margin:10mm}}</style></head><body>
    <h2>${shopName}</h2><div class="sub">◆ Credit Sale Invoice ◆</div>
    <div class="meta"><span><b>Invoice #:</b> ${sale.invoiceNo}</span><span><b>Date:</b> ${sale.invoiceDate}</span><span><b>Customer:</b> ${sale.customerName}${sale.customerPhone ? " | " + sale.customerPhone : ""}</span><span><b>Prev Balance:</b> PKR ${Number(sale.prevBalance || 0).toLocaleString()}</span></div>
    <table><thead><tr><th>#</th><th>Description</th><th>Meas.</th><th align="right">Qty</th><th align="right">Rate</th><th align="right">Disc%</th><th align="right">Amount</th></tr></thead><tbody>${rows}</tbody></table>
    <div class="tots"><div class="tr"><span>Sub Total</span><span>PKR ${Number(sale.subTotal).toLocaleString()}</span></div>${sale.discAmount > 0 ? `<div class="tr"><span>Discount</span><span style="color:red">-PKR ${Number(sale.discAmount).toLocaleString()}</span></div>` : ""}<div class="tr b"><span>Net Total</span><span>PKR ${Number(sale.netTotal).toLocaleString()}</span></div><div class="tr red"><span>Previous Balance</span><span>PKR ${Number(sale.prevBalance || 0).toLocaleString()}</span></div><div class="tr b red"><span>Total Due</span><span>PKR ${Number(totalDue).toLocaleString()}</span></div><div class="tr green"><span>Paid This Time</span><span>PKR ${Number(sale.paidAmount || 0).toLocaleString()}</span></div><div class="tr b red"><span>Remaining Balance</span><span>PKR ${Number(sale.balance || 0).toLocaleString()}</span></div></div>
    <br style="clear:both"><div class="thanks">Thank you for your business! — ${shopName}</div></body></html>`;
  };

  const buildThermalHtml = () => {
    const rows = sale.items
      .map(
        (it, i) =>
          `<tr><td style="padding:2px 0">${i + 1}. ${it.description}</td><td align="right" style="padding:2px 0">${it.qty}×${Number(it.rate).toLocaleString()}</td><td align="right" style="padding:2px 0"><b>${Number(it.amount).toLocaleString()}</b></td></tr>`,
      )
      .join("");
    const totalDue = (sale.netTotal || 0) + (sale.prevBalance || 0);
    return `<!DOCTYPE html><html><head><title>Receipt</title><style>body{font-family:'Courier New',monospace;font-size:11px;width:72mm;margin:0 auto;padding:4px}h3{text-align:center;font-size:14px;margin:4px 0}.c{text-align:center;font-size:10px}hr{border:none;border-top:1px dashed #000;margin:4px 0}table{width:100%;font-size:10px;border-collapse:collapse}.t{display:flex;justify-content:space-between;font-size:11px;padding:1px 0}.t.b{font-weight:bold;font-size:12px;border-top:1px dashed #000;padding-top:3px;margin-top:2px}.t.red{color:#c0392b}.t.green{color:#27ae60}@media print{@page{size:80mm auto;margin:3mm}}</style></head><body>
    <h3>${shopName}</h3><div class="c">★ CREDIT SALE RECEIPT ★</div><hr>
    <div class="c">Invoice: <b>${sale.invoiceNo}</b> | ${sale.invoiceDate}</div>
    <div class="c"><b>${sale.customerName}</b>${sale.customerPhone ? " | " + sale.customerPhone : ""}</div><hr>
    <table><tbody>${rows}</tbody></table><hr>
    <div class="t"><span>Sub Total</span><span>${Number(sale.subTotal).toLocaleString()}</span></div>${sale.discAmount > 0 ? `<div class="t"><span>Discount</span><span>-${Number(sale.discAmount).toLocaleString()}</span></div>` : ""}
    <div class="t b"><span>Net Total</span><span>${Number(sale.netTotal).toLocaleString()}</span></div><div class="t red"><span>Prev Balance</span><span>${Number(sale.prevBalance || 0).toLocaleString()}</span></div><div class="t b red"><span>Total Due</span><span>${Number(totalDue).toLocaleString()}</span></div><div class="t green"><span>Paid</span><span>${Number(sale.paidAmount || 0).toLocaleString()}</span></div><div class="t b red"><span>Balance</span><span>${Number(sale.balance || 0).toLocaleString()}</span></div><hr>
    <div class="c" style="font-size:10px;margin-top:4px">Thank you! — ${shopName}</div></body></html>`;
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
          `${i + 1}. ${it.description}\n ${it.qty} × PKR ${Number(it.rate).toLocaleString()}${it.disc ? ` (-${it.disc}%)` : ""} = *PKR ${Number(it.amount).toLocaleString()}*`,
      )
      .join("\n");
    const totalDue = (sale.netTotal || 0) + (sale.prevBalance || 0);
    const sep = "━".repeat(28);
    const text = `*${shopName}*\n${"─".repeat(32)}\n*Invoice #${sale.invoiceNo}*\nDate: ${sale.invoiceDate}\nCustomer: *${sale.customerName}*${sale.customerPhone ? "\nPhone: " + sale.customerPhone : ""}\n${sep}\n*ITEMS PURCHASED:*\n${lines}\n${sep}\nSub Total: PKR ${Number(sale.subTotal).toLocaleString()}${sale.discAmount > 0 ? `\nDiscount: -PKR ${Number(sale.discAmount).toLocaleString()}` : ""}\nNet Total: *PKR ${Number(sale.netTotal).toLocaleString()}*\nPrevious Balance: PKR ${Number(sale.prevBalance || 0).toLocaleString()}\n${"─".repeat(30)}\n*Total Due: PKR ${Number(totalDue).toLocaleString()}*\nPaid This Time: PKR ${Number(sale.paidAmount || 0).toLocaleString()}\n*Remaining: PKR ${Number(sale.balance || 0).toLocaleString()}*\n${sep}\n_Thank you! — ${shopName}_`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const totalDue = (sale.netTotal || 0) + (sale.prevBalance || 0);

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
            <div className="cs-inv-shop">{shopName}</div>
            <div className="cs-inv-sub">◆ Credit Sale Invoice ◆</div>
            <div className="cs-inv-meta">
              <span>
                Invoice: <strong>{sale.invoiceNo}</strong>
              </span>
              <span>
                Date: <strong>{sale.invoiceDate}</strong>
              </span>
              <span>
                Customer: <strong>{sale.customerName}</strong>{" "}
                {sale.customerPhone}
              </span>
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
              <div className="cs-inv-total-row danger">
                <span>Prev Balance</span>
                <span className="xp-amt danger">
                  {fmt(sale.prevBalance || 0)}
                </span>
              </div>
              <div className="cs-inv-total-row bold danger">
                <span>Total Due</span>
                <span className="xp-amt danger">{fmt(totalDue)}</span>
              </div>
              <div className="cs-inv-total-row success">
                <span>Paid</span>
                <span className="xp-amt success">
                  {fmt(sale.paidAmount || 0)}
                </span>
              </div>
              <div className="cs-inv-total-row bold danger">
                <span>Balance</span>
                <span className="xp-amt danger">{fmt(sale.balance || 0)}</span>
              </div>
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
              <path d="M5 1a2 2 0 0 0-2 2v2H2a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h1v1a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-1h1a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-1V3a2 2 0 0 0-2-2zm4 7h2v3H5v-3h4zm-4 2V9h4v1H5zm4-2H5V8h4v1zm-4 4v-1h4v1H5zm0 1v1h4v-1H5z" />
            </svg>
            Thermal Print
          </button>
          <button className="xp-btn xp-btn-sm" onClick={printA4}>
            <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
              <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1L14 5.5z" />
            </svg>
            A4 Print / PDF
          </button>
          <button
            className="xp-btn xp-btn-wa xp-btn-sm"
            onClick={shareWhatsApp}
          >
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
   CUSTOMER DETAIL / PAYMENT MODAL
───────────────────────────────────────────────────────────── */
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
        showPayMsg(`PKR ${fmt(amt)} recorded`, "success");
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
            Invoice #{sale.invoiceNo} — {customer?.name}
          </span>
          <button className="xp-cap-btn xp-cap-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="xp-modal-body" style={{ padding: 0 }}>
          <div className="cs-pay-two-col">
            {/* items side */}
            <div>
              <div className="cs-pay-section-title">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <path d="M0 1.5A.5.5 0 0 1 .5 1H2a.5.5 0 0 1 .485.379L2.89 3H14.5a.5.5 0 0 1 .491.592l-1.5 8A.5.5 0 0 1 13 12H4a.5.5 0 0 1-.491-.408L2.01 3.607 1.61 2H.5a.5.5 0 0 1-.5-.5" />
                </svg>
                Items Purchased
              </div>
              <div className="xp-table-panel">
                <table
                  className="xp-table"
                  style={{ fontSize: "var(--xp-fs-xs)" }}
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
                    {(sale.items || []).map((it, i) => (
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
                    {(!sale.items || sale.items.length === 0) && (
                      <tr>
                        <td colSpan={7} className="xp-empty">
                          No items
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="cs-totals-box" style={{ marginTop: 8 }}>
                <div className="cs-total-row">
                  <label>Sub Total</label>
                  <span className="val">{fmt(sale.subTotal)}</span>
                </div>
                {sale.discAmount > 0 && (
                  <div className="cs-total-row">
                    <label>Discount</label>
                    <span className="val danger">-{fmt(sale.discAmount)}</span>
                  </div>
                )}
                <div className="cs-total-row highlight">
                  <label>Net Total</label>
                  <span className="val">{fmt(sale.netTotal)}</span>
                </div>
                <div className="cs-total-row">
                  <label>Prev Balance</label>
                  <span className="val danger">
                    {fmt(sale.prevBalance || 0)}
                  </span>
                </div>
                <div className="cs-total-row">
                  <label>Total Due</label>
                  <span className="val danger">
                    {fmt((sale.netTotal || 0) + (sale.prevBalance || 0))}
                  </span>
                </div>
                <div className="cs-total-row">
                  <label>Initial Paid</label>
                  <span className="val success">
                    {fmt(sale.paidAmount || 0)}
                  </span>
                </div>
                <div className="cs-total-row">
                  <label>Later Payments</label>
                  <span className="val success">{fmt(totalPaidLater)}</span>
                </div>
                <div className="cs-total-row highlight">
                  <label>Current Balance</label>
                  <span className="val danger">{fmt(currentBalance)}</span>
                </div>
              </div>
            </div>

            {/* payment side */}
            <div>
              <div className="cs-pay-section-title">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <path d="M12.136.326A1.5 1.5 0 0 1 14 1.78V3h.5A1.5 1.5 0 0 1 16 4.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 0 13.5v-9A1.5 1.5 0 0 1 1.432 3.001L12.136.326z" />
                </svg>
                Record Payment
              </div>
              <div className="cs-pay-outstanding">
                <span>Outstanding</span>
                <strong>PKR {fmt(currentBalance)}</strong>
              </div>
              {payMsg.text && (
                <div
                  className={`xp-alert ${payMsg.type === "success" ? "xp-alert-success" : "xp-alert-error"}`}
                  style={{ marginBottom: 8 }}
                >
                  {payMsg.text}
                </div>
              )}
              <div className="xp-form-grp" style={{ marginBottom: 8 }}>
                <label className="xp-label">Amount (PKR)</label>
                <input
                  ref={payRef}
                  type="number"
                  className="xp-input xp-input-lg"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handlePay();
                  }}
                  placeholder="Enter amount…"
                />
              </div>
              <div className="xp-form-grp" style={{ marginBottom: 10 }}>
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

              <div className="cs-pay-section-title" style={{ marginTop: 14 }}>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <path d="M8.515 1.019A7 7 0 0 0 8 1V0a8 8 0 0 1 .589.022zm2.004.45a7 7 0 0 0-.985-.299l.219-.976q.576.129 1.126.342zm1.37.71a7 7 0 0 0-.439-.27l.493-.87a8 8 0 0 1 .979.654l-.615.789a7 7 0 0 0-.418-.302zm1.834 1.79a7 7 0 0 0-.653-.796l.724-.69q.406.429.747.91zM8 1a7 7 0 1 0 4.95 11.95l.707.707A8.001 8.001 0 1 1 8 0z" />
                  <path d="M7.5 3a.5.5 0 0 1 .5.5v5.21l3.248 1.856a.5.5 0 0 1-.496.868l-3.5-2A.5.5 0 0 1 7 9V3.5a.5.5 0 0 1 .5-.5" />
                </svg>
                Payment History ({payments.length})
              </div>
              <div className="xp-table-panel">
                <table
                  className="xp-table"
                  style={{ fontSize: "var(--xp-fs-xs)" }}
                >
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
                        <td colSpan={3} className="xp-loading">
                          Loading…
                        </td>
                      </tr>
                    )}
                    {!loadingPay && payments.length === 0 && (
                      <tr>
                        <td colSpan={3} className="xp-empty">
                          No payments yet
                        </td>
                      </tr>
                    )}
                    {payments.map((p, i) => (
                      <tr key={p._id || i}>
                        <td className="text-muted">
                          {p.paymentDate || p.createdAt?.split("T")[0]}
                        </td>
                        <td className="r xp-amt success">{fmt(p.amount)}</td>
                        <td className="text-muted">{p.remarks || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {payments.length > 0 && (
                <div
                  style={{
                    textAlign: "right",
                    fontSize: "var(--xp-fs-xs)",
                    fontWeight: 700,
                    padding: "4px 0",
                    color: "var(--xp-green)",
                  }}
                >
                  Total Paid Later: PKR {fmt(totalPaidLater)}
                </div>
              )}
            </div>
          </div>
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
   HISTORY PANEL
───────────────────────────────────────────────────────────── */
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
          `${i + 1}. ${s.invoiceNo} | ${s.invoiceDate}\n Amount: PKR ${Number(s.netTotal || 0).toLocaleString()} | Paid: ${Number(s.paidAmount || 0).toLocaleString()} | *Bal: ${Number(s.balance || 0).toLocaleString()}*`,
      )
      .join("\n");
    const text = `*ASIM ELECTRIC & ELECTRONIC STORE*\n${sep}\nCustomer: *${customer.name}*${customer.phone ? "\nPhone: " + customer.phone : ""}\nStatement Date: ${isoDate()}\n${sep}\n*TRANSACTION HISTORY*\n(Showing last ${Math.min(sales.length, 20)} of ${sales.length} records)\n${invoiceLines}\n${sep}\nTotal Purchases: PKR ${Number(totalSales).toLocaleString()}\nTotal Paid: PKR ${Number(totalPaid).toLocaleString()}\n*Outstanding Due: PKR ${Number(customer.currentBalance || 0).toLocaleString()}*\n${sep}\n_Thank you for your business!_`;
    window.open(
      `https://wa.me/${(customer.phone || "").replace(/\D/g, "")}?text=${encodeURIComponent(text)}`,
      "_blank",
    );
  };

  if (!customer) {
    return (
      <div className="cs-history-panel">
        <div className="cs-history-empty">
          <div className="cs-history-empty-icon">
            <svg
              width="32"
              height="32"
              viewBox="0 0 16 16"
              fill="var(--xp-silver-5)"
            >
              <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0m4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4" />
            </svg>
          </div>
          <div>Select a customer to view history</div>
          <button
            className="xp-btn xp-btn-primary xp-btn-sm"
            onClick={onManageCustomers}
          >
            <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
              <path d="M15 14s1 0 1-1-1-4-5-4-5 3-5 4 1 1 1 1z" />
              <path d="M11 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4" />
            </svg>
            Manage Customers
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
    <div className="cs-history-panel">
      {/* customer header */}
      <div className="cs-hist-customer">
        <div className="cs-hist-name">{customer.name}</div>
        <div className="cs-hist-sub">
          {customer.phone}
          {customer.code && ` | ${customer.code}`}
        </div>
        <div className="cs-hist-actions">
          <button
            className="xp-btn xp-btn-wa xp-btn-sm"
            onClick={sendHistoryWhatsApp}
            disabled={!sales.length}
          >
            <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
              <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326z" />
            </svg>
            WhatsApp
          </button>
          <button className="xp-btn xp-btn-sm" onClick={onManageCustomers}>
            <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
              <path d="M15 14s1 0 1-1-1-4-5-4-5 3-5 4 1 1 1 1z" />
              <path d="M11 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4" />
            </svg>
            Manage
          </button>
        </div>
      </div>

      {/* mini stats */}
      <div className="cs-hist-stats">
        <div className="cs-hstat">
          <div className="cs-hstat-lbl">Total Sales</div>
          <div className="cs-hstat-val">{fmt(totalSales)}</div>
        </div>
        <div className="cs-hstat">
          <div className="cs-hstat-lbl">Total Paid</div>
          <div className="cs-hstat-val success">{fmt(totalPaid)}</div>
        </div>
        <div className="cs-hstat">
          <div className="cs-hstat-lbl">Returns</div>
          <div className="cs-hstat-val warning">{fmt(totalReturn)}</div>
        </div>
        <div className="cs-hstat">
          <div className="cs-hstat-lbl">Current Due</div>
          <div className="cs-hstat-val danger">{fmt(prevBalance)}</div>
        </div>
        {currentSaleTotal > 0 && (
          <div className="cs-hstat" style={{ gridColumn: "1 / -1" }}>
            <div className="cs-hstat-lbl">After This Sale</div>
            <div className="cs-hstat-val danger">
              {fmt(prevBalance + currentSaleTotal)}
            </div>
          </div>
        )}
      </div>

      {/* section title */}
      <div className="cs-hist-section-title">
        <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 1a7 7 0 1 0 4.95 11.95l.707.707A8.001 8.001 0 1 1 8 0z" />
          <path d="M7.5 3a.5.5 0 0 1 .5.5v5.21l3.248 1.856a.5.5 0 0 1-.496.868l-3.5-2A.5.5 0 0 1 7 9V3.5a.5.5 0 0 1 .5-.5" />
        </svg>
        Transaction History ({sales.length})
        <span style={{ fontWeight: 400, color: "#777" }}>
          {" "}
          — Click for details
        </span>
      </div>

      {/* history table */}
      <div className="cs-hist-table-wrap">
        <table className="cs-hist-table">
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Date</th>
              <th className="r">Amount</th>
              <th className="r">Balance</th>
              <th>Type</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="xp-loading">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && sales.length === 0 && (
              <tr>
                <td colSpan={5} className="xp-empty">
                  No history yet
                </td>
              </tr>
            )}
            {sales.map((s) => (
              <tr key={s._id} onClick={() => onSaleClick && onSaleClick(s)}>
                <td className="mono">{s.invoiceNo}</td>
                <td className="text-muted">{s.invoiceDate}</td>
                <td className="r mono">{fmt(s.netTotal)}</td>
                <td className="r">
                  <span
                    className={`xp-amt${(s.balance || 0) > 0 ? " danger" : " muted"}`}
                  >
                    {fmt(s.balance)}
                  </span>
                </td>
                <td>
                  <span
                    className={`xp-badge ${s.saleType === "return" ? "xp-badge-ret" : "xp-badge-sale"}`}
                    style={{ fontSize: 9 }}
                  >
                    {s.saleType === "return" ? "Ret" : "Sale"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────────── */
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
    showMsg(`${c.name} — Due: PKR ${fmt(c.currentBalance || 0)}`);
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
        showMsg(`Customer added: ${data.data.name}`);
      } else showMsg(data.message || "Add failed", "error");
    } catch {
      showMsg("Add failed", "error");
    }
  };

  const handleProductSelect = (product) => {
    const qty = rows[activeRow]?.qty || 1;
    const rate = product._rate || 0;
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
    showMsg("Bill held");
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
        saleSource: "credit",
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
        showMsg(`${data.data.invoiceNo} saved`);
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
      {/* ── Modals ── */}
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
        <span className="xp-tb-title">Credit Sale — {SHOP_NAME}</span>
        <div className="xp-tb-actions">
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

      {/* ── Global alert ── */}
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
        {/* ════ LEFT PANEL ════ */}
        <div className="cs-left">
          {/* header: title + invoice + date */}
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
              Credit Sale
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

          {/* customer strip */}
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
              placeholder="Type phone/name → Enter to search…"
              tabIndex={1}
            />
            <button
              className="xp-btn xp-btn-sm"
              onClick={handlePhoneSearch}
              tabIndex={-1}
            >
              <svg
                width="11"
                height="11"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0" />
              </svg>
              Search
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
                <span className="due">
                  PKR {fmt(customer.currentBalance || 0)}
                </span>
                <button
                  className="xp-btn xp-btn-sm xp-btn-ico"
                  style={{ width: 18, height: 18, fontSize: 9 }}
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
              <div className="cs-no-customer">
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <path d="M7.938 2.016A.13.13 0 0 1 8.002 2a.13.13 0 0 1 .063.016.15.15 0 0 1 .054.057l6.857 11.667c.036.06.035.124.002.183a.2.2 0 0 1-.054.06.1.1 0 0 1-.066.017H1.146a.1.1 0 0 1-.066-.017.2.2 0 0 1-.054-.06.18.18 0 0 1 .002-.183L7.884 2.073a.15.15 0 0 1 .054-.057m1.044-.45a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767z" />
                  <path d="M7.002 12a1 1 0 1 1 2 0 1 1 0 0 1-2 0M7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0z" />
                </svg>
                No customer selected
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

          {/* product search row */}
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
              tabIndex={3}
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
                <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0" />
              </svg>
              F3
            </button>
          </div>

          {/* items table */}
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
                          fontSize: "var(--xp-fs-xs)",
                          textAlign: "center",
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

          {/* bottom: remarks + buttons + totals */}
          <div className="cs-bottom">
            <div className="cs-actions-col">
              <div className="cs-remarks-row">
                <label>Remarks</label>
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
                    <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1z" />
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
                  tabIndex={91}
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

            <div className="cs-totals-box">
              <div className="cs-total-row">
                <label>Sub Total</label>
                <span className="val">{fmt(subTotal)}</span>
              </div>
              <div className="cs-total-row">
                <label>Extra Disc %</label>
                <input
                  type="number"
                  className="cs-disc-input"
                  value={extraDisc}
                  onChange={(e) => setExtraDisc(e.target.value)}
                  tabIndex={89}
                />
              </div>
              <div className="cs-total-row">
                <label>Disc Amt</label>
                <span className="val danger">-{fmt(discAmt)}</span>
              </div>
              <div className="cs-total-row highlight">
                <label>Net Total</label>
                <span className="val">{fmt(netTotal)}</span>
              </div>
              <div className="cs-total-row">
                <label>Prev Balance</label>
                <span className="val danger">{fmt(prevBal)}</span>
              </div>
              <div className="cs-total-row">
                <label>Total Due</label>
                <span className="val danger">{fmt(totalDue)}</span>
              </div>
              <div className="cs-total-row">
                <label>Paid</label>
                <input
                  ref={paidRef}
                  type="number"
                  className="cs-paid-input"
                  value={paid}
                  onChange={(e) => setPaid(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveRef.current?.focus();
                  }}
                  tabIndex={90}
                />
              </div>
              <div className="cs-total-row highlight">
                <label>Balance</label>
                <span className="val danger">{fmt(balance)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ════ RIGHT PANEL ════ */}
        <div className="cs-right">
          <HistoryPanel
            customer={customer}
            currentSaleTotal={netTotal}
            onSaleClick={handleSaleRowClick}
            onManageCustomers={() => navigate("/credit-customers")}
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
          {customer ? customer.name : "No customer"}
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
        {balance > 0 && (
          <div className="xp-status-pane" style={{ color: "var(--xp-red)" }}>
            Balance: PKR {fmt(balance)}
          </div>
        )}
      </div>
    </div>
  );
}
