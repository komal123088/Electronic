// pages/SalePage.jsx
// FIXED: Hold Bill flow — hold saves to panel, click resumes, X deletes
// FIXED: Save properly resets, next invoice updates from API
// FIXED: productId empty string validation
// FIXED: pickProduct guard added
import { useState, useEffect, useRef, useCallback } from "react";
import "../styles/SalePage.css";
import api from "../api/api.js";
import EP from "../api/apiEndpoints.js";

const timeNow = () =>
  new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
const isoDate = () => new Date().toISOString().split("T")[0];

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

// ═══════════════════════════════════════════════════════════════════════════
// SEARCH MODAL
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
    const res = [];
    const ld = d.trim().toLowerCase();
    const lc = c.trim().toLowerCase();
    const lo = co.trim().toLowerCase();
    products.forEach((p) => {
      const ok =
        (!ld ||
          p.description?.toLowerCase().includes(ld) ||
          p.code?.toLowerCase().includes(ld)) &&
        (!lc || p.category?.toLowerCase().includes(lc)) &&
        (!lo || p.company?.toLowerCase().includes(lo));
      if (!ok) return;
      const combinedName = [p.category, p.description, p.company]
        .filter(Boolean)
        .join(" ");
      if (p.packingInfo?.length > 0) {
        p.packingInfo.forEach((pk, i) => {
          res.push({
            ...p,
            _pi: i,
            _meas: pk.measurement,
            _rate: pk.saleRate,
            _pack: pk.packing,
            _stock: pk.openingQty || 0,
            _name: combinedName,
          });
        });
      } else {
        res.push({
          ...p,
          _pi: 0,
          _meas: "",
          _rate: 0,
          _pack: 1,
          _stock: 0,
          _name: combinedName,
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
    const filtered = buildFlat(allProducts, desc, cat, company);
    setRows(filtered);
    setHiIdx(filtered.length > 0 ? 0 : -1);
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
            <button className="btn" onClick={onClose}>
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
// MAIN SALE PAGE
// ═══════════════════════════════════════════════════════════════════════════
export default function SalePage() {
  const [time, setTime] = useState(timeNow());
  const [allProducts, setAllProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [curRow, setCurRow] = useState({ ...EMPTY_ROW });
  const [items, setItems] = useState([]);
  const [invoiceDate, setInvoiceDate] = useState(isoDate());
  const [invoiceNo, setInvoiceNo] = useState("INV-00001");
  const [customerId, setCustomerId] = useState("");
  const [buyerName, setBuyerName] = useState("COUNTER SALE");
  const [buyerCode, setBuyerCode] = useState("");
  const [prevBalance, setPrevBalance] = useState(0);
  const [extraDiscount, setExtraDiscount] = useState(0);
  const [received, setReceived] = useState(0);
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [holdBills, setHoldBills] = useState([]);
  const [editId, setEditId] = useState(null);
  const [selItemIdx, setSelItemIdx] = useState(null);
  const [msg, setMsg] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);
  const [printType, setPrintType] = useState("Thermal");
  const [sendSms, setSendSms] = useState(false);
  const [packingOptions, setPackingOptions] = useState([]);

  const searchRef = useRef(null);
  const pcsRef = useRef(null);
  const rateRef = useRef(null);
  const addRef = useRef(null);

  // Clock
  useEffect(() => {
    const t = setInterval(() => setTime(timeNow()), 1000);
    return () => clearInterval(t);
  }, []);

  // Initial load
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pRes, cRes, invRes] = await Promise.all([
        api.get(EP.PRODUCTS.GET_ALL),
        api.get(EP.CUSTOMERS.GET_ALL),
        api.get(EP.SALES.NEXT_INVOICE),
      ]);
      if (pRes.data.success) setAllProducts(pRes.data.data);
      if (cRes.data.success) setCustomers(cRes.data.data);
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

  // ── Customer select ──────────────────────────────────────────────────────
  const handleCustomerChange = (e) => {
    const id = e.target.value;
    setCustomerId(id);
    if (!id) {
      setBuyerName("COUNTER SALE");
      setBuyerCode("");
      setPrevBalance(0);
      return;
    }
    const c = customers.find((x) => x._id === id);
    if (c) {
      setBuyerName(c.name);
      setBuyerCode(c.code);
      setPrevBalance(c.currentBalance || 0);
    }
  };

  // ── Product pick from modal ──────────────────────────────────────────────
  // FIX: productId guard — agar _id nahi hai to error show karo
  const pickProduct = (product) => {
    if (!product._id) {
      showMsg("❌ Product ID missing, please contact admin", "error");
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
    setShowModal(false);
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

  // ── Add / Update row ─────────────────────────────────────────────────────
  const addRow = () => {
    if (!curRow.name) {
      setShowModal(true);
      return;
    }
    // FIX: name hona chahiye aur rate 0 se zyada
    if (!curRow.productId) {
      showMsg("❌ Please select a valid product", "error");
      return;
    }
    if (parseFloat(curRow.pcs) <= 0) {
      showMsg("❌ Quantity must be greater than 0", "error");
      return;
    }
    if (selItemIdx !== null) {
      // UPDATE existing row
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

  // ── Totals ────────────────────────────────────────────────────────────────
  const totalQty = items.reduce((s, r) => s + (parseFloat(r.pcs) || 0), 0);
  const subTotal = items.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
  const billAmount = subTotal - (parseFloat(extraDiscount) || 0);
  const balance =
    billAmount + (parseFloat(prevBalance) || 0) - (parseFloat(received) || 0);

  // ── Hold Bill — SAVE to hold panel ───────────────────────────────────────
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
        prevBalance,
        extraDiscount,
        paymentMode,
      },
    ]);
    fullReset();
    refreshInvoiceNo();
  };

  // ── RESUME held bill (click on row) ─────────────────────────────────────
  const resumeHold = (holdId) => {
    const bill = holdBills.find((b) => b.id === holdId);
    if (!bill) return;
    setItems(bill.items);
    setCustomerId(bill.customerId || "");
    setBuyerName(bill.buyerName || "COUNTER SALE");
    setBuyerCode(bill.buyerCode || "");
    setPrevBalance(bill.prevBalance || 0);
    setExtraDiscount(bill.extraDiscount || 0);
    setPaymentMode(bill.paymentMode || "Cash");
    setHoldBills((p) => p.filter((b) => b.id !== holdId));
    resetCurRow();
  };

  // ── DELETE held bill (X button) ──────────────────────────────────────────
  const deleteHold = (holdId, e) => {
    e.stopPropagation();
    if (window.confirm("Delete this held bill?"))
      setHoldBills((p) => p.filter((b) => b.id !== holdId));
  };

  // ── Full reset ───────────────────────────────────────────────────────────
  const fullReset = () => {
    setItems([]);
    setCurRow({ ...EMPTY_ROW });
    setSearchText("");
    setPackingOptions([]);
    setCustomerId("");
    setBuyerName("COUNTER SALE");
    setBuyerCode("");
    setPrevBalance(0);
    setExtraDiscount(0);
    setReceived(0);
    setEditId(null);
    setSelItemIdx(null);
    setMsg({ text: "", type: "" });
  };

  // ── Save sale ─────────────────────────────────────────────────────────────
  const saveSale = async () => {
    if (!items.length) {
      alert("Add at least one item");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        invoiceDate,
        // FIX: customerId empty string nahi bhejo — undefined bhejo
        customerId: customerId || undefined,
        customerName: buyerName || "COUNTER SALE",
        customerPhone: buyerCode,
        items: items.map((r) => ({
          // FIX: productId empty string nahi bhejo
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
        sendSms,
        printType,
        remarks: "",
        saleType: "sale",
      };

      const { data } = editId
        ? await api.put(EP.SALES.UPDATE(editId), payload)
        : await api.post(EP.SALES.CREATE, payload);

      if (data.success) {
        showMsg(
          editId ? "✅ Sale updated!" : `✅ Saved: ${data.data.invoiceNo}`,
        );
        fullReset();
        await refreshInvoiceNo();
      } else {
        showMsg(`❌ ${data.message}`, "error");
      }
    } catch (e) {
      showMsg(`❌ ${e.response?.data?.message || "Save failed"}`, "error");
    }
    setLoading(false);
  };

  // ── Load sale for edit ────────────────────────────────────────────────────
  const loadForEdit = async (saleId) => {
    try {
      const { data } = await api.get(EP.SALES.GET_ONE(saleId));
      if (!data.success) return;
      const s = data.data;
      setEditId(s._id);
      setInvoiceDate(s.invoiceDate);
      setCustomerId(s.customerId?._id || "");
      setBuyerName(s.customerName);
      setBuyerCode(s.customerPhone || "");
      setPrevBalance(s.prevBalance || 0);
      setExtraDiscount(s.extraDisc || 0);
      setReceived(s.paidAmount || 0);
      setPaymentMode(s.paymentMode);
      setItems(
        s.items.map((i) => ({
          productId: i.productId,
          code: i.code,
          name: i.description,
          uom: i.measurement,
          rack: i.rack,
          pcs: i.qty,
          rate: i.rate,
          amount: i.amount,
        })),
      );
    } catch {
      showMsg("Failed to load sale", "error");
    }
  };

  const EMPTY_ROWS = Math.max(0, 8 - items.length);

  return (
    <div className="sp-page">
      {showModal && (
        <SearchModal
          allProducts={allProducts}
          onSelect={pickProduct}
          onClose={() => {
            setShowModal(false);
            setTimeout(() => searchRef.current?.focus(), 30);
          }}
        />
      )}

      {msg.text && <div className={`sp-msg ${msg.type}`}>{msg.text}</div>}

      <div className="sp-layout">
        {/* ══ MAIN ═══════════════════════════════════════════════════════════ */}
        <div className="sp-main">
          {/* Header */}
          <div className="sp-header">
            <div className="sp-header-title">Sale</div>
            <div className="sp-header-meta">
              <div>
                <span className="sp-meta-label">Invoice #&nbsp;</span>
                <input
                  className="sp-meta-input"
                  style={{ width: 100 }}
                  value={editId ? `EDIT` : invoiceNo}
                  readOnly
                />
              </div>
              <div>
                <span className="sp-meta-label">Date&nbsp;</span>
                <input
                  type="date"
                  className="sp-meta-input"
                  style={{ width: 130 }}
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                />
              </div>
              <div>
                <span className="sp-meta-label">Time&nbsp;</span>
                <span className="sp-meta-time">{time}</span>
              </div>
            </div>
          </div>

          {/* Input bar */}
          <div className="sp-input-bar">
            <div className="sp-row1">
              {/* Product search */}
              <div className="sp-search-wrap">
                <div className="sp-field-label">Select Product</div>
                <input
                  ref={searchRef}
                  type="text"
                  value={searchText}
                  className={`sp-search-input${curRow.name ? " filled" : ""}`}
                  onChange={(e) => setSearchText(e.target.value)}
                  onClick={() => setShowModal(true)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === "ArrowDown") {
                      e.preventDefault();
                      setShowModal(true);
                    }
                  }}
                  placeholder="Click or press Enter to search"
                  readOnly={!!curRow.name}
                  autoFocus
                />
              </div>

              {/* Packing */}
              <div className="sp-field">
                <span className="sp-field-label">Packing</span>
                {packingOptions.length > 0 ? (
                  <select
                    className="sp-field-select"
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
                    className="sp-field-input w90"
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

              {/* Pcs */}
              <div className="sp-field">
                <span className="sp-field-label">Pc(s)</span>
                <input
                  ref={pcsRef}
                  type="number"
                  className="sp-field-input w70 right"
                  value={curRow.pcs}
                  min={1}
                  onChange={(e) => updateCurRow("pcs", e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && rateRef.current?.focus()
                  }
                />
              </div>

              {/* Rate */}
              <div className="sp-field">
                <span className="sp-field-label">Rate</span>
                <input
                  ref={rateRef}
                  type="number"
                  className="sp-field-input w90 right"
                  value={curRow.rate}
                  min={0}
                  onChange={(e) => updateCurRow("rate", e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && addRef.current?.click()
                  }
                />
              </div>

              {/* Amount */}
              <div className="sp-field">
                <span className="sp-field-label">Amount</span>
                <input
                  className="sp-field-input w100 right readonly"
                  value={Number(curRow.amount || 0).toLocaleString()}
                  readOnly
                />
              </div>
            </div>

            {/* Row 2 */}
            <div className="sp-row2">
              <div className={`sp-selected-name${curRow.name ? "" : " empty"}`}>
                {curRow.name || "No product selected"}
              </div>
              <button className="btn" onClick={resetCurRow}>
                Reset
              </button>
              <button
                ref={addRef}
                className="btn"
                onClick={addRow}
                style={{
                  fontWeight: "bold",
                  border: "1px solid #316ac5",
                  minWidth: 60,
                }}
              >
                {selItemIdx !== null ? "Update" : "Add"}
              </button>
              <button
                className="btn"
                disabled={selItemIdx === null}
                onClick={() =>
                  selItemIdx !== null && loadRowForEdit(selItemIdx)
                }
              >
                Edit
              </button>
              <button
                className="btn btn-danger"
                disabled={selItemIdx === null}
                onClick={removeRow}
              >
                Remove
              </button>
            </div>
          </div>

          {/* Items table */}
          <div className="sp-table-wrap">
            <table className="sp-table">
              <thead>
                <tr>
                  <th style={{ width: 35 }}>Sr.#</th>
                  <th style={{ width: 65 }}>Code</th>
                  <th>Name</th>
                  <th style={{ width: 90 }}>UOM</th>
                  <th className="r" style={{ width: 60 }}>
                    Pc(s)
                  </th>
                  <th className="r" style={{ width: 80 }}>
                    Rate
                  </th>
                  <th className="r" style={{ width: 90 }}>
                    Amount
                  </th>
                  <th style={{ width: 70 }}>Rack</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      style={{
                        textAlign: "center",
                        color: "#888",
                        padding: "20px",
                        fontStyle: "italic",
                        border: "1px solid #d4d0c8",
                      }}
                    >
                      Search and add products
                    </td>
                  </tr>
                )}
                {items.map((r, i) => (
                  <tr
                    key={i}
                    className={
                      selItemIdx === i
                        ? "selected"
                        : i % 2 === 0
                          ? "even"
                          : "odd"
                    }
                    onClick={() => setSelItemIdx(i === selItemIdx ? null : i)}
                    onDoubleClick={() => loadRowForEdit(i)}
                  >
                    <td className="c">{i + 1}</td>
                    <td className="blue">{r.code}</td>
                    <td>{r.name}</td>
                    <td>{r.uom}</td>
                    <td className="r">{r.pcs}</td>
                    <td className="r">{Number(r.rate).toLocaleString()}</td>
                    <td className="r bold">
                      {Number(r.amount).toLocaleString()}
                    </td>
                    <td>{r.rack}</td>
                  </tr>
                ))}
                {Array.from({ length: EMPTY_ROWS }).map((_, i) => (
                  <tr key={`e${i}`}>
                    <td className="empty-row" colSpan={8}></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="sp-totals">
            <div className="sp-totals-row1">
              {[
                ["Total Quantity", totalQty.toLocaleString(), false],
                ["Net Amount", subTotal.toLocaleString(), false],
                ["Bill Amount", billAmount.toLocaleString(), false],
              ].map(([lbl, val]) => (
                <div className="sp-total-field" key={lbl}>
                  <span className="sp-total-label">{lbl}</span>
                  <input className="sp-total-input" value={val} readOnly />
                </div>
              ))}
              <div className="sp-total-field">
                <span className="sp-total-label">Extra Discount</span>
                <input
                  type="number"
                  className="sp-total-input editable"
                  value={extraDiscount}
                  min={0}
                  onChange={(e) => setExtraDiscount(e.target.value)}
                />
              </div>
              <div className="sp-total-field">
                <span className="sp-total-label">Received</span>
                <input
                  type="number"
                  className="sp-total-input editable"
                  value={received}
                  min={0}
                  onChange={(e) => setReceived(e.target.value)}
                />
              </div>
              <div className="sp-total-field" style={{ marginLeft: "auto" }}>
                <span className="sp-total-label">Balance</span>
                <input
                  className={`sp-total-input sp-balance-input${balance === 0 ? " zero" : ""}`}
                  value={balance.toLocaleString()}
                  readOnly
                />
              </div>
            </div>

            <div className="sp-totals-row2">
              <div>
                <span className="sp-buyer-label">Code</span>
                <input
                  className="sp-buyer-input w55"
                  value={buyerCode}
                  onChange={(e) => setBuyerCode(e.target.value)}
                />
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <span className="sp-buyer-label">Buyer Name</span>
                <select
                  className="sp-buyer-select"
                  value={customerId}
                  onChange={handleCustomerChange}
                >
                  <option value="">COUNTER SALE</option>
                  {customers.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <span className="sp-buyer-label">Prev. Balance</span>
                <input
                  type="number"
                  className="sp-buyer-input w90"
                  value={prevBalance}
                  onChange={(e) => setPrevBalance(e.target.value)}
                />
              </div>
              <div>
                <span className="sp-buyer-label">Net Receivable</span>
                <input
                  className="sp-buyer-input w90 readonly"
                  value={balance.toLocaleString()}
                  readOnly
                />
              </div>
              <div style={{ marginLeft: "auto" }}>
                <span className="sp-buyer-label">Payment</span>
                <select
                  className="sp-pay-select"
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                >
                  {["Cash", "Credit", "Bank", "Cheque"].map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* ══ RIGHT: Hold Bills ═══════════════════════════════════════════════ */}
        <div className="sp-hold">
          <div className="sp-hold-title">Hold Bills ({holdBills.length})</div>
          <div className="sp-hold-scroll">
            <table className="sp-hold-table">
              <thead>
                <tr>
                  <th style={{ width: 24 }}>#</th>
                  <th>Bill #</th>
                  <th style={{ textAlign: "right" }}>Amount</th>
                  <th style={{ width: 22 }}></th>
                </tr>
              </thead>
              <tbody>
                {holdBills.length === 0
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i}>
                        <td
                          colSpan={4}
                          style={{ height: 22, border: "1px solid #e0e0e0" }}
                        ></td>
                      </tr>
                    ))
                  : holdBills.map((b, i) => (
                      <tr
                        key={b.id}
                        className="hold-row"
                        onClick={() => resumeHold(b.id)}
                        title="Click to resume this bill"
                      >
                        <td style={{ textAlign: "center" }}>{i + 1}</td>
                        <td>{b.invoiceNo}</td>
                        <td style={{ textAlign: "right" }}>
                          {Number(b.amount).toLocaleString()}
                        </td>
                        <td>
                          <button
                            className="hold-del-btn"
                            onClick={(e) => deleteHold(b.id, e)}
                            title="Delete held bill"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
          <div className="sp-hold-btns">
            <button className="btn" onClick={holdBill} disabled={!items.length}>
              Hold Bill
            </button>
          </div>
          <div className="sp-hold-hint">
            Click row to resume
            <br />✕ to delete
          </div>
        </div>
      </div>

      {/* Bottom command bar */}
      <div className="sp-cmdbar">
        <button className="btn" onClick={fullReset} disabled={loading}>
          🔄 Refresh
        </button>
        <button
          className="btn"
          onClick={saveSale}
          style={{ fontWeight: "bold", minWidth: 110 }}
          disabled={loading}
        >
          {loading ? "⏳ Saving…" : "💾 Save Record"}
        </button>
        <button
          className="btn"
          style={{ minWidth: 100 }}
          onClick={() => {
            /* open sale history for edit — implement in SaleHistory page */
          }}
        >
          ✏️ Edit Record
        </button>
        <button
          className="btn btn-danger"
          style={{ minWidth: 110 }}
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
          disabled={!editId}
        >
          ✖ Delete Record
        </button>

        <label className="sp-cmdbar-label">
          <input
            type="checkbox"
            checked={sendSms}
            onChange={(e) => setSendSms(e.target.checked)}
          />
          &nbsp;Send SMS
        </label>
        <label className="sp-cmdbar-label">
          <input type="checkbox" /> &nbsp;Print P.Bal
        </label>
        <label className="sp-cmdbar-label">
          <input type="checkbox" /> &nbsp;Gate Pass
        </label>

        <span className="sp-cmdbar-status">
          {editId
            ? `✏️ Editing sale`
            : `Next: ${invoiceNo} | Items: ${items.length} | Total: ${subTotal.toLocaleString()}`}
        </span>

        <div className="sp-cmdbar-right">
          {["Thermal", "A4", "A5"].map((pt) => (
            <label key={pt} className="sp-cmdbar-label">
              <input
                type="radio"
                name="pt"
                checked={printType === pt}
                onChange={() => setPrintType(pt)}
              />{" "}
              {pt}
            </label>
          ))}
          <button className="btn" onClick={fullReset}>
            ✕ Close
          </button>
        </div>
      </div>
    </div>
  );
}
