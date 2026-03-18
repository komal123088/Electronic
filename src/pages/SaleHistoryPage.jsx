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

const TABS = [
  { key: "all", label: "All Sales", src: "" },
  { key: "debit", label: "Debit Sales", src: "debit" },
  { key: "credit", label: "Credit Sales", src: "credit" },
  { key: "cash", label: "Cash/Counter", src: "cash" },
  { key: "return", label: "Returns", src: "return" },
];

/* ── Inline SVG icons ── */
const Ic = {
  history: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8.515 1.019A7 7 0 0 0 8 1V0a8 8 0 0 1 .589.022zm2.004.45a7 7 0 0 0-.985-.299l.219-.976c.383.086.76.2 1.126.342zm1.61.752a7 7 0 0 0-.861-.517l.457-.889A8 8 0 0 1 12.45 2.2zm1.44 1.196a7 7 0 0 0-.656-.787l.708-.706A8 8 0 0 1 14.2 3.2zm.963 1.517a7 7 0 0 0-.398-.901l.883-.469A8 8 0 0 1 15.4 5.07zm.376 1.763a7 7 0 0 0-.115-.987l.975-.213a8 8 0 0 1 .131 1.126zM16 7h-1a7 7 0 0 0-.082-1.06l.974-.222A8 8 0 0 1 16 7M8 3.5a.5.5 0 0 1 .5.5v4.375l2.82 1.128a.5.5 0 0 1-.646.742l-3-1.2A.5.5 0 0 1 7.5 8V4a.5.5 0 0 1 .5-.5M4.5 2.134A7 7 0 1 0 9 15.95V14.9a6 6 0 1 1-4.5-11.282z" />
    </svg>
  ),
  search: (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
      <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0" />
    </svg>
  ),
  cal: (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
      <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5M2 2a1 1 0 0 0-1 1v1h14V3a1 1 0 0 0-1-1zm13 3H1v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1z" />
    </svg>
  ),
  filter: (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
      <path d="M1.5 1.5A.5.5 0 0 1 2 1h12a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.128.334L10 8.692V13.5a.5.5 0 0 1-.342.474l-3 1A.5.5 0 0 1 6 14.5V8.692L1.628 3.834A.5.5 0 0 1 1.5 3.5z" />
    </svg>
  ),
  pay: (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
      <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v1h14V4a1 1 0 0 0-1-1zm13 4H1v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1zM2 10h2a1 1 0 0 1 0 2H2a1 1 0 0 1 0-2m4 0h6a1 1 0 0 1 0 2H6a1 1 0 0 1 0-2" />
    </svg>
  ),
  clear: (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
      <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708" />
    </svg>
  ),
  list: (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5"
      />
    </svg>
  ),
  cart: (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
      <path d="M.5 1a.5.5 0 0 0 0 1h1.11l.401 1.607 1.498 7.985A.5.5 0 0 0 4 12h1a2 2 0 1 0 0 4 2 2 0 0 0 0-4h7a2 2 0 1 0 0 4 2 2 0 0 0 0-4h1a.5.5 0 0 0 .491-.408l1.5-8A.5.5 0 0 0 14.5 3H2.89l-.405-1.621A.5.5 0 0 0 2 1z" />
    </svg>
  ),
  person: (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0m4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4" />
    </svg>
  ),
  cash: (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4m0 1a3 3 0 1 1 0-6 3 3 0 0 1 0 6" />
      <path d="M0 4a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H1a1 1 0 0 1-1-1zm3 0a2 2 0 0 1-2 2v4a2 2 0 0 1 2 2h10a2 2 0 0 1 2-2V6a2 2 0 0 1-2-2z" />
    </svg>
  ),
  ret: (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M1.146 4.854a.5.5 0 0 1 0-.708l4-4a.5.5 0 1 1 .708.708L2.707 4H12.5A2.5 2.5 0 0 1 15 6.5v8a.5.5 0 0 1-1 0v-8A1.5 1.5 0 0 0 12.5 5H2.707l3.147 3.146a.5.5 0 1 1-.708.708z"
      />
    </svg>
  ),
  bag: (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 1a2.5 2.5 0 0 1 2.5 2.5V4h-5v-.5A2.5 2.5 0 0 1 8 1m3.5 3v-.5a3.5 3.5 0 1 0-7 0V4H1v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4z" />
    </svg>
  ),
  receipt: (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
      <path d="M1.92.506a.5.5 0 0 1 .434.14L3 1.293l.646-.647a.5.5 0 0 1 .708 0L5 1.293l.646-.647a.5.5 0 0 1 .708 0L7 1.293l.646-.647a.5.5 0 0 1 .708 0L9 1.293l.646-.647a.5.5 0 0 1 .708 0l.646.647.646-.647a.5.5 0 0 1 .708 0l.646.647.646-.647a.5.5 0 0 1 .801.13l.5 1A.5.5 0 0 1 15 2v12a.5.5 0 0 1-.053.224l-.5 1a.5.5 0 0 1-.8.13L13 14.707l-.646.647a.5.5 0 0 1-.708 0L11 14.707l-.646.647a.5.5 0 0 1-.708 0L9 14.707l-.646.647a.5.5 0 0 1-.708 0L7 14.707l-.646.647a.5.5 0 0 1-.708 0L5 14.707l-.646.647a.5.5 0 0 1-.708 0L3 14.707l-.646.647a.5.5 0 0 1-.801-.13l-.5-1A.5.5 0 0 1 1 14V2a.5.5 0 0 1 .053-.224l.5-1a.5.5 0 0 1 .367-.27" />
    </svg>
  ),
  print: (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
      <path d="M2.5 8a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1" />
      <path d="M5 1a2 2 0 0 0-2 2v2H2a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h1v1a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-1h1a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-1V3a2 2 0 0 0-2-2z" />
    </svg>
  ),
  wa: (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
      <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326z" />
    </svg>
  ),
  trash: (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
      <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z" />
      <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z" />
    </svg>
  ),
  close: (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
      <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z" />
    </svg>
  ),
  inbox: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M4.98 4a.5.5 0 0 0-.39.188L1.54 8H6a.5.5 0 0 1 .5.5 1.5 1.5 0 1 0 3 0A.5.5 0 0 1 10 8h4.46l-3.05-3.812A.5.5 0 0 0 11.02 4zm-1.17-.437A1.5 1.5 0 0 1 4.98 3h6.04a1.5 1.5 0 0 1 1.17.563l3.7 4.625a.5.5 0 0 1 .106.374l-.39 3.124A1.5 1.5 0 0 1 14.117 13H1.883a1.5 1.5 0 0 1-1.489-1.314l-.39-3.124a.5.5 0 0 1 .106-.374z" />
    </svg>
  ),
  hourglass: (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
      <path d="M2 1.5a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-1v1a4.5 4.5 0 0 1-2.557 4.06c-.29.139-.443.377-.443.59v.7c0 .213.154.451.443.59A4.5 4.5 0 0 1 12.5 13v1h1a.5.5 0 0 1 0 1h-11a.5.5 0 1 1 0-1h1v-1a4.5 4.5 0 0 1 2.557-4.06c.29-.139.443-.377.443-.59v-.7c0-.213-.154-.451-.443-.59A4.5 4.5 0 0 1 3.5 3V2h-1a.5.5 0 0 1-.5-.5" />
    </svg>
  ),
  chat: (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
      <path d="M14 1a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4.414A2 2 0 0 0 3 11.586l-2 2V2a1 1 0 0 1 1-1zM2 0a2 2 0 0 0-2 2v12.793a.5.5 0 0 0 .854.353l2.853-2.853A1 1 0 0 1 4.414 12H14a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2z" />
    </svg>
  ),
  phone: (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
      <path d="M3.654 1.328a.678.678 0 0 0-1.015-.063L1.605 2.3c-.483.484-.661 1.169-.45 1.77a17.6 17.6 0 0 0 4.168 6.608 17.6 17.6 0 0 0 6.608 4.168c.601.211 1.286.033 1.77-.45l1.034-1.034a.678.678 0 0 0-.063-1.015l-2.307-1.794a.68.68 0 0 0-.58-.122l-2.19.547a1.75 1.75 0 0 1-1.657-.459L5.482 8.062a1.75 1.75 0 0 1-.46-1.657l.548-2.19a.68.68 0 0 0-.122-.58z" />
    </svg>
  ),
};

/* ─────────────────────────────────────────────────────────────
   PRINT / WHATSAPP helpers — unchanged
───────────────────────────────────────────────────────────── */
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
  <div class="meta"><span><b>Invoice:</b> ${sale.invoiceNo}</span><span><b>Date:</b> ${fmtD(sale.invoiceDate)}</span>
  <span><b>Customer:</b> ${sale.customerName || "COUNTER SALE"}</span>
  ${sale.customerPhone ? `<span><b>Phone:</b> ${sale.customerPhone}</span>` : ""}
  <span><b>Payment:</b> ${sale.paymentMode}</span></div>
  <table><thead><tr><th>#</th><th>Description</th><th>Meas</th><th align="right">Qty</th><th align="right">Rate</th><th align="right">Disc%</th><th align="right">Amount</th></tr></thead>
  <tbody>${rows}</tbody></table>
  <div class="tots"><div class="tr"><span>Sub Total</span><span>${Number(sale.subTotal || 0).toLocaleString()}</span></div>
  ${(sale.discAmount || 0) > 0 ? `<div class="tr red"><span>Discount</span><span>-${Number(sale.discAmount).toLocaleString()}</span></div>` : ""}
  <div class="tr b"><span>Net Total</span><span>${Number(sale.netTotal || 0).toLocaleString()}</span></div>
  ${(sale.prevBalance || 0) > 0 ? `<div class="tr"><span>Prev Balance</span><span class="red">${Number(sale.prevBalance).toLocaleString()}</span></div>` : ""}
  <div class="tr green"><span>Paid</span><span>${Number(sale.paidAmount || 0).toLocaleString()}</span></div>
  ${(sale.balance || 0) > 0 ? `<div class="tr b red"><span>Balance</span><span>${Number(sale.balance).toLocaleString()}</span></div>` : ""}</div>
  ${sale.remarks ? `<p style="clear:both;margin-top:8px;font-size:11px;color:#555"><b>Remarks:</b> ${sale.remarks}</p>` : ""}
  <div class="footer">Thank you! — ${SHOP}</div></body></html>`);
  win.document.close();
  setTimeout(() => win.print(), 400);
}

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

/* ─────────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────────── */
export default function SaleHistoryPage() {
  const [sales, setSales] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selSale, setSelSale] = useState(null);
  const [selIdx, setSelIdx] = useState(-1);
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
    const f = p.from(),
      t = p.to();
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
        const tabObj = TABS.find((t) => t.key === tab);
        if (tabObj?.key === "return") p.set("saleType", "return");
        else if (tabObj?.src) p.set("saleSource", tabObj.src);
        else p.set("saleType", "sale");
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

  const tabCount = (key) => {
    if (!summary) return 0;
    return (
      {
        all: (summary.all?.count || 0) + (summary.returns?.count || 0),
        debit: summary.debit?.count || 0,
        credit: summary.credit?.count || 0,
        cash: summary.cash?.count || 0,
        return: summary.returns?.count || 0,
      }[key] || 0
    );
  };

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
  const tabIcons = {
    all: Ic.list,
    debit: Ic.cart,
    credit: Ic.person,
    cash: Ic.cash,
    return: Ic.ret,
  };

  return (
    <div
      className="sh-page"
      tabIndex={0}
      style={{ outline: "none" }}
      onKeyDown={handleKey}
    >
      {/* ── Top bar ── */}
      <div className="sh-topbar">
        <div className="sh-title">{Ic.history} Sale History</div>

        <div className="sh-date-btns">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              className={`sh-dbtn${preset === p.key ? " active" : ""}`}
              onClick={() => applyPreset(p.key)}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="sh-custom">
          {Ic.cal}
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
            {Ic.filter} Apply
          </button>
        </div>

        <div className="sh-search-box">
          <span className="sh-search-icon">{Ic.search}</span>
          <input
            ref={searchRef}
            className="sh-search-input"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Invoice / Customer / Phone…"
          />
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="sh-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`sh-tab${activeTab === t.key ? " active-" + t.key : ""}`}
            onClick={() => handleTabClick(t.key)}
          >
            {tabIcons[t.key]} {t.label}
            <span className="sh-tab-count">{tabCount(t.key)}</span>
          </button>
        ))}
      </div>

      {/* ── Summary cards ── */}
      <div className="sh-cards">
        <div className="sh-card">
          <div className="sh-card-lbl">{Ic.bag} Total Sales</div>
          <div className="sh-card-val">Rs. {fmt(s?.all?.total || 0)}</div>
          <div className="sh-card-sub">{s?.all?.count || 0} invoices</div>
        </div>
        <div className="sh-card">
          <div className="sh-card-lbl">{Ic.cart} Debit Sales</div>
          <div className="sh-card-val">Rs. {fmt(s?.debit?.total || 0)}</div>
          <div className="sh-card-sub">
            {s?.debit?.count || 0} invoices &nbsp;|&nbsp; Due: Rs.{" "}
            {fmt(s?.debit?.balance || 0)}
          </div>
        </div>
        <div className="sh-card green">
          <div className="sh-card-lbl">{Ic.person} Credit Sales</div>
          <div className="sh-card-val">Rs. {fmt(s?.credit?.total || 0)}</div>
          <div className="sh-card-sub">
            {s?.credit?.count || 0} invoices &nbsp;|&nbsp; Due: Rs.{" "}
            {fmt(s?.credit?.balance || 0)}
          </div>
        </div>
        <div className="sh-card">
          <div className="sh-card-lbl">{Ic.cash} Cash/Counter</div>
          <div className="sh-card-val">Rs. {fmt(s?.cash?.total || 0)}</div>
          <div className="sh-card-sub">{s?.cash?.count || 0} invoices</div>
        </div>
        <div className="sh-card orange">
          <div className="sh-card-lbl">{Ic.ret} Returns</div>
          <div className="sh-card-val">Rs. {fmt(s?.returns?.total || 0)}</div>
          <div className="sh-card-sub">{s?.returns?.count || 0} invoices</div>
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div className="sh-filterbar">
        <span className="sh-flbl">{Ic.pay} Payment:</span>
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
            {Ic.clear} Clear
          </button>
        )}
        <span className="sh-fcount">
          {loading ? (
            <>{Ic.hourglass} Loading…</>
          ) : (
            <>
              {Ic.list} {sales.length} record{sales.length !== 1 ? "s" : ""}{" "}
              &nbsp;|&nbsp; ↑↓ navigate &nbsp;|&nbsp; Enter=details
              &nbsp;|&nbsp; P=print
            </>
          )}
        </span>
      </div>

      {/* ── Table ── */}
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
              <th style={{ width: 75 }}>Payment</th>
              <th className="c" style={{ width: 46 }}>
                Items
              </th>
              <th className="r" style={{ width: 95 }}>
                Net Total
              </th>
              <th className="r" style={{ width: 78 }}>
                Paid
              </th>
              <th className="r" style={{ width: 82 }}>
                Balance
              </th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={10}>
                  <div className="sh-empty">{Ic.hourglass} Loading…</div>
                </td>
              </tr>
            )}
            {!loading && sales.length === 0 && (
              <tr>
                <td colSpan={10}>
                  <div className="sh-empty">{Ic.inbox} No records found</div>
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
                <td
                  style={{
                    fontFamily: "var(--xp-mono)",
                    fontWeight: 700,
                    color: "#1a3a7a",
                  }}
                >
                  {s.invoiceNo}
                </td>
                <td style={{ color: "#555" }}>{fmtD(s.invoiceDate)}</td>
                <td>
                  <span style={{ fontWeight: 500 }}>
                    {s.customerName || "COUNTER SALE"}
                  </span>
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
                <td
                  className="r"
                  style={{ fontFamily: "var(--xp-mono)", fontWeight: 700 }}
                >
                  {fmt(s.netTotal)}
                </td>
                <td
                  className="r"
                  style={{
                    fontFamily: "var(--xp-mono)",
                    color: "var(--xp-green)",
                  }}
                >
                  {fmt(s.paidAmount)}
                </td>
                <td
                  className="r"
                  style={{
                    fontFamily: "var(--xp-mono)",
                    fontWeight: 700,
                    color:
                      (s.balance || 0) > 0
                        ? "var(--xp-red)"
                        : "var(--xp-green)",
                  }}
                >
                  {fmt(s.balance)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Detail panel ── */}
      <div className={`sh-detail${selSale ? "" : " hidden"}`}>
        {selSale && (
          <>
            <div className="sh-det-hdr">
              <span className="sh-det-inv">
                {Ic.receipt} {selSale.invoiceNo}
              </span>
              <span className="sh-det-cust">
                {Ic.person} {selSale.customerName || "Counter Sale"}
                {selSale.customerPhone && (
                  <>
                    &nbsp; {Ic.phone} {selSale.customerPhone}
                  </>
                )}
              </span>
              <span
                style={{
                  fontSize: 11,
                  color: "#666",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                {Ic.cal} {fmtD(selSale.invoiceDate)} &nbsp;
                <span className={`sh-src ${selSale.saleSource || "cash"}`}>
                  {selSale.saleSource === "debit"
                    ? "Debit Sale"
                    : selSale.saleSource === "credit"
                      ? "Credit Sale"
                      : "Cash Sale"}
                </span>
                &nbsp;
                <span className={`sh-pay ${selSale.paymentMode}`}>
                  {selSale.paymentMode}
                </span>
              </span>
              <div className="sh-det-actions">
                <button
                  className="sh-act-btn print"
                  onClick={() => printInvoice(selSale)}
                >
                  {Ic.print} Print
                </button>
                <button
                  className="sh-act-btn wa"
                  onClick={() => shareWA(selSale)}
                >
                  {Ic.wa} WhatsApp
                </button>
                <button
                  className="sh-act-btn danger"
                  onClick={() => handleDelete(selSale._id)}
                >
                  {Ic.trash} Delete
                </button>
                <button className="sh-act-btn" onClick={() => setSelSale(null)}>
                  {Ic.close}
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
                  <th className="r" style={{ width: 85 }}>
                    Rate
                  </th>
                  <th className="r" style={{ width: 50 }}>
                    Disc%
                  </th>
                  <th className="r" style={{ width: 95 }}>
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {(selSale.items || []).map((it, i) => (
                  <tr key={i}>
                    <td
                      style={{
                        textAlign: "center",
                        color: "#999",
                        fontSize: 11,
                      }}
                    >
                      {i + 1}
                    </td>
                    <td>{it.description}</td>
                    <td style={{ color: "#888" }}>{it.measurement || "—"}</td>
                    <td className="r">{it.qty}</td>
                    <td className="r">{fmt(it.rate)}</td>
                    <td className="r">{it.disc || 0}%</td>
                    <td className="r" style={{ color: "var(--xp-blue-dark)" }}>
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
                  <span className="val" style={{ color: "var(--xp-red)" }}>
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
                  <span className="val" style={{ color: "var(--xp-red)" }}>
                    {fmt(selSale.prevBalance)}
                  </span>
                </div>
              )}
              <div className="sh-det-tot-item">
                <span className="lbl">Paid:</span>
                <span className="val" style={{ color: "var(--xp-green)" }}>
                  {fmt(selSale.paidAmount)}
                </span>
              </div>
              {(selSale.balance || 0) > 0 && (
                <div className="sh-det-tot-item">
                  <span className="lbl">Balance:</span>
                  <span className="val" style={{ color: "var(--xp-red)" }}>
                    {fmt(selSale.balance)}
                  </span>
                </div>
              )}
              {selSale.remarks && (
                <div className="sh-det-tot-item">
                  {Ic.chat}
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
