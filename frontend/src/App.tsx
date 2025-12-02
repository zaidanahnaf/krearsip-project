import { Routes, Route } from "react-router-dom";
import { CreatorLoginPage } from "./pages/LoginPage";
import Forbidden403 from "./pages/Forbidden";
import { LandingPage } from "../public/LandingPage";
import { PublicWorkDetailPage } from "./pages/PublicWorkDetailPage";
// import { CreatorDashboardPage } from "./pages/DashboardPage";
// import { VerifierDashboardPage } from "./pages/VerifierDashboardPage";
import { Dashboard } from "./pages/Dashboard";
import { AdminDashboard } from "./pages/private/AdminDashboard";
// import { Queue } from "./pages/private/Queue";
import { RequireAuth, GuestRoute } from "./components/Routes";

// sementara detail & dashboard kita placeholder dulu
// function PublicWorkDetailPage() {
//   return <div>Detail publik karya (GET /public/works/:id) — coming soon</div>;
// }

// function CreatorDashboardPage() {
//   return <div>Dashboard pencipta (GET /works) — coming soon</div>;
// }

// function VerifierDashboardPage() {
//   return <div>Dashboard verifikator (admin) — coming soon</div>;
// }

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 px-0 py-0">
        <Routes>

          <Route path="/" element={<LandingPage />} />

          <Route path="/login" element={
            <GuestRoute>
              <CreatorLoginPage />
            </GuestRoute>
          } />

          <Route path="/forbidden" element={<Forbidden403 />} />

          <Route path="/work/:id" element={<PublicWorkDetailPage />} />

          <Route path="/dashboard" element={
            <RequireAuth allow={["pencipta"]}>
              <Dashboard />
            </RequireAuth>
          } />

          <Route path="/verifikator" element={
            <RequireAuth allow={["verifikator"]}>
              <AdminDashboard />
            </RequireAuth>
          } />

          <Route path="/admin" element={
            <RequireAuth allow={["admin"]}>
              <AdminDashboard />
            </RequireAuth>
          } />

          {/* <Route path="/admin/queue" element={
            <RequireAuth allow={["admin"]}>
              <Queue />
            </RequireAuth>
          } /> */}

        </Routes>
      </main>
    </div>
  );
}

export default App;
