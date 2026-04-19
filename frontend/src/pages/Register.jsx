import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Register() {
  const [role, setRole] = useState('Student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [instituteId, setInstituteId] = useState(1);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const endpoint = role === 'Student' 
        ? 'http://localhost:5000/api/auth/register-student' 
        : 'http://localhost:5000/api/auth/register-admin';
        
      const payload = role === 'Student'
        ? { email, password, institute_id: instituteId }
        : { email, password, institute_id: instituteId, role };
        
      await axios.post(endpoint, payload);
      alert('Registration successful! Please login.');
      navigate('/');
    } catch (error) {
      alert('Registration failed: ' + (error.response?.data?.error || error.message));
    }
  };

  return (
    <div className="flex bg-surface min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md bg-surface-container-low p-10 rounded-[3rem] shadow-ambient">
        <h1 className="text-display font-bold text-on-surface mb-2">Join BalanceU</h1>
        <p className="text-on-surface-variant font-medium mb-8">Create your unified account</p>
        
        <div className="flex gap-4 mb-8">
          {['Student', 'Counselor', 'Admin'].map(r => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`flex-1 py-2 rounded-full font-bold transition-all ${role === r ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant'}`}
            >
              {r}
            </button>
          ))}
        </div>

        <form onSubmit={handleRegister} className="flex flex-col gap-6">
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
          <div>
            <label className="block text-on-surface mb-2 font-semibold">Institute ID</label>
            <input
              type="number"
              className="w-full bg-surface-container p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
              value={instituteId}
              onChange={(e) => setInstituteId(Number(e.target.value))}
              required
              min="1"
            />
          </div>
          
          <button 
            type="submit"
            className="mt-4 bg-gradient-to-br from-primary to-primary-container text-on-primary py-4 rounded-full font-bold text-lg hover:shadow-ambient transition-all"
          >
            Create {role} Account
          </button>
        </form>
        
        <div className="mt-8 text-center text-on-surface-variant">
          {"Already have an account? "}
          <button onClick={() => navigate('/')} className="text-primary font-bold hover:underline">
            Log in
          </button>
        </div>
      </div>
    </div>
  );
}
