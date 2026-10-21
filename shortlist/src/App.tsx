import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "./lib/auth";
import Layout from "./components/Layout";
import { Spinner, Empty } from "./components/ui";
import { ForgotPassword, Login, Signup, Verify } from "./pages/Auth";
import Jobs from "./pages/Jobs";
import { CompanyPage, Companies } from "./pages/Companies";
import { Employer, EmployerCompany } from "./pages/Employer";
import Messages from "./pages/Messages";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import Notifications from "./pages/Notifications";
import type { ReactNode } from "react";

function Protected({ children, admin }: { children: ReactNode; admin?: boolean }) {
  const { user, loading, isAdmin } = useAuth();
  const loc = useLocation();
  if (loading) return <div className="pt-32"><Spinner /></div>;
  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname + loc.search }} />;
  if (admin && !isAdmin) return <Empty title="Admins only">This page is only available to admin accounts.</Empty>;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/verify" element={<Verify />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route element={<Protected><Layout /></Protected>}>
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/companies" element={<Companies />} />
        <Route path="/companies/:id" element={<CompanyPage />} />
        <Route path="/employer" element={<Employer />} />
        <Route path="/employer/:id" element={<EmployerCompany />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin" element={<Protected admin><Admin /></Protected>} />
        <Route path="*" element={<Empty title="Page not found">Check the address, or go back to the job list.</Empty>} />
      </Route>
      <Route path="/" element={<Navigate to="/jobs" replace />} />
    </Routes>
  );
}
