// pages/SaleReturnPage.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import api from "../api/api.js";
import EP from "../api/apiEndpoints.js";
import "../styles/theme.css";
import "../styles/SaleReturnPage.css";

/* ── helpers ── */
const timeNow = () =>
  new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
const isoDate = () => new Date().toISOString().split("T")[0];
const fmt = (n) => Number(n || 0).toLocaleString("en-PK");
const HOLD_KEY = "asim_return_hold_v1";

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
  cash: { bg: "#86efac", color: "#14532d", border: "#22c55e" },
  debit: { bg: "#93c5fd", color: "#1e3a8a", border: "#3b82f6" },
  "raw-sale": { bg: "#fde68a", color: "#78350f", border: "#f59e0b" },
  "raw-purchase": { bg: "#d8b4fe", color: "#3b0764", border: "#a855f7" },
};

/* ── localStorage ── */
const loadHolds = () => {
  try {
    return JSON.parse(localStorage.getItem(HOLD_KEY) || "[]");
  } catch {
    return [];
  }
};
const saveHolds = (b) => {
  try {
    localStorage.setItem(HOLD_KEY, JSON.stringify(b));
  } catch {}
};

/* ══════════════════════════════════════════════════════════
   PRINT BUILDER
══════════════════════════════════════════════════════════ */
const buildPrintHtml = (ret, type) => {
  const rows = ret.items.map((it, i) => ({ ...it, sr: i + 1 }));
  const totalQty = rows.reduce((s, r) => s + (r.pcs || 0), 0);

  if (type === "Thermal") {
    const itemRows = rows
      .map(
        (it) =>
          `<tr>
        <td>${it.sr}</td>
        <td style="max-width:92px;word-break:break-word">${it.name}${it.uom ? ` (${it.uom})` : ""}</td>
        <td class="r">${it.pcs}</td>
        <td class="r">${Number(it.rate).toLocaleString()}</td>
        <td class="r"><b>${Number(it.amount).toLocaleString()}</b></td>
      </tr>`,
      )
      .join("");
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
      *{box-sizing:border-box}
      body{font-family:'Courier New',Courier,monospace;font-size:10.5px;width:78mm;margin:0 auto;padding:3mm;color:#111}
      .sn{text-align:center;font-size:15px;font-weight:bold;margin-bottom:1px}
      .ss{text-align:center;font-size:9px;color:#555;margin-bottom:1px}
      .badge{display:block;text-align:center;font-size:9px;border:2px solid #c00;padding:1px 0;margin:3px 0;letter-spacing:2px;font-weight:bold;color:#c00}
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
      <div class="ss">${SHOP_INFO.address} | Ph: ${SHOP_INFO.phone}</div>
      <span class="badge">SALE RETURN</span>
      <hr class="dash">
      <div class="row" style="font-size:9.5px"><span>Return #: <b>${ret.returnNo}</b></span><span>${ret.returnDate}</span></div>
      ${ret.saleInvNo ? `<div style="font-size:9px;color:#666">Ref Sale: ${ret.saleInvNo}</div>` : ""}
      <div style="font-size:10.5px;font-weight:bold">${ret.customerName}</div>
      <hr class="solid">
      <table>
        <thead><tr><th>#</th><th>Item</th><th class="r">Qty</th><th class="r">Rate</th><th class="r">Amt</th></tr></thead>
        <tbody>${itemRows}</tbody>
      </table>
      <hr class="dash">
      <div class="row b sep"><span>RETURN TOTAL</span><span>PKR ${Number(ret.netTotal).toLocaleString()}</span></div>
      <div class="row green"><span>Refunded</span><span>PKR ${Number(ret.paidAmount).toLocaleString()}</span></div>
      <div class="foot">Items: ${rows.length} | Qty: ${totalQty}<br>Thank you — ${SHOP_INFO.name}</div>
    </body></html>`;
  }

  const a5 = type === "A5";
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

  const itemRows = rows
    .map(
      (it, i) =>
        `<tr style="background:${i % 2 === 0 ? "#fff" : "#fff5f5"}">
      <td>${it.sr}</td><td><strong>${it.name}</strong></td><td>${it.uom || "—"}</td>
      <td align="right">${it.pcs}</td>
      <td align="right">${Number(it.rate).toLocaleString()}</td>
      <td align="right"><strong>${Number(it.amount).toLocaleString()}</strong></td>
    </tr>`,
    )
    .join("");

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Arial,Helvetica,sans-serif;font-size:${sz.td}pt;color:#1a1a2e;background:#fff;padding:${a5 ? "7mm" : "12mm"}}
    .hdr{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #c0392b;padding-bottom:${a5 ? "7px" : "11px"};margin-bottom:${a5 ? "8px" : "12px"}}
    .hn{font-size:${sz.title}pt;font-weight:900;color:#c0392b;letter-spacing:-.5px;line-height:1.1}
    .hs{font-size:${sz.sub}pt;color:#666;margin-top:2px}
    .ir{text-align:right}
    .il{font-size:${sz.inv}pt;font-weight:800;color:#c0392b;letter-spacing:1.5px;text-transform:uppercase}
    .ino{font-size:${sz.inv - 1}pt;font-weight:700;color:#111;margin-top:1px}
    .idate{font-size:${sz.sub}pt;color:#777}
    .info{display:flex;gap:${a5 ? "6px" : "10px"};background:#fff5f5;border:1px solid #fca5a5;border-radius:4px;padding:${a5 ? "5px 10px" : "7px 14px"};margin-bottom:${a5 ? "8px" : "12px"};font-size:${sz.meta}pt}
    .ii{display:flex;flex-direction:column;gap:1px}
    .ilb{font-size:${sz.meta - 1}pt;color:#6b7280;text-transform:uppercase;letter-spacing:.5px}
    .iv{font-weight:600;color:#111}
    table{width:100%;border-collapse:collapse;margin-bottom:${a5 ? "8px" : "14px"}}
    thead tr{background:#c0392b;color:#fff}
    th{padding:${a5 ? "4px 6px" : "6px 9px"};text-align:left;font-size:${sz.th}pt;font-weight:600;white-space:nowrap}
    td{padding:${a5 ? "3px 6px" : "5px 9px"};font-size:${sz.td}pt;border-bottom:1px solid #fde8e8}
    tbody tr:last-child td{border-bottom:2px solid #fca5a5}
    .bwrap{display:flex;justify-content:flex-end}
    .tbox{width:${a5 ? "205px" : "265px"};border:1px solid #fca5a5;border-radius:4px;overflow:hidden}
    .tr{display:flex;justify-content:space-between;padding:${a5 ? "4px 10px" : "5px 14px"};font-size:${sz.tot}pt;border-bottom:1px solid #fde8e8}
    .tr:last-child{border-bottom:none}
    .tr.b{font-weight:700;font-size:${sz.totB}pt;background:#fff5f5}
    .tr.sep{border-top:2px solid #c0392b}
    .red{color:#c0392b}.green{color:#15803d}
    .foot{margin-top:${a5 ? "12px" : "22px"};display:flex;justify-content:space-between;align-items:flex-end;border-top:1px dashed #bbb;padding-top:${a5 ? "8px" : "12px"}}
    .ft{font-size:${sz.sub}pt;color:#888;line-height:1.7}
    .sig{text-align:center;font-size:${sz.sub}pt;color:#555}
    .sl{border-top:1px solid #999;width:${a5 ? "100px" : "130px"};margin:0 auto 2px}
    @media print{@page{size:${a5 ? "A5" : "A4"};margin:${a5 ? "5mm" : "10mm"}}body{padding:0}}
  </style></head><body>
    <div class="hdr">
      <div>
        <div class="hn">${SHOP_INFO.name}</div>
        <div class="hs">📍 ${SHOP_INFO.address}</div>
        <div class="hs">📞 ${SHOP_INFO.phone}</div>
      </div>
      <div class="ir">
        <div class="il">Sale Return</div>
        <div class="ino"># ${ret.returnNo}</div>
        <div class="idate">${ret.returnDate}</div>
      </div>
    </div>
    <div class="info">
      <div class="ii" style="flex:2"><span class="ilb">Customer</span><span class="iv">${ret.customerName}</span></div>
      ${ret.saleInvNo ? `<div class="ii" style="flex:1"><span class="ilb">Ref Invoice</span><span class="iv">${ret.saleInvNo}</span></div>` : ""}
      <div class="ii" style="flex:1;text-align:right"><span class="ilb">Items / Qty</span><span class="iv">${rows.length} / ${totalQty}</span></div>
    </div>
    <table>
      <thead><tr><th width="24">#</th><th>Description</th><th width="46">UOM</th><th width="38" align="right">Qty</th><th width="68" align="right">Rate</th><th width="78" align="right">Amount</th></tr></thead>
      <tbody>${itemRows}</tbody>
    </table>
    <div class="bwrap">
      <div class="tbox">
        <div class="tr"><span>Sub Total</span><span class="red">${Number(ret.subTotal).toLocaleString()}</span></div>
        <div class="tr b red sep"><span>Return Total</span><span>PKR ${Number(ret.netTotal).toLocaleString()}</span></div>
        <div class="tr green"><span>Refunded</span><span>PKR ${Number(ret.paidAmount).toLocaleString()}</span></div>
        <div class="tr b sep ${ret.balance > 0 ? "red" : "green"}"><span>Balance</span><span>PKR ${Number(ret.balance).toLocaleString()}</span></div>
      </div>
    </div>
    <div class="foot">
      <div class="ft">Return processed — ${SHOP_INFO.name}<br>Computer Generated Document</div>
      <div class="sig"><div class="sl"></div>Authorized Signature</div>
    </div>
  </body></html>`;
};

const doPrint = (ret, type) => {
  const w = window.open(
    "",
    "_blank",
    type === "Thermal" ? "width=420,height=640" : "width=900,height=700",
  );
  w.document.write(buildPrintHtml(ret, type));
  w.document.close();
  setTimeout(() => w.print(), 400);
};

/* ══════════════════════════════════════════════════════════
   SAVE CONFIRM MODAL
══════════════════════════════════════════════════════════ */
function SaveConfirmModal({
  returnPayload,
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

  const netTotal = returnPayload.netTotal;
  const paid = Number(paidAmount) || 0;
  const balance = netTotal - paid;

  const handleConfirm = async (withPrint) => {
    if (saving) return;
    setSaving(true);
    await onConfirm({
      paidAmount: paid,
      balance,
      printType: selPrintType,
      withPrint,
    });
    setSaving(false);
  };

  return (
    <div className="scm-overlay">
      <div className="scm-window sr-confirm-window">
        <div className="scm-tb sr-tb">
          <svg
            width="13"
            height="13"
            viewBox="0 0 16 16"
            fill="rgba(255,255,255,0.85)"
          >
            <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z" />
          </svg>
          <span className="scm-tb-title">
            Return Confirm — {returnPayload.returnNo} &nbsp;|&nbsp;{" "}
            {returnPayload.customerName}
          </span>
          <button className="xp-cap-btn xp-cap-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="scm-meta">
          <span>
            <b>Return #:</b> {returnPayload.returnNo}
          </span>
          <span>
            <b>Date:</b> {returnPayload.returnDate}
          </span>
          <span>
            <b>Customer:</b> {returnPayload.customerName}
          </span>
          {returnPayload.saleInvNo && (
            <span>
              <b>Ref Sale:</b> {returnPayload.saleInvNo}
            </span>
          )}
          <span>
            <b>Items:</b> {returnPayload.items.length}
          </span>
        </div>

        <div className="scm-amounts">
          <div className="scm-box sr-box">
            <div className="scm-box-label">Return Total</div>
            <div className="scm-box-val">
              {Number(netTotal).toLocaleString("en-PK")}
            </div>
          </div>
          <div className="scm-box sr-box" style={{ borderLeft: "none" }}>
            <div className="scm-box-label">Refunded</div>
            <input
              ref={paidRef}
              type="number"
              className="scm-recv-input"
              value={paidAmount}
              onChange={(e) => setPaidAmount(e.target.value)}
              onFocus={(e) => e.target.select()}
            />
          </div>
          <div
            className={`scm-box ${balance <= 0 ? "scm-box-change" : "scm-box-due"}`}
            style={{ borderLeft: "none" }}
          >
            <div className="scm-box-label">
              {balance <= 0 ? "Overpaid" : "Remaining"}
            </div>
            <div className="scm-box-val">
              {balance < 0 && (
                <span style={{ fontSize: 22, marginRight: 2 }}>−</span>
              )}
              {Math.abs(balance).toLocaleString("en-PK")}
            </div>
          </div>
        </div>

        <div className="scm-print-row">
          <span style={{ color: "#555", marginRight: 4, fontWeight: 700 }}>
            Print:
          </span>
          {["Thermal", "A5", "A4"].map((pt) => (
            <label
              key={pt}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                cursor: "pointer",
                fontWeight: 700,
                color: "#333",
                fontSize: 11,
              }}
            >
              <input
                type="radio"
                name="sr-pt"
                checked={selPrintType === pt}
                onChange={() => setSelPrintType(pt)}
                style={{ accentColor: "#c0392b" }}
              />
              {pt}
            </label>
          ))}
        </div>

        <div className="scm-sep" />

        <div className="scm-actions">
          <button
            className="xp-btn sr-btn-save-print"
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
            ↩ Return to Form
          </button>
        </div>

        <div className="scm-hint">
          ↵ Enter (in Refunded field) = Save &amp; Print &nbsp;|&nbsp; Esc =
          Return to Form
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
      <div className="xp-modal" style={{ width: 520 }}>
        <div className="xp-modal-tb">
          <span className="xp-modal-title">Hold Return — {bill.returnNo}</span>
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
              <span style={{ color: "var(--xp-red)", fontWeight: 700 }}>
                {Number(bill.amount).toLocaleString("en-PK")}
              </span>
            </span>
          </div>
          <div className="xp-table-panel" style={{ border: "none" }}>
            <div className="xp-table-scroll" style={{ maxHeight: 280 }}>
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
                        style={{ color: "var(--xp-red)", fontWeight: 700 }}
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
            className="xp-btn xp-btn-sm sr-btn-resume"
            onClick={() => onResume(bill.id)}
          >
            Resume This Return
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
      setHiIdx((i) => Math.min(i + 1, filtered.length - 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHiIdx((i) => Math.max(i - 1, 0));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
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
          className="sr-cust-input cdd-input"
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
            maxHeight: 280,
            overflowY: "auto",
            zIndex: 9999,
            background: "#fff",
            border: "1px solid #b0bcd8",
            borderRadius: 4,
            boxShadow: "0 -6px 20px rgba(0,0,0,0.14)",
          }}
        >
          {filtered.length === 0 && (
            <div
              style={{ padding: "10px 12px", color: "#9ca3af", fontSize: 12 }}
            >
              No customers found
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
          <div
            style={{
              padding: "3px 12px",
              fontSize: 11,
              color: "#9ca3af",
              borderTop: "1px solid #f0f0f0",
              background: "#fafafa",
            }}
          >
            Tab / → = accept &nbsp;|&nbsp; ↑↓ = navigate &nbsp;|&nbsp; Enter =
            select &nbsp;|&nbsp; Esc = close
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN PAGE — SALE RETURN
══════════════════════════════════════════════════════════ */
export default function SaleReturnPage() {
  const [time, setTime] = useState(timeNow());
  const [allProducts, setAllProducts] = useState([]);
  const [allCustomers, setAllCustomers] = useState([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showHoldPreview, setShowHoldPreview] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [curRow, setCurRow] = useState({ ...EMPTY_ROW });
  const [items, setItems] = useState([]);
  const [returnDate, setReturnDate] = useState(isoDate());
  const [returnNo, setReturnNo] = useState("RTN-00001");
  const [saleInvNo, setSaleInvNo] = useState("");

  const [customerId, setCustomerId] = useState("");
  const [buyerName, setBuyerName] = useState("COUNTER SALE");
  const [buyerCode, setBuyerCode] = useState("");
  const [customerType, setCustomerType] = useState("");
  const [prevBalance, setPrevBalance] = useState(0);

  const [paid, setPaid] = useState(0);
  const [holdBills, setHoldBills] = useState(() => loadHolds());
  const [editId, setEditId] = useState(null);
  const [selItemIdx, setSelItemIdx] = useState(null);
  const [msg, setMsg] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);
  const [printType, setPrintType] = useState("A5");
  const [sendSms, setSendSms] = useState(false);
  const [packingOptions, setPackingOptions] = useState([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [pendingPayload, setPendingPayload] = useState(null);

  const searchRef = useRef(null);
  const pcsRef = useRef(null);
  const rateRef = useRef(null);
  const addRef = useRef(null);
  const saveRef = useRef(null);
  const saleInvRef = useRef(null);

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
  const balance = subTotal - (parseFloat(paid) || 0);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pRes, cRes, rtnRes] = await Promise.all([
        api.get(EP.PRODUCTS.GET_ALL),
        api.get(EP.CUSTOMERS.GET_ALL),
        api.get(EP.SALES.NEXT_RETURN_NO || EP.SALES.NEXT_INVOICE),
      ]);
      if (pRes.data.success) setAllProducts(pRes.data.data);
      if (cRes.data.success) setAllCustomers(cRes.data.data);
      if (rtnRes.data.success) {
        const no =
          rtnRes.data.data.returnNo ||
          rtnRes.data.data.invoiceNo ||
          "RTN-00001";
        setReturnNo(no.replace("INV", "RTN"));
      }
    } catch {
      showMsg("Failed to load data", "error");
    }
    setLoading(false);
  };

  const refreshReturnNo = async () => {
    try {
      const r = await api.get(EP.SALES.NEXT_RETURN_NO || EP.SALES.NEXT_INVOICE);
      if (r.data.success) {
        const no = r.data.data.returnNo || r.data.data.invoiceNo || "RTN-00001";
        setReturnNo(no.replace("INV", "RTN"));
      }
    } catch {}
  };

  /* Load sale by invoice number */
  const loadSaleByInv = async () => {
    if (!saleInvNo.trim()) return;
    try {
      const r = await api.get(
        `${EP.SALES.GET_BY_INV || EP.SALES.GET_ALL}?invoiceNo=${saleInvNo.trim()}`,
      );
      if (r.data.success && r.data.data) {
        const sale = Array.isArray(r.data.data) ? r.data.data[0] : r.data.data;
        if (!sale) {
          showMsg("Invoice not found", "error");
          return;
        }
        if (sale.customerId) {
          setCustomerId(sale.customerId._id || sale.customerId);
          setBuyerName(sale.customerName || "COUNTER SALE");
          setPrevBalance(sale.prevBalance || 0);
        }
        const loadedItems = (sale.items || []).map((it) => ({
          productId: it.productId || it._id || "",
          code: it.code || "",
          name: it.description || it.name || "",
          uom: it.measurement || it.uom || "",
          rack: it.rack || "",
          pcs: it.qty || it.pcs || 1,
          rate: it.rate || 0,
          amount: it.amount || 0,
        }));
        setItems(loadedItems);
        showMsg(
          `Loaded ${loadedItems.length} items from ${saleInvNo}`,
          "success",
        );
        setTimeout(() => searchRef.current?.focus(), 50);
      } else {
        showMsg("Invoice not found", "error");
      }
    } catch {
      showMsg("Could not load sale invoice", "error");
    }
  };

  const showMsg = (text, type = "success") => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: "", type: "" }), 3500);
  };

  const handleCustomerSelect = (c) => {
    setCustomerId(c._id);
    setBuyerName(c.name);
    setBuyerCode(c.code || "");
    setCustomerType(c.customerType || c.type || "");
    setPrevBalance(c.currentBalance || 0);
    setTimeout(() => searchRef.current?.focus(), 30);
  };

  const handleCustomerClear = () => {
    setCustomerId("");
    setBuyerName("COUNTER SALE");
    setBuyerCode("");
    setCustomerType("");
    setPrevBalance(0);
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
    setSearchText(product._name || product.description || "");
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
        returnNo,
        amount: subTotal,
        items: [...items],
        customerId,
        buyerName,
        buyerCode,
        customerType,
        prevBalance,
        saleInvNo,
      },
    ]);
    fullReset();
    refreshReturnNo();
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
    setSaleInvNo(bill.saleInvNo || "");
    setHoldBills((p) => p.filter((b) => b.id !== holdId));
    setShowHoldPreview(null);
    resetCurRow();
  };

  const deleteHold = (holdId, e) => {
    e.stopPropagation();
    if (window.confirm("Delete this held return?"))
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
    setPaid(0);
    setSaleInvNo("");
    setEditId(null);
    setSelItemIdx(null);
    setMsg({ text: "", type: "" });
    setTimeout(() => searchRef.current?.focus(), 50);
  };

  const openReturnConfirm = () => {
    if (!items.length) {
      alert("Add at least one item");
      return;
    }
    const payload = {
      returnNo,
      returnDate,
      saleInvNo: saleInvNo || "",
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
      netTotal: subTotal,
      prevBalance: parseFloat(prevBalance) || 0,
      paidAmount: parseFloat(paid) || 0,
      balance,
      sendSms,
      printType,
      remarks: "",
      saleType: "return",
    };
    setPendingPayload(payload);
    setShowSaveModal(true);
  };

  const confirmSave = async (overrides) => {
    if (!pendingPayload) return;
    setLoading(true);
    try {
      const finalPayload = {
        ...pendingPayload,
        paidAmount: overrides.paidAmount,
        balance: overrides.balance,
        printType: overrides.printType,
      };
      console.log("POST to:", EP.SALES.RETURN_CREATE || EP.SALES.CREATE);
      console.log("Payload:", JSON.stringify(finalPayload, null, 2));
      const { data } = editId
        ? await api.put(EP.SALES.UPDATE(editId), finalPayload)
        : await api.post(
            EP.SALES.RETURN_CREATE || EP.SALES.CREATE,
            finalPayload,
          );

      if (data.success) {
        showMsg(
          editId
            ? "Return updated!"
            : `Saved: ${data.data.returnNo || data.data.invoiceNo}`,
        );
        const retObj = {
          returnNo: data.data.returnNo || data.data.invoiceNo || returnNo,
          returnDate: finalPayload.returnDate,
          saleInvNo: finalPayload.saleInvNo,
          customerName: finalPayload.customerName,
          items: pendingPayload.items,
          subTotal: finalPayload.subTotal,
          netTotal: finalPayload.netTotal,
          paidAmount: overrides.paidAmount,
          balance: overrides.balance,
        };
        if (overrides.withPrint) doPrint(retObj, overrides.printType);
        setShowSaveModal(false);
        setPendingPayload(null);
        fullReset();
        await refreshReturnNo();
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
  }, [items, showProductModal, showHoldPreview, showSaveModal]);

  const EMPTY_ROWS = Math.max(0, 8 - items.length);

  return (
    <div className="sr-page">
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
          returnPayload={pendingPayload}
          printType={printType}
          onConfirm={confirmSave}
          onClose={() => {
            setShowSaveModal(false);
            setPendingPayload(null);
          }}
        />
      )}

      {/* TITLEBAR */}
      <div className="xp-titlebar sr-titlebar">
        <svg
          width="15"
          height="15"
          viewBox="0 0 16 16"
          fill="rgba(255,255,255,0.85)"
        >
          <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z" />
        </svg>
        <span className="xp-tb-title">
          Sale Return — Asim Electric &amp; Electronic Store
        </span>
        <div className="xp-tb-actions">
          {editId && <div className="sr-edit-badge">✏ Editing Return</div>}
          <div className="xp-tb-divider" />
          <div className="sl-shortcut-hints">
            <span>F2 Product</span>
            <span>F4 Hold</span>
            <span>F10 Save</span>
          </div>
          <div className="xp-tb-divider" />
          <button className="xp-cap-btn">─</button>
          <button className="xp-cap-btn">□</button>
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

      <div className="sr-body">
        <div className="sr-left">
          {/* Top bar */}
          <div className="sr-top-bar">
            <div className="sr-title-box">Sale Return</div>
            <div className="sr-inv-field-grp">
              <label>Sale Inv. #</label>
              <div style={{ display: "flex", gap: 4 }}>
                <input
                  ref={saleInvRef}
                  className="xp-input xp-input-sm sr-inv-input"
                  value={saleInvNo}
                  onChange={(e) => setSaleInvNo(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && loadSaleByInv()}
                  placeholder="e.g. INV-00123"
                  title="Enter original sale invoice number and press Enter to load items"
                />
                <button
                  className="xp-btn xp-btn-sm sr-load-btn"
                  onClick={loadSaleByInv}
                  title="Load sale items"
                >
                  Load
                </button>
              </div>
            </div>
            <div className="sr-inv-field-grp">
              <label>Invoice #</label>
              <input
                className="xp-input xp-input-sm sr-inv-input"
                value={editId ? "EDIT MODE" : returnNo}
                readOnly
              />
            </div>
            <div className="sr-inv-field-grp">
              <label>Date</label>
              <input
                type="date"
                className="xp-input xp-input-sm sr-date-input"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
              />
            </div>
            <div className="sr-inv-field-grp">
              <label>Time</label>
              <div className="sr-time-box">{time}</div>
            </div>
          </div>

          {/* Entry strip */}
          <div className="sr-entry-strip">
            <div className="sr-entry-cell sr-entry-product">
              <label>
                Select Product <kbd>F2</kbd>
              </label>
              <input
                ref={searchRef}
                type="text"
                className="sr-product-input"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onClick={() => setShowProductModal(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === "ArrowDown") {
                    e.preventDefault();
                    setShowProductModal(true);
                  }
                }}
                placeholder="Enter / F2 to search…"
                readOnly={!!curRow.name}
                autoFocus
              />
            </div>
            <div className="sr-entry-cell">
              <label>Packing</label>
              {packingOptions.length > 0 ? (
                <select
                  className="sr-uom-select"
                  value={curRow.uom}
                  onChange={(e) =>
                    setCurRow((p) => ({ ...p, uom: e.target.value }))
                  }
                >
                  {packingOptions.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  className="xp-input xp-input-sm"
                  style={{ width: 65 }}
                  value={curRow.uom}
                  onChange={(e) =>
                    setCurRow((p) => ({ ...p, uom: e.target.value }))
                  }
                  onKeyDown={(e) =>
                    e.key === "Enter" && pcsRef.current?.focus()
                  }
                />
              )}
            </div>
            <div className="sr-entry-cell">
              <label>Pcs</label>
              <input
                ref={pcsRef}
                type="number"
                className="sr-num-input"
                style={{ width: 60 }}
                value={curRow.pcs}
                min={1}
                onChange={(e) => updateCurRow("pcs", e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && rateRef.current?.focus()}
                onFocus={(e) => e.target.select()}
              />
            </div>
            <div className="sr-entry-cell">
              <label>Rate</label>
              <input
                ref={rateRef}
                type="number"
                className="sr-num-input"
                style={{ width: 75 }}
                value={curRow.rate}
                min={0}
                onChange={(e) => updateCurRow("rate", e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addRef.current?.click()}
                onFocus={(e) => e.target.select()}
              />
            </div>
            <div className="sr-entry-cell">
              <label>Amount</label>
              <input
                className="sr-num-input"
                style={{ width: 80 }}
                value={Number(curRow.amount || 0).toLocaleString("en-PK")}
                readOnly
              />
            </div>
            <div className="sr-entry-cell sr-entry-btns-cell">
              <label>&nbsp;</label>
              <div className="sr-entry-btns">
                <button className="xp-btn xp-btn-sm" onClick={resetCurRow}>
                  Reset
                </button>
                <button
                  ref={addRef}
                  className="xp-btn xp-btn-sm sr-btn-add"
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
          <div className="sr-table-header-bar">
            <span className="sr-table-lbl">
              {curRow.name ? (
                <span className="sr-cur-name-inline">{curRow.name}</span>
              ) : (
                "Select Product"
              )}
            </span>
            <span className="sr-table-qty">
              {totalQty.toLocaleString("en-PK")}
            </span>
          </div>

          {/* Items table */}
          <div className="sr-items-wrap">
            <table className="sr-items-table">
              <thead>
                <tr>
                  <th style={{ width: 32 }}>Sr.#</th>
                  <th style={{ width: 80 }}>Code</th>
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
                </tr>
              </thead>
              <tbody>
                {items.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="xp-empty"
                      style={{ padding: 14 }}
                    >
                      Search and add returned products
                    </td>
                  </tr>
                )}
                {items.map((r, i) => (
                  <tr
                    key={i}
                    className={selItemIdx === i ? "sr-sel-row" : ""}
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
                      style={{ color: "var(--xp-red)", fontWeight: 600 }}
                    >
                      {Number(r.amount).toLocaleString("en-PK")}
                    </td>
                  </tr>
                ))}
                {Array.from({ length: EMPTY_ROWS }).map((_, i) => (
                  <tr key={`e${i}`} className="sr-empty-row">
                    <td colSpan={7} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary bar */}
          <div className="sr-summary-bar">
            <div className="sr-sum-cell">
              <label>Total Quantity</label>
              <input
                className="sr-sum-val"
                value={totalQty.toLocaleString("en-PK")}
                readOnly
              />
            </div>
            <div className="sr-sum-cell">
              <label>Net Amount</label>
              <input
                className="sr-sum-val"
                value={Number(subTotal).toLocaleString("en-PK")}
                readOnly
              />
            </div>
            <div className="sr-sum-cell">
              <label>Bill Amount</label>
              <input
                className="sr-sum-val"
                value={Number(subTotal).toLocaleString("en-PK")}
                readOnly
              />
            </div>
            <div className="sr-sum-cell">
              <label>Paid</label>
              <input
                type="number"
                className="sr-sum-input"
                style={{ color: "var(--xp-green)", fontWeight: 700 }}
                value={paid}
                min={0}
                onChange={(e) => setPaid(e.target.value)}
                onFocus={(e) => e.target.select()}
              />
            </div>
            <div className="sr-sum-cell">
              <label>Balance</label>
              <input
                className={`sr-sum-val${balance > 0 ? " danger" : balance < 0 ? " success" : ""}`}
                value={Number(balance).toLocaleString("en-PK")}
                readOnly
              />
            </div>
          </div>

          {/* Customer bar */}
          <div className="sr-customer-bar">
            <div className="sr-cust-cell">
              <label>Code</label>
              <input
                className="sr-cust-input"
                style={{ width: 55 }}
                value={buyerCode}
                onChange={(e) => setBuyerCode(e.target.value)}
              />
            </div>
            <div className="sr-cust-cell sr-cust-buyer">
              <label>Buyer Name</label>
              <CustomerDropdown
                allCustomers={allCustomers}
                value={customerId}
                displayName={buyerName}
                customerType={customerType}
                onSelect={handleCustomerSelect}
                onClear={handleCustomerClear}
              />
            </div>
            <div className="sr-cust-cell">
              <label>Previous Balance</label>
              <input
                type="number"
                className="sr-cust-input"
                style={{ width: 95 }}
                value={prevBalance}
                onChange={(e) => setPrevBalance(e.target.value)}
                onFocus={(e) => e.target.select()}
              />
            </div>
            <div className="sr-cust-cell">
              <label>Net Receivable</label>
              <input
                className="sr-cust-input sr-net-recv"
                style={{
                  color: balance > 0 ? "var(--xp-red)" : "var(--xp-green)",
                  fontWeight: 700,
                  width: 95,
                }}
                value={Number(balance).toLocaleString("en-PK")}
                readOnly
              />
            </div>
          </div>
        </div>

        {/* RIGHT — Hold Bills */}
        <div className="sr-right">
          <div className="sr-hold-panel">
            <div className="sr-hold-title">
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
              <span className="sr-hold-cnt">{holdBills.length}</span>
            </div>
            <div className="sr-hold-table-wrap">
              <table className="sr-hold-table">
                <thead>
                  <tr>
                    <th style={{ width: 24 }}>#</th>
                    <th>Bill #</th>
                    <th className="r">Amount</th>
                    <th>Description</th>
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
                            {b.returnNo}
                          </td>
                          <td className="r" style={{ color: "var(--xp-red)" }}>
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
            <div className="sr-hold-scroll-btns">
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
                Hold Return (F4)
              </button>
            </div>
            <div className="sr-hold-hint">
              Click = preview · Dbl-click = resume · ✕ = delete
            </div>
          </div>
        </div>
      </div>

      {/* Command bar */}
      <div className="sr-cmd-bar">
        <button
          className="xp-btn xp-btn-sm"
          onClick={fullReset}
          disabled={loading}
        >
          Refresh
        </button>
        <button
          ref={saveRef}
          className="xp-btn xp-btn-sm sr-btn-save-primary xp-btn-lg"
          onClick={openReturnConfirm}
          disabled={loading}
        >
          {loading ? "Saving…" : "Save Record  F10"}
        </button>
        <button className="xp-btn xp-btn-sm" onClick={() => {}}>
          Edit Record
        </button>
        <button
          className="xp-btn xp-btn-danger xp-btn-sm"
          disabled={!editId}
          onClick={async () => {
            if (!editId || !window.confirm("Delete this return?")) return;
            try {
              await api.delete(EP.SALES.DELETE(editId));
              showMsg("Return deleted");
              fullReset();
              refreshReturnNo();
            } catch {
              showMsg("Delete failed", "error");
            }
          }}
        >
          Delete Record
        </button>
        <div className="xp-toolbar-divider" />
        <div className="sr-cmd-checks">
          <label className="sr-check-label">
            <input
              type="checkbox"
              checked={sendSms}
              onChange={(e) => setSendSms(e.target.checked)}
            />{" "}
            Send SMS
          </label>
        </div>
        <div className="xp-toolbar-divider" />
        <div className="sr-print-types">
          {["Thermal", "A4", "A5"].map((pt) => (
            <label key={pt} className="sr-check-label">
              <input
                type="radio"
                name="sr-print"
                checked={printType === pt}
                onChange={() => setPrintType(pt)}
              />{" "}
              {pt}
            </label>
          ))}
        </div>
        <div className="xp-toolbar-divider" />
        <span className="sr-inv-info">
          {editId
            ? "✏ Editing return record"
            : `${returnNo} | Items: ${items.length} | Total: ${Number(subTotal).toLocaleString("en-PK")}`}
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
