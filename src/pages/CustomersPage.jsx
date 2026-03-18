import { useState, useEffect, useRef } from "react";
import api from "../api/api.js";
import EP from "../api/apiEndpoints.js";
import "../styles/theme.css";
import "../styles/CustomersPage.css";

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
  openingBalanceType: "Debit",
  openingBalanceDate: TODAY,
  notes: "",
  imageFront: "",
  imageBack: "",
};

/* ── XP Fieldset ── */
function XPFieldset({ legend, children }) {
  return (
    <fieldset className="cp-fieldset">
      <legend className="cp-legend">{legend}</legend>
      {children}
    </fieldset>
  );
}

/* ── Form Row ── */
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

/* ── Image Upload ── */
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
          title="Choose from gallery"
        >
          <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
            <path d="M.5 1a.5.5 0 0 0 0 1h1.11l.401 1.607 1.498 7.985A.5.5 0 0 0 4 12h1a2 2 0 1 0 0 4 2 2 0 0 0 0-4h7a2 2 0 1 0 0 4 2 2 0 0 0 0-4h1a.5.5 0 0 0 .491-.408l1.5-8A.5.5 0 0 0 14.5 3H2.89l-.405-1.621A.5.5 0 0 0 2 1z" />
          </svg>
          Gallery
        </button>
        <button
          className="xp-btn xp-btn-sm"
          onClick={() => camRef.current?.click()}
          title="Take photo"
        >
          <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
            <path d="M15 12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h1.172a3 3 0 0 0 2.12-.879l.83-.828A1 1 0 0 1 6.827 3h2.344a1 1 0 0 1 .707.293l.828.828A3 3 0 0 0 12.828 5H14a1 1 0 0 1 1 1zM2 4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1.172a2 2 0 0 1-1.414-.586l-.828-.828A2 2 0 0 0 9.172 2H6.828a2 2 0 0 0-1.414.586l-.828.828A2 2 0 0 1 3.172 4z" />
            <path d="M8 11a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5m0 1a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7" />
          </svg>
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
   MAIN PAGE
───────────────────────────────────────────────────────────── */
export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [filtered, setFiltered] = useState([]);
  const [selId, setSelId] = useState(null);
  const [selIdx, setSelIdx] = useState(-1);
  const [form, setForm] = useState({ ...EMPTY });
  const [activeTab, setActiveTab] = useState("Office");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ text: "", type: "" });

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
      setFiltered(customers);
      return;
    }
    const q = search.toLowerCase();
    setFiltered(
      customers.filter(
        (c) =>
          c.name?.toLowerCase().includes(q) ||
          c.code?.toLowerCase().includes(q) ||
          c.phone?.toLowerCase().includes(q) ||
          c.area?.toLowerCase().includes(q),
      ),
    );
    setSelIdx(-1);
  }, [search, customers]);

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
      const { data } = await api.get(`${EP.CUSTOMERS.GET_ALL}?type=credit`);
      if (data.success) {
        setCustomers(data.data);
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

  const loadCustomer = (c, idx) => {
    setSelId(c._id);
    setSelIdx(idx ?? filtered.findIndex((x) => x._id === c._id));
    setForm({
      code: c.code || "",
      name: c.name || "",
      nameUrdu: c.nameUrdu || "",
      creditLimit: c.creditLimit || "",
      contactPerson: c.contactPerson || "",
      phone: c.phone || "",
      otherPhone: c.otherPhone || "",
      cell: c.cell || "",
      address: c.address || "",
      area: c.area || "",
      email: c.email || "",
      openingBalance: Math.abs(c.openingBalance || 0) || "",
      openingBalanceType:
        c.openingBalanceType ||
        ((c.openingBalance || 0) >= 0 ? "Debit" : "Credit"),
      openingBalanceDate: c.openingBalanceDate || TODAY,
      notes: c.notes || "",
      imageFront: c.imageFront || "",
      imageBack: c.imageBack || "",
    });
    setActiveTab("Office");
    setTimeout(() => refs.name.current?.focus(), 30);
  };

  const handleNew = () => {
    setSelId(null);
    setSelIdx(-1);
    setForm({ ...EMPTY });
    setActiveTab("Office");
    setTimeout(() => refs.name.current?.focus(), 30);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      showMsg("Name is required", "error");
      refs.name.current?.focus();
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        type: "credit",
        creditLimit: parseFloat(form.creditLimit) || 0,
        openingBalance:
          form.openingBalanceType === "Credit"
            ? -Math.abs(parseFloat(form.openingBalance) || 0)
            : Math.abs(parseFloat(form.openingBalance) || 0),
      };
      const { data } = selId
        ? await api.put(EP.CUSTOMERS.UPDATE(selId), payload)
        : await api.post(EP.CUSTOMERS.CREATE, payload);
      if (data.success) {
        showMsg(selId ? "Record updated" : "Record saved");
        await fetchAll();
        if (!selId) setForm((p) => ({ ...p, code: data.data.code }));
        setSelId(data.data._id);
      } else showMsg(data.message, "error");
    } catch (e) {
      showMsg(e.response?.data?.message || "Save failed", "error");
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!selId) return;
    if (!window.confirm(`Delete "${form.name}"?`)) return;
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
    loadCustomer(filtered[next], next);
  };

  const listKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const n = Math.min(selIdx + 1, filtered.length - 1);
      loadCustomer(filtered[n], n);
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const n = Math.max(selIdx - 1, 0);
      loadCustomer(filtered[n], n);
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
        loadCustomer(filtered[idx], idx);
      }
    }
  };

  const totalDue = customers.reduce((s, c) => s + (c.currentBalance || 0), 0);

  return (
    <div className="cp-page">
      {/* ── Titlebar ── */}
      <div className="xp-titlebar">
        <svg
          width="15"
          height="15"
          viewBox="0 0 16 16"
          fill="rgba(255,255,255,0.85)"
        >
          <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0m4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4" />
        </svg>
        <span className="xp-tb-title">
          Credit Customers — Account Management
        </span>
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

      {/* ── Hint bar ── */}
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
          Credit Customers Only
        </span>
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

      {/* ── Middle: Left form + Right list ── */}
      <div className="cp-middle">
        {/* ════ LEFT ════ */}
        <div className="cp-left">
          {/* Account Levels */}
          <XPFieldset legend="Account Level">
            <div className="cp-frow" style={{ marginTop: 4 }}>
              <label>Account ID</label>
              <div className="cp-acct-row">
                <input
                  ref={refs.code}
                  className="xp-input"
                  value={form.code}
                  onChange={(e) => set("code", e.target.value)}
                  onKeyDown={(e) => onEnterNext(e, refs.name)}
                  placeholder="Auto"
                  tabIndex={1}
                  style={{ width: 90 }}
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
                    <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6" />
                    <path d="M8 9c-5.333 0-8 2.667-8 4v1h16v-1c0-1.333-2.667-4-8-4" />
                  </svg>
                  Credit Customer
                </span>
              </div>
            </div>
          </XPFieldset>

          {/* Account Info */}
          <XPFieldset legend="Account Information">
            <div style={{ marginTop: 4 }}>
              <FRow label="Full Name *">
                <input
                  ref={refs.name}
                  className="xp-input"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  onKeyDown={(e) => onEnterNext(e, refs.nameUrdu)}
                  placeholder="Customer name *"
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
              <FRow label="Credit Limit">
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

              {/* inner tabs */}
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
                      label="Front (CNIC / Face)"
                      value={form.imageFront}
                      onChange={(v) => set("imageFront", v)}
                    />
                    <ImageUpload
                      label="Back (CNIC Back)"
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

        {/* ════ RIGHT ════ */}
        <div className="cp-right">
          <XPFieldset legend="Credit Customers List">
            <div
              style={{
                paddingTop: 6,
                display: "flex",
                flexDirection: "column",
                height: "100%",
                gap: 6,
              }}
            >
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
                    placeholder="Search name / code / phone…"
                    autoComplete="off"
                    tabIndex={20}
                  />
                </div>
                <span className="cp-total-due">
                  Total Due: PKR {fmt(totalDue)}
                </span>
              </div>

              <div className="cp-list-table-wrap">
                <table className="cp-list-table">
                  <thead>
                    <tr>
                      <th style={{ width: 32 }}>#</th>
                      <th>Code</th>
                      <th>Name</th>
                      <th>Phone</th>
                      <th>Area</th>
                      <th className="r">Balance</th>
                    </tr>
                  </thead>
                  <tbody tabIndex={21} onKeyDown={listKeyDown}>
                    {loading && (
                      <tr>
                        <td colSpan={6} className="xp-loading">
                          Loading…
                        </td>
                      </tr>
                    )}
                    {!loading && filtered.length === 0 && (
                      <tr>
                        <td colSpan={6} className="xp-empty">
                          No credit customers found
                        </td>
                      </tr>
                    )}
                    {filtered.map((c, i) => (
                      <tr
                        key={c._id}
                        className={selId === c._id ? "selected" : ""}
                        onClick={() => loadCustomer(c, i)}
                      >
                        <td
                          className="text-muted"
                          style={{ fontSize: "var(--xp-fs-xs)" }}
                        >
                          {i + 1}
                        </td>
                        <td>
                          <span className="xp-code">{c.code || "—"}</span>
                        </td>
                        <td>
                          <button className="xp-link-btn">{c.name}</button>
                        </td>
                        <td className="text-muted">{c.phone || "—"}</td>
                        <td className="text-muted">{c.area || "—"}</td>
                        <td className="r mono">
                          <span
                            className={`xp-amt${(c.currentBalance || 0) > 0 ? " danger" : " muted"}`}
                          >
                            {fmt(c.currentBalance || 0)}
                          </span>
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
                {filtered.length} record(s) &nbsp;|&nbsp; ↑↓ navigate
                &nbsp;|&nbsp; Enter = edit
              </div>
            </div>
          </XPFieldset>
        </div>
      </div>

      {/* ── Bottom: Opening Balance + Commands ── */}
      <div className="cp-bottom">
        {/* Opening Balance */}
        <XPFieldset legend="Opening Balance">
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
                Amount
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
              <button
                className={`cp-ob-type-btn${form.openingBalanceType === "Debit" ? " active-debit" : ""}`}
                onClick={() => set("openingBalanceType", "Debit")}
              >
                Debit
              </button>
              <button
                className={`cp-ob-type-btn${form.openingBalanceType === "Credit" ? " active-credit" : ""}`}
                onClick={() => set("openingBalanceType", "Credit")}
              >
                Credit
              </button>
            </div>
            <div className="cp-ob-row">
              <label className="xp-label" style={{ whiteSpace: "nowrap" }}>
                Date
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

        {/* Commands */}
        <XPFieldset legend="Commands">
          <div className="cp-cmd-grid" style={{ paddingTop: 6 }}>
            <button
              className="xp-btn xp-btn-sm"
              onClick={fetchAll}
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
              ref={refs.saveBtn}
              className="xp-btn xp-btn-primary xp-btn-sm"
              onClick={handleSave}
              disabled={saving}
              tabIndex={15}
            >
              <svg
                width="11"
                height="11"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <path d="M2 1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H9.5a1 1 0 0 0-1 1v7.293l2.646-2.647a.5.5 0 0 1 .708.708l-3.5 3.5a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L7.5 9.293V2a2 2 0 0 1 2-2H14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2z" />
              </svg>
              {saving ? "Saving…" : "Save (F5)"}
            </button>
            <button
              className="xp-btn xp-btn-sm"
              onClick={handleNew}
              tabIndex={16}
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
              New (F2)
            </button>
            <button
              className="xp-btn xp-btn-sm"
              onClick={() => alert("Print coming soon")}
            >
              <svg
                width="11"
                height="11"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <path d="M2.5 8a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1" />
                <path d="M5 1a2 2 0 0 0-2 2v2H2a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h1v1a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-1h1a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-1V3a2 2 0 0 0-2-2zm4 7h2v3H5v-3h4zm-4 2V9h4v1H5zm4-2H5V8h4v1zm-4 4v-1h4v1H5zm0 1v1h4v-1H5z" />
              </svg>
              Print
            </button>
            <button
              className="xp-btn xp-btn-sm"
              onClick={() => refs.search.current?.focus()}
            >
              <svg
                width="11"
                height="11"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1z" />
              </svg>
              Search
            </button>
            <button
              className="xp-btn xp-btn-danger xp-btn-sm"
              onClick={handleDelete}
              disabled={!selId}
              tabIndex={17}
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
              Delete (Del)
            </button>
            <button className="xp-btn xp-btn-sm" onClick={handleNew}>
              <svg
                width="11"
                height="11"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z" />
              </svg>
              Close
            </button>
          </div>
        </XPFieldset>
      </div>

      {/* ── Status Bar ── */}
      <div className="xp-statusbar">
        <div className="xp-status-pane">
          <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
            <path d="M15 14s1 0 1-1-1-4-5-4-5 3-5 4 1 1 1 1z" />
            <path d="M11 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4" />
          </svg>
          {selId ? `Editing: ${form.name}` : "New Record"}
        </div>
        <div className="xp-status-pane">
          {filtered.length} / {customers.length} records
        </div>
        <div className="xp-status-pane">
          Total Due:{" "}
          <strong
            style={{
              fontFamily: "var(--xp-mono)",
              marginLeft: 4,
              color: "var(--xp-red)",
            }}
          >
            PKR {fmt(totalDue)}
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
