import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router";
import { About, Gallery, Hero, Navbar, Works, Contact, Footer } from "./components";

import './i18n';

// Recharts and supabase-js load only on the dashboard routes.
const DashboardPage = lazy(() => import("./dashboard/DashboardPage"));

function Landing() {
  return (
    <div className='content'>
      <div className='header'>
        <Navbar />
        <Hero />
      </div>
      <About />
      <Gallery />
      <Works />
      <Contact />
      <Footer />
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<DashboardPage demo={false} />} />
          <Route path="/dashboard/demo" element={<DashboardPage demo />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
