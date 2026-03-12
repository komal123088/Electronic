// pages/ComingSoon.jsx — Placeholder for pages not yet built
export default function ComingSoon({ pageName }) {
  return (
    <div
      style={{
        padding: 40,
        textAlign: "center",
        color: "#555",
        fontFamily: "Tahoma,sans-serif",
      }}
    >
      <div style={{ fontSize: 48, marginBottom: 12 }}>🚧</div>
      <div style={{ fontSize: 16, fontWeight: "bold", marginBottom: 6 }}>
        {pageName?.replace(/_/g, " ")}
      </div>
      <div style={{ fontSize: 12 }}>
        This page is under construction. Coming soon.
      </div>
    </div>
  );
}
