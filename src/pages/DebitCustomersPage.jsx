import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/DebitCustomersPage.css";
import api from "../api/api.js";
import EP from "../api/apiEndpoints.js";

const fmt = (n) => Number(n || 0).toLocaleString("en-PK");
const isoD = () => new Date().toISOString().split("T")[0];

// ═══════ CUSTOMER DETAIL MODAL ═══════════════════════════════════════════════
function CustomerDetailModal({ customer, onClose, onPaymentDone }) {
  const [sales, setSales] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loadingSales, setLoadSales] = useState(false);
  const [loadingPay, setLoadPay] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payRemarks, setPayRemarks] = useState("");
  const [payMode, setPayMode] = useState("Cash");
  const [paying, setPaying] = useState(false);
  const [payMsg, setPayMsg] = useState({ text: "", type: "" });
  const [activeTab, setActiveTab] = useState("history");
  const [expandedSale, setExpandedSale] = useState(null);
  const payRef = useRef(null);

  useEffect(() => {
    loadSales();
    loadPayments();
  }, [customer._id]);

  const loadSales = async () => {
    setLoadSales(true);
    try {
      const { data } = await api.get(EP.CUSTOMERS.SALE_HISTORY(customer._id));
      if (data.success) setSales(data.data || []);
    } catch {}
    setLoadSales(false);
  };
  const loadPayments = async () => {
    setLoadPay(true);
    try {
      const { data } = await api.get(EP.PAYMENTS.BY_CUSTOMER(customer._id));
      if (data.success) setPayments(data.data?.payments || []);
    } catch {}
    setLoadPay(false);
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
      const { data } = await api.post(EP.PAYMENTS.CREATE, {
        customerId: customer._id,
        amount: amt,
        paymentMode: payMode,
        remarks: payRemarks,
        paymentDate: isoD(),
      });
      if (data.success) {
        showPayMsg(`PKR ${fmt(amt)} payment recorded!`, "success");
        setPayAmount("");
        setPayRemarks("");
        loadSales();
        loadPayments();
        if (onPaymentDone) onPaymentDone();
      } else showPayMsg(data.message || "Failed", "error");
    } catch (e) {
      showPayMsg(e.response?.data?.message || "Failed", "error");
    }
    setPaying(false);
  };

  // WhatsApp statement
  const sendWA = () => {
    const saleTxns = sales.filter((s) => s.saleType === "sale");
    const totalS = saleTxns.reduce((s, x) => s + (x.netTotal || 0), 0);
    const totalP = saleTxns.reduce((s, x) => s + (x.paidAmount || 0), 0);
    const payTotal = payments.reduce((s, p) => s + (p.amount || 0), 0);
    const sep = "━".repeat(28);
    const invLines = sales
      .slice(0, 15)
      .map(
        (s, i) =>
          `${i + 1}. ${s.invoiceNo} | ${s.invoiceDate}\n    Net: PKR ${Number(s.netTotal || 0).toLocaleString()} | Paid: ${Number(s.paidAmount || 0).toLocaleString()} | *Bal: ${Number(s.balance || 0).toLocaleString()}*`,
      )
      .join("\n");
    const text = `🏪 *ASIM ELECTRIC & ELECTRONIC STORE*\n${sep}\n👤 *${customer.name}*${customer.phone ? "\n📞 " + customer.phone : ""}\n📅 Date: ${isoD()}\n${sep}\n*TRANSACTIONS (Last ${Math.min(sales.length, 15)})*\n\n${invLines}\n${sep}\n📊 *SUMMARY*\nTotal Purchases: PKR ${fmt(totalS)}\nPaid at Sale: PKR ${fmt(totalP)}\nLater Payments: PKR ${fmt(payTotal)}\n*Outstanding: PKR ${fmt(customer.currentBalance || 0)}*\n${sep}\n_Please clear your dues. Thank you!_`;
    const ph = customer.phone?.replace(/\D/g, "") || "";
    window.open(
      `https://wa.me/${ph}?text=${encodeURIComponent(text)}`,
      "_blank",
    );
  };

  const saleTxns = sales.filter((s) => s.saleType === "sale");
  const totalSales = saleTxns.reduce((s, x) => s + (x.netTotal || 0), 0);
  const totalPaid = saleTxns.reduce((s, x) => s + (x.paidAmount || 0), 0);
  const payTotal = payments.reduce((s, p) => s + (p.amount || 0), 0);
  const outstanding = customer.currentBalance || 0;

  return (
    <div
      className="dcp-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="dcp-detail-modal">
        {/* Title */}
        <div className="dcp-detail-title">
          <span>
            <i
              className="bi bi-person-badge-fill"
              style={{ color: "#4fc3f7", marginRight: 6 }}
            ></i>
            {customer.name}
            {customer.code && (
              <span className="dcp-code-badge">{customer.code}</span>
            )}
          </span>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <button
              className="dcp-btn dcp-btn-wa"
              onClick={sendWA}
              disabled={!sales.length}
            >
              <i className="bi bi-whatsapp" style={{ marginRight: 4 }}></i>
              Statement
            </button>
            <button className="dcp-close-x" onClick={onClose}>
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
        </div>

        {/* Info + Summary */}
        <div className="dcp-detail-info">
          <div className="dcp-info-row">
            {customer.phone && (
              <span>
                <i
                  className="bi bi-telephone-fill"
                  style={{ color: "#4fc3f7", marginRight: 4 }}
                ></i>
                {customer.phone}
              </span>
            )}
            {customer.address && (
              <span>
                <i
                  className="bi bi-geo-alt-fill"
                  style={{ color: "#ef5350", marginRight: 4 }}
                ></i>
                {customer.address}
              </span>
            )}
            {customer.area && (
              <span>
                <i
                  className="bi bi-map-fill"
                  style={{ color: "#ffa726", marginRight: 4 }}
                ></i>
                {customer.area}
              </span>
            )}
          </div>
          <div className="dcp-detail-cards">
            <div className="dcp-stat-card">
              <div className="dcp-sc-label">Total Sales</div>
              <div className="dcp-sc-value">{fmt(totalSales)}</div>
            </div>
            <div className="dcp-stat-card">
              <div className="dcp-sc-label">Paid at Sale</div>
              <div className="dcp-sc-value green">{fmt(totalPaid)}</div>
            </div>
            <div className="dcp-stat-card">
              <div className="dcp-sc-label">Later Payments</div>
              <div className="dcp-sc-value green">{fmt(payTotal)}</div>
            </div>
            <div
              className={`dcp-stat-card ${outstanding > 0 ? "danger" : "ok"}`}
            >
              <div className="dcp-sc-label">Outstanding</div>
              <div className="dcp-sc-value bold">{fmt(outstanding)}</div>
            </div>
            <div className="dcp-stat-card">
              <div className="dcp-sc-label">Transactions</div>
              <div className="dcp-sc-value">{sales.length}</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="dcp-detail-tabs">
          <button
            className={`dcp-tab ${activeTab === "history" ? "active" : ""}`}
            onClick={() => setActiveTab("history")}
          >
            <i
              className="bi bi-clock-history"
              style={{ marginRight: 4, color: "#4fc3f7" }}
            ></i>
            Transaction History ({sales.length})
          </button>
          <button
            className={`dcp-tab ${activeTab === "payments" ? "active" : ""}`}
            onClick={() => setActiveTab("payments")}
          >
            <i
              className="bi bi-cash-coin"
              style={{ marginRight: 4, color: "#66bb6a" }}
            ></i>
            Payment History ({payments.length})
          </button>
          <button
            className={`dcp-tab ${activeTab === "pay" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("pay");
              setTimeout(() => payRef.current?.focus(), 50);
            }}
          >
            <i
              className="bi bi-plus-circle-fill"
              style={{ marginRight: 4, color: "#ffa726" }}
            ></i>
            Record Payment
          </button>
        </div>

        <div className="dcp-detail-tab-body">
          {/* History Tab */}
          {activeTab === "history" && (
            <div className="dcp-history-wrap">
              {loadingSales && <div className="dcp-loading">Loading…</div>}
              {!loadingSales && sales.length === 0 && (
                <div className="dcp-empty">Koi transaction nahi</div>
              )}
              {!loadingSales && sales.length > 0 && (
                <table className="dcp-hist-table">
                  <thead>
                    <tr>
                      <th style={{ width: 28 }}>#</th>
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
                      <th style={{ width: 60 }}>Mode</th>
                      <th style={{ width: 40 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.map((s, i) => (
                      <>
                        <tr
                          key={s._id}
                          className={`${i % 2 === 0 ? "even" : "odd"} ${expandedSale === s._id ? "sel" : ""}`}
                          onClick={() =>
                            setExpandedSale(
                              expandedSale === s._id ? null : s._id,
                            )
                          }
                          style={{ cursor: "pointer" }}
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
                          <td>{s.paymentMode}</td>
                          <td
                            className="c"
                            style={{ color: "#90a4ae", fontSize: 10 }}
                          >
                            <i
                              className={`bi bi-chevron-${expandedSale === s._id ? "up" : "down"}`}
                            ></i>
                          </td>
                        </tr>
                        {expandedSale === s._id && (
                          <tr key={s._id + "-exp"} className="dcp-items-row">
                            <td colSpan={8} style={{ padding: 0 }}>
                              <div className="dcp-items-expand">
                                <table className="dcp-items-table">
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
                                        <td colSpan={7} className="dcp-empty">
                                          Items not loaded
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
                                <div className="dcp-items-totals">
                                  <span>
                                    Net: <b>PKR {fmt(s.netTotal)}</b>
                                  </span>
                                  <span className="green">
                                    Paid: <b>PKR {fmt(s.paidAmount)}</b>
                                  </span>
                                  {s.balance > 0 && (
                                    <span className="red">
                                      Balance: <b>PKR {fmt(s.balance)}</b>
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

          {/* Payment History Tab */}
          {activeTab === "payments" && (
            <div className="dcp-history-wrap">
              {loadingPay && <div className="dcp-loading">Loading…</div>}
              {!loadingPay && payments.length === 0 && (
                <div className="dcp-empty">Koi payment nahi mili</div>
              )}
              {!loadingPay && payments.length > 0 && (
                <table className="dcp-hist-table">
                  <thead>
                    <tr>
                      <th style={{ width: 32 }}>#</th>
                      <th style={{ width: 100 }}>Date</th>
                      <th className="r" style={{ width: 100 }}>
                        Amount
                      </th>
                      <th style={{ width: 70 }}>Mode</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p, i) => (
                      <tr
                        key={p._id || i}
                        className={i % 2 === 0 ? "even" : "odd"}
                      >
                        <td className="c">{i + 1}</td>
                        <td>{p.paymentDate || p.createdAt?.split("T")[0]}</td>
                        <td className="r green bold">PKR {fmt(p.amount)}</td>
                        <td>{p.paymentMode || "Cash"}</td>
                        <td>{p.remarks || "—"}</td>
                      </tr>
                    ))}
                    <tr className="dcp-tfoot">
                      <td colSpan={2} className="bold">
                        Total Payments
                      </td>
                      <td className="r green bold">PKR {fmt(payTotal)}</td>
                      <td colSpan={2}></td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Record Payment Tab */}
          {activeTab === "pay" && (
            <div className="dcp-pay-tab">
              <div className="dcp-pay-outstanding">
                Outstanding Due:
                <span className={`bold ${outstanding > 0 ? "red" : "green"}`}>
                  {" "}
                  PKR {fmt(outstanding)}
                </span>
              </div>
              {payMsg.text && (
                <div className={`dcp-msg ${payMsg.type}`}>{payMsg.text}</div>
              )}
              <div className="dcp-pay-form">
                <div className="dcp-pay-field">
                  <label>
                    <i
                      className="bi bi-currency-rupee"
                      style={{ color: "#66bb6a", marginRight: 3 }}
                    ></i>
                    Amount (PKR)
                  </label>
                  <input
                    ref={payRef}
                    type="number"
                    className="dcp-pay-input"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handlePay();
                    }}
                    placeholder="Amount enter karo…"
                  />
                </div>
                <div className="dcp-pay-field">
                  <label>
                    <i
                      className="bi bi-credit-card"
                      style={{ color: "#4fc3f7", marginRight: 3 }}
                    ></i>
                    Payment Mode
                  </label>
                  <select
                    className="dcp-pay-input"
                    value={payMode}
                    onChange={(e) => setPayMode(e.target.value)}
                  >
                    <option>Cash</option>
                    <option>Bank</option>
                    <option>Cheque</option>
                    <option>Online</option>
                  </select>
                </div>
                <div className="dcp-pay-field">
                  <label>
                    <i
                      className="bi bi-chat-square-text"
                      style={{ color: "#bdbdbd", marginRight: 3 }}
                    ></i>
                    Remarks
                  </label>
                  <input
                    type="text"
                    className="dcp-pay-input"
                    value={payRemarks}
                    onChange={(e) => setPayRemarks(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handlePay();
                    }}
                    placeholder="e.g. Cash received, Cheque no…"
                  />
                </div>
                <button
                  className="dcp-btn dcp-btn-primary"
                  onClick={handlePay}
                  disabled={paying}
                >
                  {paying ? (
                    "Processing…"
                  ) : (
                    <>
                      <i
                        className="bi bi-check-circle-fill"
                        style={{ marginRight: 4 }}
                      ></i>
                      Record Payment
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="dcp-detail-footer">
          <button className="dcp-btn" onClick={onClose}>
            <i className="bi bi-x-circle" style={{ marginRight: 4 }}></i>Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════ MAIN PAGE ════════════════════════════════════════════════════════════
export default function DebitCustomersPage() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [selectedCust, setSelectedCust] = useState(null);
  const [msg, setMsg] = useState({ text: "", type: "" });
  const searchRef = useRef(null);

  useEffect(() => {
    loadCustomers();
    searchRef.current?.focus();
  }, []);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(EP.CUSTOMERS.GET_WALKIN() + "&limit=500");
      if (data.success)
        setCustomers((data.data || []).filter((c) => c.type === "walkin"));
    } catch {
      showMsg("Load failed", "error");
    }
    setLoading(false);
  };
  const showMsg = (text, type = "success") => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: "", type: "" }), 3000);
  };

  // Summary stats
  const totalCustomers = customers.length;
  const dueCustomers = customers.filter((c) => (c.currentBalance || 0) > 0);
  const clearCustomers = customers.filter((c) => (c.currentBalance || 0) <= 0);
  const totalDue = dueCustomers.reduce(
    (s, c) => s + (c.currentBalance || 0),
    0,
  );

  // Filter + Sort
  const filtered = customers
    .filter((c) => {
      const q = search.toLowerCase();
      const ms =
        !q ||
        c.name?.toLowerCase().includes(q) ||
        c.phone?.includes(q) ||
        c.code?.toLowerCase().includes(q) ||
        c.area?.toLowerCase().includes(q);
      const mf =
        filterType === "all" ||
        (filterType === "due" && (c.currentBalance || 0) > 0) ||
        (filterType === "clear" && (c.currentBalance || 0) <= 0);
      return ms && mf;
    })
    .sort((a, b) =>
      sortBy === "balance"
        ? (b.currentBalance || 0) - (a.currentBalance || 0)
        : a.name.localeCompare(b.name),
    );

  // Bulk WA reminder
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
    const text = `*ASIM ELECTRIC & ELECTRONIC STORE*\n${"━".repeat(28)}\n*OUTSTANDING DUE — DEBIT CUSTOMERS*\n📅 ${isoD()}\n${"─".repeat(28)}\n${lines}\n${"─".repeat(28)}\n*Total Due: PKR ${fmt(dueList.reduce((s, c) => s + (c.currentBalance || 0), 0))}*\n*Customers with Due: ${dueList.length}*`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div className="dcp-page">
      {selectedCust && (
        <CustomerDetailModal
          customer={selectedCust}
          onClose={() => setSelectedCust(null)}
          onPaymentDone={loadCustomers}
        />
      )}

      {/* Header */}
      <div className="dcp-header">
        <div className="dcp-header-left">
          <button
            className="dcp-back-btn"
            onClick={() => navigate("/debit-sale")}
          >
            <i
              className="bi bi-arrow-left-circle-fill"
              style={{ color: "#fff", marginRight: 5 }}
            ></i>
            Debit Sale
          </button>
          <div className="dcp-title">
            <i
              className="bi bi-people-fill"
              style={{ color: "#ffd54f", marginRight: 7, fontSize: 16 }}
            ></i>
            Debit Customers
          </div>
        </div>
        <div className="dcp-header-right">
          <button className="dcp-btn dcp-btn-wa" onClick={sendBulkReminder}>
            <i className="bi bi-whatsapp" style={{ marginRight: 4 }}></i>Bulk
            Reminder
          </button>
          <button
            className="dcp-btn dcp-btn-primary"
            onClick={() => navigate("/customers")}
          >
            <i
              className="bi bi-person-plus-fill"
              style={{ marginRight: 4 }}
            ></i>
            Add Customer
          </button>
        </div>
      </div>

      {msg.text && <div className={`dcp-msg ${msg.type}`}>{msg.text}</div>}

      {/* Summary Cards */}
      <div className="dcp-summary">
        <div className="dcp-sum-card">
          <i
            className="bi bi-people-fill"
            style={{
              fontSize: 20,
              color: "#4fc3f7",
              marginBottom: 4,
              display: "block",
            }}
          ></i>
          <div className="dcp-sum-label">Total Customers</div>
          <div className="dcp-sum-value">{totalCustomers}</div>
        </div>
        <div className="dcp-sum-card danger">
          <i
            className="bi bi-exclamation-triangle-fill"
            style={{
              fontSize: 20,
              color: "#ef5350",
              marginBottom: 4,
              display: "block",
            }}
          ></i>
          <div className="dcp-sum-label">With Due</div>
          <div className="dcp-sum-value red">{dueCustomers.length}</div>
        </div>
        <div className="dcp-sum-card ok">
          <i
            className="bi bi-check-circle-fill"
            style={{
              fontSize: 20,
              color: "#66bb6a",
              marginBottom: 4,
              display: "block",
            }}
          ></i>
          <div className="dcp-sum-label">Cleared</div>
          <div className="dcp-sum-value green">{clearCustomers.length}</div>
        </div>
        <div className="dcp-sum-card danger">
          <i
            className="bi bi-currency-rupee"
            style={{
              fontSize: 20,
              color: "#ef5350",
              marginBottom: 4,
              display: "block",
            }}
          ></i>
          <div className="dcp-sum-label">Total Outstanding</div>
          <div className="dcp-sum-value red bold">PKR {fmt(totalDue)}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="dcp-filters">
        <div className="dcp-search-wrap">
          <i
            className="bi bi-search"
            style={{
              color: "#90a4ae",
              position: "absolute",
              left: 10,
              top: "50%",
              transform: "translateY(-50%)",
            }}
          ></i>
          <input
            ref={searchRef}
            type="text"
            className="dcp-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name / phone / code / area search…"
          />
        </div>
        <div className="dcp-filter-btns">
          <button
            className={`dcp-filter-btn ${filterType === "all" ? "active" : ""}`}
            onClick={() => setFilterType("all")}
          >
            All ({totalCustomers})
          </button>
          <button
            className={`dcp-filter-btn red-btn ${filterType === "due" ? "active" : ""}`}
            onClick={() => setFilterType("due")}
          >
            <i
              className="bi bi-exclamation-circle-fill"
              style={{ marginRight: 3 }}
            ></i>
            Due ({dueCustomers.length})
          </button>
          <button
            className={`dcp-filter-btn green-btn ${filterType === "clear" ? "active" : ""}`}
            onClick={() => setFilterType("clear")}
          >
            <i
              className="bi bi-check-circle-fill"
              style={{ marginRight: 3 }}
            ></i>
            Clear ({clearCustomers.length})
          </button>
        </div>
        <div className="dcp-sort">
          <span>Sort:</span>
          <select
            className="dcp-sort-sel"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="name">Name A-Z</option>
            <option value="balance">Balance High</option>
          </select>
        </div>
        <span className="dcp-result-count">{filtered.length} showing</span>
      </div>

      {/* Table */}
      <div className="dcp-table-wrap">
        {loading && <div className="dcp-loading">Loading debit customers…</div>}
        {!loading && filtered.length === 0 && (
          <div className="dcp-empty">Koi debit customer nahi mili</div>
        )}
        {!loading && filtered.length > 0 && (
          <table className="dcp-table">
            <thead>
              <tr>
                <th style={{ width: 36 }}>#</th>
                <th style={{ width: 80 }}>Code</th>
                <th>Name</th>
                <th style={{ width: 120 }}>Phone</th>
                <th style={{ width: 100 }}>Area</th>
                <th className="r" style={{ width: 110 }}>
                  Outstanding
                </th>
                <th style={{ width: 65 }}>Status</th>
                <th style={{ width: 110 }}>Actions</th>
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
                      className="dcp-cust-name"
                      onClick={() => setSelectedCust(c)}
                      title="Click for details"
                    >
                      <i
                        className="bi bi-person-fill"
                        style={{
                          color: "#4fc3f7",
                          marginRight: 4,
                          fontSize: 11,
                        }}
                      ></i>
                      {c.name}
                    </span>
                  </td>
                  <td>{c.phone || "—"}</td>
                  <td>{c.area || "—"}</td>
                  <td
                    className={`r bold ${(c.currentBalance || 0) > 0 ? "red" : "green"}`}
                  >
                    PKR {fmt(c.currentBalance || 0)}
                  </td>
                  <td className="c">
                    <span
                      className={`dcp-badge ${(c.currentBalance || 0) > 0 ? "due" : "clear"}`}
                    >
                      {(c.currentBalance || 0) > 0 ? "Due" : "Clear"}
                    </span>
                  </td>
                  <td className="c">
                    <div className="dcp-row-actions">
                      <button
                        className="dcp-action-btn"
                        onClick={() => setSelectedCust(c)}
                        title="View details"
                      >
                        <i
                          className="bi bi-eye-fill"
                          style={{ color: "#4fc3f7" }}
                        ></i>
                      </button>
                      {c.phone && (
                        <button
                          className="dcp-action-btn"
                          onClick={() => {
                            const text = `Assalam o Alaikum *${c.name}*!\n\nAap ka outstanding amount hai:\n*PKR ${fmt(c.currentBalance)}*\n\nKindly clear karein.\n\n_Asim Electric and Electronic Store_`;
                            window.open(
                              `https://wa.me/${c.phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`,
                              "_blank",
                            );
                          }}
                          title="WhatsApp reminder"
                        >
                          <i
                            className="bi bi-whatsapp"
                            style={{ color: "#25d366" }}
                          ></i>
                        </button>
                      )}
                      <button
                        className="dcp-action-btn"
                        onClick={() => navigate("/debit-sale")}
                        title="New sale"
                      >
                        <i
                          className="bi bi-cart-plus-fill"
                          style={{ color: "#ffa726" }}
                        ></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="dcp-tfoot">
                <td colSpan={5} className="bold">
                  Total ({filtered.length} customers)
                </td>
                <td className="r bold red">
                  PKR{" "}
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
