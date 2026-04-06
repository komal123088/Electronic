// SuppliersPage.jsx
import { useState, useEffect, useRef } from "react";
import api from "../api/api.js";
import EP from "../api/apiEndpoints.js";
import "../styles/theme.css";
import "../styles/CustomersPage.css";
import { useNavigate } from "react-router-dom";

const TODAY = new Date().toISOString().split("T")[0];
const fmt = (n) => Number(n || 0).toLocaleString("en-PK");

const EMPTY = {
  code: "",
  name: "",
  nameUrdu: "",
  creditLimit: "",
  contactPerson: "",
  phone: "",
  otherPhone: "",
  cell: "",
  address: "",
  area: "",
  email: "",
  openingBalance: "",
  openingBalanceType: "Credit", // Suppliers typically start with Credit balance (we owe them)
  openingBalanceDate: TODAY,
  notes: "",
  imageFront: "",
  imageBack: "",
};

function XPFieldset({ legend, children }) {
  return (
    <fieldset className="cp-fieldset">
      <legend className="cp-legend">{legend}</legend>
      {children}
    </fieldset>
  );
}

function FRow({ label, children }) {
  return (
    <div className="cp-frow">
      <label>{label}</label>
      {children}
    </div>
  );
}

function onEnterNext(e, nextRef) {
  if (e.key === "Enter") {
    e.preventDefault();
    nextRef?.current?.focus();
  }
}

function ImageUpload({ label, value, onChange }) {
  const fileRef = useRef(null);
  const camRef = useRef(null);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX = 600;
        let w = img.width,
          h = img.height;
        if (w > MAX) {
          h = Math.round((h * MAX) / w);
          w = MAX;
        }
        if (h > MAX) {
          w = Math.round((w * MAX) / h);
          h = MAX;
        }
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        onChange(canvas.toDataURL("image/jpeg", 0.75));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div className="cp-img-upload">
      <div className="cp-img-label">{label}</div>
      <div className="cp-img-preview">
        {value ? (
          <>
            <img src={value} alt={label} />
            <button
              className="cp-img-remove"
              onClick={() => onChange("")}
              title="Remove"
            >
              ✕
            </button>
          </>
        ) : (
          <div className="cp-img-empty">
            <svg width="24" height="24" viewBox="0 0 16 16" fill="#ccc">
              <path d="M6.002 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0" />
              <path d="M2.002 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2zm12 1a1 1 0 0 1 1 1v6.5l-3.777-1.947a.5.5 0 0 0-.577.093l-3.71 3.71-2.66-1.772a.5.5 0 0 0-.63.062L1.002 12V3a1 1 0 0 1 1-1z" />
            </svg>
            <div>No image</div>
          </div>
        )}
      </div>
      <div className="cp-img-btns">
        <button
          className="xp-btn xp-btn-sm"
          onClick={() => fileRef.current?.click()}
          title="Gallery"
        >
          <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
            <path d="M.5 1a.5.5 0 0 0 0 1h1.11l.401 1.607 1.498 7.985A.5.5 0 0 0 4 12h1a2 2 0 1 0 0 4 2 2 0 0 0 0-4h7a2 2 0 1 0 0 4 2 2 0 0 0 0-4h1a.5.5 0 0 0 .491-.408l1.5-8A.5.5 0 0 0 14.5 3H2.89l-.405-1.621A.5.5 0 0 0 2 1z" />
          </svg>{" "}
          Gallery
        </button>
        <button
          className="xp-btn xp-btn-sm"
          onClick={() => camRef.current?.click()}
          title="Camera"
        >
          <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
            <path d="M15 12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h1.172a3 3 0 0 0 2.12-.879l.83-.828A1 1 0 0 1 6.827 3h2.344a1 1 0 0 1 .707.293l.828.828A3 3 0 0 0 12.828 5H14a1 1 0 0 1 1 1zM2 4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1.172a2 2 0 0 1-1.414-.586l-.828-.828A2 2 0 0 0 9.172 2H6.828a2 2 0 0 0-1.414.586l-.828.828A2 2 0 0 1 3.172 4z" />
            <path d="M8 11a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5m0 1a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7" />
          </svg>{" "}
          Camera
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleFile}
        />
        <input
          ref={camRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: "none" }}
          onChange={handleFile}
        />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN PAGE - SUPPLIERS
───────────────────────────────────────────────────────────── */
export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState("");
  const [filtered, setFiltered] = useState([]);
  const [selId, setSelId] = useState(null);
  const [selIdx, setSelIdx] = useState(-1);
  const [form, setForm] = useState({ ...EMPTY });
  const [activeTab, setActiveTab] = useState("Office");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ text: "", type: "" });
  const navigate = useNavigate();

  const refs = {
    code: useRef(null),
    name: useRef(null),
    nameUrdu: useRef(null),
    creditLimit: useRef(null),
    contactPerson: useRef(null),
    phone: useRef(null),
    otherPhone: useRef(null),
    cell: useRef(null),
    address: useRef(null),
    area: useRef(null),
    email: useRef(null),
    openingBalance: useRef(null),
    openingBalanceDate: useRef(null),
    search: useRef(null),
    saveBtn: useRef(null),
    notes: useRef(null),
  };

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(suppliers);
      return;
    }
    const q = search.toLowerCase();
    setFiltered(
      suppliers.filter(
        (s) =>
          s.name?.toLowerCase().includes(q) ||
          s.code?.toLowerCase().includes(q) ||
          s.phone?.toLowerCase().includes(q) ||
          s.area?.toLowerCase().includes(q),
      ),
    );
    setSelIdx(-1);
  }, [search, suppliers]);

  useEffect(() => {
    const h = (e) => {
      if (e.key === "F2") {
        e.preventDefault();
        handleNew();
      }
      if (e.key === "F5") {
        e.preventDefault();
        handleSave();
      }
      if (
        e.key === "Delete" &&
        !["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)
      ) {
        e.preventDefault();
        handleDelete();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [selId, form]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`${EP.CUSTOMERS.GET_ALL}?type=supplier`);
      if (data.success) {
        setSuppliers(data.data);
        setFiltered(data.data);
      }
    } catch {
      showMsg("Load failed", "error");
    }
    setLoading(false);
  };

  const showMsg = (text, type = "success") => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: "", type: "" }), 3000);
  };

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const loadSupplier = (s, idx) => {
    setSelId(s._id);
    setSelIdx(idx ?? filtered.findIndex((x) => x._id === s._id));
    setForm({
      code: s.code || "",
      name: s.name || "",
      nameUrdu: s.nameUrdu || "",
      creditLimit: s.creditLimit || "",
      contactPerson: s.contactPerson || "",
      phone: s.phone || "",
      otherPhone: s.otherPhone || "",
      cell: s.cell || "",
      address: s.address || "",
      area: s.area || "",
      email: s.email || "",
      openingBalance: Math.abs(s.openingBalance || 0) || "",
      openingBalanceType:
        s.openingBalanceType ||
        ((s.openingBalance || 0) >= 0 ? "Credit" : "Debit"),
      openingBalanceDate: s.openingBalanceDate || TODAY,
      notes: s.notes || "",
      imageFront: s.imageFront || "",
      imageBack: s.imageBack || "",
    });
    setActiveTab("Office");
    setTimeout(() => refs.name.current?.focus(), 30);
  };

  const handleNew = () => {
    setSelId(null);
    setSelIdx(-1);
    setForm({ ...EMPTY });
    setActiveTab("Office");
    setSearch("");
    setTimeout(() => refs.name.current?.focus(), 30);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      showMsg("Supplier name is required", "error");
      refs.name.current?.focus();
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        type: "supplier",
        creditLimit: parseFloat(form.creditLimit) || 0,
        openingBalance: Math.abs(parseFloat(form.openingBalance) || 0),
      };
      const { data } = selId
        ? await api.put(EP.CUSTOMERS.UPDATE(selId), payload)
        : await api.post(EP.CUSTOMERS.CREATE, payload);
      if (data.success) {
        showMsg(selId ? "Supplier updated" : "Supplier saved");
        await fetchAll();
        if (!selId) handleNew();
        else setSelId(data.data._id);
      } else showMsg(data.message, "error");
    } catch (e) {
      showMsg(e.response?.data?.message || "Save failed", "error");
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!selId) return;
    if (!window.confirm(`Delete supplier "${form.name}"?`)) return;
    try {
      const { data } = await api.delete(EP.CUSTOMERS.DELETE(selId));
      if (data.success) {
        showMsg("Deleted");
        handleNew();
        fetchAll();
      } else showMsg(data.message, "error");
    } catch {
      showMsg("Delete failed", "error");
    }
  };

  const navTo = (dir) => {
    if (!filtered.length) return;
    let next = dir === "prev" ? selIdx - 1 : selIdx + 1;
    next = Math.max(0, Math.min(next, filtered.length - 1));
    loadSupplier(filtered[next], next);
  };

  const listKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const n = Math.min(selIdx + 1, filtered.length - 1);
      loadSupplier(filtered[n], n);
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const n = Math.max(selIdx - 1, 0);
      loadSupplier(filtered[n], n);
    }
    if (e.key === "Enter" && selIdx >= 0) {
      e.preventDefault();
      refs.name.current?.focus();
    }
    if (e.key === "Escape") refs.name.current?.focus();
  };

  const searchKeyDown = (e) => {
    if (e.key === "Enter" || e.key === "ArrowDown") {
      e.preventDefault();
      if (filtered.length > 0) {
        const idx = selIdx >= 0 ? selIdx : 0;
        loadSupplier(filtered[idx], idx);
      }
    }
  };

  const totalPayable = suppliers.reduce((s, sup) => s + (sup.currentBalance || 0), 0);

  return (
    <div className="cp-page">
      {/* Titlebar */}
      <div className="xp-titlebar">
        <svg
          width="15"
          height="15"
          viewBox="0 0 16 16"
          fill="rgba(255,255,255,0.85)"
        >
          <path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h3A1.5 1.5 0 0 1 7 2.5v3A1.5 1.5 0 0 1 5.5 7h-3A1.5 1.5 0 0 1 1 5.5zM2.5 2a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5zm6.5.5A1.5 1.5 0 0 1 10.5 1h3A1.5 1.5 0 0 1 15 2.5v3A1.5 1.5 0 0 1 13.5 7h-3A1.5 1.5 0 0 1 9 5.5zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5zM1 10.5A1.5 1.5 0 0 1 2.5 9h3A1.5 1.5 0 0 1 7 10.5v3A1.5 1.5 0 0 1 5.5 15h-3A1.5 1.5 0 0 1 1 13.5zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5zm6.5.5A1.5 1.5 0 0 1 10.5 9h3a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 13.5zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5z" />
        </svg>
        <span className="xp-tb-title">
          Supplier Accounts — Purchase Management
        </span>
        <div className="xp-tb-actions">
          <div className="xp-tb-divider" />
          <button className="xp-cap-btn" title="Minimize">
            ─
          </button>
          <button
            className="xp-cap-btn"
            title="Maximize"
            onClick={() => {
              if (!document.fullscreenElement)
                document.documentElement.requestFullscreen();
              else document.exitFullscreen();
            }}
          >
            □
          </button>
          <button
            className="xp-cap-btn xp-cap-close"
            title="Close"
            onClick={() => navigate("/")}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Hint bar */}
      <div className="cs-hint-bar">
        <span>
          <kbd>F2</kbd> New
        </span>
        <span>
          <kbd>F5</kbd> Save
        </span>
        <span>
          <kbd>Del</kbd> Delete
        </span>
        <span>
          <kbd>Enter</kbd> Next Field
        </span>
        <span>
          <kbd>↑↓</kbd> Navigate List
        </span>
        <span
          style={{
            marginLeft: "auto",
            color: "var(--xp-blue-dark)",
            fontWeight: 700,
          }}
        >
          Suppliers Only
        </span>
      </div>

      {/* Alert */}
      {msg.text && (
        <div
          className={`xp-alert ${msg.type === "success" ? "xp-alert-success" : "xp-alert-error"}`}
          style={{ margin: "4px 10px 0" }}
        >
          {msg.text}
        </div>
      )}

      {/* Middle */}
      <div className="cp-middle">
        {/* LEFT */}
        <div className="cp-left">
          <XPFieldset legend="Supplier Account">
            <div className="cp-frow" style={{ marginTop: 4 }}>
              <label>Supplier ID</label>
              <div className="cp-acct-row">
                <input
                  ref={refs.code}
                  className="xp-input"
                  value={form.code}
                  onChange={(e) => set("code", e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const found = suppliers.find(
                        (s) =>
                          s.code?.toLowerCase() === form.code.toLowerCase(),
                      );
                      if (found) loadSupplier(found);
                      else refs.name.current?.focus();
                    }
                  }}
                  placeholder="ID or press enter"
                  tabIndex={1}
                  style={{ width: 110 }}
                />
                <button
                  className="xp-btn xp-btn-sm xp-btn-ico"
                  onClick={() => navTo("prev")}
                  disabled={selIdx <= 0}
                  title="Previous"
                >
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0"
                    />
                  </svg>
                </button>
                <button
                  className="xp-btn xp-btn-sm xp-btn-ico"
                  onClick={() => navTo("next")}
                  disabled={selIdx >= filtered.length - 1}
                  title="Next"
                >
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708"
                    />
                  </svg>
                </button>
                <span className="cp-type-badge">
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                  >
                    <path d="M2.5 1.5A1.5 1.5 0 0 1 4 0h8a1.5 1.5 0 0 1 1.5 1.5v13a.5.5 0 0 1-.832.374L8 11.15l-4.668 3.724A.5.5 0 0 1 2.5 14.5z" />
                  </svg>
                  Supplier
                </span>
              </div>
            </div>
          </XPFieldset>

          <XPFieldset legend="Supplier Information">
            <div style={{ marginTop: 4 }}>
              <FRow label="Supplier Name *">
                <input
                  ref={refs.name}
                  className="xp-input"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  onKeyDown={(e) => onEnterNext(e, refs.nameUrdu)}
                  placeholder="Supplier name *"
                  tabIndex={2}
                  autoFocus
                />
              </FRow>
              <FRow label="Urdu Name">
                <input
                  ref={refs.nameUrdu}
                  className="xp-input"
                  value={form.nameUrdu}
                  onChange={(e) => set("nameUrdu", e.target.value)}
                  onKeyDown={(e) => onEnterNext(e, refs.creditLimit)}
                  dir="rtl"
                  placeholder="اردو نام"
                  tabIndex={3}
                />
              </FRow>
              <FRow label="Credit Limit (Purchase Limit)">
                <input
                  ref={refs.creditLimit}
                  type="number"
                  className="xp-input"
                  value={form.creditLimit}
                  onChange={(e) => set("creditLimit", e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      setActiveTab("Office");
                      setTimeout(() => refs.contactPerson.current?.focus(), 30);
                    }
                  }}
                  placeholder="0 = unlimited"
                  tabIndex={4}
                />
              </FRow>

              <div className="cp-inner-tabs">
                {["Office", "Picture", "Others"].map((t) => (
                  <button
                    key={t}
                    className={`cp-inner-tab${activeTab === t ? " active" : ""}`}
                    onClick={() => setActiveTab(t)}
                    tabIndex={-1}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <div className="cp-tab-content">
                {activeTab === "Office" && (
                  <>
                    <FRow label="Contact Person">
                      <input
                        ref={refs.contactPerson}
                        className="xp-input"
                        value={form.contactPerson}
                        onChange={(e) => set("contactPerson", e.target.value)}
                        onKeyDown={(e) => onEnterNext(e, refs.phone)}
                        tabIndex={5}
                      />
                    </FRow>
                    <FRow label="Phone #">
                      <input
                        ref={refs.phone}
                        className="xp-input"
                        value={form.phone}
                        onChange={(e) => set("phone", e.target.value)}
                        onKeyDown={(e) => onEnterNext(e, refs.otherPhone)}
                        tabIndex={6}
                      />
                    </FRow>
                    <FRow label="Other #">
                      <input
                        ref={refs.otherPhone}
                        className="xp-input"
                        value={form.otherPhone}
                        onChange={(e) => set("otherPhone", e.target.value)}
                        onKeyDown={(e) => onEnterNext(e, refs.cell)}
                        tabIndex={7}
                      />
                    </FRow>
                    <FRow label="Cell #">
                      <input
                        ref={refs.cell}
                        className="xp-input"
                        value={form.cell}
                        onChange={(e) => set("cell", e.target.value)}
                        onKeyDown={(e) => onEnterNext(e, refs.address)}
                        tabIndex={8}
                      />
                    </FRow>
                    <FRow label="Address">
                      <input
                        ref={refs.address}
                        className="xp-input"
                        value={form.address}
                        onChange={(e) => set("address", e.target.value)}
                        onKeyDown={(e) => onEnterNext(e, refs.area)}
                        tabIndex={9}
                      />
                    </FRow>
                    <FRow label="Area">
                      <input
                        ref={refs.area}
                        className="xp-input"
                        value={form.area}
                        onChange={(e) => set("area", e.target.value)}
                        onKeyDown={(e) => onEnterNext(e, refs.email)}
                        tabIndex={10}
                      />
                    </FRow>
                    <FRow label="Email">
                      <input
                        ref={refs.email}
                        className="xp-input"
                        value={form.email}
                        onChange={(e) => set("email", e.target.value)}
                        onKeyDown={(e) => onEnterNext(e, refs.openingBalance)}
                        tabIndex={11}
                      />
                    </FRow>
                  </>
                )}
                {activeTab === "Picture" && (
                  <div className="cp-img-pair">
                    <ImageUpload
                      label="Front (ID / Business Card)"
                      value={form.imageFront}
                      onChange={(v) => set("imageFront", v)}
                    />
                    <ImageUpload
                      label="Back (Additional Doc)"
                      value={form.imageBack}
                      onChange={(v) => set("imageBack", v)}
                    />
                  </div>
                )}
                {activeTab === "Others" && (
                  <div className="cp-frow full" style={{ marginTop: 4 }}>
                    <label style={{ textAlign: "left", marginBottom: 3 }}>
                      Notes
                    </label>
                    <textarea
                      ref={refs.notes}
                      className="cp-textarea"
                      rows={7}
                      value={form.notes}
                      onChange={(e) => set("notes", e.target.value)}
                      tabIndex={12}
                    />
                  </div>
                )}
              </div>
            </div>
          </XPFieldset>
        </div>

        {/* RIGHT */}
        <div className="cp-right">
          <XPFieldset legend="Supplier List">
            <div className="cp-right-inner">
              <div className="cp-list-header">
                <div className="xp-search-wrap" style={{ flex: 1 }}>
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
                    ref={refs.search}
                    type="text"
                    className="xp-input"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={searchKeyDown}
                    placeholder="Search supplier name / code / phone…"
                    autoComplete="off"
                    tabIndex={20}
                  />
                </div>
                <span className="cp-total-due">Total Payable: PKR {fmt(totalPayable)}</span>
              </div>

              <div className="cp-list-table-wrap">
                <table className="cp-list-table">
                  <thead>
                    <tr>
                      <th className="col-sr">#</th>
                      <th className="col-code">Code</th>
                      <th className="col-name">Supplier Name</th>
                    </tr>
                  </thead>
                  <tbody tabIndex={21} onKeyDown={listKeyDown}>
                    {loading && (
                      <tr>
                        <td colSpan={3} className="xp-loading">
                          Loading suppliers…
                        </td>
                      </tr>
                    )}
                    {!loading && filtered.length === 0 && (
                      <tr>
                        <td colSpan={3} className="xp-empty">
                          No suppliers found
                        </td>
                      </tr>
                    )}
                    {!loading &&
                      filtered.map((s, i) => (
                        <tr
                          key={s._id}
                          className={selId === s._id ? "cp-row-selected" : ""}
                          onClick={() => loadSupplier(s, i)}
                        >
                          <td className="col-sr text-muted">{i + 1}</td>
                          <td className="col-code">
                            <span className="xp-code">{s.code || "—"}</span>
                          </td>
                          <td className="col-name">
                            <button className="xp-link-btn">{s.name}</button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              <div className="cp-list-footer">
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <path d="M15 14s1 0 1-1-1-4-5-4-5 3-5 4 1 1 1 1z" />
                  <path d="M11 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4" />
                </svg>
                {filtered.length} supplier(s) &nbsp;|&nbsp; ↑↓ navigate
                &nbsp;|&nbsp; Enter = edit
              </div>
            </div>
          </XPFieldset>
        </div>
      </div>

      {/* Bottom */}
      <div className="cp-bottom">
        <XPFieldset legend="Opening Balance (Payable)">
          <div
            style={{
              paddingTop: 6,
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            <div className="cp-ob-row">
              <label className="xp-label" style={{ whiteSpace: "nowrap" }}>
                Amount (What we owe)
              </label>
              <input
                ref={refs.openingBalance}
                type="number"
                className="xp-input"
                value={form.openingBalance}
                onChange={(e) => set("openingBalance", e.target.value)}
                onKeyDown={(e) => onEnterNext(e, refs.openingBalanceDate)}
                style={{ width: 120 }}
                tabIndex={13}
              />
            </div>
            <div className="cp-ob-row">
              <label className="xp-label" style={{ whiteSpace: "nowrap" }}>
                Since Date
              </label>
              <input
                ref={refs.openingBalanceDate}
                type="date"
                className="xp-input"
                value={form.openingBalanceDate}
                onChange={(e) => set("openingBalanceDate", e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    refs.saveBtn.current?.focus();
                  }
                }}
                tabIndex={14}
              />
            </div>
          </div>
        </XPFieldset>

        <XPFieldset legend="Commands">
          <div className="cp-cmd-grid" style={{ paddingTop: 6 }}>
            <button
              className="xp-btn xp-btn-sm"
              onClick={() => {
                fetchAll();
                handleNew();
              }}
              disabled={loading}
            >
              Refresh
            </button>
            <button
              ref={refs.saveBtn}
              className="xp-btn xp-btn-primary xp-btn-sm"
              onClick={handleSave}
              disabled={saving}
              tabIndex={15}
            >
              {saving ? "Saving…" : "Save (F5)"}
            </button>
            <button
              className="xp-btn xp-btn-sm"
              onClick={handleNew}
              tabIndex={16}
            >
              New (F2)
            </button>
            <button
              className="xp-btn xp-btn-sm"
              onClick={() => alert("Purchase order / report coming soon")}
            >
              Purchase
            </button>
            <button
              className="xp-btn xp-btn-sm"
              onClick={() => refs.search.current?.focus()}
            >
              Search
            </button>
            <button
              className="xp-btn xp-btn-danger xp-btn-sm"
              onClick={handleDelete}
              disabled={!selId}
              tabIndex={17}
            >
              Delete (Del)
            </button>
          </div>
        </XPFieldset>
      </div>

      {/* Status Bar */}
      <div className="xp-statusbar">
        <div className="xp-status-pane">
          <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
            <path d="M2.5 1.5A1.5 1.5 0 0 1 4 0h8a1.5 1.5 0 0 1 1.5 1.5v13a.5.5 0 0 1-.832.374L8 11.15l-4.668 3.724A.5.5 0 0 1 2.5 14.5z" />
          </svg>
          {selId ? `Editing: ${form.name}` : "New Supplier"}
        </div>
        <div className="xp-status-pane">
          {filtered.length} / {suppliers.length} suppliers
        </div>
        <div className="xp-status-pane">
          Total Payable:{" "}
          <strong
            style={{
              fontFamily: "var(--xp-mono)",
              marginLeft: 4,
              color: "var(--xp-red)",
            }}
          >
            PKR {fmt(totalPayable)}
          </strong>
        </div>
        {selIdx >= 0 && (
          <div className="xp-status-pane">
            Record {selIdx + 1} of {filtered.length}
          </div>
        )}
      </div>
    </div>
  );
}