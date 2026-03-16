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
  },

  // ── Customers ─────────────────────────────────────────────────────────────
  CUSTOMERS: {
    GET_ALL: "/customers",
    GET_ONE: (id) => `/customers/${id}`,
    CREATE: "/customers",
    UPDATE: (id) => `/customers/${id}`,
    DELETE: (id) => `/customers/${id}`,
    SALE_HISTORY: (id) => `/customers/${id}/sales`,
    GET_ALL: "/customers",
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
};

export default EP;
