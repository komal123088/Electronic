// pages/DamageOutPage.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import api from "../api/api.js";
import EP from "../api/apiEndpoints.js";
import "../styles/theme.css";
import "../styles/ManualPurchasePage.css";
import "../styles/DamagePage.css";

const isoDate = () => new Date().toISOString().split("T")[0];
const fmt = (n) => Number(n || 0).toLocaleString("en-PK");
const SHOP_NAME = "Asim Electric and Electronic Store";
const EMPTY_ROW = {
  code: "",
  name: "",
  uom: "",
  packing: "",
  pcs: 1,
  qty: 1,
  rate: 0,
  amount: 0,
};

/* ══════════════════════════════════════════════════════════
   SEARCH MODAL
══════════════════════════════════════════════════════════ */
function SearchModal({ allProducts, onSelect, onClose }) {
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState([]);
  const [hiIdx, setHiIdx] = useState(0);
  const inputRef = useRef(null);
  const tbodyRef = useRef(null);

  const buildList = useCallback((products, q) => {
    const lq = q.trim().toLowerCase();
    return products.flatMap((p) => {
      const match =
        !lq ||
        p.description?.toLowerCase().includes(lq) ||
        p.code?.toLowerCase().includes(lq) ||
        p.category?.toLowerCase().includes(lq);
      if (!match) return [];
      const name = [p.category, p.description, p.company]
        .filter(Boolean)
        .join(" ");
      if (p.packingInfo?.length > 0)
        return p.packingInfo.map((pk, i) => ({
          ...p,
          _pi: i,
          _name: name,
          _meas: pk.measurement,
          _rate: pk.saleRate,
          _pack: pk.packing,
          _stock: pk.openingQty || 0,
        }));
      return [
        { ...p, _pi: 0, _name: name, _meas: "", _rate: 0, _pack: 1, _stock: 0 },
      ];
    });
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  useEffect(() => {
    const f = buildList(allProducts, query);
    setRows(f);
    setHiIdx(f.length > 0 ? 0 : -1);
  }, [query, allProducts, buildList]);
  useEffect(() => {
    if (tbodyRef.current && hiIdx >= 0)
      tbodyRef.current.children[hiIdx]?.scrollIntoView({ block: "nearest" });
  }, [hiIdx]);

  const onKey = (e) => {
    if (e.key === "Escape") return onClose();
    if (e.key === "ArrowDown") {
      e.preventDefault();
      tbodyRef.current?.focus();
      setHiIdx(0);
    }
  };
  const tbKey = (e) => {
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
      if (rows[hiIdx]) onSelect(rows[hiIdx]);
    }
    if (e.key === "Escape") onClose();
    if (e.key === "Tab") {
      e.preventDefault();
      inputRef.current?.focus();
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
          <span className="xp-modal-title">Select Product</span>
          <button className="xp-cap-btn xp-cap-close" onClick={onClose}>
            X
          </button>
        </div>
        <div
          style={{
            padding: "8px 12px",
            borderBottom: "1px solid var(--xp-border)",
          }}
        >
          <input
            ref={inputRef}
            className="xp-input"
            style={{ width: "100%" }}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKey}
            placeholder="Search by name / code..."
            autoComplete="off"
          />
          <span
            style={{
              fontSize: "var(--xp-fs-xs)",
              color: "#666",
              marginTop: 4,
              display: "block",
            }}
          >
            {rows.length} result(s) - Up/Down | Enter = select | Esc = close
          </span>
        </div>
        <div className="xp-modal-body" style={{ padding: 0 }}>
          <div className="xp-table-panel" style={{ border: "none" }}>
            <div className="xp-table-scroll">
              <table className="xp-table">
                <thead>
                  <tr>
                    <th style={{ width: 36 }}>#</th>
                    <th>Code</th>
                    <th>Name</th>
                    <th>UOM</th>
                    <th className="r">Rate</th>
                    <th className="r">Pack</th>
                    <th className="r">Stock</th>
                  </tr>
                </thead>
                <tbody ref={tbodyRef} tabIndex={0} onKeyDown={tbKey}>
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={7} className="xp-empty">
                        No products found
                      </td>
                    </tr>
                  )}
                  {rows.map((r, i) => (
                    <tr
                      key={r._id + "-" + r._pi}
                      style={{
                        background: i === hiIdx ? "#c3d9f5" : undefined,
                        cursor: "pointer",
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
                      <td className="r">{r._pack}</td>
                      <td className="r">{r._stock}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   PRINT / RECEIPT MODAL
══════════════════════════════════════════════════════════ */
function PrintModal({ record, onClose }) {
  const {
    invoiceNo,
    invoiceDate,
    buyerName,
    items,
    totalQty,
    netAmount,
    billAmount,
    previousBalance,
    balance,
    netReceivable,
  } = record;

  const doPrint = () => {
    const rowsHtml = items
      .map(
        (it, i) =>
          "<tr><td>" +
          (i + 1) +
          "</td><td>" +
          (it.code || "") +
          "</td><td>" +
          it.name +
          "</td><td>" +
          (it.uom || "") +
          "</td><td>" +
          (it.packing || "") +
          "</td><td align='right'>" +
          it.pcs +
          "</td><td align='right'>" +
          Number(it.rate).toLocaleString() +
          "</td><td align='right'><b>" +
          Number(it.amount).toLocaleString() +
          "</b></td></tr>",
      )
      .join("");
    const win = window.open("", "_blank", "width=900,height=700");
    win.document.write(
      "<!DOCTYPE html><html><head><title>Damage Out " +
        invoiceNo +
        "</title><style>body{font-family:Arial,sans-serif;font-size:12px;padding:20px}h2,h3{margin:0 0 4px;text-align:center}table{width:100%;border-collapse:collapse;margin-top:10px}th,td{border:1px solid #ccc;padding:5px}th{background:#ffe0b2}.meta{display:flex;gap:16px;flex-wrap:wrap;margin:8px 0;padding:6px 10px;background:#fff8e1;border:1px solid #ffd54f}.tots{float:right;min-width:240px;margin-top:10px}.tr{display:flex;justify-content:space-between;padding:2px 0}.tr.b{font-weight:bold;border-top:1px solid #000;margin-top:4px}</style></head><body>",
    );
    win.document.write("<h2>" + SHOP_NAME + "</h2><h3>DAMAGE OUT</h3>");
    win.document.write(
      "<div class='meta'><span><b>Invoice #:</b> " +
        invoiceNo +
        "</span><span><b>Date:</b> " +
        invoiceDate +
        "</span><span><b>Party:</b> " +
        (buyerName || "COUNTER SALE") +
        "</span></div>",
    );
    win.document.write(
      "<table><thead><tr><th>#</th><th>Code</th><th>Name</th><th>UOM</th><th>Packing</th><th>Pcs</th><th align='right'>Rate</th><th align='right'>Amount</th></tr></thead><tbody>" +
        rowsHtml +
        "</tbody></table>",
    );
    win.document.write(
      "<div class='tots'><div class='tr'><span>Total Qty</span><span>" +
        totalQty +
        "</span></div><div class='tr'><span>Net Amount</span><span>" +
        Number(netAmount).toLocaleString() +
        "</span></div><div class='tr'><span>Bill Amount</span><span>" +
        Number(billAmount).toLocaleString() +
        "</span></div><div class='tr'><span>Previous Balance</span><span>" +
        Number(previousBalance).toLocaleString() +
        "</span></div><div class='tr'><span>Balance</span><span>" +
        Number(balance).toLocaleString() +
        "</span></div><div class='tr b'><span>Net Payable</span><span>Rs. " +
        Number(netReceivable).toLocaleString() +
        "</span></div></div>",
    );
    win.document.write("</body></html>");
    win.document.close();
    setTimeout(() => win.print(), 400);
  };

  return (
    <div
      className="xp-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="xp-modal xp-modal-lg">
        <div
          className="xp-modal-tb"
          style={{ background: "linear-gradient(135deg, #bf360c, #e64a19)" }}
        >
          <span className="xp-modal-title">
            Damage Out Receipt - {invoiceNo}
          </span>
          <button className="xp-cap-btn xp-cap-close" onClick={onClose}>
            X
          </button>
        </div>
        <div className="xp-modal-body">
          <div style={{ textAlign: "center", marginBottom: 8 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{SHOP_NAME}</div>
            <div style={{ fontSize: 12, color: "#e65100", fontWeight: 600 }}>
              DAMAGE OUT
            </div>
          </div>
          <div className="qt-inv-meta">
            <span>
              Invoice #: <strong>{invoiceNo}</strong>
            </span>
            <span>
              Date: <strong>{invoiceDate}</strong>
            </span>
            <span>
              Party: <strong>{buyerName || "COUNTER SALE"}</strong>
            </span>
          </div>
          <div className="xp-table-panel">
            <table className="xp-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Code</th>
                  <th>Name</th>
                  <th>UOM</th>
                  <th>Packing</th>
                  <th className="r">Pcs</th>
                  <th className="r">Rate</th>
                  <th className="r">Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, i) => (
                  <tr key={i}>
                    <td className="text-muted">{i + 1}</td>
                    <td>
                      <span className="xp-code">{it.code}</span>
                    </td>
                    <td>{it.name}</td>
                    <td className="text-muted">{it.uom}</td>
                    <td className="text-muted">{it.packing}</td>
                    <td className="r">{it.pcs}</td>
                    <td className="r xp-amt">{fmt(it.rate)}</td>
                    <td className="r xp-amt">{fmt(it.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div
            className="qt-inv-totals"
            style={{ maxWidth: 280, marginLeft: "auto", marginTop: 8 }}
          >
            <div className="qt-inv-total-row">
              <span>Total Qty</span>
              <span>{totalQty}</span>
            </div>
            <div className="qt-inv-total-row">
              <span>Net Amount</span>
              <span>{fmt(netAmount)}</span>
            </div>
            <div className="qt-inv-total-row">
              <span>Bill Amount</span>
              <span>{fmt(billAmount)}</span>
            </div>
            <div className="qt-inv-total-row">
              <span>Previous Balance</span>
              <span>{fmt(previousBalance)}</span>
            </div>
            <div className="qt-inv-total-row">
              <span>Balance</span>
              <span>{fmt(balance)}</span>
            </div>
            <div className="qt-inv-total-row bold">
              <span>Net Payable</span>
              <span>Rs. {fmt(netReceivable)}</span>
            </div>
          </div>
        </div>
        <div className="xp-modal-footer">
          <button className="xp-btn xp-btn-sm dmg-out-btn" onClick={doPrint}>
            Print / PDF
          </button>
          <button className="xp-btn xp-btn-sm" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN PAGE — DAMAGE OUT
══════════════════════════════════════════════════════════ */
export default function DamageOutPage() {
  const [invoiceNo, setInvoiceNo] = useState("DO-00001");
  const [invoiceDate, setInvoiceDate] = useState(isoDate());
  const [buyerName, setBuyerName] = useState("COUNTER SALE");
  const [buyerCode, setBuyerCode] = useState("8");
  const [rows, setRows] = useState([{ ...EMPTY_ROW }]);
  const [activeRow, setActiveRow] = useState(0);
  const [previousBalance, setPreviousBalance] = useState(0);
  const [showSearch, setShowSearch] = useState(false);
  const [showPrint, setShowPrint] = useState(false);
  const [products, setProducts] = useState([]);
  const [msg, setMsg] = useState({ text: "", type: "" });
  const [saving, setSaving] = useState(false);

  const [savedRecords, setSavedRecords] = useState([]);
  const [loadingRec, setLoadingRec] = useState(false);
  const [selId, setSelId] = useState(null);
  const [recSearch, setRecSearch] = useState("");

  // FIX 1: Hold Bills — working
  const [holdBills, setHoldBills] = useState([]);

  // FIX 2: Auto-open receipt after save
  const [receiptRecord, setReceiptRecord] = useState(null);

  const rowRefs = useRef([]);

  const totalQty = rows.reduce((s, r) => s + Number(r.qty || 0), 0);
  const netAmount = rows.reduce((s, r) => s + Number(r.amount || 0), 0);
  const billAmount = netAmount;
  const balance = billAmount + Number(previousBalance || 0);
  const netReceivable = balance;

  useEffect(() => {
    fetchProducts();
    fetchNextInvoice();
    fetchSaved();
  }, []);

  useEffect(() => {
    const h = (e) => {
      if (e.key === "F3") {
        e.preventDefault();
        setShowSearch(true);
      }
      if (e.key === "F4") {
        e.preventDefault();
        handleHoldBill();
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
  }, [rows, buyerName, invoiceDate, invoiceNo, previousBalance, buyerCode]);

  const fetchProducts = async () => {
    try {
      const { data } = await api.get(EP.PRODUCTS.GET_ALL);
      if (data.success) setProducts(data.data);
    } catch {}
  };

  const fetchNextInvoice = async () => {
    try {
      const { data } = await api.get(EP.DAMAGE.NEXT_INVOICE("out"));
      if (data.success) setInvoiceNo(data.invoiceNo);
    } catch {}
  };

  const fetchSaved = async (search = "") => {
    setLoadingRec(true);
    try {
      const { data } = await api.get(EP.DAMAGE.GET_OUT(search));
      if (data.success) setSavedRecords(data.data || []);
    } catch {
      setSavedRecords([]);
    }
    setLoadingRec(false);
  };

  const showMsg = (text, type = "success") => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: "", type: "" }), 3000);
  };

  // FIX 1: Hold current bill
  const handleHoldBill = () => {
    const validRows = rows.filter((r) => r.name && r.qty > 0);
    if (!validRows.length) {
      showMsg("Nothing to hold", "error");
      return;
    }
    const bill = {
      invoiceNo,
      invoiceDate,
      buyerName,
      buyerCode,
      rows: validRows,
      previousBalance,
    };
    setHoldBills((prev) => [...prev, bill]);
    showMsg("Bill held (F4)");
    resetFormKeepHold();
  };

  // Restore held bill
  const handleRestoreHold = (bill, idx) => {
    setInvoiceNo(bill.invoiceNo);
    setInvoiceDate(bill.invoiceDate);
    setBuyerName(bill.buyerName);
    setBuyerCode(bill.buyerCode || "");
    setRows(bill.rows);
    setPreviousBalance(bill.previousBalance || 0);
    setHoldBills((prev) => prev.filter((_, i) => i !== idx));
    showMsg("Hold restored");
    window.scrollTo(0, 0);
  };

  const resetFormKeepHold = () => {
    setInvoiceDate(isoDate());
    setBuyerName("COUNTER SALE");
    setBuyerCode("8");
    setRows([{ ...EMPTY_ROW }]);
    setActiveRow(0);
    setPreviousBalance(0);
    setSelId(null);
    fetchNextInvoice();
  };

  const handleProductSelect = (product) => {
    const qty = rows[activeRow]?.qty || 1;
    const rate = product._rate || 0;
    setRows((prev) => {
      const next = [...prev];
      next[activeRow] = {
        ...next[activeRow],
        code: product.code || "",
        name: product._name || product.description || "",
        uom: product._meas || "",
        // FIX 3: packing as free text
        packing: product._pack ? String(product._pack) : "",
        pcs: product._pack || 1,
        qty,
        rate,
        amount: qty * rate,
      };
      return next;
    });
    setShowSearch(false);
    setTimeout(() => rowRefs.current[activeRow]?.qty?.focus(), 30);
  };

  const updateRow = (i, field, val) => {
    setRows((prev) => {
      const next = [...prev];
      const r = { ...next[i], [field]: val };
      if (["qty", "rate"].includes(field)) {
        const q = field === "qty" ? Number(val) : Number(r.qty);
        const rt = field === "rate" ? Number(val) : Number(r.rate);
        r.amount = q * rt;
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
      const order = ["code", "name", "uom", "packing", "pcs", "qty", "rate"];
      const fi = order.indexOf(field);
      if (fi < order.length - 1) rowRefs.current[i]?.[order[fi + 1]]?.focus();
      else if (i === rows.length - 1) addRowAfter(i);
      else rowRefs.current[i + 1]?.code?.focus();
    }
  };

  // FIX 2: Save + auto-open receipt
  const handleSave = async () => {
    const validRows = rows.filter((r) => r.name && r.qty > 0);
    if (!validRows.length) {
      showMsg("Add at least one product", "error");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        type: "out",
        invoiceNo,
        invoiceDate,
        buyerName,
        buyerCode,
        items: validRows,
        totalQty,
        netAmount,
        billAmount,
        previousBalance: Number(previousBalance) || 0,
        balance,
        netReceivable,
      };
      const { data } = await api.post(EP.DAMAGE.CREATE, payload);
      if (data.success) {
        showMsg("Saved: " + data.data.invoiceNo);
        fetchSaved(recSearch);
        fetchNextInvoice();
        // Auto-open receipt
        setReceiptRecord({
          invoiceNo: data.data.invoiceNo,
          invoiceDate,
          buyerName,
          items: validRows,
          totalQty,
          netAmount,
          billAmount,
          previousBalance: Number(previousBalance) || 0,
          balance,
          netReceivable,
        });
      } else showMsg(data.message || "Save failed", "error");
    } catch (e) {
      showMsg(
        (e.response && e.response.data && e.response.data.message) ||
          "Save failed",
        "error",
      );
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!selId) return showMsg("Select a record first", "error");
    if (!confirm("Delete this damage record?")) return;
    try {
      const { data } = await api.delete(EP.DAMAGE.DELETE(selId));
      if (data.success) {
        showMsg("Deleted");
        setSelId(null);
        fetchSaved(recSearch);
      } else showMsg(data.message || "Delete failed", "error");
    } catch {
      showMsg("Delete failed", "error");
    }
  };

  const handleLoad = (rec) => {
    setInvoiceNo(rec.invoiceNo);
    setInvoiceDate(rec.invoiceDate);
    setBuyerName(rec.buyerName || "COUNTER SALE");
    setBuyerCode(rec.buyerCode || "");
    setRows(rec.items && rec.items.length ? rec.items : [{ ...EMPTY_ROW }]);
    setPreviousBalance(rec.previousBalance || 0);
    setSelId(rec._id);
    showMsg("Loaded: " + rec.invoiceNo);
    window.scrollTo(0, 0);
  };

  const handlePreview = () => {
    const validRows = rows.filter((r) => r.name && r.qty > 0);
    if (!validRows.length) {
      showMsg("Add at least one product", "error");
      return;
    }
    setShowPrint(true);
  };

  const resetForm = () => {
    resetFormKeepHold();
    setHoldBills([]);
  };

  const handleRecSearch = (v) => {
    setRecSearch(v);
    clearTimeout(window._dmgOutTimer);
    window._dmgOutTimer = setTimeout(() => fetchSaved(v), 300);
  };

  const previewRecord = {
    invoiceNo,
    invoiceDate,
    buyerName,
    items: rows.filter((r) => r.name && r.qty > 0),
    totalQty,
    netAmount,
    billAmount,
    previousBalance: Number(previousBalance) || 0,
    balance,
    netReceivable,
  };

  return (
    <div className="qt-page dmg-page dmg-out-page">
      {showSearch && (
        <SearchModal
          allProducts={products}
          onSelect={handleProductSelect}
          onClose={() => setShowSearch(false)}
        />
      )}
      {showPrint && (
        <PrintModal
          record={previewRecord}
          onClose={() => setShowPrint(false)}
        />
      )}

      {/* FIX 2: Auto-open receipt after save */}
      {receiptRecord && (
        <PrintModal
          record={receiptRecord}
          onClose={() => setReceiptRecord(null)}
        />
      )}

      {/* Titlebar */}
      <div className="xp-titlebar dmg-titlebar-out">
        <svg
          width="15"
          height="15"
          viewBox="0 0 16 16"
          fill="rgba(255,255,255,0.85)"
        >
          <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
          <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708" />
        </svg>
        <span className="xp-tb-title">Damage Out - {SHOP_NAME}</span>
        <div className="xp-tb-actions">
          <div className="xp-tb-divider" />
          <button className="xp-cap-btn">-</button>
          <button className="xp-cap-btn">[]</button>
          <button className="xp-cap-btn xp-cap-close">X</button>
        </div>
      </div>

      {msg.text && (
        <div
          className={
            "xp-alert " +
            (msg.type === "success" ? "xp-alert-success" : "xp-alert-error")
          }
          style={{ margin: "4px 10px 0" }}
        >
          {msg.text}
        </div>
      )}

      <div className="qt-body">
        {/* Header Band */}
        <div className="dmg-header-band">
          <div className="dmg-label-badge dmg-out-badge">Damage Out</div>
          <div className="qt-field-pair">
            <label>Invoice #</label>
            <input
              className="xp-input"
              style={{ width: 110 }}
              value={invoiceNo}
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
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              tabIndex={-1}
            />
          </div>
          <div className="qt-field-pair">
            <label>Time</label>
            <input
              className="xp-input"
              style={{ width: 100 }}
              readOnly
              tabIndex={-1}
              value={new Date().toLocaleTimeString("en-PK")}
            />
          </div>
          <div className="xp-toolbar-divider" />
          <div className="qt-key-hints">
            <span>
              <span className="k">F3</span> Search
            </span>
            <span>
              <span className="k">F4</span> Hold
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

        {/* Product Strip */}
        <div className="dmg-product-strip">
          <div style={{ flex: 1 }}>
            <label className="xp-label">Select Product</label>
            <div
              style={{
                display: "flex",
                gap: 6,
                marginTop: 2,
                flexWrap: "wrap",
              }}
            >
              <input
                className="xp-input dmg-product-input"
                readOnly
                placeholder="Click or F3 to search..."
                onClick={() => setShowSearch(true)}
                tabIndex={1}
              />
              {/* FIX 3: Packing = free text */}
              <div className="qt-field-pair" style={{ margin: 0 }}>
                <label>Packing</label>
                <input
                  type="text"
                  className="xp-input"
                  style={{ width: 70 }}
                  tabIndex={2}
                  value={rows[activeRow]?.packing || ""}
                  onChange={(e) =>
                    updateRow(activeRow, "packing", e.target.value)
                  }
                  placeholder="e.g. 12"
                />
              </div>
              <div className="qt-field-pair" style={{ margin: 0 }}>
                <label>Pc(s)</label>
                <input
                  type="number"
                  className="xp-input"
                  style={{ width: 60 }}
                  tabIndex={3}
                  value={rows[activeRow]?.pcs || 1}
                  onChange={(e) =>
                    updateRow(activeRow, "pcs", Number(e.target.value))
                  }
                />
              </div>
              <div className="qt-field-pair" style={{ margin: 0 }}>
                <label>Rate</label>
                <input
                  type="number"
                  className="xp-input"
                  style={{ width: 90 }}
                  tabIndex={4}
                  value={rows[activeRow]?.rate || 0}
                  onChange={(e) =>
                    updateRow(activeRow, "rate", Number(e.target.value))
                  }
                />
              </div>
              <div className="qt-field-pair" style={{ margin: 0 }}>
                <label>Amount</label>
                <input
                  className="xp-input"
                  style={{ width: 90 }}
                  readOnly
                  tabIndex={-1}
                  value={fmt(rows[activeRow]?.amount || 0)}
                />
              </div>
              <button
                className="xp-btn xp-btn-sm dmg-out-btn"
                onClick={() => setShowSearch(true)}
                tabIndex={5}
              >
                F3
              </button>
              <button
                className="xp-btn xp-btn-sm"
                style={{ background: "#e8f5e9" }}
                onClick={() => {
                  if (!rows[activeRow]?.name)
                    return showMsg("Select a product first", "error");
                  if (activeRow === rows.length - 1) addRowAfter(activeRow);
                  else rowRefs.current[activeRow + 1]?.code?.focus();
                }}
                tabIndex={6}
              >
                Add
              </button>
              <button
                className="xp-btn xp-btn-sm"
                style={{ background: "#fdecea", color: "var(--xp-red)" }}
                onClick={() => updateRow(activeRow, "name", "")}
                tabIndex={7}
              >
                Edit
              </button>
              <button
                className="xp-btn xp-btn-sm"
                style={{ background: "#fdecea", color: "var(--xp-red)" }}
                onClick={() => deleteRow(activeRow)}
                tabIndex={8}
              >
                Remove
              </button>
            </div>
            <div
              style={{
                fontSize: "var(--xp-fs-xs)",
                color: "#777",
                marginTop: 3,
              }}
            >
              Select Product
            </div>
          </div>
        </div>

        <div className="dmg-main-layout">
          {/* Items Table */}
          <div className="dmg-table-area">
            <div className="xp-table-panel">
              <div className="xp-table-scroll" style={{ maxHeight: 280 }}>
                <table className="xp-table dmg-items-table">
                  <thead>
                    <tr>
                      <th style={{ width: 36 }}>Sr#</th>
                      <th style={{ width: 80 }}>Code</th>
                      <th>Name</th>
                      <th style={{ width: 65 }}>UOM</th>
                      <th style={{ width: 65 }}>Packing</th>
                      <th style={{ width: 50 }} className="r">
                        Pc(s)
                      </th>
                      <th style={{ width: 55 }} className="r">
                        Rate
                      </th>
                      <th style={{ width: 85 }} className="r">
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
                          className={
                            activeRow === i
                              ? "qt-active-row dmg-out-active"
                              : ""
                          }
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
                              onChange={(e) =>
                                updateRow(i, "code", e.target.value)
                              }
                              onKeyDown={(e) => onRowKeyDown(e, i, "code")}
                              tabIndex={100 + i * 10 + 1}
                            />
                          </td>
                          <td>
                            <input
                              className="qt-cell w-desc"
                              ref={(el) => (rowRefs.current[i].name = el)}
                              value={row.name}
                              onChange={(e) =>
                                updateRow(i, "name", e.target.value)
                              }
                              onKeyDown={(e) => {
                                if (e.key === "F3") {
                                  e.preventDefault();
                                  setActiveRow(i);
                                  setShowSearch(true);
                                } else onRowKeyDown(e, i, "name");
                              }}
                              tabIndex={100 + i * 10 + 2}
                            />
                          </td>
                          <td>
                            <input
                              className="qt-cell w-meas"
                              ref={(el) => (rowRefs.current[i].uom = el)}
                              value={row.uom}
                              onChange={(e) =>
                                updateRow(i, "uom", e.target.value)
                              }
                              onKeyDown={(e) => onRowKeyDown(e, i, "uom")}
                              tabIndex={100 + i * 10 + 3}
                            />
                          </td>
                          {/* FIX 3: Packing free text in table */}
                          <td>
                            <input
                              className="qt-cell"
                              style={{ width: "100%" }}
                              ref={(el) => (rowRefs.current[i].packing = el)}
                              value={row.packing || ""}
                              onChange={(e) =>
                                updateRow(i, "packing", e.target.value)
                              }
                              onKeyDown={(e) => onRowKeyDown(e, i, "packing")}
                              tabIndex={100 + i * 10 + 4}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className="qt-cell w-sm"
                              ref={(el) => (rowRefs.current[i].pcs = el)}
                              value={row.pcs}
                              onChange={(e) =>
                                updateRow(i, "pcs", e.target.value)
                              }
                              onKeyDown={(e) => onRowKeyDown(e, i, "pcs")}
                              tabIndex={100 + i * 10 + 5}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className="qt-cell w-md"
                              ref={(el) => (rowRefs.current[i].qty = el)}
                              value={row.qty}
                              onChange={(e) =>
                                updateRow(i, "qty", e.target.value)
                              }
                              onKeyDown={(e) => onRowKeyDown(e, i, "qty")}
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
                              X
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* FIX 1: Hold Bills Panel — fully working */}
          <div className="dmg-hold-panel">
            <div className="dmg-hold-title">
              Hold Bills
              <button
                className="xp-btn xp-btn-sm"
                style={{ float: "right", fontSize: 10, padding: "1px 6px" }}
                onClick={handleHoldBill}
                title="Hold current bill (F4)"
              >
                F4 Hold
              </button>
            </div>
            <table className="xp-table">
              <thead>
                <tr>
                  <th style={{ width: 28 }}>#</th>
                  <th>Bill #</th>
                  <th className="r">Amount</th>
                  <th>Party</th>
                </tr>
              </thead>
              <tbody>
                {holdBills.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="xp-empty"
                      style={{ fontSize: 11 }}
                    >
                      No held bills
                    </td>
                  </tr>
                ) : (
                  holdBills.map((b, i) => (
                    <tr
                      key={i}
                      style={{ cursor: "pointer" }}
                      onClick={() => handleRestoreHold(b, i)}
                      title="Click to restore"
                    >
                      <td className="text-muted">{i + 1}</td>
                      <td>
                        <span className="xp-code">{b.invoiceNo}</span>
                      </td>
                      <td className="r xp-amt">
                        {fmt(
                          b.rows.reduce((s, r) => s + Number(r.amount || 0), 0),
                        )}
                      </td>
                      <td className="text-muted" style={{ fontSize: 10 }}>
                        {b.buyerName}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Totals */}
        <div className="dmg-footer-totals">
          <div className="dmg-total-grp">
            <div className="dmg-tot-item">
              <label>Total Quantity</label>
              <input
                className="xp-input dmg-tot-input"
                readOnly
                value={totalQty}
              />
            </div>
            <div className="dmg-tot-item">
              <label>Net Amount</label>
              <input
                className="xp-input dmg-tot-input"
                readOnly
                value={fmt(netAmount)}
              />
            </div>
            <div className="dmg-tot-item">
              <label>Bill Amount</label>
              <input
                className="xp-input dmg-tot-input"
                readOnly
                value={fmt(billAmount)}
              />
            </div>
          </div>
          <div className="dmg-total-grp" style={{ marginLeft: "auto" }}>
            <div className="dmg-tot-item">
              <label>Balance</label>
              <input
                className="xp-input dmg-tot-input"
                readOnly
                value={fmt(balance)}
              />
            </div>
          </div>
        </div>

        <div className="dmg-footer-buyer">
          <div className="dmg-tot-item">
            <label>Code</label>
            <input
              className="xp-input"
              style={{ width: 60 }}
              value={buyerCode}
              onChange={(e) => setBuyerCode(e.target.value)}
              tabIndex={20}
            />
          </div>
          <div className="dmg-tot-item" style={{ flex: 1 }}>
            <label>Buyer Name</label>
            <input
              className="xp-input"
              style={{ width: "100%" }}
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              tabIndex={21}
            />
          </div>
          <div className="dmg-tot-item">
            <label>Previous Balance</label>
            <input
              type="number"
              className="xp-input"
              style={{ width: 110 }}
              value={previousBalance}
              onChange={(e) => setPreviousBalance(e.target.value)}
              tabIndex={22}
            />
          </div>
          <div className="dmg-tot-item">
            <label>Net Payable</label>
            <input
              className="xp-input"
              style={{ width: 110 }}
              readOnly
              value={fmt(netReceivable)}
            />
          </div>
        </div>

        {/* Action Bar */}
        <div className="dmg-action-bar">
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: "var(--xp-fs-xs)",
            }}
          >
            <input type="checkbox" /> Send SMS
          </label>
          <button
            className="xp-btn xp-btn-sm dmg-act-btn"
            onClick={() => fetchSaved(recSearch)}
          >
            Refresh
          </button>
          <button
            className="xp-btn xp-btn-sm dmg-out-btn dmg-act-btn"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Record"}
          </button>
          <button
            className="xp-btn xp-btn-sm dmg-act-btn"
            onClick={() => {
              if (!selId) return showMsg("Select a record first", "error");
              const r = savedRecords.find((x) => x._id === selId);
              if (r) handleLoad(r);
            }}
          >
            Edit Record
          </button>
          <button
            className="xp-btn xp-btn-danger xp-btn-sm dmg-act-btn"
            onClick={handleDelete}
            disabled={!selId}
          >
            Delete Record
          </button>
          <button
            className="xp-btn xp-btn-sm dmg-act-btn"
            onClick={handlePreview}
          >
            F5 Preview
          </button>
          <button
            className="xp-btn xp-btn-sm dmg-act-btn"
            onClick={handleHoldBill}
          >
            F4 Hold
          </button>
          <button className="xp-btn xp-btn-sm dmg-act-btn" onClick={resetForm}>
            F2 New
          </button>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginLeft: "auto",
            }}
          >
            <label style={{ fontSize: "var(--xp-fs-xs)" }}>
              <input type="radio" name="printModeOut" defaultChecked /> Thermal
            </label>
            <label style={{ fontSize: "var(--xp-fs-xs)" }}>
              <input type="radio" name="printModeOut" /> Laser
            </label>
          </div>
          <button
            className="xp-btn xp-btn-danger xp-btn-sm"
            onClick={resetForm}
          >
            X Close
          </button>
        </div>

        {/* Saved Records */}
        <div className="qt-saved-section">
          <div className="qt-saved-header">
            <span className="qt-saved-title">Saved Damage Out Records</span>
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
                value={recSearch}
                onChange={(e) => handleRecSearch(e.target.value)}
                placeholder="Search invoice / buyer..."
              />
            </div>
            <span style={{ fontSize: "var(--xp-fs-xs)", color: "#666" }}>
              {savedRecords.length} record(s)
            </span>
            <button
              className="xp-btn xp-btn-sm"
              onClick={() => fetchSaved(recSearch)}
              disabled={loadingRec}
            >
              Refresh
            </button>
            <button
              className="xp-btn xp-btn-danger xp-btn-sm"
              onClick={handleDelete}
              disabled={!selId}
            >
              Delete
            </button>
          </div>
          <div className="qt-saved-table-wrap">
            <table className="qt-saved-table">
              <thead>
                <tr>
                  <th style={{ width: 32 }}>#</th>
                  <th style={{ width: 100 }}>Invoice #</th>
                  <th style={{ width: 95 }}>Date</th>
                  <th>Buyer</th>
                  <th className="r" style={{ width: 65 }}>
                    Items
                  </th>
                  <th className="r" style={{ width: 65 }}>
                    Qty
                  </th>
                  <th className="r" style={{ width: 110 }}>
                    Net Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {loadingRec && (
                  <tr>
                    <td colSpan={7} className="xp-loading">
                      Loading...
                    </td>
                  </tr>
                )}
                {!loadingRec && savedRecords.length === 0 && (
                  <tr>
                    <td colSpan={7} className="xp-empty">
                      No records found
                    </td>
                  </tr>
                )}
                {!loadingRec &&
                  savedRecords.map((rec, i) => (
                    <tr
                      key={rec._id}
                      className={selId === rec._id ? "qt-sel-row" : ""}
                      onClick={() => setSelId(rec._id)}
                      onDoubleClick={() => handleLoad(rec)}
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
                        <span className="xp-code">{rec.invoiceNo}</span>
                      </td>
                      <td className="text-muted">{rec.invoiceDate}</td>
                      <td>
                        {rec.buyerName || (
                          <span className="text-muted">Counter</span>
                        )}
                      </td>
                      <td className="r">{rec.items ? rec.items.length : 0}</td>
                      <td className="r">{rec.totalQty || 0}</td>
                      <td className="r xp-amt">{fmt(rec.netAmount)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="xp-statusbar">
        <div className="xp-status-pane">DO {invoiceNo}</div>
        <div className="xp-status-pane">{buyerName}</div>
        <div className="xp-status-pane">
          Items: {rows.filter((r) => r.name).length}
        </div>
        <div className="xp-status-pane">Qty: {totalQty}</div>
        <div className="xp-status-pane">
          Net:{" "}
          <strong style={{ fontFamily: "var(--xp-mono)", marginLeft: 3 }}>
            PKR {fmt(netAmount)}
          </strong>
        </div>
        <div className="xp-status-pane">
          Hold: {holdBills.length} | Saved: {savedRecords.length}
        </div>
      </div>
    </div>
  );
}
