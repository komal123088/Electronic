// pages/ProductPage.jsx
import { useState, useEffect, useRef } from "react";
import api from "../api/api.js";
import EP from "../api/apiEndpoints.js";
import "../styles/theme.css";
import "../styles/ProductPage.css";

/* ── LocalStorage helpers ──────────────────── */
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

function ComboInput({
  id,
  storeKey,
  defaults,
  value,
  onChange,
  onNext,
  persistRef,
  inputRef,
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

  // Close when clicking outside THIS wrap
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
        } // ← mobile Enter also calls onNext
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
    /* isolation: isolate keeps the dropdown z-index scoped HERE only */
    <div
      className="pp-combo-wrap"
      ref={wrapRef}
      style={{ isolation: "isolate" }}
    >
      <input
        id={id}
        ref={ref}
        type="text"
        className="xp-input"
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
      />
      <button
        className="pp-combo-btn"
        tabIndex={-1}
        onMouseDown={(e) => {
          e.preventDefault();
          setOpen((o) => !o);
          ref.current?.focus();
        }}
      >
        ▼
      </button>

      {open && (
        <div className="pp-combo-drop" ref={listRef}>
          {filt.length === 0 ? (
            <div className="pp-drop-empty">Press Enter to use "{value}"</div>
          ) : (
            filt.map((opt, i) => (
              <div
                key={opt}
                className={`pp-drop-item${i === hi ? " hi" : ""}`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(opt);
                }}
                onMouseEnter={() => setHi(i)}
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

/* ── Constants ──────────────────────────────── */
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
    "COIL",
    "GAAZ",
    "BOX",
    "ROLL",
    "DOSEN",
  ],
};

/* ─────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────── */
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

  // Product form refs
  const rCompany = useRef();
  const rCat = useRef();
  const rWebCat = useRef();
  const rRack = useRef();
  const rDesc = useRef();
  const rUrdu = useRef();
  const rOrder = useRef();
  const rRem = useRef();
  const rSave = useRef();
  const pCompany = useRef(null);
  const pCat = useRef(null);
  const pWebCat = useRef(null);
  const pOrder = useRef(null);

  // Packing refs — meas is focus target when entering packing section
  const rMeas = useRef(); // we use id="pk_meas" + this ref
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

  // go(ref) — used by product form Enter keys
  const go = (ref) => (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      ref?.current?.focus();
    }
  };

  // FIX: remarks Enter → focus measurement (packing section), NOT save
  const handleRemarksKey = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      document.getElementById("pk_meas")?.focus();
    }
  };

  // Measurement dropdown filtered list
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

  // pkGo — packing field Enter → next ref
  const pkGo = (nr) => (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      nr?.current?.focus();
    }
  };
  // Last packing field Enter → save pack row
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
    } else {
      setPRows((p) => [...p, { ...packForm }]);
    }
    setPForm(EMPTY_PACK);
    setSelPack(null);
    setTimeout(() => document.getElementById("pk_meas")?.focus(), 30);
  };

  const saveProduct = async () => {
    if (!form.description.trim()) return alert("Description required");
    if (!form.company.trim()) return alert("Company required");
    if (!form.category.trim()) return alert("Category required");
    pCompany.current?.();
    pCat.current?.();
    pWebCat.current?.();
    pOrder.current?.();
    setLoad(true);
    try {
      const payload = { ...form, packingInfo: packRows };
      const { data } = editId
        ? await api.put(EP.PRODUCTS.UPDATE(editId), payload)
        : await api.post(EP.PRODUCTS.CREATE, payload);
      if (data.success) {
        showMsg(editId ? "Updated!" : `Saved! ID: ${data.data.productId}`);
        refresh();
        fetchProducts();
      } else showMsg(data.message, "error");
    } catch (err) {
      showMsg(err.response?.data?.message || "Save failed", "error");
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
    if (!selId) return alert("Select a product first");
    if (!confirm("Delete this product?")) return;
    setLoad(true);
    try {
      const { data } = await api.delete(EP.PRODUCTS.DELETE(selId));
      if (data.success) {
        showMsg("Deleted");
        fetchProducts();
        refresh();
      } else showMsg(data.message, "error");
    } catch {
      showMsg("Delete failed", "error");
    }
    setLoad(false);
  };

  const sorted = [...products].sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
  );
  const nextId = String(nextNum).padStart(4, "0");

  return (
    <div className="pp-page">
      {/* ── Titlebar ── */}
      <div className="xp-titlebar">
        <svg
          width="15"
          height="15"
          viewBox="0 0 16 16"
          fill="rgba(255,255,255,0.85)"
        >
          <path d="M0 1.5A.5.5 0 0 1 .5 1H2a.5.5 0 0 1 .485.379L2.89 3H14.5a.5.5 0 0 1 .491.592l-1.5 8A.5.5 0 0 1 13 12H4a.5.5 0 0 1-.491-.408L2.01 3.607 1.61 2H.5a.5.5 0 0 1-.5-.5M5 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4m7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4" />
        </svg>
        <span className="xp-tb-title">
          Product Management — Asim Electric &amp; Electronic Store
        </span>
        <div className="xp-tb-actions">
          {editId && (
            <div className="pp-edit-badge">
              <svg
                width="10"
                height="10"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168z" />
              </svg>
              Edit: {form.productId}
            </div>
          )}
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

      <div className="pp-body">
        <div className="pp-top">
          {/* ════ LEFT: Product Form + Commands ════ */}
          <div className="pp-left-col">
            <fieldset className="pp-fieldset">
              <legend className="pp-legend">
                {editId
                  ? `Edit — ID: ${form.productId}`
                  : "Product Information"}
              </legend>

              {/* ID + Code */}
              <div className="pp-id-row" style={{ marginTop: 4 }}>
                <label>Product ID</label>
                <input
                  className="xp-input xp-input-sm"
                  value={form.productId || nextId}
                  readOnly
                  tabIndex={-1}
                />
                <label>Barcode</label>
                <input
                  className="xp-input xp-input-sm"
                  value={form.code || nextId}
                  readOnly
                  tabIndex={-1}
                />
              </div>

              <div className="pp-frow">
                <label htmlFor="f_company">Company</label>
                <ComboInput
                  id="f_company"
                  inputRef={rCompany}
                  storeKey="opts_company"
                  defaults={DEFS.company}
                  value={form.company}
                  onChange={(v) => setF("company", v)}
                  onNext={() => rCat.current?.focus()}
                  persistRef={pCompany}
                />
              </div>

              <div className="pp-frow">
                <label htmlFor="f_cat">Category</label>
                <ComboInput
                  id="f_cat"
                  inputRef={rCat}
                  storeKey="opts_category"
                  defaults={DEFS.category}
                  value={form.category}
                  onChange={(v) => setF("category", v)}
                  onNext={() => rWebCat.current?.focus()}
                  persistRef={pCat}
                />
              </div>

              <div className="pp-frow-2">
                <label htmlFor="f_webcat">Web Cat.</label>
                <ComboInput
                  id="f_webcat"
                  inputRef={rWebCat}
                  storeKey="opts_webcat"
                  defaults={DEFS.webCat}
                  value={form.webCategory}
                  onChange={(v) => setF("webCategory", v)}
                  onNext={() => rRack.current?.focus()}
                  persistRef={pWebCat}
                />
                <label>Rack #</label>
                <input
                  ref={rRack}
                  className="xp-input xp-input-sm"
                  type="text"
                  value={form.rackNo}
                  onChange={(e) => setF("rackNo", e.target.value)}
                  onKeyDown={go(rDesc)}
                />
              </div>

              <div className="pp-frow">
                <label>Description</label>
                <input
                  ref={rDesc}
                  className="xp-input"
                  type="text"
                  value={form.description}
                  onChange={(e) => setF("description", e.target.value)}
                  onKeyDown={go(rUrdu)}
                />
              </div>

              <div className="pp-frow">
                <label>Urdu Desc.</label>
                <input
                  ref={rUrdu}
                  className="xp-input"
                  type="text"
                  dir="rtl"
                  value={form.urduDesc}
                  onChange={(e) => setF("urduDesc", e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      rOrder.current?.focus();
                    }
                  }}
                />
              </div>

              <div className="pp-frow">
                <label htmlFor="f_order">Order Name</label>
                <ComboInput
                  id="f_order"
                  inputRef={rOrder}
                  storeKey="opts_order"
                  defaults={DEFS.order}
                  value={form.orderName}
                  onChange={(v) => setF("orderName", v)}
                  onNext={() => rRem.current?.focus()}
                  persistRef={pOrder}
                />
              </div>

              <div className="pp-frow">
                <label>Remarks</label>
                {/* FIX: Enter here → packing measurement, NOT save */}
                <input
                  ref={rRem}
                  className="xp-input"
                  type="text"
                  value={form.remarks}
                  onChange={(e) => setF("remarks", e.target.value)}
                  onKeyDown={handleRemarksKey}
                />
              </div>

              <label className="pp-upload-check" style={{ marginLeft: 92 }}>
                <input
                  type="checkbox"
                  checked={form.uploadProduct}
                  onChange={(e) => setF("uploadProduct", e.target.checked)}
                />
                Upload this Product
              </label>
            </fieldset>

            {/* Commands */}
            <fieldset className="pp-fieldset">
              <legend className="pp-legend">Commands</legend>
              <div className="pp-cmd-grid">
                <button
                  className="xp-btn xp-btn-sm"
                  onClick={fetchProducts}
                  disabled={loading}
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
                  Refresh
                </button>
                <button
                  ref={rSave}
                  className="xp-btn xp-btn-primary xp-btn-sm"
                  onClick={saveProduct}
                >
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                  >
                    <path d="M2 1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H9.5a1 1 0 0 0-1 1v7.293l2.646-2.647a.5.5 0 0 1 .708.708l-3.5 3.5a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L7.5 9.293V2a2 2 0 0 1 2-2H14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2z" />
                  </svg>
                  Save Record
                </button>
                <button
                  className="xp-btn xp-btn-sm"
                  onClick={() => {
                    if (!selId) return alert("Select a product first");
                    loadForEdit(selId);
                  }}
                >
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                  >
                    <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168z" />
                  </svg>
                  Edit Record
                </button>
                <button
                  className="xp-btn xp-btn-danger xp-btn-sm"
                  onClick={deleteProduct}
                >
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                  >
                    <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z" />
                    <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z" />
                  </svg>
                  Delete
                </button>
              </div>
              <div className="pp-cmd-hint">
                <span>
                  <kbd>Enter</kbd> Next field
                </span>
                <span>
                  <kbd>↑↓</kbd> Dropdown
                </span>
                <span>
                  <kbd>Esc</kbd> Close dropdown
                </span>
                <span>Double-click list = edit</span>
              </div>
            </fieldset>
          </div>

          {/* ════ RIGHT: Packing Info ════ */}
          <div className="pp-right-col">
            <fieldset
              className="pp-fieldset"
              style={{ flex: 1, display: "flex", flexDirection: "column" }}
            >
              <legend className="pp-legend">
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <path d="M8.186 1.113a.5.5 0 0 0-.372 0L1.846 3.5l2.404.961L10.404 2zm3.564 1.426L5.596 5 8 5.961 14.154 3.5zm3.25 1.7-6.5 2.6v7.922l6.5-2.6V4.24zM7.5 14.762V6.838L1 4.239v7.923zM7.443.184a1.5 1.5 0 0 1 1.114 0l7.129 2.852A.5.5 0 0 1 16 3.5v8.662a1 1 0 0 1-.629.928l-7.185 2.874a.5.5 0 0 1-.372 0L.63 13.09a1 1 0 0 1-.63-.928V3.5a.5.5 0 0 1 .314-.464z" />
                </svg>
                Packing Info
              </legend>

              {/* ── Row 1 header ── */}
              <div className="pp-pk-hdr-row">
                <span style={{ textAlign: "center" }}>ID.</span>
                <span>Measurement</span>
                <span style={{ textAlign: "right" }}>Pur. Rate</span>
                <span style={{ textAlign: "right" }}>Sale Rate</span>
                <span style={{ textAlign: "right" }}>Packing</span>
              </div>

              {/* ── Row 1 inputs ── */}
              <div className="pp-pk-input-row1">
                <div className="pp-pk-id">
                  {editPack !== null ? editPack + 1 : packRows.length + 1}
                </div>

                {/* Measurement — scoped dropdown, does NOT use ComboInput (avoids global opts bleed) */}
                <div className="pp-meas-combo-wrap">
                  <input
                    id="pk_meas"
                    ref={rMeas}
                    type="text"
                    className="xp-input xp-input-sm"
                    value={packForm.measurement}
                    autoComplete="off"
                    onChange={(e) => {
                      setP("measurement", e.target.value);
                      setMeasOpen(true);
                    }}
                    onKeyDown={handleMeasKey}
                    onFocus={() => setMeasOpen(true)}
                    onBlur={() => setTimeout(() => setMeasOpen(false), 150)}
                  />
                  <button
                    className="pp-combo-btn"
                    tabIndex={-1}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setMeasOpen((o) => !o);
                      document.getElementById("pk_meas")?.focus();
                    }}
                  >
                    ▼
                  </button>
                  {measOpen && measFiltered.length > 0 && (
                    <div className="pp-meas-drop">
                      {measFiltered.map((o, i) => (
                        <div
                          key={o}
                          className={`pp-drop-item${i === measHi ? " hi" : ""}`}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setP("measurement", o);
                            setMeasOpen(false);
                            rPurRate.current?.focus();
                          }}
                          onMouseEnter={() => setMeasHi(i)}
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
                  className="xp-input xp-input-sm"
                  style={{ textAlign: "right" }}
                  value={packForm.purchaseRate}
                  onChange={(e) => setP("purchaseRate", e.target.value)}
                  onKeyDown={pkGo(rSaleRate)}
                />
                <input
                  ref={rSaleRate}
                  type="number"
                  className="xp-input xp-input-sm"
                  style={{ textAlign: "right" }}
                  value={packForm.saleRate}
                  onChange={(e) => setP("saleRate", e.target.value)}
                  onKeyDown={pkGo(rPacking)}
                />
                <input
                  ref={rPacking}
                  type="number"
                  className="xp-input xp-input-sm"
                  style={{ textAlign: "right" }}
                  value={packForm.packing}
                  onChange={(e) => setP("packing", e.target.value)}
                  onKeyDown={pkGo(rReorder)}
                />
              </div>

              {/* ── Row 2 header ── */}
              <div className="pp-pk-hdr-row2">
                <span></span>
                <span>Reorder Qty.</span>
                <span>Min. Qty</span>
                <span>Opening Qty</span>
              </div>

              {/* ── Row 2 inputs ── */}
              <div className="pp-pk-input-row2">
                {/* P.Disc inline on left side of row 2 */}
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <label
                    style={{
                      fontSize: "var(--xp-fs-xs)",
                      fontWeight: 700,
                      color: "#444",
                      whiteSpace: "nowrap",
                    }}
                  >
                    P. Disc %
                  </label>
                  <input
                    ref={rPDisc}
                    type="number"
                    className="xp-input xp-input-sm"
                    style={{ width: 65, textAlign: "right" }}
                    value={packForm.pDisc}
                    onChange={(e) => setP("pDisc", e.target.value)}
                    onKeyDown={pkGo(rReorder)}
                  />
                </div>
                <input
                  ref={rReorder}
                  type="number"
                  className="xp-input xp-input-sm"
                  style={{ textAlign: "right" }}
                  value={packForm.reorderQty}
                  onChange={(e) => setP("reorderQty", e.target.value)}
                  onKeyDown={pkGo(rMinQty)}
                />
                <input
                  ref={rMinQty}
                  type="number"
                  className="xp-input xp-input-sm"
                  style={{ textAlign: "right" }}
                  value={packForm.minQty}
                  onChange={(e) => setP("minQty", e.target.value)}
                  onKeyDown={pkGo(rOpenQty)}
                />
                {/* FIX: last packing field Enter → savePackRow */}
                <input
                  ref={rOpenQty}
                  type="number"
                  className="xp-input xp-input-sm"
                  style={{ textAlign: "right" }}
                  value={packForm.openingQty}
                  onChange={(e) => setP("openingQty", e.target.value)}
                  onKeyDown={pkGoSave}
                />
              </div>

              {/* ── Packing action buttons ── */}
              <div className="pp-pk-btns">
                <button
                  className="xp-btn xp-btn-sm"
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
                  className="xp-btn xp-btn-success xp-btn-sm"
                  onClick={savePackRow}
                >
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                  >
                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
                    <path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05" />
                  </svg>
                  Save
                </button>
                <button
                  className="xp-btn xp-btn-sm"
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
                  className="xp-btn xp-btn-danger xp-btn-sm"
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
                <label className="pp-stock-check">
                  <input
                    type="checkbox"
                    checked={packForm.stockEnabled}
                    onChange={(e) => setP("stockEnabled", e.target.checked)}
                  />
                  Stock Enabled
                </label>
              </div>

              {/* ── Packing table ── */}
              <div className="pp-pack-table-wrap">
                <table className="pp-pack-table">
                  <thead>
                    <tr>
                      <th style={{ width: 30 }}>Sr.#</th>
                      <th style={{ width: 24 }}>Id.</th>
                      <th>Measurement</th>
                      <th className="r">P.Rate</th>
                      <th className="r">P.Disc.</th>
                      <th className="r">S.Rate</th>
                      <th className="r">Packing</th>
                      <th className="r">Min.Qty</th>
                      <th className="r">Reorder</th>
                      <th className="r">Opening</th>
                      <th style={{ width: 44 }}>Stock?</th>
                    </tr>
                  </thead>
                  <tbody>
                    {packRows.length === 0 && (
                      <tr>
                        <td
                          colSpan={11}
                          className="xp-empty"
                          style={{ padding: "8px 10px" }}
                        >
                          Fill fields above → Save (or Enter on Opening Qty)
                        </td>
                      </tr>
                    )}
                    {packRows.map((r, i) => (
                      <tr
                        key={i}
                        className={selPack === i ? "pp-sel-pack" : ""}
                        onClick={() => setSelPack(i)}
                      >
                        <td className="text-muted">{i + 1}</td>
                        <td className="text-muted">{i + 1}</td>
                        <td style={{ fontWeight: 700 }}>{r.measurement}</td>
                        <td className="r xp-amt">{r.purchaseRate}</td>
                        <td className="r">{r.pDisc || "—"}</td>
                        <td className="r xp-amt success">{r.saleRate}</td>
                        <td className="r">{r.packing}</td>
                        <td className="r">{r.minQty}</td>
                        <td className="r">{r.reorderQty}</td>
                        <td className="r">{r.openingQty}</td>
                        <td style={{ textAlign: "center" }}>
                          {r.stockEnabled ? (
                            <span className="pp-stock-dot" />
                          ) : (
                            ""
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Update Stock button (bottom of packing) */}
              <div style={{ paddingTop: 4 }}>
                <button className="pp-update-stock-btn">
                  Update Stock enabled measurements
                </button>
              </div>
            </fieldset>
          </div>
        </div>

        {/* ════ BOTTOM: Product List ════ */}
        <div className="pp-list-section">
          <fieldset
            className="pp-fieldset"
            style={{ display: "flex", flexDirection: "column" }}
          >
            <legend className="pp-legend">
              <svg
                width="11"
                height="11"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <path d="M11 2.5a2.5 2.5 0 1 1 .603 1.628l-6.7 3.8a2.519 2.519 0 0 1 0 1.144l6.7 3.8a2.5 2.5 0 1 1-.488.876l-6.7-3.8a2.5 2.5 0 1 1 0-3.256l6.7-3.8A2.5 2.5 0 0 1 11 2.5" />
              </svg>
              Product List —&nbsp;
              <span style={{ color: "var(--xp-blue-mid)" }}>
                {sorted.length} products
              </span>
              {loading && (
                <span style={{ color: "#888", fontWeight: 400 }}>
                  &nbsp;Loading…
                </span>
              )}
            </legend>

            <div className="pp-list-table-wrap">
              <table className="pp-list-table">
                <thead>
                  <tr>
                    <th style={{ width: 30 }}>ID</th>
                    <th style={{ width: 50 }}>Code</th>
                    <th style={{ width: 130 }}>Company</th>
                    <th style={{ width: 100 }}>Category</th>
                    <th style={{ width: 120 }}>Web Category</th>
                    <th>Description</th>
                    <th style={{ width: 90 }}>Measurement</th>
                    <th className="r" style={{ width: 70 }}>
                      Purchase
                    </th>
                    <th className="r" style={{ width: 55 }}>
                      P.Disc
                    </th>
                    <th className="r" style={{ width: 60 }}>
                      Sale
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td
                        colSpan={10}
                        className="xp-loading"
                        style={{ padding: "10px", textAlign: "center" }}
                      >
                        Loading products…
                      </td>
                    </tr>
                  )}
                  {!loading &&
                    sorted.length === 0 &&
                    /* Show numbered blank rows just like screenshot */
                    Array.from({ length: 13 }, (_, i) => (
                      <tr key={`empty-${i}`}>
                        <td
                          className="text-muted"
                          style={{
                            fontSize: "var(--xp-fs-xs)",
                            textAlign: "center",
                          }}
                        >
                          {i + 1}
                        </td>
                        <td />
                        <td />
                        <td />
                        <td />
                        <td />
                        <td />
                        <td />
                        <td />
                        <td />
                      </tr>
                    ))}
                  {!loading &&
                    sorted.map((p, idx) => {
                      const pk = p.packingInfo?.[0];
                      return (
                        <tr
                          key={p._id}
                          className={selId === p._id ? "pp-sel-row" : ""}
                          onClick={() => setSelId(p._id)}
                          onDoubleClick={() => {
                            setSelId(p._id);
                            loadForEdit(p._id);
                          }}
                        >
                          <td
                            className="text-muted"
                            style={{
                              textAlign: "center",
                              fontSize: "var(--xp-fs-xs)",
                            }}
                          >
                            {idx + 1}
                          </td>
                          <td className="text-muted">{p.code}</td>
                          <td style={{ fontWeight: 700 }}>{p.company}</td>
                          <td>{p.category}</td>
                          <td className="text-muted">{p.webCategory}</td>
                          <td>{p.description}</td>
                          <td className="text-muted">
                            {pk?.measurement || ""}
                          </td>
                          <td className="r xp-amt">{pk?.purchaseRate || ""}</td>
                          <td className="r">{pk?.pDisc || ""}</td>
                          <td className="r xp-amt success">
                            {pk?.saleRate || ""}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </fieldset>
        </div>
      </div>

      {/* ── Status Bar ── */}
      <div className="xp-statusbar">
        <div className="xp-status-pane">
          {editId ? (
            <>
              <svg
                width="10"
                height="10"
                viewBox="0 0 16 16"
                fill="var(--xp-amber)"
              >
                <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168z" />
              </svg>
              &nbsp;Edit — {form.productId}
            </>
          ) : (
            <>
              <svg
                width="10"
                height="10"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
                <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4" />
              </svg>
              &nbsp;Add — Next ID: {nextId}
            </>
          )}
        </div>
        <div className="xp-status-pane">{sorted.length} products</div>
        <div className="xp-status-pane">Pack rows: {packRows.length}</div>
        {selId && (
          <div className="xp-status-pane">
            Selected: {products.find((p) => p._id === selId)?.description}
          </div>
        )}
      </div>
    </div>
  );
}
