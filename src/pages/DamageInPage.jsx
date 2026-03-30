// pages/DamageInPage.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import api from "../api/api.js";
import EP from "../api/apiEndpoints.js";
import "../styles/theme.css";
import "../styles/DamagePage.css";

/* ── helpers ── */
const timeNow = () =>
  new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
const isoDate = () => new Date().toISOString().split("T")[0];
const fmt = (n) => Number(n || 0).toLocaleString("en-PK");
const HOLD_KEY = "asim_damagein_hold_v1";
const SHOP_NAME = "Asim Electric and Electronic Store";

const EMPTY_ROW = {
  productId: "",
  code: "",
  name: "",
  uom: "",
  packing: "",
  pcs: 1,
  rate: 0,
  amount: 0,
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
   SEARCH MODAL
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
                        cursor: "pointer",
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
   HOLD PREVIEW MODAL
══════════════════════════════════════════════════════════ */
function HoldPreviewModal({ bill, onResume, onClose }) {
  if (!bill) return null;
  const total = bill.items.reduce((s, r) => s + Number(r.amount || 0), 0);
  return (
    <div
      className="xp-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="xp-modal" style={{ width: 520 }}>
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
              <b>Buyer:</b> {bill.buyerName}
            </span>
            <span>
              <b>Items:</b> {bill.items.length}
            </span>
            <span>
              <b>Amount:</b>{" "}
              <span style={{ color: "var(--xp-blue-dark)", fontWeight: 700 }}>
                {fmt(total)}
              </span>
            </span>
          </div>
          <div className="xp-table-panel" style={{ border: "none" }}>
            <div className="xp-table-scroll" style={{ maxHeight: 260 }}>
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
                      <td className="r">{fmt(r.rate)}</td>
                      <td
                        className="r"
                        style={{
                          color: "var(--xp-blue-dark)",
                          fontWeight: 700,
                        }}
                      >
                        {fmt(r.amount)}
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
   SAVE CONFIRM MODAL — FIX: paid field 0 hone ka bug theek
══════════════════════════════════════════════════════════ */
function SaveConfirmModal({ record, onClose }) {
  const paidRef = useRef(null);
  // ── FIX: netAmount se initialize karo, string nahi number
  const [paid, setPaid] = useState(record.netAmount);

  // ── FIX: remaining useRef se track karo taky stale closure na ho
  const paidVal = useRef(record.netAmount);

  useEffect(() => {
    setTimeout(() => {
      paidRef.current?.focus();
      paidRef.current?.select();
    }, 80);
  }, []);

  // ── FIX: Enter key handler alag useEffect mein, paid ko ref se read karo
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
  }, []); // ← empty dependency — stale closure se bachne ke liye ref use kar rahe hain

  const handlePaidChange = (e) => {
    const v = e.target.value;
    setPaid(v);
    paidVal.current = v; // ← ref sync karo
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
          border: "2px solid #3a7bd5",
          borderRight: "2px solid #0a246a",
          borderBottom: "2px solid #0a246a",
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
            background: "linear-gradient(180deg,#e53935 0%,#b71c1c 100%)",
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

        {/* 3 boxes */}
        <div style={{ display: "flex", padding: "12px 12px 8px", gap: 0 }}>
          {[
            {
              label: "Net Amount",
              val: fmt(record.netAmount),
              color: "#b71c1c",
              editable: false,
              bg: "linear-gradient(180deg,#fde8e8 0%,#f9c6c6 100%)",
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
              color: remaining > 0 ? "#b71c1c" : "#2e7d32",
              editable: false,
              bg:
                remaining > 0
                  ? "linear-gradient(180deg,#fde8e8 0%,#f9c6c6 100%)"
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
              background: "linear-gradient(180deg,#e53935 0%,#b71c1c 100%)",
              color: "#fff",
              borderColor: "#7b241c",
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
   MAIN PAGE — DAMAGE IN
══════════════════════════════════════════════════════════ */
export default function DamageInPage() {
  const [time, setTime] = useState(timeNow());
  const [invoiceNo, setInvoiceNo] = useState("DI-00001");
  const [invoiceDate, setInvoiceDate] = useState(isoDate());
  const [buyerName, setBuyerName] = useState("COUNTER SALE");
  const [buyerCode, setBuyerCode] = useState("8");
  const [previousBalance, setPreviousBalance] = useState(0);

  const [curRow, setCurRow] = useState({ ...EMPTY_ROW });
  const [searchText, setSearchText] = useState("");
  const [packingOptions, setPackingOptions] = useState([]);
  const [items, setItems] = useState([]);
  const [selItemIdx, setSelItemIdx] = useState(null);

  const [allProducts, setAllProducts] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showHoldPreview, setShowHoldPreview] = useState(null);

  // ── FIX: Hold bills localStorage se load karo
  const [holdBills, setHoldBills] = useState(() => loadHolds());
  const [msg, setMsg] = useState({ text: "", type: "" });
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);

  const [savedRecords, setSavedRecords] = useState([]);
  const [loadingRec, setLoadingRec] = useState(false);
  const [selRecId, setSelRecId] = useState(null);
  const [recSearch, setRecSearch] = useState("");
  const [sendSms, setSendSms] = useState(false);
  const [printType, setPrintType] = useState("Thermal");

  const searchRef = useRef(null);
  const pcsRef = useRef(null);
  const rateRef = useRef(null);
  const addRef = useRef(null);
  const saveRef = useRef(null);

  const totalQty = items.reduce((s, r) => s + (parseFloat(r.pcs) || 0), 0);
  const netAmount = items.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
  const billAmount = netAmount;
  const balance = billAmount + (parseFloat(previousBalance) || 0);

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
      if (showSearch || showHoldPreview || showConfirm) return;
      if (e.key === "F2") {
        e.preventDefault();
        setShowSearch(true);
      }
      if (e.key === "F4") {
        e.preventDefault();
        holdBill();
      }
      if (e.key === "F10" || (e.ctrlKey && e.key === "s")) {
        e.preventDefault();
        saveRef.current?.click();
      }
      if (e.key === "Escape") resetCurRow();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [items, showSearch, showHoldPreview, showConfirm]);

  const fetchProducts = async () => {
    try {
      const { data } = await api.get(EP.PRODUCTS.GET_ALL);
      if (data.success) setAllProducts(data.data);
    } catch {}
  };
  const fetchNextInvoice = async () => {
    try {
      const { data } = await api.get(EP.DAMAGE.NEXT_INVOICE("in"));
      if (data.success)
        setInvoiceNo(data.invoiceNo || data.data?.invoiceNo || "DI-00001");
    } catch {}
  };
  const fetchSaved = async (search = "") => {
    setLoadingRec(true);
    try {
      const { data } = await api.get(EP.DAMAGE.GET_IN(search));
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
      packing: product._pack ? String(product._pack) : "",
      pcs: product._pack || 1,
      rate: product._rate || 0,
      amount: (product._pack || 1) * (product._rate || 0),
    });
    setSearchText(product._name || product.description || "");
    setShowSearch(false);
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
      setShowSearch(true);
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

  /* ── FIX: Hold bill — theek se kaam kare ── */
  const holdBill = () => {
    if (!items.length) {
      showMsg("Koi item nahi hai", "error");
      return;
    }
    const newBill = {
      id: Date.now(),
      invoiceNo,
      amount: billAmount,
      items: [...items],
      buyerName,
      buyerCode,
      previousBalance,
    };
    setHoldBills((p) => [...p, newBill]);
    showMsg(`Bill hold: ${invoiceNo}`);
    fullReset();
    fetchNextInvoice();
  };

  /* ── FIX: Resume hold — id match properly ── */
  const resumeHold = (holdId) => {
    const bill = holdBills.find((b) => b.id === holdId);
    if (!bill) return;
    setItems(bill.items);
    setBuyerName(bill.buyerName || "COUNTER SALE");
    setBuyerCode(bill.buyerCode || "");
    setPreviousBalance(bill.previousBalance || 0);
    setHoldBills((p) => p.filter((b) => b.id !== holdId));
    setShowHoldPreview(null);
    resetCurRow();
    showMsg("Hold restore ho gaya");
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
    setBuyerName("COUNTER SALE");
    setBuyerCode("8");
    setPreviousBalance(0);
    setEditId(null);
    setSelItemIdx(null);
    setMsg({ text: "", type: "" });
    setTimeout(() => searchRef.current?.focus(), 50);
  };

  const openConfirm = () => {
    if (!items.length) {
      alert("Add at least one product");
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
        type: "in",
        invoiceNo,
        invoiceDate,
        buyerName,
        buyerCode,
        items: items.map((r) => ({
          productId: r.productId || undefined,
          code: r.code,
          name: r.name,
          description: r.name,
          uom: r.uom,
          packing: r.packing,
          pcs: parseFloat(r.pcs) || 1,
          qty: parseFloat(r.pcs) || 1,
          rate: parseFloat(r.rate) || 0,
          amount: parseFloat(r.amount) || 0,
        })),
        totalQty,
        netAmount,
        billAmount,
        previousBalance: parseFloat(previousBalance) || 0,
        paidAmount: overrides.paid,
        balance,
        netReceivable: balance,
        sendSms,
        printType,
      };
      const { data } = editId
        ? await api.put(EP.DAMAGE.UPDATE(editId), payload)
        : await api.post(EP.DAMAGE.CREATE, payload);
      if (data.success) {
        showMsg(`Saved: ${data.data.invoiceNo}`);
        fetchSaved(recSearch);
        fullReset();
      } else showMsg(data.message || "Save failed", "error");
    } catch (e) {
      showMsg(e.response?.data?.message || "Save failed", "error");
    }
    setSaving(false);
  };

  const handleLoad = (rec) => {
    setInvoiceNo(rec.invoiceNo);
    setInvoiceDate(rec.invoiceDate);
    setBuyerName(rec.buyerName || "COUNTER SALE");
    setBuyerCode(rec.buyerCode || "");
    setItems(rec.items?.length ? rec.items : []);
    setPreviousBalance(rec.previousBalance || 0);
    setEditId(rec._id);
    showMsg("Loaded: " + rec.invoiceNo);
  };

  const handleDelete = async () => {
    if (!selRecId) return showMsg("Select a record first", "error");
    if (!window.confirm("Delete this damage record?")) return;
    try {
      const { data } = await api.delete(EP.DAMAGE.DELETE(selRecId));
      if (data.success) {
        showMsg("Deleted");
        setSelRecId(null);
        fetchSaved(recSearch);
      } else showMsg(data.message || "Delete failed", "error");
    } catch {
      showMsg("Delete failed", "error");
    }
  };

  const handleRecSearch = (v) => {
    setRecSearch(v);
    clearTimeout(window._dmgInTimer);
    window._dmgInTimer = setTimeout(() => fetchSaved(v), 300);
  };
  const EMPTY_ROWS = Math.max(0, 8 - items.length);

  return (
    <div className="di-page">
      {showSearch && (
        <SearchModal
          allProducts={allProducts}
          onSelect={pickProduct}
          onClose={() => {
            setShowSearch(false);
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
      {showConfirm && (
        <SaveConfirmModal
          record={{
            invoiceNo,
            invoiceDate,
            buyerName,
            items,
            totalQty,
            netAmount,
            billAmount,
            previousBalance,
            balance,
          }}
          onClose={handleConfirmClose}
        />
      )}

      {/* TITLEBAR */}
      <div className="xp-titlebar di-titlebar">
        <svg
          width="15"
          height="15"
          viewBox="0 0 16 16"
          fill="rgba(255,255,255,0.85)"
        >
          <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
          <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0M7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0z" />
        </svg>
        <span className="xp-tb-title">Damage In — {SHOP_NAME}</span>
        <div className="xp-tb-actions">
          {editId && <div className="di-edit-badge">✏ Editing</div>}
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

      <div className="di-body">
        <div className="di-left">
          {/* Top bar */}
          <div className="di-top-bar">
            <div className="di-title-box">Damage In</div>
            <div className="di-inv-field-grp">
              <label>Invoice #</label>
              <input
                className="xp-input xp-input-sm di-inv-input"
                value={editId ? "EDIT" : invoiceNo}
                readOnly
              />
            </div>
            <div className="di-inv-field-grp">
              <label>Date</label>
              <input
                type="date"
                className="xp-input xp-input-sm di-date-input"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
              />
            </div>
            <div className="di-inv-field-grp">
              <label>Time</label>
              <div className="di-time-box">{time}</div>
            </div>
          </div>

          {/* Entry strip */}
          <div className="di-entry-strip">
            <div className="di-entry-cell di-entry-product">
              <label>
                Select Product <kbd>F2</kbd>
              </label>
              <input
                ref={searchRef}
                type="text"
                className="di-product-input"
                value={searchText}
                onClick={() => setShowSearch(true)}
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" ||
                    e.key === "ArrowDown" ||
                    e.key === "F2"
                  ) {
                    e.preventDefault();
                    setShowSearch(true);
                  }
                }}
                placeholder="Enter / F2 to search…"
                readOnly={!!curRow.name}
                autoFocus
              />
            </div>
            <div className="di-entry-cell">
              <label>Packing</label>
              {packingOptions.length > 0 ? (
                <select
                  className="di-uom-select"
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
                  style={{ width: 70 }}
                  value={curRow.packing}
                  onChange={(e) =>
                    setCurRow((p) => ({ ...p, packing: e.target.value }))
                  }
                  onKeyDown={(e) =>
                    e.key === "Enter" && pcsRef.current?.focus()
                  }
                />
              )}
            </div>
            <div className="di-entry-cell">
              <label>Pc(s)</label>
              <input
                ref={pcsRef}
                type="number"
                className="di-num-input"
                style={{ width: 60 }}
                value={curRow.pcs}
                min={1}
                onChange={(e) => updateCurRow("pcs", e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && rateRef.current?.focus()}
                onFocus={(e) => e.target.select()}
              />
            </div>
            <div className="di-entry-cell">
              <label>Rate</label>
              <input
                ref={rateRef}
                type="number"
                className="di-num-input"
                style={{ width: 80 }}
                value={curRow.rate}
                min={0}
                onChange={(e) => updateCurRow("rate", e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addRef.current?.click()}
                onFocus={(e) => e.target.select()}
              />
            </div>
            <div className="di-entry-cell">
              <label>Amount</label>
              <input
                className="di-num-input"
                style={{ width: 85 }}
                value={fmt(curRow.amount || 0)}
                readOnly
              />
            </div>
            <div className="di-entry-cell di-entry-btns-cell">
              <label>&nbsp;</label>
              <div className="di-entry-btns">
                <button className="xp-btn xp-btn-sm" onClick={resetCurRow}>
                  Reset
                </button>
                <button
                  ref={addRef}
                  className="xp-btn xp-btn-sm di-btn-add"
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
          <div className="di-table-header-bar">
            <span className="di-table-lbl">
              {curRow.name ? (
                <span className="di-cur-name">{curRow.name}</span>
              ) : (
                "Select Product"
              )}
            </span>
            <span className="di-table-qty">
              {totalQty.toLocaleString("en-PK")}
            </span>
          </div>

          {/* Items table */}
          <div className="di-items-wrap">
            <table className="di-items-table">
              <thead>
                <tr>
                  <th style={{ width: 32 }}>Sr.#</th>
                  <th style={{ width: 80 }}>Code</th>
                  <th>Name</th>
                  <th style={{ width: 65 }}>UOM</th>
                  <th style={{ width: 60 }}>Packing</th>
                  <th style={{ width: 55 }} className="r">
                    Pc(s)
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
                      Search and add damaged products
                    </td>
                  </tr>
                )}
                {items.map((r, i) => (
                  <tr
                    key={i}
                    className={selItemIdx === i ? "di-sel-row" : ""}
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
                    <td className="muted">{r.packing}</td>
                    <td className="r">{r.pcs}</td>
                    <td className="r">{fmt(r.rate)}</td>
                    <td
                      className="r"
                      style={{ color: "#b71c1c", fontWeight: 600 }}
                    >
                      {fmt(r.amount)}
                    </td>
                  </tr>
                ))}
                {Array.from({ length: EMPTY_ROWS }).map((_, i) => (
                  <tr key={`e${i}`} className="di-empty-row">
                    <td colSpan={8} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary bar */}
          <div className="di-summary-bar">
            <div className="di-sum-cell">
              <label>Total Quantity</label>
              <input
                className="di-sum-val"
                value={totalQty.toLocaleString("en-PK")}
                readOnly
              />
            </div>
            <div className="di-sum-cell">
              <label>Net Amount</label>
              <input className="di-sum-val" value={fmt(netAmount)} readOnly />
            </div>
            <div className="di-sum-cell">
              <label>Bill Amount</label>
              <input className="di-sum-val" value={fmt(billAmount)} readOnly />
            </div>
            <div className="di-sum-cell" style={{ marginLeft: "auto" }}>
              <label>Balance</label>
              <input className="di-sum-val" value={fmt(balance)} readOnly />
            </div>
          </div>

          {/* Buyer bar */}
          <div className="di-buyer-bar">
            <div className="di-cust-cell">
              <label>Code</label>
              <input
                className="di-cust-input"
                style={{ width: 55 }}
                value={buyerCode}
                onChange={(e) => setBuyerCode(e.target.value)}
              />
            </div>
            <div className="di-cust-cell" style={{ flex: 1 }}>
              <label>Buyer Name</label>
              <input
                className="di-cust-input"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
              />
            </div>
            <div className="di-cust-cell">
              <label>Previous Balance</label>
              <input
                type="number"
                className="di-cust-input"
                style={{ width: 100 }}
                value={previousBalance}
                onChange={(e) => setPreviousBalance(e.target.value)}
                onFocus={(e) => e.target.select()}
              />
            </div>
            <div className="di-cust-cell">
              <label>Net Receivable</label>
              <input
                className="di-cust-input di-net-recv"
                style={{ width: 100, color: "#b71c1c", fontWeight: 700 }}
                value={fmt(balance)}
                readOnly
              />
            </div>
          </div>
        </div>

        {/* Right — Hold Bills */}
        <div className="di-right">
          <div className="di-hold-panel">
            <div className="di-hold-title">
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
              <span className="di-hold-cnt">{holdBills.length}</span>
            </div>
            <div className="di-hold-table-wrap">
              <table className="di-hold-table">
                <thead>
                  <tr>
                    <th style={{ width: 24 }}>#</th>
                    <th>Bill #</th>
                    <th className="r">Amount</th>
                    <th>Buyer</th>
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
                          title="Click = preview · Dbl-click = resume"
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
                          <td className="r" style={{ color: "#b71c1c" }}>
                            {fmt(b.amount)}
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
            <div
              style={{
                display: "flex",
                gap: 4,
                padding: "4px 6px",
                borderTop: "1px solid var(--xp-silver-2)",
                borderBottom: "1px solid var(--xp-silver-2)",
              }}
            >
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
            <div
              style={{
                padding: "3px 8px",
                fontSize: 10,
                color: "#888",
                background: "var(--xp-silver-3)",
                borderTop: "1px solid var(--xp-silver-2)",
              }}
            >
              Click = preview · Dbl-click = resume · ✕ = delete
            </div>
          </div>
        </div>
      </div>

      {/* Command bar */}
      <div className="di-cmd-bar">
        <button
          className="xp-btn xp-btn-sm"
          onClick={fullReset}
          disabled={saving}
        >
          Refresh
        </button>
        <button
          ref={saveRef}
          className="xp-btn xp-btn-sm di-btn-save xp-btn-lg"
          onClick={openConfirm}
          disabled={saving}
        >
          {saving ? "Saving…" : "Save Record  F10"}
        </button>
        <button
          className="xp-btn xp-btn-sm"
          onClick={() => {
            if (!selRecId) return showMsg("Select a record first", "error");
            const r = savedRecords.find((x) => x._id === selRecId);
            if (r) handleLoad(r);
          }}
        >
          Edit Record
        </button>
        <button
          className="xp-btn xp-btn-danger xp-btn-sm"
          disabled={!selRecId}
          onClick={handleDelete}
        >
          Delete Record
        </button>
        <div className="xp-toolbar-divider" />
        <label className="di-check-label">
          <input
            type="checkbox"
            checked={sendSms}
            onChange={(e) => setSendSms(e.target.checked)}
          />{" "}
          Send SMS
        </label>
        <div className="xp-toolbar-divider" />
        <div className="di-print-types">
          {["Thermal", "A4", "A5"].map((pt) => (
            <label key={pt} className="di-check-label">
              <input
                type="radio"
                name="di-print"
                checked={printType === pt}
                onChange={() => setPrintType(pt)}
              />{" "}
              {pt}
            </label>
          ))}
        </div>
        <div className="xp-toolbar-divider" />
        <span className="di-inv-info">
          {invoiceNo} | Items: {items.length} | Total: {fmt(netAmount)}
        </span>
        <button
          className="xp-btn xp-btn-sm"
          style={{ marginLeft: "auto" }}
          onClick={fullReset}
        >
          Close
        </button>
      </div>

      {/* Saved Records */}
      <div className="di-saved-section">
        <div className="di-saved-header">
          <span className="di-saved-title">Saved Damage In Records</span>
          <div className="xp-search-wrap" style={{ flex: 1, maxWidth: 280 }}>
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
              placeholder="Search invoice / buyer..."
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
            disabled={!selRecId}
          >
            Delete
          </button>
        </div>
        <div className="di-saved-table-wrap">
          <table className="di-saved-table">
            <thead>
              <tr>
                <th style={{ width: 32 }}>#</th>
                <th style={{ width: 100 }}>Invoice #</th>
                <th style={{ width: 95 }}>Date</th>
                <th>Buyer</th>
                <th className="r" style={{ width: 55 }}>
                  Items
                </th>
                <th className="r" style={{ width: 55 }}>
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
                    Loading...
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
                    className={selRecId === rec._id ? "di-sel-rec" : ""}
                    onClick={() => setSelRecId(rec._id)}
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
                    <td className="r xp-amt" style={{ color: "#b71c1c" }}>
                      {fmt(rec.netAmount)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Status bar */}
      <div className="xp-statusbar">
        <div className="xp-status-pane">DI {invoiceNo}</div>
        <div className="xp-status-pane">{buyerName}</div>
        <div className="xp-status-pane">Items: {items.length}</div>
        <div className="xp-status-pane">Qty: {totalQty}</div>
        <div className="xp-status-pane">
          Net:{" "}
          <strong style={{ fontFamily: "var(--xp-mono)", marginLeft: 3 }}>
            PKR {fmt(netAmount)}
          </strong>
        </div>
        <div className="xp-status-pane">
          Hold: {holdBills.length} | Saved: {savedRecords.length}
        </div>
      </div>
    </div>
  );
}
