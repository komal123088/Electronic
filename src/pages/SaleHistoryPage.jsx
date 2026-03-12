// pages/SaleHistoryPage.jsx
// All invoices with date filter, search, detail view, edit redirect, delete
import { useState, useEffect } from "react";
import "../styles/SaleHistoryPage.css";
import api from "../api/api.js";
import EP from "../api/apiEndpoints.js";

// ═══════════════════════════════════════════════════════════════════════════
// INVOICE DETAIL MODAL
// ═══════════════════════════════════════════════════════════════════════════
function InvoiceDetailModal({ sale, onClose, onDelete }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm(`Delete invoice ${sale.invoiceNo}?`)) return;
    setDeleting(true);
    try {
      await onDelete(sale._id);
    } catch {}
    setDeleting(false);
  };

  const handlePrint = () => window.print();

  return (
    <div
      className="id-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="id-modal">
        <div className="id-titlebar">
          <span>🧾 Invoice — {sale.invoiceNo}</span>
          <button className="id-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Invoice header info */}
        <div className="id-info-grid">
          <div className="id-info-row">
            <div className="id-info-field">
              <span className="id-label">Invoice #</span>
              <span className="id-val blue">{sale.invoiceNo}</span>
            </div>
            <div className="id-info-field">
              <span className="id-label">Date</span>
              <span className="id-val">{sale.invoiceDate}</span>
            </div>
            <div className="id-info-field">
              <span className="id-label">Payment</span>
              <span className="id-val">{sale.paymentMode}</span>
            </div>
            <div className="id-info-field">
              <span className="id-label">Type</span>
              <span className={`id-badge ${sale.saleType}`}>
                {sale.saleType}
              </span>
            </div>
          </div>
          <div className="id-info-row">
            <div className="id-info-field">
              <span className="id-label">Customer</span>
              <span className="id-val bold">{sale.customerName}</span>
            </div>
            <div className="id-info-field">
              <span className="id-label">Phone</span>
              <span className="id-val">{sale.customerPhone || "—"}</span>
            </div>
          </div>
        </div>

        {/* Items table */}
        <div className="id-table-wrap">
          <table className="id-table">
            <thead>
              <tr>
                <th style={{ width: 35 }}>#</th>
                <th style={{ width: 70 }}>Code</th>
                <th>Description</th>
                <th style={{ width: 90 }}>UOM</th>
                <th className="r" style={{ width: 60 }}>
                  Qty
                </th>
                <th className="r" style={{ width: 80 }}>
                  Rate
                </th>
                <th className="r" style={{ width: 100 }}>
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {sale.items?.map((item, i) => (
                <tr key={i} className={i % 2 === 0 ? "even" : "odd"}>
                  <td className="c">{i + 1}</td>
                  <td className="blue">{item.code}</td>
                  <td>{item.description}</td>
                  <td>{item.measurement}</td>
                  <td className="r">{item.qty}</td>
                  <td className="r">{Number(item.rate).toLocaleString()}</td>
                  <td className="r bold">
                    {Number(item.amount).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="id-totals">
          {[
            ["Sub Total", sale.subTotal],
            ["Extra Discount", sale.extraDisc],
            ["Net Total", sale.netTotal],
            ["Prev. Balance", sale.prevBalance],
            ["Paid Amount", sale.paidAmount],
            ["Balance", sale.balance],
          ].map(([lbl, val]) => (
            <div className="id-total-row" key={lbl}>
              <span className="id-total-label">{lbl}</span>
              <span
                className={`id-total-val${lbl === "Balance" && val > 0 ? " red" : ""}`}
              >
                {Number(val || 0).toLocaleString()}
              </span>
            </div>
          ))}
        </div>

        {sale.remarks && <div className="id-remarks">📝 {sale.remarks}</div>}

        <div className="id-footer">
          <button
            className="btn btn-danger"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "Deleting…" : "🗑 Delete"}
          </button>
          <button className="btn" onClick={handlePrint}>
            🖨 Print
          </button>
          <button className="btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN SALE HISTORY PAGE
// ═══════════════════════════════════════════════════════════════════════════
export default function SaleHistoryPage() {
  const today = new Date().toISOString().split("T")[0];

  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [saleType, setSaleType] = useState("sale");
  const [selSale, setSelSale] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [msg, setMsg] = useState({ text: "", type: "" });

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ saleType });
      if (from) params.append("from", from);
      if (to) params.append("to", to);
      if (search.trim()) params.append("search", search.trim());
      const { data } = await api.get(`${EP.SALES.GET_ALL}?${params}`);
      if (data.success) setSales(data.data);
    } catch {
      showMsg("Failed to load sales", "error");
    }
    setLoading(false);
  };

  const showMsg = (text, type = "success") => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: "", type: "" }), 3000);
  };

  const handleDelete = async (id) => {
    try {
      const { data } = await api.delete(EP.SALES.DELETE(id));
      if (data.success) {
        showMsg("✅ Sale deleted");
        setShowDetail(false);
        setSelSale(null);
        fetchSales();
      } else showMsg(data.message, "error");
    } catch {
      showMsg("Delete failed", "error");
    }
  };

  // Summary stats
  const totalAmt = sales.reduce((s, x) => s + (x.netTotal || 0), 0);
  const totalPaid = sales.reduce((s, x) => s + (x.paidAmount || 0), 0);
  const totalBal = sales.reduce((s, x) => s + (x.balance || 0), 0);

  return (
    <div className="sh-page">
      {showDetail && selSale && (
        <InvoiceDetailModal
          sale={selSale}
          onClose={() => setShowDetail(false)}
          onDelete={handleDelete}
        />
      )}

      {msg.text && <div className={`sh-msg ${msg.type}`}>{msg.text}</div>}

      {/* Header */}
      <div className="sh-header">
        <div className="sh-header-title">Sale History</div>
        <div className="sh-header-meta">
          <span className="sh-stat">Records: {sales.length}</span>
          <span className="sh-stat">Amount: {totalAmt.toLocaleString()}</span>
          <span className="sh-stat">Paid: {totalPaid.toLocaleString()}</span>
          <span className={`sh-stat ${totalBal > 0 ? "red" : ""}`}>
            Balance: {totalBal.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="sh-filters">
        {/* Sale type tabs */}
        <div className="sh-type-tabs">
          {["sale", "return"].map((t) => (
            <button
              key={t}
              className={`sh-type-tab${saleType === t ? " active" : ""}`}
              onClick={() => setSaleType(t)}
            >
              {t === "sale" ? "📄 Sales" : "↩️ Returns"}
            </button>
          ))}
        </div>

        <div className="sh-filter-group">
          <span className="sh-filter-label">From</span>
          <input
            type="date"
            className="sh-filter-input"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>
        <div className="sh-filter-group">
          <span className="sh-filter-label">To</span>
          <input
            type="date"
            className="sh-filter-input"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
        <div className="sh-filter-group" style={{ flex: 1 }}>
          <span className="sh-filter-label">Search</span>
          <input
            type="text"
            className="sh-filter-input sh-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Invoice # or customer name…"
            onKeyDown={(e) => e.key === "Enter" && fetchSales()}
          />
        </div>
        <button className="btn" onClick={fetchSales}>
          🔍 Search
        </button>
        <button
          className="btn"
          onClick={() => {
            setFrom("");
            setTo("");
            setSearch("");
            setTimeout(fetchSales, 50);
          }}
        >
          ⬜ Clear
        </button>
      </div>

      {/* Table */}
      <div className="sh-table-wrap">
        <table className="sh-table">
          <thead>
            <tr>
              <th style={{ width: 35 }}>#</th>
              <th style={{ width: 110 }}>Invoice #</th>
              <th style={{ width: 100 }}>Date</th>
              <th>Customer</th>
              <th style={{ width: 80 }}>Items</th>
              <th className="r" style={{ width: 110 }}>
                Net Amount
              </th>
              <th className="r" style={{ width: 100 }}>
                Paid
              </th>
              <th className="r" style={{ width: 100 }}>
                Balance
              </th>
              <th style={{ width: 80 }}>Payment</th>
              <th style={{ width: 70 }}>Type</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={10} className="sh-empty">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && sales.length === 0 && (
              <tr>
                <td colSpan={10} className="sh-empty">
                  No records found
                </td>
              </tr>
            )}
            {sales.map((s, i) => (
              <tr
                key={s._id}
                className={
                  selSale?._id === s._id
                    ? "selected"
                    : i % 2 === 0
                      ? "even"
                      : "odd"
                }
                onClick={() => setSelSale(s)}
                onDoubleClick={() => {
                  setSelSale(s);
                  setShowDetail(true);
                }}
              >
                <td className="c">{i + 1}</td>
                <td className="blue">{s.invoiceNo}</td>
                <td>{s.invoiceDate}</td>
                <td>{s.customerName}</td>
                <td className="c">{s.items?.length || 0}</td>
                <td className="r bold">
                  {Number(s.netTotal).toLocaleString()}
                </td>
                <td className="r">{Number(s.paidAmount).toLocaleString()}</td>
                <td className={`r ${s.balance > 0 ? "red" : ""}`}>
                  {Number(s.balance).toLocaleString()}
                </td>
                <td>{s.paymentMode}</td>
                <td className="c">
                  <span className={`sh-badge ${s.saleType}`}>{s.saleType}</span>
                </td>
              </tr>
            ))}
          </tbody>
          {sales.length > 0 && (
            <tfoot>
              <tr className="sh-foot">
                <td
                  colSpan={5}
                  style={{ textAlign: "right", fontWeight: "bold" }}
                >
                  Totals ({sales.length} records)
                </td>
                <td className="r bold">{totalAmt.toLocaleString()}</td>
                <td className="r">{totalPaid.toLocaleString()}</td>
                <td className={`r bold ${totalBal > 0 ? "red" : ""}`}>
                  {totalBal.toLocaleString()}
                </td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Bottom bar */}
      <div className="sh-statusbar">
        <span>Double-click to view invoice detail | Click to select</span>
        {selSale && (
          <div style={{ display: "flex", gap: 6, marginLeft: "auto" }}>
            <button className="btn" onClick={() => setShowDetail(true)}>
              👁 View Detail
            </button>
            <button
              className="btn btn-danger"
              onClick={() => handleDelete(selSale._id)}
            >
              🗑 Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
