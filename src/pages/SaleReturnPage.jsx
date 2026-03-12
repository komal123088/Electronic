// pages/SaleReturnPage.jsx
// Search original invoice → select items to return → save return
import { useState, useRef } from "react";
import "../styles/SaleHistoryPage.css"; // reuse same CSS base
import "../styles/SaleReturnPage.css";
import api from "../api/api.js";
import EP from "../api/apiEndpoints.js";

const isoDate = () => new Date().toISOString().split("T")[0];

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

  // ── Search original invoice ──────────────────────────────────────────────
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
        // Pre-fill return items with qty = original qty (user can reduce)
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
        showMsg(`✅ Return saved: ${data.data.invoiceNo}`);
        setFoundSale(null);
        setReturnItems([]);
        setInvoiceSearch("");
        setRemarks("");
        searchRef.current?.focus();
      } else {
        showMsg(`❌ ${data.message}`, "error");
      }
    } catch (e) {
      showMsg(`❌ ${e.response?.data?.message || "Save failed"}`, "error");
    }
    setLoading(false);
  };

  return (
    <div className="sr-page">
      {msg.text && <div className={`sh-msg ${msg.type}`}>{msg.text}</div>}

      {/* Header */}
      <div className="sh-header">
        <div className="sh-header-title">Sale Return</div>
        <div className="sh-header-meta">
          <span className="sh-stat">
            Search original invoice to process return
          </span>
        </div>
      </div>

      {/* Search bar */}
      <div className="sr-search-bar">
        <span className="sr-label">Invoice # / Customer Name</span>
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
          {searching ? "Searching…" : "🔍 Search"}
        </button>
        <div style={{ marginLeft: "auto" }}>
          <span className="sr-label">Return Date</span>
          <input
            type="date"
            className="sr-input-sm"
            value={returnDate}
            onChange={(e) => setReturnDate(e.target.value)}
          />
        </div>
      </div>

      {/* Original sale info */}
      {foundSale && (
        <div className="sr-orig-info">
          <div className="sr-orig-field">
            <span className="sr-orig-label">Invoice #</span>
            <span className="sr-orig-val blue">{foundSale.invoiceNo}</span>
          </div>
          <div className="sr-orig-field">
            <span className="sr-orig-label">Date</span>
            <span className="sr-orig-val">{foundSale.invoiceDate}</span>
          </div>
          <div className="sr-orig-field">
            <span className="sr-orig-label">Customer</span>
            <span className="sr-orig-val bold">{foundSale.customerName}</span>
          </div>
          <div className="sr-orig-field">
            <span className="sr-orig-label">Original Total</span>
            <span className="sr-orig-val bold">
              {Number(foundSale.netTotal).toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {/* Return items table */}
      {foundSale && (
        <>
          <div className="sr-table-wrap">
            <table className="sh-table">
              <thead>
                <tr>
                  <th style={{ width: 30 }}>✓</th>
                  <th style={{ width: 35 }}>#</th>
                  <th style={{ width: 70 }}>Code</th>
                  <th>Description</th>
                  <th style={{ width: 90 }}>UOM</th>
                  <th className="r" style={{ width: 70 }}>
                    Orig Qty
                  </th>
                  <th className="r" style={{ width: 80 }}>
                    Rate
                  </th>
                  <th className="r" style={{ width: 80 }}>
                    Orig Amt
                  </th>
                  <th className="r" style={{ width: 80 }}>
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
                    <td className="c">{i + 1}</td>
                    <td className="blue">{item.code}</td>
                    <td>{item.description}</td>
                    <td>{item.measurement}</td>
                    <td className="r">{item.qty}</td>
                    <td className="r">{Number(item.rate).toLocaleString()}</td>
                    <td className="r">
                      {Number(item.amount).toLocaleString()}
                    </td>
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
                    <td className="r bold">
                      {Number(item.returnAmount).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Return totals + remarks */}
          <div className="sr-bottom">
            <div className="sr-remarks">
              <span className="sr-label">Remarks</span>
              <input
                type="text"
                className="sr-remarks-input"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Reason for return…"
              />
            </div>
            <div className="sr-total-wrap">
              <span className="sr-total-label">Return Total</span>
              <input
                className="sr-total-input"
                value={returnTotal.toLocaleString()}
                readOnly
              />
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                className="btn"
                onClick={() => {
                  setFoundSale(null);
                  setReturnItems([]);
                  setInvoiceSearch("");
                  setRemarks("");
                }}
              >
                🔄 Reset
              </button>
              <button
                className="btn sr-save-btn"
                onClick={saveReturn}
                disabled={loading || !selectedItems.length}
              >
                {loading ? "Saving…" : "💾 Save Return"}
              </button>
            </div>
          </div>
        </>
      )}

      {!foundSale && !searching && (
        <div className="sr-placeholder">
          🔍 Search for an invoice above to begin processing a return
        </div>
      )}
    </div>
  );
}
