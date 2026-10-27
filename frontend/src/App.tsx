import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { SinglePredictPage } from './pages/SinglePredictPage';
import { BatchPredictPage } from './pages/BatchPredictPage';
import { ExplorerPage } from './pages/ExplorerPage';
import { ModelPerformancePage } from './pages/ModelPerformancePage';
import { DatasetPage } from './pages/DatasetPage';
import { SettingsPage } from './pages/SettingsPage';

export function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-fintech-bg text-fintech-text font-sans antialiased">
        {/* Fixed Desktop Sidebar */}
        <Sidebar />

        {/* Main Content Viewport */}
        <div className="flex-1 min-w-0 flex flex-col">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/predict" element={<SinglePredictPage />} />
            <Route path="/batch" element={<BatchPredictPage />} />
            <Route path="/transactions" element={<ExplorerPage />} />
            <Route path="/models" element={<ModelPerformancePage />} />
            <Route path="/dataset" element={<DatasetPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
