import { HashRouter, Routes, Route, NavLink } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import CaseDetail from "./pages/CaseDetail";
import NewCase from "./pages/NewCase";
import Reports from "./pages/Reports";
import "./App.css";

export default function App() {
  return (
    <HashRouter>
      <div className="app">
        <nav className="nav">
          <div className="nav__brand">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
              <rect x="2" y="2" width="7" height="7" rx="1.5" fill="currentColor" opacity=".9"/>
              <rect x="11" y="2" width="7" height="7" rx="1.5" fill="currentColor" opacity=".6"/>
              <rect x="2" y="11" width="7" height="7" rx="1.5" fill="currentColor" opacity=".6"/>
              <rect x="11" y="11" width="7" height="7" rx="1.5" fill="currentColor" opacity=".3"/>
            </svg>
            <span>CaseManager</span>
          </div>
          <div className="nav__links">
            <NavLink to="/" end className={({ isActive }) => isActive ? "nav__link nav__link--active" : "nav__link"}>
              Dashboard
            </NavLink>
            <NavLink to="/reports" className={({ isActive }) => isActive ? "nav__link nav__link--active" : "nav__link"}>
              Reports
            </NavLink>
          </div>
        </nav>

        <main className="main">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/cases/new" element={<NewCase />} />
            <Route path="/cases/:id" element={<CaseDetail />} />
            <Route path="/reports" element={<Reports />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
}
