import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { DataProvider } from './context/DataContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers'; // Renaming to Guests in route but keeping file for now, actually better to use new file
import Guests from './pages/Guests';
import Manage from './pages/Manage';
import Reports from './pages/Reports';
import Reminders from './pages/Reminders';
import Login from './pages/Login';

const Placeholder = ({ title }) => (
  <div className="text-center mt-5">
    <h2 className="text-white">{title}</h2>
    <p className="text-secondary">This feature is coming soon.</p>
  </div>
);

function App() {
  const Placeholder = ({ title }) => (
    <div className="text-center mt-5">
      <h2 className="text-white">{title}</h2>
      <p className="text-secondary">This feature is coming soon.</p>
    </div>
  );

  const RequireAdmin = ({ children }) => {
    const { user } = useAuth();
    return user && user.role === 'admin' ? children : <Placeholder title="Not authorized" />;
  };

  return (
    <AuthProvider>
      <DataProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="guests" element={<Guests />} />
              <Route path="reminders" element={<Reminders />} />
              <Route path="manage" element={<Manage />} />
              <Route path="reports" element={<RequireAdmin><Reports /></RequireAdmin>} />
            </Route>
          </Routes>
        </Router>
      </DataProvider>
    </AuthProvider>
  );
}

export default App
