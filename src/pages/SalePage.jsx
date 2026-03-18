import { useState, useEffect, useRef, useCallback } from "react";
import api from "../api/api.js";
import EP from "../api/apiEndpoints.js";
import "../styles/theme.css";
import "../styles/SalePage.css";

const timeNow = () => new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
const isoDate = () => new Date().toISOString().split("T")[0];

const EMPTY_ROW = { productId: "", code: "", name: "", uom: "", rack: "", pcs: 1, rate: 0, amount: 0 };

/* ─────────────────────────────────────────────────────────────
   SEARCH MODAL
───────────────────────────────────────────────────────────── */
function SearchModal({ allProducts, onSelect, onClose }) {
  const [desc, setDesc]       = useState("");
  const [cat, setCat]         = useState("");
  const [company, setCompany] = useState("");
  const [rows, setRows]       = useState([]);
  const [hiIdx, setHiIdx]     = useState(0);
  const rDesc = useRef(null); const rCat = useRef(null); const rCompany = useRef(null);
  const tbodyRef = useRef(null);

  const buildFlat = useCallback((products, d, c, co) => {
    const res = [];
    const ld = d.trim().toLowerCase(), lc = c.trim().toLowerCase(), lo = co.trim().toLowerCase();
    products.forEach((p) => {
      const ok = (!ld || p.description?.toLowerCase().includes(ld) || p.code?.toLowerCase().includes(ld)) &&
        (!lc || p.category?.toLowerCase().includes(lc)) && (!lo || p.company?.toLowerCase().includes(lo));
      if (!ok) return;
      const _name = [p.category, p.description, p.company].filter(Boolean).join(" ");
      if (p.packingInfo?.length > 0)
        p.packingInfo.forEach((pk, i) => res.push({ ...p, _pi: i, _meas: pk.measurement, _rate: pk.saleRate, _pack: pk.packing, _stock: pk.openingQty || 0, _name }));
      else res.push({ ...p, _pi: 0, _meas: "", _rate: 0, _pack: 1, _stock: 0, _name });
    });
    return res;
  }, []);

  useEffect(() => { rDesc.current?.focus(); setRows(buildFlat(allProducts, "", "", "")); }, [allProducts, buildFlat]);
  useEffect(() => { const f = buildFlat(allProducts, desc, cat, company); setRows(f); setHiIdx(f.length > 0 ? 0 : -1); }, [desc, cat, company, allProducts, buildFlat]);
  useEffect(() => { if (tbodyRef.current && hiIdx >= 0) tbodyRef.current.children[hiIdx]?.scrollIntoView({ block: "nearest" }); }, [hiIdx]);

  const fk = (e, nr) => {
    if (e.key === "Escape") { onClose(); return; }
    if (e.key === "Enter" || e.key === "ArrowDown") { e.preventDefault(); nr ? nr.current?.focus() : (tbodyRef.current?.focus(), setHiIdx((h) => Math.max(0, h))); }
  };
  const tk = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setHiIdx((i) => Math.min(i + 1, rows.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setHiIdx((i) => Math.max(i - 1, 0)); }
    if (e.key === "Enter")     { e.preventDefault(); if (hiIdx >= 0 && rows[hiIdx]) onSelect(rows[hiIdx]); }
    if (e.key === "Escape")    onClose();
    if (e.key === "Tab")       { e.preventDefault(); rDesc.current?.focus(); }
  };

  return (
    <div className="xp-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="xp-modal xp-modal-lg">
        <div className="xp-modal-tb">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="rgba(255,255,255,0.8)"><path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0"/></svg>
          <span className="xp-modal-title">Search Products</span>
          <button className="xp-cap-btn xp-cap-close" onClick={onClose}>✕</button>
        </div>
        <div className="cs-modal-filters">
          <div className="cs-modal-filter-grp"><label className="xp-label">Description / Code</label><input ref={rDesc} type="text" className="xp-input" value={desc} onChange={(e) => setDesc(e.target.value)} onKeyDown={(e) => fk(e, rCat)} placeholder="Name / code…" autoComplete="off" /></div>
          <div className="cs-modal-filter-grp"><label className="xp-label">Category</label><input ref={rCat} type="text" className="xp-input" value={cat} onChange={(e) => setCat(e.target.value)} onKeyDown={(e) => fk(e, rCompany)} placeholder="e.g. SMALL" autoComplete="off" /></div>
          <div className="cs-modal-filter-grp"><label className="xp-label">Company</label><input ref={rCompany} type="text" className="xp-input" value={company} onChange={(e) => setCompany(e.target.value)} onKeyDown={(e) => fk(e, null)} placeholder="e.g. LUX" autoComplete="off" /></div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 6 }}>
            <span style={{ fontSize: "var(--xp-fs-xs)", color: "#555" }}>{rows.length} result(s)</span>
            <button className="xp-btn xp-btn-sm" onClick={onClose}>Close</button>
          </div>
        </div>
        <div className="xp-modal-body" style={{ padding: 0 }}>
          <div className="xp-table-panel" style={{ border: "none" }}>
            <div className="xp-table-scroll">
              <table className="xp-table">
                <thead><tr><th style={{ width: 36 }}>Sr.#</th><th>Barcode</th><th>Name</th><th>Meas.</th><th className="r">Rate</th><th className="r">Stock</th><th className="r">Pack</th></tr></thead>
                <tbody ref={tbodyRef} tabIndex={0} onKeyDown={tk}>
                  {rows.length === 0 && <tr><td colSpan={7} className="xp-empty">No products found</td></tr>}
                  {rows.map((r, i) => (
                    <tr key={`${r._id}-${r._pi}`} style={{ background: i === hiIdx ? "#c3d9f5" : undefined }}
                      onClick={() => setHiIdx(i)} onDoubleClick={() => onSelect(r)}>
                      <td className="text-muted">{i + 1}</td>
                      <td><span className="xp-code">{r.code}</span></td>
                      <td><button className="xp-link-btn">{r._name}</button></td>
                      <td className="text-muted">{r._meas}</td>
                      <td className="r xp-amt">{Number(r._rate).toLocaleString("en-PK")}</td>
                      <td className="r">{r._stock}</td>
                      <td className="r">{r._pack}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="cs-modal-hint">↑↓ navigate &nbsp;|&nbsp; Enter / Double-click = select &nbsp;|&nbsp; Esc = close &nbsp;|&nbsp; Tab = filters</div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────────── */
export default function SalePage() {
  const [time, setTime]               = useState(timeNow());
  const [allProducts, setAllProducts] = useState([]);
  const [customers, setCustomers]     = useState([]);
  const [showModal, setShowModal]     = useState(false);
  const [searchText, setSearchText]   = useState("");
  const [curRow, setCurRow]           = useState({ ...EMPTY_ROW });
  const [items, setItems]             = useState([]);
  const [invoiceDate, setInvoiceDate] = useState(isoDate());
  const [invoiceNo, setInvoiceNo]     = useState("INV-00001");
  const [customerId, setCustomerId]   = useState("");
  const [buyerName, setBuyerName]     = useState("COUNTER SALE");
  const [buyerCode, setBuyerCode]     = useState("");
  const [prevBalance, setPrevBalance] = useState(0);
  const [extraDiscount, setExtraDiscount] = useState(0);
  const [received, setReceived]       = useState(0);
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [holdBills, setHoldBills]     = useState([]);
  const [editId, setEditId]           = useState(null);
  const [selItemIdx, setSelItemIdx]   = useState(null);
  const [msg, setMsg]                 = useState({ text: "", type: "" });
  const [loading, setLoading]         = useState(false);
  const [printType, setPrintType]     = useState("Thermal");
  const [sendSms, setSendSms]         = useState(false);
  const [packingOptions, setPackingOptions] = useState([]);

  const searchRef   = useRef(null);
  const pcsRef      = useRef(null);
  const rateRef     = useRef(null);
  const addRef      = useRef(null);
  const receivedRef = useRef(null);
  const discRef     = useRef(null);

  useEffect(() => { const t = setInterval(() => setTime(timeNow()), 1000); return () => clearInterval(t); }, []);
  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pRes, cRes, invRes] = await Promise.all([api.get(EP.PRODUCTS.GET_ALL), api.get(EP.CUSTOMERS.GET_ALL), api.get(EP.SALES.NEXT_INVOICE)]);
      if (pRes.data.success) setAllProducts(pRes.data.data);
      if (cRes.data.success) setCustomers(cRes.data.data);
      if (invRes.data.success) setInvoiceNo(invRes.data.data.invoiceNo);
    } catch { showMsg("Failed to load data", "error"); }
    setLoading(false);
  };

  const refreshInvoiceNo = async () => {
    try { const res = await api.get(EP.SALES.NEXT_INVOICE); if (res.data.success) setInvoiceNo(res.data.data.invoiceNo); } catch {}
  };

  const showMsg = (text, type = "success") => { setMsg({ text, type }); setTimeout(() => setMsg({ text: "", type: "" }), 3500); };

  const handleCustomerChange = (e) => {
    const id = e.target.value;
    setCustomerId(id);
    if (!id) { setBuyerName("COUNTER SALE"); setBuyerCode(""); setPrevBalance(0); return; }
    const c = customers.find((x) => x._id === id);
    if (c) { setBuyerName(c.name); setBuyerCode(c.code); setPrevBalance(c.currentBalance || 0); }
  };

  const pickProduct = (product) => {
    if (!product._id) { showMsg("Product ID missing", "error"); return; }
    const opts = product.packingInfo?.map((pk) => pk.measurement) || [];
    setPackingOptions(opts);
    setCurRow({ productId: product._id, code: product.code || "", name: product._name || product.description || "", uom: product._meas || "", rack: product.rack || "", pcs: product._pack || 1, rate: product._rate || 0, amount: (product._pack || 1) * (product._rate || 0) });
    setSearchText(product._name || product.description || "");
    setShowModal(false);
    setTimeout(() => pcsRef.current?.focus(), 30);
  };

  const updateCurRow = (field, val) => {
    setCurRow((prev) => {
      const u = { ...prev, [field]: val };
      u.amount = (parseFloat(field === "pcs" ? val : u.pcs) || 0) * (parseFloat(field === "rate" ? val : u.rate) || 0);
      return u;
    });
  };

  const addRow = () => {
    if (!curRow.name) { setShowModal(true); return; }
    if (!curRow.productId) { showMsg("Please select a valid product", "error"); return; }
    if (parseFloat(curRow.pcs) <= 0) { showMsg("Quantity must be > 0", "error"); return; }
    if (selItemIdx !== null) {
      setItems((prev) => { const u = [...prev]; u[selItemIdx] = { ...curRow }; return u; });
      setSelItemIdx(null);
    } else { setItems((p) => [...p, { ...curRow }]); }
    resetCurRow();
  };

  const resetCurRow = () => { setCurRow({ ...EMPTY_ROW }); setSearchText(""); setPackingOptions([]); setSelItemIdx(null); setTimeout(() => searchRef.current?.focus(), 30); };
  const loadRowForEdit = (idx) => { setSelItemIdx(idx); const r = items[idx]; setCurRow({ ...r }); setSearchText(r.name); setTimeout(() => pcsRef.current?.focus(), 30); };
  const removeRow = () => { if (selItemIdx === null) return; setItems((p) => p.filter((_, i) => i !== selItemIdx)); resetCurRow(); };

  const totalQty   = items.reduce((s, r) => s + (parseFloat(r.pcs) || 0), 0);
  const subTotal   = items.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
  const billAmount = subTotal - (parseFloat(extraDiscount) || 0);
  const balance    = billAmount + (parseFloat(prevBalance) || 0) - (parseFloat(received) || 0);

  const holdBill = () => {
    if (!items.length) return;
    setHoldBills((p) => [...p, { id: Date.now(), invoiceNo, amount: billAmount, items: [...items], customerId, buyerName, buyerCode, prevBalance, extraDiscount, paymentMode }]);
    fullReset(); refreshInvoiceNo();
  };

  const resumeHold = (holdId) => {
    const bill = holdBills.find((b) => b.id === holdId); if (!bill) return;
    setItems(bill.items); setCustomerId(bill.customerId || ""); setBuyerName(bill.buyerName || "COUNTER SALE");
    setBuyerCode(bill.buyerCode || ""); setPrevBalance(bill.prevBalance || 0);
    setExtraDiscount(bill.extraDiscount || 0); setPaymentMode(bill.paymentMode || "Cash");
    setHoldBills((p) => p.filter((b) => b.id !== holdId)); resetCurRow();
  };

  const deleteHold = (holdId, e) => { e.stopPropagation(); if (window.confirm("Delete this held bill?")) setHoldBills((p) => p.filter((b) => b.id !== holdId)); };

  const fullReset = () => {
    setItems([]); setCurRow({ ...EMPTY_ROW }); setSearchText(""); setPackingOptions([]);
    setCustomerId(""); setBuyerName("COUNTER SALE"); setBuyerCode(""); setPrevBalance(0);
    setExtraDiscount(0); setReceived(0); setEditId(null); setSelItemIdx(null); setMsg({ text: "", type: "" });
  };

  const saveSale = async () => {
    if (!items.length) { alert("Add at least one item"); return; }
    setLoading(true);
    try {
      const payload = { invoiceDate, customerId: customerId || undefined, customerName: buyerName || "COUNTER SALE", customerPhone: buyerCode,
        items: items.map((r) => ({ productId: r.productId || undefined, code: r.code, description: r.name, measurement: r.uom, rack: r.rack, qty: parseFloat(r.pcs) || 1, rate: parseFloat(r.rate) || 0, disc: 0, amount: parseFloat(r.amount) || 0 })),
        subTotal, extraDisc: parseFloat(extraDiscount) || 0, discAmount: 0, netTotal: billAmount,
        prevBalance: parseFloat(prevBalance) || 0, paidAmount: parseFloat(received) || 0, balance, paymentMode, sendSms, printType, remarks: "", saleType: "sale", saleSource: "cash" };
      const { data } = editId ? await api.put(EP.SALES.UPDATE(editId), payload) : await api.post(EP.SALES.CREATE, payload);
      if (data.success) { showMsg(editId ? "Sale updated!" : `Saved: ${data.data.invoiceNo}`); fullReset(); await refreshInvoiceNo(); }
      else showMsg(data.message, "error");
    } catch (e) { showMsg(e.response?.data?.message || "Save failed", "error"); }
    setLoading(false);
  };

  const EMPTY_ROWS = Math.max(0, 8 - items.length);
  const payBtnClass = (mode) => `sl-pay-btn${paymentMode === mode ? " active-" + mode.toLowerCase() : ""}`;

  return (
    <div className="sl-page">

      {showModal && (
        <SearchModal allProducts={allProducts} onSelect={pickProduct}
          onClose={() => { setShowModal(false); setTimeout(() => searchRef.current?.focus(), 30); }} />
      )}

      {/* ── Titlebar ── */}
      <div className="xp-titlebar">
        <svg width="15" height="15" viewBox="0 0 16 16" fill="rgba(255,255,255,0.85)">
          <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v1h14V4a1 1 0 0 0-1-1zm13 4H1v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1zM2 10h2a1 1 0 0 1 0 2H2a1 1 0 0 1 0-2m4 0h6a1 1 0 0 1 0 2H6a1 1 0 0 1 0-2"/>
        </svg>
        <span className="xp-tb-title">Sale — Asim Electric &amp; Electronic Store</span>
        <div className="xp-tb-actions">
          {editId && <div className="sl-edit-badge"><svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor"><path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168z"/></svg> Editing Sale</div>}
          <div className="xp-tb-divider" />
          <button className="xp-cap-btn" title="Minimize">─</button>
          <button className="xp-cap-btn" title="Maximize">□</button>
          <button className="xp-cap-btn xp-cap-close" title="Close">✕</button>
        </div>
      </div>

      {/* ── Alert ── */}
      {msg.text && (
        <div className={`xp-alert ${msg.type === "success" ? "xp-alert-success" : "xp-alert-error"}`}
          style={{ margin: "4px 10px 0", flexShrink: 0 }}>{msg.text}</div>
      )}

      {/* ── MAIN BODY ── */}
      <div className="sl-body">

        {/* ════ LEFT ════ */}
        <div className="sl-left">

          {/* Invoice header */}
          <div className="sl-inv-header">
            <div className="sl-inv-title">
              <svg width="13" height="13" viewBox="0 0 16 16" fill="var(--xp-blue-dark)"><path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v1h14V4a1 1 0 0 0-1-1zm13 4H1v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1z"/></svg>
              Sale
            </div>
            <div className="sl-inv-field">
              <label>Invoice #</label>
              <input className="xp-input xp-input-sm" style={{ width: 110 }} value={editId ? "EDIT MODE" : invoiceNo} readOnly />
            </div>
            <div className="sl-inv-field">
              <label>Date</label>
              <input type="date" className="xp-input xp-input-sm" style={{ width: 136 }} value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
            </div>
            <div className="sl-time">{time}</div>
          </div>

          {/* Product entry strip */}
          <div className="sl-entry-strip">
            {/* Search */}
            <label>Product</label>
            <input ref={searchRef} type="text" className="sl-product-input" value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onClick={() => setShowModal(true)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === "ArrowDown") { e.preventDefault(); setShowModal(true); } }}
              placeholder="Click or Enter to search…"
              readOnly={!!curRow.name} autoFocus />

            {/* UOM */}
            <label>UOM</label>
            {packingOptions.length > 0 ? (
              <select className="sl-uom-select" value={curRow.uom} onChange={(e) => setCurRow((p) => ({ ...p, uom: e.target.value }))}>
                {packingOptions.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : (
              <input type="text" className="xp-input xp-input-sm" style={{ width: 60 }} value={curRow.uom}
                onChange={(e) => setCurRow((p) => ({ ...p, uom: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && pcsRef.current?.focus()} />
            )}

            {/* Pcs */}
            <label>Qty</label>
            <input ref={pcsRef} type="number" className="sl-num-input" value={curRow.pcs} min={1}
              onChange={(e) => updateCurRow("pcs", e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && rateRef.current?.focus()} />

            {/* Rate */}
            <label>Rate</label>
            <input ref={rateRef} type="number" className="sl-num-input" value={curRow.rate} min={0}
              onChange={(e) => updateCurRow("rate", e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addRef.current?.click()} />

            {/* Amount */}
            <label>Amount</label>
            <input className="sl-num-input" value={Number(curRow.amount || 0).toLocaleString("en-PK")} readOnly />

            <div className="xp-toolbar-divider" />

            {/* Product name tag */}
            {curRow.name
              ? <span className="sl-cur-name">{curRow.name}</span>
              : <span className="sl-no-product">No product selected</span>}

            {/* Entry buttons */}
            <div className="sl-entry-btns">
              <button className="xp-btn xp-btn-sm" onClick={resetCurRow} title="Reset current row">
                <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor"><path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2z"/><path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466"/></svg>
                Reset
              </button>
              <button ref={addRef} className="xp-btn xp-btn-primary xp-btn-sm" onClick={addRow}>
                <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/><path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4"/></svg>
                {selItemIdx !== null ? "Update" : "Add"}
              </button>
              <button className="xp-btn xp-btn-sm" disabled={selItemIdx === null}
                onClick={() => selItemIdx !== null && loadRowForEdit(selItemIdx)}>
                <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor"><path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168z"/></svg>
                Edit
              </button>
              <button className="xp-btn xp-btn-danger xp-btn-sm" disabled={selItemIdx === null} onClick={removeRow}>
                <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5"/><path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1z"/></svg>
                Remove
              </button>
            </div>
          </div>

          {/* Items table */}
          <div className="sl-items-wrap">
            <table className="sl-items-table">
              <thead>
                <tr>
                  <th style={{ width: 32 }}>Sr.#</th>
                  <th style={{ width: 70 }}>Code</th>
                  <th>Name</th>
                  <th style={{ width: 60 }}>UOM</th>
                  <th style={{ width: 55 }} className="r">Qty</th>
                  <th style={{ width: 85 }} className="r">Rate</th>
                  <th style={{ width: 95 }} className="r">Amount</th>
                  <th style={{ width: 55 }}>Rack</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 && !items.length && (
                  <tr><td colSpan={8} className="xp-empty" style={{ padding: 14 }}>Search and add products to start the bill</td></tr>
                )}
                {items.map((r, i) => (
                  <tr key={i}
                    className={selItemIdx === i ? "sl-sel-row" : ""}
                    onClick={() => setSelItemIdx(i === selItemIdx ? null : i)}
                    onDoubleClick={() => loadRowForEdit(i)}>
                    <td className="muted" style={{ textAlign: "center", fontSize: "var(--xp-fs-xs)" }}>{i + 1}</td>
                    <td className="muted">{r.code}</td>
                    <td style={{ fontWeight: 500 }}>{r.name}</td>
                    <td className="muted">{r.uom}</td>
                    <td className="r">{r.pcs}</td>
                    <td className="r">{Number(r.rate).toLocaleString("en-PK")}</td>
                    <td className="r" style={{ color: "var(--xp-blue-dark)" }}>{Number(r.amount).toLocaleString("en-PK")}</td>
                    <td className="muted">{r.rack}</td>
                  </tr>
                ))}
                {Array.from({ length: EMPTY_ROWS }).map((_, i) => (
                  <tr key={`e${i}`} className="sl-empty-row"><td colSpan={8} /></tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>

        {/* ════ RIGHT ════ */}
        <div className="sl-right">

          {/* Totals panel */}
          <div className="sl-totals-panel">
            <div className="sl-total-row"><label>Total Qty</label><input className="sl-total-val" value={totalQty.toLocaleString("en-PK")} readOnly /></div>
            <div className="sl-total-row"><label>Sub Total</label><input className="sl-total-val" value={Number(subTotal).toLocaleString("en-PK")} readOnly /></div>
            <div className="sl-total-row">
              <label>Extra Disc</label>
              <input ref={discRef} type="number" className="sl-inline-input" value={extraDiscount} min={0}
                onChange={(e) => setExtraDiscount(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && receivedRef.current?.focus()} />
            </div>
            <div className="sl-total-row"><label>Bill Amt</label><input className="sl-total-val" value={Number(billAmount).toLocaleString("en-PK")} readOnly /></div>
            <div className="sl-total-row">
              <label>Received</label>
              <input ref={receivedRef} type="number" className="sl-inline-input" style={{ color: "var(--xp-green)" }}
                value={received} min={0} onChange={(e) => setReceived(e.target.value)} />
            </div>
            <div className="sl-total-row">
              <label>Balance</label>
              <input className={`sl-total-val highlight${balance > 0 ? " danger" : balance < 0 ? " success" : ""}`}
                value={Number(balance).toLocaleString("en-PK")} readOnly />
            </div>
          </div>

          {/* Customer panel */}
          <div className="sl-customer-panel">
            <div className="sl-cust-row">
              <label>Code</label>
              <input className="sl-cust-input" value={buyerCode} onChange={(e) => setBuyerCode(e.target.value)} />
            </div>
            <div className="sl-cust-row">
              <label>Buyer</label>
              <select className="sl-cust-select" value={customerId} onChange={handleCustomerChange}>
                <option value="">COUNTER SALE</option>
                {customers.map((c) => (
                  <option key={c._id} value={c._id}>{c.name} ({c.code})</option>
                ))}
              </select>
            </div>
            <div className="sl-cust-row">
              <label>Prev. Bal</label>
              <input type="number" className="sl-cust-input" value={prevBalance} onChange={(e) => setPrevBalance(e.target.value)} />
            </div>
            <div className="sl-cust-row">
              <label>Net Recv.</label>
              <input className="sl-cust-input" style={{ fontFamily: "var(--xp-mono)", fontWeight: 700, color: balance > 0 ? "var(--xp-red)" : "var(--xp-green)" }}
                value={Number(balance).toLocaleString("en-PK")} readOnly />
            </div>
            {/* Payment mode buttons */}
            <div className="sl-pay-btns" style={{ marginTop: 3 }}>
              {["Cash", "Credit", "Bank", "Cheque"].map((m) => (
                <button key={m} className={payBtnClass(m)} onClick={() => setPaymentMode(m)}>{m}</button>
              ))}
            </div>
          </div>

          {/* Hold bills panel */}
          <div className="sl-hold-panel">
            <div className="sl-hold-title">
              <span>
                <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor" style={{ marginRight: 4 }}><path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1L14 5.5z"/></svg>
                Hold Bills
              </span>
              <span className="sl-hold-cnt">{holdBills.length}</span>
            </div>

            <div className="sl-hold-table-wrap">
              <table className="sl-hold-table">
                <tbody>
                  {holdBills.length === 0
                    ? Array.from({ length: 6 }).map((_, i) => <tr key={i}><td colSpan={4} style={{ height: 22 }} /></tr>)
                    : holdBills.map((b, i) => (
                        <tr key={b.id} onClick={() => resumeHold(b.id)}>
                          <td className="muted" style={{ fontSize: "var(--xp-fs-xs)", width: 24, textAlign: "center" }}>{i + 1}</td>
                          <td style={{ fontFamily: "var(--xp-mono)", fontSize: "var(--xp-fs-xs)" }}>{b.invoiceNo}</td>
                          <td className="r" style={{ color: "var(--xp-blue-dark)" }}>{Number(b.amount).toLocaleString("en-PK")}</td>
                          <td style={{ width: 22, textAlign: "center" }}>
                            <button className="xp-btn xp-btn-sm xp-btn-ico" style={{ width: 18, height: 18, fontSize: 9, color: "var(--xp-red)" }}
                              onClick={(e) => deleteHold(b.id, e)}>✕</button>
                          </td>
                        </tr>
                      ))
                  }
                </tbody>
              </table>
            </div>

            <div style={{ padding: "4px 8px", flexShrink: 0 }}>
              <button className="xp-btn xp-btn-sm" style={{ width: "100%" }} onClick={holdBill} disabled={!items.length}>
                <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor"><path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1L14 5.5z"/></svg>
                Hold Bill
              </button>
            </div>
            <div className="sl-hold-hint">Click row to resume &nbsp;·&nbsp; ✕ to delete</div>
          </div>

        </div>
      </div>

      {/* ── COMMANDS BAR ── */}
      <div className="sl-cmd-bar">
        <button className="xp-btn xp-btn-sm" onClick={fullReset} disabled={loading}>
          <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor"><path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2z"/><path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466"/></svg>
          Refresh
        </button>
        <button className="xp-btn xp-btn-primary xp-btn-lg" onClick={saveSale} disabled={loading}>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M2 1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H9.5a1 1 0 0 0-1 1v7.293l2.646-2.647a.5.5 0 0 1 .708.708l-3.5 3.5a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L7.5 9.293V2a2 2 0 0 1 2-2H14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2z"/></svg>
          {loading ? "Saving…" : "Save Record"}
        </button>
        <button className="xp-btn xp-btn-sm" onClick={() => {}}>
          <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor"><path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168z"/></svg>
          Edit Record
        </button>
        <button className="xp-btn xp-btn-danger xp-btn-sm" disabled={!editId}
          onClick={async () => { if (!editId) return; if (!window.confirm("Delete this sale?")) return; try { await api.delete(EP.SALES.DELETE(editId)); showMsg("Sale deleted"); fullReset(); refreshInvoiceNo(); } catch { showMsg("Delete failed", "error"); } }}>
          <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5"/><path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1z"/></svg>
          Delete Record
        </button>

        <div className="xp-toolbar-divider" />

        <div className="sl-cmd-checks">
          <label className="sl-check-label">
            <input type="checkbox" checked={sendSms} onChange={(e) => setSendSms(e.target.checked)} />
            Send SMS
          </label>
          <label className="sl-check-label">
            <input type="checkbox" />
            Print P.Bal
          </label>
          <label className="sl-check-label">
            <input type="checkbox" />
            Gate Pass
          </label>
        </div>

        <div className="xp-toolbar-divider" />

        {/* Print type radio */}
        <div className="sl-print-types">
          {["Thermal", "A4", "A5"].map((pt) => (
            <label key={pt} className="sl-check-label">
              <input type="radio" name="pt" checked={printType === pt} onChange={() => setPrintType(pt)} />
              {pt}
            </label>
          ))}
        </div>

        <div className="xp-toolbar-divider" />

        <span className={`sl-inv-info${editId ? " edit-mode" : ""}`}>
          {editId
            ? "✏ Editing sale record"
            : `${invoiceNo} | Items: ${items.length} | Total: ${Number(subTotal).toLocaleString("en-PK")}`}
        </span>

        <button className="xp-btn xp-btn-sm" style={{ marginLeft: "auto" }} onClick={fullReset}>
          <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor"><path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z"/></svg>
          Close
        </button>
      </div>

    </div>
  );
}