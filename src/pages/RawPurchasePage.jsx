// RawPurchasePage.jsx — Raw / Wholesale Purchase
// Theme: xp-* classes from theme.css
import { useState, useEffect, useRef, useCallback } from "react";
import api from "../api/api.js";
import EP from "../api/apiEndpoints.js";
import "../styles/theme.css";
import "../styles/RawSalePage.css"; // shared CSS

const isoDate = () => new Date().toISOString().split("T")[0];
const fmt = (n) => Number(n || 0).toLocaleString("en-PK");
const SHOP = "Asim Electric and Electronic Store";
const EMPTY_ROW = {
  productId: "",
  code: "",
  description: "",
  measurement: "",
  qty: 1,
  rate: 0,
  disc: 0,
  amount: 0,
};

// ── Product Search Modal ───────────────────────────────────────────────────
function ProductModal({ allProducts, onSelect, onClose }) {
  const [desc, setDesc] = useState("");
  const [cat, setCat] = useState("");
  const [comp, setComp] = useState("");
  const [rows, setRows] = useState([]);
  const [hiIdx, setHiIdx] = useState(0);
  const rDesc = useRef(null),
    rCat = useRef(null),
    rComp = useRef(null),
    tbRef = useRef(null);

  const buildFlat = useCallback((prods, d, c, co) => {
    const ld = d.trim().toLowerCase(),
      lc = c.trim().toLowerCase(),
      lo = co.trim().toLowerCase(),
      res = [];
    prods.forEach((p) => {
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
    const f = buildFlat(allProducts, desc, cat, comp);
    setRows(f);
    setHiIdx(f.length > 0 ? 0 : -1);
  }, [desc, cat, comp, allProducts, buildFlat]);
  useEffect(() => {
    tbRef.current?.children[hiIdx]?.scrollIntoView({ block: "nearest" });
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
        : (tbRef.current?.focus(), setHiIdx((h) => Math.max(0, h)));
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
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="xp-modal xp-modal-lg">
        <div className="xp-modal-tb">
          <span className="xp-modal-title">🔍 Search Products</span>
          <button className="xp-cap-btn xp-cap-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div
          style={{
            display: "flex",
            gap: 8,
            padding: "8px 12px",
            background: "var(--xp-silver-1)",
            borderBottom: "1px solid #c8c0b0",
            flexWrap: "wrap",
            alignItems: "flex-end",
          }}
        >
          {[
            {
              label: "Description",
              val: desc,
              set: setDesc,
              ref: rDesc,
              nr: rCat,
              ph: "Name / code…",
            },
            {
              label: "Category",
              val: cat,
              set: setCat,
              ref: rCat,
              nr: rComp,
              ph: "e.g. SMALL",
            },
            {
              label: "Company",
              val: comp,
              set: setComp,
              ref: rComp,
              nr: null,
              ph: "e.g. LUX",
            },
          ].map((f) => (
            <div
              key={f.label}
              style={{ display: "flex", flexDirection: "column", gap: 2 }}
            >
              <label className="xp-label">{f.label}</label>
              <input
                ref={f.ref}
                className="xp-input"
                style={{ width: 160 }}
                value={f.val}
                onChange={(e) => f.set(e.target.value)}
                onKeyDown={(e) => fk(e, f.nr)}
                placeholder={f.ph}
                autoComplete="off"
              />
            </div>
          ))}
          <div style={{ display: "flex", alignItems: "flex-end", gap: 6 }}>
            <span style={{ fontSize: 11, color: "#666" }}>
              {rows.length} result(s)
            </span>
            <button className="xp-btn xp-btn-sm" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
        <div style={{ flex: 1, overflow: "auto", maxHeight: "55vh" }}>
          <table className="xp-table" style={{ width: "100%" }}>
            <thead>
              <tr>
                <th style={{ width: 40 }}>Sr.#</th>
                <th style={{ width: 80 }}>Code</th>
                <th>Name</th>
                <th style={{ width: 90 }}>Meas.</th>
                <th className="r" style={{ width: 70 }}>
                  Rate
                </th>
                <th className="r" style={{ width: 65 }}>
                  Stock
                </th>
                <th className="r" style={{ width: 55 }}>
                  Pack
                </th>
              </tr>
            </thead>
            <tbody
              ref={tbRef}
              tabIndex={0}
              onKeyDown={tk}
              style={{ outline: "none" }}
            >
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="xp-empty" style={{ padding: 20 }}>
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
        <div className="rs-modal-hint">
          ↑↓ navigate | Enter/Double-click = select | Esc = close | Tab =
          filters
        </div>
      </div>
    </div>
  );
}

// ── Print ──────────────────────────────────────────────────────────────────
function printBill(sale) {
  const rows = (sale.items || [])
    .map(
      (it, i) =>
        `<tr><td>${i + 1}</td><td>${it.description}</td><td>${it.measurement || ""}</td><td align="right">${it.qty}</td><td align="right">${Number(it.rate).toLocaleString()}</td><td align="right">${it.disc || 0}%</td><td align="right"><b>${Number(it.amount).toLocaleString()}</b></td></tr>`,
    )
    .join("");
  const w = window.open("", "_blank", "width=900,height=700");
  w.document.write(`<!DOCTYPE html><html><head><title>${sale.invoiceNo}</title>
  <style>body{font-family:Arial,sans-serif;font-size:12px;padding:20px}h2{text-align:center}h3{text-align:center;color:#555;font-size:11px;letter-spacing:1px;margin:2px 0 10px}
  .meta{display:flex;justify-content:space-between;flex-wrap:wrap;gap:4px;border:1px solid #ccc;padding:6px 10px;margin:8px 0;background:#f8f8f8}
  table{width:100%;border-collapse:collapse}th{background:#e67e22;color:#fff;padding:5px 7px;border:1px solid #d35400}td{border:1px solid #ccc;padding:4px 7px}
  tr:nth-child(even)td{background:#fef9f5}.tots{float:right;min-width:210px;border:1px solid #ccc;padding:8px 12px;background:#f8f8f8;margin-top:10px}
  .tr{display:flex;justify-content:space-between;padding:2px 0;font-size:12px}.tr.b{font-weight:bold;font-size:14px;border-top:2px solid #333;margin-top:4px}
  .footer{text-align:center;margin-top:24px;color:#888;font-size:11px;clear:both;border-top:1px dashed #ccc;padding-top:8px}@media print{body{padding:5mm}}</style>
  </head><body><h2>${SHOP}</h2><h3>◆ RAW PURCHASE INVOICE ◆</h3>
  <div class="meta"><span><b>Invoice:</b> ${sale.invoiceNo}</span><span><b>Date:</b> ${sale.invoiceDate}</span>
  ${sale.supplierName && sale.supplierName !== "COUNTER SALE" ? `<span><b>Customer:</b> ${sale.supplierName}${sale.supplierPhone ? " | " + sale.supplierPhone : ""}</span>` : ""}
  <span><b>Payment:</b> ${sale.paymentMode}</span></div>
  <table><thead><tr><th>#</th><th>Description</th><th>Meas</th><th align="right">Qty</th><th align="right">Rate</th><th align="right">Disc%</th><th align="right">Amount</th></tr></thead><tbody>${rows}</tbody></table>
  <div class="tots">
    <div class="tr"><span>Sub Total</span><span>Rs. ${Number(sale.subTotal).toLocaleString()}</span></div>
    ${(sale.discAmount || 0) > 0 ? `<div class="tr" style="color:red"><span>Discount</span><span>-Rs. ${Number(sale.discAmount).toLocaleString()}</span></div>` : ""}
    <div class="tr b"><span>Net Total</span><span>Rs. ${Number(sale.netTotal).toLocaleString()}</span></div>
    ${(sale.paidAmount || 0) > 0 ? `<div class="tr" style="color:green"><span>Paid</span><span>Rs. ${Number(sale.paidAmount).toLocaleString()}</span></div>` : ""}
    ${(sale.balance || 0) > 0 ? `<div class="tr b" style="color:red"><span>Balance</span><span>Rs. ${Number(sale.balance).toLocaleString()}</span></div>` : ""}
  </div>
  ${sale.remarks ? `<p style="clear:both;margin-top:8px;font-size:11px;color:#555"><b>Remarks:</b> ${sale.remarks}</p>` : ""}
  <div class="footer">Thank you! — ${SHOP}</div></body></html>`);
  w.document.close();
  setTimeout(() => w.print(), 400);
}

function shareWA(sale) {
  const lines = (sale.items || [])
    .map(
      (it, i) =>
        `${i + 1}. ${it.description}${it.measurement ? " (" + it.measurement + ")" : ""}  ${it.qty}×${Number(it.rate).toLocaleString()}${it.disc > 0 ? " -" + it.disc + "%" : ""} = *${Number(it.amount).toLocaleString()}*`,
    )
    .join("\n");
  const msg =
    `*${SHOP}*\n🏷 *Raw Sale — ${sale.invoiceNo}*\n📅 ${sale.invoiceDate}\n` +
    (sale.supplierName && sale.supplierName !== "COUNTER SALE"
      ? `👤 ${sale.supplierName}${sale.supplierPhone ? "  📞 " + sale.supplierPhone : ""}\n`
      : "") +
    `${"─".repeat(26)}\n${lines}\n${"─".repeat(26)}\n*Net Total: Rs. ${Number(sale.netTotal).toLocaleString()}*` +
    ((sale.balance || 0) > 0
      ? `\n⚠️ Balance: Rs. ${Number(sale.balance).toLocaleString()}`
      : "");
  const ph = sale.supplierPhone?.replace(/[^0-9]/g, "");
  window.open(
    ph
      ? `https://wa.me/92${ph.replace(/^0/, "")}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`,
    "_blank",
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function RawPurchasePage() {
  const [invoiceNo, setInvoiceNo] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(isoDate());
  const [supplier, setSupplier] = useState(null);
  const [phone, setPhone] = useState("");
  const [rows, setRows] = useState([{ ...EMPTY_ROW }]);
  const [activeRow, setActiveRow] = useState(0);
  const [extraDisc, setExtraDisc] = useState(0);
  const [cashPaid, setCashPaid] = useState(0);
  const [payMode, setPayMode] = useState("Cash");
  const [remarks, setRemarks] = useState("");
  const [products, setProducts] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [msg, setMsg] = useState({ text: "", type: "" });
  const [saving, setSaving] = useState(false);
  const [holds, setHolds] = useState([]);
  const [savedSale, setSavedSale] = useState(null);
  const [showInvoice, setShowInvoice] = useState(false);

  const phoneRef = useRef(null);
  const cashRef = useRef(null);
  const saveRef = useRef(null);
  const rowRefs = useRef([]);

  const subTotal = rows.reduce((s, r) => s + (r.amount || 0), 0);
  const discAmt = Math.round((subTotal * (extraDisc || 0)) / 100);
  const netTotal = subTotal - discAmt;
  const cashAmt = Math.min(Number(cashPaid) || 0, netTotal);
  const balance = Math.max(netTotal - cashAmt, 0);

  useEffect(() => {
    fetchInvoiceNo();
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
      if (e.key === "F8") {
        e.preventDefault();
        holdBill();
      }
      if (e.key === "F2") {
        e.preventDefault();
        resetForm();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [rows, supplier, cashPaid, extraDisc, remarks]);

  const fetchInvoiceNo = async () => {
    try {
      const { data } = await api.get(EP.SALES.NEXT_INVOICE);
      if (data.success) setInvoiceNo(data.data.invoiceNo);
    } catch {}
  };
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

  const handlePhoneSearch = async () => {
    if (!phone.trim() || phone.trim().length < 3) return;
    try {
      const { data } = await api.get(
        `${EP.CUSTOMERS.GET_ALL}?search=${encodeURIComponent(phone.trim())}&type=raw-purchase`,
      );
      if (data.success && data.data.length > 0) {
        const list = data.data || [];
        if (!list.length) {
          await createWalkinCustomer();
          return;
        }
        const exact = list.find((c) => c.phone?.trim() === phone.trim());
        if (exact) {
          selectSupplier(exact);
          return;
        }
        if (list.length === 1) {
          selectSupplier(list[0]);
          return;
        }
        selectSupplier(list[0]);
      } else {
        await createWalkinCustomer();
      }
    } catch {
      showMsg("Search failed", "error");
    }
  };

  const createWalkinCustomer = async () => {
    try {
      const { data } = await api.post(EP.CUSTOMERS.CREATE, {
        name: `Supplier (${phone.trim()})`,
        phone: phone.trim(),
        type: "raw-purchase",
      });
      if (data.success) {
        selectSupplier(data.data);
        showMsg(`✅ New supplier created`);
      } else showMsg(data.message, "error");
    } catch {
      showMsg("Create failed", "error");
    }
  };

  const selectSupplier = (c) => {
    setSupplier(c);
    setPhone(c.phone || "");
    showMsg(
      `✅ ${c.name}${(c.currentBalance || 0) > 0 ? " — Bal: Rs." + fmt(c.currentBalance) : ""}`,
    );
  };

  const handleProductSelect = (product) => {
    const qty = rows[activeRow]?.qty || 1,
      rate = product._rate || 0;
    setRows((prev) => {
      const next = [...prev];
      next[activeRow] = {
        ...next[activeRow],
        productId: product._id || "",
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
    setSearchText(product._name || product.description || "");
    setShowSearch(false);
    setTimeout(() => rowRefs.current[activeRow]?.qty?.focus(), 30);
  };

  const ensureRef = (i) => {
    if (!rowRefs.current[i]) rowRefs.current[i] = {};
  };

  const updateRow = (i, field, val) => {
    setRows((prev) => {
      const next = [...prev];
      const r = { ...next[i], [field]: val };
      if (["qty", "rate", "disc"].includes(field)) {
        const q = field === "qty" ? Number(val) : Number(r.qty),
          rt = field === "rate" ? Number(val) : Number(r.rate),
          d = field === "disc" ? Number(val) : Number(r.disc);
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

  const onRowKey = (e, i, field) => {
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
  };
  const onCodeBlur = async (i, code) => {
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
          productId: found._id,
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

  const holdBill = () => {
    if (!rows.some((r) => r.description)) {
      showMsg("Nothing to hold", "error");
      return;
    }
    setHolds((p) => [
      ...p,
      {
        id: Date.now(),
        rows,
        supplier,
        phone,
        extraDisc,
        cashPaid,
        payMode,
        remarks,
      },
    ]);
    resetForm();
    showMsg("Bill held (F8)");
  };
  const resumeHold = (id) => {
    const h = holds.find((x) => x.id === id);
    if (!h) return;
    setRows(h.rows);
    setCustomer(h.supplier);
    setPhone(h.phone);
    setExtraDisc(h.extraDisc);
    setCashPaid(h.cashPaid);
    setPayMode(h.payMode);
    setRemarks(h.remarks);
    setHolds((p) => p.filter((x) => x.id !== id));
  };
  const resetForm = () => {
    setRows([{ ...EMPTY_ROW }]);
    setSupplier(null);
    setPhone("");
    setExtraDisc(0);
    setCashPaid(0);
    setPayMode("Cash");
    setRemarks("");
    setSearchText("");
    fetchInvoiceNo();
    setTimeout(() => phoneRef.current?.focus(), 30);
  };

  const handleSave = async () => {
    const validRows = rows.filter((r) => r.description && r.qty > 0);
    if (!validRows.length) {
      showMsg("Add at least one item", "error");
      return;
    }
    setSaving(true);
    try {
      const actualMode =
        cashAmt <= 0 ? "Credit" : cashAmt >= netTotal ? "Cash" : "Partial";
      const payload = {
        invoiceDate,
        saleType: "purchase",
        saleSource: "raw-purchase",
        paymentMode: actualMode,
        supplierId: supplier?._id || undefined,
        supplierName: supplier?.name || "COUNTER SALE",
        supplierPhone: supplier?.phone || phone || "",
        items: validRows,
        subTotal,
        extraDisc: Number(extraDisc),
        discAmount: discAmt,
        netTotal,
        paidAmount: cashAmt,
        balance,
        remarks,
      };
      const { data } = await api.post(EP.SALES.CREATE, payload);
      if (data.success) {
        setSavedSale({
          ...data.data,
          items: validRows,
          subTotal,
          discAmount: discAmt,
          netTotal,
          paidAmount: cashAmt,
          balance,
        });
        setShowInvoice(true);
        showMsg(`✅ ${data.data.invoiceNo} saved`);
        resetForm();
      } else showMsg(data.message, "error");
    } catch (e) {
      showMsg(e.response?.data?.message || "Save failed", "error");
    }
    setSaving(false);
  };

  return (
    <div className="rp-page">
      {showSearch && (
        <ProductModal
          allProducts={products}
          onSelect={handleProductSelect}
          onClose={() => setShowSearch(false)}
        />
      )}
      {showInvoice && savedSale && (
        <div
          className="xp-overlay"
          onClick={(e) => e.target === e.currentTarget && setShowInvoice(false)}
        >
          <div className="xp-modal xp-modal-md">
            <div className="xp-modal-tb">
              <span className="xp-modal-title">
                🧾 {savedSale.invoiceNo} — Saved
              </span>
              <button
                className="xp-cap-btn xp-cap-close"
                onClick={() => setShowInvoice(false)}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: "20px", textAlign: "center", fontSize: 14 }}>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: "bold",
                  color: "#1a6a1a",
                  marginBottom: 12,
                }}
              >
                ✅ Raw Purchase Saved Successfully!
              </div>
              <div style={{ marginBottom: 8 }}>
                <b>{savedSale.invoiceNo}</b> | {savedSale.invoiceDate}
              </div>
              <div style={{ marginBottom: 16 }}>
                Net Total: <b>Rs. {fmt(savedSale.netTotal)}</b>
              </div>
              <div
                style={{ display: "flex", gap: 8, justifyContent: "center" }}
              >
                <button
                  className="xp-btn xp-btn-sm"
                  onClick={() => printBill(savedSale)}
                >
                  🖨 Print
                </button>
                <button
                  className="xp-btn xp-btn-wa xp-btn-sm"
                  onClick={() => shareWA(savedSale)}
                >
                  📱 WhatsApp
                </button>
                <button
                  className="xp-btn xp-btn-sm"
                  onClick={() => setShowInvoice(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Titlebar */}
      <div className="rp-titlebar">
        <span className="rp-title-icon">🏷</span>
        <span className="rp-title-text">Raw Sale — {SHOP}</span>
        <div className="rp-title-fields">
          <div className="rp-hf">
            <span>Invoice #</span>
            <input
              className="rp-hinput bold"
              value={invoiceNo}
              readOnly
              tabIndex={-1}
            />
          </div>
          <div className="rp-hf">
            <span>Date</span>
            <input
              type="date"
              className="rp-hinput"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              tabIndex={-1}
            />
          </div>
        </div>
      </div>

      {/* Hint bar */}
      <div className="rp-hints">
        {[
          "F2=New",
          "F3=Search",
          "F5=Save",
          "F8=Hold",
          "Enter=Next",
          "Ctrl+Del=Remove",
        ].map((h) => (
          <span key={h}>
            <kbd>{h.split("=")[0]}</kbd> {h.split("=")[1]}
          </span>
        ))}
      </div>

      {msg.text && (
        <div
          className={`xp-alert ${msg.type === "success" ? "xp-alert-success" : "xp-alert-error"}`}
          style={{ margin: "4px 10px 0" }}
        >
          {msg.text}
        </div>
      )}

      <div className="rp-body">
        {/* LEFT */}
        <div className="rp-left">
          {/* Customer bar */}
          <div className="rp-supp-bar">
            <span className="rp-label">🏪 Supplier</span>
            <input
              ref={phoneRef}
              className="rp-phone-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handlePhoneSearch();
              }}
              placeholder="Phone/name → Enter to search…"
              tabIndex={1}
            />
            <button
              className="xp-btn xp-btn-sm"
              onClick={handlePhoneSearch}
              tabIndex={-1}
            >
              🔍
            </button>
            {supplier ? (
              <div className="rp-supp-tag">
                <span>
                  ✅ <b>{supplier.name}</b>
                </span>
                {(supplier.currentBalance || 0) > 0 && (
                  <span className="rp-due">
                    Due: <b>Rs.{fmt(supplier.currentBalance)}</b>
                  </span>
                )}
                <button
                  className="xp-btn xp-btn-sm xp-btn-ico"
                  style={{ width: 18, height: 18, fontSize: 9 }}
                  onClick={() => {
                    setSupplier(null);
                    setPhone("");
                  }}
                  tabIndex={-1}
                >
                  ✕
                </button>
              </div>
            ) : (
              <span className="rp-no-supp">Supplier (optional)</span>
            )}
            {holds.map((h) => (
              <button
                key={h.id}
                className="rp-hold-pill"
                onClick={() => resumeHold(h.id)}
                tabIndex={-1}
              >
                📋 {h.supplier?.name || "Hold"}
              </button>
            ))}
          </div>

          {/* Product search bar */}
          <div className="rp-search-bar">
            <span className="rp-label">📦 Product</span>
            <input
              className={`rp-search-input${searchText ? " filled" : ""}`}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onClick={() => setShowSearch(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === "ArrowDown") {
                  e.preventDefault();
                  setShowSearch(true);
                }
              }}
              placeholder="Click or press F3 / Enter to search…"
              readOnly={!!searchText}
              tabIndex={2}
            />
            {searchText && (
              <button
                className="xp-btn xp-btn-sm"
                onClick={() => setSearchText("")}
                tabIndex={-1}
              >
                ✕
              </button>
            )}
            <button
              className="xp-btn xp-btn-primary xp-btn-sm"
              onClick={() => setShowSearch(true)}
              tabIndex={-1}
            >
              F3
            </button>
          </div>

          {/* Items table */}
          <div className="rp-table-wrap">
            <table className="rp-table">
              <thead>
                <tr>
                  <th style={{ width: 30 }}>#</th>
                  <th style={{ width: 78 }}>Code</th>
                  <th>Description</th>
                  <th style={{ width: 78 }}>Meas.</th>
                  <th style={{ width: 65 }} className="r">
                    Qty
                  </th>
                  <th style={{ width: 85 }} className="r">
                    Rate
                  </th>
                  <th style={{ width: 58 }} className="r">
                    Disc%
                  </th>
                  <th style={{ width: 90 }} className="r">
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
                      className={
                        i === activeRow
                          ? "rp-row-active"
                          : i % 2 === 0
                            ? "rp-row-even"
                            : "rp-row-odd"
                      }
                      onClick={() => setActiveRow(i)}
                    >
                      <td
                        className="text-muted"
                        style={{ textAlign: "center", fontSize: 11 }}
                      >
                        {i + 1}
                      </td>
                      <td>
                        <input
                          className="rp-cell"
                          ref={(el) => {
                            ensureRef(i);
                            rowRefs.current[i].code = el;
                          }}
                          value={row.code}
                          onChange={(e) => updateRow(i, "code", e.target.value)}
                          onBlur={(e) => onCodeBlur(i, e.target.value)}
                          onKeyDown={(e) => onRowKey(e, i, "code")}
                          tabIndex={100 + i * 10 + 1}
                        />
                      </td>
                      <td>
                        <input
                          className="rp-cell full"
                          ref={(el) => {
                            ensureRef(i);
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
                            } else onRowKey(e, i, "description");
                          }}
                          tabIndex={100 + i * 10 + 2}
                        />
                      </td>
                      <td>
                        <input
                          className="rp-cell"
                          ref={(el) => {
                            ensureRef(i);
                            rowRefs.current[i].measurement = el;
                          }}
                          value={row.measurement}
                          onChange={(e) =>
                            updateRow(i, "measurement", e.target.value)
                          }
                          onKeyDown={(e) => onRowKey(e, i, "measurement")}
                          tabIndex={100 + i * 10 + 3}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="rp-cell r"
                          ref={(el) => {
                            ensureRef(i);
                            rowRefs.current[i].qty = el;
                          }}
                          value={row.qty}
                          onChange={(e) => updateRow(i, "qty", e.target.value)}
                          onKeyDown={(e) => onRowKey(e, i, "qty")}
                          tabIndex={100 + i * 10 + 4}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="rp-cell r"
                          ref={(el) => {
                            ensureRef(i);
                            rowRefs.current[i].rate = el;
                          }}
                          value={row.rate}
                          onChange={(e) => updateRow(i, "rate", e.target.value)}
                          onKeyDown={(e) => onRowKey(e, i, "rate")}
                          tabIndex={100 + i * 10 + 5}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="rp-cell r"
                          ref={(el) => {
                            ensureRef(i);
                            rowRefs.current[i].disc = el;
                          }}
                          value={row.disc}
                          onChange={(e) => updateRow(i, "disc", e.target.value)}
                          onKeyDown={(e) => onRowKey(e, i, "disc")}
                          tabIndex={100 + i * 10 + 6}
                        />
                      </td>
                      <td
                        className="r"
                        style={{
                          padding: "0 6px",
                          fontWeight: "bold",
                          fontFamily: "var(--xp-mono)",
                        }}
                      >
                        {fmt(row.amount)}
                      </td>
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

          {/* Footer */}
          <div className="rp-footer">
            <div className="rp-footer-left">
              {/* Payment */}
              <div className="rp-pay-section">
                <div className="rp-pay-title">💳 Payment</div>
                <div className="rp-pay-modes">
                  {[
                    ["Cash", "rp-pay-cash"],
                    ["Credit", "rp-pay-credit"],
                    ["Bank", "rp-pay-bank"],
                    ["Cheque", "rp-pay-cheque"],
                  ].map(([mode, cls]) => (
                    <button
                      key={mode}
                      className={`rp-pay-btn ${payMode === mode ? cls + " active" : ""}`}
                      onClick={() => {
                        setPayMode(mode);
                        if (mode === "Cash") setCashPaid(netTotal);
                        if (mode === "Credit") setCashPaid(0);
                      }}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
                <div className="rp-pay-row">
                  <label>Cash Received</label>
                  <input
                    ref={cashRef}
                    type="number"
                    className="rp-pay-input"
                    value={cashPaid}
                    onChange={(e) => {
                      setCashPaid(e.target.value);
                      setPayMode(
                        Number(e.target.value) >= netTotal ? "Cash" : "Partial",
                      );
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveRef.current?.focus();
                    }}
                    tabIndex={90}
                  />
                </div>
                <div className="rp-pay-row">
                  <label>Extra Disc%</label>
                  <input
                    type="number"
                    className="rp-pay-input"
                    value={extraDisc}
                    onChange={(e) => setExtraDisc(e.target.value)}
                    tabIndex={89}
                  />
                </div>
                <div className="rp-pay-row">
                  <label>Remarks</label>
                  <input
                    className="rp-pay-input wide"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    tabIndex={91}
                  />
                </div>
              </div>
              <div className="rp-btn-row">
                <button
                  className="xp-btn xp-btn-sm"
                  onClick={() => setShowSearch(true)}
                  tabIndex={-1}
                >
                  🔍 F3
                </button>
                <button
                  className="xp-btn xp-btn-sm"
                  onClick={holdBill}
                  tabIndex={-1}
                >
                  📋 F8
                </button>
                <button
                  className="xp-btn xp-btn-sm"
                  onClick={resetForm}
                  tabIndex={-1}
                >
                  🔄 F2
                </button>
                <button
                  ref={saveRef}
                  className="xp-btn xp-btn-primary xp-btn-lg"
                  onClick={handleSave}
                  disabled={saving}
                  tabIndex={92}
                >
                  💾 {saving ? "Saving…" : "F5 Save"}
                </button>
              </div>
            </div>
            <div className="rp-totals">
              <div className="rp-tot-row">
                <span>Sub Total</span>
                <span className="xp-amt">{fmt(subTotal)}</span>
              </div>
              {discAmt > 0 && (
                <div className="rp-tot-row">
                  <span>Discount</span>
                  <span className="xp-amt danger">-{fmt(discAmt)}</span>
                </div>
              )}
              <div className="rp-tot-row bold">
                <span>Net Total</span>
                <span className="xp-amt">{fmt(netTotal)}</span>
              </div>
              {cashAmt > 0 && (
                <div className="rp-tot-row">
                  <span>Cash Paid</span>
                  <span className="xp-amt success">{fmt(cashAmt)}</span>
                </div>
              )}
              <div className={`rp-tot-row bold ${balance > 0 ? "danger" : ""}`}>
                <span>Balance</span>
                <span className="xp-amt">{fmt(balance)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT — summary panel */}
        <div className="rp-right">
          <div className="rp-right-title">🛒 Raw Purchase</div>
          <div className="rp-info-cards">
            <div className="rp-info-card">
              <div className="rp-ic-l">Invoice</div>
              <div className="rp-ic-v">{invoiceNo || "—"}</div>
            </div>
            <div className="rp-info-card">
              <div className="rp-ic-l">Items</div>
              <div className="rp-ic-v">
                {rows.filter((r) => r.description).length}
              </div>
            </div>
            <div className="rp-info-card">
              <div className="rp-ic-l">Net Total</div>
              <div className="rp-ic-v" style={{ color: "var(--xp-blue-dark)" }}>
                Rs.{fmt(netTotal)}
              </div>
            </div>
            <div className={`rp-info-card ${balance > 0 ? "danger" : ""}`}>
              <div className="rp-ic-l">Balance</div>
              <div className="rp-ic-v">{fmt(balance)}</div>
            </div>
          </div>
          <div className="rp-right-desc">
            <p>
              <b>Raw Sale</b> — Purchase from supplier / wholesale to buyers.
            </p>
            <p>Stock is added. Records saved for history.</p>
            <ul>
              <li>Enter on last disc field → new row + search</li>
              <li>F3 anywhere → search products</li>
              <li>F8 → hold bill</li>
              <li>F5 → save & print</li>
            </ul>
          </div>
          {supplier && (
            <div className="rp-supp-summary">
              <div className="rp-ss-name">{supplier.name}</div>
              {supplier.phone && (
                <div className="rp-ss-phone">📞 {supplier.phone}</div>
              )}
              {(supplier.currentBalance || 0) > 0 && (
                <div className="rp-ss-balance">
                  Current Due:{" "}
                  <span style={{ color: "var(--xp-red)", fontWeight: "bold" }}>
                    Rs. {fmt(supplier.currentBalance)}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Status bar */}
      <div className="xp-statusbar">
        <div className="xp-status-pane">
          🛒 Raw Purchase | {invoiceNo || "—"}
        </div>
        <div className="xp-status-pane">👤 {supplier?.name || "Walk-in"}</div>
        <div className="xp-status-pane">
          Items: {rows.filter((r) => r.description).length}
        </div>
        <div className="xp-status-pane">
          Net:{" "}
          <b style={{ fontFamily: "var(--xp-mono)", marginLeft: 3 }}>
            Rs.{fmt(netTotal)}
          </b>
        </div>
        {balance > 0 && (
          <div className="xp-status-pane" style={{ color: "var(--xp-red)" }}>
            Bal: Rs.{fmt(balance)}
          </div>
        )}
      </div>
    </div>
  );
}
