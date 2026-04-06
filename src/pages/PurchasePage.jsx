// pages/PurchasePage.jsx
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

/* ══════════════════════════════════════════════════════════
   PRINT HTML BUILDER — Purchase Invoice
══════════════════════════════════════════════════════════ */
const buildPrintHtml = (purchase, type, overrides = {}) => {
  const buyerName = overrides.buyerName ?? purchase.supplierName;
  const buyerPhone = overrides.buyerPhone ?? "";
  const rows = purchase.items.map((it, i) => ({ ...it, sr: i + 1 }));
  const totalQty = rows.reduce((s, r) => s + (r.pcs || 0), 0);

  const URDU_FONT = `'Noto Nastaliq Urdu','Mehr Nastaliq','Jameel Noori Nastaleeq','Urdu Typesetting',serif`;
  const GOOGLE_FONT_LINK = `<link href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;700&display=swap" rel="stylesheet">`;

  if (type === "Thermal") {
    const itemRows = rows
      .map(
        (it) => `
        <tr>
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
      <div class="shop-urdu">${SHOP_INFO.name}</div>
      <div class="shop-addr">${SHOP_INFO.address}</div>
      <div class="shop-phones">${SHOP_INFO.phone1}, ${SHOP_INFO.phone2}, ${SHOP_INFO.phone3}</div>
      <div class="banner">${SHOP_INFO.urduBanner}</div>
      <div class="meta-row">
        <span><b>Purchase Invoice</b></span>
        <span>ADMIN</span>
        <span>Shop Server</span>
      </div>
      <hr class="divider-dash">
      <div class="meta-row">
        <span class="meta-bold">${purchase.invoiceNo}</span>
        <span>${purchase.invoiceDate}</span>
      </div>
      <div class="meta-row"><span>Supplier:</span></div>
      <div style="font-size:10px;font-weight:bold;margin-bottom:1px">${buyerName}</div>
      ${buyerPhone ? `<div style="font-size:9px;color:#555">${buyerPhone}</div>` : ""}
      <hr class="divider-solid">
      <table>
        <thead><tr><th style="width:20px">#</th><th>Product</th><th class="r">Qty.</th><th class="r">Rate</th><th class="r">Amount</th></tr></thead>
        <tbody>${itemRows}</tbody>
      </table>
      <hr class="divider-dash">
      <div class="totals-box">
        <div style="display:flex;justify-content:space-between;font-size:9px;margin-bottom:2px">
          <span>T.Qty: <b>${totalQty}</b></span>
          <span>T.Items: <b>${rows.length}</b></span>
        </div>
        <div class="sum-row bold sep"><span>Total Amount:</span><span>${Number(purchase.netTotal).toLocaleString()}</span></div>
        <div class="sum-row green"><span>Paid:</span><span>PKR ${Number(purchase.paidAmount).toLocaleString()}</span></div>
        <div class="sum-row bold sep green"><span>Balance Payable:</span><span>PKR 0</span></div>
      </div>
      <div class="terms">${SHOP_INFO.urduTerms.replace(/\n/g, "<br>")}</div>
      <div class="devby">${SHOP_INFO.devBy}</div>
    </body></html>`;
  }

  // A4/A5 format (simplified)
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
        (it, i) => `
        <tr style="background:${i % 2 === 0 ? "#fff" : "#f7faff"}">
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
            <div class="meta-row"><span class="meta-lbl">Supplier:</span> <span class="meta-val">${buyerName}</span></div>
            ${buyerPhone ? `<div class="meta-row"><span class="meta-val">${buyerPhone}</span></div>` : ""}
          </div>
          <div class="meta-mid"><span class="meta-val">${rows.length}</span></div>
          <div class="meta-right">
            <div class="meta-row"><span class="meta-lbl">Invoice #:</span> <span class="meta-val">${purchase.invoiceNo}</span></div>
            <div class="meta-row"><span class="meta-lbl">Date:</span> <span class="meta-val">${purchase.invoiceDate}</span></div>
          </div>
        </div>`
        : `<div style="display:flex;justify-content:space-between;font-size:${sz.sub}pt;color:#555;margin-bottom:4px;padding:2px 0;border-bottom:1px solid #ddd">
          <span>${buyerName}</span>
          <span>Page ${pageNum} of ${totalPages}</span>
          <span>Invoice # ${purchase.invoiceNo}</span>
        </div>`;

    const footerHtml = isLastPage
      ? `<div class="footer-wrap">
          <div class="footer-left">
            <div class="footer-stat">Total Items: <b>${rows.length}</b></div>
            <div class="terms-box">${SHOP_INFO.urduTerms.replace(/\n/g, "<br>")}</div>
            <div class="sig-line">Signature</div>
          </div>
          <div class="footer-right">
            <div class="sum-row bold"><span>Total:</span><span>${Number(purchase.netTotal).toLocaleString()}</span></div>
            <div class="sum-row green"><span>Paid:</span><span>PKR ${Number(purchase.paidAmount).toLocaleString()}</span></div>
            <div class="sum-row bold sep green"><span>Balance Payable:</span><span>PKR 0</span></div>
          </div>
        </div>
        <div class="devby">${SHOP_INFO.devBy}</div>`
      : `<div style="text-align:right;font-size:${sz.sub}pt;color:#888;margin-top:4px">Page ${pageNum} of ${totalPages} — Continued...</div>`;

    return `
      <div class="page"${pageNum > 1 ? ' style="page-break-before:always"' : ""}>
        ${headerHtml}
        ${metaHtml}
        <table>
          <thead><tr><th style="width:28px;text-align:center">Sr.#</th><th>Product</th><th style="width:50px">Unit</th><th style="width:42px;text-align:right">Qty</th><th style="width:70px;text-align:right">Rate</th><th style="width:80px;text-align:right">Amount</th></tr></thead>
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
    .meta-left{flex:2}.meta-mid{flex:0.5;text-align:center;font-size:${a5 ? "18px" : "22px"};font-weight:900;color:#555}.meta-right{flex:2;text-align:right}
    .meta-row{margin-bottom:1px}.meta-lbl{color:#555}.meta-val{font-weight:700}
    table{width:100%;border-collapse:collapse;margin:${a5 ? "4px 0" : "5px 0"}}
    thead tr{background:#333;color:#fff}
    th{padding:${a5 ? "3px 5px" : "5px 7px"};font-size:${sz.th}pt;font-weight:600;text-align:left}
    td{padding:${a5 ? "2px 5px" : "3px 7px"};font-size:${sz.td}pt;border-bottom:1px solid #e0e0e0}
    .footer-wrap{display:flex;justify-content:space-between;align-items:flex-start;margin-top:${a5 ? "6px" : "10px"};gap:10px}
    .footer-left{flex:1.5}.footer-right{flex:1;border:1px solid #ccc;padding:${a5 ? "4px 8px" : "5px 10px"}}
    .footer-stat{font-size:${sz.meta}pt;font-weight:bold;margin-bottom:4px}
    .terms-box{font-family:${URDU_FONT};direction:rtl;font-size:${a5 ? "8" : "9"}pt;color:#444;border:1px dashed #aaa;padding:${a5 ? "3px 6px" : "5px 8px"};margin:${a5 ? "4px 0" : "5px 0"};line-height:2;text-align:right}
    .sig-line{font-size:${sz.sub}pt;margin-top:${a5 ? "8px" : "14px"};border-top:1px solid #999;display:inline-block;padding-top:2px;min-width:120px}
    .sum-row{display:flex;justify-content:space-between;font-size:${sz.tot}pt;padding:${a5 ? "3px 0" : "4px 0"};border-bottom:1px solid #eee}
    .sum-row.bold{font-weight:700;font-size:${sz.totB}pt;background:#f5f5f5;padding:${a5 ? "3px 4px" : "4px 6px"}}
    .sum-row.sep{border-top:2px solid #333;margin-top:2px}
    .red{color:#c00}.green{color:#1a7a1a}
    .devby{text-align:center;font-size:${a5 ? "7" : "8"}pt;color:#888;margin-top:${a5 ? "6px" : "10px"};border-top:1px solid #ddd;padding-top:${a5 ? "4px" : "6px"}}
    @media print{@page{size:${a5 ? "A5" : "A4"};margin:${a5 ? "4mm" : "8mm"}}body{padding:0}}
  </style></head><body>${allPagesHtml}</body></html>`;
};

const doPrint = (purchase, type, overrides = {}) => {
  const w = window.open(
    "",
    "_blank",
    type === "Thermal" ? "width=420,height=640" : "width=900,height=700",
  );
  w.document.write(buildPrintHtml(purchase, type, overrides));
  w.document.close();
  setTimeout(() => w.print(), 400);
};

/* ══════════════════════════════════════════════════════════
   SUPPLIER SEARCH DROPDOWN
══════════════════════════════════════════════════════════ */
function SupplierDropdown({
  allSuppliers,
  value,
  onSelect,
  onClear,
  onAddNew,
}) {
  const [query, setQuery] = useState("");
  const [originalQuery, setOriginalQuery] = useState("");
  const [ghost, setGhost] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);
  const parentRef = useRef(null);

  const getSuggestions = (searchTerm) => {
    if (!searchTerm.trim()) return [];
    const searchLower = searchTerm.toLowerCase();
    return allSuppliers
      .filter((s) => s.name?.toLowerCase().includes(searchLower))
      .slice(0, 10);
  };

  useEffect(() => {
    if (!originalQuery.trim()) {
      setSuggestions([]);
      setGhost("");
      setShowDropdown(false);
      return;
    }

    const matches = getSuggestions(originalQuery);
    setSuggestions(matches);
    setShowDropdown(matches.length > 0);

    if (!isNavigating && matches.length > 0 && matches[0].name) {
      const remaining = matches[0].name.slice(originalQuery.length);
      setGhost(remaining);
    } else {
      setGhost("");
    }
  }, [originalQuery, allSuppliers, isNavigating]);

  const selectSupplier = (supplier) => {
    onSelect(supplier);
    setQuery("");
    setOriginalQuery("");
    setGhost("");
    setSuggestions([]);
    setSelectedSuggestionIndex(-1);
    setShowDropdown(false);
    setIsNavigating(false);
  };

  const handleKeyDown = (e) => {
    if (ghost && (e.key === "ArrowRight" || e.key === "Tab") && !isNavigating) {
      e.preventDefault();
      const fullName = originalQuery + ghost;
      setQuery(fullName);
      setOriginalQuery(fullName);
      setGhost("");
      setIsNavigating(false);

      const matchedSupplier = suggestions[0];
      if (matchedSupplier) {
        selectSupplier(matchedSupplier);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (suggestions.length === 0) return;

      setIsNavigating(true);
      setShowDropdown(true);

      let newIndex;
      if (selectedSuggestionIndex === -1) {
        newIndex = 0;
      } else {
        newIndex = selectedSuggestionIndex + 1;
        if (newIndex >= suggestions.length) newIndex = 0;
      }

      setSelectedSuggestionIndex(newIndex);
      const selectedSupplier = suggestions[newIndex];
      if (selectedSupplier) {
        setQuery(selectedSupplier.name);
        setGhost("");
      }
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (suggestions.length === 0) return;

      setIsNavigating(true);
      setShowDropdown(true);

      let newIndex;
      if (selectedSuggestionIndex === -1) {
        newIndex = suggestions.length - 1;
      } else {
        newIndex = selectedSuggestionIndex - 1;
        if (newIndex < 0) newIndex = suggestions.length - 1;
      }

      setSelectedSuggestionIndex(newIndex);
      const selectedSupplier = suggestions[newIndex];
      if (selectedSupplier) {
        setQuery(selectedSupplier.name);
        setGhost("");
      }
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      if (
        selectedSuggestionIndex >= 0 &&
        suggestions[selectedSuggestionIndex]
      ) {
        selectSupplier(suggestions[selectedSuggestionIndex]);
      } else if (suggestions.length > 0 && suggestions[0]) {
        selectSupplier(suggestions[0]);
      } else if (originalQuery.trim()) {
        onAddNew(originalQuery.trim());
        setQuery("");
        setOriginalQuery("");
        setGhost("");
      }
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      setQuery("");
      setOriginalQuery("");
      setGhost("");
      setSuggestions([]);
      setSelectedSuggestionIndex(-1);
      setShowDropdown(false);
      setIsNavigating(false);
      if (value) onClear();
      inputRef.current?.blur();
    }
  };

  const handleChange = (e) => {
    const newValue = e.target.value;
    setQuery(newValue);
    setOriginalQuery(newValue);
    if (value && newValue !== value) onClear();
    setSelectedSuggestionIndex(-1);
    setShowDropdown(true);
    setIsNavigating(false);
  };

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
        <div
          ref={parentRef}
          style={{
            position: "relative",
            flex: 1,
            background: isFocused ? "#fffbe6" : "transparent",
            borderRadius: "4px",
            transition: "background 0.15s ease",
          }}
        >
          {ghost && !isNavigating && (
            <div
              style={{
                position: "absolute",
                left: 0,
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
                whiteSpace: "nowrap",
                fontSize: "13px",
                fontFamily: "inherit",
                display: "flex",
                zIndex: 2,
                color: "#a0aec0",
                paddingLeft: "4px",
              }}
            >
              <span style={{ visibility: "hidden" }}>{originalQuery}</span>
              <span style={{ color: "#a0aec0" }}>{ghost}</span>
            </div>
          )}

          <input
            ref={inputRef}
            className="sl-cust-input"
            style={{
              flex: 1,
              minWidth: 0,
              cursor: "text",
              background: "transparent",
              position: "relative",
              zIndex: 1,
              width: "100%",
              border: "none",
              outline: "none",
              padding: "4px",
            }}
            value={value ? query || value : query}
            placeholder="Type supplier name..."
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        {value && value !== "Cash Purchase" && (
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
              setOriginalQuery("");
              setGhost("");
              setSuggestions([]);
              setSelectedSuggestionIndex(-1);
              setShowDropdown(false);
              setIsNavigating(false);
              inputRef.current?.focus();
            }}
            title="Clear"
          >
            ✕
          </button>
        )}
      </div>

      {showDropdown && suggestions.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            backgroundColor: "white",
            border: "1px solid #e5e7eb",
            borderRadius: 4,
            maxHeight: 200,
            overflowY: "auto",
            zIndex: 1000,
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
            marginTop: 2,
          }}
        >
          {suggestions.map((supplier, idx) => (
            <div
              key={supplier._id || idx}
              onClick={() => selectSupplier(supplier)}
              style={{
                padding: "8px 12px",
                cursor: "pointer",
                backgroundColor:
                  idx === selectedSuggestionIndex ? "#e5f0ff" : "white",
                borderBottom: "1px solid #f3f4f6",
                fontSize: 13,
              }}
              onMouseEnter={() => {
                setSelectedSuggestionIndex(idx);
                setIsNavigating(true);
                setQuery(supplier.name);
                setGhost("");
              }}
            >
              <div style={{ fontWeight: 500 }}>{supplier.name}</div>
              {supplier.phone && (
                <div style={{ fontSize: 10, color: "#6b7280" }}>
                  📞 {supplier.phone}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   OPTIONAL SUPPLIER MODAL (when * pressed with no supplier)
══════════════════════════════════════════════════════════ */
function OptionalSupplierModal({ onConfirm, onSkip, existingSuppliers }) {
  const [supplierName, setSupplierName] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (selectedSupplier) {
        onConfirm(selectedSupplier.name);
      } else if (supplierName.trim()) {
        onConfirm(supplierName.trim());
      } else {
        onSkip();
      }
    }
    if (e.key === "Escape") {
      onSkip();
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSupplierName(value);
    setSelectedSupplier(null);

    if (value.trim() && existingSuppliers?.length) {
      const matches = existingSuppliers.filter((s) =>
        s.name?.toLowerCase().includes(value.toLowerCase()),
      );
      if (matches.length > 0) {
        setShowSuggestions(true);
      } else {
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
    }
  };

  const selectSupplier = (supplier) => {
    setSelectedSupplier(supplier);
    setSupplierName(supplier.name);
    setShowSuggestions(false);
    setTimeout(() => onConfirm(supplier.name), 100);
  };

  return (
    <div
      className="xp-overlay"
      onClick={(e) => e.target === e.currentTarget && onSkip()}
    >
      <div className="xp-modal" style={{ width: 450 }}>
        <div className="xp-modal-tb">
          <svg
            width="13"
            height="13"
            viewBox="0 0 16 16"
            fill="rgba(255,255,255,0.85)"
          >
            <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0m4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4m-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664z" />
          </svg>
          <span className="xp-modal-title">Supplier Name (Optional)</span>
          <button className="xp-cap-btn xp-cap-close" onClick={onSkip}>
            ✕
          </button>
        </div>
        <div className="xp-modal-body" style={{ padding: "16px 20px" }}>
          <div style={{ marginBottom: 16 }}>
            <label
              className="xp-label"
              style={{ marginBottom: 6, display: "block" }}
            >
              Enter Supplier Name
            </label>
            <input
              ref={inputRef}
              type="text"
              className="xp-input"
              style={{ fontSize: 16, padding: "10px 12px" }}
              value={supplierName}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type supplier name or leave empty for 'Cash Purchase'..."
              autoComplete="off"
            />
            {showSuggestions && (
              <div
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 4,
                  maxHeight: 200,
                  overflowY: "auto",
                  marginTop: 4,
                  background: "white",
                }}
              >
                {existingSuppliers
                  ?.filter((s) =>
                    s.name?.toLowerCase().includes(supplierName.toLowerCase()),
                  )
                  .slice(0, 8)
                  .map((supplier, idx) => (
                    <div
                      key={idx}
                      onClick={() => selectSupplier(supplier)}
                      style={{
                        padding: "8px 12px",
                        cursor: "pointer",
                        borderBottom: "1px solid #f3f4f6",
                        fontSize: 13,
                      }}
                      onMouseEnter={(e) =>
                        (e.target.style.background = "#e5f0ff")
                      }
                      onMouseLeave={(e) =>
                        (e.target.style.background = "white")
                      }
                    >
                      {supplier.name}
                      {supplier.phone && (
                        <span
                          style={{
                            fontSize: 10,
                            color: "#6b7280",
                            marginLeft: 8,
                          }}
                        >
                          📞 {supplier.phone}
                        </span>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
          <div
            className="scm-hint"
            style={{ textAlign: "center", marginTop: 8 }}
          >
            Press <kbd>Enter</kbd> to confirm · <kbd>Esc</kbd> to skip (use Cash
            Purchase)
          </div>
        </div>
        <div
          className="scm-actions"
          style={{
            padding: "10px 20px",
            borderTop: "1px solid var(--xp-silver-5)",
          }}
        >
          <button
            className="xp-btn xp-btn-primary"
            onClick={() => {
              if (selectedSupplier) onConfirm(selectedSupplier.name);
              else if (supplierName.trim()) onConfirm(supplierName.trim());
              else onSkip();
            }}
          >
            ✓ Confirm & Print
          </button>
          <button className="xp-btn" onClick={onSkip}>
            Skip (Cash Purchase)
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   PRODUCT SEARCH MODAL (unchanged)
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
      if (p.packingInfo?.length > 0) {
        p.packingInfo.forEach((pk, i) =>
          res.push({
            ...p,
            _pi: i,
            _meas: pk.measurement,
            _rate: pk.purchaseRate || pk.costRate || 0,
            _pack: pk.packing,
            _stock: pk.openingQty || 0,
            _name,
          }),
        );
      } else {
        res.push({
          ...p,
          _pi: 0,
          _meas: "",
          _rate: 0,
          _pack: 1,
          _stock: 0,
          _name,
        });
      }
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
          <span className="xp-modal-title">
            Search Products (Purchase Rate)
          </span>
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
                    <th className="r">Purchase Rate</th>
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
   MAIN PURCHASE PAGE
══════════════════════════════════════════════════════════ */
export default function PurchasePage() {
  const [time, setTime] = useState(timeNow());
  const [allProducts, setAllProducts] = useState([]);
  const [allSuppliers, setAllSuppliers] = useState([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [curRow, setCurRow] = useState({ ...EMPTY_ROW });
  const [items, setItems] = useState([]);
  const [invoiceDate, setInvoiceDate] = useState(isoDate());
  const [invoiceNo, setInvoiceNo] = useState("PUR-00001");
  const amountRef = useRef(null);

  const [supplierName, setSupplierName] = useState("Cash Purchase");
  const [supplierId, setSupplierId] = useState("");
  const [printType, setPrintType] = useState("Thermal");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: "", type: "" });
  const [isPrinting, setIsPrinting] = useState(false);

  const searchRef = useRef(null);
  const pcsRef = useRef(null);
  const rateRef = useRef(null);
  const addRef = useRef(null);

  useEffect(() => {
    const t = setInterval(() => setTime(timeNow()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  // Keyboard handler for * (asterisk) to print
  useEffect(() => {
    const handler = (e) => {
      if (showProductModal) return;
      if (e.key === "*") {
        e.preventDefault();
        if (items.length === 0) {
          showMsg("Add at least one item first", "error");
          return;
        }
        // If supplier is not selected (i.e., still "Cash Purchase" and no custom supplier)
        if (supplierId === "" && supplierName === "Cash Purchase") {
          setShowSupplierModal(true);
        } else {
          handlePrint();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [items, supplierName, supplierId]);

  const subTotal = items.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
  const billAmount = subTotal;

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pRes, invRes, sRes] = await Promise.all([
        api.get(EP.PRODUCTS.GET_ALL),
        api.get(EP.PURCHASES.NEXT_INVOICE),
        api
          .get(`${EP.CUSTOMERS.GET_ALL}`)
          .catch(() => ({ data: { data: [] } })),
      ]);
      if (pRes.data.success) setAllProducts(pRes.data.data);
      if (invRes.data.success) setInvoiceNo(invRes.data.data.invoiceNo);
      if (sRes.data.success) setAllSuppliers(sRes.data.data);
    } catch (error) {
      console.error("Failed to load data", error);
    }
    setLoading(false);
  };

  const refreshInvoiceNo = async () => {
    try {
      const r = await api.get(EP.PURCHASES.NEXT_INVOICE);
      if (r.data.success) setInvoiceNo(r.data.data.invoiceNo);
    } catch {}
  };

  const showMsg = (text, type = "success") => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: "", type: "" }), 3000);
  };

  const pickProduct = (product) => {
    if (!product._id) {
      showMsg("Product ID missing", "error");
      return;
    }
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
    setTimeout(() => pcsRef.current?.focus(), 30);
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
    setItems((p) => [...p, { ...curRow }]);
    resetCurRow();
  };

  const resetCurRow = () => {
    setCurRow({ ...EMPTY_ROW });
    setSearchText("");
    setTimeout(() => searchRef.current?.focus(), 30);
  };

  const removeRow = (index) => {
    setItems((p) => p.filter((_, i) => i !== index));
  };

  const totalQty = items.reduce((s, r) => s + (parseFloat(r.pcs) || 0), 0);

  const handleSupplierSelect = (supplier) => {
    setSupplierId(supplier._id);
    setSupplierName(supplier.name);
  };

  const handleSupplierClear = () => {
    setSupplierId("");
    setSupplierName("Cash Purchase");
  };

  const handleAddNewSupplier = async (name) => {
    try {
      const { data } = await api.post(EP.CUSTOMERS.CREATE, {
        name: name.trim(),
        type: "supplier",
        phone: "",
      });
      if (data.success) {
        await fetchData();
        setSupplierId(data.data._id);
        setSupplierName(data.data.name);
        showMsg(`"${name}" saved as new supplier`, "success");
      }
    } catch {
      showMsg("Supplier save failed", "error");
    }
  };

  const handlePrint = async () => {
    if (isPrinting) return;
    if (items.length === 0) {
      showMsg("No items to print", "error");
      return;
    }

    setIsPrinting(true);

    const purchaseObj = {
      invoiceNo,
      invoiceDate,
      supplierName: supplierName,
      items: items,
      subTotal,
      extraDisc: 0,
      netTotal: billAmount,
      prevBalance: 0,
      paidAmount: billAmount,
      balance: 0,
    };

    doPrint(purchaseObj, printType, { buyerName: supplierName });

    // Save to database
    try {
      const payload = {
        invoiceNo,
        invoiceDate,
        supplierId: supplierId || null,
        supplierName: supplierName,
        supplierPhone: "",
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
        extraDisc: 0,
        discAmount: 0,
        netTotal: billAmount,
        prevBalance: 0,
        paidAmount: billAmount,
        balance: 0,
        printType,
        saleType: "purchase",
      };

      await api.post(EP.PURCHASES.CREATE, payload);
      showMsg(`Invoice saved & printed: ${invoiceNo}`);
      await refreshInvoiceNo();

      // Reset form after successful print
      setItems([]);
      setSupplierName("Cash Purchase");
      setSupplierId("");
      resetCurRow();
    } catch (error) {
      console.error("Save failed:", error);
      showMsg("Print done but save failed", "error");
    }

    setIsPrinting(false);
  };

  const handleOptionalSupplierConfirm = (name) => {
    setSupplierName(name);
    setSupplierId("");
    setShowSupplierModal(false);
    setTimeout(() => handlePrint(), 100);
  };

  const handleOptionalSupplierSkip = () => {
    setShowSupplierModal(false);
    setTimeout(() => handlePrint(), 100);
  };

  const EMPTY_ROWS = Math.max(0, 12 - items.length);

  return (
    <>
      <div className="sl-page">
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

        {showSupplierModal && (
          <OptionalSupplierModal
            onConfirm={handleOptionalSupplierConfirm}
            onSkip={handleOptionalSupplierSkip}
            existingSuppliers={allSuppliers}
          />
        )}

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
            Purchase Invoice — Direct Print (*)
          </span>
          <div className="xp-tb-actions">
            <div className="sl-shortcut-hints">
              <span>F2 Product</span>
              <span>* Print</span>
            </div>
            <div className="xp-tb-divider" />
            <button className="xp-cap-btn">─</button>
            <button
              className="xp-cap-btn"
              onClick={() => {
                if (!document.fullscreenElement)
                  document.documentElement.requestFullscreen();
                else document.exitFullscreen();
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
          <div className="sl-left" style={{ width: "100%" }}>
            <div className="sl-top-bar">
              <div
                className="sl-sale-title-box"
                style={{ background: "green", border: "1px solid green" }}
              >
                Purchase
              </div>
              <div className="sl-inv-field-grp">
                <label>Invoice #</label>
                <input
                  className="xp-input xp-input-sm sl-inv-input"
                  value={invoiceNo}
                  readOnly
                  style={{ background: "#f5f5f5" }}
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
                      const q = searchText.trim().toLowerCase();
                      const found = allProducts.find(
                        (p) =>
                          p.code?.toLowerCase() === q ||
                          p.description?.toLowerCase().includes(q),
                      );
                      if (found) {
                        const pk = found.packingInfo?.[0];
                        pickProduct({
                          ...found,
                          _pi: 0,
                          _meas: pk?.measurement || "",
                          _rate: pk?.purchaseRate || pk?.costRate || 0,
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
                  onChange={(e) => {
                    setSearchText(e.target.value);
                    if (curRow.name) {
                      setCurRow({ ...EMPTY_ROW });
                    }
                  }}
                  autoFocus
                />
              </div>
              <div className="sl-entry-cell">
                <label>Qty</label>
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
                <label>Purchase Rate</label>
                <input
                  ref={rateRef}
                  type="text"
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
                    Add Item
                  </button>
                </div>
              </div>
            </div>

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

            <div className="sl-items-wrap">
              <table className="sl-items-table">
                <thead>
                  <tr>
                    <th style={{ width: 32 }}>Sr.#</th>
                    <th style={{ width: 72 }}>Code</th>
                    <th>Product Name</th>
                    <th style={{ width: 65 }}>UOM</th>
                    <th style={{ width: 55 }} className="r">
                      Qty
                    </th>
                    <th style={{ width: 80 }} className="r">
                      Rate
                    </th>
                    <th style={{ width: 90 }} className="r">
                      Amount
                    </th>
                    <th style={{ width: 40 }}></th>
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
                        Add products to create purchase invoice
                      </td>
                    </tr>
                  )}
                  {items.map((r, i) => (
                    <tr key={i}>
                      <td className="muted" style={{ textAlign: "center" }}>
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
                      <td>
                        <button
                          className="xp-btn xp-btn-sm xp-btn-danger"
                          style={{ padding: "2px 6px" }}
                          onClick={() => removeRow(i)}
                        >
                          ✕
                        </button>
                      </td>
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
                <label>Total Amount</label>
                <input
                  className="sl-sum-val"
                  value={Number(subTotal).toLocaleString("en-PK")}
                  readOnly
                />
              </div>
              <div className="sl-cust-cell" style={{ flex: 1 }}>
                <label>Supplier Name</label>
                <SupplierDropdown
                  allSuppliers={allSuppliers}
                  value={supplierName === "Cash Purchase" ? "" : supplierName}
                  displayName={supplierName}
                  onSelect={handleSupplierSelect}
                  onClear={handleSupplierClear}
                  onAddNew={handleAddNewSupplier}
                />
              </div>
              <div className="sl-sum-cell">
                <button
                  className="xp-btn xp-btn-primary"
                  onClick={() => {
                    if (items.length === 0) {
                      showMsg("Add at least one item first", "error");
                      return;
                    }
                    if (supplierId === "" && supplierName === "Cash Purchase") {
                      setShowSupplierModal(true);
                    } else {
                      handlePrint();
                    }
                  }}
                  disabled={isPrinting || items.length === 0}
                  style={{ padding: "6px 20px", fontSize: 14 }}
                >
                  {isPrinting ? "Printing..." : "🖨 Print (*)"}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="sl-cmd-bar">
          <button
            className="xp-btn xp-btn-sm"
            onClick={fetchData}
            disabled={loading}
          >
            Refresh
          </button>
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
          <span className="sl-inv-info">
            {invoiceNo} | Items: {items.length} | Total:{" "}
            {Number(subTotal).toLocaleString("en-PK")}
          </span>
          <button
            className="xp-btn xp-btn-sm"
            style={{ marginLeft: "auto" }}
            onClick={() => {
              setItems([]);
              setSupplierName("Cash Purchase");
              setSupplierId("");
              resetCurRow();
            }}
          >
            New Invoice
          </button>
        </div>
      </div>
    </>
  );
}
