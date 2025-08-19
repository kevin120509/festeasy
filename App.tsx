import React from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppProvider, useAppContext } from './context/AppContext';
import HomePage from './pages/customer/HomePage';
import ProviderAuthPage from './pages/provider/ProviderAuthPage';
import ProviderDashboard from './pages/provider/ProviderDashboard';

const PrivateRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { user } = useAppContext();
  const location = useLocation();

  if (user && user.type === 'provider') {
    return children;
  }

  return <Navigate to="/provider" state={{ from: location }} replace />;
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/provider" element={<ProviderAuthPage />} />
          <Route 
            path="/provider/dashboard/*" 
            element={
              <PrivateRoute>
                <ProviderDashboard />
              </PrivateRoute>
            } 
          />
        </Routes>
      </HashRouter>
    </AppProvider>
  );
};

export default App;
