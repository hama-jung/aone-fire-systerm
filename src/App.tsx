import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { UserManagement } from './pages/UserManagement';
import { MarketManagement } from './pages/MarketManagement';
import { StoreManagement } from './pages/StoreManagement';
import { RoleManagement } from './pages/RoleManagement';
import { DistributorManagement } from './pages/DistributorManagement';
import { SmsTransmission } from './pages/SmsTransmission';
import { WorkLogManagement } from './pages/WorkLogManagement';

// Placeholder components for routes not fully implemented
const PlaceholderPage: React.FC<{ title: string }> = ({ title }) => (
  <div className="p-8 text-center text-gray-500">
    <h2 className="text-2xl font-bold mb-4">{title}</h2>
    <p>이 페이지는 현재 준비 중입니다.</p>
  </div>
);

const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        
        {/* Protected Routes Wrapper */}
        <Route path="/*" element={
          <Layout>
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/users" element={<UserManagement />} />
              <Route path="/markets" element={<MarketManagement />} />
              
              {/* Actual Components linked to routes */}
              <Route path="/stores" element={<StoreManagement />} />
              <Route path="/roles" element={<RoleManagement />} />
              <Route path="/distributors" element={<DistributorManagement />} />
              <Route path="/sms" element={<SmsTransmission />} />
              <Route path="/work-logs" element={<WorkLogManagement />} />
              
              {/* Placeholders for other menu items */}
              <Route path="/receivers" element={<PlaceholderPage title="R형 수신기 관리" />} />
              <Route path="/repeaters" element={<PlaceholderPage title="중계기 관리" />} />
              <Route path="/detectors" element={<PlaceholderPage title="화재감지기 관리" />} />
              <Route path="/fire-history" element={<PlaceholderPage title="화재 이력 관리" />} />
              <Route path="/device-status" element={<PlaceholderPage title="기기 상태 관리" />} />
              
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Layout>
        } />
      </Routes>
    </HashRouter>
  );
};

export default App;