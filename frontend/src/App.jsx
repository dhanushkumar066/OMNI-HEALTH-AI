import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import Landing from "./pages/Landing.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import SymptomChecker from "./pages/SymptomChecker.jsx";
import ImageAnalysis from "./pages/ImageAnalysis.jsx";
import Report from "./pages/Report.jsx";
import Admin from "./pages/Admin.jsx";

export default function App() {
  return (
    <Routes>
      {/* Full-screen landing — no sidebar */}
      <Route path="/" element={<Landing />} />

      {/* App pages — wrapped in sidebar layout */}
      <Route element={<Layout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/symptoms" element={<SymptomChecker />} />
        <Route path="/imaging" element={<ImageAnalysis />} />
        <Route path="/report" element={<Report />} />
        <Route path="/admin" element={<Admin />} />
      </Route>
    </Routes>
  );
}
