import { useState, useEffect, useRef, useCallback } from "react";
import api from "../api/api.js";
import EP from "../api/apiEndpoints.js";
import "../styles/theme.css";
import "../styles/ManualPurchasePage.css";
import "../styles/QuotationPage.css";

const isoDate = () => new Date().toISOString().split("T")[0];
const addDays = (d, n) => {
  const dt = new Date(d);
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().split("T")[0];
};
const fmt = (n) => Number(n || 0).toLocaleString("en-PK");
const SHOP_NAME = "Asim Electric and Electronic Store";
const EMPTY_ROW = {
  code: "",
  description: "",
  measurement: "",
  qty: 1,
  rate: 0,
  disc: 0,
  amount: 0,
};

/* ─────────────────────────────────────────────────────────────
   SEARCH MODAL
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
   PRINT / PREVIEW MODAL
───────────────────────────────────────────────────────────── */
function PrintModal({ quote, onClose }) {
  const {
    custName,
    custPhone,
    qtNo,
    qtDate,
    validTill,
    rows,
    extraDisc,
    remarks,
  } = quote;
  const subTotal = rows.reduce((s, r) => s + (r.amount || 0), 0);
  const discAmt = Math.round((subTotal * (extraDisc || 0)) / 100);
  const netTotal = subTotal - discAmt;

  const doPrint = () => {
    const itemRows = rows
      .map(
        (it, i) =>
          `<tr><td>${i + 1}</td><td>${it.description}</td><td>${it.measurement || ""}</td><td align="right">${it.qty}</td><td align="right">${Number(it.rate).toLocaleString()}</td><td align="right">${it.disc || 0}%</td><td align="right"><b>${Number(it.amount).toLocaleString()}</b></td></tr>`,
      )
      .join("");
    const win = window.open("", "_blank", "width=900,height=700");
    win.document
      .write(`<!DOCTYPE html><html><head><title>Quotation ${qtNo}</title>
    <style>body{font-family:Arial,sans-serif;font-size:12px;padding:20px}h2,h3{margin:0 0 4px;text-align:center}table{width:100%;border-collapse:collapse;margin-top:10px}th,td{border:1px solid #ccc;padding:5px}th{background:#e8e8e8}.meta{display:flex;gap:16px;flex-wrap:wrap;margin:8px 0;padding:6px 10px;background:#f5f5f5;border:1px solid #ddd}.tots{float:right;min-width:220px;margin-top:10px}.tr{display:flex;justify-content:space-between;padding:2px 0}.tr.b{font-weight:bold;border-top:1px solid #000;margin-top:4px}.thanks{text-align:center;margin-top:30px;font-size:11px;color:#888;clear:both}</style>
    </head><body>
    <h2>${SHOP_NAME}</h2><h3>PRICE QUOTATION</h3>
    <div class="meta"><span><b>Quotation #:</b> ${qtNo}</span><span><b>Date:</b> ${qtDate}</span>${validTill ? `<span><b>Valid Till:</b> ${validTill}</span>` : ""}${custName ? `<span><b>Customer:</b> ${custName}</span>` : ""}${custPhone ? `<span><b>Phone:</b> ${custPhone}</span>` : ""}</div>
    <table><thead><tr><th>#</th><th>Description</th><th>Meas.</th><th align="right">Qty</th><th align="right">Rate</th><th align="right">Disc%</th><th align="right">Amount</th></tr></thead><tbody>${itemRows}</tbody></table>
    <div class="tots"><div class="tr"><span>Sub Total</span><span>${Number(subTotal).toLocaleString()}</span></div>${discAmt > 0 ? `<div class="tr"><span>Discount (${extraDisc}%)</span><span>-${Number(discAmt).toLocaleString()}</span></div>` : ""}<div class="tr b"><span>Net Total</span><span>Rs. ${Number(netTotal).toLocaleString()}</span></div></div>
    ${remarks ? `<p style="clear:both"><b>Note:</b> ${remarks}</p>` : ""}
    <div class="thanks">Thank you — ${SHOP_NAME}</div></body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 400);
  };

  const doWhatsApp = () => {
    const lines = rows
      .map(
        (it, i) =>
          `${i + 1}. ${it.description}${it.measurement ? " (" + it.measurement + ")" : ""}\n   Qty: ${it.qty} × Rs.${Number(it.rate).toLocaleString()}${it.disc > 0 ? " - " + it.disc + "%" : ""} = *Rs.${Number(it.amount).toLocaleString()}*`,
      )
      .join("\n");
    const msg =
      `*${SHOP_NAME}*\n📋 *QUOTATION #${qtNo}*\n📅 Date: ${qtDate}${validTill ? " | Valid Till: " + validTill : ""}\n` +
      (custName ? `👤 Customer: ${custName}\n` : "") +
      (custPhone ? `📞 Phone: ${custPhone}\n` : "") +
      `${"─".repeat(30)}\n${lines}\n${"─".repeat(30)}\n` +
      (discAmt > 0
        ? `Sub Total: Rs.${Number(subTotal).toLocaleString()}\nDiscount (${extraDisc}%): -Rs.${Number(discAmt).toLocaleString()}\n`
        : "") +
      `*Net Total: Rs.${Number(netTotal).toLocaleString()}*\n` +
      (remarks ? `📝 ${remarks}\n` : "") +
      `_Prices valid${validTill ? " till " + validTill : " as quoted"}_`;
    const phone = custPhone?.replace(/[^0-9]/g, "");
    const url = phone
      ? `https://wa.me/92${phone.replace(/^0/, "")}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
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
            Quotation #{qtNo}
            {custName ? " — " + custName : ""}
          </span>
          <button className="xp-cap-btn xp-cap-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="xp-modal-body">
          <div className="qt-inv-preview">
            <div className="qt-inv-shop">{SHOP_NAME}</div>
            <div className="qt-inv-sub">◆ Price Quotation ◆</div>
            <div className="qt-inv-meta">
              <span>
                Qt #: <strong>{qtNo}</strong>
              </span>
              <span>
                Date: <strong>{qtDate}</strong>
              </span>
              {validTill && (
                <span>
                  Valid Till: <span className="qt-valid-till">{validTill}</span>
                </span>
              )}
              {custName && (
                <span>
                  Customer: <strong>{custName}</strong>
                </span>
              )}
              {custPhone && (
                <span>
                  Phone: <strong>{custPhone}</strong>
                </span>
              )}
            </div>
            <div className="xp-table-panel">
              <table className="xp-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Description</th>
                    <th>Meas.</th>
                    <th className="r">Qty</th>
                    <th className="r">Rate</th>
                    <th className="r">Disc%</th>
                    <th className="r">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((it, i) => (
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
            <div className="qt-inv-totals">
              <div className="qt-inv-total-row">
                <span>Sub Total</span>
                <span className="inv-val">{fmt(subTotal)}</span>
              </div>
              {discAmt > 0 && (
                <div className="qt-inv-total-row danger">
                  <span>Discount ({extraDisc}%)</span>
                  <span className="inv-val">-{fmt(discAmt)}</span>
                </div>
              )}
              <div className="qt-inv-total-row bold">
                <span>Net Total</span>
                <span className="inv-val">Rs. {fmt(netTotal)}</span>
              </div>
            </div>
            {(validTill || remarks) && (
              <div
                style={{
                  marginTop: 12,
                  fontSize: "var(--xp-fs-xs)",
                  color: "#555",
                }}
              >
                {validTill && (
                  <div>
                    ⏳ Valid till: <strong>{validTill}</strong>
                  </div>
                )}
                {remarks && <div>📝 {remarks}</div>}
              </div>
            )}
            <div className="qt-inv-thanks">
              Thank you for your inquiry — {SHOP_NAME}
            </div>
          </div>
        </div>

        <div className="xp-modal-footer">
          <button className="xp-btn xp-btn-sm" onClick={doPrint}>
            <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
              <path d="M2.5 8a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1" />
              <path d="M5 1a2 2 0 0 0-2 2v2H2a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h1v1a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-1h1a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-1V3a2 2 0 0 0-2-2z" />
            </svg>
            Print / PDF
          </button>
          <button className="xp-btn xp-btn-wa xp-btn-sm" onClick={doWhatsApp}>
            <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
              <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326z" />
            </svg>
            WhatsApp{custPhone ? " → " + custPhone : ""}
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
   MAIN PAGE
───────────────────────────────────────────────────────────── */
export default function QuotationPage() {
  const getNextQtNo = () => {
    const n = parseInt(localStorage.getItem("qt_counter") || "0") + 1;
    localStorage.setItem("qt_counter", String(n));
    return `Q-${String(n).padStart(5, "0")}`;
  };

  const [qtNo, setQtNo] = useState(() => {
    const n = parseInt(localStorage.getItem("qt_counter") || "0") + 1;
    return `Q-${String(n).padStart(5, "0")}`;
  });
  const [qtDate, setQtDate] = useState(isoDate());
  const [validTill, setValidTill] = useState(() => addDays(isoDate(), 7));
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [rows, setRows] = useState([{ ...EMPTY_ROW }]);
  const [activeRow, setActiveRow] = useState(0);
  const [extraDisc, setExtraDisc] = useState(0);
  const [remarks, setRemarks] = useState("");
  const [products, setProducts] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [showPrint, setShowPrint] = useState(false);
  const [msg, setMsg] = useState({ text: "", type: "" });
  const [saving, setSaving] = useState(false);

  /* Saved quotations list */
  const [savedQuotes, setSavedQuotes] = useState([]);
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  const [selQuoteId, setSelQuoteId] = useState(null);
  const [qtSearch, setQtSearch] = useState("");

  const custNameRef = useRef(null);
  const custPhRef = useRef(null);
  const searchRef = useRef(null);
  const extraDiscRef = useRef(null);
  const saveRef = useRef(null);
  const rowRefs = useRef([]);

  const subTotal = rows.reduce((s, r) => s + (r.amount || 0), 0);
  const discAmt = Math.round((subTotal * (extraDisc || 0)) / 100);
  const netTotal = subTotal - discAmt;

  useEffect(() => {
    fetchProducts();
    fetchQuotes();
  }, []);

  useEffect(() => {
    const h = (e) => {
      if (e.key === "F3") {
        e.preventDefault();
        setShowSearch(true);
      }
      if (e.key === "F5") {
        e.preventDefault();
        handlePreview();
      }
      if (e.key === "F2") {
        e.preventDefault();
        resetForm();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [rows, custName, custPhone, extraDisc, remarks, qtDate, validTill]);

  const fetchProducts = async () => {
    try {
      const { data } = await api.get(EP.PRODUCTS.GET_ALL);
      if (data.success) setProducts(data.data);
    } catch {}
  };

  /* ── Saved Quotations API ── */
  const fetchQuotes = async (search = "") => {
    setLoadingQuotes(true);
    try {
      const url = search
        ? `/api/quotations?search=${encodeURIComponent(search)}`
        : "/api/quotations";
      const { data } = await api.get(url);
      if (data.success) setSavedQuotes(data.data || []);
    } catch {
      setSavedQuotes([]);
    }
    setLoadingQuotes(false);
  };

  const handleSaveQuote = async () => {
    const validRows = rows.filter((r) => r.description && r.qty > 0);
    if (!validRows.length) {
      showMsg("Add at least one product", "error");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        qtNo,
        qtDate,
        validTill,
        custName,
        custPhone,
        items: validRows,
        subTotal,
        discAmt,
        netTotal,
        extraDisc: Number(extraDisc),
        remarks,
      };
      const { data } = await api.post("/api/quotations", payload);
      if (data.success) {
        showMsg(`Saved: ${data.data.qtNo}`);
        fetchQuotes(qtSearch);
      } else showMsg(data.message || "Save failed", "error");
    } catch (e) {
      showMsg(e.response?.data?.message || "Save failed", "error");
    }
    setSaving(false);
  };

  const handleDeleteQuote = async () => {
    if (!selQuoteId) return showMsg("Select a quotation first", "error");
    if (!confirm("Delete this quotation?")) return;
    try {
      const { data } = await api.delete(`/api/quotations/${selQuoteId}`);
      if (data.success) {
        showMsg("Deleted");
        setSelQuoteId(null);
        fetchQuotes(qtSearch);
      } else showMsg(data.message || "Delete failed", "error");
    } catch {
      showMsg("Delete failed", "error");
    }
  };

  const handleLoadQuote = (q) => {
    setQtNo(q.qtNo);
    setQtDate(q.qtDate);
    setValidTill(q.validTill || "");
    setCustName(q.custName || "");
    setCustPhone(q.custPhone || "");
    setRows(q.items?.length ? q.items : [{ ...EMPTY_ROW }]);
    setExtraDisc(q.extraDisc || 0);
    setRemarks(q.remarks || "");
    setSearchText("");
    setSelQuoteId(q._id);
    showMsg(`Loaded: ${q.qtNo}`);
    window.scrollTo(0, 0);
  };

  const showMsg = (text, type = "success") => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: "", type: "" }), 3000);
  };

  const handleProductSelect = (product) => {
    const qty = rows[activeRow]?.qty || 1;
    const rate = product._rate || 0;
    setRows((prev) => {
      const next = [...prev];
      next[activeRow] = {
        ...next[activeRow],
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

  const onCodeBlur = (i, code) => {
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

  const handlePreview = () => {
    const validRows = rows.filter((r) => r.description && r.qty > 0);
    if (!validRows.length) {
      showMsg("Add at least one product", "error");
      return;
    }
    setShowPrint(true);
  };

  const resetForm = () => {
    const newNo = getNextQtNo();
    setQtNo(newNo);
    setQtDate(isoDate());
    setValidTill(addDays(isoDate(), 7));
    setCustName("");
    setCustPhone("");
    setRows([{ ...EMPTY_ROW }]);
    setActiveRow(0);
    setExtraDisc(0);
    setRemarks("");
    setSearchText("");
    setSelQuoteId(null);
    setTimeout(() => custNameRef.current?.focus(), 30);
  };

  const handleQtSearch = (v) => {
    setQtSearch(v);
    clearTimeout(window._qtSearchTimer);
    window._qtSearchTimer = setTimeout(() => fetchQuotes(v), 300);
  };

  const quoteObj = {
    qtNo,
    qtDate,
    validTill,
    custName,
    custPhone,
    rows: rows.filter((r) => r.description && r.qty > 0),
    extraDisc,
    remarks,
  };

  return (
    <div className="qt-page">
      {showSearch && (
        <SearchModal
          allProducts={products}
          onSelect={handleProductSelect}
          onClose={() => setShowSearch(false)}
        />
      )}
      {showPrint && (
        <PrintModal quote={quoteObj} onClose={() => setShowPrint(false)} />
      )}

      {/* ── Titlebar ── */}
      <div className="xp-titlebar">
        <svg
          width="15"
          height="15"
          viewBox="0 0 16 16"
          fill="rgba(255,255,255,0.85)"
        >
          <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1L14 5.5zM4.5 7a.5.5 0 0 0 0 1h7a.5.5 0 0 0 0-1zm0 2.5a.5.5 0 0 0 0 1h7a.5.5 0 0 0 0-1zm0 2.5a.5.5 0 0 0 0 1h4a.5.5 0 0 0 0-1z" />
        </svg>
        <span className="xp-tb-title">Price Quotation — {SHOP_NAME}</span>
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

      {/* ── Alert ── */}
      {msg.text && (
        <div
          className={`xp-alert ${msg.type === "success" ? "xp-alert-success" : "xp-alert-error"}`}
          style={{ margin: "4px 10px 0" }}
        >
          {msg.text}
        </div>
      )}

      <div className="qt-body">
        {/* ── Header ── */}
        <div className="qt-header">
          <div className="qt-header-title">
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="var(--xp-blue-dark)"
            >
              <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1L14 5.5zM4.5 7a.5.5 0 0 0 0 1h7a.5.5 0 0 0 0-1zm0 2.5a.5.5 0 0 0 0 1h7a.5.5 0 0 0 0-1zm0 2.5a.5.5 0 0 0 0 1h4a.5.5 0 0 0 0-1z" />
            </svg>
            Quotation / Price Estimate
          </div>
          <div className="qt-field-pair">
            <label>Qt #</label>
            <input
              className="xp-input"
              style={{ width: 100 }}
              value={qtNo}
              readOnly
              tabIndex={-1}
            />
          </div>
          <div className="qt-field-pair">
            <label>Date</label>
            <input
              type="date"
              className="xp-input"
              style={{ width: 136 }}
              value={qtDate}
              onChange={(e) => setQtDate(e.target.value)}
              tabIndex={-1}
            />
          </div>
          <div className="qt-field-pair">
            <label>Valid Till</label>
            <input
              type="date"
              className="xp-input"
              style={{ width: 136 }}
              value={validTill}
              onChange={(e) => setValidTill(e.target.value)}
              tabIndex={-1}
            />
          </div>
          {validTill && (
            <div className="qt-valid-badge">
              <svg
                width="10"
                height="10"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <path d="M10.854 7.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7.5 9.793l2.646-2.647a.5.5 0 0 1 .708 0" />
                <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5M2 2a1 1 0 0 0-1 1v1h14V3a1 1 0 0 0-1-1zm13 3H1v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1z" />
              </svg>
              Valid: {validTill}
            </div>
          )}
        </div>

        {/* ── Customer Strip ── */}
        <div className="qt-customer-strip">
          <label>Customer</label>
          <input
            ref={custNameRef}
            className="qt-cust-input"
            value={custName}
            onChange={(e) => setCustName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") custPhRef.current?.focus();
            }}
            placeholder="Name (optional)…"
            tabIndex={1}
          />
          <label>Phone</label>
          <input
            ref={custPhRef}
            className="qt-cust-input"
            style={{ maxWidth: 150 }}
            value={custPhone}
            onChange={(e) => setCustPhone(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") setShowSearch(true);
            }}
            placeholder="03xx-xxxxxxx"
            tabIndex={2}
          />
          <span className="qt-wa-hint">← for WhatsApp direct send</span>

          <div className="xp-toolbar-divider" />
          <div className="qt-key-hints">
            <span>
              <span className="k">F3</span> Search
            </span>
            <span>
              <span className="k">F5</span> Preview
            </span>
            <span>
              <span className="k">F2</span> New
            </span>
            <span>
              <span className="k">Ctrl+Del</span> Remove Row
            </span>
          </div>
        </div>

        {/* ── Product select bar ── */}
        <div className="qt-product-bar">
          <label>Select Product</label>
          <input
            ref={searchRef}
            type="text"
            className="qt-product-input"
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
            <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
              <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1z" />
            </svg>
            F3
          </button>
        </div>

        {/* ── Items Table ── */}
        <div className="qt-items-panel">
          <table className="qt-items-table">
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
                    className={activeRow === i ? "qt-active-row" : ""}
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
                        className="qt-cell w-code"
                        ref={(el) => (rowRefs.current[i].code = el)}
                        value={row.code}
                        onChange={(e) => updateRow(i, "code", e.target.value)}
                        onBlur={(e) => onCodeBlur(i, e.target.value)}
                        onKeyDown={(e) => onRowKeyDown(e, i, "code")}
                        tabIndex={100 + i * 10 + 1}
                      />
                    </td>
                    <td>
                      <input
                        className="qt-cell w-desc"
                        ref={(el) => (rowRefs.current[i].description = el)}
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
                        className="qt-cell w-meas"
                        ref={(el) => (rowRefs.current[i].measurement = el)}
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
                        className="qt-cell w-sm"
                        ref={(el) => (rowRefs.current[i].qty = el)}
                        value={row.qty}
                        onChange={(e) => updateRow(i, "qty", e.target.value)}
                        onKeyDown={(e) => onRowKeyDown(e, i, "qty")}
                        tabIndex={100 + i * 10 + 4}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="qt-cell w-md"
                        ref={(el) => (rowRefs.current[i].rate = el)}
                        value={row.rate}
                        onChange={(e) => updateRow(i, "rate", e.target.value)}
                        onKeyDown={(e) => onRowKeyDown(e, i, "rate")}
                        tabIndex={100 + i * 10 + 5}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="qt-cell w-sm"
                        ref={(el) => (rowRefs.current[i].disc = el)}
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

        {/* ── Bottom ── */}
        <div className="qt-bottom">
          {/* Left: notes + buttons */}
          <div className="qt-actions-col">
            <div className="qt-notes-row">
              <label>Notes</label>
              <input
                className="qt-notes-input"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") extraDiscRef.current?.focus();
                }}
                placeholder="e.g. Prices valid for 7 days, bulk discount available…"
                tabIndex={90}
              />
            </div>
            <div className="qt-btn-row">
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
                  <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398z" />
                </svg>
                F3 Search
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
                className="xp-btn xp-btn-sm"
                onClick={handlePreview}
                tabIndex={91}
              >
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0" />
                  <path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8m8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7" />
                </svg>
                F5 Preview
              </button>
              <button
                className="xp-btn xp-btn-wa xp-btn-sm"
                onClick={() => {
                  if (!rows.some((r) => r.description && r.qty > 0)) {
                    showMsg("Add at least one product", "error");
                    return;
                  }
                  setShowPrint(true);
                }}
                tabIndex={92}
              >
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326z" />
                </svg>
                WhatsApp
              </button>
              {/* SAVE to DB */}
              <button
                ref={saveRef}
                className="xp-btn xp-btn-primary xp-btn-sm"
                onClick={handleSaveQuote}
                disabled={saving}
                tabIndex={93}
              >
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <path d="M2 1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H9.5a1 1 0 0 0-1 1v7.293l2.646-2.647a.5.5 0 0 1 .708.708l-3.5 3.5a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L7.5 9.293V2a2 2 0 0 1 2-2H14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2z" />
                </svg>
                {saving ? "Saving…" : "Save Quotation"}
              </button>
            </div>
          </div>

          {/* Right: totals */}
          <div className="qt-totals-box">
            <div className="qt-total-row">
              <label>Sub Total</label>
              <span className="qt-val">{fmt(subTotal)}</span>
            </div>
            <div className="qt-total-row">
              <label>Extra Disc%</label>
              <input
                ref={extraDiscRef}
                type="number"
                className="qt-disc-input"
                value={extraDisc}
                onChange={(e) => setExtraDisc(e.target.value)}
                tabIndex={89}
              />
            </div>
            {discAmt > 0 && (
              <div className="qt-total-row">
                <label>Disc Amt</label>
                <span className="qt-val danger">-{fmt(discAmt)}</span>
              </div>
            )}
            <div className="qt-total-row highlight">
              <label>Net Total</label>
              <span className="qt-val">PKR {fmt(netTotal)}</span>
            </div>
            <div className="qt-total-row">
              <label>Items</label>
              <span className="qt-val">
                {rows.filter((r) => r.description).length}
              </span>
            </div>
          </div>
        </div>

        {/* ── Saved Quotations ── */}
        <div className="qt-saved-section">
          <div className="qt-saved-header">
            <span className="qt-saved-title">
              <svg
                width="11"
                height="11"
                viewBox="0 0 16 16"
                fill="currentColor"
                style={{ marginRight: 4 }}
              >
                <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1L14 5.5zM4.5 7a.5.5 0 0 0 0 1h7a.5.5 0 0 0 0-1zm0 2.5a.5.5 0 0 0 0 1h7a.5.5 0 0 0 0-1zm0 2.5a.5.5 0 0 0 0 1h4a.5.5 0 0 0 0-1z" />
              </svg>
              Saved Quotations
            </span>
            <div className="xp-search-wrap" style={{ flex: 1, maxWidth: 300 }}>
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
                className="xp-input"
                value={qtSearch}
                onChange={(e) => handleQtSearch(e.target.value)}
                placeholder="Search Qt# / customer…"
              />
            </div>
            <span style={{ fontSize: "var(--xp-fs-xs)", color: "#666" }}>
              {savedQuotes.length} record(s)
            </span>
            <button
              className="xp-btn xp-btn-sm"
              onClick={() => fetchQuotes(qtSearch)}
              disabled={loadingQuotes}
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
              Refresh
            </button>
            <button
              className="xp-btn xp-btn-sm"
              onClick={() => {
                if (!selQuoteId)
                  return showMsg("Select a quotation first", "error");
                const q = savedQuotes.find((x) => x._id === selQuoteId);
                if (q) handleLoadQuote(q);
              }}
            >
              <svg
                width="11"
                height="11"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168z" />
              </svg>
              Load
            </button>
            <button
              className="xp-btn xp-btn-danger xp-btn-sm"
              onClick={handleDeleteQuote}
              disabled={!selQuoteId}
            >
              <svg
                width="11"
                height="11"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5" />
                <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1z" />
              </svg>
              Delete
            </button>
          </div>

          <div className="qt-saved-table-wrap">
            <table className="qt-saved-table">
              <thead>
                <tr>
                  <th style={{ width: 32 }}>#</th>
                  <th style={{ width: 90 }}>Qt #</th>
                  <th style={{ width: 90 }}>Date</th>
                  <th style={{ width: 90 }}>Valid Till</th>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th className="r" style={{ width: 80 }}>
                    Items
                  </th>
                  <th className="r" style={{ width: 110 }}>
                    Net Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {loadingQuotes && (
                  <tr>
                    <td colSpan={8} className="xp-loading">
                      Loading…
                    </td>
                  </tr>
                )}
                {!loadingQuotes && savedQuotes.length === 0 && (
                  <tr>
                    <td colSpan={8} className="xp-empty">
                      No saved quotations
                    </td>
                  </tr>
                )}
                {!loadingQuotes &&
                  savedQuotes.map((q, i) => (
                    <tr
                      key={q._id}
                      className={selQuoteId === q._id ? "qt-sel-row" : ""}
                      onClick={() => setSelQuoteId(q._id)}
                      onDoubleClick={() => handleLoadQuote(q)}
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
                        <span className="xp-code">{q.qtNo}</span>
                      </td>
                      <td className="text-muted">{q.qtDate}</td>
                      <td>
                        {q.validTill ? (
                          <span
                            className="xp-badge"
                            style={{
                              background: "#fef3c7",
                              color: "#78350f",
                              border: "1px solid #fcd34d",
                              fontSize: 10,
                            }}
                          >
                            {q.validTill}
                          </span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td>
                        {q.custName || (
                          <span className="text-muted">Counter</span>
                        )}
                      </td>
                      <td className="text-muted">{q.custPhone || "—"}</td>
                      <td className="r">{q.items?.length || 0}</td>
                      <td className="r xp-amt">{fmt(q.netTotal)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Status Bar ── */}
      <div className="xp-statusbar">
        <div className="xp-status-pane">
          <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
            <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1L14 5.5z" />
          </svg>{" "}
          {qtNo}
        </div>
        <div className="xp-status-pane">{custName || "No customer"}</div>
        <div className="xp-status-pane">
          Items: {rows.filter((r) => r.description).length}
        </div>
        <div className="xp-status-pane">
          Net:{" "}
          <strong style={{ fontFamily: "var(--xp-mono)", marginLeft: 3 }}>
            PKR {fmt(netTotal)}
          </strong>
        </div>
        <div className="xp-status-pane">{savedQuotes.length} saved</div>
      </div>
    </div>
  );
}
