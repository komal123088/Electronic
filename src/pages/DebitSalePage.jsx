// pages/DebitSalePage.jsx — Debit Sale (Cash / Debit Customers)
import { useState, useEffect, useRef, useCallback } from "react";
import "../styles/DebitSalePage.css";
import api from "../api/api.js";
import EP from "../api/apiEndpoints.js";

const isoDate = () => new Date().toISOString().split("T")[0];
const fmt = (n) => Number(n || 0).toLocaleString("en-PK");
const SHOP_NAME = "Asim Electric and Electronic Store";
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

// ═══════ CUSTOMER SELECT MODAL ══════════════════════════════════════════════
function CustomerSelectModal({ customers, onSelect, onClose }) {
  const [hiIdx, setHiIdx] = useState(0);
  const tbodyRef = useRef(null);
  useEffect(() => {
    tbodyRef.current?.focus();
  }, []);
  useEffect(() => {
    tbodyRef.current?.children[hiIdx]?.scrollIntoView({ block: "nearest" });
  }, [hiIdx]);

  const onKey = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHiIdx((i) => Math.min(i + 1, customers.length - 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHiIdx((i) => Math.max(i - 1, 0));
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (customers[hiIdx]) onSelect(customers[hiIdx]);
    }
    if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <div
      className="csm-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="csm-window">
        <div className="csm-titlebar">
          <span>Select Debit Customer ({customers.length} found)</span>
          <button className="sm-close-btn" onClick={onClose} tabIndex={-1}>
            ✕
          </button>
        </div>
        <table className="csm-table">
          <thead>
            <tr>
              <th style={{ width: 32 }}>#</th>
              <th>Name</th>
              <th style={{ width: 130 }}>Phone</th>
              <th className="r" style={{ width: 100 }}>
                Balance
              </th>
            </tr>
          </thead>
          <tbody
            ref={tbodyRef}
            tabIndex={0}
            onKeyDown={onKey}
            style={{ outline: "none" }}
          >
            {customers.map((c, i) => (
              <tr
                key={c._id}
                className={i === hiIdx ? "hi" : i % 2 === 0 ? "even" : "odd"}
                onClick={() => setHiIdx(i)}
                onDoubleClick={() => onSelect(c)}
              >
                <td className="c">{i + 1}</td>
                <td>
                  <b>{c.name}</b>
                </td>
                <td>{c.phone}</td>
                <td className={`r ${(c.currentBalance || 0) > 0 ? "red" : ""}`}>
                  <b>{fmt(c.currentBalance || 0)}</b>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="csm-footer">
          ↑↓ navigate | Enter / Double-click = select | Esc = close
        </div>
      </div>
    </div>
  );
}

// ═══════ PRODUCT SEARCH MODAL ════════════════════════════════════════════════
function SearchModal({ allProducts, onSelect, onClose }) {
  const [desc, setDesc] = useState("");
  const [cat, setCat] = useState("");
  const [company, setCompany] = useState("");
  const [rows, setRows] = useState([]);
  const [hiIdx, setHiIdx] = useState(0);
  const rDesc = useRef(null),
    rCat = useRef(null),
    rCompany = useRef(null),
    tbodyRef = useRef(null);

  const buildFlat = useCallback((products, d, c, co) => {
    const ld = d.trim().toLowerCase(),
      lc = c.trim().toLowerCase(),
      lo = co.trim().toLowerCase(),
      res = [];
    products.forEach((p) => {
      if (
        !(
          (!ld ||
            p.description?.toLowerCase().includes(ld) ||
            p.code?.toLowerCase().includes(ld)) &&
          (!lc || p.category?.toLowerCase().includes(lc)) &&
          (!lo || p.company?.toLowerCase().includes(lo))
        )
      )
        return;
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
    const f = buildFlat(allProducts, desc, cat, company);
    setRows(f);
    setHiIdx(f.length > 0 ? 0 : -1);
  }, [desc, cat, company, allProducts, buildFlat]);
  useEffect(() => {
    tbodyRef.current?.children[hiIdx]?.scrollIntoView({ block: "nearest" });
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
        : (tbodyRef.current?.focus(), setHiIdx((h) => Math.max(0, h)));
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
    if (e.key === "Escape") {
      onClose();
    }
    if (e.key === "Tab") {
      e.preventDefault();
      rDesc.current?.focus();
    }
  };

  return (
    <div
      className="sm-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="sm-window">
        <div className="sm-titlebar">
          <span>Search Products</span>
          <button className="sm-close-btn" onClick={onClose} tabIndex={-1}>
            ✕
          </button>
        </div>
        <div className="sm-filters">
          <div className="sm-filter-field">
            <span className="sm-filter-label">Description</span>
            <input
              ref={rDesc}
              type="text"
              className="sm-filter-input w200"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              onKeyDown={(e) => fk(e, rCat)}
              placeholder="Name / code…"
              autoComplete="off"
            />
          </div>
          <div className="sm-filter-field">
            <span className="sm-filter-label">Category</span>
            <input
              ref={rCat}
              type="text"
              className="sm-filter-input w140"
              value={cat}
              onChange={(e) => setCat(e.target.value)}
              onKeyDown={(e) => fk(e, rCompany)}
              placeholder="e.g. SMALL"
              autoComplete="off"
            />
          </div>
          <div className="sm-filter-field">
            <span className="sm-filter-label">Company</span>
            <input
              ref={rCompany}
              type="text"
              className="sm-filter-input w130"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              onKeyDown={(e) => fk(e, null)}
              placeholder="e.g. LUX"
              autoComplete="off"
            />
          </div>
          <div className="sm-filters-right">
            <span className="sm-count">{rows.length} result(s)</span>
            <button className="ds-btn" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
        <div className="sm-products-box">
          <span className="sm-products-legend">Products</span>
          <div className="sm-products-scroll">
            <table className="sm-table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>Sr.#</th>
                  <th style={{ width: 75 }}>Barcode</th>
                  <th>Name</th>
                  <th style={{ width: 90 }}>Measurement</th>
                  <th className="r" style={{ width: 70 }}>
                    Rate
                  </th>
                  <th className="r" style={{ width: 70 }}>
                    Stock
                  </th>
                  <th className="r" style={{ width: 55 }}>
                    Pack
                  </th>
                </tr>
              </thead>
              <tbody
                ref={tbodyRef}
                tabIndex={0}
                onKeyDown={tk}
                style={{ outline: "none" }}
              >
                {rows.length === 0 && (
                  <tr>
                    <td className="empty" colSpan={7}>
                      No products found
                    </td>
                  </tr>
                )}
                {rows.map((r, i) => (
                  <tr
                    key={`${r._id}-${r._pi}`}
                    className={
                      i === hiIdx ? "hi" : i % 2 === 0 ? "even" : "odd"
                    }
                    onClick={() => setHiIdx(i)}
                    onDoubleClick={() => onSelect(r)}
                  >
                    <td style={{ textAlign: "center" }}>{i + 1}</td>
                    <td style={{ fontWeight: "bold" }}>{r.code}</td>
                    <td>{r._name}</td>
                    <td>{r._meas}</td>
                    <td className="r">{r._rate}</td>
                    <td className="r">{r._stock}</td>
                    <td className="r">{r._pack}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="sm-footer">
          ↑↓ navigate | Enter / Double-click = select | Esc = close | Tab =
          filters
        </div>
      </div>
    </div>
  );
}

// ═══════ DEBIT CUSTOMERS MANAGEMENT MODAL ═══════════════════════════════════
// Shows ONLY type=walkin customers
function DebitCustomersModal({ onClose }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selCust, setSelCust] = useState(null);
  const [history, setHistory] = useState([]);
  const [payAmt, setPayAmt] = useState("");
  const [payNote, setPayNote] = useState("");
  const [paying, setPaying] = useState(false);
  const [msg, setMsg] = useState({ text: "", type: "" });
  const payRef = useRef(null);

  useEffect(() => {
    loadCustomers();
  }, []);
  useEffect(() => {
    if (selCust) loadHistory(selCust._id);
  }, [selCust?._id]);

  const showMsg = (text, type = "success") => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: "", type: "" }), 3000);
  };

  const loadCustomers = async () => {
    setLoading(true);
    try {
      // ONLY walkin type customers
      const { data } = await api.get(EP.CUSTOMERS.GET_WALKIN());
      if (data.success)
        setCustomers((data.data || []).filter((c) => c.type === "walkin"));
    } catch {}
    setLoading(false);
  };

  const loadHistory = async (id) => {
    try {
      const { data } = await api.get(EP.CUSTOMERS.SALE_HISTORY(id));
      if (data.success) setHistory(data.data);
    } catch {
      setHistory([]);
    }
  };

  const filtered = customers.filter(
    (c) =>
      !search ||
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search),
  );

  const totalDue = customers.reduce((s, c) => s + (c.currentBalance || 0), 0);
  const dueCount = customers.filter((c) => (c.currentBalance || 0) > 0).length;

  const recordPayment = async () => {
    if (!selCust || !payAmt || Number(payAmt) <= 0) return;
    setPaying(true);
    try {
      const newBal = Math.max(
        0,
        (selCust.currentBalance || 0) - Number(payAmt),
      );
      await api.put(EP.CUSTOMERS.UPDATE(selCust._id), {
        currentBalance: newBal,
      });
      showMsg(`Payment of Rs.${fmt(payAmt)} recorded`);
      setPayAmt("");
      setPayNote("");
      setSelCust((p) => ({ ...p, currentBalance: newBal }));
      loadCustomers();
    } catch {
      showMsg("Payment failed", "error");
    }
    setPaying(false);
  };

  const sendReminder = (cust) => {
    const text = `Assalam o Alaikum *${cust.name}*,\n\nYour outstanding balance is *Rs. ${fmt(cust.currentBalance)}* at ${SHOP_NAME}.\n\nKindly clear your dues.\n\nThank you!`;
    window.open(
      `https://wa.me/${cust.phone?.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`,
      "_blank",
    );
  };

  return (
    <div
      className="dcm-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="dcm-modal">
        <div className="dcm-titlebar">
          <span>Debit Customers Management</span>
          <button className="dcm-close" onClick={onClose}>
            ✕
          </button>
        </div>
        {msg.text && <div className={`dcm-msg ${msg.type}`}>{msg.text}</div>}
        <div className="dcm-summary">
          <div className="dcm-scard">
            <span>Total Debit Customers</span>
            <b>{customers.length}</b>
          </div>
          <div className="dcm-scard danger">
            <span>Customers with Due</span>
            <b className="red">{dueCount}</b>
          </div>
          <div className="dcm-scard danger">
            <span>Total Outstanding</span>
            <b className="red">Rs. {fmt(totalDue)}</b>
          </div>
        </div>
        <div className="dcm-body">
          {/* Left: list */}
          <div className="dcm-left">
            <input
              className="dcm-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or phone…"
              autoFocus
            />
            <div className="dcm-list-wrap">
              <table className="dcm-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Phone</th>
                    <th className="r">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={4} className="dcm-empty">
                        Loading…
                      </td>
                    </tr>
                  )}
                  {!loading && filtered.length === 0 && (
                    <tr>
                      <td colSpan={4} className="dcm-empty">
                        No debit customers found
                      </td>
                    </tr>
                  )}
                  {filtered.map((c, i) => (
                    <tr
                      key={c._id}
                      className={`dcm-row ${selCust?._id === c._id ? "sel" : i % 2 === 0 ? "even" : "odd"}`}
                      onClick={() => {
                        setSelCust(c);
                        setTimeout(() => payRef.current?.focus(), 100);
                      }}
                    >
                      <td className="c">{i + 1}</td>
                      <td className="bold">{c.name}</td>
                      <td>{c.phone || "—"}</td>
                      <td
                        className={`r ${(c.currentBalance || 0) > 0 ? "red" : ""}`}
                      >
                        <b>{fmt(c.currentBalance || 0)}</b>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right: detail */}
          <div className="dcm-right">
            {!selCust ? (
              <div className="dcm-no-sel">
                ← Click a debit customer to see details
              </div>
            ) : (
              <>
                <div className="dcm-cust-header">
                  <div className="dcm-cust-name">{selCust.name}</div>
                  {selCust.phone && (
                    <div className="dcm-cust-phone">{selCust.phone}</div>
                  )}
                  <div
                    className={`dcm-cust-bal ${(selCust.currentBalance || 0) > 0 ? "red" : ""}`}
                  >
                    Balance: <b>Rs. {fmt(selCust.currentBalance || 0)}</b>
                  </div>
                </div>
                <div className="dcm-pay-section">
                  <div className="dcm-pay-title">Record Payment</div>
                  <div className="dcm-pay-row">
                    <input
                      ref={payRef}
                      type="number"
                      className="dcm-pay-in"
                      value={payAmt}
                      onChange={(e) => setPayAmt(e.target.value)}
                      placeholder="Amount"
                      onKeyDown={(e) => e.key === "Enter" && recordPayment()}
                    />
                    <input
                      className="dcm-pay-in wide"
                      value={payNote}
                      onChange={(e) => setPayNote(e.target.value)}
                      placeholder="Note (optional)"
                    />
                    <button
                      className="ds-btn ds-btn-primary"
                      onClick={recordPayment}
                      disabled={paying || !payAmt}
                    >
                      {paying ? "Saving…" : "Pay"}
                    </button>
                    {selCust.phone && (
                      <button
                        className="ds-btn ds-btn-wa"
                        onClick={() => sendReminder(selCust)}
                      >
                        WA Remind
                      </button>
                    )}
                  </div>
                </div>
                <div className="dcm-hist-label">
                  Transaction History ({history.length})
                </div>
                <div className="dcm-hist-wrap">
                  <table className="dcm-hist-table">
                    <thead>
                      <tr>
                        <th>Invoice</th>
                        <th>Date</th>
                        <th className="r">Amount</th>
                        <th className="r">Paid</th>
                        <th className="r">Balance</th>
                        <th>Mode</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.length === 0 && (
                        <tr>
                          <td colSpan={6} className="dcm-empty">
                            No transactions yet
                          </td>
                        </tr>
                      )}
                      {history.map((s, i) => (
                        <tr
                          key={s._id}
                          className={i % 2 === 0 ? "even" : "odd"}
                        >
                          <td className="blue">{s.invoiceNo}</td>
                          <td>{s.invoiceDate}</td>
                          <td className="r bold">{fmt(s.netTotal)}</td>
                          <td className="r">{fmt(s.paidAmount)}</td>
                          <td className={`r ${s.balance > 0 ? "red" : ""}`}>
                            {fmt(s.balance)}
                          </td>
                          <td>{s.paymentMode}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════ INVOICE MODAL ═══════════════════════════════════════════════════════
function InvoiceModal({ sale, shopName, onClose }) {
  const printA4 = () => {
    const trs = sale.items
      .map(
        (it, i) =>
          `<tr><td>${i + 1}</td><td>${it.description}</td><td>${it.measurement || ""}</td><td align="right">${it.qty}</td><td align="right">${Number(it.rate).toLocaleString()}</td><td align="right">${it.disc || 0}%</td><td align="right"><b>${Number(it.amount).toLocaleString()}</b></td></tr>`,
      )
      .join("");
    const w = window.open("", "_blank", "width=900,height=700");
    w.document.write(
      `<!DOCTYPE html><html><head><title>Invoice ${sale.invoiceNo}</title><style>body{font-family:Arial,sans-serif;font-size:12px;margin:20px}h2{text-align:center;font-size:20px;margin:0}.c{text-align:center;font-size:11px;color:#555;margin-bottom:8px}.meta{display:flex;justify-content:space-between;border:1px solid #ccc;padding:6px 10px;margin:8px 0;flex-wrap:wrap;gap:4px}table{width:100%;border-collapse:collapse;margin-top:10px}th{background:#e0e0e0;border:1px solid #ccc;padding:4px 6px;text-align:left}td{border:1px solid #ddd;padding:3px 6px}.tots{float:right;min-width:220px;margin-top:10px}.tr{display:flex;justify-content:space-between;padding:2px 0}.tr.b{font-weight:bold;font-size:14px;border-top:1px solid #000;margin-top:4px}.tr.red{color:red}.tr.g{color:green}.thanks{text-align:center;margin-top:30px;font-size:11px;color:#888}@media print{body{margin:5mm}}</style></head><body><h2>${shopName}</h2><div class="c">DEBIT SALE INVOICE</div><div class="meta"><span><b>Invoice #:</b> ${sale.invoiceNo}</span><span><b>Date:</b> ${sale.invoiceDate}</span><span><b>Payment:</b> ${sale.paymentMode}</span>${sale.customerName && sale.customerName !== "COUNTER SALE" ? `<span><b>Customer:</b> ${sale.customerName}${sale.customerPhone ? " | " + sale.customerPhone : ""}</span>` : ""}</div><table><thead><tr><th>#</th><th>Description</th><th>Meas.</th><th align="right">Qty</th><th align="right">Rate</th><th align="right">Disc%</th><th align="right">Amount</th></tr></thead><tbody>${trs}</tbody></table><div class="tots"><div class="tr"><span>Sub Total</span><span>${Number(sale.subTotal).toLocaleString()}</span></div>${sale.discAmount > 0 ? `<div class="tr"><span>Discount</span><span>-${Number(sale.discAmount).toLocaleString()}</span></div>` : ""}<div class="tr b"><span>Net Total</span><span>${Number(sale.netTotal).toLocaleString()}</span></div><div class="tr g"><span>Cash Paid</span><span>${Number(sale.paidAmount || 0).toLocaleString()}</span></div>${(sale.balance || 0) > 0 ? `<div class="tr red"><span>Balance</span><span>${Number(sale.balance).toLocaleString()}</span></div>` : ""}</div><br style="clear:both"><div class="thanks">Thank you for your business! — ${shopName}</div></body></html>`,
    );
    w.document.close();
    setTimeout(() => w.print(), 400);
  };

  const printThermal = () => {
    const trs = sale.items
      .map(
        (it, i) =>
          `<tr><td style="padding:2px 0">${i + 1}. ${it.description}</td><td align="right" style="padding:2px 0">${it.qty}×${Number(it.rate).toLocaleString()}</td><td align="right" style="padding:2px 0"><b>${Number(it.amount).toLocaleString()}</b></td></tr>`,
      )
      .join("");
    const w = window.open("", "_blank", "width=400,height=600");
    w.document.write(
      `<!DOCTYPE html><html><head><title>Receipt</title><style>body{font-family:'Courier New',monospace;font-size:11px;width:72mm;margin:0 auto;padding:4px}h3{text-align:center;font-size:14px;margin:4px 0}.c{text-align:center;font-size:10px}hr{border:none;border-top:1px dashed #000;margin:4px 0}table{width:100%;font-size:10px;border-collapse:collapse}.t{display:flex;justify-content:space-between;font-size:11px;padding:1px 0}.t.b{font-weight:bold;font-size:12px;border-top:1px dashed #000;padding-top:3px;margin-top:2px}.t.red{color:red}.t.g{color:green}@media print{@page{size:80mm auto;margin:3mm}}</style></head><body><h3>${shopName}</h3><div class="c">DEBIT SALE RECEIPT</div><hr><div class="c">Invoice: <b>${sale.invoiceNo}</b> | ${sale.invoiceDate}</div>${sale.customerName && sale.customerName !== "COUNTER SALE" ? `<div class="c"><b>${sale.customerName}</b> ${sale.customerPhone || ""}</div>` : ""}<hr><table><tbody>${trs}</tbody></table><hr><div class="t"><span>Sub Total</span><span>${Number(sale.subTotal).toLocaleString()}</span></div>${sale.discAmount > 0 ? `<div class="t"><span>Disc</span><span>-${Number(sale.discAmount).toLocaleString()}</span></div>` : ""}<div class="t b"><span>TOTAL</span><span>${Number(sale.netTotal).toLocaleString()}</span></div><div class="t g"><span>Paid</span><span>${Number(sale.paidAmount || 0).toLocaleString()}</span></div>${(sale.balance || 0) > 0 ? `<div class="t red"><span>Balance</span><span>${Number(sale.balance).toLocaleString()}</span></div>` : ""}<div style="text-align:center;margin-top:8px;font-size:10px">Thank you!</div></body></html>`,
    );
    w.document.close();
    setTimeout(() => w.print(), 400);
  };

  const shareWhatsApp = () => {
    const lines = sale.items
      .map(
        (it, i) =>
          `${i + 1}. ${it.description} | ${it.qty}×${Number(it.rate).toLocaleString()} = *${Number(it.amount).toLocaleString()}*`,
      )
      .join("\n");
    const text = `*${shopName}*\nInvoice #${sale.invoiceNo}\n${sale.invoiceDate}\n${sale.customerName !== "COUNTER SALE" ? "Customer: " + sale.customerName : ""}\n${"─".repeat(26)}\n${lines}\n${"─".repeat(26)}\nNet Total: *${Number(sale.netTotal).toLocaleString()}*\nPaid: ${Number(sale.paidAmount || 0).toLocaleString()}${(sale.balance || 0) > 0 ? "\nBalance: *" + Number(sale.balance).toLocaleString() + "*" : ""}\n_Thank you!_`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div
      className="cs-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="ds-inv-modal">
        <div className="ds-inv-title">
          Invoice #{sale.invoiceNo} — {sale.customerName || "Counter Sale"}
          <button className="cs-close-x" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="ds-inv-preview">
          <div className="ds-inv-shop">{shopName}</div>
          <div className="ds-inv-sub">DEBIT SALE INVOICE</div>
          <div className="ds-inv-meta">
            <span>
              Invoice: <b>{sale.invoiceNo}</b>
            </span>
            <span>
              Date: <b>{sale.invoiceDate}</b>
            </span>
            <span>
              Mode: <b>{sale.paymentMode}</b>
            </span>
            {sale.customerName && sale.customerName !== "COUNTER SALE" && (
              <span>
                Customer: <b>{sale.customerName}</b> {sale.customerPhone}
              </span>
            )}
          </div>
          <table className="cs-inv-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Description</th>
                <th>Meas</th>
                <th className="r">Qty</th>
                <th className="r">Rate</th>
                <th className="r">Disc</th>
                <th className="r">Amount</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map((it, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>{it.description}</td>
                  <td>{it.measurement}</td>
                  <td className="r">{it.qty}</td>
                  <td className="r">{fmt(it.rate)}</td>
                  <td className="r">{it.disc || 0}%</td>
                  <td className="r bold">{fmt(it.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="cs-inv-totals">
            <div className="cs-inv-tr">
              <span>Sub Total</span>
              <span>{fmt(sale.subTotal)}</span>
            </div>
            {sale.discAmount > 0 && (
              <div className="cs-inv-tr">
                <span>Discount</span>
                <span>-{fmt(sale.discAmount)}</span>
              </div>
            )}
            <div className="cs-inv-tr bold">
              <span>Net Total</span>
              <span>{fmt(sale.netTotal)}</span>
            </div>
            <div className="cs-inv-tr green">
              <span>Cash Paid</span>
              <span>{fmt(sale.paidAmount || 0)}</span>
            </div>
            {(sale.balance || 0) > 0 && (
              <div className="cs-inv-tr bold red">
                <span>Balance</span>
                <span>{fmt(sale.balance)}</span>
              </div>
            )}
          </div>
        </div>
        <div className="cs-inv-actions">
          <button className="ds-btn" onClick={printThermal}>
            Thermal Print
          </button>
          <button className="ds-btn" onClick={printA4}>
            A4 Print / PDF
          </button>
          <button className="ds-btn ds-btn-wa" onClick={shareWhatsApp}>
            WhatsApp
          </button>
          <button className="ds-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════ MAIN PAGE ═══════════════════════════════════════════════════════════
export default function DebitSalePage() {
  const [invoiceNo, setInvoiceNo] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(isoDate());
  const [phone, setPhone] = useState("");
  const [customer, setCustomer] = useState(null);
  const [custHistory, setCustHistory] = useState([]);
  const [histLoading, setHistLoading] = useState(false);
  const [rows, setRows] = useState([{ ...EMPTY_ROW }]);
  const [activeRow, setActiveRow] = useState(0);
  const [searchText, setSearchText] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [custMatches, setCustMatches] = useState([]);
  const [showCustSel, setShowCustSel] = useState(false);
  const [products, setProducts] = useState([]);
  const [payMode, setPayMode] = useState("Cash");
  const [cashPaid, setCashPaid] = useState(0);
  const [extraDisc, setExtraDisc] = useState(0);
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [msg, setMsg] = useState({ text: "", type: "" });
  const [holds, setHolds] = useState([]);
  const [showCustMgmt, setShowCustMgmt] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [savedSale, setSavedSale] = useState(null);

  const phoneRef = useRef(null);
  const searchRef = useRef(null);
  const cashRef = useRef(null);
  const saveRef = useRef(null);
  const rowRefs = useRef([]);

  const subTotal = rows.reduce((s, r) => s + (r.amount || 0), 0);
  const discAmt = Math.round((subTotal * (extraDisc || 0)) / 100);
  const netTotal = subTotal - discAmt;
  const cashAmt = Math.min(Number(cashPaid) || 0, netTotal);
  const creditAmt = Math.max(netTotal - cashAmt, 0);

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
  }, [rows, customer, cashPaid, extraDisc]);

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
    setTimeout(() => setMsg({ text: "", type: "" }), 3500);
  };

  // Phone search — ONLY walkin customers
  const handlePhoneSearch = async () => {
    if (!phone.trim() || phone.length < 3) return;
    setPhoneLoading(true);
    try {
      const { data } = await api.get(EP.CUSTOMERS.GET_WALKIN(phone.trim()));
      if (data.success && data.data.length > 0) {
        const list = data.data.filter((c) => c.type === "walkin"); // double filter
        const exact = list.find((c) => c.phone === phone.trim());
        if (exact) {
          selectCustomer(exact);
        } else if (list.length === 1) {
          selectCustomer(list[0]);
        } else if (list.length > 1) {
          setCustMatches(list);
          setShowCustSel(true);
        } else {
          promptNewCustomer();
        }
      } else {
        promptNewCustomer();
      }
    } catch {
      showMsg("Search failed", "error");
    }
    setPhoneLoading(false);
  };

  const promptNewCustomer = async () => {
    // Quick-create debit customer with phone
    const name = prompt(
      `No debit customer found for "${phone}"\n\nEnter customer name to create new:`,
    );
    if (!name?.trim()) return;
    try {
      const { data } = await api.post(EP.CUSTOMERS.CREATE, {
        name: name.trim(),
        phone: phone.trim(),
        type: "walkin",
      });
      if (data.success) {
        selectCustomer(data.data);
        showMsg(`New debit customer created: ${data.data.name}`);
      }
    } catch {
      showMsg("Create failed", "error");
    }
  };

  const selectCustomer = (c) => {
    setCustomer(c);
    loadCustHistory(c._id);
    setShowCustSel(false);
    setCustMatches([]);
    showMsg(`${c.name} loaded`);
  };

  const loadCustHistory = async (id) => {
    setHistLoading(true);
    try {
      const { data } = await api.get(EP.CUSTOMERS.SALE_HISTORY(id));
      if (data.success) setCustHistory(data.data);
    } catch {}
    setHistLoading(false);
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
        amount: qty * rate,
      };
      return next;
    });
    setSearchText(product._name || product.description || "");
    setShowSearch(false);
    setTimeout(() => rowRefs.current[activeRow]?.qty?.focus(), 30);
  };

  const updateRow = (i, field, val) => {
    setRows((prev) => {
      const next = [...prev],
        r = { ...next[i], [field]: val };
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
  const onRowKeyDown = (e, i, field) => {
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
      if (fi < order.length - 1) rowRefs.current[i]?.[order[fi + 1]]?.focus();
      else if (i === rows.length - 1) addRowAfter(i);
      else rowRefs.current[i + 1]?.code?.focus();
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

  const setPayFull = () => {
    setCashPaid(netTotal);
    setPayMode("Cash");
  };
  const setPayCredit = () => {
    setCashPaid(0);
    setPayMode("Credit");
  };
  const setPayPartial = () => {
    setCashPaid(Math.floor(netTotal / 2));
    setPayMode("Credit");
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
        customer,
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
    setCustomer(h.customer);
    setPhone(h.phone);
    setExtraDisc(h.extraDisc);
    setCashPaid(h.cashPaid);
    setPayMode(h.payMode);
    setRemarks(h.remarks);
    setHolds((p) => p.filter((x) => x.id !== id));
  };
  const resetForm = () => {
    setRows([{ ...EMPTY_ROW }]);
    setCustomer(null);
    setCustHistory([]);
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
        saleType: "sale",
        paymentMode: actualMode,
        customerId: customer?._id || undefined,
        customerName: customer?.name || "COUNTER SALE",
        customerPhone: customer?.phone || phone || "",
        items: validRows,
        subTotal,
        extraDisc: Number(extraDisc),
        discAmount: discAmt,
        netTotal,
        paidAmount: cashAmt,
        balance: creditAmt,
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
          balance: creditAmt,
        });
        setShowInvoice(true);
        showMsg(`Saved: ${data.data.invoiceNo}`);
        resetForm();
      } else showMsg(data.message, "error");
    } catch (e) {
      showMsg(e.response?.data?.message || "Save failed", "error");
    }
    setSaving(false);
  };

  const histTotal = custHistory.reduce((s, x) => s + (x.netTotal || 0), 0);
  const histPaid = custHistory.reduce((s, x) => s + (x.paidAmount || 0), 0);
  const currentDue = customer?.currentBalance || 0;

  return (
    <div className="ds-page">
      {showSearch && (
        <SearchModal
          allProducts={products}
          onSelect={handleProductSelect}
          onClose={() => setShowSearch(false)}
        />
      )}
      {showCustMgmt && (
        <DebitCustomersModal onClose={() => setShowCustMgmt(false)} />
      )}
      {showCustSel && (
        <CustomerSelectModal
          customers={custMatches}
          onSelect={selectCustomer}
          onClose={() => setShowCustSel(false)}
        />
      )}
      {showInvoice && savedSale && (
        <InvoiceModal
          sale={savedSale}
          shopName={SHOP_NAME}
          onClose={() => {
            setShowInvoice(false);
            setSavedSale(null);
          }}
        />
      )}

      <div className="ds-shortcuts">
        F2=New | F3=Search | F5=Save | F8=Hold | Ctrl+Del=Remove row |
        Enter=Next field
      </div>
      {msg.text && <div className={`ds-msg ${msg.type}`}>{msg.text}</div>}

      {/* Header */}
      <div className="ds-header-bar">
        <div className="ds-header-title">Debit Sale</div>
        <div className="ds-header-fields">
          <div className="ds-hf">
            <span>Invoice #</span>
            <input
              className="ds-hinput bold"
              value={invoiceNo}
              readOnly
              tabIndex={-1}
            />
          </div>
          <div className="ds-hf">
            <span>Date</span>
            <input
              type="date"
              className="ds-hinput"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              tabIndex={-1}
            />
          </div>
        </div>
        <button
          className="ds-btn ds-btn-mgmt"
          onClick={() => setShowCustMgmt(true)}
          tabIndex={-1}
        >
          Manage Debit Customers
        </button>
      </div>

      {/* Layout */}
      <div className="ds-layout">
        {/* ═══ LEFT ════════════════════════════════════════════ */}
        <div className="ds-left">
          {/* Customer bar */}
          <div className="ds-cust-bar">
            <span className="ds-cust-label">Phone</span>
            <input
              ref={phoneRef}
              className="ds-cust-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handlePhoneSearch();
              }}
              placeholder="Phone → Enter to find debit customer"
              tabIndex={1}
            />
            <button
              className="ds-btn ds-btn-sm"
              onClick={handlePhoneSearch}
              disabled={phoneLoading}
              tabIndex={-1}
            >
              {phoneLoading ? "…" : "Search"}
            </button>
            {customer ? (
              <div className="ds-cust-info">
                <span className="ds-cust-name">{customer.name}</span>
                {customer.phone && (
                  <span className="ds-cust-phone-tag">{customer.phone}</span>
                )}
                {currentDue > 0 && (
                  <span className="ds-cust-due">
                    Due: <b className="red">{fmt(currentDue)}</b>
                  </span>
                )}
                <button
                  className="ds-cust-clear"
                  onClick={() => {
                    setCustomer(null);
                    setCustHistory([]);
                    setPhone("");
                  }}
                  tabIndex={-1}
                >
                  ✕
                </button>
              </div>
            ) : (
              <span className="ds-cust-none">
                Debit Customer / Counter Sale
              </span>
            )}
            {holds.map((h) => (
              <button
                key={h.id}
                className="ds-hold-btn"
                onClick={() => resumeHold(h.id)}
                tabIndex={-1}
              >
                Hold: {h.customer?.name || "Bill"} ({h.rows?.length || 0})
              </button>
            ))}
          </div>

          {/* Product search bar */}
          <div className="ds-search-bar">
            <span className="ds-search-label">Select Product</span>
            <input
              ref={searchRef}
              type="text"
              className={`ds-search-input${searchText ? " filled" : ""}`}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onClick={() => setShowSearch(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === "ArrowDown") {
                  e.preventDefault();
                  setShowSearch(true);
                }
              }}
              placeholder="Click or press Enter / F3 to search products…"
              readOnly={!!searchText}
              tabIndex={2}
            />
            {searchText && (
              <button
                className="ds-btn"
                onClick={() => setSearchText("")}
                tabIndex={-1}
              >
                Clear
              </button>
            )}
          </div>

          {/* Items table */}
          <div className="ds-table-wrap">
            <table className="ds-table">
              <thead>
                <tr>
                  <th style={{ width: 32 }}>#</th>
                  <th style={{ width: 80 }}>Code</th>
                  <th>Description</th>
                  <th style={{ width: 80 }}>Meas.</th>
                  <th style={{ width: 65 }}>Qty</th>
                  <th style={{ width: 85 }}>Rate</th>
                  <th style={{ width: 60 }}>Disc%</th>
                  <th style={{ width: 90 }}>Amount</th>
                  <th style={{ width: 28 }}></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => {
                  if (!rowRefs.current[i]) rowRefs.current[i] = {};
                  return (
                    <tr
                      key={i}
                      className={
                        i === activeRow
                          ? "ds-row-active"
                          : i % 2 === 0
                            ? "ds-row-even"
                            : "ds-row-odd"
                      }
                      onClick={() => setActiveRow(i)}
                    >
                      <td className="c">{i + 1}</td>
                      <td>
                        <input
                          className="ds-cell-input"
                          ref={(el) => {
                            if (rowRefs.current[i])
                              rowRefs.current[i].code = el;
                          }}
                          value={row.code}
                          onChange={(e) => updateRow(i, "code", e.target.value)}
                          onBlur={(e) => onCodeBlur(i, e.target.value)}
                          onKeyDown={(e) => onRowKeyDown(e, i, "code")}
                          tabIndex={100 + i * 10 + 1}
                        />
                      </td>
                      <td>
                        <input
                          className="ds-cell-input full"
                          ref={(el) => {
                            if (rowRefs.current[i])
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
                            } else onRowKeyDown(e, i, "description");
                          }}
                          tabIndex={100 + i * 10 + 2}
                        />
                      </td>
                      <td>
                        <input
                          className="ds-cell-input"
                          ref={(el) => {
                            if (rowRefs.current[i])
                              rowRefs.current[i].measurement = el;
                          }}
                          value={row.measurement}
                          onChange={(e) =>
                            updateRow(i, "measurement", e.target.value)
                          }
                          onKeyDown={(e) => onRowKeyDown(e, i, "measurement")}
                          tabIndex={100 + i * 10 + 3}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="ds-cell-input r"
                          ref={(el) => {
                            if (rowRefs.current[i]) rowRefs.current[i].qty = el;
                          }}
                          value={row.qty}
                          onChange={(e) => updateRow(i, "qty", e.target.value)}
                          onKeyDown={(e) => onRowKeyDown(e, i, "qty")}
                          tabIndex={100 + i * 10 + 4}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="ds-cell-input r"
                          ref={(el) => {
                            if (rowRefs.current[i])
                              rowRefs.current[i].rate = el;
                          }}
                          value={row.rate}
                          onChange={(e) => updateRow(i, "rate", e.target.value)}
                          onKeyDown={(e) => onRowKeyDown(e, i, "rate")}
                          tabIndex={100 + i * 10 + 5}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="ds-cell-input r"
                          ref={(el) => {
                            if (rowRefs.current[i])
                              rowRefs.current[i].disc = el;
                          }}
                          value={row.disc}
                          onChange={(e) => updateRow(i, "disc", e.target.value)}
                          onKeyDown={(e) => onRowKeyDown(e, i, "disc")}
                          tabIndex={100 + i * 10 + 6}
                        />
                      </td>
                      <td className="r bold">{fmt(row.amount)}</td>
                      <td className="c">
                        <button
                          className="ds-del-row"
                          onClick={() => deleteRow(i)}
                          tabIndex={-1}
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

          {/* Payment Section */}
          <div className="ds-pay-section">
            <div className="ds-pay-left">
              <div className="ds-pay-title">Payment Mode</div>
              <div className="ds-pay-modes">
                <button
                  className={`ds-pay-btn ${cashAmt >= netTotal && netTotal > 0 ? "active-cash" : ""}`}
                  onClick={setPayFull}
                >
                  Full Cash
                </button>
                <button
                  className={`ds-pay-btn ${cashAmt === 0 && netTotal > 0 ? "active-credit" : ""}`}
                  onClick={setPayCredit}
                >
                  Full Credit
                </button>
                <button
                  className={`ds-pay-btn ${cashAmt > 0 && cashAmt < netTotal ? "active-partial" : ""}`}
                  onClick={setPayPartial}
                >
                  Partial
                </button>
              </div>
              <div className="ds-pay-row">
                <label>Cash Received</label>
                <input
                  ref={cashRef}
                  type="number"
                  className="ds-pay-input"
                  value={cashPaid}
                  min={0}
                  onChange={(e) => {
                    setCashPaid(e.target.value);
                    setPayMode(
                      Number(e.target.value) >= netTotal ? "Cash" : "Credit",
                    );
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveRef.current?.focus();
                  }}
                  tabIndex={90}
                />
              </div>
              <div className="ds-pay-row">
                <label>Extra Disc%</label>
                <input
                  type="number"
                  className="ds-pay-input"
                  value={extraDisc}
                  onChange={(e) => setExtraDisc(e.target.value)}
                  tabIndex={89}
                />
              </div>
              <div className="ds-pay-row">
                <label>Remarks</label>
                <input
                  className="ds-pay-input wide"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  tabIndex={91}
                />
              </div>
            </div>
            <div className="ds-pay-right">
              <div className="ds-tot-row">
                <span>Sub Total</span>
                <span>{fmt(subTotal)}</span>
              </div>
              {discAmt > 0 && (
                <div className="ds-tot-row">
                  <span>Discount</span>
                  <span className="red">-{fmt(discAmt)}</span>
                </div>
              )}
              <div className="ds-tot-row bold big">
                <span>Net Total</span>
                <span>{fmt(netTotal)}</span>
              </div>
              <div className="ds-tot-row green">
                <span>Cash</span>
                <span>{fmt(cashAmt)}</span>
              </div>
              <div
                className={`ds-tot-row bold ${creditAmt > 0 ? "red" : "green"}`}
              >
                <span>Credit / Balance</span>
                <span>{fmt(creditAmt)}</span>
              </div>
              <div className="ds-pay-actions">
                <button
                  ref={saveRef}
                  className="ds-btn ds-btn-primary"
                  onClick={handleSave}
                  disabled={saving}
                  tabIndex={92}
                >
                  {saving ? "Saving…" : "F5 Save"}
                </button>
                <button className="ds-btn" onClick={holdBill} tabIndex={-1}>
                  F8 Hold
                </button>
                <button
                  className="ds-btn"
                  onClick={() => setShowInvoice(true)}
                  tabIndex={-1}
                >
                  Print
                </button>
                <button className="ds-btn" onClick={resetForm} tabIndex={-1}>
                  F2 New
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ RIGHT PANEL ════════════════════════════════════ */}
        <div className="ds-right-panel">
          {!customer ? (
            <div className="ds-rp-empty">
              <div className="ds-rp-icon">👤</div>
              <div>
                Enter phone number
                <br />
                to load debit customer
              </div>
              <button
                className="ds-rp-mgmt-btn"
                onClick={() => setShowCustMgmt(true)}
              >
                Manage Debit Customers
              </button>
            </div>
          ) : (
            <>
              <div className="ds-rp-header">
                <div className="ds-rp-name">{customer.name}</div>
                <div className="ds-rp-phone">{customer.phone}</div>
              </div>
              <div className="ds-rp-cards">
                <div className="ds-rp-card">
                  <div className="ds-rp-cl">Total Sales</div>
                  <div className="ds-rp-cv">{fmt(histTotal)}</div>
                </div>
                <div className="ds-rp-card">
                  <div className="ds-rp-cl">Total Paid</div>
                  <div className="ds-rp-cv green">{fmt(histPaid)}</div>
                </div>
                <div
                  className={`ds-rp-card ${currentDue > 0 ? "danger" : "ok"}`}
                >
                  <div className="ds-rp-cl">Current Due</div>
                  <div className="ds-rp-cv bold red">{fmt(currentDue)}</div>
                </div>
                {creditAmt > 0 && (
                  <div className="ds-rp-card danger">
                    <div className="ds-rp-cl">After This Bill</div>
                    <div className="ds-rp-cv bold red">
                      {fmt(currentDue + creditAmt)}
                    </div>
                  </div>
                )}
              </div>
              <div className="ds-rp-btns">
                {customer.phone && (
                  <button
                    className="ds-rp-btn wa"
                    onClick={() => {
                      const text = `Assalam o Alaikum *${customer.name}*,\n\nYour outstanding balance is *Rs. ${fmt(currentDue)}*.\n\nPlease clear dues.\n\n_${SHOP_NAME}_`;
                      window.open(
                        `https://wa.me/${customer.phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`,
                        "_blank",
                      );
                    }}
                  >
                    WA Reminder
                  </button>
                )}
                <button
                  className="ds-rp-btn detail"
                  onClick={() => setShowCustMgmt(true)}
                >
                  More Detail
                </button>
              </div>
              <div className="ds-rp-hist-label">
                Recent ({custHistory.length})
              </div>
              <div className="ds-rp-hist-wrap">
                {histLoading && <div className="ds-rp-loading">Loading…</div>}
                {!histLoading && custHistory.length === 0 && (
                  <div className="ds-rp-loading">No history yet</div>
                )}
                {custHistory.slice(0, 10).map((s) => (
                  <div
                    key={s._id}
                    className={`ds-rp-txn ${s.balance > 0 ? "txn-red" : ""}`}
                  >
                    <span className="ds-rp-inv">{s.invoiceNo}</span>
                    <span className="ds-rp-date">{s.invoiceDate}</span>
                    <span className="ds-rp-amt">{fmt(s.netTotal)}</span>
                    <span className={`ds-rp-bal ${s.balance > 0 ? "red" : ""}`}>
                      {fmt(s.balance)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
