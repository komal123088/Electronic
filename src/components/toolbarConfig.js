// components/toolbarConfig.js
// Each page defines its own toolbar buttons
// icon: emoji, label: text shown below icon, route: navigate to, action: for callbacks

const TOOLBAR_CONFIG = {
  "/sale": [
    { icon: "🛒", label: "Purchase", route: "/purchase" },
    { icon: "➕", label: "Sale", route: "/sale" },
    { icon: "↩️", label: "Sale Return", route: "/sale-return" },
    { icon: "📦", label: "Raw Purchase", route: "/raw-purchase" },
    { icon: "📒", label: "General Ledgers", route: "/ledgers" },
    { icon: "📋", label: "Product History", route: "/products" },
    { divider: true },
    { icon: "❌", label: "Exit", action: "exit" },
  ],
  "/sale-return": [
    { icon: "🛒", label: "Purchase", route: "/purchase" },
    { icon: "➕", label: "Sale", route: "/sale" },
    { icon: "↩️", label: "Sale Return", route: "/sale-return" },
    { icon: "📦", label: "Raw Purchase", route: "/raw-purchase" },
    { icon: "📒", label: "General Ledgers", route: "/ledgers" },
    { icon: "📋", label: "Product History", route: "/products" },
    { divider: true },
    { icon: "❌", label: "Exit", action: "exit" },
  ],
  "/products": [
    { icon: "🛒", label: "Purchase", route: "/purchase" },
    { icon: "➕", label: "Sale", route: "/sale" },
    { icon: "↩️", label: "Sale Return", route: "/sale-return" },
    { icon: "📦", label: "Raw Purchase", route: "/raw-purchase" },
    { icon: "📒", label: "General Ledgers", route: "/ledgers" },
    { icon: "📋", label: "Product History", route: "/products" },
    { divider: true },
    { icon: "❌", label: "Exit", action: "exit" },
  ],
  "/customers": [
    { icon: "🛒", label: "Purchase", route: "/purchase" },
    { icon: "➕", label: "Sale", route: "/sale" },
    { icon: "↩️", label: "Sale Return", route: "/sale-return" },
    { icon: "📦", label: "Raw Purchase", route: "/raw-purchase" },
    { icon: "📒", label: "General Ledgers", route: "/ledgers" },
    { icon: "📋", label: "Product History", route: "/products" },
    { divider: true },
    { icon: "❌", label: "Exit", action: "exit" },
  ],
  "/sale-history": [
    { icon: "🛒", label: "Purchase", route: "/purchase" },
    { icon: "➕", label: "Sale", route: "/sale" },
    { icon: "↩️", label: "Sale Return", route: "/sale-return" },
    { icon: "📦", label: "Raw Purchase", route: "/raw-purchase" },
    { icon: "📒", label: "General Ledgers", route: "/ledgers" },
    { icon: "📋", label: "Product History", route: "/products" },
    { divider: true },
    { icon: "❌", label: "Exit", action: "exit" },
  ],
  DEFAULT: [
    { icon: "🛒", label: "Purchase", route: "/purchase" },
    { icon: "💵", label: "Debit Sale", route: "/debit-sale" },
    { icon: "💳", label: "Credit Sale", route: "/credit-sale" },
    { icon: "↩️", label: "Sale Return", route: "/sale-return" },
    { icon: "📦", label: "Raw Purchase", route: "/raw-purchase" },
    { icon: "📒", label: "Gen. Ledgers", route: "/ledgers" },
    { icon: "📋", label: "Prod. History", route: "/products" },
    { divider: true },
    { icon: "❌", label: "Exit", action: "exit" },
  ],
};

export default TOOLBAR_CONFIG;
