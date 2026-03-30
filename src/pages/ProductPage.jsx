// pages/ProductPage.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api.js";
import EP from "../api/apiEndpoints.js";
import "../styles/theme.css";
import "../styles/ProductPage.css";

/* ── ComboLikeInput with Icon ──────────────────── */
function ComboLikeInput({
  id,
  label,
  value,
  onChange,
  onNext,
  inputRef,
  onFocusField,
  onOpenAll,
}) {
  return (
    <div className="pp-frow">
      <label htmlFor={id}>{label}</label>
      <div className="pp-combo-wrap" style={{ position: "relative" }}>
        <input
          id={id}
          ref={inputRef}
          type="text"
          className="xp-input pp-combo-input"
          value={value}
          autoComplete="off"
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onNext}
          onFocus={onFocusField}
        />
        <button
          className="pp-combo-btn"
          tabIndex={-1}
          onMouseDown={(e) => {
            e.preventDefault();
            onOpenAll && onOpenAll();
          }}
        >
          ▼
        </button>
      </div>
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
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY_FORM);
  const [packRows, setPRows] = useState([]);
  const [packForm, setPForm] = useState(EMPTY_PACK);
  const [selPack, setSelPack] = useState(null);
  const [editPack, setEditPack] = useState(null);
  const [products, setProds] = useState([]);
  const [selId, setSelId] = useState(null);
  const [editId, setEditId] = useState(null);
  const [loading, setLoad] = useState(false);
  const [nextNum, setNext] = useState(1);
  const [msg, setMsg] = useState({ text: "", type: "" });

  // ── activeField: "company" | "category" | "webCategory" | "orderName" | ""
  const [activeField, setActiveField] = useState("");
  const [filterText, setFilterText] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [showAllProducts, setShowAllProducts] = useState(false);

  // Refs
  const rCompany = useRef();
  const rCat = useRef();
  const rWebCat = useRef();
  const rRack = useRef();
  const rDesc = useRef();
  const rUrdu = useRef();
  const rOrder = useRef();
  const rRem = useRef();
  const rSave = useRef();
  const listWrapRef = useRef();

  // Packing Refs
  const rMeas = useRef();
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

  // ── ref-based filter — stale closure se free, hamesha latest values
  const getFilteredFromRefs = () => {
    const field = activeFieldRef.current;
    const text = filterTextRef.current;
    const showAll = showAllRef.current;
    const prods = productsRef.current;
    if (showAll || !text || !field) return prods;
    return prods.filter((p) => {
      if (field === "company")
        return p.company?.toLowerCase().includes(text.toLowerCase());
      if (field === "category")
        return p.category?.toLowerCase().includes(text.toLowerCase());
      if (field === "webCategory")
        return p.webCategory?.toLowerCase().includes(text.toLowerCase());
      if (field === "orderName")
        return p.orderName?.toLowerCase().includes(text.toLowerCase());
      if (field === "description")
        return p.description?.toLowerCase().includes(text.toLowerCase());
      if (field === "measurement")
        return p.packingInfo?.some((pk) =>
          pk.measurement?.toLowerCase().includes(text.toLowerCase()),
        );
      return true;
    });
  };

  // ── state-based filter — render ke liye (table display)
  const getFilteredProducts = () => {
    if (showAllProducts || !filterText || !activeField) return products;
    return products.filter((p) => {
      if (activeField === "company")
        return p.company?.toLowerCase().includes(filterText.toLowerCase());
      if (activeField === "category")
        return p.category?.toLowerCase().includes(filterText.toLowerCase());
      if (activeField === "webCategory")
        return p.webCategory?.toLowerCase().includes(filterText.toLowerCase());
      if (activeField === "orderName")
        return p.orderName?.toLowerCase().includes(filterText.toLowerCase());
      if (activeField === "description")
        return p.description?.toLowerCase().includes(filterText.toLowerCase());
      if (activeField === "measurement")
        return p.packingInfo?.some((pk) =>
          pk.measurement?.toLowerCase().includes(filterText.toLowerCase()),
        );
      return true;
    });
  };

  const activeFieldRef = useRef(activeField);
  const filterTextRef = useRef(filterText);
  const showAllRef = useRef(showAllProducts);
  const highlightedRef = useRef(highlightedIndex);
  const productsRef = useRef(products);

  useEffect(() => {
    activeFieldRef.current = activeField;
  }, [activeField]);
  useEffect(() => {
    filterTextRef.current = filterText;
  }, [filterText]);
  useEffect(() => {
    showAllRef.current = showAllProducts;
  }, [showAllProducts]);
  useEffect(() => {
    highlightedRef.current = highlightedIndex;
  }, [highlightedIndex]);
  useEffect(() => {
    productsRef.current = products;
  }, [products]);

  const applyHighlight = (idx, filtered) => {
    setHighlightedIndex(idx);
    if (idx >= 0 && filtered[idx]) {
      const row = filtered[idx];
      const field = activeFieldRef.current;
      if (field === "company")
        setForm((p) => ({ ...p, company: row.company || "" }));
      else if (field === "category")
        setForm((p) => ({ ...p, category: row.category || "" }));
      else if (field === "webCategory")
        setForm((p) => ({ ...p, webCategory: row.webCategory || "" }));
      else if (field === "orderName")
        setForm((p) => ({ ...p, orderName: row.orderName || "" }));
      else if (field === "description")
        setForm((p) => ({ ...p, description: row.description || "" }));
    }
  };

  const focusField = (field, currentVal) => {
    // ▼ button ne openAllForField call ki thi — onFocus override na kare
    if (skipFocusRef.current) return;
    setActiveField(field);
    activeFieldRef.current = field;
    setFilterText(currentVal);
    filterTextRef.current = currentVal;
    const showAll = !currentVal;
    setShowAllProducts(showAll);
    showAllRef.current = showAll;
    setHighlightedIndex(-1);
    highlightedRef.current = -1;
  };

  // ▼ button click — hamesha sab products show karo
  // skipNextFocus flag: jab button click ho tu onFocus ko override na karne do
  const skipFocusRef = useRef(false);

  const openAllForField = (field, ref) => {
    setActiveField(field);
    activeFieldRef.current = field;
    setFilterText("");
    filterTextRef.current = "";
    setShowAllProducts(true);
    showAllRef.current = true;
    setHighlightedIndex(-1);
    highlightedRef.current = -1;
    skipFocusRef.current = true; // onFocus ko batao: skip karo
    setTimeout(() => {
      ref?.current?.focus();
      // focus ke baad thodi der mein flag reset karo
      setTimeout(() => {
        skipFocusRef.current = false;
      }, 50);
    }, 0);
  };

  const handleFieldChange = (field, v) => {
    setF(field, v);
    setFilterText(v);
    filterTextRef.current = v;
    setShowAllProducts(false);
    showAllRef.current = false;
    setHighlightedIndex(-1);
    highlightedRef.current = -1;
  };

  const makeFieldKeyDown = (field, nextRef) => (e) => {
    const filtered = getFilteredFromRefs();
    const hi = highlightedRef.current;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      listWrapRef.current?.focus();
      const next = hi < filtered.length - 1 ? hi + 1 : 0;
      applyHighlight(next, filtered);
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      listWrapRef.current?.focus();
      const prev = hi > 0 ? hi - 1 : filtered.length - 1;
      applyHighlight(prev, filtered);
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      setFilterText("");
      setShowAllProducts(true);
      setHighlightedIndex(-1);
      nextRef?.current?.focus();
    }
  };

  const handleListKeyDown = (e) => {
    const filtered = getFilteredFromRefs();
    const hi = highlightedRef.current;
    if (filtered.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = hi < filtered.length - 1 ? hi + 1 : 0;
      applyHighlight(next, filtered);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prev = hi > 0 ? hi - 1 : filtered.length - 1;
      applyHighlight(prev, filtered);
    } else if (e.key === "Enter" && hi >= 0) {
      e.preventDefault();
      setFilterText("");
      setShowAllProducts(true);
      setHighlightedIndex(-1);
      const f = activeFieldRef.current;
      if (f === "company") rCat.current?.focus();
      else if (f === "category") rWebCat.current?.focus();
      else if (f === "webCategory") rRack.current?.focus();
      else if (f === "description") rUrdu.current?.focus();
      else if (f === "orderName") rRem.current?.focus();
    } else if (e.key === "Escape") {
      const f = activeFieldRef.current;
      if (f === "company") rCompany.current?.focus();
      else if (f === "category") rCat.current?.focus();
      else if (f === "webCategory") rWebCat.current?.focus();
      else if (f === "description") rDesc.current?.focus();
      else if (f === "orderName") rOrder.current?.focus();
    }
  };

  // ── Row click — sirf active field fill hoga
  const handleProductClick = (product) => {
    const field = activeFieldRef.current;
    if (field === "company") setF("company", product.company || "");
    else if (field === "category") setF("category", product.category || "");
    else if (field === "webCategory")
      setF("webCategory", product.webCategory || "");
    else if (field === "orderName") setF("orderName", product.orderName || "");
    else if (field === "description")
      setF("description", product.description || "");

    setSelId(product._id);
    setFilterText("");
    filterTextRef.current = "";
    setShowAllProducts(true);
    showAllRef.current = true;
    setHighlightedIndex(-1);
    highlightedRef.current = -1;
  };

  const handlePackRowClick = (i) => {
    setSelPack(i);
    setPForm({ ...packRows[i] });
    setEditPack(i);
    setTimeout(() => document.getElementById("pk_meas")?.focus(), 30);
  };

  const handleRemarksKey = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      document.getElementById("pk_meas")?.focus();
    }
  };

  const pkGo = (nr) => (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      nr?.current?.focus();
    }
  };
  const pkGoSave = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      savePackRow();
    }
  };

  const savePackRow = () => {
    if (!packForm.measurement.trim()) return alert("Measurement required");
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
    } catch {
      showMsg("Save failed", "error");
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
    setFilterText("");
    filterTextRef.current = "";
    setActiveField("");
    activeFieldRef.current = "";
    setHighlightedIndex(-1);
    highlightedRef.current = -1;
    setShowAllProducts(false);
    showAllRef.current = false;
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
    setShowAllProducts(true);
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

  const filteredProducts = getFilteredProducts();
  const sorted = [...filteredProducts].sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
  );
  const nextId = String(nextNum).padStart(4, "0");

  return (
    <div className="pp-page">
      {/* Titlebar */}
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
            <div className="pp-edit-badge">Edit: {form.productId}</div>
          )}
          <div className="xp-tb-divider" />
          <button className="xp-cap-btn">─</button>
          <button className="xp-cap-btn">□</button>
          <button className="xp-cap-btn xp-cap-close">✕</button>
        </div>
      </div>

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
          {/* LEFT COLUMN */}
          <div className="pp-left-col">
            <fieldset className="pp-fieldset">
              <legend className="pp-legend">
                {editId
                  ? `Edit — ID: ${form.productId}`
                  : "Product Information"}
              </legend>

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

              {/* ── COMPANY ── */}
              <ComboLikeInput
                id="f_company"
                label="Company"
                inputRef={rCompany}
                value={form.company}
                onChange={(v) => handleFieldChange("company", v)}
                onNext={makeFieldKeyDown("company", rCat)}
                onFocusField={() => focusField("company", form.company)}
                onOpenAll={() => openAllForField("company", rCompany)}
              />

              {/* ── CATEGORY ── */}
              <ComboLikeInput
                id="f_cat"
                label="Category"
                inputRef={rCat}
                value={form.category}
                onChange={(v) => handleFieldChange("category", v)}
                onNext={makeFieldKeyDown("category", rWebCat)}
                onFocusField={() => focusField("category", form.category)}
                onOpenAll={() => openAllForField("category", rCat)}
              />

              {/* ── WEB CATEGORY + RACK # ── */}
              <div className="pp-frow">
                <label htmlFor="f_webcat">Web Cat.</label>
                <div
                  style={{
                    display: "flex",
                    gap: 4,
                    flex: 1,
                    alignItems: "center",
                  }}
                >
                  <div
                    className="pp-combo-wrap"
                    style={{ position: "relative", flex: 1 }}
                  >
                    <input
                      id="f_webcat"
                      ref={rWebCat}
                      type="text"
                      className="xp-input pp-combo-input"
                      value={form.webCategory}
                      autoComplete="off"
                      onChange={(e) =>
                        handleFieldChange("webCategory", e.target.value)
                      }
                      onKeyDown={makeFieldKeyDown("webCategory", rRack)}
                      onFocus={() =>
                        focusField("webCategory", form.webCategory)
                      }
                    />
                    <button
                      className="pp-combo-btn"
                      tabIndex={-1}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        openAllForField("webCategory", rWebCat);
                      }}
                    >
                      ▼
                    </button>
                  </div>
                  <label
                    style={{
                      whiteSpace: "nowrap",
                      fontSize: "var(--xp-fs-xs)",
                      fontWeight: 700,
                    }}
                  >
                    Rack #
                  </label>
                  <input
                    ref={rRack}
                    className="xp-input xp-input-sm"
                    type="text"
                    style={{ width: 48 }}
                    value={form.rackNo}
                    onChange={(e) => setF("rackNo", e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && rDesc.current?.focus()
                    }
                    onFocus={() => {
                      setActiveField("");
                      activeFieldRef.current = "";
                      setShowAllProducts(true);
                    }}
                  />
                </div>
              </div>

              <div className="pp-frow">
                <label htmlFor="f_desc">Description</label>
                <div className="pp-combo-wrap" style={{ position: "relative" }}>
                  <input
                    id="f_desc"
                    ref={rDesc}
                    type="text"
                    className="xp-input pp-combo-input"
                    value={form.description}
                    autoComplete="off"
                    onChange={(e) =>
                      handleFieldChange("description", e.target.value)
                    }
                    onKeyDown={makeFieldKeyDown("description", rUrdu)}
                    onFocus={() => focusField("description", form.description)}
                  />
                  <button
                    className="pp-combo-btn"
                    tabIndex={-1}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      openAllForField("description", rDesc);
                    }}
                  >
                    ▼
                  </button>
                </div>
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
                  onKeyDown={(e) =>
                    e.key === "Enter" && rOrder.current?.focus()
                  }
                  onFocus={() => {
                    setActiveField("");
                    activeFieldRef.current = "";
                    setShowAllProducts(true);
                  }}
                />
              </div>

              {/* ── ORDER NAME — ab filter/autocomplete ke saath ── */}
              <ComboLikeInput
                id="f_order"
                label="Order Name"
                inputRef={rOrder}
                value={form.orderName}
                onChange={(v) => handleFieldChange("orderName", v)}
                onNext={makeFieldKeyDown("orderName", rRem)}
                onFocusField={() => focusField("orderName", form.orderName)}
                onOpenAll={() => openAllForField("orderName", rOrder)}
              />

              <div className="pp-frow">
                <label>Remarks</label>
                <input
                  ref={rRem}
                  className="xp-input"
                  type="text"
                  value={form.remarks}
                  onChange={(e) => setF("remarks", e.target.value)}
                  onKeyDown={handleRemarksKey}
                  onFocus={() => {
                    setActiveField("");
                    activeFieldRef.current = "";
                    setShowAllProducts(true);
                  }}
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

            <fieldset className="pp-fieldset">
              <legend className="pp-legend">Commands</legend>
              <div className="pp-cmd-grid">
                <button
                  className="xp-btn xp-btn-sm"
                  onClick={refresh}
                  disabled={loading}
                >
                  Refresh
                </button>
                <button
                  ref={rSave}
                  className="xp-btn xp-btn-primary xp-btn-sm"
                  onClick={saveProduct}
                >
                  Save Record
                </button>
                <button
                  className="xp-btn xp-btn-sm"
                  onClick={() => selId && loadForEdit(selId)}
                >
                  Edit Record
                </button>
                <button
                  className="xp-btn xp-btn-danger xp-btn-sm"
                  onClick={deleteProduct}
                >
                  Delete
                </button>
                <button
                  className="xp-btn xp-btn-sm pp-close-btn"
                  style={{ gridColumn: "1 / -1" }}
                  onClick={() => navigate("/")}
                  title="Sale page par wapas jao"
                >
                  ✕ Close
                </button>
              </div>
            </fieldset>
          </div>

          {/* RIGHT: Packing Info */}
          <div className="pp-right-col">
            <fieldset
              className="pp-fieldset"
              style={{ flex: 1, display: "flex", flexDirection: "column" }}
            >
              <legend className="pp-legend">Packing Info</legend>

              <div className="pp-pk-hdr-row">
                <span style={{ textAlign: "center" }}>ID.</span>
                <span>Measurement</span>
                <span style={{ textAlign: "right" }}>Pur. Rate</span>
                <span style={{ textAlign: "right" }}>Sale Rate</span>
                <span style={{ textAlign: "right" }}>Packing</span>
              </div>

              <div className="pp-pk-input-row1">
                <div className="pp-pk-id">
                  {editPack !== null ? editPack + 1 : packRows.length + 1}
                </div>
                <div className="pp-meas-combo-wrap">
                  <input
                    id="pk_meas"
                    ref={rMeas}
                    type="text"
                    className="xp-input xp-input-sm"
                    value={packForm.measurement}
                    onChange={(e) => {
                      setP("measurement", e.target.value);
                      handleFieldChange("measurement", e.target.value);
                    }}
                    onKeyDown={makeFieldKeyDown("measurement", rPurRate)}
                    onFocus={() =>
                      focusField("measurement", packForm.measurement)
                    }
                  />
                  <button
                    className="pp-combo-btn"
                    tabIndex={-1}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      openAllForField("measurement", rMeas);
                    }}
                  >
                    ▼
                  </button>
                </div>
                <input
                  ref={rPurRate}
                  type="text"
                  className="xp-input xp-input-sm"
                  style={{ textAlign: "right" }}
                  value={packForm.purchaseRate}
                  onChange={(e) => setP("purchaseRate", e.target.value)}
                  onKeyDown={pkGo(rSaleRate)}
                />
                <input
                  ref={rSaleRate}
                  type="text"
                  className="xp-input xp-input-sm"
                  style={{ textAlign: "right" }}
                  value={packForm.saleRate}
                  onChange={(e) => setP("saleRate", e.target.value)}
                  onKeyDown={pkGo(rPacking)}
                />
                <input
                  ref={rPacking}
                  type="text"
                  className="xp-input xp-input-sm"
                  style={{ textAlign: "right" }}
                  value={packForm.packing}
                  onChange={(e) => setP("packing", e.target.value)}
                  onKeyDown={pkGo(rPDisc)}
                />
              </div>

              <div className="pp-pk-hdr-row2">
                <span></span>
                <span>Reorder Qty.</span>
                <span>Min. Qty</span>
                <span>Opening Qty</span>
              </div>

              <div className="pp-pk-input-row2">
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <label
                    style={{
                      fontSize: "var(--xp-fs-xs)",
                      fontWeight: 700,
                      color: "#444",
                    }}
                  >
                    P. Disc %
                  </label>
                  <input
                    ref={rPDisc}
                    type="text"
                    className="xp-input xp-input-sm"
                    style={{ width: 65, textAlign: "right" }}
                    value={packForm.pDisc}
                    onChange={(e) => setP("pDisc", e.target.value)}
                    onKeyDown={pkGo(rReorder)}
                  />
                </div>
                <input
                  ref={rReorder}
                  type="text"
                  className="xp-input xp-input-sm"
                  style={{ textAlign: "right" }}
                  value={packForm.reorderQty}
                  onChange={(e) => setP("reorderQty", e.target.value)}
                  onKeyDown={pkGo(rMinQty)}
                />
                <input
                  ref={rMinQty}
                  type="text"
                  className="xp-input xp-input-sm"
                  style={{ textAlign: "right" }}
                  value={packForm.minQty}
                  onChange={(e) => setP("minQty", e.target.value)}
                  onKeyDown={pkGo(rOpenQty)}
                />
                <input
                  ref={rOpenQty}
                  type="text"
                  className="xp-input xp-input-sm"
                  style={{ textAlign: "right" }}
                  value={packForm.openingQty}
                  onChange={(e) => setP("openingQty", e.target.value)}
                  onKeyDown={pkGoSave}
                />
              </div>

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
                  Save
                </button>
                <button
                  className="xp-btn xp-btn-sm"
                  disabled={selPack === null}
                  onClick={() =>
                    selPack !== null &&
                    (setPForm({ ...packRows[selPack] }),
                    setEditPack(selPack),
                    setTimeout(
                      () => document.getElementById("pk_meas")?.focus(),
                      30,
                    ))
                  }
                >
                  Edit
                </button>
                <button
                  className="xp-btn xp-btn-danger xp-btn-sm"
                  disabled={selPack === null}
                  onClick={() =>
                    selPack !== null &&
                    confirm("Delete?") &&
                    (setPRows((p) => p.filter((_, i) => i !== selPack)),
                    setSelPack(null),
                    setEditPack(null),
                    setPForm(EMPTY_PACK))
                  }
                >
                  Delete
                </button>
                <label className="pp-stock-check">
                  <input
                    type="checkbox"
                    checked={packForm.stockEnabled}
                    onChange={(e) => setP("stockEnabled", e.target.checked)}
                  />{" "}
                  Stock Enabled
                </label>
              </div>

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
                          Fill fields above → Save
                        </td>
                      </tr>
                    )}
                    {packRows.map((r, i) => (
                      <tr
                        key={i}
                        className={selPack === i ? "pp-sel-pack" : ""}
                        style={{ cursor: "pointer" }}
                        onClick={() => handlePackRowClick(i)}
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
            </fieldset>
          </div>
        </div>

        {/* ── Product List ── */}
        <div className="pp-list-section">
          <fieldset
            className="pp-fieldset"
            style={{ display: "flex", flexDirection: "column" }}
          >
            <legend className="pp-legend">
              Product List —{" "}
              <span style={{ color: "var(--xp-blue-mid)" }}>
                {sorted.length} products
                {!showAllProducts && filterText && activeField
                  ? ` (filtered: "${filterText}")`
                  : ""}
              </span>
            </legend>

            <div
              className="pp-list-table-wrap"
              ref={listWrapRef}
              tabIndex={0}
              onKeyDown={handleListKeyDown}
              style={{ outline: "none" }}
            >
              <table
                className="pp-list-table"
                style={{ tableLayout: "fixed", width: "100%" }}
              >
                <thead>
                  <tr>
                    <th style={{ width: 30 }}>ID</th>
                    <th style={{ width: 50 }}>Code</th>
                    <th style={{ width: 110 }}>Company</th>
                    <th style={{ width: 90 }}>Category</th>
                    <th style={{ width: 100 }}>Web Category</th>
                    <th style={{ width: 160 }}>Description</th>
                    <th style={{ width: 90 }}>Order Name</th>
                    <th style={{ width: 75 }}>Measurement</th>
                    <th className="r" style={{ width: 65 }}>
                      Purchase
                    </th>
                    <th className="r" style={{ width: 50 }}>
                      P.Disc
                    </th>
                    <th className="r" style={{ width: 55 }}>
                      Sale
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={11} className="xp-loading">
                        Loading products…
                      </td>
                    </tr>
                  )}
                  {!loading &&
                    sorted.length === 0 &&
                    Array.from({ length: 13 }, (_, i) => (
                      <tr key={i}>
                        <td
                          className="text-muted"
                          style={{ textAlign: "center" }}
                        >
                          {i + 1}
                        </td>
                        <td colSpan={10} />
                      </tr>
                    ))}
                  {!loading &&
                    sorted.map((p, idx) => {
                      const pk = p.packingInfo?.[0];
                      const isHighlighted = highlightedIndex === idx;
                      const isSelected = selId === p._id;
                      return (
                        <tr
                          key={p._id}
                          className={`${isSelected ? "pp-sel-row" : ""} ${isHighlighted ? "pp-highlighted" : ""}`}
                          onClick={() => {
                            setSelId(p._id);
                            handleProductClick(p);
                          }}
                          onDoubleClick={() => {
                            setSelId(p._id);
                            loadForEdit(p._id);
                          }}
                          ref={
                            isHighlighted
                              ? (el) => el?.scrollIntoView({ block: "nearest" })
                              : null
                          }
                        >
                          <td
                            className="text-muted"
                            style={{
                              textAlign: "center",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {idx + 1}
                          </td>
                          <td
                            className="text-muted"
                            style={{ whiteSpace: "nowrap" }}
                          >
                            {p.code}
                          </td>
                          <td
                            style={{
                              fontWeight: 700,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              maxWidth: 110,
                            }}
                          >
                            {p.company}
                          </td>
                          <td
                            style={{
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              maxWidth: 90,
                            }}
                          >
                            {p.category}
                          </td>
                          <td
                            className="text-muted"
                            style={{
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              maxWidth: 100,
                            }}
                          >
                            {p.webCategory}
                          </td>
                          <td
                            style={{
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              maxWidth: 160,
                            }}
                          >
                            {p.description}
                          </td>
                          <td
                            className="text-muted"
                            style={{
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              maxWidth: 90,
                            }}
                          >
                            {p.orderName || ""}
                          </td>
                          <td
                            className="text-muted"
                            style={{ whiteSpace: "nowrap" }}
                          >
                            {pk?.measurement || ""}
                          </td>
                          <td
                            className="r xp-amt"
                            style={{ whiteSpace: "nowrap" }}
                          >
                            {pk?.purchaseRate || ""}
                          </td>
                          <td className="r" style={{ whiteSpace: "nowrap" }}>
                            {pk?.pDisc || ""}
                          </td>
                          <td
                            className="r xp-amt success"
                            style={{ whiteSpace: "nowrap" }}
                          >
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

      {/* Status Bar */}
      <div className="xp-statusbar">
        <div className="xp-status-pane">
          {editId ? `Edit — ${form.productId}` : `Add — Next ID: ${nextId}`}
        </div>
        <div className="xp-status-pane">
          {sorted.length} / {products.length} products
          {activeField ? ` | Active: ${activeField}` : ""}
        </div>
        <div className="xp-status-pane">Pack rows: {packRows.length}</div>
      </div>
    </div>
  );
}
