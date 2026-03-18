import { useState, useEffect, useRef, useCallback } from "react";
import api from "../api/api.js";
import EP from "../api/apiEndpoints.js";
import "../styles/theme.css";
import "../styles/ManualPurchasePage.css";

const isoDate = () => new Date().toISOString().split("T")[0];
const fmt = (n) => Number(n || 0).toLocaleString("en-PK");
const SHOP = "Asim Electric and Electronic Store";
const EMPTY_ROW = {
  code: "",
  description: "",
  measurement: "",
  qty: 1,
  rate: 0,
  disc: 0,
  amount: 0,
};

/* ─────────────────────────────────────────────────────────────
   PRODUCT SEARCH MODAL
───────────────────────────────────────────────────────────── */
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
    const ld = d.trim().toLowerCase(),
      lc = c.trim().toLowerCase(),
      lo = co.trim().toLowerCase();
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
      if (p.packingInfo?.length > 0)
        p.packingInfo.forEach((pk, i) =>
          res.push({
            ...p,
            _pi: i,
            _meas: pk.measurement,
            _rate: pk.purchaseRate || pk.saleRate,
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
          <span className="xp-modal-title">
            Search Products (Purchase Rate)
          </span>
          <button className="xp-cap-btn xp-cap-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* filters */}
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
            <span
              style={{
                fontSize: "var(--xp-fs-xs)",
                color: "#555",
                whiteSpace: "nowrap",
              }}
            >
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

/* ─────────────────────────────────────────────────────────────
   PRINT & SHARE
───────────────────────────────────────────────────────────── */
function printBill(bill) {
  const rows = bill.items
    .map(
      (it, i) =>
        `<tr><td>${i + 1}</td><td>${it.description}</td><td>${it.measurement || ""}</td><td align="right">${it.qty}</td><td align="right">${Number(it.rate).toLocaleString()}</td><td align="right">${it.disc || 0}%</td><td align="right"><b>${Number(it.amount).toLocaleString()}</b></td></tr>`,
    )
    .join("");
  const win = window.open("", "_blank", "width=820,height=640");
  win.document
    .write(`<!DOCTYPE html><html><head><title>Purchase Bill ${bill.billNo}</title>
  <style>body{font-family:Arial,sans-serif;font-size:12px;padding:18px}h2,h3{margin:0 0 4px}table{width:100%;border-collapse:collapse;margin-top:10px}th,td{border:1px solid #ccc;padding:5px}th{background:#e8e8e8}.meta{display:flex;gap:16px;flex-wrap:wrap;margin:8px 0;font-size:12px}.tots{float:right;min-width:200px;margin-top:10px}.tr{display:flex;justify-content:space-between;padding:2px 0}.tr.b{font-weight:bold;border-top:1px solid #000;margin-top:4px}.thanks{text-align:center;margin-top:30px;font-size:11px;color:#888;clear:both}</style></head><body>
  <h2>${SHOP}</h2><h3>PURCHASE BILL</h3>
  <div class="meta"><span><b>Bill #:</b> ${bill.billNo}</span><span><b>Date:</b> ${bill.date}</span>${bill.suppName ? `<span><b>Supplier:</b> ${bill.suppName}</span>` : ""}${bill.suppPhone ? `<span><b>Phone:</b> ${bill.suppPhone}</span>` : ""}${bill.suppInvoice ? `<span><b>Supp. Invoice:</b> ${bill.suppInvoice}</span>` : ""}</div>
  <table><thead><tr><th>#</th><th>Description</th><th>Meas</th><th align="right">Qty</th><th align="right">Rate</th><th align="right">Disc%</th><th align="right">Amount</th></tr></thead><tbody>${rows}</tbody></table>
  <div class="tots"><div class="tr"><span>Sub Total</span><span>${Number(bill.subTotal).toLocaleString()}</span></div>${bill.discAmt > 0 ? `<div class="tr"><span>Discount (${bill.extraDisc}%)</span><span>-${Number(bill.discAmt).toLocaleString()}</span></div>` : ""}<div class="tr b"><span>Net Total</span><span>Rs. ${Number(bill.netTotal).toLocaleString()}</span></div></div>
  ${bill.remarks ? `<p style="clear:both"><b>Note:</b> ${bill.remarks}</p>` : ""}
  <div class="thanks">Thank you! — ${SHOP}</div></body></html>`);
  win.document.close();
  setTimeout(() => win.print(), 400);
}

function shareWA(bill) {
  const lines = bill.items
    .map(
      (it, i) =>
        `${i + 1}. ${it.description}${it.measurement ? " (" + it.measurement + ")" : ""}  ${it.qty}×${Number(it.rate).toLocaleString()}${it.disc > 0 ? " -" + it.disc + "%" : ""} = *${Number(it.amount).toLocaleString()}*`,
    )
    .join("\n");
  const msg =
    `*${SHOP}*\n📦 *Purchase Bill #${bill.billNo}*\n📅 ${bill.date}\n` +
    (bill.suppName ? `🏪 ${bill.suppName}  ` : "") +
    (bill.suppPhone ? `📞 ${bill.suppPhone}` : "") +
    (bill.suppInvoice ? `\n📋 Supp.Inv: ${bill.suppInvoice}` : "") +
    `\n${"─".repeat(26)}\n${lines}\n${"─".repeat(26)}\n` +
    (bill.discAmt > 0
      ? `Sub Total: ${Number(bill.subTotal).toLocaleString()}\nDiscount: -${Number(bill.discAmt).toLocaleString()}\n`
      : "") +
    `*Net Total: Rs. ${Number(bill.netTotal).toLocaleString()}*`;
  const ph = bill.suppPhone?.replace(/[^0-9]/g, "");
  const url = ph
    ? `https://wa.me/92${ph.replace(/^0/, "")}?text=${encodeURIComponent(msg)}`
    : `https://wa.me/?text=${encodeURIComponent(msg)}`;
  window.open(url, "_blank");
}

const getNextNo = () => {
  const n = parseInt(localStorage.getItem("mpurch_counter") || "0") + 1;
  localStorage.setItem("mpurch_counter", String(n));
  return `MP-${String(n).padStart(5, "0")}`;
};

/* ─────────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────────── */
export default function ManualPurchasePage() {
  const initNo = () => {
    const n = parseInt(localStorage.getItem("mpurch_counter") || "0") + 1;
    return `MP-${String(n).padStart(5, "0")}`;
  };

  const [billNo, setBillNo] = useState(initNo);
  const [date, setDate] = useState(isoDate());
  const [suppName, setSuppName] = useState("");
  const [suppPhone, setSuppPhone] = useState("");
  const [suppInvoice, setSuppInvoice] = useState("");
  const [rows, setRows] = useState([{ ...EMPTY_ROW }]);
  const [activeRow, setActiveRow] = useState(0);
  const [extraDisc, setExtraDisc] = useState(0);
  const [remarks, setRemarks] = useState("");
  const [products, setProducts] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [msg, setMsg] = useState({ text: "", type: "" });
  const [saving, setSaving] = useState(false);

  const suppRef = useRef(null);
  const phoneRef = useRef(null);
  const invRef = useRef(null);
  const discRef = useRef(null);
  const saveRef = useRef(null);
  const rowRefs = useRef([]);

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
        handleSave();
      }
      if (e.key === "F2") {
        e.preventDefault();
        resetForm();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [rows, suppName, suppPhone, suppInvoice, extraDisc, remarks]);

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
        amount: Math.round(qty * rate),
      };
      return next;
    });
    setShowSearch(false);
    setTimeout(() => {
      ensureRef(activeRow);
      rowRefs.current[activeRow]?.qty?.focus();
    }, 30);
  };

  const ensureRef = (i) => {
    if (!rowRefs.current[i]) rowRefs.current[i] = {};
  };

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

  const onKey = (e, i, field) => {
    if (e.key === "Delete" && e.ctrlKey) {
      e.preventDefault();
      deleteRow(i);
      return;
    }
    if (e.key === "F3") {
      e.preventDefault();
      setActiveRow(i);
      setShowSearch(true);
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (field === "desc") {
        setActiveRow(i);
        setShowSearch(true);
      } else {
        const order = ["qty", "rate", "disc"];
        const fi = order.indexOf(field);
        if (fi < order.length - 1) {
          ensureRef(i);
          rowRefs.current[i]?.[order[fi + 1]]?.focus();
        } else if (i === rows.length - 1) {
          addRowAfter(i);
        } else {
          ensureRef(i + 1);
          setActiveRow(i + 1);
          setTimeout(() => setShowSearch(true), 30);
        }
      }
    }
  };

  const getBill = () => ({
    billNo,
    date,
    suppName,
    suppPhone,
    suppInvoice,
    items: rows.filter((r) => r.description && r.qty > 0),
    subTotal,
    discAmt,
    netTotal,
    extraDisc,
    remarks,
  });

  const handleSave = () => {
    const bill = getBill();
    if (!bill.items.length) {
      showMsg("Add at least one item", "error");
      return;
    }
    setSaving(true);
    printBill(bill);
    showMsg(`Bill ${bill.billNo} ready`);
    setTimeout(() => {
      resetForm();
      setSaving(false);
    }, 400);
  };

  const resetForm = () => {
    setBillNo(getNextNo());
    setDate(isoDate());
    setSuppName("");
    setSuppPhone("");
    setSuppInvoice("");
    setRows([{ ...EMPTY_ROW }]);
    setActiveRow(0);
    setExtraDisc(0);
    setRemarks("");
    setTimeout(() => suppRef.current?.focus(), 30);
  };

  return (
    <div className="mp-page">
      {showSearch && (
        <SearchModal
          allProducts={products}
          onSelect={handleProductSelect}
          onClose={() => setShowSearch(false)}
        />
      )}

      {/* ── Titlebar ── */}
      <div className="xp-titlebar">
        <svg
          width="15"
          height="15"
          viewBox="0 0 16 16"
          fill="rgba(255,255,255,0.85)"
        >
          <path d="M0 1.5A.5.5 0 0 1 .5 1H2a.5.5 0 0 1 .485.379L2.89 3H14.5a.5.5 0 0 1 .491.592l-1.5 8A.5.5 0 0 1 13 12H4a.5.5 0 0 1-.491-.408L2.01 3.607 1.61 2H.5a.5.5 0 0 1-.5-.5M3.102 4l1.313 7h8.17l1.313-7zM5 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4m7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4" />
        </svg>
        <span className="xp-tb-title">Manual Purchase Bill — {SHOP}</span>
        <div className="xp-tb-actions">
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
          style={{ margin: "4px 10px 0" }}
        >
          {msg.text}
        </div>
      )}

      <div className="mp-body">
        {/* ── Header ── */}
        <div className="mp-header">
          <div className="mp-header-title">
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="var(--xp-blue-dark)"
            >
              <path d="M0 1.5A.5.5 0 0 1 .5 1H2a.5.5 0 0 1 .485.379L2.89 3H14.5a.5.5 0 0 1 .491.592l-1.5 8A.5.5 0 0 1 13 12H4a.5.5 0 0 1-.491-.408L2.01 3.607 1.61 2H.5a.5.5 0 0 1-.5-.5M3.102 4l1.313 7h8.17l1.313-7zM5 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4m7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4" />
            </svg>
            Manual Purchase Bill
          </div>
          <div className="mp-field-pair">
            <label>Bill #</label>
            <input
              className="xp-input"
              style={{ width: 110 }}
              value={billNo}
              readOnly
              tabIndex={-1}
            />
          </div>
          <div className="mp-field-pair">
            <label>Date</label>
            <input
              type="date"
              className="xp-input"
              style={{ width: 140 }}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              tabIndex={-1}
            />
          </div>
        </div>

        {/* ── Supplier Strip ── */}
        <div className="mp-supplier-strip">
          <label>Supplier</label>
          <input
            ref={suppRef}
            className="mp-supplier-input"
            value={suppName}
            onChange={(e) => setSuppName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") phoneRef.current?.focus();
            }}
            placeholder="Supplier name (optional)…"
            tabIndex={1}
          />

          <label>Phone</label>
          <input
            ref={phoneRef}
            className="mp-supplier-input"
            style={{ maxWidth: 140 }}
            value={suppPhone}
            onChange={(e) => setSuppPhone(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") invRef.current?.focus();
            }}
            placeholder="03xx-xxxxxxx"
            tabIndex={2}
          />

          <label>Supp. Invoice</label>
          <input
            ref={invRef}
            className="mp-supplier-input"
            style={{ maxWidth: 140 }}
            value={suppInvoice}
            onChange={(e) => setSuppInvoice(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setActiveRow(0);
                setShowSearch(true);
              }
            }}
            placeholder="Invoice # (optional)"
            tabIndex={3}
          />

          <div className="xp-toolbar-divider" />

          {/* hint inline */}
          <div
            style={{
              fontSize: "var(--xp-fs-xs)",
              color: "#666",
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <span>
              <span
                style={{
                  fontFamily: "var(--xp-mono)",
                  fontWeight: 700,
                  color: "var(--xp-blue-dark)",
                }}
              >
                F3
              </span>{" "}
              Search
            </span>
            <span>
              <span
                style={{
                  fontFamily: "var(--xp-mono)",
                  fontWeight: 700,
                  color: "var(--xp-blue-dark)",
                }}
              >
                F5
              </span>{" "}
              Save
            </span>
            <span>
              <span
                style={{
                  fontFamily: "var(--xp-mono)",
                  fontWeight: 700,
                  color: "var(--xp-blue-dark)",
                }}
              >
                F2
              </span>{" "}
              New
            </span>
            <span>
              <span
                style={{
                  fontFamily: "var(--xp-mono)",
                  fontWeight: 700,
                  color: "var(--xp-blue-dark)",
                }}
              >
                Ctrl+Del
              </span>{" "}
              Remove Row
            </span>
          </div>
        </div>

        {/* ── Items Table ── */}
        <div className="mp-items-panel">
          <table className="mp-items-table">
            <thead>
              <tr>
                <th style={{ width: 30 }}>#</th>
                <th style={{ width: 75 }}>Code</th>
                <th>Description</th>
                <th style={{ width: 65 }}>Meas.</th>
                <th style={{ width: 60 }} className="r">
                  Qty
                </th>
                <th style={{ width: 90 }} className="r">
                  Rate
                </th>
                <th style={{ width: 55 }} className="r">
                  Disc%
                </th>
                <th style={{ width: 100 }} className="r">
                  Amount
                </th>
                <th style={{ width: 26 }}></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                ensureRef(i);
                return (
                  <tr
                    key={i}
                    className={activeRow === i ? "mp-active-row" : ""}
                    onClick={() => setActiveRow(i)}
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
                      <input
                        className="mp-cell-in w-code"
                        value={row.code}
                        readOnly
                        tabIndex={-1}
                      />
                    </td>
                    <td>
                      <input
                        className="mp-cell-in desc"
                        ref={(el) => {
                          ensureRef(i);
                          rowRefs.current[i].desc = el;
                        }}
                        value={row.description}
                        onChange={(e) =>
                          updateRow(i, "description", e.target.value)
                        }
                        onKeyDown={(e) => onKey(e, i, "desc")}
                        onClick={() => {
                          setActiveRow(i);
                          setShowSearch(true);
                        }}
                        placeholder="Click or Enter to search…"
                        tabIndex={10 + i * 10 + 1}
                      />
                    </td>
                    <td>
                      <input
                        className="mp-cell-in w-meas"
                        value={row.measurement}
                        readOnly
                        tabIndex={-1}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="mp-cell-in w-sm"
                        ref={(el) => {
                          ensureRef(i);
                          rowRefs.current[i].qty = el;
                        }}
                        value={row.qty}
                        onChange={(e) => updateRow(i, "qty", e.target.value)}
                        onKeyDown={(e) => onKey(e, i, "qty")}
                        tabIndex={10 + i * 10 + 2}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="mp-cell-in w-md"
                        ref={(el) => {
                          ensureRef(i);
                          rowRefs.current[i].rate = el;
                        }}
                        value={row.rate}
                        onChange={(e) => updateRow(i, "rate", e.target.value)}
                        onKeyDown={(e) => onKey(e, i, "rate")}
                        tabIndex={10 + i * 10 + 3}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="mp-cell-in w-sm"
                        ref={(el) => {
                          ensureRef(i);
                          rowRefs.current[i].disc = el;
                        }}
                        value={row.disc}
                        onChange={(e) => updateRow(i, "disc", e.target.value)}
                        onKeyDown={(e) => onKey(e, i, "disc")}
                        tabIndex={10 + i * 10 + 4}
                      />
                    </td>
                    <td className="mp-amt">{fmt(row.amount)}</td>
                    <td style={{ textAlign: "center" }}>
                      <button
                        className="xp-btn xp-btn-sm xp-btn-ico"
                        onClick={() => deleteRow(i)}
                        tabIndex={-1}
                        style={{
                          width: 20,
                          height: 20,
                          fontSize: 9,
                          color: "var(--xp-red)",
                        }}
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

        {/* ── Bottom ── */}
        <div className="mp-bottom">
          {/* Left: remarks + buttons */}
          <div className="mp-actions-col">
            <div className="mp-remarks-row">
              <label>Note</label>
              <input
                className="mp-remarks-input"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") discRef.current?.focus();
                }}
                placeholder="Remarks…"
                tabIndex={90}
              />
            </div>
            <div className="mp-btn-row">
              <button
                className="xp-btn xp-btn-sm"
                onClick={() => {
                  setActiveRow(rows.length - 1);
                  addRowAfter(rows.length - 1);
                }}
                tabIndex={-1}
              >
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
                  <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4" />
                </svg>
                Add Row
              </button>
              <button
                className="xp-btn xp-btn-sm"
                onClick={resetForm}
                tabIndex={-1}
              >
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2z" />
                  <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466" />
                </svg>
                F2 New
              </button>
              <button
                className="xp-btn xp-btn-sm"
                onClick={() => {
                  const b = getBill();
                  if (!b.items.length) {
                    showMsg("Add items", "error");
                    return;
                  }
                  printBill(b);
                }}
                tabIndex={-1}
              >
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <path d="M2.5 8a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1" />
                  <path d="M5 1a2 2 0 0 0-2 2v2H2a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h1v1a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-1h1a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-1V3a2 2 0 0 0-2-2z" />
                </svg>
                Print
              </button>
              <button
                className="xp-btn xp-btn-wa xp-btn-sm"
                onClick={() => {
                  const b = getBill();
                  if (!b.items.length) {
                    showMsg("Add items", "error");
                    return;
                  }
                  shareWA(b);
                }}
                tabIndex={-1}
              >
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326z" />
                </svg>
                WhatsApp
              </button>
              <button
                ref={saveRef}
                className="xp-btn xp-btn-primary xp-btn-lg"
                onClick={handleSave}
                disabled={saving}
                tabIndex={91}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <path d="M2 1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H9.5a1 1 0 0 0-1 1v7.293l2.646-2.647a.5.5 0 0 1 .708.708l-3.5 3.5a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L7.5 9.293V2a2 2 0 0 1 2-2H14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2z" />
                </svg>
                {saving ? "…" : "F5 Save & Print"}
              </button>
            </div>
          </div>

          {/* Right: totals */}
          <div className="mp-totals-box">
            <div className="mp-total-row">
              <label>Sub Total</label>
              <span className="mp-val">{fmt(subTotal)}</span>
            </div>
            <div className="mp-total-row">
              <label>Extra Disc%</label>
              <input
                ref={discRef}
                type="number"
                className="mp-disc-input"
                value={extraDisc}
                onChange={(e) => setExtraDisc(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveRef.current?.focus();
                }}
                tabIndex={89}
              />
            </div>
            {discAmt > 0 && (
              <div className="mp-total-row">
                <label>Disc Amt</label>
                <span className="mp-val danger">-{fmt(discAmt)}</span>
              </div>
            )}
            <div className="mp-total-row highlight">
              <label>Net Total</label>
              <span className="mp-val blue">PKR {fmt(netTotal)}</span>
            </div>
            <div className="mp-total-row">
              <label>Items</label>
              <span className="mp-val">
                {rows.filter((r) => r.description).length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Status Bar ── */}
      <div className="xp-statusbar">
        <div className="xp-status-pane">
          <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
            <path d="M0 1.5A.5.5 0 0 1 .5 1H2a.5.5 0 0 1 .485.379L2.89 3H14.5a.5.5 0 0 1 .491.592l-1.5 8A.5.5 0 0 1 13 12H4a.5.5 0 0 1-.491-.408L2.01 3.607z" />
          </svg>
          Bill: {billNo}
        </div>
        <div className="xp-status-pane">{suppName || "No supplier"}</div>
        <div className="xp-status-pane">
          Items: {rows.filter((r) => r.description).length}
        </div>
        <div className="xp-status-pane">
          Net:{" "}
          <strong
            style={{
              fontFamily: "var(--xp-mono)",
              marginLeft: 3,
              color: "var(--xp-blue-dark)",
            }}
          >
            PKR {fmt(netTotal)}
          </strong>
        </div>
      </div>
    </div>
  );
}
