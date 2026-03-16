import { useState, useEffect, useRef, useCallback } from "react";
import "../styles/QuotationPage.css";
import "../styles/SalePage.css"; // sm-* modal classes reuse
import api from "../api/api.js";
import EP from "../api/apiEndpoints.js";

const isoDate = () => new Date().toISOString().split("T")[0];
const addDays = (d, n) => {
  const dt = new Date(d);
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().split("T")[0];
};
const fmt = (n) => Number(n || 0).toLocaleString("en-PK");
const SHOP_NAME = "Asim Electric and Electronic Store";

const EMPTY_ROW = {
  code: "",
  description: "",
  measurement: "",
  qty: 1,
  rate: 0,
  disc: 0,
  amount: 0,
};

// ═══════════════════════════════════════════════════════════════════════════
// SEARCH MODAL — same 3-filter design as all other pages
// ═══════════════════════════════════════════════════════════════════════════
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
    const ld = d.trim().toLowerCase();
    const lc = c.trim().toLowerCase();
    const lo = co.trim().toLowerCase();
    const res = [];
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
            _rate: pk.saleRate,
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

  const filterKey = (e, nextRef) => {
    if (e.key === "Escape") {
      onClose();
      return;
    }
    if (e.key === "Enter" || e.key === "ArrowDown") {
      e.preventDefault();
      if (nextRef) nextRef.current?.focus();
      else {
        tbodyRef.current?.focus();
        setHiIdx((h) => Math.max(0, h));
      }
    }
  };
  const tableKey = (e) => {
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
      className="sm-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="sm-window">
        <div className="sm-titlebar">
          <span>🔍 Search Products</span>
          <button className="sm-close-btn" onClick={onClose} tabIndex={-1}>
            ✕
          </button>
        </div>
        <div className="sm-filters">
          <div className="sm-filter-field">
            <span className="sm-filter-label">Description</span>
            <input
              ref={rDesc}
              type="text"
              className="sm-filter-input w200"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              onKeyDown={(e) => filterKey(e, rCat)}
              placeholder="Name / code…"
              autoComplete="off"
            />
          </div>
          <div className="sm-filter-field">
            <span className="sm-filter-label">Category</span>
            <input
              ref={rCat}
              type="text"
              className="sm-filter-input w140"
              value={cat}
              onChange={(e) => setCat(e.target.value)}
              onKeyDown={(e) => filterKey(e, rCompany)}
              placeholder="e.g. SMALL"
              autoComplete="off"
            />
          </div>
          <div className="sm-filter-field">
            <span className="sm-filter-label">Company</span>
            <input
              ref={rCompany}
              type="text"
              className="sm-filter-input w130"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              onKeyDown={(e) => filterKey(e, null)}
              placeholder="e.g. LUX"
              autoComplete="off"
            />
          </div>
          <div className="sm-filters-right">
            <span className="sm-count">{rows.length} result(s)</span>
            <button
              className="sm-close-btn"
              style={{ padding: "0 10px", height: 24 }}
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
        <div className="sm-products-box">
          <span className="sm-products-legend">Products</span>
          <div className="sm-products-scroll">
            <table className="sm-table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>Sr.#</th>
                  <th style={{ width: 75 }}>Barcode</th>
                  <th>Name</th>
                  <th style={{ width: 90 }}>Measurement</th>
                  <th className="r" style={{ width: 70 }}>
                    Rate
                  </th>
                  <th className="r" style={{ width: 70 }}>
                    Stock
                  </th>
                  <th className="r" style={{ width: 55 }}>
                    Pack
                  </th>
                </tr>
              </thead>
              <tbody
                ref={tbodyRef}
                tabIndex={0}
                onKeyDown={tableKey}
                style={{ outline: "none" }}
              >
                {rows.length === 0 && (
                  <tr>
                    <td className="empty" colSpan={7}>
                      No products found
                    </td>
                  </tr>
                )}
                {rows.map((r, i) => (
                  <tr
                    key={`${r._id}-${r._pi}`}
                    className={
                      i === hiIdx ? "hi" : i % 2 === 0 ? "even" : "odd"
                    }
                    onClick={() => setHiIdx(i)}
                    onDoubleClick={() => onSelect(r)}
                  >
                    <td style={{ textAlign: "center" }}>{i + 1}</td>
                    <td style={{ fontWeight: "bold" }}>{r.code}</td>
                    <td>{r._name}</td>
                    <td>{r._meas}</td>
                    <td className="r">{r._rate}</td>
                    <td className="r">{r._stock}</td>
                    <td className="r">{r._pack}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="sm-footer">
          ↑↓ navigate | Enter / Double-click = select | Esc = close | Tab =
          filters
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PRINT PREVIEW MODAL
// ═══════════════════════════════════════════════════════════════════════════
function PrintModal({ quote, onClose }) {
  const {
    custName,
    custPhone,
    qtNo,
    qtDate,
    validTill,
    rows,
    extraDisc,
    remarks,
  } = quote;
  const subTotal = rows.reduce((s, r) => s + (r.amount || 0), 0);
  const discAmt = Math.round((subTotal * (extraDisc || 0)) / 100);
  const netTotal = subTotal - discAmt;

  const doPrint = () => {
    const itemRows = rows
      .map(
        (it, i) =>
          `<tr>
        <td style="text-align:center">${i + 1}</td>
        <td>${it.description}</td>
        <td>${it.measurement || ""}</td>
        <td style="text-align:right">${it.qty}</td>
        <td style="text-align:right">${Number(it.rate).toLocaleString()}</td>
        <td style="text-align:right">${it.disc || 0}%</td>
        <td style="text-align:right"><b>${Number(it.amount).toLocaleString()}</b></td>
      </tr>`,
      )
      .join("");

    const win = window.open("", "_blank", "width=900,height=700");
    win.document.write(`<!DOCTYPE html><html><head>
    <title>Quotation ${qtNo}</title>
    <style>
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:Arial,sans-serif;font-size:12px;padding:20px;color:#222}
      h2{text-align:center;font-size:20px;margin-bottom:2px}
      h3{text-align:center;font-size:13px;color:#555;margin-bottom:12px;letter-spacing:2px}
      .meta{display:flex;justify-content:space-between;flex-wrap:wrap;gap:6px;border:1px solid #ccc;padding:7px 12px;border-radius:3px;margin-bottom:12px;background:#f8f8f8}
      .meta-block{display:flex;flex-direction:column;gap:2px}
      .meta span{font-size:12px}
      table{width:100%;border-collapse:collapse;margin-bottom:14px}
      th{background:#2c5d9e;color:#fff;border:1px solid #1a3d6e;padding:5px 7px;text-align:left;font-size:12px}
      td{border:1px solid #ccc;padding:4px 7px}
      tr:nth-child(even) td{background:#f5f5ff}
      .tots{float:right;min-width:220px;border:1px solid #ccc;padding:8px 12px;background:#f8f8f8;border-radius:3px}
      .tr{display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid #eee;font-size:12px}
      .tr.b{font-weight:bold;font-size:14px;border-top:2px solid #333;margin-top:4px;padding-top:4px;border-bottom:none}
      .tr.disc{color:#c00}
      .validity{display:inline-block;margin-top:8px;padding:4px 12px;background:#fff8e0;border:1px solid #d4a010;border-radius:3px;font-size:11px;color:#5a3a00}
      .remarks{margin-top:8px;font-size:11px;color:#666;font-style:italic}
      .footer{text-align:center;margin-top:30px;color:#888;font-size:11px;clear:both;border-top:1px solid #ddd;padding-top:10px}
      @media print{body{padding:5mm}}
    </style></head><body>
    <h2>${SHOP_NAME}</h2>
    <h3>PRICE QUOTATION</h3>
    <div class="meta">
      <div class="meta-block">
        <span><b>Quotation #:</b> ${qtNo}</span>
        <span><b>Date:</b> ${qtDate}</span>
        <span><b>Valid Till:</b> ${validTill || "—"}</span>
      </div>
      <div class="meta-block">
        ${custName ? `<span><b>Customer:</b> ${custName}</span>` : ""}
        ${custPhone ? `<span><b>Phone:</b> ${custPhone}</span>` : ""}
      </div>
    </div>
    <table>
      <thead>
        <tr>
          <th style="width:30px">#</th>
          <th>Description</th>
          <th style="width:90px">Meas.</th>
          <th style="width:50px;text-align:right">Qty</th>
          <th style="width:80px;text-align:right">Rate</th>
          <th style="width:55px;text-align:right">Disc%</th>
          <th style="width:90px;text-align:right">Amount</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>
    <div class="tots">
      <div class="tr"><span>Sub Total</span><span>${Number(subTotal).toLocaleString()}</span></div>
      ${discAmt > 0 ? `<div class="tr disc"><span>Discount (${extraDisc}%)</span><span>-${Number(discAmt).toLocaleString()}</span></div>` : ""}
      <div class="tr b"><span>Net Total</span><span>Rs. ${Number(netTotal).toLocaleString()}</span></div>
    </div>
    ${validTill ? `<div style="clear:both;padding-top:4px"><span class="validity">⏳ This quotation is valid till: <b>${validTill}</b></span></div>` : ""}
    ${remarks ? `<div class="remarks">📝 Note: ${remarks}</div>` : ""}
    <div class="footer">
      Prices are subject to change without notice.<br>
      Thank you for your interest — ${SHOP_NAME}
    </div>
    </body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 400);
  };

  const doWhatsApp = () => {
    const lines = rows
      .map(
        (it, i) =>
          `${i + 1}. ${it.description}${it.measurement ? " (" + it.measurement + ")" : ""}\n   Qty: ${it.qty} × Rs.${Number(it.rate).toLocaleString()}${it.disc > 0 ? " - " + it.disc + "%" : ""} = *Rs.${Number(it.amount).toLocaleString()}*`,
      )
      .join("\n");

    const subT = rows.reduce((s, r) => s + (r.amount || 0), 0);
    const discA = Math.round((subT * (extraDisc || 0)) / 100);
    const netT = subT - discA;

    const msg =
      `*${SHOP_NAME}*\n` +
      `📋 *QUOTATION #${qtNo}*\n` +
      `📅 Date: ${qtDate}${validTill ? " | Valid Till: " + validTill : ""}\n` +
      (custName ? `👤 Customer: ${custName}\n` : "") +
      (custPhone ? `📞 Phone: ${custPhone}\n` : "") +
      `${"─".repeat(30)}\n` +
      `${lines}\n` +
      `${"─".repeat(30)}\n` +
      (discA > 0
        ? `Sub Total: Rs.${Number(subT).toLocaleString()}\nDiscount (${extraDisc}%): -Rs.${Number(discA).toLocaleString()}\n`
        : "") +
      `*Net Total: Rs.${Number(netT).toLocaleString()}*\n` +
      (remarks ? `📝 ${remarks}\n` : "") +
      `_Prices valid${validTill ? " till " + validTill : " as quoted"}_`;

    const phone = custPhone?.replace(/[^0-9]/g, "");
    const url = phone
      ? `https://wa.me/92${phone.replace(/^0/, "")}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  };

  return (
    <div
      className="sm-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="sm-window" style={{ maxWidth: 720 }}>
        <div className="sm-titlebar">
          <span>
            📋 Quotation #{qtNo}
            {custName ? " — " + custName : ""}
          </span>
          <button className="sm-close-btn" onClick={onClose} tabIndex={-1}>
            ✕
          </button>
        </div>

        {/* Preview */}
        <div
          style={{ padding: "12px 14px", overflowY: "auto", maxHeight: "55vh" }}
        >
          {/* Header info */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 10,
              fontSize: 12,
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <span>
                <b>Quotation #:</b> {qtNo}
              </span>
              <span>
                <b>Date:</b> {qtDate}
              </span>
              {validTill && (
                <span>
                  <b>Valid Till:</b> {validTill}
                </span>
              )}
            </div>
            {(custName || custPhone) && (
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {custName && (
                  <span>
                    <b>Customer:</b> {custName}
                  </span>
                )}
                {custPhone && (
                  <span>
                    <b>Phone:</b> {custPhone}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Items table */}
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginBottom: 10,
            }}
          >
            <thead>
              <tr style={{ background: "#2c5d9e", color: "#fff" }}>
                <th
                  style={{
                    padding: "4px 6px",
                    textAlign: "center",
                    fontSize: 11,
                    width: 28,
                  }}
                >
                  #
                </th>
                <th style={{ padding: "4px 6px", fontSize: 11 }}>
                  Description
                </th>
                <th style={{ padding: "4px 6px", fontSize: 11, width: 80 }}>
                  Meas.
                </th>
                <th
                  style={{
                    padding: "4px 6px",
                    fontSize: 11,
                    width: 45,
                    textAlign: "right",
                  }}
                >
                  Qty
                </th>
                <th
                  style={{
                    padding: "4px 6px",
                    fontSize: 11,
                    width: 75,
                    textAlign: "right",
                  }}
                >
                  Rate
                </th>
                <th
                  style={{
                    padding: "4px 6px",
                    fontSize: 11,
                    width: 50,
                    textAlign: "right",
                  }}
                >
                  Disc%
                </th>
                <th
                  style={{
                    padding: "4px 6px",
                    fontSize: 11,
                    width: 85,
                    textAlign: "right",
                  }}
                >
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((it, i) => (
                <tr
                  key={i}
                  style={{ background: i % 2 === 0 ? "#f5f5ff" : "#fff" }}
                >
                  <td
                    style={{
                      border: "1px solid #ccc",
                      padding: "3px 6px",
                      textAlign: "center",
                    }}
                  >
                    {i + 1}
                  </td>
                  <td style={{ border: "1px solid #ccc", padding: "3px 6px" }}>
                    {it.description}
                  </td>
                  <td style={{ border: "1px solid #ccc", padding: "3px 6px" }}>
                    {it.measurement}
                  </td>
                  <td
                    style={{
                      border: "1px solid #ccc",
                      padding: "3px 6px",
                      textAlign: "right",
                    }}
                  >
                    {it.qty}
                  </td>
                  <td
                    style={{
                      border: "1px solid #ccc",
                      padding: "3px 6px",
                      textAlign: "right",
                    }}
                  >
                    {fmt(it.rate)}
                  </td>
                  <td
                    style={{
                      border: "1px solid #ccc",
                      padding: "3px 6px",
                      textAlign: "right",
                    }}
                  >
                    {it.disc || 0}%
                  </td>
                  <td
                    style={{
                      border: "1px solid #ccc",
                      padding: "3px 6px",
                      textAlign: "right",
                      fontWeight: "bold",
                    }}
                  >
                    {fmt(it.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div
            style={{
              float: "right",
              minWidth: 200,
              border: "1px solid #ccc",
              padding: "8px 12px",
              background: "#f8f8f8",
              borderRadius: 3,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "2px 0",
                fontSize: 12,
              }}
            >
              <span>Sub Total</span>
              <span>{fmt(subTotal)}</span>
            </div>
            {discAmt > 0 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "2px 0",
                  fontSize: 12,
                  color: "#c00",
                }}
              >
                <span>Discount ({extraDisc}%)</span>
                <span>-{fmt(discAmt)}</span>
              </div>
            )}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "4px 0",
                fontSize: 15,
                fontWeight: "bold",
                borderTop: "2px solid #333",
                marginTop: 4,
              }}
            >
              <span>Net Total</span>
              <span>Rs. {fmt(netTotal)}</span>
            </div>
          </div>
          <div style={{ clear: "both" }}></div>

          {validTill && (
            <div
              style={{
                marginTop: 8,
                display: "inline-block",
                padding: "3px 10px",
                background: "#fff8e0",
                border: "1px solid #d4a010",
                borderRadius: 3,
                fontSize: 11,
                color: "#5a3a00",
              }}
            >
              ⏳ Valid till: <b>{validTill}</b>
            </div>
          )}
          {remarks && (
            <div
              style={{
                marginTop: 6,
                fontSize: 11,
                color: "#666",
                fontStyle: "italic",
              }}
            >
              📝 {remarks}
            </div>
          )}
        </div>

        {/* Actions */}
        <div
          style={{
            display: "flex",
            gap: 8,
            padding: "8px 14px",
            borderTop: "1px solid #ccc",
            background: "#f0ede0",
          }}
        >
          <button className="qt-btn qt-btn-print" onClick={doPrint}>
            🖨 Print / PDF
          </button>
          <button className="qt-btn qt-btn-wa" onClick={doWhatsApp}>
            📱 WhatsApp{custPhone ? " → " + custPhone : ""}
          </button>
          <button
            className="qt-btn"
            onClick={onClose}
            style={{ marginLeft: "auto" }}
          >
            ✕ Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════
export default function QuotationPage() {
  // Quotation number counter (localStorage for offline persistence)
  const getNextQtNo = () => {
    const n = parseInt(localStorage.getItem("qt_counter") || "0") + 1;
    localStorage.setItem("qt_counter", String(n));
    return `Q-${String(n).padStart(5, "0")}`;
  };

  const [qtNo, setQtNo] = useState(() => {
    const n = parseInt(localStorage.getItem("qt_counter") || "0") + 1;
    return `Q-${String(n).padStart(5, "0")}`;
  });
  const [qtDate, setQtDate] = useState(isoDate());
  const [validTill, setValidTill] = useState(() => addDays(isoDate(), 7));
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [rows, setRows] = useState([{ ...EMPTY_ROW }]);
  const [activeRow, setActiveRow] = useState(0);
  const [extraDisc, setExtraDisc] = useState(0);
  const [remarks, setRemarks] = useState("");
  const [products, setProducts] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [showPrint, setShowPrint] = useState(false);
  const [msg, setMsg] = useState({ text: "", type: "" });

  const custNameRef = useRef(null);
  const custPhRef = useRef(null);
  const searchRef = useRef(null);
  const extraDiscRef = useRef(null);
  const rowRefs = useRef([]);

  // Derived
  const subTotal = rows.reduce((s, r) => s + (r.amount || 0), 0);
  const discAmt = Math.round((subTotal * (extraDisc || 0)) / 100);
  const netTotal = subTotal - discAmt;

  useEffect(() => {
    fetchProducts();
  }, []);
  useEffect(() => {
    const h = (e) => {
      if (e.key === "F3") {
        e.preventDefault();
        setShowSearch(true);
      }
      if (e.key === "F5") {
        e.preventDefault();
        handlePreview();
      }
      if (e.key === "F2") {
        e.preventDefault();
        resetForm();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [rows, custName, custPhone, extraDisc, remarks, qtDate, validTill]);

  const fetchProducts = async () => {
    try {
      const { data } = await api.get(EP.PRODUCTS.GET_ALL);
      if (data.success) setProducts(data.data);
    } catch {}
  };

  const showMsg = (text, type = "success") => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: "", type: "" }), 3000);
  };

  // Product selected
  const handleProductSelect = (product) => {
    const qty = rows[activeRow]?.qty || 1;
    const rate = product._rate || 0;
    setRows((prev) => {
      const next = [...prev];
      next[activeRow] = {
        ...next[activeRow],
        code: product.code || "",
        description: product._name || product.description || "",
        measurement: product._meas || "",
        qty,
        rate,
        disc: next[activeRow]?.disc || 0,
        amount: qty * rate,
      };
      return next;
    });
    setSearchText(product._name || product.description || "");
    setShowSearch(false);
    setTimeout(() => rowRefs.current[activeRow]?.qty?.focus(), 30);
  };

  // Row management
  const updateRow = (i, field, val) => {
    setRows((prev) => {
      const next = [...prev];
      const r = { ...next[i], [field]: val };
      if (["qty", "rate", "disc"].includes(field)) {
        const q = field === "qty" ? Number(val) : Number(r.qty);
        const rt = field === "rate" ? Number(val) : Number(r.rate);
        const d = field === "disc" ? Number(val) : Number(r.disc);
        r.amount = Math.round(q * rt * (1 - d / 100));
      }
      next[i] = r;
      return next;
    });
  };

  const addRowAfter = (i) => {
    setRows((p) => {
      const n = [...p];
      n.splice(i + 1, 0, { ...EMPTY_ROW });
      return n;
    });
    setActiveRow(i + 1);
    setSearchText("");
    setTimeout(() => setShowSearch(true), 30);
  };

  const deleteRow = (i) => {
    if (rows.length === 1) {
      setRows([{ ...EMPTY_ROW }]);
      return;
    }
    setRows((p) => p.filter((_, idx) => idx !== i));
    setActiveRow(Math.max(0, i - 1));
  };

  const onRowKeyDown = (e, i, field) => {
    if (e.key === "F3") {
      e.preventDefault();
      setActiveRow(i);
      setShowSearch(true);
      return;
    }
    if (e.key === "Delete" && e.ctrlKey) {
      e.preventDefault();
      deleteRow(i);
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const order = [
        "code",
        "description",
        "measurement",
        "qty",
        "rate",
        "disc",
      ];
      const fi = order.indexOf(field);
      if (fi < order.length - 1) rowRefs.current[i]?.[order[fi + 1]]?.focus();
      else if (i === rows.length - 1) addRowAfter(i);
      else rowRefs.current[i + 1]?.code?.focus();
    }
  };

  const onCodeBlur = (i, code) => {
    if (!code.trim()) return;
    const found = products.find(
      (p) => p.code?.toLowerCase() === code.toLowerCase(),
    );
    if (found) {
      const pk = found.packingInfo?.[0] || {};
      const desc = [found.category, found.description, found.company]
        .filter(Boolean)
        .join(" ");
      setRows((prev) => {
        const next = [...prev];
        next[i] = {
          ...next[i],
          description: desc,
          measurement: pk.measurement || "",
          rate: pk.saleRate || 0,
          amount: (next[i].qty || 1) * (pk.saleRate || 0),
        };
        return next;
      });
      setTimeout(() => rowRefs.current[i]?.qty?.focus(), 20);
    }
  };

  // Preview / Print
  const handlePreview = () => {
    const validRows = rows.filter((r) => r.description && r.qty > 0);
    if (!validRows.length) {
      showMsg("Add at least one product", "error");
      return;
    }
    setShowPrint(true);
  };

  const resetForm = () => {
    const newNo = getNextQtNo();
    setQtNo(newNo);
    setQtDate(isoDate());
    setValidTill(addDays(isoDate(), 7));
    setCustName("");
    setCustPhone("");
    setRows([{ ...EMPTY_ROW }]);
    setActiveRow(0);
    setExtraDisc(0);
    setRemarks("");
    setSearchText("");
    setTimeout(() => custNameRef.current?.focus(), 30);
  };

  // Quote object for PrintModal
  const quoteObj = {
    qtNo,
    qtDate,
    validTill,
    custName,
    custPhone,
    rows: rows.filter((r) => r.description && r.qty > 0),
    extraDisc,
    remarks,
  };

  return (
    <div className="qt-page">
      {showSearch && (
        <SearchModal
          allProducts={products}
          onSelect={handleProductSelect}
          onClose={() => setShowSearch(false)}
        />
      )}
      {showPrint && (
        <PrintModal quote={quoteObj} onClose={() => setShowPrint(false)} />
      )}

      {/* Shortcuts bar */}
      <div className="qt-shortcuts">
        F2=New | F3=Search Product | F5=Preview &amp; Print | Enter=Next field |
        Ctrl+Del=Remove row
      </div>
      {msg.text && <div className={`qt-msg ${msg.type}`}>{msg.text}</div>}

      {/* Header */}
      <div className="qt-header-bar">
        <div className="qt-header-title">📋 Quotation / Price Estimate</div>
        <div className="qt-header-fields">
          <div className="qt-hf">
            <span>Qt #</span>
            <input
              className="qt-hinput bold"
              value={qtNo}
              readOnly
              tabIndex={-1}
            />
          </div>
          <div className="qt-hf">
            <span>Date</span>
            <input
              type="date"
              className="qt-hinput"
              value={qtDate}
              onChange={(e) => setQtDate(e.target.value)}
              tabIndex={-1}
            />
          </div>
          <div className="qt-hf">
            <span>Valid Till</span>
            <input
              type="date"
              className="qt-hinput"
              value={validTill}
              onChange={(e) => setValidTill(e.target.value)}
              tabIndex={-1}
            />
          </div>
        </div>
      </div>

      {/* Customer bar — optional */}
      <div className="qt-cust-bar">
        <span className="qt-cust-label">👤 Customer</span>
        <input
          ref={custNameRef}
          className="qt-cust-name-input"
          value={custName}
          onChange={(e) => setCustName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") custPhRef.current?.focus();
          }}
          placeholder="Name (optional)…"
          tabIndex={1}
        />
        <span className="qt-cust-label" style={{ marginLeft: 6 }}>
          📞 Phone
        </span>
        <input
          ref={custPhRef}
          className="qt-cust-phone-input"
          value={custPhone}
          onChange={(e) => setCustPhone(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") setShowSearch(true);
          }}
          placeholder="03xx-xxxxxxx"
          tabIndex={2}
        />
        <span className="qt-cust-note">
          ← optional, for WhatsApp direct send
        </span>
      </div>

      {/* Product search bar */}
      <div className="qt-search-bar">
        <span className="qt-search-label">🔍 Select Product</span>
        <input
          ref={searchRef}
          type="text"
          className={`qt-search-input${searchText ? " filled" : ""}`}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onClick={() => setShowSearch(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === "ArrowDown") {
              e.preventDefault();
              setShowSearch(true);
            }
          }}
          placeholder="Click or press F3 / Enter to search products…"
          readOnly={!!searchText}
          tabIndex={3}
        />
        {searchText && (
          <button
            className="qt-btn"
            onClick={() => setSearchText("")}
            tabIndex={-1}
          >
            ✕ Clear
          </button>
        )}
      </div>

      {/* Items table */}
      <div className="qt-table-wrap">
        <table className="qt-table">
          <thead>
            <tr>
              <th style={{ width: 30 }}>#</th>
              <th style={{ width: 78 }}>Code</th>
              <th>Description</th>
              <th style={{ width: 80 }}>Meas.</th>
              <th style={{ width: 62 }}>Qty</th>
              <th style={{ width: 85 }}>Rate</th>
              <th style={{ width: 58 }}>Disc%</th>
              <th style={{ width: 90 }}>Amount</th>
              <th style={{ width: 26 }}></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              if (!rowRefs.current[i]) rowRefs.current[i] = {};
              return (
                <tr
                  key={i}
                  className={
                    i === activeRow
                      ? "qt-row-active"
                      : i % 2 === 0
                        ? "qt-row-even"
                        : "qt-row-odd"
                  }
                  onClick={() => setActiveRow(i)}
                >
                  <td className="c" style={{ padding: "0 4px", fontSize: 11 }}>
                    {i + 1}
                  </td>
                  <td>
                    <input
                      className="qt-cell full"
                      ref={(el) => {
                        if (rowRefs.current[i]) rowRefs.current[i].code = el;
                      }}
                      value={row.code}
                      onChange={(e) => updateRow(i, "code", e.target.value)}
                      onBlur={(e) => onCodeBlur(i, e.target.value)}
                      onKeyDown={(e) => onRowKeyDown(e, i, "code")}
                      tabIndex={100 + i * 10 + 1}
                    />
                  </td>
                  <td>
                    <input
                      className="qt-cell full"
                      ref={(el) => {
                        if (rowRefs.current[i])
                          rowRefs.current[i].description = el;
                      }}
                      value={row.description}
                      onChange={(e) =>
                        updateRow(i, "description", e.target.value)
                      }
                      onKeyDown={(e) => {
                        if (e.key === "F3") {
                          e.preventDefault();
                          setActiveRow(i);
                          setShowSearch(true);
                        } else onRowKeyDown(e, i, "description");
                      }}
                      tabIndex={100 + i * 10 + 2}
                    />
                  </td>
                  <td>
                    <input
                      className="qt-cell"
                      ref={(el) => {
                        if (rowRefs.current[i])
                          rowRefs.current[i].measurement = el;
                      }}
                      value={row.measurement}
                      onChange={(e) =>
                        updateRow(i, "measurement", e.target.value)
                      }
                      onKeyDown={(e) => onRowKeyDown(e, i, "measurement")}
                      tabIndex={100 + i * 10 + 3}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className="qt-cell r"
                      ref={(el) => {
                        if (rowRefs.current[i]) rowRefs.current[i].qty = el;
                      }}
                      value={row.qty}
                      onChange={(e) => updateRow(i, "qty", e.target.value)}
                      onKeyDown={(e) => onRowKeyDown(e, i, "qty")}
                      tabIndex={100 + i * 10 + 4}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className="qt-cell r"
                      ref={(el) => {
                        if (rowRefs.current[i]) rowRefs.current[i].rate = el;
                      }}
                      value={row.rate}
                      onChange={(e) => updateRow(i, "rate", e.target.value)}
                      onKeyDown={(e) => onRowKeyDown(e, i, "rate")}
                      tabIndex={100 + i * 10 + 5}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className="qt-cell r"
                      ref={(el) => {
                        if (rowRefs.current[i]) rowRefs.current[i].disc = el;
                      }}
                      value={row.disc}
                      onChange={(e) => updateRow(i, "disc", e.target.value)}
                      onKeyDown={(e) => onRowKeyDown(e, i, "disc")}
                      tabIndex={100 + i * 10 + 6}
                    />
                  </td>
                  <td
                    className="r bold"
                    style={{ padding: "0 6px", fontSize: 12 }}
                  >
                    {fmt(row.amount)}
                  </td>
                  <td className="c" style={{ padding: "0 2px" }}>
                    <button
                      className="qt-del-row"
                      onClick={() => deleteRow(i)}
                      tabIndex={-1}
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="qt-footer">
        <div className="qt-footer-left">
          <div className="qt-remarks-row">
            <span>📝 Notes</span>
            <input
              className="qt-remarks-input"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") extraDiscRef.current?.focus();
              }}
              placeholder="e.g. Prices valid for 7 days, bulk discount available…"
              tabIndex={90}
            />
          </div>
          <div className="qt-footer-btns">
            <button
              className="qt-btn"
              onClick={() => setShowSearch(true)}
              tabIndex={-1}
            >
              🔍 F3 Add Product
            </button>
            <button
              className="qt-btn qt-btn-new"
              onClick={resetForm}
              tabIndex={-1}
            >
              🔄 F2 New
            </button>
            <button
              className="qt-btn qt-btn-print"
              onClick={handlePreview}
              tabIndex={91}
            >
              👁 Preview / F5
            </button>
            <button
              className="qt-btn qt-btn-wa"
              onClick={() => {
                if (!rows.some((r) => r.description && r.qty > 0)) {
                  showMsg("Add at least one product", "error");
                  return;
                }
                setShowPrint(true);
              }}
              tabIndex={92}
            >
              📱 WhatsApp
            </button>
          </div>
        </div>

        <div className="qt-totals">
          <div className="qt-tr">
            <span>Sub Total</span>
            <span className="bold">{fmt(subTotal)}</span>
          </div>
          <div className="qt-tr">
            <span>Extra Disc%</span>
            <input
              ref={extraDiscRef}
              type="number"
              className="qt-tot-input"
              value={extraDisc}
              onChange={(e) => setExtraDisc(e.target.value)}
              tabIndex={89}
            />
          </div>
          {discAmt > 0 && (
            <div className="qt-tr">
              <span>Disc Amt</span>
              <span className="red bold">-{fmt(discAmt)}</span>
            </div>
          )}
          <div className="qt-tr bold big">
            <span>Net Total</span>
            <span style={{ color: "#1a3a9a" }}>Rs. {fmt(netTotal)}</span>
          </div>
          <div
            className="qt-tr"
            style={{ fontSize: 11, color: "#888", marginTop: 4 }}
          >
            <span>Items</span>
            <span>{rows.filter((r) => r.description).length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
