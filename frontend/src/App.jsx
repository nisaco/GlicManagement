import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout          from './components/Layout';
import Login           from './pages/Login';
import Setup           from './pages/Setup';
import Dashboard       from './pages/Dashboard';
import Members         from './pages/Members';
import Payments        from './pages/Payments';
import Reminders       from './pages/Reminders';
import Attendance      from './pages/Attendance';
import MemberLookup    from './pages/MemberLookup';
import Reports         from './pages/Reports';
import Pledges         from './pages/Pledges';
import Birthdays       from './pages/Birthdays';
import MembershipCards from './pages/MembershipCards';
import Import          from './pages/Import';
import Staff           from './pages/Staff';

const PrivateRoute = ({ children, roles }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role) && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  return <Layout>{children}</Layout>;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/setup" element={<Setup />} />
          <Route path="/login" element={<Login />} />

          {/* All roles */}
          <Route path="/"           element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/attendance" element={<PrivateRoute><Attendance /></PrivateRoute>} />

          {/* Admin + Secretary */}
          <Route path="/members"   element={<PrivateRoute roles={['secretary']}><Members /></PrivateRoute>} />
          <Route path="/import"    element={<PrivateRoute roles={['secretary']}><Import /></PrivateRoute>} />
          <Route path="/birthdays" element={<PrivateRoute roles={['secretary']}><Birthdays /></PrivateRoute>} />
          <Route path="/cards"     element={<PrivateRoute roles={['secretary']}><MembershipCards /></PrivateRoute>} />
          <Route path="/reminders" element={<PrivateRoute roles={['secretary']}><Reminders /></PrivateRoute>} />
          <Route path="/lookup"    element={<PrivateRoute roles={['secretary']}><MemberLookup /></PrivateRoute>} />

          {/* Admin + Treasurer */}
          <Route path="/payments" element={<PrivateRoute roles={['treasurer']}><Payments /></PrivateRoute>} />
          <Route path="/pledges"  element={<PrivateRoute roles={['treasurer']}><Pledges /></PrivateRoute>} />
          <Route path="/reports"  element={<PrivateRoute roles={['treasurer']}><Reports /></PrivateRoute>} />

          {/* Admin only */}
          <Route path="/staff" element={<PrivateRoute roles={['admin']}><Staff /></PrivateRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}