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
const HOLD_KEY = "asim_hold_bills_rawpurchase_v1";

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
  name: "عاصم الیکٹرک اینڈ الیکٹرونکس سٹور",
  nameEn: "Asim Electric & Electronic Store",
  address: "مین بازار نہاری ٹاؤن نزد بجلی گھر سٹاپ گوجرانوالہ روڈ فیصل آباد",
  phone1: "Faqir Hussain 0300 7262129",
  phone2: "PTCL 041 8711575",
  phone3: "Shop 0315 7262129",
  urduBanner:
    "یہاں پر چانک فراڈ کی وارپس، جانچ فلک، وارنگ سیلز اور ریکارڈ کے تمام اخیری ہول سیل ریٹ پر دستیاب ہے۔",
  urduTerms:
    "الیکٹرانک اور چانٹا کے سپیئر پارٹس کی واپسی یا تبدیلی ہر صورت ممکن نہیں ہوگی۔\nبلی ہوئی آئٹم، پکلاہوا اکا ول واپس قابل واپسی نہیں ہے۔\nبارک کے سامان کی واپس کی صورت میں (7) دن کے اند پہلی ہوگی۔\nکل پیلی کلائی کی تمام واپسی قابل قبول نہیں ہوگی۔",
  devBy:
    "Software developed by: AppHill / 03222292922 or visit website www.apphill.pk",
};

const TYPE_COLORS = {
  credit: { bg: "#fca5a5", color: "#7f1d1d", border: "#ef4444" },
  debit: { bg: "#93c5fd", color: "#1e3a8a", border: "#3b82f6" },
  cash: { bg: "#86efac", color: "#14532d", border: "#22c55e" },
  "raw-sale": { bg: "#fde68a", color: "#78350f", border: "#f59e0b" },
  "raw-purchase": { bg: "#d8b4fe", color: "#3b0764", border: "#a855f7" },
};

const typeToPayment = (t) => {
  if (
    t === "credit" ||
    t === "raw-sale" ||
    t === "raw-purchase" ||
    t === "supplier"
  )
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

  const URDU_FONT = `'Noto Nastaliq Urdu','Mehr Nastaliq','Jameel Noori Nastaleeq','Urdu Typesetting',serif`;
  const GOOGLE_FONT_LINK = `<link href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;700&display=swap" rel="stylesheet">`;

  /* ── THERMAL ── */
  if (type === "Thermal") {
    const itemRows = rows
      .map(
        (it) =>
          `<tr>
        <td style="font-size:9px;vertical-align:top">${it.sr}</td>
        <td style="font-size:9.5px;vertical-align:top;word-break:break-word;max-width:100px">${it.name}</td>
        <td style="font-size:9px;vertical-align:top;text-align:right">${it.pcs} ${it.uom || ""}</td>
        <td style="font-size:9px;vertical-align:top;text-align:right">${Number(it.rate).toLocaleString()}</td>
        <td style="font-size:9px;vertical-align:top;text-align:right"><b>${Number(it.amount).toLocaleString()}</b></td>
      </tr>`,
      )
      .join("");

    return `<!DOCTYPE html><html><head><meta charset="utf-8">${GOOGLE_FONT_LINK}<style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:'Courier New',Courier,monospace;font-size:10px;width:80mm;margin:0 auto;padding:2mm 3mm;color:#000}
      .urdu{font-family:${URDU_FONT};direction:rtl;text-align:center}
      .shop-urdu{font-size:16px;font-weight:bold;text-align:center;margin-bottom:2px;font-family:${URDU_FONT};direction:rtl}
      .shop-addr{font-size:9px;text-align:center;margin-bottom:1px;font-family:${URDU_FONT};direction:rtl}
      .shop-phones{font-size:8.5px;text-align:center;font-weight:bold;margin-bottom:3px}
      .banner{background:#555;color:#fff;font-size:8px;text-align:center;padding:2px 4px;margin:3px 0;font-family:${URDU_FONT};direction:rtl;line-height:1.8}
      .meta-row{display:flex;justify-content:space-between;font-size:9px;margin:2px 0}
      .meta-bold{font-weight:bold;font-size:10px}
      .divider-solid{border:none;border-top:2px solid #000;margin:3px 0}
      .divider-dash{border:none;border-top:1px dashed #666;margin:3px 0}
      table{width:100%;border-collapse:collapse}
      thead tr{border-bottom:1px solid #000}
      th{font-size:8.5px;font-weight:bold;padding:2px 1px;text-align:left}
      th.r{text-align:right}
      td{padding:2px 1px;font-size:9px;vertical-align:top}
      .sum-row{display:flex;justify-content:space-between;font-size:10px;padding:1.5px 0}
      .sum-row.bold{font-weight:bold;font-size:11px}
      .sum-row.sep{border-top:1px dashed #555;margin-top:2px;padding-top:2px}
      .red{color:#b00}.green{color:#060}
      .totals-box{margin-top:4px}
      .terms{font-family:${URDU_FONT};direction:rtl;font-size:9px;color:#333;border:1px dashed #999;padding:4px;margin-top:4px;line-height:2;text-align:right}
      .devby{text-align:center;font-size:7.5px;color:#777;margin-top:4px;border-top:1px dashed #ccc;padding-top:3px}
      @media print{@page{size:80mm auto;margin:1mm}body{width:78mm}}
    </style></head><body>

      <!-- HEADER -->
      <div class="shop-urdu">${SHOP_INFO.name}</div>
      <div class="shop-addr">${SHOP_INFO.address}</div>
      <div class="shop-phones">${SHOP_INFO.phone1}, ${SHOP_INFO.phone2}, ${SHOP_INFO.phone3}</div>
      <div class="banner">${SHOP_INFO.urduBanner}</div>

      <!-- META -->
      <div class="meta-row">
        <span><b>Sales Invoice</b></span>
        <span>ADMIN</span>
        <span>Shop Server</span>
      </div>
      <hr class="divider-dash">
      <div class="meta-row">
        <span class="meta-bold">${sale.invoiceNo}</span>
        <span>${sale.invoiceDate}</span>
      </div>
      <div class="meta-row">
        <span>Customer:</span>
      </div>
      <div style="font-size:10px;font-weight:bold;margin-bottom:1px">${customerName}</div>
      ${customerPhone ? `<div style="font-size:9px;color:#555">${customerPhone}</div>` : ""}
      <div class="meta-row"><span style="font-size:9px;color:#555">Items: ${rows.length}</span></div>
      <hr class="divider-solid">

      <!-- ITEMS TABLE -->
      <table>
        <thead>
          <tr>
            <th style="width:20px">#</th>
            <th>Product</th>
            <th class="r">Qty.</th>
            <th class="r">Rate</th>
            <th class="r">Amount</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>
      <hr class="divider-dash">

      <!-- TOTALS -->
      <div class="totals-box">
        <div style="display:flex;justify-content:space-between;font-size:9px;margin-bottom:2px">
          <span>T.Qty: <b>${totalQty}</b></span>
          <span>T.Items: <b>${rows.length}</b></span>
        </div>
        ${sale.extraDisc > 0 ? `<div class="sum-row red"><span>(−) Discount</span><span>${Number(sale.extraDisc).toLocaleString()}</span></div>` : ""}
        <div class="sum-row bold sep"><span>Sub Total:</span><span>${Number(sale.netTotal).toLocaleString()}</span></div>
        ${sale.prevBalance > 0 ? `<div class="sum-row red"><span>(+) Prev. Bal.</span><span>${Number(sale.prevBalance).toLocaleString()}</span></div>` : ""}
        <div class="sum-row green"><span>Received:</span><span>PKR ${Number(sale.paidAmount).toLocaleString()}</span></div>
        <div class="sum-row bold sep ${sale.balance > 0 ? "red" : "green"}"><span>Balance:</span><span>PKR ${Number(sale.balance).toLocaleString()}</span></div>
      </div>

      <!-- TERMS -->
      <div class="terms">${SHOP_INFO.urduTerms.replace(/\n/g, "<br>")}</div>

      <!-- FOOTER -->
      <div class="devby">${SHOP_INFO.devBy}</div>

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
        title: 14,
        sub: 8.5,
        inv: 12,
        meta: 8,
        th: 8,
        td: 8,
        tot: 9,
        totB: 10.5,
      }
    : {
        title: 17,
        sub: 9.5,
        inv: 14,
        meta: 9,
        th: 9,
        td: 9,
        tot: 10,
        totB: 13,
      };

  const buildPageHtml = (pageRows, pageNum, totalPages, isLastPage) => {
    const itemRows = pageRows
      .map(
        (it, i) =>
          `<tr style="background:${i % 2 === 0 ? "#fff" : "#f7faff"}">
        <td style="text-align:center">${it.sr}</td>
        <td>${it.name}</td>
        <td>${it.uom || "—"}</td>
        <td style="text-align:right">${it.pcs}</td>
        <td style="text-align:right">${Number(it.rate).toLocaleString()}</td>
        <td style="text-align:right"><b>${Number(it.amount).toLocaleString()}</b></td>
      </tr>`,
      )
      .join("");

    const headerHtml = `
      <div class="hdr">
        <div class="hdr-center">
          <div class="shop-urdu">${SHOP_INFO.name}</div>
          <div class="shop-addr">${SHOP_INFO.address}</div>
          <div class="shop-phones">${SHOP_INFO.phone1}, ${SHOP_INFO.phone2}, ${SHOP_INFO.phone3}</div>
        </div>
      </div>
      <div class="banner">${SHOP_INFO.urduBanner}</div>`;

    const metaHtml =
      pageNum === 1
        ? `<div class="meta-strip">
          <div class="meta-left">
            <div class="meta-row"><span class="meta-lbl">Name:</span> <span class="meta-val">${customerName}</span></div>
            ${customerPhone ? `<div class="meta-row"><span class="meta-val">${customerPhone}</span></div>` : ""}
          </div>
          <div class="meta-mid"><span class="meta-val">${rows.length}</span></div>
          <div class="meta-right">
            <div class="meta-row"><span class="meta-lbl">Invoice #:</span> <span class="meta-val">${sale.invoiceNo}</span></div>
            <div class="meta-row"><span class="meta-lbl">Date &amp; Time:</span> <span class="meta-val">${sale.invoiceDate}</span></div>
          </div>
        </div>`
        : `<div style="display:flex;justify-content:space-between;font-size:${sz.sub}pt;color:#555;margin-bottom:4px;padding:2px 0;border-bottom:1px solid #ddd">
          <span>${customerName}</span>
          <span>Page ${pageNum} of ${totalPages}</span>
          <span>Invoice # ${sale.invoiceNo}</span>
        </div>`;

    const footerHtml = isLastPage
      ? `<div class="footer-wrap">
          <div class="footer-left">
            <div class="footer-stat">Total No. of Items: <b>${rows.length}</b></div>
            <div class="terms-box">${SHOP_INFO.urduTerms.replace(/\n/g, "<br>")}</div>
            <div class="sig-line">Signature</div>
          </div>
          <div class="footer-right">
            ${sale.extraDisc > 0 ? `<div class="sum-row red"><span>(−) Discount</span><span>${Number(sale.extraDisc).toLocaleString()}</span></div>` : ""}
            <div class="sum-row bold"><span>Sub Total:</span><span>${Number(sale.netTotal).toLocaleString()}</span></div>
            ${sale.prevBalance > 0 ? `<div class="sum-row red"><span>(+) Prev. Balance</span><span>PKR ${Number(sale.prevBalance).toLocaleString()}</span></div>` : ""}
            <div class="sum-row green"><span>Received:</span><span>PKR ${Number(sale.paidAmount).toLocaleString()}</span></div>
            <div class="sum-row bold ${sale.balance > 0 ? "red" : "green"} sep"><span>Balance Due:</span><span>PKR ${Number(sale.balance).toLocaleString()}</span></div>
          </div>
        </div>
        <div class="devby">${SHOP_INFO.devBy}</div>`
      : `<div style="text-align:right;font-size:${sz.sub}pt;color:#888;margin-top:4px">Page ${pageNum} of ${totalPages} — Continued...</div>`;

    return `
      <div class="page"${pageNum > 1 ? ' style="page-break-before:always"' : ""}>
        ${headerHtml}
        ${metaHtml}
        <table>
          <thead>
            <tr>
              <th style="width:28px;text-align:center">Sr.#</th>
              <th>Product</th>
              <th style="width:50px">Unit</th>
              <th style="width:42px;text-align:right">Qty</th>
              <th style="width:70px;text-align:right">Rate</th>
              <th style="width:80px;text-align:right">Amount</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>
        ${footerHtml}
      </div>`;
  };

  const allPagesHtml = pages
    .map((pageRows, idx) =>
      buildPageHtml(pageRows, idx + 1, pages.length, idx === pages.length - 1),
    )
    .join("");

  return `<!DOCTYPE html><html><head><meta charset="utf-8">${GOOGLE_FONT_LINK}<style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Arial,Helvetica,sans-serif;font-size:${sz.td}pt;color:#111;background:#fff;padding:${a5 ? "5mm" : "8mm"}}
    .shop-urdu{font-size:${a5 ? "20px" : "26px"};font-weight:900;font-family:${URDU_FONT};direction:rtl;text-align:center;line-height:2}
    .shop-addr{font-size:${sz.sub}pt;color:#444;text-align:center;font-family:${URDU_FONT};direction:rtl;margin:2px 0;line-height:1.8}
    .shop-phones{font-size:${sz.sub}pt;font-weight:bold;text-align:center;margin-bottom:2px}
    .banner{background:#555;color:#fff;font-size:${a5 ? "7.5" : "8.5"}pt;text-align:center;padding:${a5 ? "2px 6px" : "3px 8px"};margin:${a5 ? "3px 0" : "4px 0"};font-family:${URDU_FONT};direction:rtl;line-height:2}
    .hdr{text-align:center;border-bottom:2px solid #000;padding-bottom:${a5 ? "5px" : "8px"};margin-bottom:4px}
    .meta-strip{display:flex;justify-content:space-between;align-items:flex-start;border:1px solid #ccc;padding:${a5 ? "4px 8px" : "5px 10px"};margin:${a5 ? "4px 0" : "5px 0"};font-size:${sz.meta}pt}
    .meta-left{flex:2}
    .meta-mid{flex:0.5;text-align:center;font-size:${a5 ? "18px" : "22px"};font-weight:900;color:#555}
    .meta-right{flex:2;text-align:right}
    .meta-row{margin-bottom:1px}
    .meta-lbl{color:#555}
    .meta-val{font-weight:700}
    table{width:100%;border-collapse:collapse;margin:${a5 ? "4px 0" : "5px 0"}}
    thead tr{background:#333;color:#fff}
    th{padding:${a5 ? "3px 5px" : "5px 7px"};font-size:${sz.th}pt;font-weight:600;text-align:left}
    td{padding:${a5 ? "2px 5px" : "3px 7px"};font-size:${sz.td}pt;border-bottom:1px solid #e0e0e0}
    tbody tr:last-child td{border-bottom:2px solid #999}
    .footer-wrap{display:flex;justify-content:space-between;align-items:flex-start;margin-top:${a5 ? "6px" : "10px"};gap:10px}
    .footer-left{flex:1.5}
    .footer-right{flex:1;border:1px solid #ccc;padding:${a5 ? "4px 8px" : "5px 10px"}}
    .footer-stat{font-size:${sz.meta}pt;font-weight:bold;margin-bottom:4px}
    .terms-box{font-family:${URDU_FONT};direction:rtl;font-size:${a5 ? "8" : "9"}pt;color:#444;border:1px dashed #aaa;padding:${a5 ? "3px 6px" : "5px 8px"};margin:${a5 ? "4px 0" : "5px 0"};line-height:2;text-align:right}
    .sig-line{font-size:${sz.sub}pt;margin-top:${a5 ? "8px" : "14px"};border-top:1px solid #999;display:inline-block;padding-top:2px;min-width:120px}
    .sum-row{display:flex;justify-content:space-between;font-size:${sz.tot}pt;padding:${a5 ? "3px 0" : "4px 0"};border-bottom:1px solid #eee}
    .sum-row.bold{font-weight:700;font-size:${sz.totB}pt;background:#f5f5f5;padding:${a5 ? "3px 4px" : "4px 6px"}}
    .sum-row.sep{border-top:2px solid #333;margin-top:2px}
    .red{color:#c00}.green{color:#1a7a1a}
    .devby{text-align:center;font-size:${a5 ? "7" : "8"}pt;color:#888;margin-top:${a5 ? "6px" : "10px"};border-top:1px solid #ddd;padding-top:${a5 ? "4px" : "6px"}}
    .page{margin-bottom:0}
    @media print{
      @page{size:${a5 ? "A5" : "A4"};margin:${a5 ? "4mm" : "8mm"}}
      body{padding:0}
    }
  </style></head><body>${allPagesHtml}</body></html>`;
};

function PrintOptionsModal({
  sale,
  allCustomers,
  defaultPrintType,
  onPrint,
  onClose,
  hideCustomerFields,
  newCustomerType,
}) {
  const [selPrintType, setSelPrintType] = useState(
    defaultPrintType || "Thermal",
  );
  const [custPhone, setCustPhone] = useState("");
  const [custName, setCustName] = useState("");
  const [saving, setSaving] = useState(false);
  const phoneRef = useRef(null);
  const nameRef = useRef(null);

  const cashCustomers = allCustomers.filter(
    (c) => c.name?.toUpperCase().trim() !== "COUNTER SALE",
  );
  useEffect(() => {
    setTimeout(() => phoneRef.current?.focus(), 80);
  }, []);

  useEffect(() => {
    const h = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
      if (e.key === "Enter") {
        e.preventDefault();
        if (document.activeElement === phoneRef.current) {
          nameRef.current?.focus();
          return;
        }
        handlePrint();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [custPhone, custName, selPrintType, saving]);
  const handlePhoneChange = (val) => {
    setCustPhone(val);
    if (val.trim().length >= 7) {
      const clean = val.replace(/\D/g, "");
      const found = cashCustomers.find(
        (c) =>
          c.phone?.replace(/\D/g, "").includes(clean) ||
          c.cell?.replace(/\D/g, "").includes(clean) ||
          c.otherPhone?.replace(/\D/g, "").includes(clean),
      );
      if (found) setCustName(found.name);
      else setCustName("");
    } else {
      setCustName("");
    }
  };

  const handlePrint = async () => {
    if (saving) return;
    setSaving(true);

    let finalName = custName.trim() || "COUNTER SALE";
    let finalPhone = custPhone.trim();

    // Phone hai to customer save/find karo
    if (finalPhone) {
      const clean = finalPhone.replace(/\D/g, "");
      const existing = cashCustomers.find(
        (c) =>
          c.phone?.replace(/\D/g, "").includes(clean) ||
          c.cell?.replace(/\D/g, "").includes(clean),
      );

      if (!existing && finalName !== "COUNTER SALE") {
        try {
          const { data } = await api.post(EP.CUSTOMERS.CREATE, {
            name: finalName,
            type: newCustomerType || "walkin",
            phone: finalPhone,
          });
          if (data.success) {
            finalName = data.data.name;
          }
        } catch {}
      } else if (existing) {
        finalName = existing.name;
      }
    }

    setSaving(false);
    onPrint(selPrintType, {
      customerName: finalName,
      customerPhone: finalPhone,
    });
  };

  return (
    <div className="scm-overlay">
      <div className="scm-window" style={{ maxWidth: 420 }}>
        <div className="scm-tb">
          <svg
            width="13"
            height="13"
            viewBox="0 0 16 16"
            fill="rgba(255,255,255,0.85)"
          >
            <path d="M2.5 8a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1m4-3h7a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h1.172a3 3 0 0 0 2.12-.879l.83-.828A1 1 0 0 1 6.827 3h2.344a1 1 0 0 1 .707.293l.828.828A3 3 0 0 0 12.828 5H14a1 1 0 0 1 1 1zM2 4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1.172a2 2 0 0 1-1.414-.586l-.828-.828A2 2 0 0 0 9.172 2H6.828a2 2 0 0 0-1.414.586l-.828.828A2 2 0 0 1 3.172 4z" />
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
          {/* Phone Number */}
          {!hideCustomerFields && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label className="xp-label">Phone Number (optional)</label>
              <input
                ref={phoneRef}
                className="xp-input"
                value={custPhone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    e.stopPropagation();
                    nameRef.current?.focus();
                  }
                }}
                placeholder="e.g. 0300-1234567"
                autoComplete="off"
              />
            </div>
          )}

          {/* Customer Name */}
          {!hideCustomerFields && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label className="xp-label">
                Customer Name (optional)
                {custName && custPhone && (
                  <span
                    style={{
                      marginLeft: 8,
                      fontSize: 11,
                      color: "#15803d",
                      fontWeight: 600,
                    }}
                  >
                    ✓ Already saved
                  </span>
                )}
                {custPhone.trim().length >= 7 && !custName && (
                  <span
                    style={{
                      marginLeft: 8,
                      fontSize: 11,
                      color: "#b45309",
                      fontWeight: 600,
                    }}
                  >
                    New — will be saved
                  </span>
                )}
              </label>
              <input
                ref={nameRef}
                className="xp-input"
                value={custName}
                onChange={(e) => setCustName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handlePrint();
                  }
                }}
                placeholder="Customer ka naam…"
              />
            </div>
          )}

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
            disabled={saving}
          >
            {saving ? "Saving…" : "🖨 Print"}
          </button>
          <button
            className="xp-btn"
            style={{ minWidth: 110 }}
            onClick={onClose}
          >
            ↩ Cancel
          </button>
        </div>
        <div className="scm-hint">
          Enter (name field) = Print &nbsp;|&nbsp; Esc = Cancel
        </div>
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
            Raw Purchase Invoice— {salePayload.invoiceNo} &nbsp;|&nbsp;{" "}
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
              type="text"
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
                    <th>Rack#</th>
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
                      <td className="text-muted">{r.rackNo || "—"}</td>
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
  allowedTypes,
}) {
  const [query, setQuery] = useState("");
  const [ghost, setGhost] = useState("");
  const inputRef = useRef(null);

  const creditCustomers = allCustomers.filter((c) => {
    const t = (c.customerType || c.type || "").toLowerCase();
    const allowed = allowedTypes || ["credit"];
    return (
      allowed.includes(t) && c.name?.toUpperCase().trim() !== "COUNTER SALE"
    );
  });

  // Ghost suggestion — name se
  useEffect(() => {
    if (!query.trim()) {
      setGhost("");
      return;
    }
    const match = creditCustomers.find((c) =>
      c.name?.toLowerCase().startsWith(query.toLowerCase()),
    );
    setGhost(match ? match.name.slice(query.length) : "");
  }, [query, allCustomers]);

  const pick = (c) => {
    onSelect(c);
    setQuery("");
    setGhost("");
  };

  const handleKey = (e) => {
    if (ghost && (e.key === "Tab" || e.key === "ArrowRight")) {
      e.preventDefault();
      const full = query + ghost;
      const match = creditCustomers.find(
        (c) => c.name?.toLowerCase() === full.toLowerCase(),
      );
      if (match) pick(match);
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const q = query.trim().toLowerCase();
      if (!q) return;
      // Pehle exact match dhundo
      const match =
        creditCustomers.find((c) => c.name?.toLowerCase() === q) ||
        creditCustomers.find((c) => c.name?.toLowerCase().startsWith(q));
      if (match) {
        pick(match);
      } else if (onAddNew) {
        // Koi match nahi — naya add karo
        onAddNew(query.trim());
        setQuery("");
        setGhost("");
      }
      return;
    }
    if (e.key === "Escape") {
      setQuery("");
      setGhost("");
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

  return (
    <div style={{ position: "relative", flex: 1 }}>
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

        {/* Ghost text */}
        {ghost && (
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
              zIndex: 0,
            }}
          >
            <span style={{ visibility: "hidden" }}>{query}</span>
            <span style={{ color: "blue" }}>{ghost}</span>
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
          value={value ? query || displayName : query}
          placeholder="Naam type karo…"
          onChange={(e) => {
            setQuery(e.target.value);
            if (value && e.target.value !== displayName) onClear();
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
              setGhost("");
            }}
            title="Clear"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
/* ══════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════ */
export default function RawPurchasePage() {
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
  const [codeSearch, setCodeSearch] = useState("");
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
  const [printType, setPrintType] = useState("Thermal");
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
  const [showCustomerPanel, setShowCustomerPanel] = useState(false);
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
        api.get(EP.RAW_PURCHASES.NEXT_INVOICE),
      ]);
      if (pRes.data.success) setAllProducts(pRes.data.data);
      if (cRes.data.success) {
        const suppliers = cRes.data.data.filter(
          (c) => (c.type || "").toLowerCase() === "raw-purchase",
        );
        setAllCustomers(suppliers);
      }
      if (invRes.data.success) {
        const num = invRes.data.data.invoiceNo.replace("INV-", "PUR-");
        setInvoiceNo(num);
      }
    } catch {
      showMsg("Failed to load data", "error");
    }
    setLoading(false);
  };

  const refreshInvoiceNo = async () => {
    try {
      const r = await api.get(EP.RAW_PURCHASES.NEXT_INVOICE);
      const num = r.data.data.invoiceNo.replace("INV-", "PUR-");
      setInvoiceNo(num);
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
    setCodeSearch(c.code || "");
    setCustomerType(type);
    setPrevBalance(c.currentBalance || 0);
    setCodeSearch("");
    const pm = typeToPayment(type);
    const ss = typeToSource(type);
    setPaymentMode(pm);
    setSaleSource(ss);
    if (pm === "Credit") setReceived(0);
    else setReceived(billAmount + (c.currentBalance || 0));

    const limit = c.creditLimit || 0;
    const custBal = c.currentBalance || 0;
    if (type === "credit" && limit > 0 && custBal >= limit) {
      setCreditWarning(true);
    } else {
      setCreditWarning(false);
    }
    setCreditStatement("");
    setShowCustomerPanel(true);

    // Credit customer — note pe focus
    if (type === "raw-purchase" || type === "supplier") {
      setTimeout(() => statementRef.current?.focus(), 80);
    } else {
      setTimeout(() => searchRef.current?.focus(), 30);
    }
  };
  const handleCustomerClear = () => {
    setCustomerId("");
    setBuyerName("COUNTER SALE");
    setCodeSearch("");
    // setBuyerCode("");
    setCustomerType("");
    setPrevBalance(0);
    setPaymentMode("Cash");
    setSaleSource("cash");
    setReceived(billAmount);
    setCreditWarning(false);
    setCreditStatement("");
    setShowCustomerPanel(false);
  };

  const handleAddNewCustomer = async (name) => {
    try {
      const { data } = await api.post(EP.CUSTOMERS.CREATE, {
        name: name.trim(),
        type: "raw-purchase",
        phone: "",
      });
      if (data.success) {
        await fetchData();
        const newCust = data.data;
        handleCustomerSelect({
          _id: newCust._id,
          name: newCust.name,
          phone: newCust.phone || "",
          customerType: "supplier",
          type: "supplier",
          currentBalance: 0,
          creditLimit: newCust.creditLimit || 0,
        });
        showMsg(`"${name}" saved as new supplier`, "success");
      }
    } catch {
      showMsg("supplier save failed", "error");
    }
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

    const product = allProducts.find((p) => p._id === r.productId);
    if (product?.packingInfo?.length > 0) {
      setPackingOptions(product.packingInfo.map((pk) => pk.measurement));
    } else {
      setPackingOptions([]);
    }

    setTimeout(() => packingRef.current?.focus(), 30);
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
    setCodeSearch("");
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
  const loadSaleForEdit = (sale) => {
    setEditId(sale._id);
    setInvoiceNo(sale.invoiceNo);
    setInvoiceDate(sale.invoiceDate || isoDate());

    // Customer
    const cust = allCustomers.find((c) => c._id === sale.customerId);
    if (cust) {
      setCustomerId(cust._id);
      setBuyerName(cust.name);
      setCustomerType(cust.customerType || cust.type || "");
      setPrevBalance(sale.prevBalance || 0);
      setPaymentMode(sale.paymentMode || "Cash");
      setSaleSource(sale.saleSource || "cash");
    } else {
      setCustomerId("");
      setBuyerName(sale.customerName || "COUNTER SALE");
      // setBuyerCode("");
      setCustomerType("");
      setPrevBalance(sale.prevBalance || 0);
      setPaymentMode(sale.paymentMode || "Cash");
      setSaleSource(sale.saleSource || "cash");
    }

    // Items
    const loadedItems = (sale.items || []).map((it) => ({
      productId: it.productId || it.product || "",
      code: it.code || "",
      name: it.name || it.description || "",
      uom: it.uom || it.measurement || "",
      rack: it.rack || "",
      pcs: it.pcs || it.qty || 1,
      rate: it.rate || 0,
      amount: it.amount || 0,
    }));
    setItems(loadedItems);

    // Amounts
    setExtraDiscount(sale.extraDisc || 0);
    setReceived(sale.paidAmount || 0);

    resetCurRow();
    showMsg(`✏ Editing Invoice ${sale.invoiceNo}`, "success");
    setTimeout(() => searchRef.current?.focus(), 50);
  };

  const navInvoice = async (dir) => {
    try {
      const { data } = await api.get(EP.RAW_PURCHASES.GET_ALL);
      if (!data.success || !data.data?.length) return;
      const allSales = data.data;
      const curIdx = allSales.findIndex((s) =>
        editId ? s._id === editId : s.invoiceNo === invoiceNo,
      );
      let nextIdx = dir === "prev" ? curIdx - 1 : curIdx + 1;
      nextIdx = Math.max(0, Math.min(nextIdx, allSales.length - 1));
      if (nextIdx === curIdx) return;
      loadSaleForEdit(allSales[nextIdx]);
    } catch {
      showMsg("Navigation failed", "error");
    }
  };

  const buildPayload = () => ({
    invoiceNo,
    invoiceDate,
    customerId: customerId || undefined,
    customerName: buyerName || "COUNTER SALE",
    customerPhone: "",
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
    paymentMode: customerId ? "Credit" : "Cash",
    saleSource: "raw-purchase",
    sendSms,
    printType,
    remarks: creditStatement || "",
    saleType: "raw-purchase",
    // invoicePrefix: "PUR",
  });
  /* ── Open confirm modal   */
  const openSaleConfirm = () => {
    if (!items.length) {
      alert("Add at least one item");
      return;
    }

    if (
      customerId &&
      (customerType === "raw-purchase" || customerType === "supplier")
    ) {
      if (!creditStatement.trim()) {
        statementRef.current?.focus();
        showMsg("Note likhna zaroori hai", "error");
        return;
      }
    }

    const payload = buildPayload();
    setPendingPayload(payload);
    confirmSaveWithPayload(payload, {
      extraDisc: payload.extraDisc,
      netTotal: payload.netTotal,
      paidAmount: customerId ? 0 : payload.netTotal,
      balance: customerId
        ? payload.netTotal + (parseFloat(prevBalance) || 0)
        : 0,
      printType,
      withPrint: true,
    });
  };
  /* ── Actual API save — called from modal ── */
  const confirmSaveWithPayload = async (payload, overrides) => {
    if (!payload) return;
    setLoading(true);
    try {
      const finalPayload = {
        ...payload,
        extraDisc: overrides.extraDisc,
        netTotal: overrides.netTotal,
        paidAmount: overrides.paidAmount,
        balance: overrides.balance,
        printType: overrides.printType,
      };
      const { data } = editId
        ? await api.put(EP.RAW_PURCHASES.UPDATE(editId), finalPayload)
        : await api.post(EP.RAW_PURCHASES.CREATE, finalPayload);

      if (data.success) {
        showMsg(editId ? "Sale updated!" : `Saved: ${data.data.invoiceNo}`);
        const saleObj = {
          invoiceNo: data.data.invoiceNo,
          invoiceDate: finalPayload.invoiceDate,
          customerName: finalPayload.customerName,
          saleSource: finalPayload.saleSource,
          paymentMode: finalPayload.paymentMode,
          items: payload.items,
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

  const confirmSave = async (overrides) => {
    confirmSaveWithPayload(pendingPayload, overrides);
  };
  useEffect(() => {
    const handler = (e) => {
      if (
        showProductModal ||
        showHoldPreview ||
        showSaveModal ||
        showPrintModal
      )
        return;

      if (e.key === "F2") {
        e.preventDefault();
        setShowProductModal(true);
      }
      if (e.key === "F4") {
        e.preventDefault();
        holdBill();
      }
      if (e.key === "*" || (e.ctrlKey && e.key === "s")) {
        e.preventDefault();
        saveRef.current?.click();
      }
      if (e.key === "Escape") resetCurRow();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [
    items,
    showProductModal,
    showHoldPreview,
    showSaveModal,
    showPrintModal,
    billAmount,
  ]);

  const EMPTY_ROWS = Math.max(0, 8 - items.length);

  return (
    <>
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
            allCustomers={allCustomers}
            defaultPrintType={printType}
            hideCustomerFields={pendingPrintSale.paymentMode === "Credit"}
            newCustomerType="supplier"
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
            Raw Purchase Invoice — Asim Electric &amp; Electronic Store
          </span>
          <div className="xp-tb-actions">
            {editId && (
              <div className="sl-edit-badge">✏ Editing Raw Purchase</div>
            )}
            <div className="xp-tb-divider" />
            <div className="sl-shortcut-hints">
              <span>F2 Product</span>
              <span>F4 Hold</span>
              <span>* Save</span>
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
              <div
                className="sl-sale-title-box"
                style={{ background: "green", border: "1px solid green" }}
              >
                Raw Purchase
              </div>
              <div className="sl-inv-field-grp">
                <label>Invoice #</label>
                <input
                  className="xp-input xp-input-sm sl-inv-input"
                  value={invoiceNo}
                  onChange={(e) => setInvoiceNo(e.target.value)}
                  onKeyDown={async (e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const val = invoiceNo.trim();
                      if (!val) return;
                      try {
                        const { data } = await api.get(
                          EP.RAW_PURCHASES.GET_ALL + `?invoiceNo=${val}`,
                        );
                        const sales = data.data;
                        if (!sales || sales.length === 0) {
                          showMsg(`Invoice "${val}" not found`, "error");
                          await refreshInvoiceNo();
                          return;
                        }
                        const exact = sales.find(
                          (s) => s.invoiceNo?.toString() === val.toString(),
                        );
                        if (!exact) {
                          showMsg(`Invoice "${val}" not found`, "error");
                          await refreshInvoiceNo();
                          return;
                        }
                        // Pehle reset karo phir load
                        setItems([]);
                        setEditId(null);
                        loadSaleForEdit(exact);
                      } catch {
                        showMsg("Search failed", "error");
                      }
                    }
                    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                      e.preventDefault();
                      await navInvoice(e.key === "ArrowUp" ? "prev" : "next");
                    }
                  }}
                  onFocus={(e) => e.target.select()}
                  placeholder="Invoice # ya ↑↓"
                  style={{ background: editId ? "#fffbe6" : undefined }}
                />
              </div>
              <div className="sl-inv-field-grp">
                <label>Date</label>
                <input
                  type="date"
                  className="xp-input xp-input-sm sl-date-input"
                  value={invoiceDate}
                  readOnly
                  style={{
                    background: "#f5f5f5",
                    cursor: "not-allowed",
                    color: "#888",
                  }}
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
                  onFocus={() => {
                    setPackingHiIdx(
                      Math.max(0, packingOptions.indexOf(curRow.uom)),
                    );
                  }}
                  onBlur={() => setTimeout(() => setPackingOpen(false), 150)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      pcsRef.current?.focus();
                      return;
                    }
                    if (packingOptions.length === 0) return;
                    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                      e.preventDefault();
                      const idx = packingOptions.indexOf(curRow.uom);
                      const next =
                        e.key === "ArrowDown"
                          ? (idx + 1) % packingOptions.length
                          : (idx - 1 + packingOptions.length) %
                            packingOptions.length;
                      const newUom = packingOptions[next];

                      // Product ki packingInfo se rate aur pcs update karo
                      const product = allProducts.find(
                        (p) => p._id === curRow.productId,
                      );
                      if (product?.packingInfo) {
                        const pk = product.packingInfo.find(
                          (pk) => pk.measurement === newUom,
                        );
                        if (pk) {
                          setCurRow((p) => ({
                            ...p,
                            uom: newUom,
                            rate: pk.saleRate || 0,
                            pcs: pk.packing || 1,
                            amount: (pk.packing || 1) * (pk.saleRate || 0),
                          }));
                          return;
                        }
                      }
                      setCurRow((p) => ({ ...p, uom: newUom }));
                    }
                  }}
                  autoComplete="off"
                />
              </div>
              <div className="sl-entry-cell">
                <label>Pcs</label>
                <input
                  ref={pcsRef}
                  type="text"
                  className="sl-num-input"
                  style={{ width: 60 }}
                  value={curRow.pcs}
                  min={1}
                  onChange={(e) => updateCurRow("pcs", e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && rateRef.current?.focus()
                  }
                  onFocus={(e) => e.target.select()}
                />
              </div>
              <div className="sl-entry-cell">
                <label>Rate</label>
                <input
                  ref={rateRef}
                  type="text"
                  className="sl-num-input"
                  style={{ width: 75 }}
                  value={curRow.rate}
                  min={0}
                  onChange={(e) => updateCurRow("rate", e.target.value)}
                  onBlur={(e) => {
                    const product = allProducts.find(
                      (p) => p._id === curRow.productId,
                    );
                    if (product?.packingInfo) {
                      const pk = product.packingInfo.find(
                        (p) => p.measurement === curRow.uom,
                      );
                      if (pk) {
                        const purchaseRate =
                          pk.purchaseRate || pk.costRate || 0;
                        if (
                          purchaseRate > 0 &&
                          parseFloat(e.target.value) < purchaseRate
                        ) {
                          showMsg(
                            `Rate cannot be less than purchase rate (${purchaseRate})`,
                            "error",
                          );
                          updateCurRow("rate", purchaseRate);
                        }
                      }
                    }
                  }}
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
                  type="text"
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
                  onKeyDown={(e) =>
                    e.key === "Enter" && addRef.current?.click()
                  }
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
                      <td
                        className="r"
                        style={{ color: "var(--xp-blue-dark)" }}
                      >
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
                  type="text"
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
                  type="text"
                  className="sl-sum-input"
                  style={{ color: "var(--xp-green)", fontWeight: 700 }}
                  value={received}
                  min={0}
                  onChange={(e) => setReceived(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && saveRef.current?.focus()
                  }
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
              {/* Code search field */}
              <div className="sl-cust-cell">
                <label>Code</label>
                <input
                  style={{ width: 65 }}
                  value={
                    customerId
                      ? allCustomers.find((c) => c._id === customerId)?.code ||
                        codeSearch
                      : codeSearch
                  }
                  onChange={(e) => setCodeSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const q = codeSearch.trim();
                      if (!q) return;
                      const found = allCustomers.find(
                        (c) =>
                          String(c.code).toLowerCase() === q.toLowerCase() &&
                          (c.customerType || c.type || "").toLowerCase() ===
                            "raw-purchase",
                      );
                      if (found) {
                        handleCustomerSelect(found);
                        setCodeSearch("");
                      } else {
                        showMsg(
                          `Code "${q}" — credit customer nahi mila`,
                          "error",
                        );
                      }
                    }
                  }}
                  placeholder="Code…"
                  autoComplete="off"
                />
              </div>

              {/* Buyer name dropdown */}
              <div className="sl-cust-cell sl-cust-buyer">
                <label>Supplier Name</label>
                <CustomerDropdown
                  allCustomers={allCustomers}
                  value={customerId}
                  displayName={buyerName}
                  customerType={customerType}
                  onSelect={handleCustomerSelect}
                  onClear={handleCustomerClear}
                  onAddNew={handleAddNewCustomer}
                  allowedTypes={["raw-purchase"]}
                />
              </div>

              <div className="sl-cust-cell">
                <label>Prev Balance</label>
                <input
                  type="text"
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

              {/* <div className="sl-pay-btns">
                {["Cash", "Credit", "Bank", "Cheque"].map((m) => (
                  <button
                    key={m}
                    className={`sl-pay-btn${paymentMode === m ? " active-" + m.toLowerCase() : ""}`}
                    onClick={() => handlePaymentMode(m)}
                  >
                    {m}
                  </button>
                ))}
              </div> */}
            </div>

            {/* Credit Warning Bar */}
            {showCustomerPanel && customerId && (
              <div
                className={`sl-credit-warning-bar${creditWarning ? "" : " sl-credit-normal"}`}
              >
                <div className="sl-credit-warning-left">
                  {/* Image */}
                  {(() => {
                    const cust = allCustomers.find((c) => c._id === customerId);
                    return cust?.imageFront ? (
                      <img
                        src={cust.imageFront}
                        alt={cust.name}
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 4,
                          objectFit: "cover",
                          border: "2px solid #fff",
                          flexShrink: 0,
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 4,
                          background: "rgba(255,255,255,0.3)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 22,
                          flexShrink: 0,
                        }}
                      >
                        👤
                      </div>
                    );
                  })()}
                  <div>
                    {creditWarning && (
                      <>
                        <div className="sl-credit-title">
                          ⚠ CREDIT LIMIT EXCEEDED
                        </div>
                        <div className="sl-credit-sub">
                          Balance: <b>{fmt(prevBalance)}</b> — Enter
                          authorization statement to proceed
                        </div>
                      </>
                    )}
                    {!creditWarning && (
                      <div className="sl-credit-sub" style={{ color: "#fff" }}>
                        Balance: <b>{fmt(prevBalance)}</b>
                      </div>
                    )}
                  </div>
                </div>
                <input
                  ref={statementRef}
                  type="text"
                  className="sl-credit-statement-input"
                  placeholder={
                    creditWarning
                      ? "Enter reason / authorization statement to allow sale…"
                      : "Notes (optional)…"
                  }
                  value={creditStatement}
                  onChange={(e) => setCreditStatement(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Right panel */}
          <div className="sl-right">
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
            </div>
            {/* Customer Photo — Hold Bills ke neeche */}
            {customerId &&
              (() => {
                const cust = allCustomers.find((c) => c._id === customerId);
                return cust ? (
                  <div
                    style={{
                      width: "100%",
                      height: 100,
                      marginTop: 6,
                      borderRadius: 6,
                      overflow: "hidden",
                      border: "2px solid var(--xp-silver-4)",
                      flexShrink: 0,
                      order: 2,
                    }}
                  >
                    {cust.imageFront ? (
                      <img
                        src={cust.imageFront}
                        alt={cust.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          background: "var(--xp-silver-3)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 48,
                        }}
                      >
                        👤
                      </div>
                    )}
                  </div>
                ) : null;
              })()}
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
            {loading ? "Saving…" : "Save  *"}
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
                await api.delete(EP.RAW_PURCHASES.DELETE(editId));
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

      <style>{`
      @font-face {
  font-family: 'UrduFont';
  src: local('Jameel Noori Nastaleeq'),
       local('Noto Nastaliq Urdu'),
       local('Urdu Typesetting'),
       local('Arial Unicode MS');
}

.urdu, .shop-urdu, .shop-addr, .banner, .terms-box, .terms {
  font-family: 'UrduFont', 'Jameel Noori Nastaleeq', 'Noto Nastaliq Urdu', 
               'Urdu Typesetting', Arial, sans-serif !important;
  direction: rtl;
}
        .table.xp-table tbody td{
        border-right: 1px solid red !important;
        }
        .xp-link-btn{
        text-decoration: none;}
      `}</style>
    </>
  );
}
