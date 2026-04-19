import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
    } catch (error) {
      alert('Login failed. Check credentials.');
    }
  };

  return (
    <div className="flex bg-surface min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md bg-surface-container-low p-10 rounded-[3rem] shadow-ambient">
        <h1 className="text-display font-bold text-on-surface mb-2">Welcome back.</h1>
        <p className="text-on-surface-variant font-medium mb-8">Sign in to BalanceU</p>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div>
            <label className="block text-on-surface mb-2 font-semibold">Email address</label>
            <input
              type="email"
              className="w-full bg-surface-container p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-on-surface mb-2 font-semibold">Password</label>
            <input
              type="password"
              className="w-full bg-surface-container p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button 
            type="submit"
            className="mt-4 bg-gradient-to-br from-primary to-primary-container text-on-primary py-4 rounded-full font-bold text-lg hover:shadow-ambient transition-all"
          >
            Sign In
          </button>
        </form>
        
        <div className="mt-8 text-center text-on-surface-variant">
          {"Don't have an account? "}
          <button onClick={() => navigate('/register')} className="text-primary font-bold hover:underline">
            Register here
          </button>
        </div>
      </div>
    </div>
  );
}
