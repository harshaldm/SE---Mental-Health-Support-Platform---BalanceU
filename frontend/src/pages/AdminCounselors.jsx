import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { BASE_URL } from '../config/apiConfig';
import { User, CheckCircle, XCircle, FileText, ChevronRight, Users, GraduationCap } from 'lucide-react';

const S = {
  cream:   '#FDFBF7',
  sage:    '#556B5F',
  sageLight: '#EFF4F1',
  charcoal: '#2C2C2C',
  muted:   '#7A7A6E',
  border:  '#E0D9CE',
  white:   '#FFFFFF',
  error:   '#DC2626',
  errorBg: '#FEE2E2',
  warning: '#D97706',
  success: '#059669',
};

export default function AdminCounselors({ token, user }) {
  const [activeStaff, setActiveStaff] = useState([]);
  const [pendingApplicants, setPendingApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStaff, setSelectedStaff] = useState(null); // For deep dive modal

  console.log("AdminCounselors Rendering Check:", { activeCount: activeStaff?.length, pendingCount: pendingApplicants?.length });

  const fetchCounselors = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}/api/admin/counselors`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setActiveStaff(res.data.active || []);
      setPendingApplicants(res.data.pending || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) fetchCounselors();
  }, [fetchCounselors, token]);

  const handleApproveReject = async (counselorId, action) => {
    try {
      // Optimistic update
      if (action === 'approve') {
        const approved = pendingApplicants.find(p => p.counselor_id === counselorId);
        if (approved) {
           setActiveStaff(prev => [...prev, { ...approved, studentCount: 0 }]);
        }
      }
      setPendingApplicants(prev => prev.filter(p => p.counselor_id !== counselorId));

      await axios.put(`${BASE_URL}/api/admin/counselors/approve`, 
        { counselor_id: counselorId, action },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (e) {
      console.error(e);
      fetchCounselors(); // Revert on failure
    }
  };

  if (loading) {
     return <div className="p-8 text-[#7A7A6E] font-medium text-center animate-pulse">Loading counselor workspaces...</div>;
  }

  return (
    <div className="h-full flex flex-col xl:flex-row gap-8 overflow-hidden">
      
      {/* ── Left Column: Active Staff ── */}
      <div className="flex-1 flex flex-col bg-white rounded-[2.5rem] border shadow-sm overflow-hidden" style={{ borderColor: S.border }}>
        <div className="p-8 border-b bg-[#FDFBF7]" style={{ borderColor: S.border }}>
          <h2 className="text-2xl font-black text-[#2C2C2C]">Current Clinical Staff</h2>
          <p className="text-sm font-medium text-[#7A7A6E] mt-1">Manage active counselors and student loads.</p>
        </div>
        <div className="flex-1 overflow-y-auto p-8 space-y-4">
           {activeStaff?.length === 0 ? (
             <div className="text-center py-10 bg-gray-50 border border-dashed rounded-3xl">
               <Users className="mx-auto text-gray-300 mb-2" size={32} />
               <p className="text-sm text-gray-500 font-medium">No active staff members.</p>
             </div>
           ) : activeStaff?.map(c => (
             <div key={c.counselor_id} className="group bg-white border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex justify-between items-center cursor-pointer" style={{ borderColor: S.border }} onClick={() => setSelectedStaff(c)}>
               <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-[#EFF4F1] border border-[#556B5F]/20 rounded-full flex items-center justify-center text-[#556B5F] font-black">
                   {(c.full_name || c.email)[0].toUpperCase()}
                 </div>
                 <div>
                   <h3 className="font-bold text-[#2C2C2C] text-lg">{c.full_name || 'Counselor'}</h3>
                   <div className="flex items-center gap-2 mt-1">
                     <span className="text-xs font-bold text-[#556B5F] bg-[#EFF4F1] px-2 py-0.5 rounded-full">{c.specialization || 'General'}</span>
                     <span className="text-xs font-medium text-[#7A7A6E] flex items-center gap-1">
                       <User size={12} /> {c.studentCount} active {c.studentCount === 1 ? 'student' : 'students'}
                     </span>
                   </div>
                 </div>
               </div>
               <ChevronRight className="text-gray-300 group-hover:text-[#556B5F] transition-colors" />
             </div>
           ))}
        </div>
      </div>

      {/* ── Right Column: Review Station ── */}
      <div className="w-full xl:w-[400px] flex flex-col bg-white rounded-[2.5rem] border shadow-sm overflow-hidden shrink-0" style={{ borderColor: S.border }}>
        <div className="p-8 border-b bg-[#EFF4F1]" style={{ borderColor: S.border }}>
          <h2 className="text-2xl font-black text-[#556B5F]">Review Station</h2>
          <p className="text-sm font-medium text-[#556B5F] opacity-80 mt-1">Verify new applications.</p>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50">
           {pendingApplicants?.length === 0 ? (
             <div className="text-center py-10">
               <div className="w-12 h-12 bg-[#EFF4F1] rounded-full mx-auto flex items-center justify-center text-[#556B5F] mb-3">
                 <CheckCircle size={20} />
               </div>
               <p className="text-sm text-gray-500 font-medium">All caught up.</p>
             </div>
           ) : pendingApplicants?.map(app => {
             console.log(`[AdminCounselors.jsx] -> Rendering Review Station for ${app.full_name || app.email}.`);
             return (
             <div key={app.counselor_id} className="bg-white border rounded-[2rem] p-6 shadow-sm" style={{ borderColor: S.border }}>
               <h3 className="font-bold text-[#2C2C2C] mb-1">{app.full_name || app.email}</h3>
               <p className="text-xs text-[#7A7A6E] font-medium mb-4">{app.email}</p>
               
               <div className="space-y-2 mb-6">
                 {app.documents?.license_url ? (
                   <a 
                     href={`${BASE_URL}${app.documents.license_url}`} 
                     target="_blank" 
                     rel="noopener noreferrer"
                     onClick={() => console.log(`[AdminCounselors.jsx] -> Constructing document URL: ${BASE_URL}${app.documents.license_url}`)}
                     className="w-full text-left px-4 py-3 bg-[#FDFBF7] border border-[#E0D9CE] rounded-xl text-sm font-bold flex items-center gap-3 hover:bg-white transition-colors"
                   >
                     <FileText size={16} className="text-[#556B5F]" /> View Professional License
                   </a>
                 ) : (
                   <div className="w-full text-left px-4 py-3 bg-gray-50 border border-dashed border-gray-200 rounded-xl text-sm font-medium text-gray-400 flex items-center gap-3">
                     <FileText size={16} /> No document uploaded.
                   </div>
                 )}
                 
                 {app.documents?.degree_url ? (
                   <a 
                     href={`${BASE_URL}${app.documents.degree_url}`} 
                     target="_blank" 
                     rel="noopener noreferrer"
                     onClick={() => console.log(`[AdminCounselors.jsx] -> Constructing document URL: ${BASE_URL}${app.documents.degree_url}`)}
                     className="w-full text-left px-4 py-3 bg-[#FDFBF7] border border-[#E0D9CE] rounded-xl text-sm font-bold flex items-center gap-3 hover:bg-white transition-colors"
                   >
                     <GraduationCap size={16} className="text-[#556B5F]" /> View Academic Degree
                   </a>
                 ) : (
                   <div className="w-full text-left px-4 py-3 bg-gray-50 border border-dashed border-gray-200 rounded-xl text-sm font-medium text-gray-400 flex items-center gap-3">
                     <GraduationCap size={16} /> No document uploaded.
                   </div>
                 )}
               </div>

               <div className="flex gap-3">
                 <button onClick={() => handleApproveReject(app.counselor_id, 'approve')} className="flex-1 bg-[#556B5F] text-white py-3 rounded-full font-bold hover:bg-[#44554b] transition-all text-sm flex items-center justify-center gap-2">
                   <CheckCircle size={16} /> Approve
                 </button>
                 <button onClick={() => handleApproveReject(app.counselor_id, 'reject')} className="flex-1 bg-white border border-error text-error py-3 rounded-full font-bold hover:bg-error/5 transition-all text-sm flex items-center justify-center gap-2">
                   <XCircle size={16} /> Reject
                 </button>
               </div>
             </div>
           )})}
        </div>
      </div>

      {/* ── Deep Dive Modal ── */}
      {selectedStaff && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
           <div className="bg-[#FDFBF7] w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-[#E0D9CE]">
             <div className="p-8 bg-[#556B5F] text-white">
               <h2 className="text-2xl font-black">{selectedStaff.full_name}</h2>
               <p className="opacity-80 font-medium">Clinical Staff Profile</p>
             </div>
             <div className="p-8 space-y-6">
               <div>
                  <h4 className="text-xs font-black uppercase text-[#7A7A6E] tracking-widest mb-2">Specialization</h4>
                  <p className="font-bold text-[#2C2C2C]">{selectedStaff.specialization || 'Not specified'}</p>
               </div>
               <div>
                  <h4 className="text-xs font-black uppercase text-[#7A7A6E] tracking-widest mb-2">Biography</h4>
                  <p className="text-sm font-medium leading-relaxed text-[#2C2C2C] opacity-80 bg-white p-4 rounded-2xl border" style={{ borderColor: S.border }}>
                    {selectedStaff.bio || 'No biography provided.'}
                  </p>
               </div>
               <div>
                  <h4 className="text-xs font-black uppercase text-[#7A7A6E] tracking-widest mb-2">Current Load</h4>
                  <div className="bg-[#EFF4F1] border border-[#556B5F]/20 p-4 rounded-2xl flex items-center gap-3">
                     <Users className="text-[#556B5F]" />
                     <span className="font-black text-[#556B5F]">{selectedStaff.studentCount} Consultations</span>
                  </div>
               </div>
             </div>
             <div className="p-6 border-t border-[#E0D9CE] flex justify-end">
               <button onClick={() => setSelectedStaff(null)} className="bg-[#556B5F] text-white px-8 py-3 rounded-full font-bold hover:bg-[#44554b] shadow-lg">
                 Close View
               </button>
             </div>
           </div>
         </div>
      )}
    </div>
  );
}
