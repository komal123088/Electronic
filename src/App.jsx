import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import ProductPage from "./pages/ProductPage.jsx";
import SalePage from "./pages/SalePage.jsx";
import DebitSalePage from "./pages/DebitSalePage.jsx";
import CreditSalePage from "./pages/CreditSalePage.jsx";
import CustomersPage from "./pages/CustomersPage.jsx";
import SaleHistoryPage from "./pages/SaleHistoryPage.jsx";
import SaleReturnPage from "./pages/SaleReturnPage.jsx";
import ComingSoon from "./pages/ComingSoon.jsx";
import CreditCustomersPage from "./pages/CreditCustomersPage.jsx";
import QuotationPage from "./pages/QuotationPage.jsx";
import DebitCustomersPage from "./pages/DebitCustomersPage.jsx";
import JournalVoucherPage from "./pages/JournalVoucherPage.jsx";
import ManualSalePage from "./pages/ManualSalePage.jsx";
import ManualPurchasePage from "./pages/ManualPurchasePage.jsx";
export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/debit-sale" replace />} />
          <Route path="/sale" element={<SalePage />} />
          <Route path="/debit-sale" element={<DebitSalePage />} />
          <Route path="/debit-customers" element={<DebitCustomersPage />} />
          <Route path="/credit-customers" element={<CreditCustomersPage />} />
          <Route path="/quotation-page" element={<QuotationPage />} />
          <Route path="/journal-page" element={<JournalVoucherPage />} />
          <Route path="/manual-sale" element={<ManualSalePage />} />
          <Route path="/manual-purchase" element={<ManualPurchasePage />} />
          <Route path="/credit-sale" element={<CreditSalePage />} />
          <Route path="/products" element={<ProductPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/sale-history" element={<SaleHistoryPage />} />
          <Route path="/sale-return" element={<SaleReturnPage />} />
          <Route path="*" element={<ComingSoon />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
