// pages/DebitSalePage.jsx
// Bootstrap Icons: add in index.html → <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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
          <span>
            <i
              className="bi bi-person-lines-fill"
              style={{ color: "#4fc3f7", marginRight: 6 }}
            ></i>
            Select Debit Customer ({customers.length} found)
          </span>
          <button className="csm-close" onClick={onClose}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
        <table className="csm-table">
          <thead>
            <tr>
              <th style={{ width: 32 }}>#</th>
              <th>Name</th>
              <th style={{ width: 130 }}>Phone</th>
              <th className="r" style={{ width: 110 }}>
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
                <td>{c.phone || "—"}</td>
                <td className={`r ${(c.currentBalance || 0) > 0 ? "red" : ""}`}>
                  <b>{fmt(c.currentBalance || 0)}</b>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="csm-footer">
          ↑↓ navigate &nbsp;|&nbsp; Enter / Double-click = select &nbsp;|&nbsp;
          Esc = close
        </div>
      </div>
    </div>
  );
}

// ═══════ PRODUCT SEARCH MODAL ════════════════════════════════════════════════
function SearchModal({ allProducts, onSelect, onClose }) {
  const [desc, setDesc] = [useState(""), () => {}][0];
  const [_desc, setDescState] = useState("");
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
    const f = buildFlat(allProducts, _desc, cat, company);
    setRows(f);
    setHiIdx(f.length > 0 ? 0 : -1);
  }, [_desc, cat, company, allProducts, buildFlat]);
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
          <span>
            <i
              className="bi bi-search"
              style={{ color: "#80cbc4", marginRight: 6 }}
            ></i>
            Search Products
          </span>
          <button className="sm-close-btn" onClick={onClose}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
        <div className="sm-filters">
          <div className="sm-filter-field">
            <span className="sm-filter-label">Description</span>
            <input
              ref={rDesc}
              type="text"
              className="sm-filter-input w200"
              value={_desc}
              onChange={(e) => setDescState(e.target.value)}
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
                  <th style={{ width: 90 }}>Meas.</th>
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
      `<!DOCTYPE html><html><head><title>Invoice ${sale.invoiceNo}</title><style>body{font-family:Arial,sans-serif;font-size:12px;margin:20px}h2{text-align:center;font-size:20px;margin:0}.sub{text-align:center;font-size:11px;color:#555;margin-bottom:8px}.meta{display:flex;justify-content:space-between;border:1px solid #ccc;padding:6px 10px;margin:8px 0;flex-wrap:wrap;gap:4px}table{width:100%;border-collapse:collapse;margin-top:10px}th{background:#e0e0e0;border:1px solid #ccc;padding:4px 6px;text-align:left}td{border:1px solid #ddd;padding:3px 6px}.tots{float:right;min-width:220px;margin-top:10px}.tr{display:flex;justify-content:space-between;padding:2px 0}.tr.b{font-weight:bold;font-size:14px;border-top:1px solid #000;margin-top:4px}.tr.red{color:red}.tr.g{color:green}.thanks{text-align:center;margin-top:30px;font-size:11px;color:#888}@media print{body{margin:5mm}}</style></head><body><h2>${shopName}</h2><div class="sub">DEBIT SALE INVOICE</div><div class="meta"><span><b>Invoice:</b> ${sale.invoiceNo}</span><span><b>Date:</b> ${sale.invoiceDate}</span><span><b>Mode:</b> ${sale.paymentMode}</span>${sale.customerName && sale.customerName !== "COUNTER SALE" ? `<span><b>Customer:</b> ${sale.customerName}${sale.customerPhone ? " | " + sale.customerPhone : ""}</span>` : ""}</div><table><thead><tr><th>#</th><th>Description</th><th>Meas.</th><th align="right">Qty</th><th align="right">Rate</th><th align="right">Disc%</th><th align="right">Amount</th></tr></thead><tbody>${trs}</tbody></table><div class="tots"><div class="tr"><span>Sub Total</span><span>${Number(sale.subTotal).toLocaleString()}</span></div>${sale.discAmount > 0 ? `<div class="tr"><span>Discount</span><span>-${Number(sale.discAmount).toLocaleString()}</span></div>` : ""}<div class="tr b"><span>Net Total</span><span>${Number(sale.netTotal).toLocaleString()}</span></div><div class="tr g"><span>Cash Paid</span><span>${Number(sale.paidAmount || 0).toLocaleString()}</span></div>${(sale.balance || 0) > 0 ? `<div class="tr red"><span>Balance</span><span>${Number(sale.balance).toLocaleString()}</span></div>` : ""}</div><br style="clear:both"><div class="thanks">Thank you! — ${shopName}</div></body></html>`,
    );
    w.document.close();
    setTimeout(() => w.print(), 400);
  };
  const printThermal = () => {
    const trs = sale.items
      .map(
        (it, i) =>
          `<tr><td style="padding:2px 0">${i + 1}. ${it.description}</td><td align="right">${it.qty}×${Number(it.rate).toLocaleString()}</td><td align="right"><b>${Number(it.amount).toLocaleString()}</b></td></tr>`,
      )
      .join("");
    const w = window.open("", "_blank", "width=400,height=600");
    w.document.write(
      `<!DOCTYPE html><html><head><title>Receipt</title><style>body{font-family:'Courier New',monospace;font-size:11px;width:72mm;margin:0 auto;padding:4px}h3{text-align:center;font-size:14px;margin:4px 0}.c{text-align:center;font-size:10px}hr{border:none;border-top:1px dashed #000;margin:4px 0}table{width:100%;font-size:10px;border-collapse:collapse}.t{display:flex;justify-content:space-between;font-size:11px;padding:1px 0}.t.b{font-weight:bold;border-top:1px dashed #000;padding-top:3px;margin-top:2px}.t.red{color:red}.t.g{color:green}@media print{@page{size:80mm auto;margin:3mm}}</style></head><body><h3>${shopName}</h3><div class="c">DEBIT SALE RECEIPT</div><hr><div class="c"><b>${sale.invoiceNo}</b> | ${sale.invoiceDate}</div>${sale.customerName && sale.customerName !== "COUNTER SALE" ? `<div class="c"><b>${sale.customerName}</b></div>` : ""}<hr><table><tbody>${trs}</tbody></table><hr><div class="t"><span>Sub Total</span><span>${Number(sale.subTotal).toLocaleString()}</span></div>${sale.discAmount > 0 ? `<div class="t"><span>Disc</span><span>-${Number(sale.discAmount).toLocaleString()}</span></div>` : ""}<div class="t b"><span>NET TOTAL</span><span>${Number(sale.netTotal).toLocaleString()}</span></div><div class="t g"><span>Cash Paid</span><span>${Number(sale.paidAmount || 0).toLocaleString()}</span></div>${(sale.balance || 0) > 0 ? `<div class="t red"><span>Balance</span><span>${Number(sale.balance).toLocaleString()}</span></div>` : ""}<div style="text-align:center;margin-top:8px;font-size:10px">Thank you!</div></body></html>`,
    );
    w.document.close();
    setTimeout(() => w.print(), 400);
  };
  const shareWA = () => {
    const lines = sale.items
      .map(
        (it, i) =>
          `${i + 1}. ${it.description} | ${it.qty}×${Number(it.rate).toLocaleString()} = *${Number(it.amount).toLocaleString()}*`,
      )
      .join("\n");
    const text = `*${shopName}*\nInvoice #${sale.invoiceNo} | ${sale.invoiceDate}\n${sale.customerName !== "COUNTER SALE" ? "Customer: " + sale.customerName : ""}\n${"─".repeat(26)}\n${lines}\n${"─".repeat(26)}\nNet Total: *${Number(sale.netTotal).toLocaleString()}*\nCash: ${Number(sale.paidAmount || 0).toLocaleString()}${(sale.balance || 0) > 0 ? "\nBalance: *" + Number(sale.balance).toLocaleString() + "*" : ""}\n_Thank you!_`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div
      className="cs-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="ds-inv-modal">
        <div className="ds-inv-title">
          <i
            className="bi bi-receipt"
            style={{ color: "#80cbc4", marginRight: 6 }}
          ></i>
          Invoice #{sale.invoiceNo} — {sale.customerName || "Counter Sale"}
          <button className="csm-close" onClick={onClose}>
            <i className="bi bi-x-lg"></i>
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
            <i
              className="bi bi-printer-fill"
              style={{ color: "#4fc3f7", marginRight: 4 }}
            ></i>
            Thermal
          </button>
          <button className="ds-btn" onClick={printA4}>
            <i
              className="bi bi-file-earmark-pdf-fill"
              style={{ color: "#ef5350", marginRight: 4 }}
            ></i>
            A4 / PDF
          </button>
          <button className="ds-btn ds-btn-wa" onClick={shareWA}>
            <i
              className="bi bi-whatsapp"
              style={{ color: "#fff", marginRight: 4 }}
            ></i>
            WhatsApp
          </button>
          <button className="ds-btn" onClick={onClose}>
            <i className="bi bi-x-circle" style={{ marginRight: 4 }}></i>Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════ CUSTOMER DETAIL MODAL (right panel click) ═══════════════════════════
function CustomerDetailModal({ customer, onClose, onPaymentDone }) {
  const [sales, setSales] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loadingS, setLoadingS] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payRemarks, setPayRemarks] = useState("");
  const [payMode, setPayMode] = useState("Cash");
  const [paying, setPaying] = useState(false);
  const [payMsg, setPayMsg] = useState({ text: "", type: "" });
  const [activeTab, setActiveTab] = useState("history");
  const [expanded, setExpanded] = useState(null);
  const payRef = useRef(null);

  useEffect(() => {
    loadData();
  }, [customer._id]);

  const loadData = async () => {
    setLoadingS(true);
    try {
      const [sRes, pRes] = await Promise.all([
        api.get(EP.CUSTOMERS.SALE_HISTORY(customer._id)),
        api.get(EP.PAYMENTS.BY_CUSTOMER(customer._id)),
      ]);
      if (sRes.data.success) setSales(sRes.data.data || []);
      if (pRes.data.success) setPayments(pRes.data.data?.payments || []);
    } catch {}
    setLoadingS(false);
  };

  const showPayMsg = (t, type = "success") => {
    setPayMsg({ text: t, type });
    setTimeout(() => setPayMsg({ text: "", type: "" }), 3000);
  };

  const handlePay = async () => {
    const amt = Number(payAmount);
    if (!amt || amt <= 0) {
      showPayMsg("Valid amount enter karo", "error");
      return;
    }
    setPaying(true);
    try {
      const { data } = await api.post(EP.PAYMENTS.CREATE, {
        customerId: customer._id,
        amount: amt,
        paymentMode: payMode,
        remarks: payRemarks,
        paymentDate: new Date().toISOString().split("T")[0],
      });
      if (data.success) {
        showPayMsg(`PKR ${fmt(amt)} payment recorded!`);
        setPayAmount("");
        setPayRemarks("");
        loadData();
        if (onPaymentDone) onPaymentDone();
      } else showPayMsg(data.message || "Failed", "error");
    } catch (e) {
      showPayMsg(e.response?.data?.message || "Failed", "error");
    }
    setPaying(false);
  };

  const sendReceipt = () => {
    const saleTxns = sales.filter((s) => s.saleType === "sale");
    const totalS = saleTxns.reduce((s, x) => s + (x.netTotal || 0), 0);
    const totalP = saleTxns.reduce((s, x) => s + (x.paidAmount || 0), 0);
    const payTotal = payments.reduce((s, p) => s + (p.amount || 0), 0);
    const sep = "━".repeat(28);
    const lines = sales
      .slice(0, 15)
      .map(
        (s, i) =>
          `${i + 1}. ${s.invoiceNo} | ${s.invoiceDate}\n    PKR ${fmt(s.netTotal)} | Paid: ${fmt(s.paidAmount)} | *Bal: ${fmt(s.balance)}*`,
      )
      .join("\n");
    const text = `*${SHOP_NAME}*\n${sep}\n*Customer: ${customer.name}*${customer.phone ? "\n" + customer.phone : ""}\nDate: ${new Date().toISOString().split("T")[0]}\n${sep}\n*TRANSACTIONS*\n${lines}\n${sep}\nTotal Sales: PKR ${fmt(totalS)}\nPaid: PKR ${fmt(totalP + payTotal)}\n*Outstanding: PKR ${fmt(customer.currentBalance || 0)}*\n${sep}\n_Thank you!_`;
    const ph = customer.phone?.replace(/\D/g, "") || "";
    window.open(
      `https://wa.me/${ph}?text=${encodeURIComponent(text)}`,
      "_blank",
    );
  };

  const totalS = sales
    .filter((s) => s.saleType === "sale")
    .reduce((s, x) => s + (x.netTotal || 0), 0);
  const totalP = sales
    .filter((s) => s.saleType === "sale")
    .reduce((s, x) => s + (x.paidAmount || 0), 0);
  const payTotal = payments.reduce((s, p) => s + (p.amount || 0), 0);
  const due = customer.currentBalance || 0;

  return (
    <div
      className="cdm-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="cdm-modal-d">
        {/* Title */}
        <div className="cdm-title-d">
          <span>
            <i
              className="bi bi-person-badge-fill"
              style={{ color: "#4fc3f7", marginRight: 6 }}
            ></i>
            {customer.name}
            {customer.code && <span className="cdm-code">{customer.code}</span>}
          </span>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {customer.phone && (
              <button className="ds-btn ds-btn-wa" onClick={sendReceipt}>
                <i className="bi bi-whatsapp" style={{ marginRight: 4 }}></i>
                Send Receipt
              </button>
            )}
            <button className="cdm-close-btn" onClick={onClose}>
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="cdm-info-d">
          <div className="cdm-info-row">
            {customer.phone && (
              <span>
                <i
                  className="bi bi-telephone-fill"
                  style={{ color: "#4fc3f7", marginRight: 4 }}
                ></i>
                {customer.phone}
              </span>
            )}
            {customer.area && (
              <span>
                <i
                  className="bi bi-geo-alt-fill"
                  style={{ color: "#ffa726", marginRight: 4 }}
                ></i>
                {customer.area}
              </span>
            )}
          </div>
          <div className="cdm-cards-d">
            <div className="cdm-card-d">
              <div className="cdm-cl">Total Sales</div>
              <div className="cdm-cv">{fmt(totalS)}</div>
            </div>
            <div className="cdm-card-d">
              <div className="cdm-cl">Paid at Sale</div>
              <div className="cdm-cv green">{fmt(totalP)}</div>
            </div>
            <div className="cdm-card-d">
              <div className="cdm-cl">Extra Payments</div>
              <div className="cdm-cv green">{fmt(payTotal)}</div>
            </div>
            <div className={`cdm-card-d ${due > 0 ? "danger" : "ok"}`}>
              <div className="cdm-cl">Outstanding</div>
              <div className="cdm-cv bold">{fmt(due)}</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="cdm-tabs-d">
          <button
            className={`cdm-tab-d ${activeTab === "history" ? "active" : ""}`}
            onClick={() => setActiveTab("history")}
          >
            <i
              className="bi bi-clock-history"
              style={{ color: "#4fc3f7", marginRight: 4 }}
            ></i>
            Transactions ({sales.length})
          </button>
          <button
            className={`cdm-tab-d ${activeTab === "payments" ? "active" : ""}`}
            onClick={() => setActiveTab("payments")}
          >
            <i
              className="bi bi-cash-coin"
              style={{ color: "#66bb6a", marginRight: 4 }}
            ></i>
            Payments ({payments.length})
          </button>
          <button
            className={`cdm-tab-d ${activeTab === "pay" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("pay");
              setTimeout(() => payRef.current?.focus(), 60);
            }}
          >
            <i
              className="bi bi-plus-circle-fill"
              style={{ color: "#ffa726", marginRight: 4 }}
            ></i>
            Record Payment
          </button>
        </div>

        <div className="cdm-body-d">
          {/* History */}
          {activeTab === "history" && (
            <div className="cdm-tab-content">
              {loadingS && <div className="cdm-loading">Loading…</div>}
              {!loadingS && sales.length === 0 && (
                <div className="cdm-empty">Koi transaction nahi</div>
              )}
              {!loadingS && sales.length > 0 && (
                <table className="cdm-table-d">
                  <thead>
                    <tr>
                      <th style={{ width: 28 }}>#</th>
                      <th style={{ width: 100 }}>Invoice</th>
                      <th style={{ width: 88 }}>Date</th>
                      <th className="r" style={{ width: 88 }}>
                        Total
                      </th>
                      <th className="r" style={{ width: 78 }}>
                        Paid
                      </th>
                      <th className="r" style={{ width: 78 }}>
                        Balance
                      </th>
                      <th style={{ width: 55 }}>Mode</th>
                      <th style={{ width: 30 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.map((s, i) => (
                      <>
                        <tr
                          key={s._id}
                          className={`${i % 2 === 0 ? "even" : "odd"} ${expanded === s._id ? "sel" : ""}`}
                          onClick={() =>
                            setExpanded(expanded === s._id ? null : s._id)
                          }
                          style={{ cursor: "pointer" }}
                        >
                          <td className="c">{i + 1}</td>
                          <td className="bold blue">{s.invoiceNo}</td>
                          <td>{s.invoiceDate}</td>
                          <td className="r bold">{fmt(s.netTotal)}</td>
                          <td className="r">{fmt(s.paidAmount)}</td>
                          <td
                            className={`r ${s.balance > 0 ? "red bold" : ""}`}
                          >
                            {fmt(s.balance)}
                          </td>
                          <td>{s.paymentMode}</td>
                          <td
                            className="c"
                            style={{ color: "#90a4ae", fontSize: 10 }}
                          >
                            <i
                              className={`bi bi-chevron-${expanded === s._id ? "up" : "down"}`}
                            ></i>
                          </td>
                        </tr>
                        {expanded === s._id && (
                          <tr key={s._id + "-x"}>
                            <td colSpan={8} style={{ padding: 0 }}>
                              <div className="cdm-expand">
                                <table className="cdm-exp-table">
                                  <thead>
                                    <tr>
                                      <th>#</th>
                                      <th>Description</th>
                                      <th>Meas</th>
                                      <th className="r">Qty</th>
                                      <th className="r">Rate</th>
                                      <th className="r">Disc%</th>
                                      <th className="r">Amount</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {(s.items || []).length === 0 && (
                                      <tr>
                                        <td colSpan={7} className="cdm-empty">
                                          Items not available
                                        </td>
                                      </tr>
                                    )}
                                    {(s.items || []).map((it, j) => (
                                      <tr key={j}>
                                        <td className="c">{j + 1}</td>
                                        <td>{it.description}</td>
                                        <td>{it.measurement}</td>
                                        <td className="r">{it.qty}</td>
                                        <td className="r">{fmt(it.rate)}</td>
                                        <td className="r">{it.disc || 0}%</td>
                                        <td className="r bold">
                                          {fmt(it.amount)}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                                <div className="cdm-exp-tots">
                                  <span>
                                    Net: <b>PKR {fmt(s.netTotal)}</b>
                                  </span>
                                  <span className="green">
                                    Paid: <b>PKR {fmt(s.paidAmount)}</b>
                                  </span>
                                  {s.balance > 0 && (
                                    <span className="red">
                                      Bal: <b>PKR {fmt(s.balance)}</b>
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Payments */}
          {activeTab === "payments" && (
            <div className="cdm-tab-content">
              {payments.length === 0 && (
                <div className="cdm-empty">Koi extra payment nahi mili</div>
              )}
              {payments.length > 0 && (
                <table className="cdm-table-d">
                  <thead>
                    <tr>
                      <th style={{ width: 32 }}>#</th>
                      <th style={{ width: 100 }}>Date</th>
                      <th className="r" style={{ width: 100 }}>
                        Amount
                      </th>
                      <th style={{ width: 70 }}>Mode</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p, i) => (
                      <tr
                        key={p._id || i}
                        className={i % 2 === 0 ? "even" : "odd"}
                      >
                        <td className="c">{i + 1}</td>
                        <td>{p.paymentDate || p.createdAt?.split("T")[0]}</td>
                        <td className="r green bold">PKR {fmt(p.amount)}</td>
                        <td>{p.paymentMode || "Cash"}</td>
                        <td>{p.remarks || "—"}</td>
                      </tr>
                    ))}
                    <tr style={{ background: "var(--bg-header)" }}>
                      <td colSpan={2} className="bold">
                        Total
                      </td>
                      <td className="r green bold">PKR {fmt(payTotal)}</td>
                      <td colSpan={2}></td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Pay */}
          {activeTab === "pay" && (
            <div className="cdm-pay-content">
              <div className="cdm-pay-due">
                Outstanding:{" "}
                <span className={`bold ${due > 0 ? "red" : "green"}`}>
                  PKR {fmt(due)}
                </span>
              </div>
              {payMsg.text && (
                <div className={`cdm-pay-msg ${payMsg.type}`}>
                  {payMsg.text}
                </div>
              )}
              <div className="cdm-pay-form-d">
                <div className="cdm-pay-field-d">
                  <label>
                    <i
                      className="bi bi-currency-rupee"
                      style={{ color: "#66bb6a", marginRight: 3 }}
                    ></i>
                    Amount (PKR)
                  </label>
                  <input
                    ref={payRef}
                    type="number"
                    className="cdm-pay-inp"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handlePay();
                    }}
                    placeholder="Amount…"
                  />
                </div>
                <div className="cdm-pay-field-d">
                  <label>
                    <i
                      className="bi bi-credit-card"
                      style={{ color: "#4fc3f7", marginRight: 3 }}
                    ></i>
                    Mode
                  </label>
                  <select
                    className="cdm-pay-inp"
                    value={payMode}
                    onChange={(e) => setPayMode(e.target.value)}
                  >
                    <option>Cash</option>
                    <option>Bank</option>
                    <option>Cheque</option>
                    <option>Online</option>
                  </select>
                </div>
                <div className="cdm-pay-field-d">
                  <label>
                    <i
                      className="bi bi-chat-square-text"
                      style={{ color: "#bdbdbd", marginRight: 3 }}
                    ></i>
                    Remarks
                  </label>
                  <input
                    type="text"
                    className="cdm-pay-inp"
                    value={payRemarks}
                    onChange={(e) => setPayRemarks(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handlePay();
                    }}
                    placeholder="e.g. Cash received…"
                  />
                </div>
                <button
                  className="ds-btn ds-btn-primary cdm-pay-submit"
                  onClick={handlePay}
                  disabled={paying}
                >
                  {paying ? (
                    "Processing…"
                  ) : (
                    <>
                      <i
                        className="bi bi-check-circle-fill"
                        style={{ marginRight: 4 }}
                      ></i>
                      Record Payment
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="cdm-footer-d">
          <button className="ds-btn" onClick={onClose}>
            <i className="bi bi-x-circle" style={{ marginRight: 4 }}></i>Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════ MAIN PAGE ═══════════════════════════════════════════════════════════
export default function DebitSalePage() {
  const navigate = useNavigate();
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
  const [showInvoice, setShowInvoice] = useState(false);
  const [savedSale, setSavedSale] = useState(null);

  const [showCustDetail, setShowCustDetail] = useState(false);

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

  // ── Phone search: exact match → auto-select, multiple → modal, none → create ──
  const handlePhoneSearch = async () => {
    if (!phone.trim() || phone.length < 3) return;
    setPhoneLoading(true);
    try {
      const { data } = await api.get(EP.CUSTOMERS.GET_WALKIN(phone.trim()));
      if (data.success && data.data.length > 0) {
        const list = (data.data || []).filter((c) => c.type === "walkin");
        if (list.length === 0) {
          await createWalkinCustomer();
          return;
        }

        // EXACT phone match only - auto-select, no modal
        const exact = list.find((c) => c.phone?.trim() === phone.trim());
        if (exact) {
          selectCustomer(exact);
          showMsg(`${exact.name} selected`);
        }
        // No exact match (partial results) - hamesha modal show karo
        else {
          setCustMatches(list);
          setShowCustSel(true);
        }
      } else {
        await createWalkinCustomer();
      }
    } catch {
      showMsg("Search failed", "error");
    }
    setPhoneLoading(false);
  };

  const createWalkinCustomer = async () => {
    try {
      const { data } = await api.post(EP.CUSTOMERS.CREATE, {
        name: `Customer (${phone})`,
        phone: phone.trim(),
        type: "walkin",
      });
      if (data.success) {
        selectCustomer(data.data);
        showMsg(`New debit customer created`);
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
      const next = [...prev];
      const r = { ...next[i], [field]: val };
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
    setSearchText("");
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
        saleSource: "debit",
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
      {showCustDetail && customer && (
        <CustomerDetailModal
          customer={customer}
          onClose={() => setShowCustDetail(false)}
          onPaymentDone={() => {
            loadCustHistory(customer._id);
            // refresh customer balance
            api
              .get(EP.CUSTOMERS.GET_WALKIN(customer.phone))
              .then(({ data }) => {
                if (data.success) {
                  const c = data.data.find((x) => x._id === customer._id);
                  if (c) setCustomer(c);
                }
              })
              .catch(() => {});
          }}
        />
      )}
      {showSearch && (
        <SearchModal
          allProducts={products}
          onSelect={handleProductSelect}
          onClose={() => setShowSearch(false)}
        />
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
        <div className="ds-header-title">
          <i
            className="bi bi-cash-coin"
            style={{ color: "#ffd54f", fontSize: 18, marginRight: 6 }}
          ></i>
          Debit Sale
        </div>
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
          onClick={() => navigate("/debit-customers")}
          tabIndex={-1}
        >
          <i
            className="bi bi-people-fill"
            style={{ color: "#ffd54f", marginRight: 5 }}
          ></i>
          Manage Debit Customers
        </button>
      </div>

      <div className="ds-layout">
        {/* ═══ LEFT ══════════════════════════════════════════════ */}
        <div className="ds-left">
          {/* Customer bar */}
          <div className="ds-cust-bar">
            <span className="ds-cust-label">
              <i
                className="bi bi-telephone-fill"
                style={{ color: "#4fc3f7", marginRight: 4 }}
              ></i>
              Phone
            </span>
            <input
              ref={phoneRef}
              className="ds-cust-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handlePhoneSearch();
              }}
              placeholder="Phone → Enter for exact match / search"
              tabIndex={1}
            />
            <button
              className="ds-btn"
              onClick={handlePhoneSearch}
              disabled={phoneLoading}
              tabIndex={-1}
            >
              {phoneLoading ? (
                <i
                  className="bi bi-hourglass-split"
                  style={{ color: "#ffd54f" }}
                ></i>
              ) : (
                <i className="bi bi-search" style={{ color: "#4fc3f7" }}></i>
              )}
            </button>
            {customer ? (
              <div className="ds-cust-info">
                <i
                  className="bi bi-person-check-fill"
                  style={{ color: "#66bb6a", marginRight: 4 }}
                ></i>
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
                  <i className="bi bi-x"></i>
                </button>
              </div>
            ) : (
              <span className="ds-cust-none">
                <i
                  className="bi bi-person-dash"
                  style={{ color: "#bdbdbd", marginRight: 4 }}
                ></i>
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
                <i
                  className="bi bi-pause-circle-fill"
                  style={{ color: "#ffa726", marginRight: 3 }}
                ></i>
                {h.customer?.name || "Hold"}
              </button>
            ))}
          </div>

          {/* Product search bar */}
          <div className="ds-search-bar">
            <span className="ds-search-label">
              <i
                className="bi bi-box-seam-fill"
                style={{ color: "#4db6ac", marginRight: 4 }}
              ></i>
              Select Product
            </span>
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
                <i className="bi bi-x-circle" style={{ color: "#ef5350" }}></i>
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
                          <i
                            className="bi bi-trash3-fill"
                            style={{ color: "#ef5350", fontSize: 11 }}
                          ></i>
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
              <div className="ds-pay-title">
                <i
                  className="bi bi-credit-card-2-front-fill"
                  style={{ color: "#4fc3f7", marginRight: 5 }}
                ></i>
                Payment Mode
              </div>
              <div className="ds-pay-modes">
                <button
                  className={`ds-pay-btn ${cashAmt >= netTotal && netTotal > 0 ? "active-cash" : ""}`}
                  onClick={setPayFull}
                >
                  <i
                    className="bi bi-cash-stack"
                    style={{
                      color:
                        cashAmt >= netTotal && netTotal > 0
                          ? "#fff"
                          : "#66bb6a",
                      marginRight: 4,
                    }}
                  ></i>
                  Full Cash
                </button>
                <button
                  className={`ds-pay-btn ${cashAmt === 0 && netTotal > 0 ? "active-credit" : ""}`}
                  onClick={setPayCredit}
                >
                  <i
                    className="bi bi-journal-text"
                    style={{
                      color: cashAmt === 0 && netTotal > 0 ? "#fff" : "#ef5350",
                      marginRight: 4,
                    }}
                  ></i>
                  Full Credit
                </button>
                <button
                  className={`ds-pay-btn ${cashAmt > 0 && cashAmt < netTotal ? "active-partial" : ""}`}
                  onClick={setPayPartial}
                >
                  <i
                    className="bi bi-pie-chart-fill"
                    style={{
                      color:
                        cashAmt > 0 && cashAmt < netTotal ? "#fff" : "#ffa726",
                      marginRight: 4,
                    }}
                  ></i>
                  Partial
                </button>
              </div>
              <div className="ds-pay-row">
                <label>
                  <i
                    className="bi bi-currency-rupee"
                    style={{ color: "#66bb6a", marginRight: 3 }}
                  ></i>
                  Cash Received
                </label>
                <input
                  ref={cashRef}
                  type="number"
                  className="ds-pay-input"
                  value={cashPaid}
                  min={0}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setCashPaid(e.target.value);
                    setPayMode(v >= netTotal ? "Cash" : "Credit");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveRef.current?.focus();
                  }}
                  tabIndex={90}
                />
              </div>
              <div className="ds-pay-row">
                <label>
                  <i
                    className="bi bi-percent"
                    style={{ color: "#ffa726", marginRight: 3 }}
                  ></i>
                  Extra Disc%
                </label>
                <input
                  type="number"
                  className="ds-pay-input"
                  value={extraDisc}
                  onChange={(e) => setExtraDisc(e.target.value)}
                  tabIndex={89}
                />
              </div>
              <div className="ds-pay-row">
                <label>
                  <i
                    className="bi bi-chat-square-text"
                    style={{ color: "#bdbdbd", marginRight: 3 }}
                  ></i>
                  Remarks
                </label>
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
                  <i
                    className="bi bi-floppy-fill"
                    style={{ color: "#fff", marginRight: 4 }}
                  ></i>
                  {saving ? "Saving…" : "F5 Save"}
                </button>
                <button className="ds-btn" onClick={holdBill} tabIndex={-1}>
                  <i
                    className="bi bi-pause-circle-fill"
                    style={{ color: "#ffa726", marginRight: 4 }}
                  ></i>
                  F8 Hold
                </button>
                <button
                  className="ds-btn"
                  onClick={() => {
                    if (savedSale) setShowInvoice(true);
                    else showMsg("Save first", "error");
                  }}
                  tabIndex={-1}
                >
                  <i
                    className="bi bi-printer-fill"
                    style={{ color: "#4fc3f7", marginRight: 4 }}
                  ></i>
                  Print
                </button>
                <button className="ds-btn" onClick={resetForm} tabIndex={-1}>
                  <i
                    className="bi bi-arrow-counterclockwise"
                    style={{ color: "#bdbdbd", marginRight: 4 }}
                  ></i>
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
              <i
                className="bi bi-person-circle"
                style={{
                  fontSize: 36,
                  color: "#bdbdbd",
                  marginBottom: 8,
                  display: "block",
                }}
              ></i>
              <div>
                Enter phone number
                <br />
                to load debit customer
              </div>
            </div>
          ) : (
            <>
              <div className="ds-rp-header">
                <div className="ds-rp-name">{customer.name}</div>
                <div className="ds-rp-phone">
                  <i
                    className="bi bi-telephone-fill"
                    style={{ color: "#4fc3f7", marginRight: 4 }}
                  ></i>
                  {customer.phone}
                </div>
              </div>
              <div className="ds-rp-cards">
                <div className="ds-rp-card">
                  <div className="ds-rp-cl">
                    <i
                      className="bi bi-bag-fill"
                      style={{ color: "#4db6ac", marginRight: 3 }}
                    ></i>
                    Total Sales
                  </div>
                  <div className="ds-rp-cv">{fmt(histTotal)}</div>
                </div>
                <div className="ds-rp-card">
                  <div className="ds-rp-cl">
                    <i
                      className="bi bi-cash"
                      style={{ color: "#66bb6a", marginRight: 3 }}
                    ></i>
                    Total Paid
                  </div>
                  <div className="ds-rp-cv green">{fmt(histPaid)}</div>
                </div>
                <div
                  className={`ds-rp-card ${currentDue > 0 ? "danger" : "ok"}`}
                >
                  <div className="ds-rp-cl">
                    <i
                      className="bi bi-exclamation-triangle-fill"
                      style={{
                        color: currentDue > 0 ? "#ef5350" : "#66bb6a",
                        marginRight: 3,
                      }}
                    ></i>
                    Current Due
                  </div>
                  <div className="ds-rp-cv bold red">{fmt(currentDue)}</div>
                </div>
                {creditAmt > 0 && (
                  <div className="ds-rp-card danger">
                    <div className="ds-rp-cl">
                      <i
                        className="bi bi-arrow-up-circle-fill"
                        style={{ color: "#ef5350", marginRight: 3 }}
                      ></i>
                      After This Bill
                    </div>
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
                    <i
                      className="bi bi-whatsapp"
                      style={{ marginRight: 4 }}
                    ></i>
                    WA Reminder
                  </button>
                )}
                <button
                  className="ds-rp-btn detail"
                  onClick={() => setShowCustDetail(true)}
                >
                  <i
                    className="bi bi-person-lines-fill"
                    style={{ color: "#4fc3f7", marginRight: 4 }}
                  ></i>
                  Detail & Pay
                </button>
              </div>
              <div className="ds-rp-hist-label">
                <i
                  className="bi bi-clock-history"
                  style={{ color: "#90a4ae", marginRight: 4 }}
                ></i>
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
                    onClick={() => setShowCustDetail(true)}
                    style={{ cursor: "pointer" }}
                    title="Click for detail & payment"
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
