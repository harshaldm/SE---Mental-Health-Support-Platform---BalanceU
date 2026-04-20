import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import StudentRegister from './pages/StudentRegister';
import RegisterAdmin from './pages/RegisterAdmin';
import RegisterSelect from './pages/RegisterSelect';
import CounselorRegister from './pages/CounselorRegister';
import CounselorDashboard from './pages/CounselorDashboard';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';

const theme = createTheme({
  palette: {
    primary: {
      main: '#8DA399', // BalanceU Green
      contrastText: '#fffbff',
    },
    background: {
      default: '#fffbff',
      paper: '#fdf9ed',
    },
    text: {
      primary: '#39382a',
      secondary: '#676555',
    },
  },
  typography: {
    fontFamily: '"Manrope", sans-serif',
  },
  shape: {
    borderRadius: 24,
  },
});

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" />;
  return children;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/register" element={<RegisterSelect />} />
            <Route path="/register/student" element={<StudentRegister />} />
            <Route path="/register/counselor" element={<CounselorRegister />} />
            <Route path="/register/admin" element={<RegisterAdmin />} />
            <Route 
              path="/counselor/dashboard" 
              element={
                <ProtectedRoute allowedRoles={['Counselor']}>
                  <CounselorDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/dashboard" 
              element={
                <ProtectedRoute allowedRoles={['Admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
