// pages/DebitSalePage.jsx
// Debit (Cash/Bank) Sale — with CustomerSearchModal (type=walkin, separate from credit)
import { useState, useEffect, useRef, useCallback } from "react";
import "../styles/DebitSalePage.css";
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
// CUSTOMER SEARCH MODAL — type=walkin (debit/cash customers only)
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
      // type=walkin keeps debit customers separate from credit customers
      const { data } = await api.get(
        `${EP.CUSTOMERS.GET_ALL}?search=${encodeURIComponent(q.trim())}&type=walkin`,
      );
      if (data.success) {
        setResults(data.data || []);
        setHiIdx(0);
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
    if (tbodyRef.current && hiIdx >= 0)
      tbodyRef.current.children[hiIdx]?.scrollIntoView({ block: "nearest" });
  }, [hiIdx]);

  return (
    <div
      className="ds-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="csm-window">
        <div className="csm-titlebar">
          <span>👤 Search Customer (Walk-in / Cash)</span>
          <button className="ds-close-x" onClick={onClose} tabIndex={-1}>
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
            placeholder="Name / phone / code… (optional for walk-in)"
            autoComplete="off"
          />
          {loading && <span className="csm-loading">…</span>}
          <span className="csm-count">{results.length} found</span>
          <button
            className="ds-btn ds-btn-primary"
            onClick={() => onAddNew(query)}
            tabIndex={-1}
          >
            ➕ Add New
          </button>
          <button className="ds-btn" onClick={onClose} tabIndex={-1}>
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
                <th style={{ width: 70 }}>Type</th>
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
                  <td colSpan={4} className="ds-empty">
                    No customer found — press ➕ Add New to create, or skip for
                    walk-in sale
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
                  <td className="c">
                    <span className="ds-badge walkin">Walk-in</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="csm-footer">
          ↑↓ navigate | Enter / Double-click = select | Esc = close (counter
          sale) | ➕ Add New = create
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SEARCH MODAL — 3 filters: Description | Category | Company
// ═══════════════════════════════════════════════════════════════════════════
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
    const ld = d.trim().toLowerCase();
    const lc = c.trim().toLowerCase();
    const lo = co.trim().toLowerCase();
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
    if (tbodyRef.current && hiIdx >= 0)
      tbodyRef.current.children[hiIdx]?.scrollIntoView({ block: "nearest" });
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
            <button className="ds-btn" onClick={onClose}>
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

// ─── Invoice Modal ────────────────────────────────────────────────────────────
function InvoiceModal({ sale, shopName, onClose }) {
  const printInvoice = (size) => {
    const win = window.open("", "_blank", "width=900,height=700");
    win.document.write(
      size === "thermal"
        ? buildThermal(sale, shopName)
        : buildA4(sale, shopName),
    );
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
  };
  const shareWhatsApp = () => {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(buildWhatsAppText(sale, shopName))}`,
      "_blank",
    );
  };
  return (
    <div
      className="ds-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="ds-inv-modal">
        <div className="ds-modal-title">
          🧾 Invoice #{sale.invoiceNo}
          <button className="ds-close-x" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="ds-inv-preview">
          <div className="ds-inv-shop">{shopName}</div>
          <div className="ds-inv-meta">
            <span>
              Invoice: <b>{sale.invoiceNo}</b>
            </span>
            <span>
              Date: <b>{sale.invoiceDate}</b>
            </span>
            <span>
              Payment: <b>{sale.paymentMode}</b>
            </span>
          </div>
          {sale.customerName && sale.customerName !== "COUNTER SALE" && (
            <div className="ds-inv-cust">
              Customer: <b>{sale.customerName}</b>
              {sale.customerPhone && ` | 📞 ${sale.customerPhone}`}
            </div>
          )}
          <table className="ds-inv-table">
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
          <div className="ds-inv-totals">
            <div className="ds-inv-row">
              <span>Sub Total</span>
              <span>{fmt(sale.subTotal)}</span>
            </div>
            {sale.discAmount > 0 && (
              <div className="ds-inv-row">
                <span>Discount</span>
                <span>-{fmt(sale.discAmount)}</span>
              </div>
            )}
            <div className="ds-inv-row bold">
              <span>Net Total</span>
              <span>{fmt(sale.netTotal)}</span>
            </div>
            <div className="ds-inv-row">
              <span>Paid</span>
              <span>{fmt(sale.paidAmount)}</span>
            </div>
            {sale.balance > 0 && (
              <div className="ds-inv-row red">
                <span>Balance</span>
                <span>{fmt(sale.balance)}</span>
              </div>
            )}
          </div>
          <div className="ds-inv-thanks">Thank you for your business!</div>
        </div>
        <div className="ds-inv-actions">
          <button className="ds-btn" onClick={() => printInvoice("thermal")}>
            🖨 Thermal
          </button>
          <button className="ds-btn" onClick={() => printInvoice("a4")}>
            📄 A4 Print
          </button>
          <button className="ds-btn ds-btn-whatsapp" onClick={shareWhatsApp}>
            📱 WhatsApp
          </button>
          <button className="ds-btn" onClick={onClose}>
            ✕ Close
          </button>
        </div>
      </div>
    </div>
  );
}

function buildA4(sale, shopName) {
  const rows = sale.items
    .map(
      (it, i) =>
        `<tr><td>${i + 1}</td><td>${it.description}</td><td>${it.measurement || ""}</td><td align="right">${it.qty}</td><td align="right">${Number(it.rate).toLocaleString()}</td><td align="right">${it.disc || 0}%</td><td align="right"><b>${Number(it.amount).toLocaleString()}</b></td></tr>`,
    )
    .join("");
  return `<!DOCTYPE html><html><head><title>Invoice ${sale.invoiceNo}</title><style>body{font-family:Arial,sans-serif;font-size:12px;margin:20px}h2{text-align:center;font-size:20px;margin:0}.meta{display:flex;justify-content:space-between;border:1px solid #ccc;padding:6px 10px;margin:8px 0}table{width:100%;border-collapse:collapse;margin-top:10px}th{background:#e0e0e0;border:1px solid #ccc;padding:4px 6px;text-align:left}td{border:1px solid #ddd;padding:3px 6px}.tots{float:right;min-width:220px;margin-top:10px}.tr{display:flex;justify-content:space-between;padding:2px 0}.tr.bold{font-weight:bold;font-size:14px;border-top:1px solid #000;margin-top:4px}.tr.red{color:red}.thanks{text-align:center;margin-top:30px;font-size:11px;color:#888}@media print{body{margin:5mm}}</style></head><body><h2>${shopName}</h2><div style="text-align:center;font-size:11px;color:#555;margin-bottom:10px">SALE INVOICE</div><div class="meta"><span><b>Invoice #:</b> ${sale.invoiceNo}</span><span><b>Date:</b> ${sale.invoiceDate}</span><span><b>Payment:</b> ${sale.paymentMode}</span>${sale.customerName && sale.customerName !== "COUNTER SALE" ? `<span><b>Customer:</b> ${sale.customerName}</span>` : ""}</div><table><thead><tr><th>#</th><th>Description</th><th>Meas.</th><th align="right">Qty</th><th align="right">Rate</th><th align="right">Disc%</th><th align="right">Amount</th></tr></thead><tbody>${rows}</tbody></table><div class="tots"><div class="tr"><span>Sub Total</span><span>${Number(sale.subTotal).toLocaleString()}</span></div>${sale.discAmount > 0 ? `<div class="tr"><span>Discount</span><span>-${Number(sale.discAmount).toLocaleString()}</span></div>` : ""}<div class="tr bold"><span>Net Total</span><span>${Number(sale.netTotal).toLocaleString()}</span></div><div class="tr"><span>Paid</span><span>${Number(sale.paidAmount).toLocaleString()}</span></div>${sale.balance > 0 ? `<div class="tr red"><span>Balance</span><span>${Number(sale.balance).toLocaleString()}</span></div>` : ""}</div><br style="clear:both"><div class="thanks">Thank you!</div></body></html>`;
}

function buildThermal(sale, shopName) {
  const rows = sale.items
    .map(
      (it, i) =>
        `<tr><td>${i + 1}. ${it.description}</td><td align="right">${it.qty}x${Number(it.rate).toLocaleString()}</td><td align="right"><b>${Number(it.amount).toLocaleString()}</b></td></tr>`,
    )
    .join("");
  return `<!DOCTYPE html><html><head><title>Receipt</title><style>body{font-family:'Courier New',monospace;font-size:11px;width:72mm;margin:0 auto}h3{text-align:center;font-size:14px;margin:4px 0}.c{text-align:center;font-size:10px}hr{border:none;border-top:1px dashed #000;margin:4px 0}table{width:100%;font-size:10px}td{vertical-align:top;padding:1px 0}.t{display:flex;justify-content:space-between;font-size:11px}.t.b{font-weight:bold;font-size:13px;border-top:1px dashed #000;margin-top:2px}.t.red{color:red}@media print{@page{size:80mm auto;margin:3mm}}</style></head><body><h3>${shopName}</h3><div class="c">SALE RECEIPT</div><hr><div class="c">Invoice: ${sale.invoiceNo} | ${sale.invoiceDate}</div>${sale.customerName !== "COUNTER SALE" ? `<div class="c">${sale.customerName}</div>` : ""}<hr><table><tbody>${rows}</tbody></table><hr><div class="t"><span>Sub Total</span><span>${Number(sale.subTotal).toLocaleString()}</span></div>${sale.discAmount > 0 ? `<div class="t"><span>Discount</span><span>-${Number(sale.discAmount).toLocaleString()}</span></div>` : ""}<div class="t b"><span>TOTAL</span><span>${Number(sale.netTotal).toLocaleString()}</span></div><div class="t"><span>Paid</span><span>${Number(sale.paidAmount).toLocaleString()}</span></div>${sale.balance > 0 ? `<div class="t red"><span>Balance</span><span>${Number(sale.balance).toLocaleString()}</span></div>` : ""}<div style="text-align:center;margin-top:8px;font-size:10px">Thank you!</div></body></html>`;
}

function buildWhatsAppText(sale, shopName) {
  const lines = sale.items
    .map(
      (it, i) =>
        `${i + 1}. ${it.description} | ${it.qty}x${Number(it.rate).toLocaleString()} = *${Number(it.amount).toLocaleString()}*`,
    )
    .join("\n");
  return `*${shopName}*\n🧾 *Invoice #${sale.invoiceNo}*\n📅 ${sale.invoiceDate}\n💳 ${sale.paymentMode}\n${"─".repeat(30)}\n${lines}\n${"─".repeat(30)}\nSub Total: ${Number(sale.subTotal).toLocaleString()}\n*Net Total: ${Number(sale.netTotal).toLocaleString()}*\nPaid: ${Number(sale.paidAmount).toLocaleString()}\n${sale.balance > 0 ? `⚠️ Balance: ${Number(sale.balance).toLocaleString()}` : "✅ Paid in Full"}\n${"─".repeat(30)}\n_Thank you!_`;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════
export default function DebitSalePage() {
  const SHOP_NAME = "Asim Electric and Electronic Store";

  const [invoiceNo, setInvoiceNo] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(isoDate());
  const [phone, setPhone] = useState("");
  const [customer, setCustomer] = useState(null);
  const [rows, setRows] = useState([{ ...EMPTY_ROW }]);
  const [activeRow, setActiveRow] = useState(0);
  const [extraDisc, setExtraDisc] = useState(0);
  const [paid, setPaid] = useState(0);
  const [payMode, setPayMode] = useState("Cash");
  const [remarks, setRemarks] = useState("");
  const [products, setProducts] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [savedSale, setSavedSale] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ text: "", type: "" });
  const [holds, setHolds] = useState([]);
  const [searchText, setSearchText] = useState("");

  // ── Customer Search Modal state ───────────────────────────────────────────
  const [showCustSearch, setShowCustSearch] = useState(false);

  const phoneRef = useRef(null);
  const searchRef = useRef(null);
  const paidRef = useRef(null);
  const saveRef = useRef(null);
  const rowRefs = useRef([]);

  // Totals
  const subTotal = rows.reduce((s, r) => s + (r.amount || 0), 0);
  const discAmt = Math.round((subTotal * (extraDisc || 0)) / 100);
  const netTotal = subTotal - discAmt;
  const balance = netTotal - (Number(paid) || 0);

  useEffect(() => {
    fetchInvoiceNo();
    fetchProducts();
  }, []);

  useEffect(() => {
    const handler = (e) => {
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
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
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

  // ── Customer search — open modal ──────────────────────────────────────────
  const handlePhoneSearch = () => {
    setShowCustSearch(true);
  };

  // Customer selected from modal
  const handleCustomerSelect = (c) => {
    setCustomer({
      _id: c._id,
      name: c.name,
      phone: c.phone,
      currentBalance: c.currentBalance || 0,
    });
    setPhone(c.phone || "");
    setShowCustSearch(false);
    showMsg(`✅ Customer: ${c.name}`);
  };

  // Add new walkin customer from modal
  const handleAddNewCustomer = async (nameOrPhone) => {
    const trimmed = nameOrPhone.trim();
    const isPhone = /^[0-9+\-\s]{7,}$/.test(trimmed);
    try {
      const payload = isPhone
        ? { name: "Walk-in Customer", phone: trimmed, type: "walkin" }
        : {
            name: trimmed || "Walk-in Customer",
            phone: phone.trim(),
            type: "walkin",
          };
      const { data } = await api.post(EP.CUSTOMERS.CREATE, payload);
      if (data.success) {
        const c = data.data;
        setCustomer({
          _id: c._id,
          name: c.name,
          phone: c.phone,
          currentBalance: 0,
        });
        setPhone(c.phone || phone.trim());
        setShowCustSearch(false);
        showMsg(`✅ Customer added: ${c.name}`);
      } else {
        showMsg(data.message || "Add failed", "error");
      }
    } catch {
      showMsg("Add failed", "error");
    }
  };

  // ── Product selected from SearchModal ────────────────────────────────────
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

  // ── Row management ────────────────────────────────────────────────────────
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
    setRows((prev) => {
      const n = [...prev];
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
    setRows((prev) => prev.filter((_, idx) => idx !== i));
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

  // ── Hold Bill ─────────────────────────────────────────────────────────────
  const holdBill = () => {
    if (!rows.some((r) => r.description)) {
      showMsg("Nothing to hold", "error");
      return;
    }
    setHolds((p) => [
      ...p,
      {
        id: Date.now(),
        rows,
        customer,
        phone,
        extraDisc,
        paid,
        payMode,
        remarks,
      },
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
    setPayMode(h.payMode);
    setRemarks(h.remarks);
    setHolds((p) => p.filter((x) => x.id !== id));
  };

  // ── Reset ─────────────────────────────────────────────────────────────────
  const resetForm = () => {
    setRows([{ ...EMPTY_ROW }]);
    setCustomer(null);
    setPhone("");
    setExtraDisc(0);
    setPaid(0);
    setPayMode("Cash");
    setRemarks("");
    setSearchText("");
    fetchInvoiceNo();
    setTimeout(() => phoneRef.current?.focus(), 30);
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
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
        paymentMode: payMode,
        customerId: customer?._id || undefined,
        customerName: customer?.name || "COUNTER SALE",
        customerPhone: customer?.phone || phone || "",
        items: validRows,
        subTotal,
        extraDisc: Number(extraDisc),
        discAmount: discAmt,
        netTotal,
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
          paidAmount: Number(paid),
          balance,
        });
        setShowInvoice(true);
        showMsg(`✅ Sale saved — ${data.data.invoiceNo}`);
        resetForm();
      } else showMsg(data.message, "error");
    } catch (e) {
      showMsg(e.response?.data?.message || "Save failed", "error");
    }
    setSaving(false);
  };

  return (
    <div className="ds-page">
      {showSearch && (
        <SearchModal
          allProducts={products}
          onSelect={handleProductSelect}
          onClose={() => setShowSearch(false)}
        />
      )}

      {/* ══ Customer Search Modal (walkin type) ══ */}
      {showCustSearch && (
        <CustomerSearchModal
          searchTerm={phone}
          onSelect={handleCustomerSelect}
          onAddNew={handleAddNewCustomer}
          onClose={() => setShowCustSearch(false)}
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

      {/* Shortcuts bar */}
      <div className="ds-shortcuts">
        F2=New | F3=Search | F5=Save | F8=Hold | Ctrl+Del=Remove row |
        Enter=Next field
      </div>
      {msg.text && <div className={`ds-msg ${msg.type}`}>{msg.text}</div>}

      {/* ── Header ── */}
      <div className="ds-header-bar">
        <div className="ds-header-title">💵 Debit Sale</div>
        <div className="ds-header-fields">
          <div className="ds-hf">
            <span>Invoice #</span>
            <input
              className="ds-hinput bold"
              value={invoiceNo}
              readOnly
              tabIndex={-1}
            />
          </div>
          <div className="ds-hf">
            <span>Date</span>
            <input
              type="date"
              className="ds-hinput"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              tabIndex={-1}
            />
          </div>
          <div className="ds-hf">
            <span>Payment</span>
            <select
              className="ds-hselect"
              value={payMode}
              onChange={(e) => setPayMode(e.target.value)}
              tabIndex={-1}
            >
              <option>Cash</option>
              <option>Bank</option>
              <option>Cheque</option>
              <option>Card</option>
              <option>JazzCash</option>
              <option>EasyPaisa</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Customer row ── */}
      <div className="ds-cust-bar">
        <span className="ds-cust-label">📞 Phone</span>
        <input
          ref={phoneRef}
          className="ds-cust-phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handlePhoneSearch();
          }}
          placeholder="Type name/phone → Enter (optional for walk-in)"
          tabIndex={1}
        />
        <button className="ds-btn" onClick={handlePhoneSearch} tabIndex={-1}>
          🔍 Search
        </button>
        {customer ? (
          <div className="ds-cust-info">
            <span className="ds-cust-name">👤 {customer.name}</span>
            {customer.phone && (
              <span className="ds-cust-phone-tag">{customer.phone}</span>
            )}
            <button
              className="ds-cust-clear"
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
          <span className="ds-cust-none">Walk-in / Counter Sale</span>
        )}
        {holds.length > 0 && (
          <div className="ds-holds">
            {holds.map((h) => (
              <button
                key={h.id}
                className="ds-hold-btn"
                onClick={() => resumeHold(h.id)}
                tabIndex={-1}
              >
                📋 {h.customer?.name || "Hold"} (
                {h.rows.filter((r) => r.description).length} items)
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Product Search Bar ── */}
      <div className="ds-search-bar">
        <span className="ds-search-label">Select Product</span>
        <input
          ref={searchRef}
          type="text"
          className={`ds-search-input${searchText ? " filled" : ""}`}
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
            className="ds-btn"
            onClick={() => setSearchText("")}
            tabIndex={-1}
          >
            ✕ Clear
          </button>
        )}
      </div>

      {/* ── Items table ── */}
      <div className="ds-table-wrap">
        <table className="ds-table">
          <thead>
            <tr>
              <th style={{ width: 32 }}>#</th>
              <th style={{ width: 80 }}>Code</th>
              <th>Description</th>
              <th style={{ width: 80 }}>Meas.</th>
              <th style={{ width: 65 }}>Qty</th>
              <th style={{ width: 85 }}>Rate</th>
              <th style={{ width: 60 }}>Disc%</th>
              <th style={{ width: 90 }}>Amount</th>
              <th style={{ width: 28 }}></th>
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
                      ? "ds-row-active"
                      : i % 2 === 0
                        ? "ds-row-even"
                        : "ds-row-odd"
                  }
                  onClick={() => setActiveRow(i)}
                >
                  <td className="c">{i + 1}</td>
                  <td>
                    <input
                      className="ds-cell-input"
                      ref={(el) => {
                        if (rowRefs.current[i]) rowRefs.current[i].code = el;
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
                      className="ds-cell-input full"
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
                      className="ds-cell-input"
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
                      className="ds-cell-input r"
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
                      className="ds-cell-input r"
                      ref={(el) => {
                        if (rowRefs.current[i]) rowRefs.current[i].rate = el;
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
                      className="ds-cell-input r"
                      ref={(el) => {
                        if (rowRefs.current[i]) rowRefs.current[i].disc = el;
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
                      className="ds-del-row"
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

      {/* ── Footer totals + actions ── */}
      <div className="ds-footer">
        <div className="ds-footer-left">
          <div className="ds-remarks">
            <span>Remarks</span>
            <input
              className="ds-remarks-input"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") paidRef.current?.focus();
              }}
              tabIndex={90}
            />
          </div>
          <div className="ds-footer-actions">
            <button
              className="ds-btn"
              onClick={() => setShowSearch(true)}
              tabIndex={-1}
            >
              🔍 F3 Search
            </button>
            <button className="ds-btn" onClick={holdBill} tabIndex={-1}>
              📋 F8 Hold
            </button>
            <button className="ds-btn" onClick={resetForm} tabIndex={-1}>
              🔄 F2 New
            </button>
            <button
              ref={saveRef}
              className="ds-btn ds-btn-primary"
              onClick={handleSave}
              disabled={saving}
              tabIndex={91}
            >
              {saving ? "Saving…" : "💾 F5 Save"}
            </button>
          </div>
        </div>
        <div className="ds-totals">
          <div className="ds-tot-row">
            <span>Sub Total</span>
            <span>{fmt(subTotal)}</span>
          </div>
          <div className="ds-tot-row">
            <span>Extra Disc%</span>
            <input
              type="number"
              className="ds-tot-input"
              value={extraDisc}
              onChange={(e) => setExtraDisc(e.target.value)}
              tabIndex={89}
            />
          </div>
          <div className="ds-tot-row">
            <span>Disc Amount</span>
            <span className="red">-{fmt(discAmt)}</span>
          </div>
          <div className="ds-tot-row bold big">
            <span>Net Total</span>
            <span>{fmt(netTotal)}</span>
          </div>
          <div className="ds-tot-row">
            <span>Paid ({payMode})</span>
            <input
              ref={paidRef}
              type="number"
              className="ds-tot-input green"
              value={paid}
              onChange={(e) => setPaid(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveRef.current?.focus();
              }}
              tabIndex={90}
            />
          </div>
          <div className={`ds-tot-row bold ${balance > 0 ? "red" : "green"}`}>
            <span>Balance</span>
            <span>{fmt(balance)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
