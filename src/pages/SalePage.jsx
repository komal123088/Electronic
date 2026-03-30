// pages/SalePage.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import api from "../api/api.js";
import EP from "../api/apiEndpoints.js";
import "../styles/theme.css";
import "../styles/SalePage.css";

/* ── helpers ── */
const timeNow = () =>
  new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
const isoDate = () => new Date().toISOString().split("T")[0];
const fmt = (n) => Number(n || 0).toLocaleString("en-PK");
const HOLD_KEY = "asim_hold_bills_v1";

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

const SHOP_INFO = {
  name: "Asim Electric & Electronic Store",
  address: "Main Bazar, Lahore",
  phone: "0300-0000000",
};

const TYPE_COLORS = {
  credit: { bg: "#fca5a5", color: "#7f1d1d", border: "#ef4444" },
  debit: { bg: "#93c5fd", color: "#1e3a8a", border: "#3b82f6" },
  cash: { bg: "#86efac", color: "#14532d", border: "#22c55e" },
  "raw-sale": { bg: "#fde68a", color: "#78350f", border: "#f59e0b" },
  "raw-purchase": { bg: "#d8b4fe", color: "#3b0764", border: "#a855f7" },
};

const typeToPayment = (t) => {
  if (t === "credit" || t === "raw-sale" || t === "raw-purchase")
    return "Credit";
  if (t === "debit") return "Bank";
  return "Cash";
};
const typeToSource = (t) => (!t ? "cash" : t);

/* ── localStorage helpers ── */
const loadHolds = () => {
  try {
    return JSON.parse(localStorage.getItem(HOLD_KEY) || "[]");
  } catch {
    return [];
  }
};
const saveHolds = (bills) => {
  try {
    localStorage.setItem(HOLD_KEY, JSON.stringify(bills));
  } catch {}
};

/* ══════════════════════════════════════════════════════════
   PRINT HTML BUILDER — Professional
══════════════════════════════════════════════════════════ */
const buildPrintHtml = (sale, type, overrides = {}) => {
  const customerName = overrides.customerName ?? sale.customerName;
  const customerPhone = overrides.customerPhone ?? "";
  const rows = sale.items.map((it, i) => ({ ...it, sr: i + 1 }));
  const totalQty = rows.reduce((s, r) => s + (r.pcs || 0), 0);

  /* ── THERMAL ── */
  if (type === "Thermal") {
    const itemRows = rows
      .map(
        (it) =>
          `<tr>
        <td>${it.sr}</td>
        <td style="max-width:92px;word-break:break-word">${it.name}${it.uom ? ` <span style="color:#777">(${it.uom})</span>` : ""}</td>
        <td class="r">${it.pcs}</td>
        <td class="r">${Number(it.rate).toLocaleString()}</td>
        <td class="r"><b>${Number(it.amount).toLocaleString()}</b></td>
      </tr>`,
      )
      .join("");

    return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
      *{box-sizing:border-box}
      body{font-family:'Courier New',Courier,monospace;font-size:10.5px;width:78mm;margin:0 auto;padding:3mm;color:#111}
      .sn{text-align:center;font-size:15px;font-weight:bold;letter-spacing:.5px;margin-bottom:1px}
      .ss{text-align:center;font-size:9px;color:#555;margin-bottom:1px}
      .badge{display:block;text-align:center;font-size:9px;border:1px solid #333;padding:1px 0;margin:3px 0;letter-spacing:2px;font-weight:bold}
      .dash{border:none;border-top:1px dashed #666;margin:3px 0}
      .solid{border:none;border-top:2px solid #111;margin:3px 0}
      table{width:100%;border-collapse:collapse}
      th{border-bottom:1px solid #555;padding:2px;font-size:9px;font-weight:bold;text-align:left}
      td{padding:2px;font-size:9.5px;vertical-align:top}
      .r{text-align:right}
      .row{display:flex;justify-content:space-between;padding:1.5px 0;font-size:10.5px}
      .row.b{font-weight:bold;font-size:12px}
      .row.sep{border-top:1px dashed #555;margin-top:2px;padding-top:3px}
      .red{color:#b00}.green{color:#060}
      .foot{text-align:center;font-size:9px;color:#666;margin-top:5px;border-top:1px dashed #aaa;padding-top:4px}
      @media print{@page{size:80mm auto;margin:2mm}body{width:76mm}}
    </style></head><body>
      <div class="sn">${SHOP_INFO.name}</div>
      <div class="ss">${SHOP_INFO.address}</div>
      <div class="ss">Ph: ${SHOP_INFO.phone}</div>
      <span class="badge">SALE RECEIPT</span>
      <hr class="dash">
      <div class="row" style="font-size:9.5px"><span>Invoice: <b>${sale.invoiceNo}</b></span><span>${sale.invoiceDate}</span></div>
      <div style="font-size:10.5px;font-weight:bold">${customerName}</div>
      <div style="font-size:9px;color:#666">Mode: ${sale.paymentMode} / ${sale.saleSource}</div>
      <hr class="solid">
      <table>
        <thead><tr><th>#</th><th>Item</th><th class="r">Qty</th><th class="r">Rate</th><th class="r">Amt</th></tr></thead>
        <tbody>${itemRows}</tbody>
      </table>
      <hr class="dash">
      <div class="row"><span>Sub Total</span><span><b>${Number(sale.subTotal).toLocaleString()}</b></span></div>
      ${sale.extraDisc > 0 ? `<div class="row red"><span>(−) Discount</span><span>${Number(sale.extraDisc).toLocaleString()}</span></div>` : ""}
      <div class="row b sep"><span>NET TOTAL</span><span>PKR ${Number(sale.netTotal).toLocaleString()}</span></div>
      ${sale.prevBalance > 0 ? `<div class="row red"><span>(+) Prev. Bal.</span><span>${Number(sale.prevBalance).toLocaleString()}</span></div>` : ""}
      <div class="row green"><span>Received</span><span>PKR ${Number(sale.paidAmount).toLocaleString()}</span></div>
      <div class="row b sep ${sale.balance > 0 ? "red" : "green"}"><span>BALANCE</span><span>PKR ${Number(sale.balance).toLocaleString()}</span></div>
      <div class="foot">Items: ${rows.length} &nbsp;|&nbsp; Total Qty: ${totalQty}<br>Thank you for your business!<br>${SHOP_INFO.name}</div>
    </body></html>`;
  }

  /* ── A4 / A5 ── */
  const a5 = type === "A5";
  const LINES_PER_PAGE = a5 ? 22 : 28;

  const pages = [];
  for (let i = 0; i < rows.length; i += LINES_PER_PAGE) {
    pages.push(rows.slice(i, i + LINES_PER_PAGE));
  }
  if (pages.length === 0) pages.push([]);

  const sz = a5
    ? {
        title: 17,
        sub: 9,
        inv: 13,
        meta: 8.5,
        th: 8.5,
        td: 8.5,
        tot: 9.5,
        totB: 11.5,
      }
    : {
        title: 22,
        sub: 10,
        inv: 15,
        meta: 10,
        th: 10,
        td: 10,
        tot: 11,
        totB: 14,
      };

  const buildPageHtml = (pageRows, pageNum, totalPages, isLastPage) => {
    const itemRows = pageRows
      .map(
        (it, i) =>
          `<tr style="background:${i % 2 === 0 ? "#fff" : "#f7faff"}">
        <td>${it.sr}</td>
        <td><strong>${it.name}</strong></td>
        <td>${it.uom || "—"}</td>
        <td align="right">${it.pcs}</td>
        <td align="right">${Number(it.rate).toLocaleString()}</td>
        <td align="right"><strong>${Number(it.amount).toLocaleString()}</strong></td>
      </tr>`,
      )
      .join("");

    const totalsHtml = isLastPage
      ? `
      <div class="bwrap">
        <div class="tbox">
          <div class="tr"><span>Sub Total</span><span class="blue">${Number(sale.subTotal).toLocaleString()}</span></div>
          ${sale.extraDisc > 0 ? `<div class="tr red"><span>(−) Discount</span><span>${Number(sale.extraDisc).toLocaleString()}</span></div>` : ""}
          <div class="tr b blue sep"><span>Net Total</span><span>PKR ${Number(sale.netTotal).toLocaleString()}</span></div>
          ${sale.prevBalance > 0 ? `<div class="tr red"><span>(+) Prev. Balance</span><span>PKR ${Number(sale.prevBalance).toLocaleString()}</span></div>` : ""}
          <div class="tr green"><span>Received</span><span>PKR ${Number(sale.paidAmount).toLocaleString()}</span></div>
          <div class="tr b sep ${sale.balance > 0 ? "red" : "green"}"><span>Balance Due</span><span>PKR ${Number(sale.balance).toLocaleString()}</span></div>
        </div>
      </div>
      <div class="foot">
        <div class="ft">Total Items: ${rows.length} &nbsp;|&nbsp; Total Qty: ${totalQty}<br>Thank you for your business! — ${SHOP_INFO.name} — Computer Generated Invoice</div>
        <div class="sig"><div class="sl"></div>Authorized Signature</div>
      </div>`
      : `<div style="text-align:right;font-size:8pt;color:#888;margin-top:6px">Page ${pageNum} of ${totalPages} — Continued...</div>`;

    return `
      <div class="page"${pageNum > 1 ? ' style="page-break-before:always"' : ""}>
        <div class="hdr">
          <div>
            <div class="hn">${SHOP_INFO.name}</div>
            <div class="hs">📍 ${SHOP_INFO.address}</div>
            <div class="hs">📞 ${SHOP_INFO.phone}</div>
          </div>
          <div class="ir">
            <div class="il">Sale Invoice</div>
            <div class="ino"># ${sale.invoiceNo}</div>
            <div class="idate">${sale.invoiceDate}</div>
          </div>
        </div>
        ${
          pageNum === 1
            ? `<div class="info">
              <div class="ii" style="flex:2"><span class="ilb">Customer</span><span class="iv">${customerName}</span></div>
              ${customerPhone ? `<div class="ii" style="flex:1"><span class="ilb">Phone</span><span class="iv">${customerPhone}</span></div>` : ""}
              <div class="ii" style="flex:1"><span class="ilb">Payment</span><span class="iv">${sale.paymentMode}</span></div>
              <div class="ii" style="flex:1"><span class="ilb">Type</span><span class="iv">${sale.saleSource}</span></div>
              <div class="ii" style="flex:1;text-align:right"><span class="ilb">Items / Qty</span><span class="iv">${rows.length} / ${totalQty}</span></div>
            </div>`
            : `<div style="font-size:8pt;color:#888;margin-bottom:6px;text-align:right">Page ${pageNum} of ${totalPages} &nbsp;|&nbsp; ${customerName}</div>`
        }
        <table>
          <thead>
            <tr>
              <th width="24">#</th>
              <th>Description</th>
              <th width="46">UOM</th>
              <th width="38" align="right">Qty</th>
              <th width="68" align="right">Rate</th>
              <th width="78" align="right">Amount</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>
        ${totalsHtml}
      </div>`;
  };

  const allPagesHtml = pages
    .map((pageRows, idx) =>
      buildPageHtml(pageRows, idx + 1, pages.length, idx === pages.length - 1),
    )
    .join("");

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Arial,Helvetica,sans-serif;font-size:${sz.td}pt;color:#1a1a2e;background:#fff;padding:${a5 ? "7mm" : "12mm"}}
    .hdr{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #1d3a8a;padding-bottom:${a5 ? "7px" : "11px"};margin-bottom:${a5 ? "8px" : "12px"}}
    .hn{font-size:${sz.title}pt;font-weight:900;color:#1d3a8a;letter-spacing:-.5px;line-height:1.1}
    .hs{font-size:${sz.sub}pt;color:#666;margin-top:2px}
    .ir{text-align:right}
    .il{font-size:${sz.inv}pt;font-weight:800;color:#dc2626;letter-spacing:1.5px;text-transform:uppercase}
    .ino{font-size:${sz.inv - 1}pt;font-weight:700;color:#111;margin-top:1px}
    .idate{font-size:${sz.sub}pt;color:#777}
    .info{display:flex;gap:${a5 ? "6px" : "10px"};background:#f0f4fb;border:1px solid #c5d2ee;border-radius:4px;padding:${a5 ? "5px 10px" : "7px 14px"};margin-bottom:${a5 ? "8px" : "12px"};font-size:${sz.meta}pt;flex-wrap:wrap}
    .ii{display:flex;flex-direction:column;gap:1px}
    .ilb{font-size:${sz.meta - 1}pt;color:#6b7280;text-transform:uppercase;letter-spacing:.5px}
    .iv{font-weight:600;color:#111}
    table{width:100%;border-collapse:collapse;margin-bottom:${a5 ? "8px" : "14px"}}
    thead tr{background:#1d3a8a;color:#fff}
    th{padding:${a5 ? "4px 6px" : "6px 9px"};text-align:left;font-size:${sz.th}pt;font-weight:600;white-space:nowrap}
    td{padding:${a5 ? "3px 6px" : "5px 9px"};font-size:${sz.td}pt;border-bottom:1px solid #e8edf5}
    tbody tr:last-child td{border-bottom:2px solid #c5d2ee}
    .bwrap{display:flex;justify-content:flex-end}
    .tbox{width:${a5 ? "205px" : "265px"};border:1px solid #c5d2ee;border-radius:4px;overflow:hidden}
    .tr{display:flex;justify-content:space-between;padding:${a5 ? "4px 10px" : "5px 14px"};font-size:${sz.tot}pt;border-bottom:1px solid #edf0f7}
    .tr:last-child{border-bottom:none}
    .tr.b{font-weight:700;font-size:${sz.totB}pt;background:#eef2fb}
    .tr.sep{border-top:2px solid #1d3a8a}
    .red{color:#dc2626}.green{color:#15803d}.blue{color:#1d4ed8}
    .foot{margin-top:${a5 ? "12px" : "22px"};display:flex;justify-content:space-between;align-items:flex-end;border-top:1px dashed #bbb;padding-top:${a5 ? "8px" : "12px"}}
    .ft{font-size:${sz.sub}pt;color:#888;line-height:1.7}
    .sig{text-align:center;font-size:${sz.sub}pt;color:#555}
    .sl{border-top:1px solid #999;width:${a5 ? "100px" : "130px"};margin:0 auto 2px}
    .page{margin-bottom:0}
    @media print{
      @page{size:${a5 ? "A5" : "A4"};margin:${a5 ? "5mm" : "10mm"}}
      body{padding:0}
      .page{page-break-inside:avoid}
    }
  </style></head><body>${allPagesHtml}</body></html>`;
};
function PrintOptionsModal({ sale, defaultPrintType, onPrint, onClose }) {
  const [selPrintType, setSelPrintType] = useState(defaultPrintType || "A5");
  const [custName, setCustName] = useState(sale.customerName || "");
  const [custPhone, setCustPhone] = useState("");

  useEffect(() => {
    const h = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
      if (e.key === "Enter") {
        e.preventDefault();
        handlePrint();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [custName, custPhone, selPrintType]);

  const handlePrint = () => {
    onPrint(selPrintType, { customerName: custName, customerPhone: custPhone });
  };

  return (
    <div className="scm-overlay">
      <div className="scm-window" style={{ maxWidth: 420 }}>
        {/* Titlebar */}
        <div className="scm-tb">
          <svg
            width="13"
            height="13"
            viewBox="0 0 16 16"
            fill="rgba(255,255,255,0.85)"
          >
            <path d="M2.5 8a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1m4-3h7a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h1.5v-1a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 .5.5zm-3 1v-.5H4v.5zM13 6H3v4h10z" />
          </svg>
          <span className="scm-tb-title">Print Options — {sale.invoiceNo}</span>
          <button className="xp-cap-btn xp-cap-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div
          style={{
            padding: "14px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {/* Customer Name */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label className="xp-label">Customer Name (optional)</label>
            <input
              className="xp-input"
              value={custName}
              onChange={(e) => setCustName(e.target.value)}
              placeholder="Leave blank for counter sale"
              autoFocus
            />
          </div>

          {/* Phone */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label className="xp-label">Phone Number (optional)</label>
            <input
              className="xp-input"
              value={custPhone}
              onChange={(e) => setCustPhone(e.target.value)}
              placeholder="e.g. 0300-1234567"
            />
          </div>

          {/* Print type */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label className="xp-label">Print Format</label>
            <div style={{ display: "flex", gap: 8 }}>
              {["Thermal", "A5", "A4"].map((pt) => (
                <label
                  key={pt}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "6px 14px",
                    border: `2px solid ${selPrintType === pt ? "var(--xp-blue-mid)" : "var(--xp-silver-2)"}`,
                    borderRadius: 4,
                    background:
                      selPrintType === pt ? "#e8f0fb" : "var(--xp-silver-3)",
                    cursor: "pointer",
                    fontWeight: selPrintType === pt ? 700 : 400,
                    color: selPrintType === pt ? "var(--xp-blue-dark)" : "#444",
                    fontSize: 13,
                    transition: "all 0.1s",
                  }}
                >
                  <input
                    type="radio"
                    name="po-pt"
                    checked={selPrintType === pt}
                    onChange={() => setSelPrintType(pt)}
                    style={{ display: "none" }}
                  />
                  {pt === "Thermal" ? "🖨" : pt === "A5" ? "📄" : "📋"} {pt}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="scm-sep" />

        <div className="scm-actions">
          <button
            className="xp-btn xp-btn-primary"
            style={{ minWidth: 130 }}
            onClick={handlePrint}
          >
            🖨 Print
          </button>
          <button
            className="xp-btn"
            style={{ minWidth: 110 }}
            onClick={onClose}
          >
            ↩ Cancel
          </button>
        </div>
        <div className="scm-hint">Enter = Print &nbsp;|&nbsp; Esc = Cancel</div>
      </div>
    </div>
  );
}
const doPrint = (sale, type, overrides = {}) => {
  const w = window.open(
    "",
    "_blank",
    type === "Thermal" ? "width=420,height=640" : "width=900,height=700",
  );
  w.document.write(buildPrintHtml(sale, type, overrides));
  w.document.close();
  setTimeout(() => w.print(), 400);
};
/* ══════════════════════════════════════════════════════════
   SAVE CONFIRM MODAL — XP Theme
══════════════════════════════════════════════════════════ */
function SaveConfirmModal({
  salePayload,
  printType: defaultPrintType,
  onConfirm,
  onClose,
}) {
  const [paidAmount, setPaidAmount] = useState(0);
  const [selPrintType, setSelPrintType] = useState(defaultPrintType);
  const [saving, setSaving] = useState(false);
  const paidRef = useRef(null);

  useEffect(() => {
    setTimeout(() => {
      paidRef.current?.focus();
      paidRef.current?.select();
    }, 80);
  }, []);

  useEffect(() => {
    const h = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
      if (e.key === "Enter" && document.activeElement === paidRef.current) {
        e.preventDefault();
        handleConfirm(true);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [paidAmount, selPrintType]);

  const netTotal = salePayload.netTotal;
  const prevBalance = salePayload.prevBalance || 0;
  const paid = Number(paidAmount) || 0;
  const billTotal = netTotal + prevBalance;
  const change = paid - billTotal;

  const handleConfirm = async (withPrint) => {
    if (saving) return;
    setSaving(true);
    await onConfirm({
      extraDisc: salePayload.extraDisc || 0,
      netTotal,
      paidAmount: paid,
      balance: billTotal - paid,
      printType: selPrintType,
      withPrint,
    });
    setSaving(false);
  };

  return (
    <div className="scm-overlay">
      <div className="scm-window">
        {/* Titlebar */}
        <div className="scm-tb">
          <svg
            width="13"
            height="13"
            viewBox="0 0 16 16"
            fill="rgba(255,255,255,0.85)"
          >
            <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0" />
          </svg>
          <span className="scm-tb-title">
            Sale Confirm — {salePayload.invoiceNo} &nbsp;|&nbsp;{" "}
            {salePayload.customerName}
          </span>
          <button className="xp-cap-btn xp-cap-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Meta strip */}
        <div className="scm-meta">
          <span>
            <b>Invoice:</b> {salePayload.invoiceNo}
          </span>
          <span>
            <b>Date:</b> {salePayload.invoiceDate}
          </span>
          <span>
            <b>Customer:</b> {salePayload.customerName}
          </span>
          <span>
            <b>Payment:</b> {salePayload.paymentMode}
          </span>
          <span>
            <b>Items:</b> {salePayload.items.length}
          </span>
        </div>

        {/* 3 Big boxes */}
        <div className="scm-amounts">
          {/* Bill Amount */}
          <div className="scm-box">
            <div className="scm-box-label">Bill Amount</div>
            <div className="scm-box-val">
              {Number(billTotal).toLocaleString("en-PK")}
            </div>
          </div>

          {/* Received — editable, default 0 */}
          <div className="scm-box" style={{ borderLeft: "none" }}>
            <div className="scm-box-label">Received</div>
            <input
              ref={paidRef}
              type="number"
              className="scm-recv-input"
              value={paidAmount}
              onChange={(e) => setPaidAmount(e.target.value)}
              onFocus={(e) => e.target.select()}
            />
          </div>

          {/* Change or Balance Due */}
          <div
            className={`scm-box ${change >= 0 ? "scm-box-change" : "scm-box-due"}`}
            style={{ borderLeft: "none" }}
          >
            <div className="scm-box-label">
              {change >= 0 ? "Change" : "Balance Due"}
            </div>
            <div className="scm-box-val">
              {change < 0 && (
                <span style={{ fontSize: 22, marginRight: 2 }}>−</span>
              )}
              {Math.abs(change).toLocaleString("en-PK")}
            </div>
          </div>
        </div>

        {/* Print type row */}
        <div className="scm-print-row">
          <span style={{ color: "#555", marginRight: 4, fontWeight: 700 }}>
            Print:
          </span>
          {["Thermal", "A5", "A4"].map((pt) => (
            <label key={pt}>
              <input
                type="radio"
                name="scm-pt"
                checked={selPrintType === pt}
                onChange={() => setSelPrintType(pt)}
              />
              {pt}
            </label>
          ))}
        </div>

        <div className="scm-sep" />

        {/* Action buttons */}
        <div className="scm-actions">
          <button
            className="xp-btn xp-btn-primary"
            style={{ minWidth: 140 }}
            onClick={() => handleConfirm(true)}
            disabled={saving}
          >
            🖨 Save and Print
          </button>
          <button
            className="xp-btn xp-btn-success"
            style={{ minWidth: 110 }}
            onClick={() => handleConfirm(false)}
            disabled={saving}
          >
            💾 Save only
          </button>
          <button
            className="xp-btn"
            style={{ minWidth: 130 }}
            onClick={onClose}
          >
            ↩ Return to Invoice
          </button>
        </div>

        {/* Hint */}
        <div className="scm-hint">
          ↵ Enter (in Received field) = Save &amp; Print &nbsp;|&nbsp; Esc =
          Return to Invoice
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   PRODUCT SEARCH MODAL
══════════════════════════════════════════════════════════ */
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
    const ld = d.trim().toLowerCase(),
      lc = c.trim().toLowerCase(),
      lo = co.trim().toLowerCase();
    products.forEach((p) => {
      const ok =
        (!ld ||
          p.description?.toLowerCase().includes(ld) ||
          p.code?.toLowerCase().includes(ld)) &&
        (!lc || p.category?.toLowerCase().includes(lc)) &&
        (!lo || p.company?.toLowerCase().includes(lo));
      if (!ok) return;
      const _name = [p.category, p.description, p.company]
        .filter(Boolean)
        .join(" ");
      if (p.packingInfo?.length > 0)
        p.packingInfo.forEach((pk, i) =>
          res.push({
            ...p,
            _pi: i,
            _meas: pk.measurement,
            _rate: pk.saleRate,
            _pack: pk.packing,
            _stock: pk.openingQty || 0,
            _name,
          }),
        );
      else
        res.push({
          ...p,
          _pi: 0,
          _meas: "",
          _rate: 0,
          _pack: 1,
          _stock: 0,
          _name,
        });
    });
    return res;
  }, []);

  useEffect(() => {
    rDesc.current?.focus();
    setRows(buildFlat(allProducts, "", "", ""));
  }, [allProducts, buildFlat]);

  useEffect(() => {
    const f = buildFlat(allProducts, desc, cat, company);
    setRows(f);
    setHiIdx(f.length > 0 ? 0 : -1);
  }, [desc, cat, company, allProducts, buildFlat]);

  useEffect(() => {
    if (tbodyRef.current && hiIdx >= 0)
      tbodyRef.current.children[hiIdx]?.scrollIntoView({ block: "nearest" });
  }, [hiIdx]);

  const fk = (e, nr) => {
    if (e.key === "Escape") {
      onClose();
      return;
    }
    if (e.key === "Enter" || e.key === "ArrowDown") {
      e.preventDefault();
      nr
        ? nr.current?.focus()
        : (tbodyRef.current?.focus(), setHiIdx((h) => Math.max(0, h)));
    }
  };
  const tk = (e) => {
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
    if (e.key === "Escape") onClose();
    if (e.key === "Tab") {
      e.preventDefault();
      rDesc.current?.focus();
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
          <span className="xp-modal-title">Search Products</span>
          <button className="xp-cap-btn xp-cap-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="cs-modal-filters">
          <div className="cs-modal-filter-grp">
            <label className="xp-label">Description / Code</label>
            <input
              ref={rDesc}
              type="text"
              className="xp-input"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              onKeyDown={(e) => fk(e, rCat)}
              placeholder="Name / code…"
              autoComplete="off"
            />
          </div>
          <div className="cs-modal-filter-grp">
            <label className="xp-label">Category</label>
            <input
              ref={rCat}
              type="text"
              className="xp-input"
              value={cat}
              onChange={(e) => setCat(e.target.value)}
              onKeyDown={(e) => fk(e, rCompany)}
              placeholder="e.g. SMALL"
              autoComplete="off"
            />
          </div>
          <div className="cs-modal-filter-grp">
            <label className="xp-label">Company</label>
            <input
              ref={rCompany}
              type="text"
              className="xp-input"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              onKeyDown={(e) => fk(e, null)}
              placeholder="e.g. LUX"
              autoComplete="off"
            />
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 6 }}>
            <span style={{ fontSize: "var(--xp-fs-xs)", color: "#555" }}>
              {rows.length} result(s)
            </span>
            <button className="xp-btn xp-btn-sm" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
        <div className="xp-modal-body" style={{ padding: 0 }}>
          <div className="xp-table-panel" style={{ border: "none" }}>
            <div className="xp-table-scroll">
              <table className="xp-table">
                <thead>
                  <tr>
                    <th style={{ width: 36 }}>Sr.#</th>
                    <th>Barcode</th>
                    <th>Name</th>
                    <th>Meas.</th>
                    <th className="r">Rate</th>
                    <th className="r">Stock</th>
                    <th className="r">Pack</th>
                  </tr>
                </thead>
                <tbody ref={tbodyRef} tabIndex={0} onKeyDown={tk}>
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={7} className="xp-empty">
                        No products found
                      </td>
                    </tr>
                  )}
                  {rows.map((r, i) => (
                    <tr
                      key={`${r._id}-${r._pi}`}
                      style={{
                        background: i === hiIdx ? "#c3d9f5" : undefined,
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
                      <td className="r xp-amt">
                        {Number(r._rate).toLocaleString("en-PK")}
                      </td>
                      <td className="r">{r._stock}</td>
                      <td className="r">{r._pack}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="cs-modal-hint">
          ↑↓ navigate &nbsp;|&nbsp; Enter / Double-click = select &nbsp;|&nbsp;
          Esc = close &nbsp;|&nbsp; Tab = filters
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   HOLD PREVIEW MODAL
══════════════════════════════════════════════════════════ */
function HoldPreviewModal({ bill, onResume, onClose }) {
  if (!bill) return null;
  return (
    <div
      className="xp-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="xp-modal" style={{ width: 560 }}>
        <div className="xp-modal-tb">
          <span className="xp-modal-title">Hold Bill — {bill.invoiceNo}</span>
          <button className="xp-cap-btn xp-cap-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="xp-modal-body" style={{ padding: 8 }}>
          <div
            style={{
              marginBottom: 6,
              display: "flex",
              gap: 16,
              fontSize: "var(--xp-fs-xs)",
            }}
          >
            <span>
              <b>Customer:</b> {bill.buyerName}
            </span>
            <span>
              <b>Items:</b> {bill.items.length}
            </span>
            <span>
              <b>Amount:</b>{" "}
              <span style={{ color: "var(--xp-blue-dark)", fontWeight: 700 }}>
                {Number(bill.amount).toLocaleString("en-PK")}
              </span>
            </span>
          </div>
          <div className="xp-table-panel" style={{ border: "none" }}>
            <div className="xp-table-scroll" style={{ maxHeight: 300 }}>
              <table className="xp-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Code</th>
                    <th>Name</th>
                    <th>UOM</th>
                    <th className="r">Pcs</th>
                    <th className="r">Rate</th>
                    <th className="r">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {bill.items.map((r, i) => (
                    <tr key={i}>
                      <td className="text-muted">{i + 1}</td>
                      <td className="text-muted">{r.code}</td>
                      <td>{r.name}</td>
                      <td className="text-muted">{r.uom}</td>
                      <td className="r">{r.pcs}</td>
                      <td className="r">
                        {Number(r.rate).toLocaleString("en-PK")}
                      </td>
                      <td
                        className="r"
                        style={{
                          color: "var(--xp-blue-dark)",
                          fontWeight: 700,
                        }}
                      >
                        {Number(r.amount).toLocaleString("en-PK")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            gap: 6,
            padding: "6px 10px",
            borderTop: "1px solid var(--xp-silver-5)",
            justifyContent: "flex-end",
          }}
        >
          <button className="xp-btn xp-btn-sm" onClick={onClose}>
            Cancel
          </button>
          <button
            className="xp-btn xp-btn-primary xp-btn-sm"
            onClick={() => onResume(bill.id)}
          >
            Resume This Bill
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   CUSTOMER DROPDOWN
══════════════════════════════════════════════════════════ */
function CustomerDropdown({
  allCustomers,
  value,
  displayName,
  customerType,
  onSelect,
  onClear,
  onAddNew,
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [hiIdx, setHiIdx] = useState(0);
  const [ghost, setGhost] = useState("");
  const wrapRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const ALLOWED_TYPES = ["credit", "cash", ""];
  const realCustomers = allCustomers.filter((c) => {
    if (c.name?.toUpperCase().trim() === "COUNTER SALE") return false;
    const t = (c.customerType || c.type || "").toLowerCase();
    return ALLOWED_TYPES.includes(t);
  });

  const filtered = query.trim()
    ? realCustomers.filter((c) => {
        const q = query.toLowerCase();
        return (
          c.name?.toLowerCase().includes(q) ||
          c.code?.toLowerCase().includes(q) ||
          c.phone?.toLowerCase().includes(q)
        );
      })
    : realCustomers;

  const showAddNew =
    query.trim().length > 0 &&
    !filtered.some((c) => c.name?.toLowerCase() === query.trim().toLowerCase());

  useEffect(() => {
    if (!query.trim()) {
      setGhost("");
      return;
    }
    const match = realCustomers.find((c) =>
      c.name?.toLowerCase().startsWith(query.toLowerCase()),
    );
    setGhost(match ? match.name.slice(query.length) : "");
  }, [query, allCustomers]);

  useEffect(() => {
    const h = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target))
        setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => {
    if (!listRef.current || !open || hiIdx < 0) return;
    listRef.current.children[hiIdx]?.scrollIntoView({ block: "nearest" });
  }, [hiIdx, open]);

  useEffect(() => {
    setHiIdx(0);
  }, [query]);

  const pick = (c) => {
    onSelect(c);
    setOpen(false);
    setQuery("");
    setGhost("");
  };

  const handleKey = (e) => {
    if (ghost && (e.key === "Tab" || e.key === "ArrowRight")) {
      e.preventDefault();
      const full = query + ghost;
      const match = realCustomers.find(
        (c) => c.name?.toLowerCase() === full.toLowerCase(),
      );
      if (match) pick(match);
      else {
        setQuery(full);
        setGhost("");
      }
      return;
    }
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
      e.preventDefault();
      setOpen(true);
      return;
    }
    if (e.key === "Escape") {
      setOpen(false);
      setQuery("");
      setGhost("");
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHiIdx((i) => Math.min(i + 1, filtered.length + (showAddNew ? 0 : -1)));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHiIdx((i) => Math.max(i - 1, 0));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (showAddNew && hiIdx === filtered.length) {
        onAddNew?.(query);
        setOpen(false);
        setQuery("");
        setGhost("");
        return;
      }
      if (filtered[hiIdx]) pick(filtered[hiIdx]);
      return;
    }
  };

  const typeStyle =
    customerType && TYPE_COLORS[customerType]
      ? {
          background: TYPE_COLORS[customerType].bg,
          color: TYPE_COLORS[customerType].color,
          border: `1px solid ${TYPE_COLORS[customerType].border}`,
        }
      : null;

  const inputVal = open ? query : value ? displayName : "";

  return (
    <div
      className="cdd-wrap"
      ref={wrapRef}
      style={{ position: "relative", flex: 1 }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          position: "relative",
        }}
      >
        {typeStyle && (
          <span className="cdd-type-badge" style={typeStyle}>
            {customerType}
          </span>
        )}

        {open && ghost && (
          <div
            style={{
              position: "absolute",
              left: typeStyle ? 72 : 8,
              top: "50%",
              transform: "translateY(-50%)",
              pointerEvents: "none",
              whiteSpace: "nowrap",
              fontSize: 13,
              fontFamily: "inherit",
              display: "flex",
            }}
          >
            <span style={{ visibility: "hidden" }}>{query}</span>
            <span style={{ color: "#b0bec5" }}>{ghost}</span>
          </div>
        )}

        <input
          ref={inputRef}
          className="sl-cust-input cdd-input"
          style={{
            flex: 1,
            minWidth: 0,
            cursor: "text",
            background: "transparent",
            position: "relative",
            zIndex: 1,
          }}
          value={inputVal}
          placeholder={value ? "" : "Type name or press ↓ to browse…"}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!open) setOpen(true);
            setHiIdx(0);
          }}
          onFocus={() => {
            setOpen(true);
            setHiIdx(0);
          }}
          onKeyDown={handleKey}
          autoComplete="off"
          spellCheck={false}
        />
        {value && (
          <button
            className="xp-btn xp-btn-sm xp-btn-danger"
            style={{
              height: 22,
              padding: "0 5px",
              fontSize: 10,
              flexShrink: 0,
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              onClear();
              setQuery("");
              setOpen(false);
              setGhost("");
            }}
            title="Clear"
          >
            ✕
          </button>
        )}
      </div>

      {open && (
        <div
          ref={listRef}
          style={{
            position: "absolute",
            bottom: "100%",
            left: 0,
            right: 0,
            marginBottom: 2,
            maxHeight: 300,
            overflowY: "auto",
            zIndex: 9999,
            background: "#fff",
            border: "1px solid #b0bcd8",
            borderRadius: 4,
            boxShadow: "0 -6px 20px rgba(0,0,0,0.14)",
          }}
        >
          {realCustomers.length === 0 && (
            <div
              style={{ padding: "10px 12px", color: "#9ca3af", fontSize: 12 }}
            >
              No customers registered
            </div>
          )}

          {filtered.map((c, i) => {
            const tc = c.customerType || c.type || "";
            const ts = TYPE_COLORS[tc];
            const q = query.trim();
            const nameNode = q
              ? (() => {
                  const idx =
                    c.name?.toLowerCase().indexOf(q.toLowerCase()) ?? -1;
                  if (idx === -1) return c.name;
                  return (
                    <>
                      {c.name.slice(0, idx)}
                      <mark style={{ background: "#fef08a", padding: 0 }}>
                        {c.name.slice(idx, idx + q.length)}
                      </mark>
                      {c.name.slice(idx + q.length)}
                    </>
                  );
                })()
              : c.name;

            return (
              <div
                key={c._id}
                onMouseEnter={() => setHiIdx(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(c);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 12px",
                  cursor: "pointer",
                  background:
                    i === hiIdx ? "#dbeafe" : i % 2 === 0 ? "#fff" : "#f9fafb",
                  borderBottom: "1px solid #f0f0f0",
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    color: "#9ca3af",
                    minWidth: 36,
                    fontFamily: "monospace",
                  }}
                >
                  {c.code || "—"}
                </span>
                <span style={{ flex: 1, fontWeight: 500, fontSize: 13 }}>
                  {nameNode}
                </span>
                {tc && ts && (
                  <span
                    style={{
                      background: ts.bg,
                      color: ts.color,
                      border: `1px solid ${ts.border}`,
                      fontSize: 10,
                      padding: "1px 5px",
                      borderRadius: 3,
                    }}
                  >
                    {tc}
                  </span>
                )}
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: (c.currentBalance || 0) > 0 ? "#dc2626" : "#9ca3af",
                    minWidth: 58,
                    textAlign: "right",
                  }}
                >
                  {Number(c.currentBalance || 0).toLocaleString("en-PK")}
                </span>
              </div>
            );
          })}

          {showAddNew && (
            <div
              onMouseEnter={() => setHiIdx(filtered.length)}
              onMouseDown={(e) => {
                e.preventDefault();
                onAddNew?.(query);
                setOpen(false);
                setQuery("");
                setGhost("");
              }}
              style={{
                padding: "7px 12px",
                cursor: "pointer",
                background: hiIdx === filtered.length ? "#dbeafe" : "#f0fdf4",
                borderTop: "1px solid #bbf7d0",
                fontSize: 13,
                color: "#15803d",
              }}
            >
              ➕ <strong>"{query}"</strong> — Add as new customer
            </div>
          )}

          {filtered.length === 0 && query.trim() && !showAddNew && (
            <div
              style={{ padding: "7px 12px", color: "#9ca3af", fontSize: 12 }}
            >
              "{query}" — No match found
            </div>
          )}

          <div
            style={{
              padding: "3px 12px",
              fontSize: 11,
              color: "#9ca3af",
              borderTop: "1px solid #f0f0f0",
              background: "#fafafa",
            }}
          >
            Tab / → = accept suggestion &nbsp;|&nbsp; ↑↓ = navigate
            &nbsp;|&nbsp; Enter = select &nbsp;|&nbsp; Esc = close
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════ */
export default function SalePage() {
  const [time, setTime] = useState(timeNow());
  const [allProducts, setAllProducts] = useState([]);
  const [allCustomers, setAllCustomers] = useState([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showHoldPreview, setShowHoldPreview] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [curRow, setCurRow] = useState({ ...EMPTY_ROW });
  const [items, setItems] = useState([]);
  const [invoiceDate, setInvoiceDate] = useState(isoDate());
  const [invoiceNo, setInvoiceNo] = useState("INV-00001");
  const amountRef = useRef(null);

  const [customerId, setCustomerId] = useState("");
  const [buyerName, setBuyerName] = useState("COUNTER SALE");
  const [buyerCode, setBuyerCode] = useState("");
  const [customerType, setCustomerType] = useState("");
  const [prevBalance, setPrevBalance] = useState(0);

  const [extraDiscount, setExtraDiscount] = useState(0);
  const [received, setReceived] = useState(0);
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [saleSource, setSaleSource] = useState("cash");

  const [holdBills, setHoldBills] = useState(() => loadHolds());
  const [editId, setEditId] = useState(null);
  const [selItemIdx, setSelItemIdx] = useState(null);
  const [msg, setMsg] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);
  const [printType, setPrintType] = useState("A5");
  const [sendSms, setSendSms] = useState(false);
  const [packingOptions, setPackingOptions] = useState([]);
  const [packingOpen, setPackingOpen] = useState(false);
  const [packingHiIdx, setPackingHiIdx] = useState(0);
  const packingRef = useRef(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [pendingPayload, setPendingPayload] = useState(null);

  // Credit warning
  const [creditWarning, setCreditWarning] = useState(false);
  const [creditStatement, setCreditStatement] = useState("");
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [pendingPrintSale, setPendingPrintSale] = useState(null);
  const searchRef = useRef(null);
  const pcsRef = useRef(null);
  const rateRef = useRef(null);
  const addRef = useRef(null);
  const receivedRef = useRef(null);
  const discRef = useRef(null);
  const saveRef = useRef(null);
  const statementRef = useRef(null);

  useEffect(() => {
    const t = setInterval(() => setTime(timeNow()), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    fetchData();
  }, []);
  useEffect(() => {
    saveHolds(holdBills);
  }, [holdBills]);

  const subTotal = items.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
  const billAmount = subTotal - (parseFloat(extraDiscount) || 0);
  const balance =
    billAmount + (parseFloat(prevBalance) || 0) - (parseFloat(received) || 0);

  useEffect(() => {
    if (paymentMode !== "Credit")
      setReceived(billAmount + (parseFloat(prevBalance) || 0));
  }, [billAmount, prevBalance, paymentMode]);

  const handlePaymentMode = (mode) => {
    setPaymentMode(mode);
    if (mode === "Credit") setReceived(0);
    else setReceived(billAmount + (parseFloat(prevBalance) || 0));
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pRes, cRes, invRes] = await Promise.all([
        api.get(EP.PRODUCTS.GET_ALL),
        api.get(EP.CUSTOMERS.GET_ALL),
        api.get(EP.SALES.NEXT_INVOICE),
      ]);
      if (pRes.data.success) setAllProducts(pRes.data.data);
      if (cRes.data.success) setAllCustomers(cRes.data.data);
      if (invRes.data.success) setInvoiceNo(invRes.data.data.invoiceNo);
    } catch {
      showMsg("Failed to load data", "error");
    }
    setLoading(false);
  };

  const refreshInvoiceNo = async () => {
    try {
      const r = await api.get(EP.SALES.NEXT_INVOICE);
      if (r.data.success) setInvoiceNo(r.data.data.invoiceNo);
    } catch {}
  };

  const showMsg = (text, type = "success") => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: "", type: "" }), 3500);
  };

  const handleCustomerSelect = (c) => {
    const type = c.customerType || c.type || "";
    setCustomerId(c._id);
    setBuyerName(c.name);
    setBuyerCode(c.code || "");
    setCustomerType(type);
    setPrevBalance(c.currentBalance || 0);
    const pm = typeToPayment(type);
    const ss = typeToSource(type);
    setPaymentMode(pm);
    setSaleSource(ss);
    if (pm === "Credit") setReceived(0);
    else setReceived(billAmount + (c.currentBalance || 0));

    // Credit limit check
    const limit = c.creditLimit || 0;
    const custBal = c.currentBalance || 0;
    if (type === "credit" && limit > 0 && custBal >= limit) {
      setCreditWarning(true);
      setCreditStatement("");
      setTimeout(() => statementRef.current?.focus(), 120);
    } else {
      setCreditWarning(false);
      setCreditStatement("");
    }

    setTimeout(() => searchRef.current?.focus(), 30);
  };

  const handleCustomerClear = () => {
    setCustomerId("");
    setBuyerName("COUNTER SALE");
    setBuyerCode("");
    setCustomerType("");
    setPrevBalance(0);
    setPaymentMode("Cash");
    setSaleSource("cash");
    setReceived(billAmount);
    setCreditWarning(false);
    setCreditStatement("");
  };

  const handleAddNewCustomer = (name) => {
    setBuyerName(name || "COUNTER SALE");
    setCustomerId("");
    setCustomerType("");
    showMsg(`"${name}" set as buyer name`, "success");
    setTimeout(() => searchRef.current?.focus(), 30);
  };

  const pickProduct = (product) => {
    if (!product._id) {
      showMsg("Product ID missing", "error");
      return;
    }
    setPackingOptions(product.packingInfo?.map((pk) => pk.measurement) || []);
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
    setSearchText(product.code || "");
    setShowProductModal(false);
    setTimeout(() => packingRef.current?.focus(), 30);
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

  const addRow = () => {
    if (!curRow.name) {
      setShowProductModal(true);
      return;
    }
    if (!curRow.productId) {
      showMsg("Please select a valid product", "error");
      return;
    }
    if (parseFloat(curRow.pcs) <= 0) {
      showMsg("Qty must be > 0", "error");
      return;
    }
    if (selItemIdx !== null) {
      setItems((p) => {
        const u = [...p];
        u[selItemIdx] = { ...curRow };
        return u;
      });
      setSelItemIdx(null);
    } else setItems((p) => [...p, { ...curRow }]);
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

  const totalQty = items.reduce((s, r) => s + (parseFloat(r.pcs) || 0), 0);

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
        customerType,
        prevBalance,
        extraDiscount,
        paymentMode,
        saleSource,
      },
    ]);
    fullReset();
    refreshInvoiceNo();
  };

  const resumeHold = (holdId) => {
    const bill = holdBills.find((b) => b.id === holdId);
    if (!bill) return;
    setItems(bill.items);
    setCustomerId(bill.customerId || "");
    setBuyerName(bill.buyerName || "COUNTER SALE");
    setBuyerCode(bill.buyerCode || "");
    setCustomerType(bill.customerType || "");
    setPrevBalance(bill.prevBalance || 0);
    setExtraDiscount(bill.extraDiscount || 0);
    setPaymentMode(bill.paymentMode || "Cash");
    setSaleSource(bill.saleSource || "cash");
    setHoldBills((p) => p.filter((b) => b.id !== holdId));
    setShowHoldPreview(null);
    resetCurRow();
  };

  const deleteHold = (holdId, e) => {
    e.stopPropagation();
    if (window.confirm("Delete this held bill?"))
      setHoldBills((p) => p.filter((b) => b.id !== holdId));
  };

  const fullReset = () => {
    setItems([]);
    setCurRow({ ...EMPTY_ROW });
    setSearchText("");
    setPackingOptions([]);
    setCustomerId("");
    setBuyerName("COUNTER SALE");
    setBuyerCode("");
    setCustomerType("");
    setPrevBalance(0);
    setExtraDiscount(0);
    setReceived(0);
    setPaymentMode("Cash");
    setSaleSource("cash");
    setEditId(null);
    setSelItemIdx(null);
    setMsg({ text: "", type: "" });
    setCreditWarning(false);
    setCreditStatement("");
    setTimeout(() => searchRef.current?.focus(), 50);
  };

  /* ── Open confirm modal (no API call yet) ── */
  const openSaleConfirm = () => {
    if (!items.length) {
      alert("Add at least one item");
      return;
    }
    if (creditWarning && !creditStatement.trim()) {
      statementRef.current?.focus();
      showMsg(
        "Credit limit exceeded — enter authorization statement to proceed",
        "error",
      );
      return;
    }
    const payload = {
      invoiceNo,
      invoiceDate,
      customerId: customerId || undefined,
      customerName: buyerName || "COUNTER SALE",
      customerPhone: buyerCode,
      items: items.map((r) => ({
        productId: r.productId || undefined,
        code: r.code,
        name: r.name,
        description: r.name,
        uom: r.uom,
        measurement: r.uom,
        rack: r.rack,
        pcs: parseFloat(r.pcs) || 1,
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
      saleSource,
      sendSms,
      printType,
      remarks: creditStatement || "",
      saleType: "sale",
    };
    setPendingPayload(payload);
    setShowSaveModal(true);
  };

  /* ── Actual API save — called from modal ── */
  const confirmSave = async (overrides) => {
    if (!pendingPayload) return;
    setLoading(true);
    try {
      const finalPayload = {
        ...pendingPayload,
        extraDisc: overrides.extraDisc,
        netTotal: overrides.netTotal,
        paidAmount: overrides.paidAmount,
        balance: overrides.balance,
        printType: overrides.printType,
      };
      const { data } = editId
        ? await api.put(EP.SALES.UPDATE(editId), finalPayload)
        : await api.post(EP.SALES.CREATE, finalPayload);

      if (data.success) {
        showMsg(editId ? "Sale updated!" : `Saved: ${data.data.invoiceNo}`);
        const saleObj = {
          invoiceNo: data.data.invoiceNo,
          invoiceDate: finalPayload.invoiceDate,
          customerName: finalPayload.customerName,
          saleSource: finalPayload.saleSource,
          paymentMode: finalPayload.paymentMode,
          items: pendingPayload.items,
          subTotal: finalPayload.subTotal,
          extraDisc: overrides.extraDisc,
          netTotal: overrides.netTotal,
          prevBalance: finalPayload.prevBalance,
          paidAmount: overrides.paidAmount,
          balance: overrides.balance,
        };
        if (overrides.withPrint) {
          setPendingPrintSale(saleObj);
          setShowPrintModal(true);
        }
        setShowSaveModal(false);
        setPendingPayload(null);
        fullReset();
        await refreshInvoiceNo();
      } else {
        showMsg(data.message, "error");
      }
    } catch (e) {
      showMsg(e.response?.data?.message || "Save failed", "error");
    }
    setLoading(false);
  };

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "F2") {
        e.preventDefault();
        setShowProductModal(true);
      }
      if (e.key === "F4") {
        e.preventDefault();
        holdBill();
      }
      if (e.key === "F10" || (e.ctrlKey && e.key === "s")) {
        e.preventDefault();
        saveRef.current?.click();
      }
      if (
        e.key === "Escape" &&
        !showProductModal &&
        !showHoldPreview &&
        !showSaveModal
      )
        resetCurRow();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [items, showProductModal, showHoldPreview, showSaveModal, billAmount]);

  const EMPTY_ROWS = Math.max(0, 8 - items.length);

  return (
    <div className={`sl-page${creditWarning ? " sl-credit-mode" : ""}`}>
      {showProductModal && (
        <SearchModal
          allProducts={allProducts}
          onSelect={pickProduct}
          onClose={() => {
            setShowProductModal(false);
            setTimeout(() => searchRef.current?.focus(), 30);
          }}
        />
      )}
      {showHoldPreview && (
        <HoldPreviewModal
          bill={showHoldPreview}
          onResume={resumeHold}
          onClose={() => setShowHoldPreview(null)}
        />
      )}
      {showSaveModal && pendingPayload && (
        <SaveConfirmModal
          salePayload={pendingPayload}
          printType={printType}
          onConfirm={confirmSave}
          onClose={() => {
            setShowSaveModal(false);
            setPendingPayload(null);
          }}
        />
      )}
      {showPrintModal && pendingPrintSale && (
        <PrintOptionsModal
          sale={pendingPrintSale}
          defaultPrintType={printType}
          onPrint={(type, overrides) => {
            doPrint(pendingPrintSale, type, overrides);
            setShowPrintModal(false);
            setPendingPrintSale(null);
          }}
          onClose={() => {
            setShowPrintModal(false);
            setPendingPrintSale(null);
          }}
        />
      )}

      {/* TITLEBAR */}
      <div className="xp-titlebar">
        <svg
          width="15"
          height="15"
          viewBox="0 0 16 16"
          fill="rgba(255,255,255,0.85)"
        >
          <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v1h14V4a1 1 0 0 0-1-1zm13 4H1v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1zM2 10h2a1 1 0 0 1 0 2H2a1 1 0 0 1 0-2m4 0h6a1 1 0 0 1 0 2H6a1 1 0 0 1 0-2" />
        </svg>
        <span className="xp-tb-title">
          Sale Invoice — Asim Electric &amp; Electronic Store
        </span>
        <div className="xp-tb-actions">
          {editId && <div className="sl-edit-badge">✏ Editing Sale</div>}
          <div className="xp-tb-divider" />
          <div className="sl-shortcut-hints">
            <span>F2 Product</span>
            <span>F4 Hold</span>
            <span>F10 Save</span>
          </div>
          <div className="xp-tb-divider" />
          <button className="xp-cap-btn">─</button>
          <button
            className="xp-cap-btn"
            onClick={() => {
              if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen();
              } else {
                document.exitFullscreen();
              }
            }}
          >
            □
          </button>
          <button className="xp-cap-btn xp-cap-close">✕</button>
        </div>
      </div>

      {msg.text && (
        <div
          className={`xp-alert ${msg.type === "success" ? "xp-alert-success" : "xp-alert-error"}`}
          style={{ margin: "4px 10px 0", flexShrink: 0 }}
        >
          {msg.text}
        </div>
      )}

      <div className="sl-body">
        <div className="sl-left">
          {/* Invoice info */}
          <div className="sl-top-bar">
            <div className="sl-sale-title-box">Sale</div>
            <div className="sl-inv-field-grp">
              <label>Invoice #</label>
              <input
                className="xp-input xp-input-sm sl-inv-input"
                value={editId ? "EDIT MODE" : invoiceNo}
                readOnly
              />
            </div>
            <div className="sl-inv-field-grp">
              <label>Date</label>
              <input
                type="date"
                className="xp-input xp-input-sm sl-date-input"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
              />
            </div>
            <div className="sl-inv-field-grp">
              <label>Time</label>
              <div className="sl-time-box">{time}</div>
            </div>
          </div>

          {/* Entry strip */}
          <div className="sl-entry-strip">
            <div className="sl-entry-cell sl-entry-product">
              <label>
                Select Product <kbd>F2</kbd>
              </label>
              <input
                ref={searchRef}
                type="text"
                className="sl-product-input"
                value={searchText}
                // onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setShowProductModal(true);
                  }
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (!searchText.trim()) {
                      setShowProductModal(true);
                      return;
                    }
                    // Barcode/code se dhundo
                    const q = searchText.trim().toLowerCase();
                    const found = allProducts.find(
                      (p) => p.code?.toLowerCase() === q,
                    );
                    if (found) {
                      const pk = found.packingInfo?.[0];
                      pickProduct({
                        ...found,
                        _pi: 0,
                        _meas: pk?.measurement || "",
                        _rate: pk?.saleRate || 0,
                        _pack: pk?.packing || 1,
                        _stock: pk?.openingQty || 0,
                        _name: [
                          found.category,
                          found.description,
                          found.company,
                        ]
                          .filter(Boolean)
                          .join(" "),
                      });
                    } else {
                      alert(`"${searchText}" — Product not found`);
                      searchRef.current?.select();
                    }
                  }
                }}
                placeholder="Enter / F2 to search…"
                onChange={(e) => {
                  setSearchText(e.target.value);
                  if (curRow.name) {
                    setCurRow({ ...EMPTY_ROW });
                    setPackingOptions([]);
                  }
                }}
                autoFocus
              />
            </div>
            <div className="sl-entry-cell" style={{ position: "relative" }}>
              <label>Packing</label>
              <input
                ref={packingRef}
                type="text"
                className="xp-input xp-input-sm"
                style={{ width: 65 }}
                value={curRow.uom}
                onChange={(e) =>
                  setCurRow((p) => ({ ...p, uom: e.target.value }))
                }
                onFocus={() =>
                  setPackingHiIdx(
                    Math.max(0, packingOptions.indexOf(curRow.uom)),
                  )
                }
                onBlur={() => setTimeout(() => setPackingOpen(false), 150)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    pcsRef.current?.focus();
                    return;
                  }
                  if (packingOptions.length === 0) return;
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    const idx = packingOptions.indexOf(curRow.uom);
                    const next =
                      packingOptions[(idx + 1) % packingOptions.length];
                    setCurRow((p) => ({ ...p, uom: next }));
                  }
                  if (e.key === "ArrowUp") {
                    e.preventDefault();
                    const idx = packingOptions.indexOf(curRow.uom);
                    const prev =
                      packingOptions[
                        (idx - 1 + packingOptions.length) %
                          packingOptions.length
                      ];
                    setCurRow((p) => ({ ...p, uom: prev }));
                  }
                }}
                autoComplete="off"
              />
              {packingOpen && packingOptions.length > 0 && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    zIndex: 9999,
                    background: "#fff",
                    border: "1px solid #b0bcd8",
                    borderRadius: 4,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    minWidth: 110,
                  }}
                >
                  {packingOptions.map((o, i) => (
                    <div
                      key={o}
                      onMouseDown={() => {
                        setCurRow((p) => ({ ...p, uom: o }));
                        setPackingOpen(false);
                        pcsRef.current?.focus();
                      }}
                      style={{
                        padding: "5px 10px",
                        cursor: "pointer",
                        fontSize: 12,
                        background:
                          i === packingHiIdx
                            ? "#dbeafe"
                            : i % 2 === 0
                              ? "#fff"
                              : "#f9fafb",
                        fontWeight: o === curRow.uom ? 700 : 400,
                      }}
                    >
                      {o}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="sl-entry-cell">
              <label>Pcs</label>
              <input
                ref={pcsRef}
                type="number"
                className="sl-num-input"
                style={{ width: 60 }}
                value={curRow.pcs}
                min={1}
                onChange={(e) => updateCurRow("pcs", e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && rateRef.current?.focus()}
                onFocus={(e) => e.target.select()}
              />
            </div>
            <div className="sl-entry-cell">
              <label>Rate</label>
              <input
                ref={rateRef}
                type="number"
                className="sl-num-input"
                style={{ width: 75 }}
                value={curRow.rate}
                min={0}
                onChange={(e) => updateCurRow("rate", e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && amountRef.current?.focus()
                }
                onFocus={(e) => e.target.select()}
              />
            </div>
            <div className="sl-entry-cell">
              <label>Amount</label>
              <input
                ref={amountRef}
                type="number"
                className="sl-num-input"
                style={{ width: 80 }}
                value={curRow.amount || 0}
                onChange={(e) =>
                  setCurRow((p) => ({
                    ...p,
                    amount: parseFloat(e.target.value) || 0,
                  }))
                }
                onFocus={(e) => e.target.select()}
                onKeyDown={(e) => e.key === "Enter" && addRef.current?.click()}
              />
            </div>
            <div className="sl-entry-cell sl-entry-btns-cell">
              <label>&nbsp;</label>
              <div className="sl-entry-btns">
                <button className="xp-btn xp-btn-sm" onClick={resetCurRow}>
                  Reset
                </button>
                <button
                  ref={addRef}
                  className="xp-btn xp-btn-primary xp-btn-sm"
                  onClick={addRow}
                >
                  {selItemIdx !== null ? "Update" : "Add"}
                </button>
                <button
                  className="xp-btn xp-btn-sm"
                  disabled={selItemIdx === null}
                  onClick={() =>
                    selItemIdx !== null && loadRowForEdit(selItemIdx)
                  }
                >
                  Edit
                </button>
                <button
                  className="xp-btn xp-btn-danger xp-btn-sm"
                  disabled={selItemIdx === null}
                  onClick={removeRow}
                >
                  Remove
                </button>
              </div>
            </div>
          </div>

          {/* Table header */}
          <div className="sl-table-header-bar">
            <span className="sl-table-lbl">
              {curRow.name ? (
                <span className="sl-cur-name-inline">{curRow.name}</span>
              ) : (
                "Select Product"
              )}
            </span>
            <span className="sl-table-qty">
              {totalQty.toLocaleString("en-PK")}
            </span>
          </div>

          {/* Items table */}
          <div className="sl-items-wrap">
            <table className="sl-items-table">
              <thead>
                <tr>
                  <th style={{ width: 32 }}>Sr.#</th>
                  <th style={{ width: 72 }}>Code</th>
                  <th>Name</th>
                  <th style={{ width: 65 }}>UOM</th>
                  <th style={{ width: 55 }} className="r">
                    Pcs
                  </th>
                  <th style={{ width: 80 }} className="r">
                    Rate
                  </th>
                  <th style={{ width: 90 }} className="r">
                    Amount
                  </th>
                  <th style={{ width: 50 }}>Rack</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="xp-empty"
                      style={{ padding: 14 }}
                    >
                      Search and add products to start the bill
                    </td>
                  </tr>
                )}
                {items.map((r, i) => (
                  <tr
                    key={i}
                    className={selItemIdx === i ? "sl-sel-row" : ""}
                    onClick={() => setSelItemIdx(i === selItemIdx ? null : i)}
                    onDoubleClick={() => loadRowForEdit(i)}
                  >
                    <td
                      className="muted"
                      style={{
                        textAlign: "center",
                        fontSize: "var(--xp-fs-xs)",
                      }}
                    >
                      {i + 1}
                    </td>
                    <td className="muted">{r.code}</td>
                    <td style={{ fontWeight: 500 }}>{r.name}</td>
                    <td className="muted">{r.uom}</td>
                    <td className="r">{r.pcs}</td>
                    <td className="r">
                      {Number(r.rate).toLocaleString("en-PK")}
                    </td>
                    <td className="r" style={{ color: "var(--xp-blue-dark)" }}>
                      {Number(r.amount).toLocaleString("en-PK")}
                    </td>
                    <td className="muted">{r.rack}</td>
                  </tr>
                ))}
                {Array.from({ length: EMPTY_ROWS }).map((_, i) => (
                  <tr key={`e${i}`} className="sl-empty-row">
                    <td colSpan={8} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary bar */}
          <div className="sl-summary-bar">
            <div className="sl-sum-cell">
              <label>Total Qty</label>
              <input
                className="sl-sum-val"
                value={totalQty.toLocaleString("en-PK")}
                readOnly
              />
            </div>
            <div className="sl-sum-cell">
              <label>Net Amount</label>
              <input
                className="sl-sum-val"
                value={Number(subTotal).toLocaleString("en-PK")}
                readOnly
              />
            </div>
            <div className="sl-sum-cell">
              <label>Bill Amount</label>
              <input
                className="sl-sum-val"
                value={Number(billAmount).toLocaleString("en-PK")}
                readOnly
              />
            </div>
            <div className="sl-sum-cell">
              <label>Extra Discount</label>
              <input
                ref={discRef}
                type="number"
                className="sl-sum-input"
                value={extraDiscount}
                min={0}
                onChange={(e) => setExtraDiscount(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && receivedRef.current?.focus()
                }
                onFocus={(e) => e.target.select()}
              />
            </div>
            <div className="sl-sum-cell">
              <label>Received</label>
              <input
                ref={receivedRef}
                type="number"
                className="sl-sum-input"
                style={{ color: "var(--xp-green)", fontWeight: 700 }}
                value={received}
                min={0}
                onChange={(e) => setReceived(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveRef.current?.focus()}
                onFocus={(e) => e.target.select()}
              />
            </div>
            <div className="sl-sum-cell">
              <label>Balance</label>
              <input
                className={`sl-sum-val sl-bal${balance > 0 ? " danger" : balance < 0 ? " success" : ""}`}
                value={Number(balance).toLocaleString("en-PK")}
                readOnly
              />
            </div>
          </div>

          {/* Customer bar */}
          <div className="sl-customer-bar">
            <div className="sl-cust-cell">
              <label>Code</label>
              <input
                className="sl-cust-input"
                style={{ width: 55 }}
                value={buyerCode}
                onChange={(e) => setBuyerCode(e.target.value)}
              />
            </div>
            <div className="sl-cust-cell sl-cust-buyer">
              <label>Buyer Name</label>
              <CustomerDropdown
                allCustomers={allCustomers}
                value={customerId}
                displayName={buyerName}
                customerType={customerType}
                onSelect={handleCustomerSelect}
                onClear={handleCustomerClear}
                onAddNew={handleAddNewCustomer}
              />
            </div>
            <div className="sl-cust-cell">
              <label>Prev Balance</label>
              <input
                type="number"
                className="sl-cust-input"
                style={{ width: 85 }}
                value={prevBalance}
                onChange={(e) => setPrevBalance(e.target.value)}
                onFocus={(e) => e.target.select()}
              />
            </div>
            <div className="sl-cust-cell">
              <label>Net Recv.</label>
              <input
                className="sl-cust-input sl-net-recv"
                style={{
                  color: balance > 0 ? "var(--xp-red)" : "var(--xp-green)",
                  fontWeight: 700,
                  width: 85,
                }}
                value={Number(balance).toLocaleString("en-PK")}
                readOnly
              />
            </div>
            <div className="sl-pay-btns">
              {["Cash", "Credit", "Bank", "Cheque"].map((m) => (
                <button
                  key={m}
                  className={`sl-pay-btn${paymentMode === m ? " active-" + m.toLowerCase() : ""}`}
                  onClick={() => handlePaymentMode(m)}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Credit Warning Bar */}
          {creditWarning && (
            <div className="sl-credit-warning-bar">
              <div className="sl-credit-warning-left">
                <div className="sl-credit-icon">⚠</div>
                <div>
                  <div className="sl-credit-title">CREDIT LIMIT EXCEEDED</div>
                  <div className="sl-credit-sub">
                    Balance: <b>{fmt(prevBalance)}</b> — Enter authorization
                    statement to proceed
                  </div>
                </div>
              </div>
              <input
                ref={statementRef}
                type="text"
                className="sl-credit-statement-input"
                placeholder="Enter reason / authorization statement to allow sale…"
                value={creditStatement}
                onChange={(e) => setCreditStatement(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className="sl-right">
          {/* Customer Card */}
          {customerId &&
            (() => {
              const cust = allCustomers.find((c) => c._id === customerId);
              return cust ? (
                <div className="sl-cust-card">
                  <div className="sl-cust-card-photo">
                    {cust.imageFront ? (
                      <img src={cust.imageFront} alt={cust.name} />
                    ) : (
                      <div className="sl-cust-no-photo">👤</div>
                    )}
                  </div>
                  <div className="sl-cust-card-info">
                    <div className="sl-cust-card-name">{cust.name}</div>
                    {cust.phone && (
                      <div className="sl-cust-card-phone">📞 {cust.phone}</div>
                    )}
                    {cust.phone2 && (
                      <div className="sl-cust-card-phone">📞 {cust.phone2}</div>
                    )}
                    <div
                      className="sl-cust-card-bal"
                      style={{
                        color:
                          (cust.currentBalance || 0) > 0
                            ? "var(--xp-red)"
                            : "var(--xp-green)",
                      }}
                    >
                      Balance: {fmt(cust.currentBalance || 0)}
                    </div>
                    {cust.creditLimit > 0 && (
                      <div className="sl-cust-card-limit">
                        Limit: {fmt(cust.creditLimit)}
                      </div>
                    )}
                  </div>
                </div>
              ) : null;
            })()}

          {/* Hold Bills */}
          <div className="sl-hold-panel">
            <div className="sl-hold-title">
              <span>
                Hold Bills{" "}
                <kbd
                  style={{
                    fontSize: 9,
                    background: "rgba(255,255,255,0.2)",
                    padding: "0 3px",
                    borderRadius: 2,
                  }}
                >
                  F4
                </kbd>
              </span>
              <span className="sl-hold-cnt">{holdBills.length}</span>
            </div>
            <div className="sl-hold-table-wrap">
              <table className="sl-hold-table">
                <thead>
                  <tr>
                    <th style={{ width: 24 }}>#</th>
                    <th>Bill #</th>
                    <th className="r">Amount</th>
                    <th>Customer</th>
                    <th style={{ width: 22 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {holdBills.length === 0
                    ? Array.from({ length: 8 }).map((_, i) => (
                        <tr key={i}>
                          <td colSpan={5} style={{ height: 22 }} />
                        </tr>
                      ))
                    : holdBills.map((b, i) => (
                        <tr
                          key={b.id}
                          onClick={() => setShowHoldPreview(b)}
                          onDoubleClick={() => resumeHold(b.id)}
                          title="Click = preview · Double-click = resume"
                        >
                          <td
                            className="muted"
                            style={{
                              textAlign: "center",
                              fontSize: "var(--xp-fs-xs)",
                            }}
                          >
                            {i + 1}
                          </td>
                          <td
                            style={{
                              fontFamily: "var(--xp-mono)",
                              fontSize: "var(--xp-fs-xs)",
                            }}
                          >
                            {b.invoiceNo}
                          </td>
                          <td
                            className="r"
                            style={{ color: "var(--xp-blue-dark)" }}
                          >
                            {Number(b.amount).toLocaleString("en-PK")}
                          </td>
                          <td
                            className="muted"
                            style={{ fontSize: "var(--xp-fs-xs)" }}
                          >
                            {b.buyerName}
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <button
                              className="xp-btn xp-btn-sm xp-btn-ico"
                              style={{
                                width: 18,
                                height: 18,
                                fontSize: 9,
                                color: "var(--xp-red)",
                              }}
                              onClick={(e) => deleteHold(b.id, e)}
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>
            <div className="sl-hold-scroll-btns">
              <button className="xp-btn xp-btn-sm xp-btn-ico">◀</button>
              <button className="xp-btn xp-btn-sm xp-btn-ico">▶</button>
            </div>
            <div style={{ padding: "4px 8px", flexShrink: 0 }}>
              <button
                className="xp-btn xp-btn-sm"
                style={{ width: "100%" }}
                onClick={holdBill}
                disabled={!items.length}
              >
                Hold Bill (F4)
              </button>
            </div>
            <div className="sl-hold-hint">
              Click = preview · Dbl-click = resume · ✕ = delete
            </div>
          </div>
        </div>
      </div>

      {/* Commands bar */}
      <div className="sl-cmd-bar">
        <button
          className="xp-btn xp-btn-sm"
          onClick={fullReset}
          disabled={loading}
        >
          Refresh
        </button>
        <button
          ref={saveRef}
          className="xp-btn xp-btn-primary xp-btn-lg"
          onClick={openSaleConfirm}
          disabled={loading}
        >
          {loading ? "Saving…" : "Save  F10"}
        </button>
        <button className="xp-btn xp-btn-sm" onClick={() => {}}>
          Edit Record
        </button>
        <button
          className="xp-btn xp-btn-danger xp-btn-sm"
          disabled={!editId}
          onClick={async () => {
            if (!editId || !window.confirm("Delete this sale?")) return;
            try {
              await api.delete(EP.SALES.DELETE(editId));
              showMsg("Sale deleted");
              fullReset();
              refreshInvoiceNo();
            } catch {
              showMsg("Delete failed", "error");
            }
          }}
        >
          Delete Record
        </button>
        <div className="xp-toolbar-divider" />
        <div className="sl-cmd-checks">
          <label className="sl-check-label">
            <input
              type="checkbox"
              checked={sendSms}
              onChange={(e) => setSendSms(e.target.checked)}
            />{" "}
            Send SMS
          </label>
          <label className="sl-check-label">
            <input type="checkbox" /> Print P.Bal
          </label>
          <label className="sl-check-label">
            <input type="checkbox" /> Gate Pass
          </label>
        </div>
        <div className="xp-toolbar-divider" />
        <div className="sl-print-types">
          {["Thermal", "A4", "A5"].map((pt) => (
            <label key={pt} className="sl-check-label">
              <input
                type="radio"
                name="pt"
                checked={printType === pt}
                onChange={() => setPrintType(pt)}
              />{" "}
              {pt}
            </label>
          ))}
        </div>
        <div className="xp-toolbar-divider" />
        <span className={`sl-inv-info${editId ? " edit-mode" : ""}`}>
          {editId
            ? "✏ Editing sale record"
            : `${invoiceNo} | Items: ${items.length} | Total: ${Number(subTotal).toLocaleString("en-PK")} | ${saleSource} / ${paymentMode}`}
        </span>
        <button
          className="xp-btn xp-btn-sm"
          style={{ marginLeft: "auto" }}
          onClick={fullReset}
        >
          Close
        </button>
      </div>
    </div>
  );
}
