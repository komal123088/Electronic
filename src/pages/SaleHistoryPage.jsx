import { useState, useEffect, useRef, useCallback } from "react";
import "../styles/SaleHistoryPage.css";
import api from "../api/api.js";
import EP from "../api/apiEndpoints.js";

const fmt = (n) => Number(n || 0).toLocaleString("en-PK");
const SHOP = "Asim Electric and Electronic Store";
const today = () => new Date().toISOString().split("T")[0];
const dAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
};
const fmtD = (s) => {
  if (!s) return "—";
  const [y, m, d] = s.split("-");
  return `${d}-${m}-${y}`;
};

const PRESETS = [
  { label: "Today", key: "today", from: today, to: today },
  { label: "Yesterday", key: "yest", from: () => dAgo(1), to: () => dAgo(1) },
  { label: "Last 7d", key: "7d", from: () => dAgo(6), to: today },
  { label: "Last 30d", key: "30d", from: () => dAgo(29), to: today },
  { label: "All", key: "all", from: () => "", to: () => "" },
];

// tab config
const TABS = [
  { key: "all", label: "All Sales", icon: "bi-list-ul", src: "" },
  { key: "debit", label: "Debit Sales", icon: "bi-cart-check", src: "debit" },
  {
    key: "credit",
    label: "Credit Sales",
    icon: "bi-person-badge",
    src: "credit",
  },
  { key: "cash", label: "Cash/Counter", icon: "bi-cash-coin", src: "cash" },
  {
    key: "return",
    label: "Returns",
    icon: "bi-arrow-return-left",
    src: "return",
  },
];

// ── Print invoice ─────────────────────────────────────────────────────────────
function printInvoice(sale) {
  const rows = (sale.items || [])
    .map(
      (it, i) =>
        `<tr><td>${i + 1}</td><td>${it.description}</td><td>${it.measurement || ""}</td>
    <td align="right">${it.qty}</td><td align="right">${Number(it.rate).toLocaleString()}</td>
    <td align="right">${it.disc || 0}%</td><td align="right"><b>${Number(it.amount).toLocaleString()}</b></td></tr>`,
    )
    .join("");
  const srcLabel =
    sale.saleSource === "debit"
      ? "DEBIT SALE"
      : sale.saleSource === "credit"
        ? "CREDIT SALE"
        : "CASH SALE";
  const win = window.open("", "_blank", "width=820,height=640");
  win.document
    .write(`<!DOCTYPE html><html><head><title>${sale.invoiceNo}</title>
  <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;font-size:12px;padding:18px}
  h2{text-align:center;font-size:18px}h3{text-align:center;color:#555;font-size:11px;margin:2px 0 10px;letter-spacing:1px}
  .meta{display:flex;justify-content:space-between;border:1px solid #ccc;padding:6px 10px;margin:8px 0;flex-wrap:wrap;gap:4px;background:#f8f8f8}
  table{width:100%;border-collapse:collapse}th{background:#1e4d8c;color:#fff;padding:5px 7px;border:1px solid #0a2d6a}
  td{border:1px solid #ccc;padding:4px 7px}tr:nth-child(even)td{background:#f5f8ff}
  .tots{float:right;min-width:210px;border:1px solid #ccc;padding:8px 12px;background:#f8f8f8;margin-top:10px}
  .tr{display:flex;justify-content:space-between;padding:2px 0;font-size:12px}
  .tr.b{font-weight:bold;font-size:14px;border-top:2px solid #333;margin-top:4px}
  .red{color:red}.green{color:green}
  .footer{text-align:center;margin-top:24px;color:#888;font-size:11px;clear:both;border-top:1px solid #ddd;padding-top:8px}
  @media print{body{padding:5mm}}</style></head><body>
  <h2>${SHOP}</h2><h3>${srcLabel}</h3>
  <div class="meta">
    <span><b>Invoice:</b> ${sale.invoiceNo}</span>
    <span><b>Date:</b> ${fmtD(sale.invoiceDate)}</span>
    <span><b>Customer:</b> ${sale.customerName || "COUNTER SALE"}</span>
    ${sale.customerPhone ? `<span><b>Phone:</b> ${sale.customerPhone}</span>` : ""}
    <span><b>Payment:</b> ${sale.paymentMode}</span>
  </div>
  <table><thead><tr><th>#</th><th>Description</th><th>Meas</th><th align="right">Qty</th><th align="right">Rate</th><th align="right">Disc%</th><th align="right">Amount</th></tr></thead>
  <tbody>${rows}</tbody></table>
  <div class="tots">
    <div class="tr"><span>Sub Total</span><span>${Number(sale.subTotal || 0).toLocaleString()}</span></div>
    ${(sale.discAmount || 0) > 0 ? `<div class="tr red"><span>Discount</span><span>-${Number(sale.discAmount).toLocaleString()}</span></div>` : ""}
    <div class="tr b"><span>Net Total</span><span>${Number(sale.netTotal || 0).toLocaleString()}</span></div>
    ${(sale.prevBalance || 0) > 0 ? `<div class="tr"><span>Prev Balance</span><span class="red">${Number(sale.prevBalance).toLocaleString()}</span></div>` : ""}
    <div class="tr green"><span>Paid</span><span>${Number(sale.paidAmount || 0).toLocaleString()}</span></div>
    ${(sale.balance || 0) > 0 ? `<div class="tr b red"><span>Balance</span><span>${Number(sale.balance).toLocaleString()}</span></div>` : ""}
  </div>
  ${sale.remarks ? `<p style="clear:both;margin-top:8px;font-size:11px;color:#555"><b>Remarks:</b> ${sale.remarks}</p>` : ""}
  <div class="footer">Thank you! — ${SHOP}</div></body></html>`);
  win.document.close();
  setTimeout(() => win.print(), 400);
}

// ── WhatsApp ──────────────────────────────────────────────────────────────────
function shareWA(sale) {
  const lines = (sale.items || [])
    .map(
      (it, i) =>
        `${i + 1}. ${it.description}${it.measurement ? " (" + it.measurement + ")" : ""}  ${it.qty}×${Number(it.rate).toLocaleString()} = *${Number(it.amount).toLocaleString()}*`,
    )
    .join("\n");
  const srcLabel =
    sale.saleSource === "debit"
      ? "Debit Sale"
      : sale.saleSource === "credit"
        ? "Credit Sale"
        : "Cash Sale";
  const msg =
    `*${SHOP}*\n🧾 *${srcLabel} — ${sale.invoiceNo}*\n📅 ${fmtD(sale.invoiceDate)}\n` +
    `👤 ${sale.customerName || "Counter Sale"}` +
    (sale.customerPhone ? `  📞 ${sale.customerPhone}` : "") +
    "\n" +
    `${"─".repeat(26)}\n${lines}\n${"─".repeat(26)}\n` +
    `*Net Total: Rs. ${Number(sale.netTotal || 0).toLocaleString()}*\n` +
    ((sale.balance || 0) > 0
      ? `⚠️ Balance: Rs. ${Number(sale.balance).toLocaleString()}\n`
      : "") +
    `_Thank you!_`;
  const ph = sale.customerPhone?.replace(/[^0-9]/g, "");
  window.open(
    ph
      ? `https://wa.me/92${ph.replace(/^0/, "")}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`,
    "_blank",
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════
export default function SaleHistoryPage() {
  const [sales, setSales] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selSale, setSelSale] = useState(null);
  const [selIdx, setSelIdx] = useState(-1);

  // filters
  const [activeTab, setActiveTab] = useState("all");
  const [preset, setPreset] = useState("today");
  const [dateFrom, setDateFrom] = useState(today());
  const [dateTo, setDateTo] = useState(today());
  const [search, setSearch] = useState("");
  const [payFilter, setPayFilter] = useState("");

  const searchRef = useRef(null);
  const tableRef = useRef(null);
  const searchTimer = useRef(null);

  useEffect(() => {
    applyPreset("today");
  }, []);

  const applyPreset = (key) => {
    setPreset(key);
    const p = PRESETS.find((x) => x.key === key);
    if (!p) return;
    const f = p.from();
    const t = p.to();
    setDateFrom(f);
    setDateTo(t);
    fetchData(f, t, search, activeTab, payFilter);
  };

  const fetchData = useCallback(
    async (
      from = dateFrom,
      to = dateTo,
      q = search,
      tab = activeTab,
      pay = payFilter,
    ) => {
      setLoading(true);
      setSelSale(null);
      setSelIdx(-1);
      try {
        const p = new URLSearchParams();
        if (from) p.set("dateFrom", from);
        if (to) p.set("dateTo", to);
        if (q) p.set("search", q);
        if (pay) p.set("paymentMode", pay);

        // tab → saleSource or saleType
        const tabObj = TABS.find((t) => t.key === tab);
        if (tabObj?.key === "return") p.set("saleType", "return");
        else if (tabObj?.src) p.set("saleSource", tabObj.src);
        else p.set("saleType", "sale"); // all = only sales (no returns unless tab=return)

        // For "all" tab include both
        if (tab === "all") p.delete("saleType");

        const [salesRes, sumRes] = await Promise.all([
          api.get(`${EP.SALES.GET_ALL}?${p}`),
          api.get(
            `${EP.SALES.SUMMARY}?dateFrom=${from || ""}&dateTo=${to || ""}`,
          ),
        ]);
        if (salesRes.data.success) setSales(salesRes.data.data);
        if (sumRes.data.success) setSummary(sumRes.data.data);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    },
    [],
  );

  const handleSearch = (v) => {
    setSearch(v);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(
      () => fetchData(dateFrom, dateTo, v, activeTab, payFilter),
      350,
    );
  };

  const handleTabClick = (key) => {
    setActiveTab(key);
    setPayFilter("");
    fetchData(dateFrom, dateTo, search, key, "");
  };

  const handlePayFilter = (v) => {
    setPayFilter(v);
    fetchData(dateFrom, dateTo, search, activeTab, v);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this sale record?")) return;
    try {
      await api.delete(EP.SALES.DELETE(id));
      setSales((prev) => prev.filter((s) => s._id !== id));
      setSelSale(null);
      setSelIdx(-1);
      fetchData(dateFrom, dateTo, search, activeTab, payFilter);
    } catch {}
  };

  // Tab counts from summary
  const tabCount = (key) => {
    if (!summary) return "";
    const m = {
      all: (summary.all?.count || 0) + (summary.returns?.count || 0),
      debit: summary.debit?.count || 0,
      credit: summary.credit?.count || 0,
      cash: summary.cash?.count || 0,
      return: summary.returns?.count || 0,
    };
    return m[key] || 0;
  };

  // keyboard
  const handleKey = (e) => {
    if (!sales.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const ni = Math.min(selIdx + 1, sales.length - 1);
      setSelIdx(ni);
      setSelSale(sales[ni]);
      tableRef.current
        ?.querySelectorAll("tbody tr")
        [ni]?.scrollIntoView({ block: "nearest" });
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const ni = Math.max(selIdx - 1, 0);
      setSelIdx(ni);
      setSelSale(sales[ni]);
      tableRef.current
        ?.querySelectorAll("tbody tr")
        [ni]?.scrollIntoView({ block: "nearest" });
    }
    if (e.key === "Enter" && selSale)
      setSelSale((prev) => (prev?._id === selSale._id ? null : selSale));
    if (e.key === "Delete" && selSale) handleDelete(selSale._id);
    if ((e.key === "p" || e.key === "P") && selSale) printInvoice(selSale);
  };

  const s = summary;

  return (
    <div
      className="sh-page"
      tabIndex={0}
      style={{ outline: "none" }}
      onKeyDown={handleKey}
    >
      {/* ── Top bar ─────────────────────────────────────── */}
      <div className="sh-topbar">
        <div className="sh-title">
          <i className="bi bi-clock-history"></i> Sale History
        </div>

        <div className="sh-date-btns">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              className={`sh-dbtn ${preset === p.key ? "active" : ""}`}
              onClick={() => applyPreset(p.key)}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="sh-custom">
          <i className="bi bi-calendar3"></i>
          <input
            type="date"
            className="sh-date-input"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPreset("custom");
            }}
          />
          <span>–</span>
          <input
            type="date"
            className="sh-date-input"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPreset("custom");
            }}
          />
          <button
            className="sh-apply-btn"
            onClick={() =>
              fetchData(dateFrom, dateTo, search, activeTab, payFilter)
            }
          >
            <i className="bi bi-funnel-fill"></i> Apply
          </button>
        </div>

        <div className="sh-search-box">
          <i className="bi bi-search sh-search-icon"></i>
          <input
            ref={searchRef}
            className="sh-search-input"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Invoice / Customer / Phone…"
          />
        </div>
      </div>

      {/* ── Tabs ────────────────────────────────────────── */}
      <div className="sh-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`sh-tab ${activeTab === t.key ? "active-" + t.key : ""}`}
            onClick={() => handleTabClick(t.key)}
          >
            <i className={`bi ${t.icon}`}></i>
            {t.label}
            <span className="sh-tab-count">{tabCount(t.key)}</span>
          </button>
        ))}
      </div>

      {/* ── Summary cards ───────────────────────────────── */}
      <div className="sh-cards">
        <div className="sh-card">
          <div className="sh-card-lbl">
            <i className="bi bi-bag-check"></i> Total Sales
          </div>
          <div className="sh-card-val">Rs. {fmt(s?.all?.total || 0)}</div>
          <div className="sh-card-sub">{s?.all?.count || 0} invoices</div>
        </div>
        <div className="sh-card">
          <div className="sh-card-lbl">
            <i className="bi bi-cart-check"></i> Debit Sales
          </div>
          <div className="sh-card-val">Rs. {fmt(s?.debit?.total || 0)}</div>
          <div className="sh-card-sub">
            {s?.debit?.count || 0} invoices &nbsp;|&nbsp; Due: Rs.
            {fmt(s?.debit?.balance || 0)}
          </div>
        </div>
        <div className="sh-card green">
          <div className="sh-card-lbl">
            <i className="bi bi-person-badge"></i> Credit Sales
          </div>
          <div className="sh-card-val">Rs. {fmt(s?.credit?.total || 0)}</div>
          <div className="sh-card-sub">
            {s?.credit?.count || 0} invoices &nbsp;|&nbsp; Due: Rs.
            {fmt(s?.credit?.balance || 0)}
          </div>
        </div>
        <div className="sh-card">
          <div className="sh-card-lbl">
            <i className="bi bi-cash-coin"></i> Cash/Counter
          </div>
          <div className="sh-card-val">Rs. {fmt(s?.cash?.total || 0)}</div>
          <div className="sh-card-sub">{s?.cash?.count || 0} invoices</div>
        </div>
        <div className="sh-card orange">
          <div className="sh-card-lbl">
            <i className="bi bi-arrow-return-left"></i> Returns
          </div>
          <div className="sh-card-val">Rs. {fmt(s?.returns?.total || 0)}</div>
          <div className="sh-card-sub">{s?.returns?.count || 0} invoices</div>
        </div>
      </div>

      {/* ── Filter bar ──────────────────────────────────── */}
      <div className="sh-filterbar">
        <span className="sh-flbl">
          <i className="bi bi-credit-card"></i> Payment:
        </span>
        <select
          className="sh-fsel"
          value={payFilter}
          onChange={(e) => handlePayFilter(e.target.value)}
        >
          <option value="">All Modes</option>
          <option value="Cash">Cash</option>
          <option value="Credit">Credit</option>
          <option value="Bank">Bank</option>
          <option value="Cheque">Cheque</option>
          <option value="Partial">Partial</option>
        </select>
        {(payFilter || search) && (
          <button
            className="sh-fbtn"
            onClick={() => {
              setPayFilter("");
              setSearch("");
              fetchData(dateFrom, dateTo, "", activeTab, "");
            }}
          >
            <i className="bi bi-x-circle"></i> Clear
          </button>
        )}
        <span className="sh-fcount">
          {loading ? (
            <>
              <i className="bi bi-hourglass-split"></i> Loading…
            </>
          ) : (
            <>
              <i className="bi bi-list-ul"></i> {sales.length} record
              {sales.length !== 1 ? "s" : ""} | ↑↓ navigate | Enter=details |
              P=print
            </>
          )}
        </span>
      </div>

      {/* ── Table ───────────────────────────────────────── */}
      <div className="sh-table-wrap" ref={tableRef}>
        <table className="sh-table">
          <thead>
            <tr>
              <th style={{ width: 30 }} className="c">
                #
              </th>
              <th style={{ width: 105 }}>Invoice</th>
              <th style={{ width: 88 }}>Date</th>
              <th>Customer</th>
              <th style={{ width: 70 }}>Source</th>
              <th style={{ width: 70 }}>Payment</th>
              <th className="c" style={{ width: 46 }}>
                Items
              </th>
              <th className="r" style={{ width: 90 }}>
                Net Total
              </th>
              <th className="r" style={{ width: 78 }}>
                Paid
              </th>
              <th className="r" style={{ width: 80 }}>
                Balance
              </th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={10} className="sh-empty">
                  <i className="bi bi-hourglass-split"></i> Loading…
                </td>
              </tr>
            )}
            {!loading && sales.length === 0 && (
              <tr>
                <td colSpan={10} className="sh-empty">
                  <i className="bi bi-inbox"></i> No records found
                </td>
              </tr>
            )}
            {sales.map((s, i) => (
              <tr
                key={s._id}
                className={
                  selSale?._id === s._id
                    ? "sh-row-sel"
                    : i % 2 === 0
                      ? "sh-row-even"
                      : "sh-row-odd"
                }
                onClick={() => {
                  setSelSale((p) => (p?._id === s._id ? null : s));
                  setSelIdx(i);
                }}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.stopPropagation();
                    setSelSale((p) => (p?._id === s._id ? null : s));
                  }
                }}
              >
                <td className="c" style={{ fontSize: 11, color: "#999" }}>
                  {i + 1}
                </td>
                <td style={{ fontWeight: "bold", color: "#1a3a7a" }}>
                  {s.invoiceNo}
                </td>
                <td>{fmtD(s.invoiceDate)}</td>
                <td style={{ maxWidth: 180 }}>
                  {s.customerName || "COUNTER SALE"}
                  {s.customerPhone && (
                    <span
                      style={{ color: "#888", fontSize: 10, marginLeft: 5 }}
                    >
                      {s.customerPhone}
                    </span>
                  )}
                </td>
                <td>
                  <span className={`sh-src ${s.saleSource || "cash"}`}>
                    {s.saleSource === "debit"
                      ? "Debit"
                      : s.saleSource === "credit"
                        ? "Credit"
                        : "Cash"}
                  </span>
                </td>
                <td>
                  <span className={`sh-pay ${s.paymentMode}`}>
                    {s.paymentMode}
                  </span>
                </td>
                <td className="c">{(s.items || []).length}</td>
                <td className="r" style={{ fontWeight: "bold" }}>
                  {fmt(s.netTotal)}
                </td>
                <td className="r" style={{ color: "#1a6a1a" }}>
                  {fmt(s.paidAmount)}
                </td>
                <td
                  className="r"
                  style={{
                    fontWeight: "bold",
                    color: (s.balance || 0) > 0 ? "#c00" : "#1a6a1a",
                  }}
                >
                  {fmt(s.balance)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Detail Panel ────────────────────────────────── */}
      <div className={`sh-detail ${selSale ? "" : "hidden"}`}>
        {selSale && (
          <>
            <div className="sh-det-hdr">
              <span className="sh-det-inv">
                <i className="bi bi-receipt"></i> {selSale.invoiceNo}
              </span>
              <span className="sh-det-cust">
                <i className="bi bi-person"></i>{" "}
                {selSale.customerName || "Counter Sale"}
                {selSale.customerPhone && (
                  <>
                    {" "}
                    &nbsp;<i className="bi bi-telephone"></i>{" "}
                    {selSale.customerPhone}
                  </>
                )}
              </span>
              <span style={{ fontSize: 11, color: "#666" }}>
                <i className="bi bi-calendar3"></i> {fmtD(selSale.invoiceDate)}
                &nbsp;{" "}
                <span className={`sh-src ${selSale.saleSource || "cash"}`}>
                  {selSale.saleSource === "debit"
                    ? "Debit Sale"
                    : selSale.saleSource === "credit"
                      ? "Credit Sale"
                      : "Cash Sale"}
                </span>
                &nbsp;{" "}
                <span className={`sh-pay ${selSale.paymentMode}`}>
                  {selSale.paymentMode}
                </span>
              </span>
              <div className="sh-det-actions">
                <button
                  className="sh-act-btn print"
                  onClick={() => printInvoice(selSale)}
                >
                  <i className="bi bi-printer"></i> Print
                </button>
                <button
                  className="sh-act-btn wa"
                  onClick={() => shareWA(selSale)}
                >
                  <i className="bi bi-whatsapp"></i> WhatsApp
                </button>
                <button
                  className="sh-act-btn danger"
                  onClick={() => handleDelete(selSale._id)}
                >
                  <i className="bi bi-trash"></i> Delete
                </button>
                <button className="sh-act-btn" onClick={() => setSelSale(null)}>
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>
            </div>

            <table className="sh-det-table">
              <thead>
                <tr>
                  <th style={{ width: 28 }}>#</th>
                  <th>Description</th>
                  <th style={{ width: 80 }}>Meas.</th>
                  <th className="r" style={{ width: 50 }}>
                    Qty
                  </th>
                  <th className="r" style={{ width: 80 }}>
                    Rate
                  </th>
                  <th className="r" style={{ width: 50 }}>
                    Disc%
                  </th>
                  <th className="r" style={{ width: 90 }}>
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {(selSale.items || []).map((it, i) => (
                  <tr key={i}>
                    <td className="c" style={{ textAlign: "center" }}>
                      {i + 1}
                    </td>
                    <td>{it.description}</td>
                    <td>{it.measurement || "—"}</td>
                    <td className="r">{it.qty}</td>
                    <td className="r">{fmt(it.rate)}</td>
                    <td className="r">{it.disc || 0}%</td>
                    <td className="r" style={{ fontWeight: "bold" }}>
                      {fmt(it.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="sh-det-totals">
              {(selSale.discAmount || 0) > 0 && (
                <div className="sh-det-tot-item">
                  <span className="lbl">Discount:</span>
                  <span className="val" style={{ color: "#c00" }}>
                    -{fmt(selSale.discAmount)}
                  </span>
                </div>
              )}
              <div className="sh-det-tot-item">
                <span className="lbl">Net Total:</span>
                <span className="val">{fmt(selSale.netTotal)}</span>
              </div>
              {(selSale.prevBalance || 0) > 0 && (
                <div className="sh-det-tot-item">
                  <span className="lbl">Prev Balance:</span>
                  <span className="val" style={{ color: "#c00" }}>
                    {fmt(selSale.prevBalance)}
                  </span>
                </div>
              )}
              <div className="sh-det-tot-item">
                <span className="lbl">Paid:</span>
                <span className="val" style={{ color: "#1a6a1a" }}>
                  {fmt(selSale.paidAmount)}
                </span>
              </div>
              {(selSale.balance || 0) > 0 && (
                <div className="sh-det-tot-item">
                  <span className="lbl">Balance:</span>
                  <span className="val" style={{ color: "#c00" }}>
                    {fmt(selSale.balance)}
                  </span>
                </div>
              )}
              {selSale.remarks && (
                <div className="sh-det-tot-item">
                  <span className="lbl">
                    <i className="bi bi-chat-left-text"></i>
                  </span>
                  <span style={{ fontSize: 11, color: "#666" }}>
                    {selSale.remarks}
                  </span>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
