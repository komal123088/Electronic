// components/Layout.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import MENU_CONFIG from "./menuConfig.js";
import TOOLBAR_CONFIG from "./toolbarConfig.js";

/* ── Toolbar SVG Icons ─────────────────────────────────────────────────────── */
const ICONS = {
  purchase: (
    <svg width="22" height="22" viewBox="0 0 16 16" fill="currentColor">
      <path d="M0 1.5A.5.5 0 0 1 .5 1H2a.5.5 0 0 1 .485.379L2.89 3H14.5a.5.5 0 0 1 .491.592l-1.5 8A.5.5 0 0 1 13 12H4a.5.5 0 0 1-.491-.408L2.01 3.607 1.61 2H.5a.5.5 0 0 1-.5-.5M3.102 4l1.313 7h8.17l1.313-7zM5 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4m7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4m-7 1a1 1 0 1 1 0 2 1 1 0 0 1 0-2m7 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2" />
    </svg>
  ),
  sale: (
    <svg width="22" height="22" viewBox="0 0 16 16" fill="currentColor">
      <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v1h14V4a1 1 0 0 0-1-1zm13 4H1v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1zM2 10h2a1 1 0 0 1 0 2H2a1 1 0 0 1 0-2m4 0h6a1 1 0 0 1 0 2H6a1 1 0 0 1 0-2" />
    </svg>
  ),
  debitSale: (
    <svg width="22" height="22" viewBox="0 0 16 16" fill="currentColor">
      <path d="M4 10.781c.148 1.667 1.513 2.85 3.591 3.003V15h1.043v-1.216c2.27-.179 3.678-1.438 3.678-3.3 0-1.59-.947-2.51-2.956-3.028l-.722-.187V3.467c1.062.11 1.756.732 1.884 1.766h1.683c-.16-1.744-1.52-2.93-3.567-3.053V1h-1.043v1.177c-1.978.18-3.257 1.346-3.257 2.988 0 1.48.953 2.463 2.857 2.994l.856.232v3.62c-1.146-.151-1.908-.79-2.046-1.73zm1.683-7.28c0-.838.563-1.4 1.617-1.584V5.62c-.95-.258-1.617-.8-1.617-2.117zm3.329 6.283c0 .923-.66 1.512-1.732 1.655V11.03c1.073.257 1.732.81 1.732 1.734z" />
    </svg>
  ),
  creditSale: (
    <svg width="22" height="22" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4m0 1a3 3 0 1 1 0-6 3 3 0 0 1 0 6" />
      <path d="M0 4a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H1a1 1 0 0 1-1-1zm3 0a2 2 0 0 1-2 2v4a2 2 0 0 1 2 2h10a2 2 0 0 1 2-2V6a2 2 0 0 1-2-2z" />
    </svg>
  ),
  saleReturn: (
    <svg width="22" height="22" viewBox="0 0 16 16" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M1.146 4.854a.5.5 0 0 1 0-.708l4-4a.5.5 0 1 1 .708.708L2.707 4H12.5A2.5 2.5 0 0 1 15 6.5v8a.5.5 0 0 1-1 0v-8A1.5 1.5 0 0 0 12.5 5H2.707l3.147 3.146a.5.5 0 1 1-.708.708z"
      />
    </svg>
  ),
  rawPurchase: (
    <svg width="22" height="22" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8.186 1.113a.5.5 0 0 0-.372 0L1.846 3.5 8 5.961 14.154 3.5zM15 4.239l-6.5 2.6v7.922l6.5-2.6V4.24zM7.5 14.762V6.838L1 4.239v7.923zM7.443.184a1.5 1.5 0 0 1 1.114 0l7.129 2.852A.5.5 0 0 1 16 3.5v8.662a1 1 0 0 1-.629.928l-7.185 2.874a.5.5 0 0 1-.372 0L.63 13.09a1 1 0 0 1-.63-.928V3.5a.5.5 0 0 1 .314-.464z" />
    </svg>
  ),
  ledgers: (
    <svg width="22" height="22" viewBox="0 0 16 16" fill="currentColor">
      <path d="M5 10.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5m0-2a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5m0-2a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5m0-2a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5" />
      <path d="M3 0h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-1h1v1a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v1H1V2a2 2 0 0 1 2-2" />
      <path d="M1 5v-.5a.5.5 0 0 1 1 0V5h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1zm0 3v-.5a.5.5 0 0 1 1 0V8h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1zm0 3v-.5a.5.5 0 0 1 1 0v.5h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1z" />
    </svg>
  ),
  products: (
    <svg width="22" height="22" viewBox="0 0 16 16" fill="currentColor">
      <path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h3A1.5 1.5 0 0 1 7 2.5v3A1.5 1.5 0 0 1 5.5 7h-3A1.5 1.5 0 0 1 1 5.5zm8 0A1.5 1.5 0 0 1 10.5 1h3A1.5 1.5 0 0 1 15 2.5v3A1.5 1.5 0 0 1 13.5 7h-3A1.5 1.5 0 0 1 9 5.5zm-8 8A1.5 1.5 0 0 1 2.5 9h3A1.5 1.5 0 0 1 7 10.5v3A1.5 1.5 0 0 1 5.5 15h-3A1.5 1.5 0 0 1 1 13.5zm8 0A1.5 1.5 0 0 1 10.5 9h3a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 13.5z" />
    </svg>
  ),
  exit: (
    <svg width="22" height="22" viewBox="0 0 16 16" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0z"
      />
      <path
        fillRule="evenodd"
        d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708z"
      />
    </svg>
  ),
};

const ICON_COLORS = {
  purchase: "#1a5fc8",
  sale: "#1e7e34",
  debitSale: "#b7660a",
  creditSale: "#6b21a8",
  saleReturn: "#c0392b",
  rawPurchase: "#0e7490",
  ledgers: "#1a5fc8",
  products: "#374151",
  exit: "#c0392b",
};

/* ── MenuBar ──────────────────────────────────────────────────────────────── */
function MenuBar() {
  const [openIdx, setOpenIdx] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const ref = useRef(null);

  useEffect(() => {
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpenIdx(null);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  useEffect(() => {
    setOpenIdx(null);
  }, [location.pathname]);

  return (
    <div
      ref={ref}
      style={{
        display: "flex",
        background: "linear-gradient(180deg,#f0ede4 0%,#dedad0 100%)",
        borderBottom: "1px solid #aca899",
        boxShadow: "inset 0 -1px 0 #fff",
        padding: "1px 2px",
        fontSize: 12,
        fontFamily: "Tahoma, sans-serif",
        userSelect: "none",
        position: "relative",
        zIndex: 1000,
        flexShrink: 0,
      }}
    >
      {MENU_CONFIG.map((menu, idx) => (
        <div key={menu.label} style={{ position: "relative" }}>
          <button
            onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
            onMouseEnter={() => openIdx !== null && setOpenIdx(idx)}
            style={{
              background: openIdx === idx ? "#316ac5" : "transparent",
              color: openIdx === idx ? "#fff" : "#000",
              border: "1px solid transparent",
              padding: "2px 8px",
              fontSize: 12,
              fontFamily: "inherit",
              cursor: "pointer",
              height: 22,
              borderRadius: 2,
            }}
          >
            {menu.label}
          </button>
          {openIdx === idx && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                background: "#f5f5f0",
                border: "1px solid #aca899",
                boxShadow: "2px 2px 6px rgba(0,0,0,0.3)",
                minWidth: 200,
                zIndex: 2000,
                padding: "2px 0",
              }}
            >
              {menu.items.map((item, i) => {
                if (item.label === "───")
                  return (
                    <div
                      key={i}
                      style={{
                        height: 1,
                        background: "#ccc",
                        margin: "2px 4px",
                      }}
                    />
                  );
                const isActive = item.route && location.pathname === item.route;
                return (
                  <div
                    key={i}
                    onClick={() => {
                      setOpenIdx(null);
                      if (item.route) navigate(item.route);
                    }}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "3px 20px 3px 24px",
                      cursor: "pointer",
                      fontSize: 12,
                      background: isActive ? "#316ac5" : "transparent",
                      color: isActive ? "#fff" : "#000",
                      whiteSpace: "nowrap",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = "#316ac5";
                        e.currentTarget.style.color = "#fff";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = "#000";
                      }
                    }}
                  >
                    <span>{item.label}</span>
                    {item.shortcut && (
                      <span
                        style={{ marginLeft: 30, color: "#888", fontSize: 11 }}
                      >
                        {item.shortcut}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── ToolBar ──────────────────────────────────────────────────────────────── */
function ToolBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const buttons = TOOLBAR_CONFIG[location.pathname] || TOOLBAR_CONFIG.DEFAULT;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        background: "linear-gradient(180deg,#e8e4d8 0%,#d4d0c8 100%)",
        borderBottom: "2px solid #aca899",
        boxShadow: "inset 0 1px 0 #fff, 0 2px 3px rgba(0,0,0,0.15)",
        padding: "3px 6px",
        gap: 1,
        minHeight: 56,
        fontFamily: "Tahoma, sans-serif",
        flexShrink: 0,
      }}
    >
      {buttons.map((btn, i) => {
        if (btn.divider)
          return (
            <div
              key={i}
              style={{
                width: 1,
                height: 42,
                background: "#aca899",
                boxShadow: "1px 0 0 #fff",
                margin: "0 4px",
              }}
            />
          );

        const isActive = btn.route && location.pathname === btn.route;
        const iconColor = isActive
          ? "#316ac5"
          : ICON_COLORS[btn.icon] || "#333";

        return (
          <button
            key={i}
            title={btn.label}
            onClick={() => {
              if (btn.route) navigate(btn.route);
              if (btn.action === "exit") window.close();
            }}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minWidth: 54,
              height: 48,
              fontSize: 10,
              fontFamily: "inherit",
              fontWeight: isActive ? 700 : 400,
              color: isActive ? "#0a246a" : "#222",
              border: isActive ? "1px solid #7aabda" : "1px solid transparent",
              background: isActive
                ? "linear-gradient(180deg,#c5d9f1 0%,#ddeeff 100%)"
                : "transparent",
              cursor: "pointer",
              padding: "3px 5px 2px",
              gap: 2,
              borderRadius: 3,
              boxShadow: isActive
                ? "inset 1px 1px 0 rgba(255,255,255,0.8), inset -1px -1px 0 rgba(0,0,100,0.1)"
                : "none",
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.background =
                  "linear-gradient(180deg,#ddeeff 0%,#c5d9f1 100%)";
                e.currentTarget.style.border = "1px solid #7aabda";
                e.currentTarget.style.boxShadow =
                  "inset 1px 1px 0 rgba(255,255,255,0.9)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.border = "1px solid transparent";
                e.currentTarget.style.boxShadow = "none";
              }
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.background =
                "linear-gradient(180deg,#b0ccec 0%,#c5d9f1 100%)";
              e.currentTarget.style.boxShadow =
                "inset 1px 1px 0 rgba(0,0,80,0.12), inset -1px -1px 0 rgba(255,255,255,0.6)";
            }}
            onMouseUp={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.boxShadow = "none";
              }
            }}
          >
            <span style={{ color: iconColor, lineHeight: 1, display: "flex" }}>
              {ICONS[btn.icon] || <span style={{ fontSize: 18 }}>•</span>}
            </span>
            <span
              style={{
                whiteSpace: "nowrap",
                fontSize: 10,
                letterSpacing: "0.01em",
              }}
            >
              {btn.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ── Layout ───────────────────────────────────────────────────────────────── */
export default function Layout({ children }) {
  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: "#ece9d8",
      }}
    >
      <MenuBar />
      <ToolBar />
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {children}
      </div>
    </div>
  );
}
