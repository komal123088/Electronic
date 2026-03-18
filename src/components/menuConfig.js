// components/menuConfig.js
const MENU_CONFIG = [
  {
    label: "Define",
    items: [
      { label: "Products", route: "/products" },
      { label: "Customers", route: "/customers" },
      { label: "───" },
      { label: "Categories", route: "/categories" },
      { label: "Companies", route: "/companies" },
      { label: "Suppliers", route: "/suppliers" },
    ],
  },
  {
    label: "Vouchers",
    items: [
      { label: "Debit Sale", route: "/debit-sale", shortcut: "F1" },
      { label: "Credit Sale", route: "/credit-sale", shortcut: "F2" },
      { label: "Cash Sale", route: "/sale", shortcut: "F3" },
      { label: "───" },
      { label: "Manual Sale Bill", route: "/manual-sale" },
      { label: "Manual Purchase Bill", route: "/manual-purchase" },
      { label: "───" },
      { label: "Sale Return", route: "/sale-return" },
      { label: "Quotation", route: "/quotation-page", shortcut: "Ctrl+Q" },
      { label: "───" },
      { label: "Journal Voucher", route: "/journal-page", shortcut: "Ctrl+J" },
      { label: "Raw Sale", route: "/raw-sale" },
      { label: "Raw Purchase", route: "/raw-purchase" },
      { label: "Purchase", route: "/purchase" },
    ],
  },
  {
    label: "Customers",
    items: [
      { label: "Debit Customers", route: "/debit-customers" },
      { label: "Credit Customers", route: "/credit-customers" },
      { label: "All Customers", route: "/customers" },
    ],
  },
  {
    label: "Reports",
    items: [
      { label: "Sale History", route: "/sale-history" },
      { label: "Sale List", route: "/sale-list" },
      { label: "Purchase List", route: "/purchase-list" },
      { label: "───" },
      { label: "Daily Sale Report", route: "/daily-sale" },
      { label: "Stock Report", route: "/stock-report" },
      { label: "───" },
      { label: "Customer Ledger", route: "/customer-ledger" },
    ],
  },
  {
    label: "Final Accounts",
    items: [
      { label: "General Ledger", route: "/general-ledger" },
      { label: "Trial Balance", route: "/trial-balance" },
      { label: "Balance Sheet", route: "/balance-sheet" },
      { label: "Profit & Loss", route: "/profit-loss" },
      { label: "───" },
      { label: "Cash Book", route: "/cash-book" },
      { label: "Receivables", route: "/receivables" },
      { label: "Payables", route: "/payables" },
    ],
  },
  {
    label: "Tools",
    items: [
      { label: "Company Information", route: "/company-info" },
      { label: "Backup Data", route: "/backup" },
      { label: "───" },
      { label: "Print Settings", route: "/print-settings" },
      { label: "Preferences", route: "/preferences" },
    ],
  },
  {
    label: "Help",
    items: [
      { label: "About Software", route: "/about" },
      { label: "Contact Support", route: "/support" },
    ],
  },
];

export default MENU_CONFIG;
