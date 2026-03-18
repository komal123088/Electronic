import { useState, useEffect, useRef, useCallback } from "react";
import api from "../api/api.js";
import EP from "../api/apiEndpoints.js";
import "../styles/theme.css";
import "../styles/JournalVoucherPage.css";

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

/* ─────────────────────────────────────────────────────────────
   ACCOUNT FIELD — inline search dropdown
───────────────────────────────────────────────────────────── */
function AccountField({ value, onChange, onSelect, placeholder, tabIndex }) {
  const [open, setOpen] = useState(false);
  const [hiIdx, setHiIdx] = useState(0);
  const [results, setResults] = useState([]);
  const inputRef = useRef(null);
  const dropRef = useRef(null);
  const timerRef = useRef(null);

  const search = useCallback(async (q) => {
    const lq = q.trim().toLowerCase();
    const fixedMatch = FIXED_ACCOUNTS.filter(
      (f) => !lq || f.title.toLowerCase().includes(lq),
    );
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
    if (e.key === "Escape") setOpen(false);
    if (e.key === "Tab") setOpen(false);
  };

  useEffect(() => {
    if (dropRef.current && hiIdx >= 0)
      dropRef.current.children[hiIdx]?.scrollIntoView({ block: "nearest" });
  }, [hiIdx]);

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
        className="xp-input"
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
        <div className="jv-account-drop" ref={dropRef}>
          {results.map((r, i) => (
            <div
              key={r._id}
              className={`jv-drop-item${r.type === "fixed" ? " fixed-acct" : ""}${i === hiIdx ? " hi" : ""}`}
              onMouseDown={() => {
                onSelect(r);
                setOpen(false);
              }}
              onMouseEnter={() => setHiIdx(i)}
            >
              <span className="jv-drop-title">{r.title}</span>
              {r.phone && <span className="jv-drop-sub">{r.phone}</span>}
              <span className="jv-drop-type">
                {r.type === "fixed" ? "Account" : "Customer"}
              </span>
              {r.type === "customer" && r.balance > 0 && (
                <span className="jv-drop-due">Due: {fmt(r.balance)}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   PRINT HELPER
───────────────────────────────────────────────────────────── */
function printJV(jv) {
  const SHOP = "Asim Electric and Electronic Store";
  const win = window.open("", "_blank", "width=700,height=500");
  win.document.write(`<!DOCTYPE html><html><head><title>JV ${jv.jvNo}</title>
  <style>body{font-family:Arial,sans-serif;font-size:12px;padding:20px}h2{margin:0}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:5px 8px}.r{text-align:right}</style></head><body>
  <h2>${SHOP}</h2><h3>JOURNAL VOUCHER</h3>
  <div style="display:flex;gap:20px;margin:8px 0"><span><b>JV #:</b> ${jv.jvNo}</span><span><b>Date:</b> ${jv.date}</span></div>
  <table><thead><tr><th>Type</th><th>Account Title</th><th>Description</th><th>Invoice</th><th class="r">Debit</th><th class="r">Credit</th></tr></thead><tbody>
  <tr><td>Debit</td><td>${jv.debitAccountTitle}</td><td>${jv.debitDescription || "—"}</td><td>${jv.debitInvoice || "—"}</td><td class="r">${Number(jv.debitAmount || 0).toLocaleString()}</td><td></td></tr>
  <tr><td>Credit</td><td>${jv.creditAccountTitle}</td><td>${jv.creditDescription || "—"}</td><td>${jv.creditInvoice || "—"}</td><td></td><td class="r">${Number(jv.creditAmount || 0).toLocaleString()}</td></tr>
  </tbody></table>
  ${jv.remarks ? `<p><b>Remarks:</b> ${jv.remarks}</p>` : ""}
  <div style="display:flex;gap:30px;margin-top:12px;font-weight:bold"><span>Total Debit: Rs. ${Number(jv.debitAmount || 0).toLocaleString()}</span><span>Total Credit: Rs. ${Number(jv.creditAmount || 0).toLocaleString()}</span></div>
  </body></html>`);
  win.document.close();
  setTimeout(() => win.print(), 400);
}

/* ─────────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────────── */
export default function JournalVoucherPage() {
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
  const [editId, setEditId] = useState(null);
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

  const handleDebitAmtChange = (v) => {
    setDebitAmount(v);
    setCreditAmount(v);
  };
  const handleCreditAmtChange = (v) => {
    setCreditAmount(v);
    setDebitAmount(v);
  };

  const handleSave = async () => {
    if (!debitTitle) return showMsg("Select Debit Account", "error");
    if (!creditTitle) return showMsg("Select Credit Account", "error");
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
      const res = editId
        ? await api.put(`/api/journal/${editId}`, payload)
        : await api.post("/api/journal", payload);
      if (res.data.success) {
        showMsg(editId ? "JV updated" : `${res.data.data.jvNo} saved`);
        resetForm();
        fetchAll(listSearch);
      } else showMsg(res.data.message || "Save failed", "error");
    } catch (e) {
      showMsg(e.response?.data?.message || "Save failed", "error");
    }
    setSaving(false);
  };

  const handleEdit = () => {
    if (!selJV) return showMsg("Select a JV from list first", "error");
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

  const handleDelete = async () => {
    if (!selJV) return showMsg("Select a JV first", "error");
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
    if (!selJV) return showMsg("Select a JV to print", "error");
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

  const handleListSearch = (v) => {
    setListSearch(v);
    clearTimeout(window._jvSearchTimer);
    window._jvSearchTimer = setTimeout(() => fetchAll(v), 300);
  };

  const handleRowClick = (jv) =>
    setSelJV((prev) => (prev?._id === jv._id ? null : jv));

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
      {/* ── Titlebar ── */}
      <div className="xp-titlebar">
        <svg
          width="15"
          height="15"
          viewBox="0 0 16 16"
          fill="rgba(255,255,255,0.85)"
        >
          <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1L14 5.5zM4.5 7a.5.5 0 0 0 0 1h7a.5.5 0 0 0 0-1zm0 2.5a.5.5 0 0 0 0 1h7a.5.5 0 0 0 0-1zm0 2.5a.5.5 0 0 0 0 1h4a.5.5 0 0 0 0-1z" />
        </svg>
        <span className="xp-tb-title">
          Journal Voucher — Asim Electric &amp; Electronic Store
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

      {/* ── Alert ── */}
      {msg.text && (
        <div
          className={`xp-alert ${msg.type === "success" ? "xp-alert-success" : "xp-alert-error"}`}
          style={{ margin: "4px 10px 0" }}
        >
          {msg.text}
        </div>
      )}

      <div className="jv-main">
        {/* ══ JV INFO ══ */}
        <fieldset className="jv-fieldset">
          <legend className="jv-legend">JV Information</legend>
          <div className="jv-info-row">
            <div className="jv-info-field">
              <label>JV #</label>
              <input
                className="xp-input"
                style={{ width: 110 }}
                value={jvNo}
                readOnly
                tabIndex={-1}
              />
            </div>
            <div className="jv-info-field">
              <label>Date</label>
              <input
                type="date"
                className="xp-input"
                style={{ width: 140 }}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                tabIndex={1}
              />
            </div>
            {editId && (
              <div className="jv-edit-badge">
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325" />
                </svg>
                Edit Mode — {jvNo}
              </div>
            )}
            <div className="jv-info-field" style={{ marginLeft: "auto" }}>
              <label>Remarks</label>
              <input
                className="xp-input"
                style={{ width: 220 }}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Optional remarks…"
                tabIndex={11}
              />
            </div>
          </div>
        </fieldset>

        {/* ══ DEBIT ENTRY ══ */}
        <fieldset className="jv-fieldset">
          <legend className="jv-legend" style={{ color: "#7f1d1d" }}>
            <svg
              width="10"
              height="10"
              viewBox="0 0 16 16"
              fill="var(--xp-red)"
              style={{ marginRight: 4 }}
            >
              <path d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8" />
            </svg>
            Debit Entry
          </legend>
          <div className="jv-entry-hdr" style={{ paddingTop: 6 }}>
            <span>Code</span>
            <span>Account Title</span>
            <span>Description</span>
            <span>Invoice #</span>
            <span style={{ textAlign: "right" }}>Debit Amount</span>
          </div>
          <div className="jv-entry-row">
            <input
              className="xp-input"
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
              className="xp-input"
              value={debitDesc}
              onChange={(e) => setDebitDesc(e.target.value)}
              placeholder="Description…"
              tabIndex={3}
            />
            <input
              className="xp-input"
              value={debitInvoice}
              onChange={(e) => setDebitInvoice(e.target.value)}
              placeholder="Invoice"
              tabIndex={4}
            />
            <input
              type="number"
              ref={debitAmtRef}
              className="jv-amt-input"
              value={debitAmount}
              onChange={(e) => handleDebitAmtChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") creditAmtRef.current?.focus();
              }}
              placeholder="0"
              tabIndex={5}
            />
          </div>
          {debitBal > 0 && (
            <div className="jv-entry-bal" style={{ color: "var(--xp-red)" }}>
              Dr: PKR {fmt(debitBal)}
            </div>
          )}
        </fieldset>

        {/* ══ CREDIT ENTRY ══ */}
        <fieldset className="jv-fieldset">
          <legend className="jv-legend" style={{ color: "#14532d" }}>
            <svg
              width="10"
              height="10"
              viewBox="0 0 16 16"
              fill="var(--xp-green)"
              style={{ marginRight: 4 }}
            >
              <path d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8" />
            </svg>
            Credit Entry
          </legend>
          <div className="jv-entry-hdr" style={{ paddingTop: 6 }}>
            <span>Code</span>
            <span>Account Title</span>
            <span>Description</span>
            <span>Invoice #</span>
            <span style={{ textAlign: "right" }}>Credit Amount</span>
          </div>
          <div className="jv-entry-row">
            <input
              className="xp-input"
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
              className="xp-input"
              value={creditDesc}
              onChange={(e) => setCreditDesc(e.target.value)}
              placeholder="Description…"
              tabIndex={7}
            />
            <input
              className="xp-input"
              value={creditInvoice}
              onChange={(e) => setCreditInvoice(e.target.value)}
              placeholder="Invoice"
              tabIndex={8}
            />
            <input
              type="number"
              ref={creditAmtRef}
              className="jv-amt-input"
              style={{ color: "var(--xp-green)" }}
              value={creditAmount}
              onChange={(e) => handleCreditAmtChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveRef.current?.focus();
              }}
              placeholder="0"
              tabIndex={9}
            />
          </div>
          {creditBal > 0 && (
            <div
              className={`jv-entry-bal ${balanced ? "balanced" : "unbalanced"}`}
            >
              Cr: PKR {fmt(creditBal)}
            </div>
          )}
        </fieldset>

        {/* ══ BALANCE STRIP ══ */}
        {(debitBal > 0 || creditBal > 0) && (
          <div className="jv-balance-strip">
            <div className="jv-balance-item">
              <span>Debit:</span>
              <span className="jv-balance-val debit">PKR {fmt(debitBal)}</span>
            </div>
            <div className="jv-balance-item">
              <span>Credit:</span>
              <span className="jv-balance-val credit">
                PKR {fmt(creditBal)}
              </span>
            </div>
            {balanced ? (
              <span className="jv-balanced-ok">
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
                  <path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05" />
                </svg>
                Balanced
              </span>
            ) : (
              <span className="jv-not-balanced">
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <path d="M7.938 2.016A.13.13 0 0 1 8.002 2a.13.13 0 0 1 .063.016.15.15 0 0 1 .054.057l6.857 11.667c.036.06.035.124.002.183a.2.2 0 0 1-.054.06.1.1 0 0 1-.066.017H1.146a.1.1 0 0 1-.066-.017.2.2 0 0 1-.054-.06.18.18 0 0 1 .002-.183L7.884 2.073a.15.15 0 0 1 .054-.057m1.044-.45a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767z" />
                  <path d="M7.002 12a1 1 0 1 1 2 0 1 1 0 0 1-2 0M7.1 5.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0z" />
                </svg>
                Not Balanced
              </span>
            )}
          </div>
        )}

        {/* ══ COMMANDS BAR ══ */}
        <div className="jv-cmd-bar">
          <label className="jv-sms-check">
            <input
              type="checkbox"
              checked={sendSms}
              onChange={(e) => setSendSms(e.target.checked)}
            />
            Send SMS
          </label>

          <div className="xp-toolbar-divider" />

          <button
            className="xp-btn xp-btn-sm"
            onClick={resetForm}
            tabIndex={-1}
          >
            <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2z" />
              <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466" />
            </svg>
            New (F2)
          </button>

          <button
            ref={saveRef}
            className="xp-btn xp-btn-primary xp-btn-lg"
            onClick={handleSave}
            disabled={saving}
            tabIndex={10}
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
              <path d="M2 1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H9.5a1 1 0 0 0-1 1v7.293l2.646-2.647a.5.5 0 0 1 .708.708l-3.5 3.5a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L7.5 9.293V2a2 2 0 0 1 2-2H14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2z" />
            </svg>
            {saving ? "Saving…" : "Save (F5)"}
          </button>

          <div className="xp-toolbar-divider" />

          <button
            className="xp-btn xp-btn-sm"
            onClick={handleEdit}
            tabIndex={-1}
          >
            <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
              <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168z" />
            </svg>
            Edit Record
          </button>

          <button
            className="xp-btn xp-btn-danger xp-btn-sm"
            onClick={handleDelete}
            tabIndex={-1}
          >
            <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
              <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z" />
              <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z" />
            </svg>
            Delete
          </button>

          <button
            className="xp-btn xp-btn-sm"
            onClick={handlePrint}
            tabIndex={-1}
          >
            <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
              <path d="M2.5 8a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1" />
              <path d="M5 1a2 2 0 0 0-2 2v2H2a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h1v1a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-1h1a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-1V3a2 2 0 0 0-2-2zm4 7h2v3H5v-3h4zm-4 2V9h4v1H5zm4-2H5V8h4v1zm-4 4v-1h4v1H5zm0 1v1h4v-1H5z" />
            </svg>
            Print
          </button>

          <div className="jv-hint">
            <span>
              <kbd>F2</kbd> New
            </span>
            <span>
              <kbd>F5</kbd> Save
            </span>
            <span>Click list row to select</span>
          </div>
        </div>

        {/* ══ JV LIST ══ */}
        <div className="jv-list-section">
          <div className="jv-list-header">
            <span className="jv-list-title">
              <svg
                width="11"
                height="11"
                viewBox="0 0 16 16"
                fill="currentColor"
                style={{ marginRight: 4 }}
              >
                <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1L14 5.5zM4.5 7a.5.5 0 0 0 0 1h7a.5.5 0 0 0 0-1zm0 2.5a.5.5 0 0 0 0 1h7a.5.5 0 0 0 0-1zm0 2.5a.5.5 0 0 0 0 1h4a.5.5 0 0 0 0-1z" />
              </svg>
              Journal Entries
            </span>
            <div className="xp-search-wrap" style={{ flex: 1, maxWidth: 360 }}>
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
                className="xp-input"
                value={listSearch}
                onChange={(e) => handleListSearch(e.target.value)}
                placeholder="Search JV# / Account / Description…"
              />
            </div>
            <span className="jv-list-count">{allJVs.length} record(s)</span>
            {selJV && (
              <span className="jv-selected-badge">
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
                  <path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05" />
                </svg>
                Selected: {selJV.jvNo}
              </span>
            )}
          </div>

          <div className="jv-list-table-wrap">
            <table className="jv-table">
              <thead>
                <tr>
                  <th style={{ width: 36 }}>Sr.#</th>
                  <th style={{ width: 90 }}>Date</th>
                  <th style={{ width: 90 }}>JV #</th>
                  <th style={{ width: 70 }}>Type</th>
                  <th>Account Title</th>
                  <th>Description</th>
                  <th>Invoice</th>
                  <th className="r" style={{ width: 100 }}>
                    Debit
                  </th>
                  <th className="r" style={{ width: 100 }}>
                    Credit
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={9} className="xp-loading">
                      Loading…
                    </td>
                  </tr>
                )}
                {!loading && allJVs.length === 0 && (
                  <tr>
                    <td colSpan={9} className="xp-empty">
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
                        className={`jv-debit-row${isSel ? " sel-debit" : ""}`}
                        onClick={() => handleRowClick(jv)}
                      >
                        <td
                          className="text-muted"
                          style={{ fontSize: "var(--xp-fs-xs)" }}
                        >
                          {idx + 1}
                        </td>
                        <td className="text-muted">{jv.date}</td>
                        <td>
                          <span className="jv-no-link">{jv.jvNo}</span>
                        </td>
                        <td>
                          <span className="jv-dr-badge">Dr</span>
                        </td>
                        <td style={{ fontWeight: 700 }}>
                          {jv.debitAccountTitle}
                        </td>
                        <td className="text-muted">
                          {jv.debitDescription || "—"}
                        </td>
                        <td className="text-muted">{jv.debitInvoice || "—"}</td>
                        <td
                          className="r mono"
                          style={{ color: "var(--xp-red)" }}
                        >
                          {fmt(jv.debitAmount)}
                        </td>
                        <td></td>
                      </tr>
                      {/* Credit row */}
                      <tr
                        key={`${jv._id}-c`}
                        className={`jv-credit-row${isSel ? " sel-credit" : ""}`}
                        onClick={() => handleRowClick(jv)}
                      >
                        <td></td>
                        <td></td>
                        <td>
                          <span className="jv-no-link">{jv.jvNo}</span>
                        </td>
                        <td>
                          <span className="jv-cr-badge">Cr</span>
                        </td>
                        <td style={{ fontWeight: 700, paddingLeft: 20 }}>
                          {jv.creditAccountTitle}
                        </td>
                        <td className="text-muted">
                          {jv.creditDescription || "—"}
                        </td>
                        <td className="text-muted">
                          {jv.creditInvoice || "—"}
                        </td>
                        <td></td>
                        <td
                          className="r mono"
                          style={{ color: "var(--xp-green)" }}
                        >
                          {fmt(jv.creditAmount)}
                        </td>
                      </tr>
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Status Bar ── */}
      <div className="xp-statusbar">
        <div className="xp-status-pane">
          <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
            <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1L14 5.5z" />
          </svg>
          {editId ? `Editing: ${jvNo}` : `New JV: ${jvNo}`}
        </div>
        <div className="xp-status-pane">{allJVs.length} entries</div>
        {debitBal > 0 && (
          <div
            className="xp-status-pane"
            style={{ color: balanced ? "var(--xp-green)" : "var(--xp-red)" }}
          >
            {balanced ? "✓ Balanced" : "✗ Not Balanced"} — PKR {fmt(debitBal)}
          </div>
        )}
        {selJV && <div className="xp-status-pane">Selected: {selJV.jvNo}</div>}
      </div>
    </div>
  );
}
