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

const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? <Layout>{children}</Layout> : <Navigate to="/login" replace />;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/setup"   element={<Setup />} />
          <Route path="/login"   element={<Login />} />
          <Route path="/"              element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/members"       element={<PrivateRoute><Members /></PrivateRoute>} />
          <Route path="/payments"      element={<PrivateRoute><Payments /></PrivateRoute>} />
          <Route path="/reminders"     element={<PrivateRoute><Reminders /></PrivateRoute>} />
          <Route path="/attendance"    element={<PrivateRoute><Attendance /></PrivateRoute>} />
          <Route path="/lookup"        element={<PrivateRoute><MemberLookup /></PrivateRoute>} />
          <Route path="/pledges"       element={<PrivateRoute><Pledges /></PrivateRoute>} />
          <Route path="/birthdays"     element={<PrivateRoute><Birthdays /></PrivateRoute>} />
          <Route path="/cards"         element={<PrivateRoute><MembershipCards /></PrivateRoute>} />
          <Route path="/import"        element={<PrivateRoute><Import /></PrivateRoute>} />
          <Route path="/reports"       element={<PrivateRoute><Reports /></PrivateRoute>} />
          <Route path="*"              element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
