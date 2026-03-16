import { useState, useEffect, useRef, useCallback } from "react";
import "../styles/ManualBills.css";
import api from "../api/api.js";
import EP from "../api/apiEndpoints.js";

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

// ═══════════════════════════════════════════════════════════
// SEARCH MODAL
// ═══════════════════════════════════════════════════════════
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
            _rate: pk.purchaseRate || pk.saleRate,
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
          <span>
            <i className="bi bi-search"></i> Search Products
          </span>
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
                  <th className="r" style={{ width: 80 }}>
                    Purchase Rate
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

// ── Print ─────────────────────────────────────────────────────────────────────
function printBill(bill) {
  const rows = bill.items
    .map(
      (it, i) =>
        `<tr><td>${i + 1}</td><td>${it.description}</td><td>${it.measurement || ""}</td>
    <td align="right">${it.qty}</td><td align="right">${Number(it.rate).toLocaleString()}</td>
    <td align="right">${it.disc || 0}%</td><td align="right"><b>${Number(it.amount).toLocaleString()}</b></td></tr>`,
    )
    .join("");
  const win = window.open("", "_blank", "width=820,height=640");
  win.document
    .write(`<!DOCTYPE html><html><head><title>Purchase Bill ${bill.billNo}</title>
  <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;font-size:12px;padding:18px}
  h2{text-align:center;font-size:18px}h3{text-align:center;color:#555;font-size:11px;margin:2px 0 10px;letter-spacing:1px}
  .meta{display:flex;justify-content:space-between;border:1px solid #ccc;padding:6px 10px;margin-bottom:10px;flex-wrap:wrap;gap:4px;background:#f8f8f8}
  table{width:100%;border-collapse:collapse;margin-bottom:12px}
  th{background:#1a4a8a;color:#fff;padding:5px 7px;text-align:left;font-size:12px;border:1px solid #0a2a6a}
  td{border:1px solid #ccc;padding:4px 7px}tr:nth-child(even) td{background:#f5f5ff}
  .tots{float:right;min-width:200px;border:1px solid #ccc;padding:8px 12px;background:#f8f8f8}
  .tr{display:flex;justify-content:space-between;padding:2px 0;font-size:12px}
  .tr.b{font-weight:bold;font-size:14px;border-top:2px solid #333;margin-top:4px;padding-top:4px}
  .footer{text-align:center;margin-top:24px;color:#888;font-size:11px;clear:both;border-top:1px solid #ddd;padding-top:8px}
  @media print{body{padding:5mm}}</style></head><body>
  <h2>${SHOP}</h2><h3>PURCHASE BILL</h3>
  <div class="meta">
    <span><b>Bill #:</b> ${bill.billNo}</span>
    <span><b>Date:</b> ${bill.date}</span>
    ${bill.suppName ? `<span><b>Supplier:</b> ${bill.suppName}</span>` : ""}
    ${bill.suppPhone ? `<span><b>Phone:</b> ${bill.suppPhone}</span>` : ""}
    ${bill.suppInvoice ? `<span><b>Supp. Invoice:</b> ${bill.suppInvoice}</span>` : ""}
  </div>
  <table><thead><tr><th>#</th><th>Description</th><th>Meas</th><th align="right">Qty</th><th align="right">Rate</th><th align="right">Disc%</th><th align="right">Amount</th></tr></thead>
  <tbody>${rows}</tbody></table>
  <div class="tots">
    <div class="tr"><span>Sub Total</span><span>${Number(bill.subTotal).toLocaleString()}</span></div>
    ${bill.discAmt > 0 ? `<div class="tr" style="color:red"><span>Discount (${bill.extraDisc}%)</span><span>-${Number(bill.discAmt).toLocaleString()}</span></div>` : ""}
    <div class="tr b"><span>Net Total</span><span>Rs. ${Number(bill.netTotal).toLocaleString()}</span></div>
  </div>
  ${bill.remarks ? `<p style="clear:both;margin-top:8px;font-size:11px;color:#555"><b>Note:</b> ${bill.remarks}</p>` : ""}
  <div class="footer">— ${SHOP}</div></body></html>`);
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
    "\n" +
    `${"─".repeat(26)}\n${lines}\n${"─".repeat(26)}\n` +
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

// ═══════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════
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
    // Use purchaseRate if available, else saleRate
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
        } else if (i === rows.length - 1) addRowAfter(i);
        else {
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
    showMsg(`✅ Bill ${bill.billNo} ready`);
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
    <div className="mb-page">
      {showSearch && (
        <SearchModal
          allProducts={products}
          onSelect={handleProductSelect}
          onClose={() => setShowSearch(false)}
        />
      )}
      <div className={`mb-msg ${msg.text ? "show" : ""} ${msg.type}`}>
        {msg.text}
      </div>

      {/* Header */}
      <div className="mb-header purchase">
        <div className="mb-title">
          <i className="bi bi-box-seam"></i> Manual Purchase Bill
        </div>
        <div className="mb-header-fields">
          <div className="mb-hf">
            <span>Bill #</span>
            <input
              className="mb-hinput bold"
              value={billNo}
              readOnly
              tabIndex={-1}
            />
          </div>
          <div className="mb-hf">
            <span>Date</span>
            <input
              type="date"
              className="mb-hinput"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              tabIndex={-1}
            />
          </div>
        </div>
      </div>

      {/* Supplier bar */}
      <div className="mb-party-bar">
        <span className="mb-party-label">
          <i className="bi bi-shop"></i> Supplier
        </span>
        <input
          ref={suppRef}
          className="mb-party-input"
          value={suppName}
          onChange={(e) => setSuppName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") phoneRef.current?.focus();
          }}
          placeholder="Supplier name (optional)…"
          tabIndex={1}
        />
        <span className="mb-party-label">
          <i className="bi bi-telephone"></i> Phone
        </span>
        <input
          ref={phoneRef}
          className="mb-phone-input"
          value={suppPhone}
          onChange={(e) => setSuppPhone(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") invRef.current?.focus();
          }}
          placeholder="03xx-xxxxxxx"
          tabIndex={2}
        />
        <span className="mb-party-label">
          <i className="bi bi-file-text"></i> Supp. Invoice
        </span>
        <input
          ref={invRef}
          className="mb-phone-input"
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
          style={{ width: 130 }}
        />
      </div>

      {/* Hints */}
      <div className="mb-hints">
        <i className="bi bi-keyboard"></i>&nbsp; F2=New | F3=Search | F5=Save
        &amp; Print | Enter on Description=Search | Enter on last row=Next row |
        Ctrl+Del=Remove
      </div>

      {/* Table */}
      <div className="mb-table-wrap">
        <table className="mb-table">
          <thead>
            <tr>
              <th style={{ width: 28 }}>#</th>
              <th style={{ width: 75 }}>Code</th>
              <th>Description</th>
              <th style={{ width: 80 }}>Meas.</th>
              <th style={{ width: 60 }} className="r">
                Qty
              </th>
              <th style={{ width: 85 }} className="r">
                Rate
              </th>
              <th style={{ width: 55 }} className="r">
                Disc%
              </th>
              <th style={{ width: 90 }} className="r">
                Amount
              </th>
              <th style={{ width: 24 }}></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              ensureRef(i);
              return (
                <tr
                  key={i}
                  className={
                    i === activeRow
                      ? "mb-row-active"
                      : i % 2 === 0
                        ? "mb-row-even"
                        : "mb-row-odd"
                  }
                  onClick={() => setActiveRow(i)}
                >
                  <td className="mb-td-num">{i + 1}</td>
                  <td style={{ padding: 0 }}>
                    <input
                      className="mb-cell full"
                      value={row.code}
                      readOnly
                      style={{
                        background: "transparent",
                        color: "#1a3a9a",
                        fontWeight: "bold",
                      }}
                      tabIndex={-1}
                    />
                  </td>
                  <td>
                    <input
                      className="mb-cell full"
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
                      style={
                        row.description
                          ? { fontWeight: "bold" }
                          : { color: "#aaa" }
                      }
                      tabIndex={10 + i * 10 + 1}
                    />
                  </td>
                  <td style={{ padding: 0 }}>
                    <input
                      className="mb-cell"
                      value={row.measurement}
                      readOnly
                      style={{ background: "transparent" }}
                      tabIndex={-1}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className="mb-cell r"
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
                      className="mb-cell r"
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
                      className="mb-cell r"
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
                  <td
                    className="r bold"
                    style={{
                      padding: "0 6px",
                      fontSize: 12,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {fmt(row.amount)}
                  </td>
                  <td className="mb-td-del">
                    <button
                      className="mb-del-btn"
                      onClick={() => deleteRow(i)}
                      tabIndex={-1}
                    >
                      <i className="bi bi-x"></i>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="mb-footer">
        <div className="mb-footer-left">
          <div className="mb-remarks-row">
            <span>
              <i className="bi bi-chat-left-text"></i> Note
            </span>
            <input
              className="mb-remarks-input"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") discRef.current?.focus();
              }}
              placeholder="Remarks…"
              tabIndex={90}
            />
          </div>
          <div className="mb-btns">
            <button
              className="mb-btn"
              onClick={() => {
                setActiveRow(rows.length - 1);
                addRowAfter(rows.length - 1);
              }}
              tabIndex={-1}
            >
              <i className="bi bi-plus-lg"></i> Add Row
            </button>
            <button className="mb-btn orange" onClick={resetForm} tabIndex={-1}>
              <i className="bi bi-arrow-counterclockwise"></i> F2 New
            </button>
            <button
              className="mb-btn green"
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
              <i className="bi bi-printer"></i> Print
            </button>
            <button
              className="mb-btn wa"
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
              <i className="bi bi-whatsapp"></i> WhatsApp
            </button>
            <button
              ref={saveRef}
              className="mb-btn primary"
              onClick={handleSave}
              disabled={saving}
              tabIndex={91}
            >
              <i className="bi bi-floppy"></i>{" "}
              {saving ? "…" : "F5 Save & Print"}
            </button>
          </div>
        </div>
        <div className="mb-totals">
          <div className="mb-tr">
            <span>Sub Total</span>
            <span className="bold">{fmt(subTotal)}</span>
          </div>
          <div className="mb-tr">
            <span>Extra Disc%</span>
            <input
              ref={discRef}
              type="number"
              className="mb-tot-input"
              value={extraDisc}
              onChange={(e) => setExtraDisc(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveRef.current?.focus();
              }}
              tabIndex={89}
            />
          </div>
          {discAmt > 0 && (
            <div className="mb-tr">
              <span>Disc Amt</span>
              <span className="red bold">-{fmt(discAmt)}</span>
            </div>
          )}
          <div className="mb-tr bold big">
            <span>Net Total</span>
            <span className="blue">Rs. {fmt(netTotal)}</span>
          </div>
          <div
            className="mb-tr"
            style={{ fontSize: 11, color: "#888", marginTop: 2 }}
          >
            <span>
              <i className="bi bi-list-ol"></i> Items
            </span>
            <span>{rows.filter((r) => r.description).length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
