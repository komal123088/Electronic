import { useState, useEffect, useRef, useCallback } from "react";
import "../styles/JournalVoucherPage.css";
import api from "../api/api.js";
import EP from "../api/apiEndpoints.js";

const isoDate = () => new Date().toISOString().split("T")[0];
const fmt = (n) => Number(n || 0).toLocaleString("en-PK");

const FIXED_ACCOUNTS = [
  { _id: "CASH", title: "CASH", type: "fixed" },
  { _id: "SALE", title: "SALE", type: "fixed" },
  { _id: "PURCHASE", title: "PURCHASE", type: "fixed" },
  { _id: "BANK", title: "BANK", type: "fixed" },
  { _id: "CAPITAL", title: "CAPITAL", type: "fixed" },
  { _id: "EXPENSE", title: "EXPENSE", type: "fixed" },
  { _id: "DRAWINGS", title: "DRAWINGS", type: "fixed" },
  { _id: "DISCOUNT", title: "DISCOUNT", type: "fixed" },
];

// ═══════════════════════════════════════════════════════════
// ACCOUNT SEARCH DROPDOWN — inline (not a modal)
// ═══════════════════════════════════════════════════════════
function AccountField({ value, onChange, onSelect, placeholder, tabIndex }) {
  const [open, setOpen] = useState(false);
  const [hiIdx, setHiIdx] = useState(0);
  const [results, setResults] = useState([]);
  const inputRef = useRef(null);
  const dropRef = useRef(null);
  const timerRef = useRef(null);

  const search = useCallback(async (q) => {
    const lq = q.trim().toLowerCase();
    // Fixed accounts filter
    const fixedMatch = FIXED_ACCOUNTS.filter(
      (f) => !lq || f.title.toLowerCase().includes(lq),
    );
    // Customers from backend
    try {
      const { data } = await api.get(
        `${EP.CUSTOMERS.GET_ALL}?search=${encodeURIComponent(q.trim())}&limit=30`,
      );
      const custs = (data.success ? data.data : []).map((c) => ({
        _id: c._id,
        title: c.name,
        phone: c.phone || "",
        balance: c.currentBalance || 0,
        type: "customer",
      }));
      setResults([...fixedMatch, ...custs]);
    } catch {
      setResults(fixedMatch);
    }
    setHiIdx(0);
    setOpen(true);
  }, []);

  const handleChange = (e) => {
    onChange(e.target.value);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => search(e.target.value), 180);
  };

  const handleKeyDown = (e) => {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        search(value);
        return;
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHiIdx((i) => Math.min(i + 1, results.length - 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHiIdx((i) => Math.max(i - 1, 0));
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (results[hiIdx]) {
        onSelect(results[hiIdx]);
        setOpen(false);
      }
    }
    if (e.key === "Escape") {
      setOpen(false);
    }
    if (e.key === "Tab") {
      setOpen(false);
    }
  };

  useEffect(() => {
    if (dropRef.current && hiIdx >= 0)
      dropRef.current.children[hiIdx]?.scrollIntoView({ block: "nearest" });
  }, [hiIdx]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (!inputRef.current?.closest(".jv-account-wrap")?.contains(e.target))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="jv-account-wrap">
      <input
        ref={inputRef}
        className={`jv-account-input${value ? " has-val" : ""}`}
        value={value}
        onChange={handleChange}
        onFocus={() => {
          if (value.length >= 0) search(value);
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder || "Type to search…"}
        autoComplete="off"
        tabIndex={tabIndex}
      />
      {open && results.length > 0 && (
        <div className="jv-dropdown" ref={dropRef}>
          {results.map((r, i) => (
            <div
              key={r._id}
              className={`jv-drop-item ${i === hiIdx ? "hi" : ""}`}
              onMouseDown={() => {
                onSelect(r);
                setOpen(false);
              }}
              onMouseEnter={() => setHiIdx(i)}
            >
              <span className="bold">{r.title}</span>
              {r.phone && (
                <span style={{ fontSize: 11, color: "#888" }}>{r.phone}</span>
              )}
              <span className="jv-drop-type">
                {r.type === "fixed" ? "Account" : "Customer"}
              </span>
              {r.type === "customer" && r.balance > 0 && (
                <span className="jv-drop-bal">Due: {fmt(r.balance)}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PRINT HELPER
// ═══════════════════════════════════════════════════════════
function printJV(jv) {
  const SHOP = "Asim Electric and Electronic Store";
  const win = window.open("", "_blank", "width=700,height=500");
  win.document.write(`<!DOCTYPE html><html><head><title>JV ${jv.jvNo}</title>
  <style>
    body{font-family:Arial,sans-serif;font-size:12px;padding:20px}
    h2{text-align:center;font-size:18px;margin:0}
    h3{text-align:center;font-size:12px;color:#555;margin:2px 0 14px;letter-spacing:1px}
    .meta{display:flex;justify-content:space-between;margin-bottom:12px;font-size:12px}
    table{width:100%;border-collapse:collapse}
    th{background:#2c5d9e;color:#fff;padding:5px 8px;text-align:left;font-size:12px;border:1px solid #1a3d6e}
    td{border:1px solid #ccc;padding:5px 8px;font-size:12px}
    .r{text-align:right}.bold{font-weight:bold}
    .footer{text-align:center;margin-top:24px;color:#888;font-size:11px;border-top:1px solid #ddd;padding-top:8px}
    @media print{body{padding:5mm}}
  </style></head><body>
  <h2>${SHOP}</h2>
  <h3>JOURNAL VOUCHER</h3>
  <div class="meta">
    <span><b>JV #:</b> ${jv.jvNo}</span>
    <span><b>Date:</b> ${jv.date}</span>
  </div>
  <table>
    <thead>
      <tr><th style="width:70px">Type</th><th>Account Title</th><th>Description</th><th style="width:80px">Invoice</th><th class="r" style="width:90px">Debit</th><th class="r" style="width:90px">Credit</th></tr>
    </thead>
    <tbody>
      <tr>
        <td>Debit</td>
        <td class="bold">${jv.debitAccountTitle}</td>
        <td>${jv.debitDescription || "—"}</td>
        <td>${jv.debitInvoice || "—"}</td>
        <td class="r bold">${Number(jv.debitAmount || 0).toLocaleString()}</td>
        <td></td>
      </tr>
      <tr>
        <td>Credit</td>
        <td class="bold">${jv.creditAccountTitle}</td>
        <td>${jv.creditDescription || "—"}</td>
        <td>${jv.creditInvoice || "—"}</td>
        <td></td>
        <td class="r bold">${Number(jv.creditAmount || 0).toLocaleString()}</td>
      </tr>
    </tbody>
  </table>
  ${jv.remarks ? `<p style="margin-top:10px;font-size:12px"><b>Remarks:</b> ${jv.remarks}</p>` : ""}
  <div style="margin-top:14px;display:flex;justify-content:space-between;font-size:13px;font-weight:bold">
    <span>Total Debit: Rs. ${Number(jv.debitAmount || 0).toLocaleString()}</span>
    <span>Total Credit: Rs. ${Number(jv.creditAmount || 0).toLocaleString()}</span>
  </div>
  <div class="footer">Prepared by: ADMIN &nbsp;|&nbsp; ${SHOP}</div>
  </body></html>`);
  win.document.close();
  setTimeout(() => win.print(), 400);
}

// ═══════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════
export default function JournalVoucherPage() {
  // Form state
  const [jvNo, setJvNo] = useState("");
  const [date, setDate] = useState(isoDate());
  const [debitTitle, setDebitTitle] = useState("");
  const [debitId, setDebitId] = useState("");
  const [debitDesc, setDebitDesc] = useState("");
  const [debitInvoice, setDebitInvoice] = useState("");
  const [debitAmount, setDebitAmount] = useState("");
  const [creditTitle, setCreditTitle] = useState("");
  const [creditId, setCreditId] = useState("");
  const [creditDesc, setCreditDesc] = useState("");
  const [creditInvoice, setCreditInvoice] = useState("");
  const [creditAmount, setCreditAmount] = useState("");
  const [remarks, setRemarks] = useState("");
  const [sendSms, setSendSms] = useState(false);

  // UI state
  const [editId, setEditId] = useState(null); // null = new mode
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ text: "", type: "" });
  const [allJVs, setAllJVs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selJV, setSelJV] = useState(null);
  const [listSearch, setListSearch] = useState("");

  const debitAmtRef = useRef(null);
  const creditAmtRef = useRef(null);
  const saveRef = useRef(null);

  useEffect(() => {
    fetchNextJv();
    fetchAll();
  }, []);

  const fetchNextJv = async () => {
    try {
      const { data } = await api.get("/api/journal/next-jv");
      if (data.success) setJvNo(data.data.jvNo);
    } catch {}
  };
  const fetchAll = async (search = "") => {
    setLoading(true);
    try {
      const url = search
        ? `/api/journal?search=${encodeURIComponent(search)}`
        : "/api/journal";
      const { data } = await api.get(url);
      if (data.success) setAllJVs(data.data);
    } catch {}
    setLoading(false);
  };

  const showMsg = (text, type = "success") => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: "", type: "" }), 3000);
  };

  // Auto-sync amounts: debit follows credit when changed
  const handleDebitAmtChange = (v) => {
    setDebitAmount(v);
    setCreditAmount(v);
  };
  const handleCreditAmtChange = (v) => {
    setCreditAmount(v);
    setDebitAmount(v);
  };

  // Save / Update
  const handleSave = async () => {
    if (!debitTitle) {
      showMsg("Select Debit Account", "error");
      return;
    }
    if (!creditTitle) {
      showMsg("Select Credit Account", "error");
      return;
    }
    const amt = Number(debitAmount);
    if (!amt || amt <= 0) {
      showMsg("Enter amount", "error");
      debitAmtRef.current?.focus();
      return;
    }

    setSaving(true);
    try {
      const payload = {
        date,
        debitAccountId: debitId,
        debitAccountTitle: debitTitle,
        debitDescription: debitDesc,
        debitInvoice,
        debitAmount: amt,
        creditAccountId: creditId,
        creditAccountTitle: creditTitle,
        creditDescription: creditDesc,
        creditInvoice,
        creditAmount: amt,
        remarks,
        sendSms,
      };
      let res;
      if (editId) {
        res = await api.put(`/api/journal/${editId}`, payload);
      } else {
        res = await api.post("/api/journal", payload);
      }
      if (res.data.success) {
        showMsg(editId ? "✅ JV updated" : `✅ ${res.data.data.jvNo} saved`);
        resetForm();
        fetchAll(listSearch);
      } else {
        showMsg(res.data.message || "Save failed", "error");
      }
    } catch (e) {
      showMsg(e.response?.data?.message || "Save failed", "error");
    }
    setSaving(false);
  };

  // Load JV into form for editing
  const handleEdit = () => {
    if (!selJV) {
      showMsg("Select a JV from list first", "error");
      return;
    }
    setEditId(selJV._id);
    setJvNo(selJV.jvNo);
    setDate(selJV.date);
    setDebitId(selJV.debitAccountId || "");
    setDebitTitle(selJV.debitAccountTitle);
    setDebitDesc(selJV.debitDescription || "");
    setDebitInvoice(selJV.debitInvoice || "");
    setDebitAmount(selJV.debitAmount || "");
    setCreditId(selJV.creditAccountId || "");
    setCreditTitle(selJV.creditAccountTitle);
    setCreditDesc(selJV.creditDescription || "");
    setCreditInvoice(selJV.creditInvoice || "");
    setCreditAmount(selJV.creditAmount || "");
    setRemarks(selJV.remarks || "");
    setSendSms(selJV.sendSms || false);
    showMsg(`Editing ${selJV.jvNo}`);
    window.scrollTo(0, 0);
  };

  // Delete
  const handleDelete = async () => {
    if (!selJV) {
      showMsg("Select a JV first", "error");
      return;
    }
    if (!window.confirm(`Delete ${selJV.jvNo}?`)) return;
    try {
      await api.delete(`/api/journal/${selJV._id}`);
      showMsg("Deleted");
      setSelJV(null);
      fetchAll(listSearch);
    } catch {
      showMsg("Delete failed", "error");
    }
  };

  const handlePrint = () => {
    if (!selJV) {
      showMsg("Select a JV to print", "error");
      return;
    }
    printJV(selJV);
  };

  const resetForm = () => {
    setEditId(null);
    setDebitTitle("");
    setDebitId("");
    setDebitDesc("");
    setDebitInvoice("");
    setDebitAmount("");
    setCreditTitle("");
    setCreditId("");
    setCreditDesc("");
    setCreditInvoice("");
    setCreditAmount("");
    setRemarks("");
    setSendSms(false);
    fetchNextJv();
  };

  // Search in list
  const handleListSearch = (v) => {
    setListSearch(v);
    clearTimeout(window._jvSearchTimer);
    window._jvSearchTimer = setTimeout(() => fetchAll(v), 300);
  };

  // Row click in list
  const handleRowClick = (jv) => {
    setSelJV((prev) => (prev?._id === jv._id ? null : jv));
  };

  // Keyboard
  useEffect(() => {
    const h = (e) => {
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
  }, [debitTitle, creditTitle, debitAmount, editId]);

  const debitBal = Number(debitAmount || 0);
  const creditBal = Number(creditAmount || 0);
  const balanced = debitBal === creditBal && debitBal > 0;

  return (
    <div className="jv-page">
      {msg.text && <div className={`jv-msg ${msg.type}`}>{msg.text}</div>}

      <div className="jv-top">
        {/* ── JV Info ─────────────────────────────────────── */}
        <fieldset className="jv-fieldset">
          <legend>JV Info</legend>
          <div className="jv-info-row">
            <div className="jv-field">
              <label>JV #</label>
              <input
                className="jv-input w90 bold"
                value={editId ? jvNo : jvNo}
                readOnly
                tabIndex={-1}
              />
            </div>
            <div className="jv-field">
              <label>Date</label>
              <input
                type="date"
                className="jv-input w120"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                tabIndex={1}
              />
            </div>
            {editId && (
              <span style={{ fontSize: 12, color: "#c00", fontWeight: "bold" }}>
                ✏️ Edit Mode — {jvNo}
              </span>
            )}
          </div>
        </fieldset>

        {/* ── Debit Entry ─────────────────────────────────── */}
        <fieldset className="jv-fieldset">
          <legend>Debit Entry</legend>
          <div className="jv-entry-headers">
            <span>Code</span>
            <span>Account Title</span>
            <span>Description</span>
            <span>Invoice</span>
            <span className="r">Debit</span>
          </div>
          <div className="jv-entry-grid">
            <input
              className="jv-input w90"
              value={debitId?.length > 10 ? "" : debitId}
              onChange={(e) => setDebitId(e.target.value)}
              placeholder="Code"
              tabIndex={-1}
              readOnly
            />
            <AccountField
              value={debitTitle}
              onChange={setDebitTitle}
              onSelect={(acc) => {
                setDebitTitle(acc.title);
                setDebitId(acc._id);
              }}
              placeholder="Search account / customer…"
              tabIndex={2}
            />
            <input
              className="jv-input w280"
              value={debitDesc}
              onChange={(e) => setDebitDesc(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setDebitInvoice((v) => v);
              }}
              placeholder="Description…"
              tabIndex={3}
            />
            <input
              className="jv-input w80"
              value={debitInvoice}
              onChange={(e) => setDebitInvoice(e.target.value)}
              placeholder="Invoice"
              tabIndex={4}
            />
            <input
              type="number"
              className="jv-input r"
              ref={debitAmtRef}
              value={debitAmount}
              onChange={(e) => handleDebitAmtChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") creditAmtRef.current?.focus();
              }}
              placeholder="0"
              tabIndex={5}
              style={{ width: "100%" }}
            />
          </div>
          <div className="jv-balance-row">
            <div
              className="jv-bal-val"
              style={{ textAlign: "right", fontSize: 12, fontWeight: "bold" }}
            >
              {debitBal > 0 ? fmt(debitBal) : ""}
            </div>
          </div>
        </fieldset>

        {/* ── Credit Entry ─────────────────────────────────── */}
        <fieldset className="jv-fieldset">
          <legend>Credit Entry</legend>
          <div className="jv-entry-headers">
            <span>Code</span>
            <span>Account Title</span>
            <span>Description</span>
            <span>Invoice</span>
            <span className="r">Credit</span>
          </div>
          <div className="jv-entry-grid">
            <input
              className="jv-input w90"
              value={creditId?.length > 10 ? "" : creditId}
              onChange={(e) => setCreditId(e.target.value)}
              placeholder="Code"
              tabIndex={-1}
              readOnly
            />
            <AccountField
              value={creditTitle}
              onChange={setCreditTitle}
              onSelect={(acc) => {
                setCreditTitle(acc.title);
                setCreditId(acc._id);
              }}
              placeholder="Search account / customer…"
              tabIndex={6}
            />
            <input
              className="jv-input w280"
              value={creditDesc}
              onChange={(e) => setCreditDesc(e.target.value)}
              placeholder="Description…"
              tabIndex={7}
            />
            <input
              className="jv-input w80"
              value={creditInvoice}
              onChange={(e) => setCreditInvoice(e.target.value)}
              placeholder="Invoice"
              tabIndex={8}
            />
            <input
              type="number"
              className="jv-input r"
              ref={creditAmtRef}
              value={creditAmount}
              onChange={(e) => handleCreditAmtChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveRef.current?.focus();
              }}
              placeholder="0"
              tabIndex={9}
              style={{ width: "100%" }}
            />
          </div>
          <div className="jv-balance-row">
            <div
              className="jv-bal-val"
              style={{
                textAlign: "right",
                fontSize: 12,
                fontWeight: "bold",
                color: balanced ? "#1a6a1a" : "#c00",
              }}
            >
              {creditBal > 0
                ? `${fmt(creditBal)}${balanced ? " ✓" : " ✗ Not Balanced"}`
                : ""}
            </div>
          </div>
        </fieldset>

        {/* ── Commands ─────────────────────────────────────── */}
        <div className="jv-commands">
          <label className="jv-sms-check">
            <input
              type="checkbox"
              checked={sendSms}
              onChange={(e) => setSendSms(e.target.checked)}
            />
            Send SMS
          </label>
          <button className="jv-cmd-btn" onClick={resetForm} tabIndex={-1}>
            🔄 Refresh
          </button>
          <button
            ref={saveRef}
            className="jv-cmd-btn green"
            onClick={handleSave}
            disabled={saving}
            tabIndex={10}
          >
            💾 {saving ? "Saving…" : "Save Record"}
          </button>
          <button
            className="jv-cmd-btn blue"
            onClick={handleEdit}
            tabIndex={-1}
          >
            ✏️ Edit Record
          </button>
          <button
            className="jv-cmd-btn red"
            onClick={handleDelete}
            tabIndex={-1}
          >
            ✕ Delete Record
          </button>
          <button
            className="jv-cmd-btn orange"
            onClick={handlePrint}
            tabIndex={-1}
          >
            🖨 Print
          </button>
          <span style={{ marginLeft: "auto", fontSize: 11, color: "#666" }}>
            F2=New | F5=Save | Click list row to select
          </span>
        </div>
      </div>

      {/* ── Searching Results ─────────────────────────────── */}
      <div className="jv-results-section">
        <div className="jv-results-header">
          <span className="jv-results-title">Searching Results</span>
          <input
            className="jv-search-input"
            value={listSearch}
            onChange={(e) => handleListSearch(e.target.value)}
            placeholder="🔍 Search JV# / Account / Description…"
          />
          <span className="jv-results-count">{allJVs.length} records</span>
          {selJV && (
            <span
              style={{ fontSize: 11, color: "#1a3a9a", fontWeight: "bold" }}
            >
              ✔ Selected: {selJV.jvNo}
            </span>
          )}
        </div>

        <div className="jv-table-wrap">
          <table className="jv-table">
            <thead>
              <tr>
                <th style={{ width: 32 }}>Sr.#</th>
                <th style={{ width: 90 }}>Date</th>
                <th style={{ width: 100 }}>JV #</th>
                <th style={{ width: "22%" }}>Account Title</th>
                <th>Description</th>
                <th style={{ width: 80 }}>Invoice</th>
                <th className="r" style={{ width: 90 }}>
                  Debit
                </th>
                <th className="r" style={{ width: 90 }}>
                  Credit
                </th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} className="jv-empty">
                    Loading…
                  </td>
                </tr>
              )}
              {!loading && allJVs.length === 0 && (
                <tr>
                  <td colSpan={8} className="jv-empty">
                    No journal entries yet
                  </td>
                </tr>
              )}
              {allJVs.map((jv, idx) => {
                const isSel = selJV?._id === jv._id;
                return (
                  <>
                    {/* Debit row */}
                    <tr
                      key={`${jv._id}-d`}
                      className={isSel ? "sel" : idx % 2 === 0 ? "even" : "odd"}
                      onClick={() => handleRowClick(jv)}
                    >
                      <td className="c" rowSpan={1}>
                        {idx + 1}
                      </td>
                      <td>{jv.date}</td>
                      <td className="blue bold">{jv.jvNo}</td>
                      <td className="bold">{jv.debitAccountTitle}</td>
                      <td>{jv.debitDescription || "—"}</td>
                      <td>{jv.debitInvoice || "—"}</td>
                      <td className="r bold">{fmt(jv.debitAmount)}</td>
                      <td></td>
                    </tr>
                    {/* Credit row */}
                    <tr
                      key={`${jv._id}-c`}
                      className={isSel ? "sel" : idx % 2 === 0 ? "even" : "odd"}
                      onClick={() => handleRowClick(jv)}
                    >
                      <td className="c"></td>
                      <td></td>
                      <td className="blue">{jv.jvNo}</td>
                      <td style={{ paddingLeft: 20, color: "#555" }}>
                        {jv.creditAccountTitle}
                      </td>
                      <td>{jv.creditDescription || "—"}</td>
                      <td>{jv.creditInvoice || "—"}</td>
                      <td></td>
                      <td className="r bold red">{fmt(jv.creditAmount)}</td>
                    </tr>
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
