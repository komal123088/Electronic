import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/CreditCustomersPage.css";
import api from "../api/api.js";
import EP from "../api/apiEndpoints.js";

const fmt = (n) => Number(n || 0).toLocaleString("en-PK");
const isoD = () => new Date().toISOString().split("T")[0];

// ═══════════════════════════════════════════════════════════════════════════
// CUSTOMER DETAIL MODAL — full history + payment + WhatsApp PDF
// ═══════════════════════════════════════════════════════════════════════════
function CustomerDetailModal({ customer, onClose, onUpdated }) {
  const [sales, setSales] = useState([]);
  const [loadingSales, setLoadS] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payRemarks, setPayRemarks] = useState("");
  const [paying, setPaying] = useState(false);
  const [payMsg, setPayMsg] = useState({ text: "", type: "" });
  const [activeTab, setActiveTab] = useState("history"); // "history" | "pay"
  const [selectedSale, setSelectedSale] = useState(null);
  const payRef = useRef(null);

  useEffect(() => {
    loadSales();
  }, [customer._id]);

  const loadSales = async () => {
    setLoadS(true);
    try {
      const { data } = await api.get(EP.CUSTOMERS.SALE_HISTORY(customer._id));
      if (data.success) setSales(data.data || []);
    } catch {}
    setLoadS(false);
  };

  const showPayMsg = (text, type = "success") => {
    setPayMsg({ text, type });
    setTimeout(() => setPayMsg({ text: "", type: "" }), 3000);
  };

  const handlePay = async () => {
    const amt = Number(payAmount);
    if (!amt || amt <= 0) {
      showPayMsg("Valid amount enter karo", "error");
      return;
    }
    setPaying(true);
    try {
      const { data } = await api.post("/payments", {
        customerId: customer._id,
        amount: amt,
        remarks: payRemarks,
        paymentDate: isoD(),
      });
      if (data.success) {
        showPayMsg(`✅ PKR ${fmt(amt)} payment recorded!`, "success");
        setPayAmount("");
        setPayRemarks("");
        loadSales();
        if (onUpdated) onUpdated();
      } else showPayMsg(data.message || "Failed", "error");
    } catch (e) {
      showPayMsg(e.response?.data?.message || "Failed", "error");
    }
    setPaying(false);
  };

  // ── WhatsApp: PDF-style full history ──────────────────────────────────────
  const sendWhatsAppHistory = () => {
    const saleTxns = sales.filter((s) => s.saleType === "sale");
    const returnTxns = sales.filter((s) => s.saleType === "return");
    const totalSales = saleTxns.reduce((s, x) => s + (x.netTotal || 0), 0);
    const totalPaid = saleTxns.reduce((s, x) => s + (x.paidAmount || 0), 0);
    const totalReturn = returnTxns.reduce((s, x) => s + (x.netTotal || 0), 0);
    const outstanding = customer.currentBalance || 0;

    const sep = "━".repeat(30);
    const dash = "─".repeat(30);

    // Detailed per-invoice lines
    const invoiceLines = sales
      .map((s, i) => {
        const itemLines = (s.items || [])
          .map(
            (it) =>
              `    • ${it.description}${it.measurement ? " (" + it.measurement + ")" : ""}\n      Qty: ${it.qty} × PKR ${Number(it.rate).toLocaleString()} = *PKR ${Number(it.amount).toLocaleString()}*`,
          )
          .join("\n");
        const typeLabel = s.saleType === "return" ? "↩ RETURN" : "🛒 SALE";
        return (
          `${i + 1}. ${typeLabel} | *${s.invoiceNo}* | ${s.invoiceDate}\n` +
          (s.items?.length > 0 ? itemLines + "\n" : "") +
          `   Net Total: *PKR ${Number(s.netTotal || 0).toLocaleString()}*\n` +
          `   Paid: PKR ${Number(s.paidAmount || 0).toLocaleString()}` +
          (s.balance > 0
            ? ` | ⚠️ Bal: *PKR ${Number(s.balance).toLocaleString()}*`
            : " ✅")
        );
      })
      .join(`\n${dash}\n`);

    const text = `${sep}
🏪 *ASIM ELECTRIC & ELECTRONIC STORE*
📋 *CUSTOMER ACCOUNT STATEMENT*
${sep}
👤 *${customer.name}*${customer.phone ? "\n📞 " + customer.phone : ""}${customer.code ? "\n🔖 Code: " + customer.code : ""}
📅 Statement Date: ${isoD()}
${sep}
📊 *ACCOUNT SUMMARY*
Total Purchases:    PKR ${fmt(totalSales)}
Total Returns:      PKR ${fmt(totalReturn)}
Total Paid:         PKR ${fmt(totalPaid)}
*Outstanding Due:   PKR ${fmt(outstanding)}*
Transactions:       ${sales.length} records
${sep}
📜 *TRANSACTION DETAILS*
${dash}
${invoiceLines}
${sep}
💰 *PLEASE CLEAR YOUR DUES*
Outstanding Amount: *PKR ${fmt(outstanding)}*
${sep}
_For queries contact us. Thank you for your business!_
_Asim Electric and Electronic Store_`;

    const phoneNum = customer.phone?.replace(/\D/g, "") || "";
    window.open(
      `https://wa.me/${phoneNum}?text=${encodeURIComponent(text)}`,
      "_blank",
    );
  };

  // Compute stats
  const saleTxns = sales.filter((s) => s.saleType === "sale");
  const returnTxns = sales.filter((s) => s.saleType === "return");
  const totalSales = saleTxns.reduce((s, x) => s + (x.netTotal || 0), 0);
  const totalPaid = saleTxns.reduce((s, x) => s + (x.paidAmount || 0), 0);
  const totalReturn = returnTxns.reduce((s, x) => s + (x.netTotal || 0), 0);
  const outstanding = customer.currentBalance || 0;

  return (
    <div
      className="ccp-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="ccp-detail-modal">
        {/* Title */}
        <div className="ccp-detail-title">
          <span>
            👤 {customer.name}{" "}
            {customer.code && (
              <span className="ccp-code-badge">{customer.code}</span>
            )}
          </span>
          <div className="ccp-detail-title-btns">
            <button
              className="ccp-btn ccp-btn-wa"
              onClick={sendWhatsAppHistory}
              title="Send full history via WhatsApp"
            >
              📱 WhatsApp Statement
            </button>
            <button className="ccp-close-x" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        {/* Customer Info + Summary Cards */}
        <div className="ccp-detail-info">
          <div className="ccp-info-row">
            {customer.phone && <span>📞 {customer.phone}</span>}
            {customer.address && <span>📍 {customer.address}</span>}
            {customer.area && <span>🗺 {customer.area}</span>}
          </div>
          <div className="ccp-detail-cards">
            <div className="ccp-stat-card">
              <div className="ccp-sc-label">Total Purchases</div>
              <div className="ccp-sc-value">{fmt(totalSales)}</div>
            </div>
            <div className="ccp-stat-card">
              <div className="ccp-sc-label">Total Paid</div>
              <div className="ccp-sc-value green">{fmt(totalPaid)}</div>
            </div>
            <div className="ccp-stat-card">
              <div className="ccp-sc-label">Returns</div>
              <div className="ccp-sc-value green">{fmt(totalReturn)}</div>
            </div>
            <div
              className={`ccp-stat-card ${outstanding > 0 ? "danger" : "ok"}`}
            >
              <div className="ccp-sc-label">Outstanding Due</div>
              <div className="ccp-sc-value bold">{fmt(outstanding)}</div>
            </div>
            <div className="ccp-stat-card">
              <div className="ccp-sc-label">Transactions</div>
              <div className="ccp-sc-value">{sales.length}</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="ccp-detail-tabs">
          <button
            className={`ccp-tab ${activeTab === "history" ? "active" : ""}`}
            onClick={() => setActiveTab("history")}
          >
            📜 Transaction History ({sales.length})
          </button>
          <button
            className={`ccp-tab ${activeTab === "pay" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("pay");
              setTimeout(() => payRef.current?.focus(), 50);
            }}
          >
            💰 Record Payment
          </button>
        </div>

        {/* Tab Content */}
        <div className="ccp-detail-tab-body">
          {/* ── History Tab ── */}
          {activeTab === "history" && (
            <div className="ccp-history-wrap">
              {loadingSales && <div className="ccp-loading">Loading…</div>}
              {!loadingSales && sales.length === 0 && (
                <div className="ccp-empty">Koi transaction nahi mili</div>
              )}
              {!loadingSales && sales.length > 0 && (
                <table className="ccp-hist-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th style={{ width: 100 }}>Invoice</th>
                      <th style={{ width: 90 }}>Date</th>
                      <th className="r" style={{ width: 90 }}>
                        Net Total
                      </th>
                      <th className="r" style={{ width: 80 }}>
                        Paid
                      </th>
                      <th className="r" style={{ width: 80 }}>
                        Balance
                      </th>
                      <th style={{ width: 55 }}>Type</th>
                      <th style={{ width: 50 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.map((s, i) => (
                      <>
                        <tr
                          key={s._id}
                          className={`${i % 2 === 0 ? "even" : "odd"} ${selectedSale?._id === s._id ? "sel" : ""}`}
                          onClick={() =>
                            setSelectedSale(
                              selectedSale?._id === s._id ? null : s,
                            )
                          }
                          style={{ cursor: "pointer" }}
                          title="Click to expand items"
                        >
                          <td className="c">{i + 1}</td>
                          <td className="bold blue">{s.invoiceNo}</td>
                          <td>{s.invoiceDate}</td>
                          <td className="r bold">{fmt(s.netTotal)}</td>
                          <td className="r">{fmt(s.paidAmount)}</td>
                          <td
                            className={`r ${s.balance > 0 ? "red bold" : ""}`}
                          >
                            {fmt(s.balance)}
                          </td>
                          <td className="c">
                            <span className={`ccp-badge ${s.saleType}`}>
                              {s.saleType}
                            </span>
                          </td>
                          <td className="c ccp-expand-icon">
                            {selectedSale?._id === s._id ? "▲" : "▼"}
                          </td>
                        </tr>
                        {/* Expandable items row */}
                        {selectedSale?._id === s._id && (
                          <tr key={s._id + "-items"} className="ccp-items-row">
                            <td colSpan={8} style={{ padding: 0 }}>
                              <div className="ccp-items-expand">
                                <table className="ccp-items-table">
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
                                    {(s.items || []).length === 0 && (
                                      <tr>
                                        <td colSpan={7} className="ccp-empty">
                                          Items not available
                                        </td>
                                      </tr>
                                    )}
                                    {(s.items || []).map((it, j) => (
                                      <tr key={j}>
                                        <td className="c">{j + 1}</td>
                                        <td>{it.description}</td>
                                        <td>{it.measurement}</td>
                                        <td className="r">{it.qty}</td>
                                        <td className="r">{fmt(it.rate)}</td>
                                        <td className="r">{it.disc || 0}%</td>
                                        <td className="r bold">
                                          {fmt(it.amount)}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                                <div className="ccp-items-totals">
                                  <span>
                                    Net Total: <b>PKR {fmt(s.netTotal)}</b>
                                  </span>
                                  {s.prevBalance > 0 && (
                                    <span>
                                      Prev Bal:{" "}
                                      <b className="red">
                                        PKR {fmt(s.prevBalance)}
                                      </b>
                                    </span>
                                  )}
                                  <span>
                                    Paid:{" "}
                                    <b className="green">
                                      PKR {fmt(s.paidAmount)}
                                    </b>
                                  </span>
                                  {s.balance > 0 && (
                                    <span>
                                      Balance:{" "}
                                      <b className="red">
                                        PKR {fmt(s.balance)}
                                      </b>
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* ── Payment Tab ── */}
          {activeTab === "pay" && (
            <div className="ccp-pay-tab">
              <div className="ccp-pay-outstanding">
                Outstanding Due:{" "}
                <span className={`bold ${outstanding > 0 ? "red" : "green"}`}>
                  PKR {fmt(outstanding)}
                </span>
              </div>
              {payMsg.text && (
                <div className={`ccp-msg ${payMsg.type}`}>{payMsg.text}</div>
              )}
              <div className="ccp-pay-form">
                <div className="ccp-pay-field">
                  <label>Payment Amount (PKR)</label>
                  <input
                    ref={payRef}
                    type="number"
                    className="ccp-pay-input"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handlePay();
                    }}
                    placeholder="Amount enter karo…"
                  />
                </div>
                <div className="ccp-pay-field">
                  <label>Remarks</label>
                  <input
                    type="text"
                    className="ccp-pay-input"
                    value={payRemarks}
                    onChange={(e) => setPayRemarks(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handlePay();
                    }}
                    placeholder="e.g. Cash received, Cheque no…"
                  />
                </div>
                <button
                  className="ccp-btn ccp-btn-primary"
                  onClick={handlePay}
                  disabled={paying}
                >
                  {paying ? "Processing…" : "✅ Record Payment"}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="ccp-detail-footer">
          <button className="ccp-btn" onClick={onClose}>
            ✕ Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN PAGE — Credit Customers List
// ═══════════════════════════════════════════════════════════════════════════
export default function CreditCustomersPage() {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all"); // all | due | clear
  const [sortBy, setSortBy] = useState("name"); // name | balance | date
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [msg, setMsg] = useState({ text: "", type: "" });
  const searchRef = useRef(null);

  useEffect(() => {
    loadCustomers();
    searchRef.current?.focus();
  }, []);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(EP.CUSTOMERS.GET_CREDIT() + "&limit=500");
      if (data.success)
        setCustomers((data.data || []).filter((c) => c.type === "credit"));
    } catch {
      showMsg("Customers load failed", "error");
    }
    setLoading(false);
  };

  const showMsg = (text, type = "success") => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: "", type: "" }), 3000);
  };

  // ── Summary stats ─────────────────────────────────────────────────────────
  const totalCustomers = customers.length;
  const dueCustomers = customers.filter((c) => (c.currentBalance || 0) > 0);
  const clearCustomers = customers.filter((c) => (c.currentBalance || 0) <= 0);
  const totalDue = customers.reduce(
    (s, c) => s + Math.max(0, c.currentBalance || 0),
    0,
  );
  const totalRecovered = customers.reduce(
    (s, c) => s + Math.max(0, -(c.currentBalance || 0)),
    0,
  );

  // ── Filter + Sort ─────────────────────────────────────────────────────────
  const filtered = customers
    .filter((c) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        c.name?.toLowerCase().includes(q) ||
        c.phone?.includes(q) ||
        c.code?.toLowerCase().includes(q) ||
        c.area?.toLowerCase().includes(q);
      const matchType =
        filterType === "all" ||
        (filterType === "due" && (c.currentBalance || 0) > 0) ||
        (filterType === "clear" && (c.currentBalance || 0) <= 0);
      return matchSearch && matchType;
    })
    .sort((a, b) => {
      if (sortBy === "balance")
        return (b.currentBalance || 0) - (a.currentBalance || 0);
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return 0;
    });

  // ── WhatsApp to ALL due customers ─────────────────────────────────────────
  const sendBulkReminder = () => {
    const dueList = filtered.filter((c) => (c.currentBalance || 0) > 0);
    if (!dueList.length) {
      showMsg("Koi due customer nahi", "error");
      return;
    }
    const lines = dueList
      .map(
        (c, i) =>
          `${i + 1}. ${c.name}${c.phone ? " (" + c.phone + ")" : ""} — *PKR ${fmt(c.currentBalance)}*`,
      )
      .join("\n");
    const text = `🏪 *ASIM ELECTRIC & ELECTRONIC STORE*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 *OUTSTANDING DUE CUSTOMERS*
📅 Date: ${isoD()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${lines}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
*Total Outstanding: PKR ${fmt(totalDue)}*
*Customers with Due: ${dueList.length}*`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div className="ccp-page">
      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <CustomerDetailModal
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          onUpdated={() => {
            loadCustomers();
          }}
        />
      )}

      {/* ── Header ── */}
      <div className="ccp-header">
        <div className="ccp-header-left">
          <button
            className="ccp-back-btn"
            onClick={() => navigate("/credit-sale")}
            title="Credit Sale page"
          >
            ← Credit Sale
          </button>
          <div className="ccp-title">👥 Credit Customers</div>
        </div>
        <div className="ccp-header-right">
          <button
            className="ccp-btn ccp-btn-wa"
            onClick={sendBulkReminder}
            title="Send bulk due reminder"
          >
            📱 Bulk Due Reminder
          </button>
          <button
            className="ccp-btn ccp-btn-primary"
            onClick={() => navigate("/customers")}
            title="Manage all customers"
          >
            ➕ Add Customer
          </button>
        </div>
      </div>

      {msg.text && <div className={`ccp-msg ${msg.type}`}>{msg.text}</div>}

      {/* ── Summary Cards ── */}
      <div className="ccp-summary">
        <div className="ccp-sum-card">
          <div className="ccp-sum-label">Total Customers</div>
          <div className="ccp-sum-value">{totalCustomers}</div>
        </div>
        <div className="ccp-sum-card danger">
          <div className="ccp-sum-label">With Due Balance</div>
          <div className="ccp-sum-value red">{dueCustomers.length}</div>
        </div>
        <div className="ccp-sum-card ok">
          <div className="ccp-sum-label">Clear / Paid</div>
          <div className="ccp-sum-value green">{clearCustomers.length}</div>
        </div>
        <div className="ccp-sum-card danger">
          <div className="ccp-sum-label">Total Outstanding</div>
          <div className="ccp-sum-value red bold">PKR {fmt(totalDue)}</div>
        </div>
        <div className="ccp-sum-card ok">
          <div className="ccp-sum-label">Total Recovered</div>
          <div className="ccp-sum-value green bold">
            PKR {fmt(totalRecovered)}
          </div>
        </div>
      </div>

      {/* ── Filters Bar ── */}
      <div className="ccp-filters">
        <input
          ref={searchRef}
          type="text"
          className="ccp-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Name / phone / code / area search…"
        />
        <div className="ccp-filter-btns">
          <button
            className={`ccp-filter-btn ${filterType === "all" ? "active" : ""}`}
            onClick={() => setFilterType("all")}
          >
            All ({totalCustomers})
          </button>
          <button
            className={`ccp-filter-btn red-btn ${filterType === "due" ? "active" : ""}`}
            onClick={() => setFilterType("due")}
          >
            ⚠️ Due ({dueCustomers.length})
          </button>
          <button
            className={`ccp-filter-btn green-btn ${filterType === "clear" ? "active" : ""}`}
            onClick={() => setFilterType("clear")}
          >
            ✅ Clear ({clearCustomers.length})
          </button>
        </div>
        <div className="ccp-sort">
          <span>Sort:</span>
          <select
            className="ccp-sort-sel"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="name">Name A-Z</option>
            <option value="balance">Balance High-Low</option>
          </select>
        </div>
        <span className="ccp-result-count">{filtered.length} showing</span>
      </div>

      {/* ── Customers Table ── */}
      <div className="ccp-table-wrap">
        {loading && <div className="ccp-loading">Loading customers…</div>}
        {!loading && filtered.length === 0 && (
          <div className="ccp-empty">Koi customer nahi mili</div>
        )}
        {!loading && filtered.length > 0 && (
          <table className="ccp-table">
            <thead>
              <tr>
                <th style={{ width: 36 }}>#</th>
                <th style={{ width: 80 }}>Code</th>
                <th>Name</th>
                <th style={{ width: 120 }}>Phone</th>
                <th style={{ width: 110 }}>Area</th>
                <th className="r" style={{ width: 110 }}>
                  Outstanding
                </th>
                <th style={{ width: 70 }}>Status</th>
                <th style={{ width: 120 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr
                  key={c._id}
                  className={`${i % 2 === 0 ? "even" : "odd"} ${(c.currentBalance || 0) > 0 ? "due-row" : ""}`}
                >
                  <td className="c">{i + 1}</td>
                  <td className="blue bold">{c.code || "—"}</td>
                  <td>
                    <span
                      className="ccp-cust-name"
                      onClick={() => setSelectedCustomer(c)}
                      title="Click for details"
                    >
                      {c.name}
                    </span>
                  </td>
                  <td>{c.phone || "—"}</td>
                  <td>{c.area || "—"}</td>
                  <td
                    className={`r bold ${(c.currentBalance || 0) > 0 ? "red" : "green"}`}
                  >
                    {fmt(c.currentBalance || 0)}
                  </td>
                  <td className="c">
                    <span
                      className={`ccp-badge ${(c.currentBalance || 0) > 0 ? "due" : "clear"}`}
                    >
                      {(c.currentBalance || 0) > 0 ? "Due" : "Clear"}
                    </span>
                  </td>
                  <td className="c">
                    <div className="ccp-row-actions">
                      <button
                        className="ccp-action-btn"
                        onClick={() => setSelectedCustomer(c)}
                        title="View details"
                      >
                        📋
                      </button>
                      {c.phone && (
                        <button
                          className="ccp-action-btn wa"
                          onClick={() => {
                            const text = `Assalam-o-Alaikum *${c.name}* ji!\n\nAap ka hamare yahan outstanding amount hai:\n*PKR ${fmt(c.currentBalance)}*\n\nKindly clear karein. Shukriya!\n\n_Asim Electric and Electronic Store_`;
                            window.open(
                              `https://wa.me/${c.phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`,
                              "_blank",
                            );
                          }}
                          title="Send WhatsApp reminder"
                        >
                          📱
                        </button>
                      )}
                      <button
                        className="ccp-action-btn sale"
                        onClick={() => navigate("/credit-sale")}
                        title="New sale for this customer"
                      >
                        🛒
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="ccp-tfoot">
                <td colSpan={5} className="bold">
                  Total ({filtered.length} customers)
                </td>
                <td className="r bold red">
                  {fmt(
                    filtered.reduce(
                      (s, c) => s + Math.max(0, c.currentBalance || 0),
                      0,
                    ),
                  )}
                </td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
}
