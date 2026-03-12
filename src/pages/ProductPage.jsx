// pages/ProductPage.jsx
// CSS: styles/ProductPage.css | Theme: styles/theme.css
import { useState, useEffect, useRef } from "react";
import "../styles/ProductPage.css";
import api from "../api/api.js";
import EP from "../api/apiEndpoints.js";

// ── LocalStorage helpers ──────────────────────────────────────────────────────
function loadOpts(key, defs) {
  try {
    const s = JSON.parse(localStorage.getItem(key) || "[]");
    const m = [...defs];
    s.forEach((v) => {
      if (!m.includes(v)) m.push(v);
    });
    return m;
  } catch {
    return defs;
  }
}
function saveOpts(key, opts) {
  localStorage.setItem(key, JSON.stringify(opts));
}

// ── ComboInput — keyboard-navigable dropdown ──────────────────────────────────
function ComboInput({
  id,
  storeKey,
  defaults,
  value,
  onChange,
  onNext,
  persistRef,
  inputRef,
  width = 180,
}) {
  const [opts, setOpts] = useState([]);
  const [filt, setFilt] = useState([]);
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(-1);
  const listRef = useRef(null);
  const wrapRef = useRef(null);
  const localRef = useRef(null);
  const ref = inputRef || localRef;

  useEffect(() => {
    const o = loadOpts(storeKey, defaults);
    setOpts(o);
    setFilt(o);
  }, [storeKey]);
  useEffect(() => {
    const f = !value
      ? opts
      : opts.filter((o) => o.toLowerCase().includes(value.toLowerCase()));
    setFilt(f);
    setHi(f.length > 0 ? 0 : -1);
  }, [value, opts]);
  useEffect(() => {
    const h = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target))
        setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  useEffect(() => {
    if (open && hi >= 0 && listRef.current)
      listRef.current.children[hi]?.scrollIntoView({ block: "nearest" });
  }, [hi, open]);
  useEffect(() => {
    if (persistRef)
      persistRef.current = () => {
        const v = value?.trim();
        if (!v || opts.includes(v)) return;
        const u = [...opts, v];
        setOpts(u);
        saveOpts(storeKey, u);
      };
  }, [value, opts, storeKey, persistRef]);

  const pick = (item) => {
    onChange(item);
    setOpen(false);
    setHi(-1);
    setTimeout(() => onNext?.(), 0);
  };
  const handleKey = (e) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!open) {
          setOpen(true);
          setHi(0);
        } else setHi((i) => Math.min(i + 1, filt.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHi((i) => Math.max(i - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (open && hi >= 0 && filt[hi]) pick(filt[hi]);
        else {
          setOpen(false);
          onNext?.();
        }
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        setHi(-1);
        break;
      case "Tab":
        setOpen(false);
        break;
      default:
        if (!open) setOpen(true);
    }
  };
  return (
    <div ref={wrapRef} className="pp-combo-wrap" style={{ width: width + 17 }}>
      <input
        id={id}
        ref={ref}
        type="text"
        value={value}
        autoComplete="off"
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onKeyDown={handleKey}
        onFocus={() => {
          setOpen(true);
          setHi(0);
        }}
        className="pp-combo-input"
        style={{ width }}
      />
      <button
        tabIndex={-1}
        className={`pp-combo-btn${open ? " open" : ""}`}
        onMouseDown={(e) => {
          e.preventDefault();
          setOpen((o) => !o);
          ref.current?.focus();
        }}
      >
        ▼
      </button>
      {open && (
        <div ref={listRef} className="pp-combo-dropdown">
          {filt.length === 0 ? (
            <div className="pp-combo-empty">Press Enter to use "{value}"</div>
          ) : (
            filt.map((opt, i) => (
              <div
                key={opt}
                className={`pp-combo-option${i === hi ? " hi" : ""}`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(opt);
                }}
              >
                {opt}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ── Constants ─────────────────────────────────────────────────────────────────
const EMPTY_FORM = {
  productId: "",
  code: "",
  company: "",
  category: "",
  webCategory: "",
  rackNo: "",
  description: "",
  urduDesc: "",
  orderName: "",
  remarks: "",
  uploadProduct: false,
};
const EMPTY_PACK = {
  measurement: "",
  purchaseRate: "",
  saleRate: "",
  pDisc: "",
  packing: "",
  minQty: "",
  reorderQty: "",
  openingQty: "",
  stockEnabled: false,
};
const DEFS = {
  company: [
    "RC",
    "Samsung",
    "LG",
    "Sony",
    "Philips",
    "Kenwood",
    "Haier",
    "Dawlance",
    "LUX",
    "SABEN",
    "GRACE",
  ],
  category: [
    "RED",
    "WIRE",
    "CABLE",
    "SWITCH",
    "SOCKET",
    "BULB",
    "PIPE",
    "FITTING",
    "TOOL",
    "SMALL",
    "LARGE",
    "MEDIUM",
  ],
  webCat: [
    "Electronics",
    "Accessories",
    "Lighting",
    "Home Appliances",
    "Tools",
  ],
  order: ["ENGLISH 0322 4889168", "URDU 0300 1234567"],
  meas: [
    "PC",
    "DOZEN",
    "CARTON",
    "PACKET",
    "H.S",
    "PACEKT",
    "COIL",
    "GAAZ",
    "BOX",
    "ROLL",
    "DOSEN",
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
export default function ProductPage() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [packRows, setPRows] = useState([]);
  const [packForm, setPForm] = useState(EMPTY_PACK);
  const [selPack, setSelPack] = useState(null);
  const [editPack, setEditPack] = useState(null);
  const [measOpen, setMeasOpen] = useState(false);
  const [measHi, setMeasHi] = useState(0);
  const [products, setProds] = useState([]);
  const [selId, setSelId] = useState(null);
  const [editId, setEditId] = useState(null);
  const [loading, setLoad] = useState(false);
  const [nextNum, setNext] = useState(1);
  const [msg, setMsg] = useState({ text: "", type: "" });

  // Form refs
  const rCompany = useRef();
  const rCat = useRef();
  const rWebCat = useRef();
  const rRack = useRef();
  const rDesc = useRef();
  const rUrdu = useRef();
  const rOrder = useRef();
  const rRem = useRef();
  const rSave = useRef();
  // Persist refs for ComboInputs
  const pCompany = useRef(null);
  const pCat = useRef(null);
  const pWebCat = useRef(null);
  const pOrder = useRef(null);
  // Packing refs
  const rPurRate = useRef();
  const rSaleRate = useRef();
  const rPacking = useRef();
  const rPDisc = useRef();
  const rReorder = useRef();
  const rMinQty = useRef();
  const rOpenQty = useRef();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoad(true);
    try {
      const { data } = await api.get(EP.PRODUCTS.GET_ALL);
      if (data.success) {
        setProds(data.data);
        setNext(data.data.length + 1);
      }
    } catch {
      showMsg("Failed to load", "error");
    }
    setLoad(false);
  };

  const showMsg = (text, type = "success") => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: "", type: "" }), 3000);
  };
  const setF = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const setP = (k, v) => setPForm((p) => ({ ...p, [k]: v }));
  const go = (ref) => (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      ref?.current?.focus();
    }
  };

  // Measurement dropdown
  const measFiltered = DEFS.meas.filter(
    (o) =>
      !packForm.measurement ||
      o.toLowerCase().includes(packForm.measurement.toLowerCase()),
  );
  const handleMeasKey = (e) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!measOpen) {
          setMeasOpen(true);
          setMeasHi(0);
        } else setMeasHi((i) => Math.min(i + 1, measFiltered.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setMeasHi((i) => Math.max(i - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (measOpen && measFiltered[measHi]) {
          setP("measurement", measFiltered[measHi]);
          setMeasOpen(false);
          rPurRate.current?.focus();
        } else {
          setMeasOpen(false);
          rPurRate.current?.focus();
        }
        break;
      case "Escape":
        setMeasOpen(false);
        break;
      case "Tab":
        setMeasOpen(false);
        break;
      default:
        setMeasOpen(true);
    }
  };

  // Packing Enter chain
  const pkGo = (nextRef) => (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      nextRef?.current?.focus();
    }
  };
  const pkGoSave = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      savePackRow();
    }
  };

  const savePackRow = () => {
    if (!packForm.measurement.trim()) {
      alert("Measurement required");
      return;
    }
    if (editPack !== null) {
      const u = [...packRows];
      u[editPack] = { ...packForm };
      setPRows(u);
      setEditPack(null);
    } else setPRows((p) => [...p, { ...packForm }]);
    setPForm(EMPTY_PACK);
    setSelPack(null);
    setTimeout(() => document.getElementById("pk_meas")?.focus(), 30);
  };

  const saveProduct = async () => {
    if (!form.description.trim()) {
      alert("Description required");
      return;
    }
    if (!form.company.trim()) {
      alert("Company required");
      return;
    }
    if (!form.category.trim()) {
      alert("Category required");
      return;
    }
    pCompany.current?.();
    pCat.current?.();
    pWebCat.current?.();
    pOrder.current?.();
    setLoad(true);
    try {
      const { data } = editId
        ? await api.put(EP.PRODUCTS.UPDATE(editId), {
            ...form,
            packingInfo: packRows,
          })
        : await api.post(EP.PRODUCTS.CREATE, {
            ...form,
            packingInfo: packRows,
          });
      if (data.success) {
        showMsg(
          editId ? "✅ Updated!" : ` ✅ Saved! ID: ${data.data.productId}`,
        );
        refresh();
        fetchProducts();
      } else showMsg(`❌ ${data.message}`, "error");
    } catch (err) {
      showMsg(`❌ ${err.response?.data?.message || "Save failed"}`, "error");
    }
    setLoad(false);
  };

  const refresh = () => {
    setForm(EMPTY_FORM);
    setPRows([]);
    setPForm(EMPTY_PACK);
    setEditPack(null);
    setSelPack(null);
    setSelId(null);
    setEditId(null);
    setMsg({ text: "", type: "" });
    setTimeout(() => rCompany.current?.focus(), 50);
  };

  const loadForEdit = (id) => {
    const p = products.find((x) => x._id === id);
    if (!p) return;
    setForm({
      productId: p.productId,
      code: p.code,
      company: p.company,
      category: p.category,
      webCategory: p.webCategory || "",
      rackNo: p.rackNo || "",
      description: p.description,
      urduDesc: p.urduDesc || "",
      orderName: p.orderName || "",
      remarks: p.remarks || "",
      uploadProduct: p.uploadProduct || false,
    });
    setPRows(p.packingInfo || []);
    setEditId(p._id);
    setSelPack(null);
    setEditPack(null);
    setPForm(EMPTY_PACK);
    setTimeout(() => rCompany.current?.focus(), 50);
  };

  const deleteProduct = async () => {
    if (!selId) {
      alert("Select a product first");
      return;
    }
    if (!confirm("Delete this product?")) return;
    setLoad(true);
    try {
      const { data } = await api.delete(EP.PRODUCTS.DELETE(selId));
      if (data.success) {
        showMsg("✅ Deleted");
        fetchProducts();
        refresh();
      } else showMsg(`❌ ${data.message}`, "error");
    } catch {
      showMsg("❌ Delete failed", "error");
    }
    setLoad(false);
  };

  const sorted = [...products].sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
  );
  const nextId = String(nextNum).padStart(4, "0");

  return (
    <div className="pp-root">
      {msg.text && <div className={`pp-msg ${msg.type}`}>{msg.text}</div>}

      <div className="pp-body">
        {/* ═══ LEFT: Product Form ═══════════════════════════════════════════ */}
        <div className="pp-left">
          <fieldset className="xp-fieldset">
            <legend>
              {editId
                ? `✏️ Edit — ID: ${form.productId}`
                : "Enter Product Information"}
            </legend>

            {/* Product ID + Code */}
            <div className="pp-form-row">
              <label className="pp-label">Product ID</label>
              <input
                value={form.productId || nextId}
                readOnly
                tabIndex={-1}
                className="pp-input ro"
                style={{ width: 60 }}
                title="Auto-generated"
              />
              <label className="pp-label-sm" style={{ marginLeft: 8 }}>
                Code / Barcode
              </label>
              <input
                value={form.code || nextId}
                readOnly
                tabIndex={-1}
                className="pp-input ro"
                style={{ width: 80 }}
                title="Auto-generated"
              />
            </div>

            <div className="pp-form-row">
              <label className="pp-label">Company</label>
              <ComboInput
                id="f_company"
                inputRef={rCompany}
                storeKey="opts_company"
                defaults={DEFS.company}
                value={form.company}
                onChange={(v) => setF("company", v)}
                onNext={() => rCat.current?.focus()}
                persistRef={pCompany}
                width={215}
              />
            </div>
            <div className="pp-form-row">
              <label className="pp-label">Category</label>
              <ComboInput
                id="f_category"
                inputRef={rCat}
                storeKey="opts_category"
                defaults={DEFS.category}
                value={form.category}
                onChange={(v) => setF("category", v)}
                onNext={() => rWebCat.current?.focus()}
                persistRef={pCat}
                width={215}
              />
            </div>
            <div className="pp-form-row">
              <label className="pp-label">Web Category</label>
              <ComboInput
                id="f_webcat"
                inputRef={rWebCat}
                storeKey="opts_webcat"
                defaults={DEFS.webCat}
                value={form.webCategory}
                onChange={(v) => setF("webCategory", v)}
                onNext={() => rRack.current?.focus()}
                persistRef={pWebCat}
                width={130}
              />
              <label className="pp-label-sm" style={{ marginLeft: 8 }}>
                Rack #
              </label>
              <input
                ref={rRack}
                type="text"
                value={form.rackNo}
                onChange={(e) => setF("rackNo", e.target.value)}
                onKeyDown={go(rDesc)}
                className="pp-input"
                style={{ width: 50 }}
              />
            </div>
            <div className="pp-form-row">
              <label className="pp-label">Description</label>
              <input
                ref={rDesc}
                type="text"
                value={form.description}
                onChange={(e) => setF("description", e.target.value)}
                onKeyDown={go(rUrdu)}
                className="pp-input"
                style={{ width: 255 }}
              />
            </div>
            <div className="pp-form-row">
              <label className="pp-label">Urdu Desc.</label>
              <input
                ref={rUrdu}
                type="text"
                value={form.urduDesc}
                onChange={(e) => setF("urduDesc", e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    rOrder.current?.focus();
                  }
                }}
                className="pp-input urdu"
                style={{ width: 255 }}
              />
            </div>
            <div className="pp-form-row">
              <label className="pp-label">Order Name</label>
              <ComboInput
                id="f_order"
                inputRef={rOrder}
                storeKey="opts_order"
                defaults={DEFS.order}
                value={form.orderName}
                onChange={(v) => setF("orderName", v)}
                onNext={() => rRem.current?.focus()}
                persistRef={pOrder}
                width={215}
              />
            </div>
            <div className="pp-form-row">
              <label className="pp-label">Remarks</label>
              <input
                ref={rRem}
                type="text"
                value={form.remarks}
                onChange={(e) => setF("remarks", e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    rSave.current?.focus();
                  }
                }}
                className="pp-input"
                style={{ width: 255 }}
              />
            </div>
            <div className="pp-form-row" style={{ marginTop: 4 }}>
              <label className="pp-label"></label>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={form.uploadProduct}
                  onChange={(e) => setF("uploadProduct", e.target.checked)}
                />
                Upload this Product
              </label>
            </div>
          </fieldset>

          <fieldset className="xp-fieldset">
            <legend>Commands</legend>
            <div className="pp-commands">
              <button className="pp-cmd-btn" onClick={refresh}>
                🔄 Refresh
              </button>
              <button
                ref={rSave}
                className="pp-cmd-btn primary"
                onClick={saveProduct}
                onKeyDown={(e) => e.key === "Enter" && saveProduct()}
              >
                💾 Save Record
              </button>
              <button
                className="pp-cmd-btn"
                onClick={() => {
                  if (!selId) {
                    alert("Select a product first");
                    return;
                  }
                  loadForEdit(selId);
                }}
              >
                ✏️ Edit Record
              </button>
              <button className="pp-cmd-btn danger" onClick={deleteProduct}>
                ✖ Delete
              </button>
            </div>
            <div className="pp-hint">
              ⌨️ Enter=next | ↑↓=dropdown | Esc=close | Dbl-click list=edit
            </div>
          </fieldset>
        </div>

        {/* ═══ RIGHT: Packing Info ══════════════════════════════════════════ */}
        <div className="pp-right">
          <fieldset
            className="xp-fieldset"
            style={{ height: "calc(100% - 6px)" }}
          >
            <legend>Packing Info</legend>

            {/* ── ROW 1 labels: ID. | Measurement | Pur.Rate | Sale Rate | Packing ── */}
            <div className="pk-row1-labels">
              <span className="pk-col-lbl">ID.</span>
              <span className="pk-col-lbl left">Measurement</span>
              <span className="pk-col-lbl">Pur. Rate</span>
              <span className="pk-col-lbl">Sale Rate</span>
              <span className="pk-col-lbl">Packing</span>
            </div>

            {/* ── ROW 1 inputs ── */}
            <div className="pk-row1-inputs">
              {/* ID box */}
              <div className="pk-id-box">
                {editPack !== null ? editPack + 1 : packRows.length + 1}
              </div>

              {/* Measurement with dropdown */}
              <div style={{ position: "relative" }}>
                <div className="pk-meas-wrap">
                  <input
                    id="pk_meas"
                    type="text"
                    value={packForm.measurement}
                    autoComplete="off"
                    onChange={(e) => {
                      setP("measurement", e.target.value);
                      setMeasOpen(true);
                    }}
                    onKeyDown={handleMeasKey}
                    onFocus={() => setMeasOpen(true)}
                    onBlur={() => setTimeout(() => setMeasOpen(false), 150)}
                    className="pk-meas-input"
                  />
                  <button
                    tabIndex={-1}
                    className="pk-meas-btn"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setMeasOpen((o) => !o);
                      document.getElementById("pk_meas")?.focus();
                    }}
                  >
                    ▼
                  </button>
                </div>
                {measOpen && measFiltered.length > 0 && (
                  <div className="pk-meas-dropdown">
                    {measFiltered.map((o, i) => (
                      <div
                        key={o}
                        className={`pk-meas-opt${i === measHi ? " hi" : ""}`}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setP("measurement", o);
                          setMeasOpen(false);
                          rPurRate.current?.focus();
                        }}
                      >
                        {o}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <input
                ref={rPurRate}
                type="number"
                value={packForm.purchaseRate}
                onChange={(e) => setP("purchaseRate", e.target.value)}
                onKeyDown={pkGo(rSaleRate)}
                className="pk-num-input"
              />
              <input
                ref={rSaleRate}
                type="number"
                value={packForm.saleRate}
                onChange={(e) => setP("saleRate", e.target.value)}
                onKeyDown={pkGo(rPacking)}
                className="pk-num-input"
              />
              <input
                ref={rPacking}
                type="number"
                value={packForm.packing}
                onChange={(e) => setP("packing", e.target.value)}
                onKeyDown={pkGo(rReorder)}
                className="pk-num-input"
              />
            </div>

            {/* ── ROW 2 labels: (spacers) | Reorder Qty. | Min. Qty | Opening Qty ── */}
            <div className="pk-row2-labels">
              <span className="pk-col-lbl empty">.</span>
              <span className="pk-col-lbl empty">.</span>
              <span className="pk-col-lbl empty">.</span>
              <span className="pk-col-lbl empty">.</span>
              <span className="pk-col-lbl empty">.</span>
              <span className="pk-col-lbl">Reorder Qty.</span>
              <span className="pk-col-lbl">Min. Qty</span>
              <span className="pk-col-lbl">Opening Qty</span>
            </div>

            {/* ── ROW 2 inputs: (spacers) | Reorder | Min | Opening ── */}
            <div className="pk-row2-inputs">
              <div></div>
              <div></div>
              <div></div>
              <div></div>
              <div></div>
              <input
                ref={rReorder}
                type="number"
                value={packForm.reorderQty}
                onChange={(e) => setP("reorderQty", e.target.value)}
                onKeyDown={pkGo(rMinQty)}
                className="pk-num-input"
              />
              <input
                ref={rMinQty}
                type="number"
                value={packForm.minQty}
                onChange={(e) => setP("minQty", e.target.value)}
                onKeyDown={pkGo(rOpenQty)}
                className="pk-num-input"
              />
              <input
                ref={rOpenQty}
                type="number"
                value={packForm.openingQty}
                onChange={(e) => setP("openingQty", e.target.value)}
                onKeyDown={pkGoSave}
                className="pk-num-input"
              />
            </div>

            {/* P.Disc row */}
            <div className="pk-disc-row">
              <span className="pk-disc-lbl">P. Disc %</span>
              <input
                ref={rPDisc}
                type="number"
                value={packForm.pDisc}
                onChange={(e) => setP("pDisc", e.target.value)}
                onKeyDown={pkGo(rReorder)}
                className="pk-num-input"
                style={{ width: 70 }}
              />
            </div>

            {/* Buttons + Stock Enabled */}
            <div className="pk-btn-row">
              <button
                className="pp-cmd-btn"
                style={{ minWidth: 60 }}
                onClick={() => {
                  setPForm(EMPTY_PACK);
                  setEditPack(null);
                  setSelPack(null);
                  setTimeout(
                    () => document.getElementById("pk_meas")?.focus(),
                    30,
                  );
                }}
              >
                Reset
              </button>
              <button
                className="pp-cmd-btn primary"
                style={{ minWidth: 60 }}
                onClick={savePackRow}
              >
                Save
              </button>
              <button
                className="pp-cmd-btn"
                style={{ minWidth: 55 }}
                disabled={selPack === null}
                onClick={() => {
                  if (selPack === null) return;
                  setPForm({ ...packRows[selPack] });
                  setEditPack(selPack);
                  setTimeout(
                    () => document.getElementById("pk_meas")?.focus(),
                    30,
                  );
                }}
              >
                Edit
              </button>
              <button
                className="pp-cmd-btn danger"
                style={{ minWidth: 60 }}
                disabled={selPack === null}
                onClick={() => {
                  if (selPack === null) return;
                  if (!confirm("Delete?")) return;
                  setPRows((p) => p.filter((_, i) => i !== selPack));
                  setSelPack(null);
                }}
              >
                Delete
              </button>
              <label className="pk-stock-label">
                <input
                  type="checkbox"
                  checked={packForm.stockEnabled}
                  onChange={(e) => setP("stockEnabled", e.target.checked)}
                />{" "}
                Stock Enabled
              </label>
            </div>

            {/* Packing table */}
            <div className="pk-table-wrap">
              <table className="pk-table">
                <thead>
                  <tr>
                    <th style={{ width: 35 }}>Sr.#</th>
                    <th style={{ width: 30 }}>Id.</th>
                    <th>Measurement</th>
                    <th className="num" style={{ width: 72 }}>
                      P.Rate
                    </th>
                    <th className="num" style={{ width: 58 }}>
                      P.Disc.
                    </th>
                    <th className="num" style={{ width: 72 }}>
                      S.Rate
                    </th>
                    <th className="num" style={{ width: 60 }}>
                      Packing
                    </th>
                    <th className="num" style={{ width: 62 }}>
                      Min.Qty
                    </th>
                    <th className="num" style={{ width: 68 }}>
                      Reorder
                    </th>
                    <th className="num" style={{ width: 68 }}>
                      Opening
                    </th>
                    <th className="ctr" style={{ width: 48 }}>
                      Stock?
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {packRows.length === 0 && (
                    <tr>
                      <td
                        colSpan={11}
                        style={{
                          textAlign: "center",
                          color: "#888",
                          padding: 10,
                          fontStyle: "italic",
                        }}
                      >
                        Fill fields above → Save (or Enter on last field)
                      </td>
                    </tr>
                  )}
                  {packRows.map((r, i) => (
                    <tr
                      key={i}
                      className={`${i % 2 === 0 ? "even" : "odd"}${selPack === i ? " sel" : ""}`}
                      onClick={() => setSelPack(i)}
                    >
                      <td className="ctr">{i + 1}</td>
                      <td className="ctr">{i + 1}</td>
                      <td className="meas">{r.measurement}</td>
                      <td className="num">{r.purchaseRate}</td>
                      <td className="num">{r.pDisc}</td>
                      <td className="num">{r.saleRate}</td>
                      <td className="num">{r.packing}</td>
                      <td className="num">{r.minQty}</td>
                      <td className="num">{r.reorderQty}</td>
                      <td className="num">{r.openingQty}</td>
                      <td className="ctr">{r.stockEnabled ? "✓" : ""}</td>
                    </tr>
                  ))}
                  {packRows.length < 4 &&
                    Array.from({
                      length: Math.max(0, 4 - packRows.length),
                    }).map((_, i) => (
                      <tr key={`sp-${i}`}>
                        <td
                          colSpan={11}
                          style={{ height: 20, border: "1px solid #ececec" }}
                        ></td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            <div className="pk-update-hint">
              Update Stock enabled measurements
            </div>
          </fieldset>
        </div>
      </div>

      {/* ═══ BOTTOM: Product List ════════════════════════════════════════════ */}
      <div className="pp-list-wrap">
        <fieldset className="xp-fieldset" style={{ marginBottom: 0 }}>
          <legend>
            Product List — {sorted.length} products
            {loading && (
              <span
                style={{ color: "#888", marginLeft: 8, fontWeight: "normal" }}
              >
                Loading...
              </span>
            )}
          </legend>
          <div className="pp-list-scroll">
            <table className="pp-list-table">
              <thead>
                <tr>
                  <th style={{ width: 42 }}>ID</th>
                  <th style={{ width: 58 }}>Code</th>
                  <th style={{ width: 80 }}>Company</th>
                  <th style={{ width: 80 }}>Category</th>
                  <th style={{ width: 95 }}>Web Category</th>
                  <th>Description</th>
                  <th style={{ width: 88 }}>Measurement</th>
                  <th className="num" style={{ width: 72 }}>
                    Purchase
                  </th>
                  <th className="num" style={{ width: 58 }}>
                    P.Disc
                  </th>
                  <th className="num" style={{ width: 65 }}>
                    Sale
                  </th>
                </tr>
              </thead>
              <tbody>
                {sorted.length === 0 && !loading && (
                  <tr>
                    <td colSpan={10} className="pp-list-empty">
                      No products yet — add your first product above
                    </td>
                  </tr>
                )}
                {sorted.map((p, i) => {
                  const pk = p.packingInfo?.[0];
                  return (
                    <tr
                      key={p._id}
                      className={`${i % 2 === 0 ? "even" : "odd"}${selId === p._id ? " sel" : ""}`}
                      onClick={() => setSelId(p._id)}
                      onDoubleClick={() => {
                        setSelId(p._id);
                        loadForEdit(p._id);
                      }}
                    >
                      <td className="pid">{p.productId}</td>
                      <td>{p.code}</td>
                      <td>{p.company}</td>
                      <td>{p.category}</td>
                      <td>{p.webCategory}</td>
                      <td>{p.description}</td>
                      <td>{pk?.measurement || ""}</td>
                      <td className="num">{pk?.purchaseRate || ""}</td>
                      <td className="num">{pk?.pDisc || ""}</td>
                      <td className="num">{pk?.saleRate || ""}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </fieldset>
      </div>

      <div className="pp-statusbar">
        <span>
          {editId
            ? `✏️ Edit Mode — ID: ${form.productId}`
            : `➕ Add Mode — Next ID: ${nextId}`}
        </span>
        <span className="hint">
          Enter=next | ↑↓=dropdown | Dbl-click list=edit
        </span>
      </div>
    </div>
  );
}
