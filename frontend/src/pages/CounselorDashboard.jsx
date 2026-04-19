import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';
import { AlertCircle, User, LogOut } from 'lucide-react';

export default function CounselorDashboard() {
  const { user, logout } = useAuth();
  const [crisisAlerts, setCrisisAlerts] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const newSocket = io('http://localhost:5000', {
      auth: { token }
    });

    newSocket.on('connect', () => {
      console.log('Counselor Dashboard Sentry Online.');
      // A typical counselor would join rooms for their appointments, but here we can
      // also assume the server sends 'emergency_alert' globally or to counselor's active rooms.
    });

    // PHASE 12C: Real-time Sentry Crisis Event
    newSocket.on('emergency_alert', (data) => {
      setCrisisAlerts(prev => [data, ...prev]);
      
      // Attempt browser notification
      if (Notification.permission === 'granted') {
          new Notification('CRISIS ALERT RED', {
              body: `Student ${data.student_email}: "${data.message_text}"`
          });
      } else if (Notification.permission !== 'denied') {
          Notification.requestPermission();
      }
    });

    // Optional: Medication Missed Alerts
    newSocket.on('medication_missed', (data) => {
      console.log('Medication Missed:', data);
    });

    setSocket(newSocket);

    return () => newSocket.disconnect();
  }, []);

  return (
    <div className="bg-surface min-h-screen p-8 lg:p-16">
      <header className="flex justify-between items-center mb-16">
        <div>
          <h1 className="text-display font-bold text-on-surface">Good Morning, Counselor</h1>
          <p className="text-on-surface-variant text-lg">Your serene workspace for student support.</p>
        </div>
        <button onClick={logout} className="flex items-center gap-2 bg-surface-container-high px-6 py-3 rounded-full font-bold text-on-surface hover:bg-surface-variant transition-colors">
          <LogOut size={20} /> Logout
        </button>
      </header>

      {/* PHASE 12C CRISIS SENTRY MONITOR */}
      {crisisAlerts.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-error mb-4 flex items-center gap-2">
            <AlertCircle /> High Priority Alerts
          </h2>
          <div className="flex flex-col gap-4">
            {crisisAlerts.map((alert, idx) => (
              <div key={idx} className="bg-error-container/20 border border-error-container backdrop-blur-md p-6 rounded-[2rem] shadow-ambient flex justify-between items-start">
                <div>
                  <div className="font-bold text-error text-xl mb-1 flex items-center gap-2">
                    <User size={20} /> {alert.student_email || `Student ID: ${alert.student_id}`}
                  </div>
                  <p className="text-on-surface text-lg font-medium italic">"{alert.message_text}"</p>
                  <p className="text-on-surface-variant text-sm mt-4">Detected at {new Date(alert.timestamp).toLocaleTimeString()}</p>
                </div>
                <button className="bg-error text-on-error px-6 py-3 rounded-full font-bold shadow-ambient">
                  Respond Immediately
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Basic Layout grid strictly observing the "No Line" Rule */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-surface-container-low rounded-[3rem] p-10">
          <h3 className="text-2xl font-bold text-on-surface mb-6">Upcoming Sessions</h3>
          <p className="text-on-surface-variant">Your schedule goes here.</p>
        </div>
        <div className="bg-surface-container rounded-[3rem] p-10">
          <h3 className="text-2xl font-bold text-on-surface mb-6">Quick Actions</h3>
          <div className="flex flex-col gap-4">
            <button className="bg-primary text-on-primary rounded-full py-4 font-bold">Review Assessments</button>
            <button className="bg-surface-container-highest text-on-surface rounded-full py-4 font-bold">Add Wellness Resource</button>
          </div>
        </div>
      </div>
    </div>
  );
}
