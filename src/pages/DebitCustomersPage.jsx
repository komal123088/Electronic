import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api.js";
import EP from "../api/apiEndpoints.js";
import "../styles/theme.css";
import "../styles/CreditCustomersPage.css";

const fmt = (n) => Number(n || 0).toLocaleString("en-PK");
const isoD = () => new Date().toISOString().split("T")[0];

/* ─────────────────────────────────────────────────────────────
   CUSTOMER DETAIL MODAL
───────────────────────────────────────────────────────────── */
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
    const text = `ASIM ELECTRIC & ELECTRONIC STORE\n${sep}\n${customer.name}${customer.phone ? "\n" + customer.phone : ""}\nDate: ${isoD()}\n${sep}\nTRANSACTIONS (Last ${Math.min(sales.length, 15)})\n\n${invLines}\n${sep}\nSUMMARY\nTotal Purchases: PKR ${fmt(totalS)}\nPaid at Sale: PKR ${fmt(totalP)}\nLater Payments: PKR ${fmt(payTotal)}\nOutstanding: PKR ${fmt(customer.currentBalance || 0)}\n${sep}\nPlease clear your dues. Thank you!`;
    window.open(
      `https://wa.me/${(customer.phone || "").replace(/\D/g, "")}?text=${encodeURIComponent(text)}`,
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
      className="xp-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="xp-modal">
        {/* ── Titlebar ── */}
        <div className="xp-modal-tb">
          <svg
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="rgba(255,255,255,0.8)"
          >
            <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0m4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4" />
          </svg>
          <span className="xp-modal-title">
            {customer.name}
            {customer.code && (
              <span className="xp-modal-code">{customer.code}</span>
            )}
          </span>
          <button
            className="xp-btn xp-btn-wa xp-btn-sm"
            onClick={sendWA}
            disabled={!sales.length}
            style={{ marginRight: 4 }}
          >
            <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
              <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326z" />
            </svg>
            Statement
          </button>
          <button className="xp-cap-btn xp-cap-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* ── Info strip ── */}
        <div className="cc-info-strip">
          <div className="cc-info-meta">
            {customer.phone && (
              <span className="cc-info-chip">
                <svg width="11" height="11" viewBox="0 0 16 16" fill="#0a246a">
                  <path d="M3.654 1.328a.678.678 0 0 0-1.015-.063L1.605 2.3c-.483.484-.661 1.169-.45 1.77a17.6 17.6 0 0 0 4.168 6.608 17.6 17.6 0 0 0 6.608 4.168c.601.211 1.286.033 1.77-.45l1.034-1.034a.678.678 0 0 0-.063-1.015l-2.307-1.794a.68.68 0 0 0-.58-.122l-2.19.547a1.75 1.75 0 0 1-1.657-.459L5.482 8.062a1.75 1.75 0 0 1-.46-1.657l.548-2.19a.68.68 0 0 0-.122-.58z" />
                </svg>
                {customer.phone}
              </span>
            )}
            {customer.address && (
              <span className="cc-info-chip">
                <svg width="11" height="11" viewBox="0 0 16 16" fill="#0a246a">
                  <path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10m0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6" />
                </svg>
                {customer.address}
              </span>
            )}
            {customer.area && (
              <span className="cc-info-chip">
                <svg width="11" height="11" viewBox="0 0 16 16" fill="#0a246a">
                  <path
                    fillRule="evenodd"
                    d="M15.817.113A.5.5 0 0 1 16 .5v14a.5.5 0 0 1-.402.49l-5 1a.5.5 0 0 1-.196 0L5.5 15.01l-4.902.98A.5.5 0 0 1 0 15.5v-14a.5.5 0 0 1 .402-.49l5-1a.5.5 0 0 1 .196 0L10.5.99l4.902-.98a.5.5 0 0 1 .415.103z"
                  />
                </svg>
                {customer.area}
              </span>
            )}
          </div>

          <div className="cc-stat-row">
            <div className="cc-mini-stat">
              <div className="cc-mini-lbl">Total Sales</div>
              <div className="cc-mini-val">PKR {fmt(totalSales)}</div>
            </div>
            <div className="cc-mini-stat">
              <div className="cc-mini-lbl">Paid at Sale</div>
              <div className="cc-mini-val success">PKR {fmt(totalPaid)}</div>
            </div>
            <div className="cc-mini-stat">
              <div className="cc-mini-lbl">Later Payments</div>
              <div className="cc-mini-val success">PKR {fmt(payTotal)}</div>
            </div>
            <div className="cc-mini-stat danger">
              <div className="cc-mini-lbl">Outstanding</div>
              <div className="cc-mini-val danger">PKR {fmt(outstanding)}</div>
            </div>
            <div className="cc-mini-stat">
              <div className="cc-mini-lbl">Transactions</div>
              <div className="cc-mini-val">{sales.length}</div>
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="xp-tab-bar">
          <button
            className={`xp-tab${activeTab === "history" ? " active" : ""}`}
            onClick={() => setActiveTab("history")}
          >
            <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 1a7 7 0 1 0 4.95 11.95l.707.707A8.001 8.001 0 1 1 8 0z" />
              <path d="M7.5 3a.5.5 0 0 1 .5.5v5.21l3.248 1.856a.5.5 0 0 1-.496.868l-3.5-2A.5.5 0 0 1 7 9V3.5a.5.5 0 0 1 .5-.5" />
            </svg>
            Transaction History
            <span className="xp-tab-cnt">{sales.length}</span>
          </button>
          <button
            className={`xp-tab${activeTab === "payments" ? " active" : ""}`}
            onClick={() => setActiveTab("payments")}
          >
            <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
              <path d="M12.136.326A1.5 1.5 0 0 1 14 1.78V3h.5A1.5 1.5 0 0 1 16 4.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 0 13.5v-9A1.5 1.5 0 0 1 1.432 3.001L12.136.326z" />
            </svg>
            Payment History
            <span className="xp-tab-cnt">{payments.length}</span>
          </button>
          <button
            className={`xp-tab${activeTab === "pay" ? " active" : ""}`}
            onClick={() => {
              setActiveTab("pay");
              setTimeout(() => payRef.current?.focus(), 50);
            }}
          >
            <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
              <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4" />
            </svg>
            Record Payment
          </button>
        </div>

        {/* ── Body ── */}
        <div className="xp-modal-body">
          {/* HISTORY TAB */}
          {activeTab === "history" && (
            <>
              {loadingSales && (
                <div className="xp-loading">Loading transactions…</div>
              )}
              {!loadingSales && sales.length === 0 && (
                <div className="xp-empty">No transactions found</div>
              )}
              {!loadingSales && sales.length > 0 && (
                <div className="xp-table-panel">
                  <div className="xp-table-scroll">
                    <table className="xp-table">
                      <thead>
                        <tr>
                          <th style={{ width: 30 }}>#</th>
                          <th>Invoice</th>
                          <th>Date</th>
                          <th className="r">Net Total</th>
                          <th className="r">Paid</th>
                          <th className="r">Balance</th>
                          <th>Mode</th>
                          <th style={{ width: 24 }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {sales.map((s, i) => (
                          <>
                            <tr
                              key={s._id}
                              className={
                                expandedSale === s._id ? "cc-row-expanded" : ""
                              }
                              onClick={() =>
                                setExpandedSale(
                                  expandedSale === s._id ? null : s._id,
                                )
                              }
                            >
                              <td className="text-muted">{i + 1}</td>
                              <td
                                style={{
                                  fontFamily: "var(--xp-mono)",
                                  fontSize: "11px",
                                  fontWeight: 700,
                                }}
                              >
                                {s.invoiceNo}
                              </td>
                              <td className="text-muted">{s.invoiceDate}</td>
                              <td className="r xp-amt">{fmt(s.netTotal)}</td>
                              <td className="r xp-amt success">
                                {fmt(s.paidAmount)}
                              </td>
                              <td className="r">
                                {(s.balance || 0) > 0 ? (
                                  <span className="xp-amt danger">
                                    {fmt(s.balance)}
                                  </span>
                                ) : (
                                  <span className="text-muted">—</span>
                                )}
                              </td>
                              <td>
                                <span className="xp-badge xp-badge-info">
                                  {s.paymentMode || "—"}
                                </span>
                              </td>
                              <td
                                style={{
                                  textAlign: "center",
                                  color: "#555",
                                  fontSize: 11,
                                }}
                              >
                                {expandedSale === s._id ? "▲" : "▼"}
                              </td>
                            </tr>

                            {expandedSale === s._id && (
                              <tr key={`${s._id}-detail`}>
                                <td colSpan={8} className="cc-detail-cell">
                                  <div className="cc-detail-inner">
                                    <table
                                      className="xp-table"
                                      style={{ fontSize: "11px" }}
                                    >
                                      <thead>
                                        <tr>
                                          <th style={{ width: 24 }}>#</th>
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
                                            <td
                                              colSpan={7}
                                              className="text-muted"
                                              style={{
                                                padding: "8px",
                                                textAlign: "center",
                                              }}
                                            >
                                              Items not loaded
                                            </td>
                                          </tr>
                                        )}
                                        {(s.items || []).map((it, j) => (
                                          <tr key={j}>
                                            <td className="text-muted">
                                              {j + 1}
                                            </td>
                                            <td>{it.description}</td>
                                            <td className="text-muted">
                                              {it.measurement || "—"}
                                            </td>
                                            <td className="r">{it.qty}</td>
                                            <td className="r xp-amt">
                                              {fmt(it.rate)}
                                            </td>
                                            <td className="r">
                                              {it.disc || 0}%
                                            </td>
                                            <td className="r xp-amt">
                                              {fmt(it.amount)}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                  <div className="cc-detail-footer">
                                    <span>
                                      Net:{" "}
                                      <strong>PKR {fmt(s.netTotal)}</strong>
                                    </span>
                                    <span style={{ color: "var(--xp-green)" }}>
                                      Paid:{" "}
                                      <strong>PKR {fmt(s.paidAmount)}</strong>
                                    </span>
                                    {(s.balance || 0) > 0 && (
                                      <span style={{ color: "var(--xp-red)" }}>
                                        Balance:{" "}
                                        <strong>PKR {fmt(s.balance)}</strong>
                                      </span>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {/* PAYMENTS TAB */}
          {activeTab === "payments" && (
            <>
              {loadingPay && (
                <div className="xp-loading">Loading payments…</div>
              )}
              {!loadingPay && payments.length === 0 && (
                <div className="xp-empty">No payments found</div>
              )}
              {!loadingPay && payments.length > 0 && (
                <div className="xp-table-panel">
                  <div className="xp-table-scroll">
                    <table className="xp-table">
                      <thead>
                        <tr>
                          <th style={{ width: 30 }}>#</th>
                          <th>Date</th>
                          <th className="r">Amount</th>
                          <th>Mode</th>
                          <th>Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.map((p, i) => (
                          <tr key={p._id || i}>
                            <td className="text-muted">{i + 1}</td>
                            <td className="text-muted">
                              {p.paymentDate || p.createdAt?.split("T")[0]}
                            </td>
                            <td className="r xp-amt success">
                              PKR {fmt(p.amount)}
                            </td>
                            <td>
                              <span className="xp-badge xp-badge-info">
                                {p.paymentMode || "Cash"}
                              </span>
                            </td>
                            <td className="text-muted">{p.remarks || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan={2} className="text-muted">
                            Total Payments
                          </td>
                          <td className="r xp-amt success">
                            PKR {fmt(payTotal)}
                          </td>
                          <td colSpan={2}></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {/* PAYMENT FORM TAB */}
          {activeTab === "pay" && (
            <div className="cc-pay-form">
              <div className="cc-due-banner">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <path d="M7.938 2.016A.13.13 0 0 1 8.002 2a.13.13 0 0 1 .063.016.15.15 0 0 1 .054.057l6.857 11.667c.036.06.035.124.002.183a.2.2 0 0 1-.054.06.1.1 0 0 1-.066.017H1.146a.1.1 0 0 1-.066-.017.2.2 0 0 1-.054-.06.18.18 0 0 1 .002-.183L7.884 2.073a.15.15 0 0 1 .054-.057m1.044-.45a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767z" />
                  <path d="M7.002 12a1 1 0 1 1 2 0 1 1 0 0 1-2 0M7.1 5.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0z" />
                </svg>
                <span>Outstanding Due</span>
                <strong>PKR {fmt(outstanding)}</strong>
              </div>

              {payMsg.text && (
                <div
                  className={`xp-alert ${payMsg.type === "success" ? "xp-alert-success" : "xp-alert-error"}`}
                  style={{ marginBottom: 10 }}
                >
                  {payMsg.text}
                </div>
              )}

              <div className="cc-pay-form-row">
                <div className="xp-form-grp">
                  <label className="xp-label">Amount (PKR)</label>
                  <div className="cc-pfx-wrap">
                    <span className="cc-pfx">PKR</span>
                    <input
                      ref={payRef}
                      type="number"
                      className="xp-input xp-input-lg"
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handlePay();
                      }}
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="xp-form-grp">
                  <label className="xp-label">Payment Mode</label>
                  <select
                    className="xp-select xp-input-lg"
                    value={payMode}
                    onChange={(e) => setPayMode(e.target.value)}
                  >
                    <option>Cash</option>
                    <option>Bank</option>
                    <option>Cheque</option>
                    <option>Online</option>
                  </select>
                </div>
              </div>

              <div className="xp-form-grp" style={{ marginBottom: 12 }}>
                <label className="xp-label">Remarks</label>
                <input
                  type="text"
                  className="xp-input xp-input-lg"
                  value={payRemarks}
                  onChange={(e) => setPayRemarks(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handlePay();
                  }}
                  placeholder="e.g. Cash received, Cheque no…"
                />
              </div>

              <button
                className="xp-btn xp-btn-success xp-btn-lg"
                onClick={handlePay}
                disabled={paying}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
                  <path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05" />
                </svg>
                {paying ? "Processing…" : "Record Payment"}
              </button>
            </div>
          )}
        </div>

        <div className="xp-modal-footer">
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

  const totalCustomers = customers.length;
  const dueCustomers = customers.filter((c) => (c.currentBalance || 0) > 0);
  const clearCustomers = customers.filter((c) => (c.currentBalance || 0) <= 0);
  const totalDue = dueCustomers.reduce(
    (s, c) => s + (c.currentBalance || 0),
    0,
  );

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

  const sendBulkReminder = () => {
    const dueList = filtered.filter((c) => (c.currentBalance || 0) > 0);
    if (!dueList.length) {
      showMsg("No due customers", "error");
      return;
    }
    const lines = dueList
      .map(
        (c, i) =>
          `${i + 1}. ${c.name}${c.phone ? " (" + c.phone + ")" : ""} — *PKR ${fmt(c.currentBalance)}*`,
      )
      .join("\n");
    const text = `ASIM ELECTRIC & ELECTRONIC STORE\n${"━".repeat(28)}\nOUTSTANDING DUE — DEBIT CUSTOMERS\n${isoD()}\n${"─".repeat(28)}\n${lines}\n${"─".repeat(28)}\nTotal Due: PKR ${fmt(dueList.reduce((s, c) => s + (c.currentBalance || 0), 0))}\nCustomers with Due: ${dueList.length}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100%",
        background: "var(--xp-silver-1)",
      }}
    >
      {selectedCust && (
        <CustomerDetailModal
          customer={selectedCust}
          onClose={() => setSelectedCust(null)}
          onPaymentDone={loadCustomers}
        />
      )}

      {/* ── Titlebar ── */}
      <div className="xp-titlebar">
        <button
          className="xp-cap-btn"
          onClick={() => navigate("/debit-sale")}
          title="Debit Sale"
          style={{ marginRight: 2 }}
        >
          <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8"
            />
          </svg>
        </button>
        <svg
          width="15"
          height="15"
          viewBox="0 0 16 16"
          fill="rgba(255,255,255,0.85)"
        >
          <path d="M15 14s1 0 1-1-1-4-5-4-5 3-5 4 1 1 1 1zm-7.978-1A.261.261 0 0 1 7 12.996c.001-.264.167-1.03.76-1.72C8.312 10.629 9.282 10 11 10c1.717 0 2.687.63 3.24 1.276.593.69.758 1.457.76 1.72l-.008.002A.274.274 0 0 1 15 13zM11 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4m3-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0M6.936 9.28a6 6 0 0 0-1.23-.247A7 7 0 0 0 5 9c-4 0-5 3-5 4q0 1 1 1h4.216A2.24 2.24 0 0 1 5 13c0-1.01.377-2.042 1.09-2.904.243-.294.526-.569.846-.816M4.92 10A5.5 5.5 0 0 0 4 13H1c0-.26.164-1.03.76-1.724.545-.636 1.492-1.256 3.16-1.275ZM1.5 5.5a3 3 0 1 1 6 0 3 3 0 0 1-6 0m3-2a2 2 0 1 0 0 4 2 2 0 0 0 0-4" />
        </svg>
        <span className="xp-tb-title">
          Debit Customers — Asim Electric &amp; Electronic Store
        </span>
        <div className="xp-tb-actions">
          <button
            className="xp-btn xp-btn-wa xp-btn-sm"
            onClick={sendBulkReminder}
          >
            <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
              <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326z" />
            </svg>
            Bulk Reminder
          </button>
          <button
            className="xp-btn xp-btn-primary xp-btn-sm"
            onClick={() => navigate("/customers")}
          >
            <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
              <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4" />
            </svg>
            Add Customer
          </button>
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
          style={{ margin: "6px 12px 0" }}
        >
          {msg.text}
        </div>
      )}

      <div className="xp-page-body">
        {/* ── Stats ── */}
        <div className="cc-stat-grid">
          <div className="cc-stat-card">
            <div className="cc-stat-label">Total Customers</div>
            <div className="cc-stat-val">{totalCustomers}</div>
          </div>
          <div className="cc-stat-card red">
            <div className="cc-stat-label">With Due</div>
            <div className="cc-stat-val danger">{dueCustomers.length}</div>
          </div>
          <div className="cc-stat-card green">
            <div className="cc-stat-label">Cleared</div>
            <div className="cc-stat-val success">{clearCustomers.length}</div>
          </div>
          <div className="cc-stat-card red">
            <div className="cc-stat-label">Total Outstanding</div>
            <div className="cc-stat-val danger" style={{ fontSize: 15 }}>
              PKR {fmt(totalDue)}
            </div>
          </div>
          {/* placeholder 5th card to keep grid balanced */}
          <div className="cc-stat-card">
            <div className="cc-stat-label">Filtered</div>
            <div className="cc-stat-val">{filtered.length}</div>
          </div>
        </div>

        {/* ── Toolbar ── */}
        <div className="xp-toolbar">
          <div className="xp-search-wrap" style={{ flex: 1, minWidth: 200 }}>
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
              ref={searchRef}
              type="text"
              className="xp-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, phone, code or area…"
            />
          </div>

          <div className="xp-toolbar-divider" />

          <div className="xp-filter-group">
            <button
              className={`xp-filter-btn${filterType === "all" ? " active" : ""}`}
              onClick={() => setFilterType("all")}
            >
              All <span className="xp-filter-cnt">{totalCustomers}</span>
            </button>
            <button
              className={`xp-filter-btn${filterType === "due" ? " active" : ""}`}
              onClick={() => setFilterType("due")}
            >
              Due <span className="xp-filter-cnt">{dueCustomers.length}</span>
            </button>
            <button
              className={`xp-filter-btn${filterType === "clear" ? " active" : ""}`}
              onClick={() => setFilterType("clear")}
            >
              Clear{" "}
              <span className="xp-filter-cnt">{clearCustomers.length}</span>
            </button>
          </div>

          <div className="xp-toolbar-divider" />

          <label
            className="xp-label"
            style={{ marginBottom: 0, whiteSpace: "nowrap" }}
          >
            Sort by:
          </label>
          <select
            className="xp-select"
            style={{ width: "auto" }}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="name">Name A–Z</option>
            <option value="balance">Balance High–Low</option>
          </select>

          <div className="xp-toolbar-divider" />
          <span
            style={{
              fontSize: "var(--xp-fs-xs)",
              color: "#555",
              whiteSpace: "nowrap",
            }}
          >
            {filtered.length} record(s)
          </span>
        </div>

        {/* ── Table ── */}
        <div className="xp-table-panel">
          {loading && (
            <div className="xp-loading">Loading debit customers…</div>
          )}
          {!loading && filtered.length === 0 && (
            <div className="xp-empty">No debit customers found</div>
          )}
          {!loading && filtered.length > 0 && (
            <div className="xp-table-scroll">
              <table className="xp-table">
                <thead>
                  <tr>
                    <th style={{ width: 32 }}>#</th>
                    <th>Code</th>
                    <th>Customer Name</th>
                    <th>Phone</th>
                    <th>Area</th>
                    <th className="r">Outstanding (PKR)</th>
                    <th>Status</th>
                    <th style={{ width: 100 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c, i) => (
                    <tr
                      key={c._id}
                      className={
                        (c.currentBalance || 0) > 0 ? "cc-row-due" : ""
                      }
                    >
                      <td
                        className="text-muted"
                        style={{ fontSize: "var(--xp-fs-xs)" }}
                      >
                        {i + 1}
                      </td>
                      <td>
                        {c.code ? (
                          <span className="xp-code">{c.code}</span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td>
                        <button
                          className="xp-link-btn"
                          onClick={() => setSelectedCust(c)}
                        >
                          {c.name}
                        </button>
                      </td>
                      <td className="text-muted">{c.phone || "—"}</td>
                      <td className="text-muted">{c.area || "—"}</td>
                      <td className="r">
                        <span
                          className={`xp-amt${(c.currentBalance || 0) > 0 ? " danger" : " muted"}`}
                        >
                          {fmt(c.currentBalance || 0)}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`xp-badge ${(c.currentBalance || 0) > 0 ? "xp-badge-due" : "xp-badge-clear"}`}
                        >
                          {(c.currentBalance || 0) > 0 ? "Due" : "Clear"}
                        </span>
                      </td>
                      <td>
                        <div className="cc-act">
                          <button
                            className="xp-btn xp-btn-sm xp-btn-ico"
                            title="View details"
                            onClick={() => setSelectedCust(c)}
                          >
                            <svg
                              width="11"
                              height="11"
                              viewBox="0 0 16 16"
                              fill="currentColor"
                            >
                              <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1L14 5.5z" />
                            </svg>
                          </button>
                          {c.phone && (
                            <button
                              className="xp-btn xp-btn-sm xp-btn-ico cc-btn-wa-sm"
                              title="WhatsApp"
                              onClick={() => {
                                const text = `Assalam o Alaikum *${c.name}*!\n\nAap ka outstanding amount hai:\n*PKR ${fmt(c.currentBalance)}*\n\nKindly clear karein.\n\n_Asim Electric and Electronic Store_`;
                                window.open(
                                  `https://wa.me/${c.phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`,
                                  "_blank",
                                );
                              }}
                            >
                              <svg
                                width="11"
                                height="11"
                                viewBox="0 0 16 16"
                                fill="currentColor"
                              >
                                <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326z" />
                              </svg>
                            </button>
                          )}
                          <button
                            className="xp-btn xp-btn-sm xp-btn-ico"
                            title="New debit sale"
                            onClick={() => navigate("/debit-sale")}
                          >
                            <svg
                              width="11"
                              height="11"
                              viewBox="0 0 16 16"
                              fill="currentColor"
                            >
                              <path d="M.5 1a.5.5 0 0 0 0 1h1.11l.401 1.607 1.498 7.985A.5.5 0 0 0 4 12h1a2 2 0 1 0 0 4 2 2 0 0 0 0-4h7a2 2 0 1 0 0 4 2 2 0 0 0 0-4h1a.5.5 0 0 0 .491-.408l1.5-8A.5.5 0 0 0 14.5 3H2.89l-.405-1.621A.5.5 0 0 0 2 1z" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={5} className="text-muted">
                      Total — {filtered.length} customers
                    </td>
                    <td className="r xp-amt danger">
                      {fmt(
                        filtered.reduce(
                          (s, c) => s + Math.max(0, c.currentBalance || 0),
                          0,
                        ),
                      )}
                    </td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Status Bar ── */}
      <div className="xp-statusbar" style={{ marginTop: "auto" }}>
        <div className="xp-status-pane">
          <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
            <path d="M15 14s1 0 1-1-1-4-5-4-5 3-5 4 1 1 1 1z" />
            <path d="M11 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4" />
          </svg>
          {totalCustomers} customers
        </div>
        <div className="xp-status-pane">
          <svg width="10" height="10" viewBox="0 0 16 16" fill="var(--xp-red)">
            <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0M7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0z" />
            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
          </svg>
          {dueCustomers.length} due
        </div>
        <div className="xp-status-pane">Outstanding: PKR {fmt(totalDue)}</div>
      </div>
    </div>
  );
}
