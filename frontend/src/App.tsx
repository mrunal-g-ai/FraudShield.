import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { SinglePredictPage } from './pages/SinglePredictPage';
import { BatchPredictPage } from './pages/BatchPredictPage';
import { ExplorerPage } from './pages/ExplorerPage';
import { ModelGovernancePage } from './pages/ModelGovernancePage';

export function App() {
  return (
    <BrowserRouter>
      <div className="flex flex-col lg:flex-row min-h-screen bg-fintech-bg text-fintech-text font-sans antialiased">
        {/* Navigation Sidebar (Desktop + Mobile Drawer) */}
        <Sidebar />

        {/* Main Content Viewport */}
        <div className="flex-1 min-w-0 flex flex-col">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/predict" element={<SinglePredictPage />} />
            <Route path="/analyze" element={<Navigate to="/predict" replace />} />
            <Route path="/batch" element={<BatchPredictPage />} />
            <Route path="/transactions" element={<ExplorerPage />} />
            <Route path="/governance" element={<ModelGovernancePage />} />
            
            {/* Backward-compatible redirects */}
            <Route path="/models" element={<Navigate to="/governance?tab=benchmarks" replace />} />
            <Route path="/dataset" element={<Navigate to="/governance?tab=dataset" replace />} />
            <Route path="/settings" element={<Navigate to="/governance?tab=system" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
