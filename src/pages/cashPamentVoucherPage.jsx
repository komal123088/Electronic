import { useState, useEffect, useRef, useCallback } from "react";
import api from "../api/api.js";
import EP from "../api/apiEndpoints.js";
import "../styles/theme.css";
import "../styles/CashPaymentVoucher.css";

const fmt = (n) => Number(n || 0).toLocaleString("en-PK");
const isoD = () => new Date().toISOString().split("T")[0];
const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "2-digit",
      })
    : "—";

const EMPTY = {
  _id: null,
  cpv_number: "",
  date: isoD(),
  code: "",
  account_title: "",
  description: "",
  invoice: "",
  amount: "",
  send_sms: false,
};

/* ─────────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────────── */
export default function CashPaymentVoucher() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ text: "", type: "" });
  const [search, setSearch] = useState("");

  // Field refs for Enter-key navigation
  const refDate = useRef(null);
  const refCode = useRef(null);
  const refAccount = useRef(null);
  const refDesc = useRef(null);
  const refInvoice = useRef(null);
  const refAmount = useRef(null);
  const refSave = useRef(null);
  const refSearch = useRef(null);

  useEffect(() => {
    loadRows();
    fetchNextCpv();
    refAccount.current?.focus();
  }, []);

  /* ── helpers ────────────────────────────────────────────────────────────── */
  const showMsg = (text, type = "success") => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: "", type: "" }), 3500);
  };

  const focusNext = (ref) => () => ref.current?.focus();

  /* ── API calls ──────────────────────────────────────────────────────────── */
  const loadRows = useCallback(async (q = "") => {
    setLoading(true);
    try {
      const { data } = await api.get(
        EP.CPV.GET_ALL + (q ? `?search=${encodeURIComponent(q)}` : ""),
      );
      setRows(Array.isArray(data) ? data : data.data || []);
    } catch (e) {
      showMsg(e.response?.data?.error || "Load failed", "error");
    }
    setLoading(false);
  }, []);

  const fetchNextCpv = async () => {
    try {
      const { data } = await api.get(EP.CPV.NEXT_NUMBER);
      setForm((f) => ({ ...f, cpv_number: data.cpv_number }));
    } catch {}
  };

  /* ── form actions ───────────────────────────────────────────────────────── */
  const handleNew = () => {
    setForm({ ...EMPTY, date: isoD() });
    fetchNextCpv();
    setTimeout(() => refAccount.current?.focus(), 50);
  };

  const handleRowClick = (row) => {
    setForm({
      _id: row._id,
      cpv_number: row.cpv_number,
      date: row.date?.slice(0, 10) || isoD(),
      code: row.code || "",
      account_title: row.account_title || "",
      description: row.description || "",
      invoice: row.invoice ?? "",
      amount: row.amount ?? "",
      send_sms: !!row.send_sms,
    });
    refAccount.current?.focus();
  };

  const handleSave = async () => {
    if (!form.account_title.trim()) {
      showMsg("Account Title required", "error");
      refAccount.current?.focus();
      return;
    }
    if (!form.amount || isNaN(Number(form.amount))) {
      showMsg("Valid Amount required", "error");
      refAmount.current?.focus();
      return;
    }

    setSaving(true);
    try {
      const payload = {
        date: form.date,
        code: form.code,
        account_title: form.account_title,
        description: form.description,
        invoice: form.invoice || 0,
        amount: Number(form.amount),
        send_sms: form.send_sms,
      };

      if (form._id) {
        await api.put(EP.CPV.UPDATE(form._id), payload);
        showMsg("Record updated");
      } else {
        const { data } = await api.post(EP.CPV.CREATE, payload);
        showMsg(`CPV #${data.cpv_number} saved`);
      }
      handleNew();
      loadRows(search);
    } catch (e) {
      showMsg(e.response?.data?.error || "Save failed", "error");
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!form._id) return;
    if (!window.confirm(`Delete CPV #${form.cpv_number}?`)) return;
    try {
      await api.delete(EP.CPV.DELETE(form._id));
      showMsg("Record deleted");
      handleNew();
      loadRows(search);
    } catch (e) {
      showMsg(e.response?.data?.error || "Delete failed", "error");
    }
  };

  const handleSearch = (e) => {
    const v = e.target.value;
    setSearch(v);
    loadRows(v);
  };

  const fv = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const onEnter = (nextRef) => (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      nextRef?.current?.focus();
    }
  };

  const totalAmt = rows.reduce((s, r) => s + Number(r.amount || 0), 0);

  /* ── render ─────────────────────────────────────────────────────────────── */
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100%",
        background: "var(--xp-silver-1)",
      }}
    >
      {/* ── Titlebar ─────────────────────────────────────────────────────── */}
      <div className="xp-titlebar">
        <svg
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="rgba(255,255,255,0.85)"
        >
          <path d="M12.136.326A1.5 1.5 0 0 1 14 1.78V3h.5A1.5 1.5 0 0 1 16 4.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 0 13.5v-9A1.5 1.5 0 0 1 1.432 3.001L12.136.326z" />
        </svg>
        <span className="xp-tb-title">Cash Payment Voucher</span>
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

      {/* ── Alert ────────────────────────────────────────────────────────── */}
      {msg.text && (
        <div
          className={`xp-alert ${msg.type === "success" ? "xp-alert-success" : "xp-alert-error"}`}
          style={{ margin: "6px 10px 0" }}
        >
          {msg.text}
        </div>
      )}

      {/* ── Header Form Panel ────────────────────────────────────────────── */}
      <div className="cpv-header">
        {/* top label row */}
        <div style={{ display: "flex", gap: 0, marginBottom: 3 }}>
          <span
            style={{ width: 70, fontSize: "var(--xp-fs-xs)", fontWeight: 700 }}
          >
            Cash Payment
          </span>
          <span
            style={{
              width: 80,
              fontSize: "var(--xp-fs-xs)",
              fontWeight: 700,
              paddingLeft: 4,
            }}
          >
            CPV #
          </span>
          <span
            style={{
              width: 110,
              fontSize: "var(--xp-fs-xs)",
              fontWeight: 700,
              paddingLeft: 4,
            }}
          >
            Date
          </span>
          <span
            style={{
              width: 100,
              fontSize: "var(--xp-fs-xs)",
              fontWeight: 700,
              paddingLeft: 4,
            }}
          >
            Code
          </span>
          <span
            style={{
              flex: 1,
              fontSize: "var(--xp-fs-xs)",
              fontWeight: 700,
              paddingLeft: 4,
            }}
          >
            Account Title
          </span>
          <span
            style={{
              flex: 1,
              fontSize: "var(--xp-fs-xs)",
              fontWeight: 700,
              paddingLeft: 4,
            }}
          >
            Description
          </span>
          <span
            style={{
              width: 70,
              fontSize: "var(--xp-fs-xs)",
              fontWeight: 700,
              paddingLeft: 4,
            }}
          >
            Invoice
          </span>
          <span
            style={{
              width: 100,
              fontSize: "var(--xp-fs-xs)",
              fontWeight: 700,
              paddingLeft: 4,
            }}
          >
            Amount
          </span>
        </div>

        {/* inputs row */}
        <div
          style={{
            display: "flex",
            gap: 0,
            alignItems: "center",
            marginBottom: 6,
          }}
        >
          <div style={{ width: 70 }} />
          <input
            className="xp-input xp-input-sm"
            style={{ width: 76, marginRight: 4 }}
            value={form.cpv_number}
            readOnly
            tabIndex={-1}
          />
          <input
            ref={refDate}
            type="date"
            className="xp-input xp-input-sm"
            style={{ width: 106, marginRight: 4 }}
            value={form.date}
            onChange={fv("date")}
            onKeyDown={onEnter(refCode)}
          />
          <input
            ref={refCode}
            className="xp-input xp-input-sm"
            style={{ width: 96, marginRight: 4 }}
            value={form.code}
            onChange={fv("code")}
            placeholder=""
            onKeyDown={onEnter(refAccount)}
          />
          <input
            ref={refAccount}
            className="xp-input xp-input-sm"
            style={{ flex: 1, marginRight: 4 }}
            value={form.account_title}
            onChange={fv("account_title")}
            placeholder="Account / Party name"
            onKeyDown={onEnter(refDesc)}
          />
          <input
            ref={refDesc}
            className="xp-input xp-input-sm"
            style={{ flex: 1, marginRight: 4 }}
            value={form.description}
            onChange={fv("description")}
            placeholder="Description"
            onKeyDown={onEnter(refInvoice)}
          />
          <input
            ref={refInvoice}
            className="xp-input xp-input-sm"
            style={{ width: 66, marginRight: 4 }}
            value={form.invoice}
            onChange={fv("invoice")}
            placeholder="0"
            onKeyDown={onEnter(refAmount)}
          />
          <input
            ref={refAmount}
            className="xp-input xp-input-sm cpv-amt-input"
            style={{ width: 96 }}
            value={form.amount}
            onChange={fv("amount")}
            placeholder="0"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSave();
              }
            }}
          />
        </div>

        {/* ── Commands bar ─────────────────────────────────────────────── */}
        <div className="cpv-commands">
          <span className="cpv-commands-label">Commands</span>
          <label className="cpv-sms-chk">
            <input
              type="checkbox"
              checked={form.send_sms}
              onChange={(e) =>
                setForm((f) => ({ ...f, send_sms: e.target.checked }))
              }
            />
            Send SMS
          </label>

          <div className="xp-toolbar-divider" />

          <button
            className="xp-btn xp-btn-sm"
            onClick={() => {
              loadRows(search);
              fetchNextCpv();
            }}
            disabled={loading}
          >
            <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
              <path d="M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36a.25.25 0 0 1 .192-.41m-11 2h3.932a.25.25 0 0 0 .192-.41L2.692 6.23a.25.25 0 0 0-.384 0L.342 8.59A.25.25 0 0 0 .534 9" />
              <path
                fillRule="evenodd"
                d="M8 3c-1.552 0-2.94.707-3.857 1.818a.5.5 0 1 1-.771-.636A6.002 6.002 0 0 1 13.917 7H12.9A5 5 0 0 0 8 3M3.1 9a5.002 5.002 0 0 0 8.757 2.182.5.5 0 1 1 .771.636A6.002 6.002 0 0 1 2.083 9z"
              />
            </svg>
            {loading ? "Loading…" : "Refresh"}
          </button>

          <button
            ref={refSave}
            className="xp-btn xp-btn-sm xp-btn-success"
            onClick={handleSave}
            disabled={saving}
          >
            <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
              <path d="M2 1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4.5a.5.5 0 0 0-.146-.354l-3-3A.5.5 0 0 0 11.5 1zm5 11.5V10h2v2.5a.5.5 0 0 1-1 0zm-1 0a1.5 1.5 0 0 0 3 0V10H5v2.5a.5.5 0 0 1-1 0V10H3V9h10v1h-1v2.5a.5.5 0 0 1-1 0V10h-1v2.5zM11 2h1v2H4V2z" />
            </svg>
            {saving ? "Saving…" : "Save Record"}
          </button>

          <button
            className="xp-btn xp-btn-sm"
            disabled={!form._id}
            onClick={() => form._id && refAccount.current?.focus()}
          >
            <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
              <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168z" />
            </svg>
            Edit Record
          </button>

          <button
            className="xp-btn xp-btn-sm xp-btn-danger"
            disabled={!form._id}
            onClick={handleDelete}
          >
            <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
              <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z" />
              <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z" />
            </svg>
            Delete Record
          </button>

          <button className="xp-btn xp-btn-sm" onClick={() => window.print()}>
            <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
              <path d="M2.5 8a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1" />
              <path d="M5 1a2 2 0 0 0-2 2v2H2a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h1v1a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-1h1a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-1V3a2 2 0 0 0-2-2zM4 3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2H4zm1 5a2 2 0 0 0-2 2v1H2a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v-1a2 2 0 0 0-2-2zm7 2v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1" />
            </svg>
            Print Receipt
          </button>

          <button
            className="xp-btn xp-btn-sm xp-btn-danger"
            style={{ marginLeft: "auto" }}
            onClick={handleNew}
          >
            <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
              <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708" />
            </svg>
            Close
          </button>
        </div>
      </div>

      {/* ── Search / Results bar ──────────────────────────────────────────── */}
      <div className="cpv-results-bar">
        <span className="cpv-results-label">Searching Results</span>
        <div className="xp-search-wrap" style={{ width: 260 }}>
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
            ref={refSearch}
            type="text"
            className="xp-input xp-input-sm"
            value={search}
            onChange={handleSearch}
            placeholder="Search CPV#, account, description…"
          />
        </div>
        <span style={{ color: "#555" }}>{rows.length} record(s)</span>
        <span className="cpv-total">Total: Rs {fmt(totalAmt)}</span>
      </div>

      {/* ── Table ────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflow: "auto", padding: "0 10px 10px" }}>
        <div className="xp-table-panel">
          {loading && <div className="xp-loading">Loading records…</div>}
          {!loading && rows.length === 0 && (
            <div className="xp-empty">No records found</div>
          )}
          {!loading && rows.length > 0 && (
            <div className="xp-table-scroll">
              <table className="xp-table">
                <thead>
                  <tr>
                    <th style={{ width: 36 }}>Sr#</th>
                    <th style={{ width: 80 }}>Date</th>
                    <th style={{ width: 84 }}>CPV #</th>
                    <th>Account Title</th>
                    <th>Description</th>
                    <th className="r" style={{ width: 64 }}>
                      Invoice
                    </th>
                    <th className="r" style={{ width: 100 }}>
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr
                      key={row._id || i}
                      className={form._id === row._id ? "cpv-row-selected" : ""}
                      onClick={() => handleRowClick(row)}
                    >
                      <td
                        className="text-muted"
                        style={{ fontSize: "var(--xp-fs-xs)" }}
                      >
                        {i + 1}
                      </td>
                      <td
                        className="text-muted"
                        style={{
                          whiteSpace: "nowrap",
                          fontSize: "var(--xp-fs-xs)",
                        }}
                      >
                        {fmtDate(row.date)}
                      </td>
                      <td>
                        <span className="xp-code">{row.cpv_number}</span>
                      </td>
                      <td
                        style={{
                          maxWidth: 200,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {row.account_title}
                      </td>
                      <td
                        className="text-muted"
                        style={{
                          maxWidth: 180,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {row.description}
                      </td>
                      <td
                        className="r text-muted font-mono"
                        style={{ fontSize: "var(--xp-fs-xs)" }}
                      >
                        {row.invoice || 0}
                      </td>
                      <td className="r">
                        <span className="xp-amt success">
                          Rs {fmt(row.amount)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td
                      colSpan={6}
                      className="r"
                      style={{ fontWeight: 700, fontSize: "var(--xp-fs-sm)" }}
                    >
                      Grand Total →
                    </td>
                    <td className="r">
                      <span
                        className="xp-amt success"
                        style={{ fontSize: "var(--xp-fs-md)" }}
                      >
                        Rs {fmt(totalAmt)}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Status bar ───────────────────────────────────────────────────── */}
      <div className="xp-statusbar">
        <div className="xp-status-pane">
          <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
            <path d="M12.136.326A1.5 1.5 0 0 1 14 1.78V3h.5A1.5 1.5 0 0 1 16 4.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 0 13.5v-9A1.5 1.5 0 0 1 1.432 3.001L12.136.326z" />
          </svg>
          {form._id ? `Editing CPV #${form.cpv_number}` : "New Record"}
        </div>
        <div className="xp-status-pane">{rows.length} record(s)</div>
        <div className="xp-status-pane">Total: Rs {fmt(totalAmt)}</div>
      </div>
    </div>
  );
}
