// api/apiEndpoints.js
const EP = {
  // ── Products ──────────────────────────────────────────────────────────────
  PRODUCTS: {
    GET_ALL: "/products",
    GET_ONE: (id) => `/products/${id}`,
    CREATE: "/products",
    UPDATE: (id) => `/products/${id}`,
    DELETE: (id) => `/products/${id}`,
  },

  // ── Sales ─────────────────────────────────────────────────────────────────
  SALES: {
    GET_ALL: "/sales",
    SUMMARY: "/sales/summary",
    GET_ONE: (id) => `/sales/${id}`,
    GET_BY_ID: (id) => `/sales/${id}`,
    NEXT_INVOICE: "/sales/next-invoice",
    CREATE: "/sales",
    UPDATE: (id) => `/sales/${id}`,
    DELETE: (id) => `/sales/${id}`,
    RETURN_CREATE: "/sales/return",
  },
  PURCHASES: {
    GET_ALL: "/purchases",
    GET_ONE: (id) => `/purchases/${id}`,
    NEXT_INVOICE: "/purchases/next-invoice",
    CREATE: "/purchases",
    UPDATE: (id) => `/purchases/${id}`,
    DELETE: (id) => `/purchases/${id}`,
  },
  RAW_PURCHASES: {
    NEXT_INVOICE: "/raw-purchases/next-invoice",
    CREATE: "/raw-purchases",
    GET_ALL: "/raw-purchases",
    GET_ONE: (id) => `/raw-purchases/${id}`,
    UPDATE: (id) => `/raw-purchases/${id}`,
    DELETE: (id) => `/raw-purchases/${id}`,
  },
  RAW_SALES: {
    NEXT_INVOICE: "/raw-sales/next-invoice",
    CREATE: "/raw-sales",
    GET_ALL: "/raw-sales",
    GET_ONE: (id) => `/raw-sales/${id}`,
    UPDATE: (id) => `/raw-sales/${id}`,
    DELETE: (id) => `/raw-sales/${id}`,
  },
  HOLD_BILLS: {
    GET_ALL: "/hold-bills",
    CREATE: "/hold-bills",
    DELETE: (id) => `/hold-bills/${id}`,
  },

  // ── Customers ─────────────────────────────────────────────────────────────
  CUSTOMERS: {
    GET_ALL: "/customers",
    GET_ONE: (id) => `/customers/${id}`,
    CREATE: "/customers",
    UPDATE: (id) => `/customers/${id}`,
    DELETE: (id) => `/customers/${id}`,
    SALE_HISTORY: (id) => `/customers/${id}/sales`,
    GET_CREDIT: (search = "") =>
      `/customers?type=credit${search ? "&search=" + encodeURIComponent(search) : ""}`,
    GET_WALKIN: (search = "") =>
      `/customers?type=walkin${search ? "&search=" + encodeURIComponent(search) : ""}`,
    GET_WHOLESALE: (search = "") =>
      `/customers?type=wholesale${search ? "&search=" + encodeURIComponent(search) : ""}`,
  },

  PAYMENTS: {
    GET_ALL: "/payments",
    CREATE: "/payments",
    BY_CUSTOMER: (id) => `/payments/customer/${id}`,
    BY_SALE: (id) => `/payments/sale/${id}`,
    DELETE: (id) => `/payments/${id}`,
  },

  // ── Quotations ─────────────────────────────────────────────────────────────
  QUOTATIONS: {
    GET_ALL: "/quotations",
    GET_ALL_SEARCH: (search = "") =>
      `/quotations${search ? "?search=" + encodeURIComponent(search) : ""}`,
    CREATE: "/quotations",
    DELETE: (id) => `/quotations/${id}`,
  },
  DAMAGE: {
    GET_ALL: "/damage",
    GET_IN: (search = "") =>
      `/damage?type=in${search ? "&search=" + encodeURIComponent(search) : ""}`,
    GET_OUT: (search = "") =>
      `/damage?type=out${search ? "&search=" + encodeURIComponent(search) : ""}`,
    NEXT_INVOICE: (type) => `/damage/next-invoice?type=${type}`,
    GET_ONE: (id) => `/damage/${id}`,
    CREATE: "/damage",
    DELETE: (id) => `/damage/${id}`,
  },
  CPV: {
    GET_ALL: "/cpv",
    GET_ALL_SEARCH: (search = "") =>
      `/cpv${search ? "?search=" + encodeURIComponent(search) : ""}`,
    NEXT_NUMBER: "/cpv/next-number",
    GET_ONE: (id) => `/cpv/${id}`,
    CREATE: "/cpv",
    UPDATE: (id) => `/cpv/${id}`,
    DELETE: (id) => `/cpv/${id}`,
  },
};

export default EP;
