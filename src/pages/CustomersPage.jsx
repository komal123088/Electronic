// pages/CustomersPage.jsx
// Windows XP style — exact layout from screenshot
// KEYBOARD: Enter moves to next field, F2=New, F5=Save, Delete=Del, Esc=reset
// Mouse usage minimized — full keyboard workflow

import { useState, useEffect, useRef, useCallback } from "react";
import "../styles/CustomersPage.css";
import api from "../api/api.js";
import EP from "../api/apiEndpoints.js";

const TODAY = new Date().toISOString().split("T")[0];

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
};

// ── XP fieldset wrapper ───────────────────────────────────────────────────────
function XPFieldset({ legend, children, style }) {
  return (
    <fieldset className="xp-fieldset" style={style}>
      <legend>{legend}</legend>
      {children}
    </fieldset>
  );
}

// ── Form row ──────────────────────────────────────────────────────────────────
function FRow({ label, children, labelW = 104 }) {
  return (
    <div className="cp-frow">
      <span className="cp-flabel" style={{ width: labelW }}>
        {label}
      </span>
      {children}
    </div>
  );
}

// ── Move focus to next input on Enter ────────────────────────────────────────
function onEnterNext(e, nextRef) {
  if (e.key === "Enter") {
    e.preventDefault();
    nextRef?.current?.focus();
  }
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [filtered, setFiltered] = useState([]);
  const [selId, setSelId] = useState(null);
  const [selIdx, setSelIdx] = useState(-1); // for ↑↓ in list
  const [form, setForm] = useState({ ...EMPTY });
  const [activeTab, setActiveTab] = useState("Office");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ text: "", type: "" });

  // ── Field refs for Enter-key navigation ─────────────────────────────────
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
  };

  // Enter key order through form fields
  const FIELD_ORDER = [
    "code",
    "name",
    "nameUrdu",
    "creditLimit",
    "contactPerson",
    "phone",
    "otherPhone",
    "cell",
    "address",
    "area",
    "email",
    "openingBalance",
    "openingBalanceDate",
  ];

  const focusNext = (currentField) => {
    const idx = FIELD_ORDER.indexOf(currentField);
    if (idx >= 0 && idx < FIELD_ORDER.length - 1) {
      refs[FIELD_ORDER[idx + 1]]?.current?.focus();
    } else {
      refs.saveBtn?.current?.focus();
    }
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
          c.phone?.toLowerCase().includes(q),
      ),
    );
    setSelIdx(-1);
  }, [search, customers]);

  // ── Global keyboard shortcuts ────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (
        e.target.tagName === "INPUT" ||
        e.target.tagName === "TEXTAREA" ||
        e.target.tagName === "SELECT"
      ) {
        // F2 = New, F5 = Save even inside inputs
        if (e.key === "F2") {
          e.preventDefault();
          handleNew();
        }
        if (e.key === "F5") {
          e.preventDefault();
          handleSave();
        }
        return;
      }
      if (e.key === "F2") {
        e.preventDefault();
        handleNew();
      }
      if (e.key === "F5") {
        e.preventDefault();
        handleSave();
      }
      if (e.key === "Delete") {
        e.preventDefault();
        handleDelete();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
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
      showMsg("Failed to load", "error");
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
      cell: c.cell || c.phone2 || "",
      address: c.address || "",
      area: c.area || c.city || "",
      email: c.email || "",
      openingBalance: Math.abs(c.openingBalance || 0) || "",
      openingBalanceType:
        c.openingBalanceType ||
        ((c.openingBalance || 0) >= 0 ? "Debit" : "Credit"),
      openingBalanceDate: c.openingBalanceDate || TODAY,
      notes: c.notes || "",
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
        phone2: form.cell,
        city: form.area,
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
        showMsg(selId ? "✅ Record updated" : "✅ Record saved");
        await fetchAll();
        if (!selId) {
          setSelId(data.data._id);
          // Update code field with auto-generated value
          setForm((p) => ({ ...p, code: data.data.code }));
        }
      } else showMsg(data.message, "error");
    } catch (e) {
      showMsg(e.response?.data?.message || e.message || "Save failed", "error");
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!selId) return;
    if (!window.confirm(`Delete "${form.name}"?`)) return;
    try {
      const { data } = await api.delete(EP.CUSTOMERS.DELETE(selId));
      if (data.success) {
        showMsg("✅ Deleted");
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
    if (next < 0) next = 0;
    if (next >= filtered.length) next = filtered.length - 1;
    loadCustomer(filtered[next], next);
  };

  // ↑↓ arrow in search results
  const listKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = Math.min(selIdx + 1, filtered.length - 1);
      loadCustomer(filtered[next], next);
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const prev = Math.max(selIdx - 1, 0);
      loadCustomer(filtered[prev], prev);
    }
    if (e.key === "Enter" && selIdx >= 0) {
      e.preventDefault();
      refs.name.current?.focus();
    }
    if (e.key === "Escape") {
      refs.search.current?.blur();
      refs.name.current?.focus();
    }
  };

  // Enter in search bar → focus list
  const searchKeyDown = (e) => {
    if (e.key === "Enter" || e.key === "ArrowDown") {
      e.preventDefault();
      if (filtered.length > 0) {
        const idx = selIdx >= 0 ? selIdx : 0;
        loadCustomer(filtered[idx], idx);
        // focus tbody
        document.getElementById("cp-tbody")?.focus();
      }
    }
  };

  return (
    <div className="cp-page">
      {/* Keyboard hint */}
      <div className="cp-shortcuts">
        F2 = New &nbsp;|&nbsp; F5 = Save &nbsp;|&nbsp; Del = Delete
        &nbsp;|&nbsp; Enter = Next field &nbsp;|&nbsp; ↑↓ = Navigate list
      </div>

      {msg.text && <div className={`cp-msg-bar ${msg.type}`}>{msg.text}</div>}

      <div className="cp-body">
        {/* ══ LEFT ════════════════════════════════════════════════════════ */}
        <div className="cp-left">
          {/* Account Levels */}
          <XPFieldset legend="Account Levels">
            <FRow label="Account ID">
              <input
                ref={refs.code}
                className="xp-input w80"
                value={form.code}
                onChange={(e) => set("code", e.target.value)}
                onKeyDown={(e) => onEnterNext(e, refs.name)}
                placeholder="Auto"
                tabIndex={1}
              />
              <button
                className="xp-nav-btn"
                onClick={() => navTo("prev")}
                disabled={selIdx <= 0}
                tabIndex={-1}
              >
                «
              </button>
              <button
                className="xp-nav-btn"
                onClick={() => navTo("next")}
                disabled={selIdx >= filtered.length - 1}
                tabIndex={-1}
              >
                »
              </button>
            </FRow>
            <FRow label="Category">
              <select className="xp-select xp-select-full" tabIndex={-1}>
                <option>Credit Customer</option>
              </select>
            </FRow>
            <FRow label="Main">
              <select className="xp-select xp-select-full" tabIndex={-1}>
                <option>Accounts Receivable</option>
              </select>
            </FRow>
            <FRow label="Control">
              <select className="xp-select xp-select-full" tabIndex={-1}>
                <option>Trade Debtors</option>
              </select>
            </FRow>
          </XPFieldset>

          {/* Account Info */}
          <XPFieldset legend="Account Info">
            <FRow label="Account Title">
              <input
                ref={refs.name}
                className="xp-input xp-input-full"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                onKeyDown={(e) => onEnterNext(e, refs.nameUrdu)}
                placeholder="Customer full name *"
                tabIndex={2}
                autoFocus
              />
            </FRow>
            <FRow label="A/C Title Urdu">
              <input
                ref={refs.nameUrdu}
                className="xp-input xp-input-full"
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
                className="xp-input w120"
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

            {/* Tabs */}
            <div className="cp-tabs-wrap">
              {["Office", "Home", "Picture", "Others"].map((t) => (
                <button
                  key={t}
                  className={`cp-tab${activeTab === t ? " active" : ""}`}
                  onClick={() => setActiveTab(t)}
                  tabIndex={-1}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="cp-tab-body">
              {activeTab === "Office" && (
                <>
                  <FRow label="Cont.Person">
                    <input
                      ref={refs.contactPerson}
                      className="xp-input xp-input-full"
                      value={form.contactPerson}
                      onChange={(e) => set("contactPerson", e.target.value)}
                      onKeyDown={(e) => onEnterNext(e, refs.phone)}
                      tabIndex={5}
                    />
                  </FRow>
                  <FRow label="Phone #">
                    <input
                      ref={refs.phone}
                      className="xp-input xp-input-full"
                      value={form.phone}
                      onChange={(e) => set("phone", e.target.value)}
                      onKeyDown={(e) => onEnterNext(e, refs.otherPhone)}
                      tabIndex={6}
                    />
                  </FRow>
                  <FRow label="Other #">
                    <input
                      ref={refs.otherPhone}
                      className="xp-input xp-input-full"
                      value={form.otherPhone}
                      onChange={(e) => set("otherPhone", e.target.value)}
                      onKeyDown={(e) => onEnterNext(e, refs.cell)}
                      tabIndex={7}
                    />
                  </FRow>
                  <FRow label="Cell #">
                    <input
                      ref={refs.cell}
                      className="xp-input xp-input-full"
                      value={form.cell}
                      onChange={(e) => set("cell", e.target.value)}
                      onKeyDown={(e) => onEnterNext(e, refs.address)}
                      tabIndex={8}
                    />
                  </FRow>
                  <FRow label="Address">
                    <input
                      ref={refs.address}
                      className="xp-input xp-input-full"
                      value={form.address}
                      onChange={(e) => set("address", e.target.value)}
                      onKeyDown={(e) => onEnterNext(e, refs.area)}
                      tabIndex={9}
                    />
                  </FRow>
                  <FRow label="Area">
                    <input
                      ref={refs.area}
                      className="xp-input xp-input-full"
                      value={form.area}
                      onChange={(e) => set("area", e.target.value)}
                      onKeyDown={(e) => onEnterNext(e, refs.email)}
                      tabIndex={10}
                    />
                  </FRow>
                  <FRow label="E-mail">
                    <input
                      ref={refs.email}
                      className="xp-input xp-input-full"
                      value={form.email}
                      onChange={(e) => set("email", e.target.value)}
                      onKeyDown={(e) => onEnterNext(e, refs.openingBalance)}
                      tabIndex={11}
                    />
                  </FRow>
                </>
              )}
              {activeTab === "Home" && (
                <div className="cp-tab-placeholder">Home contact info</div>
              )}
              {activeTab === "Picture" && (
                <div className="cp-tab-placeholder">
                  <div className="cp-picture-box">No Picture</div>
                </div>
              )}
              {activeTab === "Others" && (
                <FRow label="Notes">
                  <textarea
                    className="xp-textarea"
                    rows={6}
                    value={form.notes}
                    onChange={(e) => set("notes", e.target.value)}
                    tabIndex={12}
                  />
                </FRow>
              )}
            </div>
          </XPFieldset>
        </div>

        {/* ══ RIGHT ═══════════════════════════════════════════════════════ */}
        <div className="cp-right">
          <XPFieldset
            legend="Searching Results"
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
            }}
          >
            <div className="cp-search-row">
              <span className="cp-search-label">Search here</span>
              <input
                ref={refs.search}
                className="xp-input cp-search-input"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={searchKeyDown}
                placeholder="Name / Code / Phone…"
                autoComplete="off"
                tabIndex={20}
              />
            </div>

            <div className="cp-results-wrap">
              <table className="cp-rtable">
                <thead>
                  <tr>
                    <th style={{ width: 36 }}>Sr.#</th>
                    <th style={{ width: 78 }}>Account ID</th>
                    <th>Subsidiary</th>
                    <th style={{ width: 95 }}>Phone</th>
                    <th className="r" style={{ width: 88 }}>
                      Balance
                    </th>
                  </tr>
                </thead>
                <tbody
                  id="cp-tbody"
                  tabIndex={21}
                  onKeyDown={listKeyDown}
                  style={{ outline: "none" }}
                >
                  {loading && (
                    <tr>
                      <td colSpan={5} className="cp-empty">
                        Loading…
                      </td>
                    </tr>
                  )}
                  {!loading && filtered.length === 0 && (
                    <tr>
                      <td colSpan={5} className="cp-empty">
                        No records found
                      </td>
                    </tr>
                  )}
                  {filtered.map((c, i) => (
                    <tr
                      key={c._id}
                      className={
                        selId === c._id
                          ? "cp-row-sel"
                          : i % 2 === 0
                            ? "cp-row-even"
                            : "cp-row-odd"
                      }
                      onClick={() => loadCustomer(c, i)}
                    >
                      <td className="c">{i + 1}</td>
                      <td className="c bold">{c.code}</td>
                      <td>{c.name}</td>
                      <td>{c.phone}</td>
                      <td
                        className={`r bold ${(c.currentBalance || 0) > 0 ? "red" : "green"}`}
                      >
                        {Number(c.currentBalance || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="cp-results-footer">
              {filtered.length} record(s) &nbsp;|&nbsp; ↑↓ navigate
              &nbsp;|&nbsp; Enter = select
            </div>
          </XPFieldset>
        </div>
      </div>

      {/* ══ BOTTOM ══════════════════════════════════════════════════════════ */}
      <div className="cp-bottom">
        {/* Opening Balance */}
        <XPFieldset legend="Opening Balance Info" style={{ minWidth: 340 }}>
          <div className="cp-ob-row">
            <span className="cp-flabel" style={{ width: 90 }}>
              Opening Bal.
            </span>
            <input
              ref={refs.openingBalance}
              type="number"
              className="xp-input w110"
              value={form.openingBalance}
              onChange={(e) => set("openingBalance", e.target.value)}
              onKeyDown={(e) => onEnterNext(e, refs.openingBalanceDate)}
              tabIndex={13}
            />
            {["Debit", "Credit"].map((t) => (
              <button
                key={t}
                tabIndex={-1}
                className={`xp-ob-type-btn${form.openingBalanceType === t ? " active" : ""}`}
                onClick={() => set("openingBalanceType", t)}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="cp-ob-row" style={{ marginTop: 5 }}>
            <span className="cp-flabel" style={{ width: 90 }}>
              O.Bal.Date
            </span>
            <input
              ref={refs.openingBalanceDate}
              type="date"
              className="xp-input w130"
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
        </XPFieldset>

        {/* Commands */}
        <XPFieldset legend="Commands" style={{ flex: 1 }}>
          <div className="cp-commands">
            <div className="cp-cmd-row">
              <button
                className="xp-cmd-btn"
                onClick={fetchAll}
                disabled={loading}
                tabIndex={-1}
              >
                🔄 Refresh
              </button>
              <button
                ref={refs.saveBtn}
                className="xp-cmd-btn xp-cmd-primary"
                onClick={handleSave}
                disabled={saving}
                tabIndex={15}
              >
                💾 {saving ? "Saving…" : "Save Record"} (F5)
              </button>
              <button className="xp-cmd-btn" onClick={handleNew} tabIndex={16}>
                📄 New Record (F2)
              </button>
            </div>
            <div className="cp-cmd-row">
              <button
                className="xp-cmd-btn"
                onClick={() => alert("Print coming soon")}
                tabIndex={-1}
              >
                🖨 Print
              </button>
              <button
                className="xp-cmd-btn"
                tabIndex={-1}
                onClick={() => refs.search.current?.focus()}
              >
                🔍 Search (Ctrl+F)
              </button>
              <button
                className="xp-cmd-btn xp-cmd-danger"
                onClick={handleDelete}
                disabled={!selId}
                tabIndex={17}
              >
                ✖ Delete (Del)
              </button>
              <button className="xp-cmd-btn" onClick={handleNew} tabIndex={-1}>
                ✕ Close
              </button>
            </div>
          </div>
        </XPFieldset>
      </div>
    </div>
  );
}
