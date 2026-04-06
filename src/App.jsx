import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
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
import RawSalePage from "./pages/RawSalePage.jsx";
import RawPurchasePage from "./pages/RawPurchasePage.jsx";
import PurchasePage from "./pages/PurchasePage.jsx";
import DamageInPage from "./pages/DamageInPage.jsx";
import DamageOutPage from "./pages/DamageOutPage.jsx";
import CashPaymentVoucher from "./pages/cashPamentVoucherPage.jsx";
import SuppliersPage from "./pages/SuppliersPage.jsx";

// Create a wrapper component that provides the current location as key
function AppRoutes() {
  const location = useLocation();
  
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/sale" replace />} />
      <Route path="/sale" element={<SalePage key={`sale-${location.pathname}`} />} />
      <Route path="/debit-sale" element={<DebitSalePage key={`debit-sale-${location.pathname}`} />} />
      <Route path="/debit-customers" element={<DebitCustomersPage key={`debit-customers-${location.pathname}`} />} />
      <Route path="/credit-customers" element={<CreditCustomersPage key={`credit-customers-${location.pathname}`} />} />
      <Route path="/suppliers" element={<SuppliersPage key={`suppliers-${location.pathname}`} />} />
      <Route path="/quotation-page" element={<QuotationPage key={`quotation-${location.pathname}`} />} />
      <Route path="/journal-page" element={<JournalVoucherPage key={`journal-${location.pathname}`} />} />
      <Route path="/manual-sale" element={<ManualSalePage key={`manual-sale-${location.pathname}`} />} />
      <Route path="/manual-purchase" element={<ManualPurchasePage key={`manual-purchase-${location.pathname}`} />} />
      <Route path="/raw-sale" element={<RawSalePage key={`raw-sale-${location.pathname}`} />} />
      <Route path="/raw-purchase" element={<RawPurchasePage key={`raw-purchase-${location.pathname}`} />} />
      <Route path="/purchase" element={<PurchasePage key={`purchase-${location.pathname}`} />} />
      <Route path="/credit-sale" element={<CreditSalePage key={`credit-sale-${location.pathname}`} />} />
      <Route path="/products" element={<ProductPage key={`products-${location.pathname}`} />} />
      <Route path="/damage-in" element={<DamageInPage key={`damage-in-${location.pathname}`} />} />
      <Route path="/damage-out" element={<DamageOutPage key={`damage-out-${location.pathname}`} />} />
      <Route path="/customers" element={<CustomersPage key={`customers-${location.pathname}`} />} />
      <Route path="/sale-history" element={<SaleHistoryPage key={`sale-history-${location.pathname}`} />} />
      <Route path="/sale-return" element={<SaleReturnPage key={`sale-return-${location.pathname}`} />} />
      <Route path="/cash-payment-voucher" element={<CashPaymentVoucher key={`cash-payment-${location.pathname}`} />} />
      <Route path="*" element={<ComingSoon key={`coming-soon-${location.pathname}`} />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <AppRoutes />
      </Layout>
    </BrowserRouter>
  );
}