import { useState, useRef } from "react";
import "../styles/SaleHistoryPage.css";
import "../styles/SaleReturnPage.css";
import api from "../api/api.js";
import EP from "../api/apiEndpoints.js";

const isoDate = () => new Date().toISOString().split("T")[0];
const fmt = (n) => Number(n || 0).toLocaleString("en-PK");

/* ── Inline SVG icons ── */
const Ic = {
  ret: (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M1.146 4.854a.5.5 0 0 1 0-.708l4-4a.5.5 0 1 1 .708.708L2.707 4H12.5A2.5 2.5 0 0 1 15 6.5v8a.5.5 0 0 1-1 0v-8A1.5 1.5 0 0 0 12.5 5H2.707l3.147 3.146a.5.5 0 1 1-.708.708z"
      />
    </svg>
  ),
  search: (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
      <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0" />
    </svg>
  ),
  save: (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
      <path d="M2 1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H9.5a1 1 0 0 0-1 1v7.293l2.646-2.647a.5.5 0 0 1 .708.708l-3.5 3.5a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L7.5 9.293V2a2 2 0 0 1 2-2H14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2z" />
    </svg>
  ),
  reset: (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2z" />
      <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466" />
    </svg>
  ),
  cal: (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
      <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5M2 2a1 1 0 0 0-1 1v1h14V3a1 1 0 0 0-1-1zm13 3H1v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1z" />
    </svg>
  ),
  inv: (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
      <path d="M1.92.506a.5.5 0 0 1 .434.14L3 1.293l.646-.647a.5.5 0 0 1 .708 0L5 1.293l.646-.647a.5.5 0 0 1 .708 0L7 1.293l.646-.647a.5.5 0 0 1 .708 0L9 1.293l.646-.647a.5.5 0 0 1 .708 0l.646.647.646-.647a.5.5 0 0 1 .708 0l.646.647.646-.647a.5.5 0 0 1 .801.13l.5 1A.5.5 0 0 1 15 2v12a.5.5 0 0 1-.053.224l-.5 1a.5.5 0 0 1-.8.13L13 14.707l-.646.647a.5.5 0 0 1-.708 0L11 14.707l-.646.647a.5.5 0 0 1-.708 0L9 14.707l-.646.647a.5.5 0 0 1-.708 0L7 14.707l-.646.647a.5.5 0 0 1-.708 0L5 14.707l-.646.647a.5.5 0 0 1-.708 0L3 14.707l-.646.647a.5.5 0 0 1-.801-.13l-.5-1A.5.5 0 0 1 1 14V2a.5.5 0 0 1 .053-.224l.5-1a.5.5 0 0 1 .367-.27" />
    </svg>
  ),
  person: (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0m4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4" />
    </svg>
  ),
  money: (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4m0 1a3 3 0 1 1 0-6 3 3 0 0 1 0 6" />
      <path d="M0 4a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H1a1 1 0 0 1-1-1zm3 0a2 2 0 0 1-2 2v4a2 2 0 0 1 2 2h10a2 2 0 0 1 2-2V6a2 2 0 0 1-2-2z" />
    </svg>
  ),
  note: (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
      <path d="M2 1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H2zm6 2.5a.5.5 0 0 1 0 1H4a.5.5 0 0 1 0-1h4zm4 0a.5.5 0 0 1 0 1h-1.5a.5.5 0 0 1 0-1H12zm-9 3a.5.5 0 0 1 0 1H4a.5.5 0 0 1 0-1h-.5zm4 0a.5.5 0 0 1 0 1H5.5a.5.5 0 0 1 0-1H7zm-3 3a.5.5 0 0 1 0 1H4a.5.5 0 0 1 0-1h.5zm3.5 0a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1H8z" />
    </svg>
  ),
  warn: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="M7.938 2.016A.13.13 0 0 1 8.002 2a.13.13 0 0 1 .063.016.15.15 0 0 1 .054.057l6.857 11.667c.036.06.035.124.002.183a.2.2 0 0 1-.054.06.1.1 0 0 1-.066.017H1.146a.1.1 0 0 1-.066-.017.2.2 0 0 1-.054-.06.18.18 0 0 1 .002-.183L7.884 2.073a.15.15 0 0 1 .054-.057m1.044-.45a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767z" />
      <path d="M7.002 12a1 1 0 1 1 2 0 1 1 0 0 1-2 0M7.1 5.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0z" />
    </svg>
  ),
  check: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
      <path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05" />
    </svg>
  ),
  inbox: (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
      <path d="M4.98 4a.5.5 0 0 0-.39.188L1.54 8H6a.5.5 0 0 1 .5.5 1.5 1.5 0 1 0 3 0A.5.5 0 0 1 10 8h4.46l-3.05-3.812A.5.5 0 0 0 11.02 4zm-1.17-.437A1.5 1.5 0 0 1 4.98 3h6.04a1.5 1.5 0 0 1 1.17.563l3.7 4.625a.5.5 0 0 1 .106.374l-.39 3.124A1.5 1.5 0 0 1 14.117 13H1.883a1.5 1.5 0 0 1-1.489-1.314l-.39-3.124a.5.5 0 0 1 .106-.374z" />
    </svg>
  ),
  ok: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425z" />
    </svg>
  ),
};

/* ─────────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────────── */
export default function SaleReturnPage() {
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [foundSale, setFoundSale] = useState(null);
  const [returnItems, setReturnItems] = useState([]);
  const [returnDate, setReturnDate] = useState(isoDate());
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [msg, setMsg] = useState({ text: "", type: "" });
  const searchRef = useRef(null);

  const showMsg = (text, type = "success") => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: "", type: "" }), 4000);
  };

  const searchInvoice = async () => {
    if (!invoiceSearch.trim()) return;
    setSearching(true);
    setFoundSale(null);
    setReturnItems([]);
    try {
      const { data } = await api.get(
        `${EP.SALES.GET_ALL}?search=${encodeURIComponent(invoiceSearch.trim())}&saleType=sale`,
      );
      if (data.success && data.data.length > 0) {
        const sale = data.data[0];
        setFoundSale(sale);
        setReturnItems(
          sale.items.map((item) => ({
            ...item,
            returnQty: item.qty,
            returnAmount: item.amount,
            selected: true,
          })),
        );
      } else {
        showMsg("No sale found for that invoice / customer", "error");
      }
    } catch {
      showMsg("Search failed", "error");
    }
    setSearching(false);
  };

  const updateReturnQty = (idx, val) => {
    setReturnItems((prev) =>
      prev.map((item, i) => {
        if (i !== idx) return item;
        const q = Math.min(Math.max(0, parseFloat(val) || 0), item.qty);
        return { ...item, returnQty: q, returnAmount: q * item.rate };
      }),
    );
  };

  const toggleItem = (idx) => {
    setReturnItems((prev) =>
      prev.map((item, i) =>
        i === idx ? { ...item, selected: !item.selected } : item,
      ),
    );
  };

  const selectedItems = returnItems.filter(
    (i) => i.selected && i.returnQty > 0,
  );
  const returnTotal = selectedItems.reduce((s, i) => s + i.returnAmount, 0);

  const saveReturn = async () => {
    if (!foundSale) return;
    if (!selectedItems.length) {
      alert("Select at least one item to return");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        originalSaleId: foundSale._id,
        invoiceDate: returnDate,
        items: selectedItems.map((i) => ({
          productId: i.productId,
          code: i.code,
          description: i.description,
          measurement: i.measurement,
          qty: i.returnQty,
          rate: i.rate,
          disc: 0,
          amount: i.returnAmount,
        })),
        remarks,
      };
      const { data } = await api.post(EP.SALES.CREATE_RETURN, payload);
      if (data.success) {
        showMsg(`Return saved: ${data.data.invoiceNo}`);
        setFoundSale(null);
        setReturnItems([]);
        setInvoiceSearch("");
        setRemarks("");
        searchRef.current?.focus();
      } else showMsg(data.message, "error");
    } catch (e) {
      showMsg(e.response?.data?.message || "Save failed", "error");
    }
    setLoading(false);
  };

  const doReset = () => {
    setFoundSale(null);
    setReturnItems([]);
    setInvoiceSearch("");
    setRemarks("");
    searchRef.current?.focus();
  };

  return (
    <div className="sr-page">
      {/* ── Titlebar ── */}
      <div className="xp-titlebar">
        <span style={{ marginRight: 4, display: "flex" }}>{Ic.ret}</span>
        <span className="xp-tb-title">
          Sale Return — Asim Electric &amp; Electronic Store
        </span>
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
        <div className={`sh-msg ${msg.type}`}>
          {msg.type === "success" ? Ic.check : Ic.warn}
          {msg.text}
        </div>
      )}

      {/* ── Page header ── */}
      <div className="sh-header">
        <div className="sh-header-title">{Ic.ret} Sale Return</div>
        <div className="sh-header-meta">
          <span className="sh-stat">
            Search original invoice to process return
          </span>
        </div>
      </div>

      {/* ── Search bar ── */}
      <div className="sr-search-bar">
        <label className="sr-label">Invoice # / Customer Name</label>
        <input
          ref={searchRef}
          type="text"
          className="sr-input"
          value={invoiceSearch}
          onChange={(e) => setInvoiceSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && searchInvoice()}
          placeholder="Enter Invoice # or customer name and press Enter…"
          autoFocus
        />
        <button className="btn" onClick={searchInvoice} disabled={searching}>
          {searching ? <>{Ic.search} Searching…</> : <>{Ic.search} Search</>}
        </button>

        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <label className="sr-label">{Ic.cal} Return Date</label>
          <input
            type="date"
            className="sr-input-sm"
            value={returnDate}
            onChange={(e) => setReturnDate(e.target.value)}
          />
        </div>
      </div>

      {/* ── Original sale info strip ── */}
      {foundSale && (
        <div className="sr-orig-info">
          <div className="sr-orig-field">
            {Ic.inv}
            <span className="sr-orig-label">Invoice #</span>
            <span className="sr-orig-val blue">{foundSale.invoiceNo}</span>
          </div>
          <div className="sr-orig-field">
            {Ic.cal}
            <span className="sr-orig-label">Date</span>
            <span className="sr-orig-val">{foundSale.invoiceDate}</span>
          </div>
          <div className="sr-orig-field">
            {Ic.person}
            <span className="sr-orig-label">Customer</span>
            <span className="sr-orig-val bold">
              {foundSale.customerName || "Counter Sale"}
            </span>
          </div>
          <div className="sr-orig-field">
            {Ic.money}
            <span className="sr-orig-label">Original Total</span>
            <span className="sr-orig-val blue">
              PKR {fmt(foundSale.netTotal)}
            </span>
          </div>
          {/* selected count chip */}
          <div className="sr-orig-field" style={{ marginLeft: "auto" }}>
            <span
              style={{
                fontSize: "var(--xp-fs-xs)",
                fontWeight: 700,
                background: "#dbeafe",
                color: "#1e3a8a",
                border: "1px solid #93c5fd",
                padding: "2px 8px",
                borderRadius: 2,
              }}
            >
              {selectedItems.length} of {returnItems.length} items selected
            </span>
          </div>
        </div>
      )}

      {/* ── Return items table ── */}
      {foundSale && (
        <>
          <div className="sr-table-wrap" style={{ margin: "6px 10px 0" }}>
            <table className="sh-table">
              <thead>
                <tr>
                  <th style={{ width: 32 }}>
                    <input
                      type="checkbox"
                      checked={
                        returnItems.length > 0 &&
                        returnItems.every((i) => i.selected)
                      }
                      onChange={(e) =>
                        setReturnItems((prev) =>
                          prev.map((item) => ({
                            ...item,
                            selected: e.target.checked,
                          })),
                        )
                      }
                      title="Toggle all"
                    />
                  </th>
                  <th style={{ width: 32 }}>#</th>
                  <th style={{ width: 72 }}>Code</th>
                  <th>Description</th>
                  <th style={{ width: 80 }}>UOM</th>
                  <th className="r" style={{ width: 65 }}>
                    Orig Qty
                  </th>
                  <th className="r" style={{ width: 80 }}>
                    Rate
                  </th>
                  <th className="r" style={{ width: 85 }}>
                    Orig Amt
                  </th>
                  <th className="r" style={{ width: 88 }}>
                    Return Qty
                  </th>
                  <th className="r" style={{ width: 90 }}>
                    Return Amt
                  </th>
                </tr>
              </thead>
              <tbody>
                {returnItems.map((item, i) => (
                  <tr
                    key={i}
                    className={
                      !item.selected
                        ? "sr-deselected"
                        : i % 2 === 0
                          ? "even"
                          : "odd"
                    }
                  >
                    <td className="c">
                      <input
                        type="checkbox"
                        checked={item.selected}
                        onChange={() => toggleItem(i)}
                      />
                    </td>
                    <td
                      className="c"
                      style={{ color: "#999", fontSize: "var(--xp-fs-xs)" }}
                    >
                      {i + 1}
                    </td>
                    <td className="blue">{item.code}</td>
                    <td style={{ fontWeight: item.selected ? 500 : 400 }}>
                      {item.description}
                    </td>
                    <td style={{ color: "#777" }}>{item.measurement || "—"}</td>
                    <td className="r">{item.qty}</td>
                    <td className="r">{fmt(item.rate)}</td>
                    <td className="r">{fmt(item.amount)}</td>
                    <td className="r">
                      <input
                        type="number"
                        className="sr-qty-input"
                        value={item.returnQty}
                        min={0}
                        max={item.qty}
                        disabled={!item.selected}
                        onChange={(e) => updateReturnQty(i, e.target.value)}
                      />
                    </td>
                    <td
                      className="r bold"
                      style={{
                        color:
                          item.selected && item.returnQty > 0
                            ? "var(--xp-red)"
                            : "#aaa",
                      }}
                    >
                      {fmt(item.returnAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
              {/* Foot total row */}
              <tfoot>
                <tr
                  style={{
                    background:
                      "linear-gradient(180deg,#d7e4f2 0%,#b8d0ec 100%)",
                    borderTop: "2px solid #7aabda",
                  }}
                >
                  <td
                    colSpan={8}
                    style={{
                      padding: "5px 8px",
                      fontWeight: 700,
                      fontSize: "var(--xp-fs-xs)",
                      color: "#333",
                    }}
                  >
                    {selectedItems.length} item(s) selected for return
                  </td>
                  <td
                    className="r"
                    style={{
                      padding: "5px 8px",
                      fontFamily: "var(--xp-mono)",
                      fontWeight: 700,
                      color: "var(--xp-red)",
                    }}
                  >
                    {selectedItems.reduce((s, i) => s + i.returnQty, 0)}
                  </td>
                  <td
                    className="r"
                    style={{
                      padding: "5px 8px",
                      fontFamily: "var(--xp-mono)",
                      fontWeight: 700,
                      color: "var(--xp-red)",
                      fontSize: 13,
                    }}
                  >
                    {fmt(returnTotal)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* ── Bottom bar ── */}
          <div className="sr-bottom">
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {Ic.note}
            </span>
            <div className="sr-remarks">
              <label className="sr-label">Remarks</label>
              <input
                type="text"
                className="sr-remarks-input"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Reason for return (optional)…"
              />
            </div>

            <div className="sr-total-wrap">
              <span className="sr-total-label">Return Total</span>
              <input
                className="sr-total-input"
                value={fmt(returnTotal)}
                readOnly
              />
            </div>

            <div style={{ display: "flex", gap: 5 }}>
              <button className="btn" onClick={doReset}>
                {Ic.reset} Reset
              </button>
              <button
                className="btn sr-save-btn"
                onClick={saveReturn}
                disabled={loading || !selectedItems.length}
              >
                {loading ? <>{Ic.save} Saving…</> : <>{Ic.save} Save Return</>}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Empty state ── */}
      {!foundSale && !searching && (
        <div className="sr-placeholder">
          <svg
            className="sr-placeholder-icon"
            viewBox="0 0 16 16"
            fill="var(--xp-silver-5)"
          >
            <path
              fillRule="evenodd"
              d="M1.146 4.854a.5.5 0 0 1 0-.708l4-4a.5.5 0 1 1 .708.708L2.707 4H12.5A2.5 2.5 0 0 1 15 6.5v8a.5.5 0 0 1-1 0v-8A1.5 1.5 0 0 0 12.5 5H2.707l3.147 3.146a.5.5 0 1 1-.708.708z"
            />
          </svg>
          Search for an invoice above to begin processing a return
        </div>
      )}

      {/* ── Searching spinner ── */}
      {searching && (
        <div className="sr-placeholder">
          <svg
            width="24"
            height="24"
            viewBox="0 0 16 16"
            fill="var(--xp-blue-mid)"
            style={{ animation: "spin 1s linear infinite" }}
          >
            <path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2z" />
            <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466" />
          </svg>
          Searching…
          <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
        </div>
      )}

      {/* ── Status bar ── */}
      <div className="xp-statusbar" style={{ marginTop: "auto" }}>
        <div className="xp-status-pane">
          {foundSale ? (
            <>
              {Ic.inv} {foundSale.invoiceNo} —{" "}
              {foundSale.customerName || "Counter Sale"}
            </>
          ) : (
            "No invoice loaded"
          )}
        </div>
        {foundSale && (
          <>
            <div className="xp-status-pane">
              {returnItems.length} items total
            </div>
            <div className="xp-status-pane">
              {selectedItems.length} selected
            </div>
            <div
              className="xp-status-pane"
              style={{
                color: "var(--xp-red)",
                fontFamily: "var(--xp-mono)",
                fontWeight: 700,
              }}
            >
              Return: PKR {fmt(returnTotal)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
