// pages/DamageOutPage.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import api from "../api/api.js";
import EP from "../api/apiEndpoints.js";
import "../styles/theme.css";
import "../styles/SalePage.css";
import "../styles/DamagePage.css";

const isoDate = () => new Date().toISOString().split("T")[0];
const timeNow = () =>
  new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
const fmt = (n) => Number(n || 0).toLocaleString("en-PK");
const SHOP_NAME = "Asim Electric and Electronic Store";
const EMPTY_ENTRY = {
  productId: "",
  code: "",
  name: "",
  uom: "",
  packing: "",
  pcs: 1,
  rate: 0,
  amount: 0,
};
const HOLD_KEY = "asim_damageout_hold_v1";

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
   SEARCH MODAL — SalePage style: 3 filter inputs
══════════════════════════════════════════════════════════ */
function SearchModal({ allProducts, onSelect, onClose }) {
  const [desc, setDesc] = useState("");
  const [cat, setCat] = useState("");
  const [company, setCompany] = useState("");
  const [rows, setRows] = useState([]);
  const [hiIdx, setHiIdx] = useState(0);
  const rDesc = useRef(null),
    rCat = useRef(null),
    rCompany = useRef(null),
    tbodyRef = useRef(null);

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
        <div
          className="xp-modal-tb"
          style={{ background: "linear-gradient(135deg,#bf360c,#e64a19)" }}
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 16 16"
            fill="rgba(255,255,255,0.8)"
          >
            <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0" />
          </svg>
          <span className="xp-modal-title">Search Products — F2</span>
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
                      <td className="r xp-amt">{fmt(r._rate)}</td>
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
   PRINT MODAL
══════════════════════════════════════════════════════════ */
function PrintModal({ record, onClose }) {
  const {
    invoiceNo,
    invoiceDate,
    buyerName,
    items,
    totalQty,
    netAmount,
    previousBalance,
    netReceivable,
  } = record;
  const doPrint = () => {
    const rowsHtml = items
      .map(
        (it, i) =>
          `<tr><td>${i + 1}</td><td>${it.code || ""}</td><td>${it.name}</td><td>${it.uom || ""}</td><td>${it.packing || ""}</td><td align='right'>${it.pcs}</td><td align='right'>${Number(it.rate).toLocaleString()}</td><td align='right'><b>${Number(it.amount).toLocaleString()}</b></td></tr>`,
      )
      .join("");
    const win = window.open("", "_blank", "width=900,height=700");
    win.document
      .write(`<!DOCTYPE html><html><head><title>Damage Out ${invoiceNo}</title><style>body{font-family:Arial;font-size:12px;padding:20px}h2,h3{margin:0 0 4px;text-align:center}table{width:100%;border-collapse:collapse;margin-top:10px}th,td{border:1px solid #ccc;padding:5px}th{background:#ffe0b2}.meta{display:flex;gap:16px;flex-wrap:wrap;margin:8px 0;padding:6px 10px;background:#fff8e1;border:1px solid #ffd54f}.tots{float:right;min-width:240px;margin-top:10px}.tr{display:flex;justify-content:space-between;padding:2px 0}.tr.b{font-weight:bold;border-top:2px solid #000;margin-top:4px;padding-top:4px}</style></head><body>
    <h2>${SHOP_NAME}</h2><h3>DAMAGE OUT</h3>
    <div class='meta'><span><b>Invoice:</b> ${invoiceNo}</span><span><b>Date:</b> ${invoiceDate}</span><span><b>Party:</b> ${buyerName || "COUNTER SALE"}</span></div>
    <table><thead><tr><th>#</th><th>Code</th><th>Name</th><th>UOM</th><th>Packing</th><th>Pcs</th><th>Rate</th><th>Amount</th></tr></thead><tbody>${rowsHtml}</tbody></table>
    <div class='tots'><div class='tr'><span>Total Qty</span><span>${totalQty}</span></div><div class='tr'><span>Net Amount</span><span>PKR ${Number(netAmount).toLocaleString()}</span></div><div class='tr'><span>Prev Balance</span><span>PKR ${Number(previousBalance).toLocaleString()}</span></div><div class='tr b'><span>Net Payable</span><span>PKR ${Number(netReceivable).toLocaleString()}</span></div></div>
    <br style='clear:both'><div style='text-align:center;margin-top:24px;font-size:11px;color:#888;border-top:1px dashed #ccc;padding-top:8px'>Thank you — ${SHOP_NAME}</div></body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 400);
  };
  useEffect(() => {
    doPrint();
  }, []);
  return (
    <div
      className="xp-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="xp-modal xp-modal-lg">
        <div
          className="xp-modal-tb"
          style={{ background: "linear-gradient(135deg,#bf360c,#e64a19)" }}
        >
          <span className="xp-modal-title">Damage Out — {invoiceNo}</span>
          <button className="xp-cap-btn xp-cap-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="xp-modal-body">
          <div style={{ textAlign: "center", marginBottom: 8 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{SHOP_NAME}</div>
            <div style={{ fontSize: 12, color: "#e65100", fontWeight: 600 }}>
              ── DAMAGE OUT ──
            </div>
          </div>
          <div className="cs-inv-meta">
            <span>
              Invoice: <strong>{invoiceNo}</strong>
            </span>
            <span>
              Date: <strong>{invoiceDate}</strong>
            </span>
            <span>
              Party: <strong>{buyerName || "COUNTER SALE"}</strong>
            </span>
          </div>
          <div className="xp-table-panel" style={{ marginTop: 8 }}>
            <table className="xp-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Code</th>
                  <th>Name</th>
                  <th>UOM</th>
                  <th>Packing</th>
                  <th className="r">Pcs</th>
                  <th className="r">Rate</th>
                  <th className="r">Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, i) => (
                  <tr key={i}>
                    <td className="text-muted">{i + 1}</td>
                    <td>
                      <span className="xp-code">{it.code}</span>
                    </td>
                    <td>{it.name}</td>
                    <td className="text-muted">{it.uom}</td>
                    <td className="text-muted">{it.packing}</td>
                    <td className="r">{it.pcs}</td>
                    <td className="r xp-amt">{fmt(it.rate)}</td>
                    <td className="r xp-amt">{fmt(it.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ maxWidth: 260, marginLeft: "auto", marginTop: 10 }}>
            {[
              ["Total Qty", totalQty, false],
              ["Net Amount", fmt(netAmount), false],
              ["Prev Balance", fmt(previousBalance), false],
              ["Net Payable", `Rs. ${fmt(netReceivable)}`, true],
            ].map(([l, v, bold]) => (
              <div
                key={l}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "3px 0",
                  fontWeight: bold ? 700 : 400,
                  borderTop: bold ? "2px solid #333" : "1px dotted #ddd",
                  marginTop: bold ? 4 : 0,
                }}
              >
                <span>{l}</span>
                <span>{v}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="xp-modal-footer">
          <button className="xp-btn xp-btn-sm dmg-out-btn" onClick={doPrint}>
            🖨 Print Again
          </button>
          <button className="xp-btn xp-btn-sm" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   SAVE CONFIRM MODAL
══════════════════════════════════════════════════════════ */
function SaveConfirmModal({ record, onClose }) {
  const paidRef = useRef(null);
  const [paid, setPaid] = useState(record.netAmount);
  const paidVal = useRef(record.netAmount);

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
        onClose(null);
      }
      if (e.key === "Enter" && document.activeElement === paidRef.current) {
        e.preventDefault();
        const p = Number(paidVal.current || 0);
        onClose({ paid: p, remaining: record.netAmount - p });
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const handlePaidChange = (e) => {
    const v = e.target.value;
    setPaid(v);
    paidVal.current = v;
  };
  const remaining = record.netAmount - Number(paid || 0);
  const handleSave = () => {
    const p = Number(paidVal.current || 0);
    onClose({ paid: p, remaining: record.netAmount - p });
  };

  return (
    <div className="xp-overlay">
      <div
        style={{
          background: "var(--xp-silver-1)",
          border: "2px solid #e65100",
          borderRight: "2px solid #8d3900",
          borderBottom: "2px solid #8d3900",
          boxShadow: "var(--xp-shadow-window)",
          width: 480,
          maxWidth: "96vw",
          display: "flex",
          flexDirection: "column",
          fontFamily: "var(--xp-font)",
        }}
      >
        <div
          style={{
            height: 28,
            background: "linear-gradient(180deg,#e65100 0%,#bf360c 100%)",
            display: "flex",
            alignItems: "center",
            padding: "0 4px 0 10px",
            gap: 6,
          }}
        >
          <span
            style={{
              flex: 1,
              fontSize: 13,
              fontWeight: 700,
              color: "#fff",
              textShadow: "1px 1px 2px rgba(0,0,0,0.7)",
            }}
          >
            Confirm Save — {record.invoiceNo}
          </span>
          <button
            className="xp-cap-btn xp-cap-close"
            onClick={() => onClose(null)}
          >
            ✕
          </button>
        </div>
        <div style={{ display: "flex", padding: "12px 12px 8px", gap: 0 }}>
          {[
            {
              label: "Net Amount",
              val: fmt(record.netAmount),
              color: "#bf360c",
              editable: false,
              bg: "linear-gradient(180deg,#fff3e0 0%,#ffe0b2 100%)",
            },
            {
              label: "Paid",
              val: paid,
              color: "#1565c0",
              editable: true,
              bg: "linear-gradient(180deg,#dde8f8 0%,#c5d8f5 100%)",
            },
            {
              label: remaining >= 0 ? "Remaining" : "Overpaid",
              val: fmt(Math.abs(remaining)),
              color: remaining > 0 ? "#bf360c" : "#2e7d32",
              editable: false,
              bg:
                remaining > 0
                  ? "linear-gradient(180deg,#fff3e0 0%,#ffe0b2 100%)"
                  : "linear-gradient(180deg,#d4edda 0%,#b8dfc4 100%)",
            },
          ].map((box, idx) => (
            <div
              key={idx}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "10px 8px",
                background: box.bg,
                border: "1px solid #ddd",
                borderLeft: idx > 0 ? "none" : "1px solid #ddd",
                borderRadius:
                  idx === 0 ? "3px 0 0 3px" : idx === 2 ? "0 3px 3px 0" : 0,
              }}
            >
              <div
                style={{
                  fontSize: "var(--xp-fs-xs)",
                  fontWeight: 700,
                  color: box.color,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  marginBottom: 4,
                }}
              >
                {box.label}
              </div>
              {box.editable ? (
                <input
                  ref={paidRef}
                  type="number"
                  value={paid}
                  onChange={handlePaidChange}
                  onFocus={(e) => e.target.select()}
                  style={{
                    fontSize: 28,
                    fontWeight: 900,
                    color: "#1565c0",
                    fontFamily: "var(--xp-mono)",
                    textAlign: "center",
                    width: "100%",
                    background: "transparent",
                    border: "none",
                    borderBottom: "2px solid #1565c0",
                    outline: "none",
                    padding: 0,
                    MozAppearance: "textfield",
                  }}
                />
              ) : (
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 900,
                    color: box.color,
                    fontFamily: "var(--xp-mono)",
                    lineHeight: 1,
                  }}
                >
                  {remaining < 0 && idx === 2 && (
                    <span style={{ fontSize: 18, marginRight: 2 }}>−</span>
                  )}
                  {box.val}
                </div>
              )}
            </div>
          ))}
        </div>
        <div
          style={{
            height: 1,
            background: "var(--xp-silver-2)",
            boxShadow: "0 1px 0 #fff",
            margin: "0 12px",
          }}
        />
        <div
          style={{
            display: "flex",
            gap: 6,
            padding: "8px 12px 10px",
            justifyContent: "center",
          }}
        >
          <button
            className="xp-btn xp-btn-sm"
            style={{
              minWidth: 130,
              background: "linear-gradient(180deg,#e65100 0%,#bf360c 100%)",
              color: "#fff",
              borderColor: "#8d3900",
              fontWeight: 700,
            }}
            onClick={handleSave}
          >
            💾 Save Record
          </button>
          <button className="xp-btn xp-btn-sm" onClick={() => onClose(null)}>
            ↩ Cancel
          </button>
        </div>
        <div
          style={{
            background: "var(--xp-silver-3)",
            borderTop: "1px solid var(--xp-silver-2)",
            padding: "3px 12px",
            fontSize: 10.5,
            color: "#666",
            textAlign: "center",
          }}
        >
          ↵ Enter = Save &nbsp;|&nbsp; Esc = Cancel
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════ */
export default function DamageOutPage() {
  const [time, setTime] = useState(timeNow());
  const [invoiceNo, setInvoiceNo] = useState("DO-00001");
  const [invoiceDate, setInvoiceDate] = useState(isoDate());
  const [buyerName, setBuyerName] = useState("COUNTER SALE");
  const [buyerCode, setBuyerCode] = useState("");
  const [previousBalance, setPreviousBalance] = useState(0);
  const [entry, setEntry] = useState({ ...EMPTY_ENTRY });
  const [searchText, setSearchText] = useState("");
  const [packingOptions, setPackingOptions] = useState([]);
  const [selItemIdx, setSelItemIdx] = useState(null);
  const [items, setItems] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [receiptRecord, setReceiptRecord] = useState(null);
  const [products, setProducts] = useState([]);
  const [holdBills, setHoldBills] = useState(() => loadHolds());
  const [showConfirm, setShowConfirm] = useState(false);
  const [msg, setMsg] = useState({ text: "", type: "" });
  const [saving, setSaving] = useState(false);
  const [savedRecords, setSavedRecords] = useState([]);
  const [loadingRec, setLoadingRec] = useState(false);
  const [selId, setSelId] = useState(null);
  const [recSearch, setRecSearch] = useState("");
  const [printMode, setPrintMode] = useState("Thermal");

  const searchRef = useRef(null);
  const packingRef = useRef(null);
  const pcsRef = useRef(null);
  const rateRef = useRef(null);
  const addBtnRef = useRef(null);
  const saveRef = useRef(null);

  const totalQty = items.reduce((s, r) => s + Number(r.pcs || 0), 0);
  const netAmount = items.reduce((s, r) => s + Number(r.amount || 0), 0);
  const balance = netAmount + Number(previousBalance || 0);
  const netReceivable = balance;

  useEffect(() => {
    const t = setInterval(() => setTime(timeNow()), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    fetchProducts();
    fetchNextInvoice();
    fetchSaved();
  }, []);
  useEffect(() => {
    saveHolds(holdBills);
  }, [holdBills]);

  useEffect(() => {
    const h = (e) => {
      if (showSearch || receiptRecord || showConfirm) return;
      if (e.key === "F2") {
        e.preventDefault();
        setShowSearch(true);
      }
      if (e.key === "F4") {
        e.preventDefault();
        holdBill();
      }
      if (e.key === "F5") {
        e.preventDefault();
        handlePreview();
      }
      if (e.key === "F10" || (e.ctrlKey && e.key === "s")) {
        e.preventDefault();
        saveRef.current?.click();
      }
      if (e.key === "Escape") {
        e.preventDefault();
        resetEntry();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [items, entry, showSearch, receiptRecord, showConfirm]);

  const fetchProducts = async () => {
    try {
      const { data } = await api.get(EP.PRODUCTS.GET_ALL);
      if (data.success) setProducts(data.data);
    } catch {}
  };
  const fetchNextInvoice = async () => {
    try {
      const { data } = await api.get(EP.DAMAGE.NEXT_INVOICE("out"));
      if (data.success) setInvoiceNo(data.invoiceNo);
    } catch {}
  };
  const fetchSaved = async (search = "") => {
    setLoadingRec(true);
    try {
      const { data } = await api.get(EP.DAMAGE.GET_OUT(search));
      if (data.success) setSavedRecords(data.data || []);
    } catch {
      setSavedRecords([]);
    }
    setLoadingRec(false);
  };
  const showMsg = (text, type = "success") => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: "", type: "" }), 3000);
  };

  const pickProduct = (product) => {
    const opts = product.packingInfo?.map((pk) => pk.measurement) || [];
    setPackingOptions(opts);
    setEntry({
      productId: product._id || "",
      code: product.code || "",
      name: product._name || product.description || "",
      uom: product._meas || "",
      packing: product._pack ? String(product._pack) : "",
      pcs: product._pack || 1,
      rate: product._rate || 0,
      amount: (product._pack || 1) * (product._rate || 0),
    });
    setSearchText(product._name || product.description || "");
    setShowSearch(false);
    setTimeout(() => packingRef.current?.focus(), 30);
  };

  const updateEntry = (field, val) => {
    setEntry((prev) => {
      const u = { ...prev, [field]: val };
      u.amount =
        (parseFloat(field === "pcs" ? val : u.pcs) || 0) *
        (parseFloat(field === "rate" ? val : u.rate) || 0);
      return u;
    });
  };

  const addItem = () => {
    if (!entry.name) {
      setShowSearch(true);
      return;
    }
    if (!entry.productId) {
      showMsg("Valid product select karein", "error");
      return;
    }
    if (parseFloat(entry.pcs) <= 0) {
      showMsg("Pcs > 0 hona chahiye", "error");
      return;
    }
    if (selItemIdx !== null) {
      setItems((prev) => {
        const u = [...prev];
        u[selItemIdx] = { ...entry };
        return u;
      });
      setSelItemIdx(null);
    } else setItems((p) => [...p, { ...entry }]);
    resetEntry();
  };

  const resetEntry = () => {
    setEntry({ ...EMPTY_ENTRY });
    setSearchText("");
    setPackingOptions([]);
    setSelItemIdx(null);
    setTimeout(() => searchRef.current?.focus(), 30);
  };
  const loadItemForEdit = (idx) => {
    setSelItemIdx(idx);
    setEntry({ ...items[idx] });
    setSearchText(items[idx].name);
    setTimeout(() => packingRef.current?.focus(), 30);
  };
  const removeItem = () => {
    if (selItemIdx === null) return;
    setItems((p) => p.filter((_, i) => i !== selItemIdx));
    resetEntry();
  };

  const holdBill = () => {
    if (!items.length) {
      showMsg("Pehle items add karein", "error");
      return;
    }
    setHoldBills((prev) => [
      ...prev,
      {
        id: Date.now(),
        invoiceNo,
        invoiceDate,
        buyerName,
        buyerCode,
        items: [...items],
        previousBalance,
      },
    ]);
    showMsg(`Bill hold: ${invoiceNo}`);
    resetForm(false);
  };

  const resumeHold = (bill, idx) => {
    setInvoiceNo(bill.invoiceNo);
    setInvoiceDate(bill.invoiceDate);
    setBuyerName(bill.buyerName);
    setBuyerCode(bill.buyerCode || "");
    setItems(bill.items);
    setPreviousBalance(bill.previousBalance || 0);
    const holdId = bill.id || idx;
    setHoldBills((prev) =>
      prev.filter((b) => (b.id || prev.indexOf(b)) !== holdId),
    );
    resetEntry();
    showMsg("Hold restore ho gaya");
  };

  const openConfirm = () => {
    if (!items.length) {
      showMsg("Koi item nahi", "error");
      return;
    }
    setShowConfirm(true);
  };

  const handleConfirmClose = async (overrides) => {
    setShowConfirm(false);
    if (!overrides) return;
    setSaving(true);
    try {
      const payload = {
        type: "out",
        invoiceNo,
        invoiceDate,
        buyerName,
        buyerCode,
        items,
        totalQty,
        netAmount,
        billAmount: netAmount,
        previousBalance: Number(previousBalance) || 0,
        balance,
        netReceivable,
        paidAmount: overrides.paid,
      };
      const { data } = await api.post(EP.DAMAGE.CREATE, payload);
      if (data.success) {
        showMsg("Saved: " + data.data.invoiceNo);
        setReceiptRecord({
          invoiceNo: data.data.invoiceNo,
          invoiceDate,
          buyerName,
          items,
          totalQty,
          netAmount,
          previousBalance: Number(previousBalance) || 0,
          netReceivable,
        });
        fetchSaved(recSearch);
        fetchNextInvoice();
        resetForm(false);
      } else showMsg(data.message || "Save failed", "error");
    } catch (e) {
      showMsg(e.response?.data?.message || "Save failed", "error");
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!selId) return showMsg("Pehle record select karein", "error");
    if (!confirm("Delete this record?")) return;
    try {
      const { data } = await api.delete(EP.DAMAGE.DELETE(selId));
      if (data.success) {
        showMsg("Deleted");
        setSelId(null);
        fetchSaved(recSearch);
      } else showMsg(data.message || "Delete failed", "error");
    } catch {
      showMsg("Delete failed", "error");
    }
  };

  const handleLoad = (rec) => {
    setInvoiceNo(rec.invoiceNo);
    setInvoiceDate(rec.invoiceDate);
    setBuyerName(rec.buyerName || "COUNTER SALE");
    setBuyerCode(rec.buyerCode || "");
    setItems(rec.items?.length ? rec.items : []);
    setPreviousBalance(rec.previousBalance || 0);
    setSelId(rec._id);
    resetEntry();
    showMsg("Loaded: " + rec.invoiceNo);
  };

  const handlePreview = () => {
    if (!items.length) {
      showMsg("Koi item nahi", "error");
      return;
    }
    setReceiptRecord({
      invoiceNo,
      invoiceDate,
      buyerName,
      items,
      totalQty,
      netAmount,
      previousBalance: Number(previousBalance) || 0,
      netReceivable,
    });
  };

  const resetForm = (clearHold = true) => {
    setItems([]);
    resetEntry();
    setBuyerName("COUNTER SALE");
    setBuyerCode("");
    setPreviousBalance(0);
    setSelId(null);
    if (clearHold) setHoldBills([]);
    fetchNextInvoice();
  };

  const handleRecSearch = (v) => {
    setRecSearch(v);
    clearTimeout(window._dmgOutTimer);
    window._dmgOutTimer = setTimeout(() => fetchSaved(v), 300);
  };
  const EMPTY_ROWS = Math.max(0, 8 - items.length);

  return (
    <div className="sl-page">
      {showSearch && (
        <SearchModal
          allProducts={products}
          onSelect={pickProduct}
          onClose={() => {
            setShowSearch(false);
            setTimeout(() => searchRef.current?.focus(), 30);
          }}
        />
      )}
      {receiptRecord && (
        <PrintModal
          record={receiptRecord}
          onClose={() => setReceiptRecord(null)}
        />
      )}
      {showConfirm && (
        <SaveConfirmModal
          record={{
            invoiceNo,
            invoiceDate,
            buyerName,
            items,
            totalQty,
            netAmount,
            billAmount: netAmount,
            previousBalance: Number(previousBalance) || 0,
            balance,
            netReceivable,
          }}
          onClose={handleConfirmClose}
        />
      )}

      {/* TITLEBAR */}
      <div className="xp-titlebar dmg-titlebar-out">
        <svg
          width="15"
          height="15"
          viewBox="0 0 16 16"
          fill="rgba(255,255,255,0.85)"
        >
          <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
          <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708" />
        </svg>
        <span className="xp-tb-title">Damage Out — {SHOP_NAME}</span>
        <div className="xp-tb-actions">
          <div className="sl-shortcut-hints">
            <span>F2 Search</span>
            <span>F4 Hold</span>
            <span>F5 Preview</span>
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

      {/* BODY */}
      <div className="sl-body">
        <div className="sl-left">
          {/* Top bar */}
          <div className="sl-top-bar">
            <div className="sl-sale-title-box dmg-out-title-box">
              Damage Out
            </div>
            <div className="sl-inv-field-grp">
              <label>Invoice #</label>
              <input
                className="xp-input xp-input-sm sl-inv-input"
                value={invoiceNo}
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
                readOnly={!!entry.name}
                placeholder="F2 ya click — search karein…"
                onClick={() => setShowSearch(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === "F2") {
                    e.preventDefault();
                    setShowSearch(true);
                  }
                }}
                autoFocus
              />
            </div>
            <div className="sl-entry-cell">
              <label>Packing</label>
              {packingOptions.length > 0 ? (
                <select
                  className="sl-uom-select"
                  value={entry.packing}
                  onChange={(e) =>
                    setEntry((p) => ({ ...p, packing: e.target.value }))
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
                  ref={packingRef}
                  type="text"
                  className="xp-input xp-input-sm"
                  style={{ width: 70 }}
                  value={entry.packing}
                  onChange={(e) =>
                    setEntry((p) => ({ ...p, packing: e.target.value }))
                  }
                  onKeyDown={(e) =>
                    e.key === "Enter" && pcsRef.current?.focus()
                  }
                  onFocus={(e) => e.target.select()}
                />
              )}
            </div>
            <div className="sl-entry-cell">
              <label>Pcs</label>
              <input
                ref={pcsRef}
                type="number"
                className="sl-num-input"
                style={{ width: 60 }}
                value={entry.pcs}
                min={1}
                onChange={(e) => updateEntry("pcs", e.target.value)}
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
                value={entry.rate}
                min={0}
                onChange={(e) => updateEntry("rate", e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && addBtnRef.current?.click()
                }
                onFocus={(e) => e.target.select()}
              />
            </div>
            <div className="sl-entry-cell">
              <label>Amount</label>
              <input
                className="sl-num-input"
                style={{ width: 80 }}
                value={fmt(entry.amount)}
                readOnly
              />
            </div>
            <div className="sl-entry-cell sl-entry-btns-cell">
              <label>&nbsp;</label>
              <div className="sl-entry-btns">
                <button className="xp-btn xp-btn-sm" onClick={resetEntry}>
                  Reset
                </button>
                <button
                  ref={addBtnRef}
                  className="xp-btn xp-btn-sm dmg-out-btn"
                  onClick={addItem}
                >
                  {selItemIdx !== null ? "Update" : "Add"}
                </button>
                <button
                  className="xp-btn xp-btn-sm"
                  disabled={selItemIdx === null}
                  onClick={() =>
                    selItemIdx !== null && loadItemForEdit(selItemIdx)
                  }
                >
                  Edit
                </button>
                <button
                  className="xp-btn xp-btn-danger xp-btn-sm"
                  disabled={selItemIdx === null}
                  onClick={removeItem}
                >
                  Remove
                </button>
              </div>
            </div>
          </div>

          {/* Table header */}
          <div className="sl-table-header-bar">
            <span className="sl-table-lbl">
              {entry.name ? (
                <span className="sl-cur-name-inline">{entry.name}</span>
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
                  <th style={{ width: 32 }}>Sr#</th>
                  <th style={{ width: 72 }}>Code</th>
                  <th>Name</th>
                  <th style={{ width: 60 }}>UOM</th>
                  <th style={{ width: 65 }}>Packing</th>
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
                      colSpan={8}
                      className="xp-empty"
                      style={{ padding: 14 }}
                    >
                      F2 se product select karein aur add karein
                    </td>
                  </tr>
                )}
                {items.map((r, i) => (
                  <tr
                    key={i}
                    className={selItemIdx === i ? "sl-sel-row" : ""}
                    onClick={() => setSelItemIdx(i === selItemIdx ? null : i)}
                    onDoubleClick={() => loadItemForEdit(i)}
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
                    <td className="muted">{r.packing}</td>
                    <td className="r">{r.pcs}</td>
                    <td className="r">{fmt(r.rate)}</td>
                    <td className="r" style={{ color: "var(--xp-blue-dark)" }}>
                      {fmt(r.amount)}
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

          {/* Summary bar */}
          <div className="sl-summary-bar">
            <div className="sl-sum-cell">
              <label>Total Qty</label>
              <input className="sl-sum-val" value={totalQty} readOnly />
            </div>
            <div className="sl-sum-cell">
              <label>Net Amount</label>
              <input className="sl-sum-val" value={fmt(netAmount)} readOnly />
            </div>
            <div className="sl-sum-cell">
              <label>Prev Balance</label>
              <input
                type="number"
                className="sl-sum-input"
                value={previousBalance}
                onChange={(e) => setPreviousBalance(e.target.value)}
                onFocus={(e) => e.target.select()}
              />
            </div>
            <div className="sl-sum-cell">
              <label>Net Payable</label>
              <input
                className="sl-sum-val"
                style={{ color: "var(--xp-red)", fontWeight: 700 }}
                value={fmt(netReceivable)}
                readOnly
              />
            </div>
          </div>

          {/* Buyer bar */}
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
            <div className="sl-cust-cell" style={{ flex: 1 }}>
              <label>Buyer / Party Name</label>
              <input
                className="sl-cust-input"
                style={{ width: "100%" }}
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* RIGHT: Hold Bills — exact SalePage style */}
        <div className="sl-right">
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
                    <th>Party</th>
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
                          key={b.id || i}
                          onClick={() => resumeHold(b, i)}
                          style={{ cursor: "pointer" }}
                          title="Click = restore"
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
                            {fmt(
                              b.items.reduce(
                                (s, r) => s + Number(r.amount || 0),
                                0,
                              ),
                            )}
                          </td>
                          <td className="muted" style={{ fontSize: 10 }}>
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
                              onClick={(e) => {
                                e.stopPropagation();
                                setHoldBills((p) =>
                                  p.filter((_, j) => j !== i),
                                );
                              }}
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
              Click = restore &nbsp;|&nbsp; ✕ = delete
            </div>
          </div>
        </div>
      </div>

      {/* CMD BAR */}
      <div className="sl-cmd-bar">
        <button
          className="xp-btn xp-btn-sm"
          onClick={() => fetchSaved(recSearch)}
        >
          Refresh
        </button>
        <button
          ref={saveRef}
          className="xp-btn xp-btn-sm dmg-out-btn"
          onClick={openConfirm}
          disabled={saving}
        >
          {saving ? "Saving…" : "Save  F10"}
        </button>
        <button
          className="xp-btn xp-btn-sm"
          onClick={() => {
            if (!selId) return showMsg("Record select karein", "error");
            const r = savedRecords.find((x) => x._id === selId);
            if (r) handleLoad(r);
          }}
        >
          Edit Record
        </button>
        <button
          className="xp-btn xp-btn-danger xp-btn-sm"
          disabled={!selId}
          onClick={handleDelete}
        >
          Delete Record
        </button>
        <button className="xp-btn xp-btn-sm" onClick={handlePreview}>
          F5 Preview
        </button>
        <button className="xp-btn xp-btn-sm" onClick={holdBill}>
          F4 Hold
        </button>
        <div className="xp-toolbar-divider" />
        <label className="sl-check-label">
          <input type="checkbox" /> Send SMS
        </label>
        <label className="sl-check-label">
          <input type="checkbox" /> Gate Pass
        </label>
        <div className="xp-toolbar-divider" />
        <div className="sl-print-types">
          {["Thermal", "Laser"].map((pt) => (
            <label key={pt} className="sl-check-label">
              <input
                type="radio"
                name="dmgPrint"
                checked={printMode === pt}
                onChange={() => setPrintMode(pt)}
              />
              {pt}
            </label>
          ))}
        </div>
        <div className="xp-toolbar-divider" />
        <span className="sl-inv-info">
          {invoiceNo} | Items: {items.length} | Total: {fmt(netAmount)}
        </span>
        <button
          className="xp-btn xp-btn-sm"
          style={{ marginLeft: "auto" }}
          onClick={() => resetForm(true)}
        >
          ✕ Close
        </button>
      </div>

      {/* SAVED RECORDS */}
      <div
        className="qt-saved-section"
        style={{ borderTop: "2px solid var(--xp-border)" }}
      >
        <div className="qt-saved-header">
          <span className="qt-saved-title">Saved Damage Out Records</span>
          <div className="xp-search-wrap" style={{ flex: 1, maxWidth: 300 }}>
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
              className="xp-input"
              value={recSearch}
              onChange={(e) => handleRecSearch(e.target.value)}
              placeholder="Search invoice / buyer…"
            />
          </div>
          <span style={{ fontSize: "var(--xp-fs-xs)", color: "#666" }}>
            {savedRecords.length} record(s)
          </span>
          <button
            className="xp-btn xp-btn-sm"
            onClick={() => fetchSaved(recSearch)}
            disabled={loadingRec}
          >
            Refresh
          </button>
          <button
            className="xp-btn xp-btn-danger xp-btn-sm"
            onClick={handleDelete}
            disabled={!selId}
          >
            Delete
          </button>
        </div>
        <div className="qt-saved-table-wrap">
          <table className="qt-saved-table">
            <thead>
              <tr>
                <th style={{ width: 32 }}>#</th>
                <th style={{ width: 100 }}>Invoice #</th>
                <th style={{ width: 95 }}>Date</th>
                <th>Buyer</th>
                <th className="r" style={{ width: 60 }}>
                  Items
                </th>
                <th className="r" style={{ width: 60 }}>
                  Qty
                </th>
                <th className="r" style={{ width: 110 }}>
                  Net Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {loadingRec && (
                <tr>
                  <td colSpan={7} className="xp-loading">
                    Loading…
                  </td>
                </tr>
              )}
              {!loadingRec && savedRecords.length === 0 && (
                <tr>
                  <td colSpan={7} className="xp-empty">
                    No records found
                  </td>
                </tr>
              )}
              {!loadingRec &&
                savedRecords.map((rec, i) => (
                  <tr
                    key={rec._id}
                    className={selId === rec._id ? "qt-sel-row" : ""}
                    onClick={() => setSelId(rec._id)}
                    onDoubleClick={() => handleLoad(rec)}
                  >
                    <td
                      className="text-muted"
                      style={{
                        textAlign: "center",
                        fontSize: "var(--xp-fs-xs)",
                      }}
                    >
                      {i + 1}
                    </td>
                    <td>
                      <span className="xp-code">{rec.invoiceNo}</span>
                    </td>
                    <td className="text-muted">{rec.invoiceDate}</td>
                    <td>
                      {rec.buyerName || (
                        <span className="text-muted">Counter</span>
                      )}
                    </td>
                    <td className="r">{rec.items?.length || 0}</td>
                    <td className="r">{rec.totalQty || 0}</td>
                    <td className="r xp-amt">{fmt(rec.netAmount)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Status bar */}
      <div className="xp-statusbar">
        <div className="xp-status-pane">DO {invoiceNo}</div>
        <div className="xp-status-pane">{buyerName}</div>
        <div className="xp-status-pane">Items: {items.length}</div>
        <div className="xp-status-pane">Qty: {totalQty}</div>
        <div className="xp-status-pane">
          Net:{" "}
          <strong style={{ fontFamily: "var(--xp-mono)", marginLeft: 3 }}>
            PKR {fmt(netAmount)}
          </strong>
        </div>
        <div className="xp-status-pane">Hold: {holdBills.length}</div>
      </div>
    </div>
  );
}
