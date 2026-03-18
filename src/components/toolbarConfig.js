const ALL_BUTTONS = [
  { icon: "purchase", label: "Purchase", route: "/purchase" },
  { icon: "sale", label: "Sale", route: "/sale" },
  { icon: "debitSale", label: "Debit Sale", route: "/debit-sale" },
  { icon: "creditSale", label: "Credit Sale", route: "/credit-sale" },
  { icon: "saleReturn", label: "Sale Return", route: "/sale-return" },
  { icon: "rawPurchase", label: "Raw Purchase", route: "/raw-purchase" },
  { icon: "ledgers", label: "Gen. Ledgers", route: "/ledgers" },
  { icon: "products", label: "Prod. History", route: "/products" },
  { divider: true },
  { icon: "exit", label: "Exit", action: "exit" },
];

const TOOLBAR_CONFIG = {
  "/sale": ALL_BUTTONS,
  "/sale-return": ALL_BUTTONS,
  "/products": ALL_BUTTONS,
  "/customers": ALL_BUTTONS,
  "/sale-history": ALL_BUTTONS,
  "/purchase": ALL_BUTTONS,
  "/debit-sale": ALL_BUTTONS,
  "/credit-sale": ALL_BUTTONS,
  "/raw-purchase": ALL_BUTTONS,
  "/ledgers": ALL_BUTTONS,
  "/quotation": ALL_BUTTONS,
  DEFAULT: ALL_BUTTONS,
};

export default TOOLBAR_CONFIG;
