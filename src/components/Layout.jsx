// components/Layout.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import MENU_CONFIG from "./menuConfig.js";
import TOOLBAR_CONFIG from "./toolbarConfig.js";

// ─── MenuBar ──────────────────────────────────────────────────────────────────
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
        background: "#f0f0f0",
        borderBottom: "1px solid #aca899",
        padding: "1px 2px",
        fontSize: 12,
        fontFamily: "Tahoma, sans-serif",
        userSelect: "none",
        position: "relative",
        zIndex: 1000,
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
                background: "#f5f5f5",
                border: "1px solid #aca899",
                boxShadow: "2px 2px 4px rgba(0,0,0,0.25)",
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

// ─── ToolBar ──────────────────────────────────────────────────────────────────
function ToolBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const buttons = TOOLBAR_CONFIG[location.pathname] || TOOLBAR_CONFIG.DEFAULT;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        background: "#d4d0c8",
        borderBottom: "2px solid #919b8c",
        padding: "2px 4px",
        gap: 1,
        minHeight: 52,
        fontFamily: "Tahoma, sans-serif",
      }}
    >
      {buttons.map((btn, i) => {
        if (btn.divider)
          return (
            <div
              key={i}
              style={{
                width: 1,
                height: 40,
                background: "#919b8c",
                margin: "0 3px",
              }}
            />
          );
        const isActive = btn.route && location.pathname === btn.route;
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
              minWidth: 56,
              height: 46,
              fontSize: 10,
              fontFamily: "inherit",
              border: isActive ? "1px solid #316ac5" : "1px solid transparent",
              background: isActive
                ? "linear-gradient(to bottom,#c5d9f1,#e0ecff)"
                : "transparent",
              cursor: "pointer",
              padding: "2px 4px",
              gap: 1,
              borderRadius: 2,
              fontWeight: isActive ? "bold" : "normal",
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.background =
                  "linear-gradient(to bottom,#e0ecff,#c5d9f1)";
                e.currentTarget.style.border = "1px solid #316ac5";
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.border = "1px solid transparent";
              }
            }}
          >
            <span style={{ fontSize: 20 }}>{btn.icon}</span>
            <span style={{ whiteSpace: "nowrap" }}>{btn.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────
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
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {children}
      </div>
    </div>
  );
}
