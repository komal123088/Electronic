// components/menuConfig.js
const MENU_CONFIG = [
  {
    label: "Define",
    items: [
      { label: "Products", route: "/products" },
      { label: "Customers", route: "/customers" },
      { label: "───" },
      { label: "Settings", route: "/settings" },
    ],
  },
  {
    label: "Vouchers",
    items: [
      { label: "Sale", route: "/sale" },
      { label: "Sale Return", route: "/sale-return" },
      { label: "Purchase", route: "/purchase" },
      { label: "Raw Purchase", route: "/raw-purchase" },
    ],
  },
  {
    label: "Reports",
    items: [
      { label: "Sale History", route: "/sale-history" },
      { label: "Product History", route: "/products" },
      { label: "───" },
      { label: "General Ledgers", route: "/ledgers" },
    ],
  },
  {
    label: "Final Accounts",
    items: [
      { label: "Profit & Loss", route: "/profit-loss" },
      { label: "Balance Sheet", route: "/balance-sheet" },
    ],
  },
  {
    label: "Tools",
    items: [
      { label: "Backup", route: "/backup" },
      { label: "Restore", route: "/restore" },
    ],
  },
  {
    label: "Help",
    items: [{ label: "About", route: "/about" }],
  },
];

export default MENU_CONFIG;
