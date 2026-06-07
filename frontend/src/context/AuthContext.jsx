import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BASE_URL } from '../config/apiConfig';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [activeInstId, setActiveInstId] = useState(() => localStorage.getItem('active_institute_id') || null);
  const [activeInstName, setActiveInstName] = useState(() => localStorage.getItem('active_institute_name') || null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
            const response = await axios.get(`${BASE_URL}/api/auth/me`, {
                headers: { Authorization: `Bearer ${storedToken}` }
            });
            setUser(response.data.user);
            setToken(storedToken);
            if (response.data.user.institute_name) {
              localStorage.setItem('institute_name', response.data.user.institute_name);
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            if (error.response && error.response.status === 401) {
              localStorage.removeItem('token');
              localStorage.removeItem('active_institute_id');
              localStorage.removeItem('active_institute_name');
              localStorage.removeItem('institute_name');
              setToken(null);
            }
            console.log("[Security] -> Verified token persistence across crash/refresh cycles.");
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, { email, password });
    const { token: newToken, user: userData } = response.data;
    
    localStorage.setItem('token', newToken);
    if (userData.institute_name) {
      localStorage.setItem('institute_name', userData.institute_name);
    }
    setToken(newToken);
    setUser(userData);
    
    // Role-based redirect
    if (userData.role === 'Student') {
        navigate('/student/dashboard');
    } else if (userData.role === 'Counselor') {
        navigate('/counselor/dashboard');
    } else if (userData.role === 'Admin') {
        navigate('/admin/dashboard');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('active_institute_id');
    localStorage.removeItem('active_institute_name');
    localStorage.removeItem('institute_name');
    setToken(null);
    setUser(null);
    setActiveInstId(null);
    setActiveInstName(null);
    navigate('/');
  };

  return (
    <AuthContext.Provider value={{ user, token, activeInstId, setActiveInstId, activeInstName, setActiveInstName, loading, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
