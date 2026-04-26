import React, { useState, useEffect } from 'react';
import { Search, Eye, Video, ClipboardList, Pill, X, Sparkles, Send } from 'lucide-react';
import axios from 'axios';
import { BASE_URL } from '../config/apiConfig';

const S = {
  sage: '#556B5F',
  sageLight: '#EFF4F1',
  charcoal: '#2C2C2C',
  muted: '#7A7A6E',
  border: '#E0D9CE',
  cream: '#FDFBF7'
};

const RiskBadge = ({ level }) => {
  const cfg = {
    'Low':      { cls: 'bg-primary/10 text-primary', label: 'Low Risk' },
    'Moderate': { cls: 'bg-amber-100 text-amber-700', label: 'Moderate Risk' },
    'Severe':   { cls: 'bg-error/10 text-error', label: 'High Risk' },
  }[level] || { cls: 'bg-gray-100 text-gray-600', label: level };

  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
};

export default function CounselorStudents({ 
  students, 
  studentSearch, 
  setStudentSearch,
  token,
  activeInstId,
  setActiveChat // Pass from CounselorDashboard
}) {
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [activeTab, setActiveTab] = useState('profile'); // profile, resource, medicine
  const [submitMsg, setSubmitMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  // Unified Clinical Data (Mirrored from Admin)
  const [clinicalDetails, setClinicalDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const fetchClinicalDetails = async (studentId) => {
    setDetailsLoading(true);
    setClinicalDetails(null);
    try {
      const res = await axios.get(`${BASE_URL}/api/counselor/student-clinical/${studentId}`, {
        headers: { Authorization: `Bearer ${token}`, 'X-Active-Institute': activeInstId }
      });
      setClinicalDetails(res.data.latestReport);
      console.log(`[CounselorStudents.jsx] -> Logic Applied: Deep Dive now populating with full Admin-level quiz data.`);
    } catch (err) {
      console.error("Failed to fetch clinical details", err);
    } finally {
      setDetailsLoading(false);
    }
  };

  // Forms
  const [resForm, setResForm] = useState({ title: '', url: '', type: 'Article' });
  const [medForm, setMedForm] = useState({ 
    med_name: '', 
    dosage: '', 
    frequency: 1, 
    slots: ['Morning'],
    duration: 7 
  });

  useEffect(() => {
    if (activeInstId) {
      console.log(`[CounselorStudents.jsx] -> Rendering Caseload for Institute ${activeInstId}.`);
    }
  }, [activeInstId]);

  const openDeepDive = (student) => {
    setSelectedStudent(student);
    setActiveTab('profile');
    setSubmitMsg(null);
    fetchClinicalDetails(student.id);
    console.log(`[CounselorStudents.jsx] -> Corrected Risk Tag mapping for Student ${student.id}: ${student.risk_level}.`);
  };

  const handleResource = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${BASE_URL}/api/resources/assign`, {
        ...resForm,
        student_id: selectedStudent.id
      }, { headers: { Authorization: `Bearer ${token}`, 'X-Active-Institute': activeInstId } });
      setSubmitMsg({ type: 'success', text: 'Resource assigned successfully!' });
      setResForm({ title: '', url: '', type: 'Article' });
    } catch (err) {
      setSubmitMsg({ type: 'error', text: err.response?.data?.error || 'Assignment failed' });
    } finally { setLoading(false); }
  };

  const handleMedicine = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const start = new Date();
      const end = new Date();
      end.setDate(end.getDate() + parseInt(medForm.duration));

      await axios.post(`${BASE_URL}/api/meds/prescribe`, {
        student_id: selectedStudent.id,
        med_name: medForm.med_name,
        dosage: medForm.dosage,
        frequency: medForm.slots.length,
        slots: medForm.slots,
        start_date: start.toISOString(),
        end_date: end.toISOString()
      }, { headers: { Authorization: `Bearer ${token}`, 'X-Active-Institute': activeInstId } });
      
      setSubmitMsg({ type: 'success', text: 'Prescription created!' });
      setMedForm({ med_name: '', dosage: '', frequency: 1, slots: ['Morning'], duration: 7 });
    } catch (err) {
      setSubmitMsg({ type: 'error', text: err.response?.data?.error || 'Prescription failed' });
    } finally { setLoading(false); }
  };

  const toggleSlot = (slot) => {
    setMedForm(prev => ({
      ...prev,
      slots: prev.slots.includes(slot) 
        ? prev.slots.filter(s => s !== slot)
        : [...prev.slots, slot]
    }));
  };

  return (
    <div className="bg-white rounded-[2.5rem] border border-[#E0D9CE] p-8 shadow-sm h-full flex flex-col relative overflow-hidden">
      {/* ── Header ── */}
      <div className="flex justify-between items-center mb-8 shrink-0">
        <div>
          <h3 className="text-xl font-black text-[#2C2C2C] tracking-tight">Active Caseload</h3>
          <p className="text-xs text-[#7A7A6E]">Students with accepted support requests</p>
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7A7A6E]" />
          <input
            type="text"
            placeholder="Search caseload..."
            value={studentSearch}
            onChange={e => setStudentSearch(e.target.value)}
            className="pl-12 pr-6 py-3 bg-[#FDFBF7] border border-[#E0D9CE] rounded-full text-sm focus:ring-2 focus:ring-[#556B5F] outline-none w-64 transition-all"
          />
        </div>
      </div>

      {/* ── Student List ── */}
      <div className="flex-1 overflow-y-auto pr-2">
        {students.length === 0 ? (
          <div className="text-center py-24">
             <ClipboardList size={48} className="mx-auto text-[#E0D9CE] mb-4" />
             <p className="text-[#7A7A6E] font-bold italic">Your caseload is currently empty.</p>
             <p className="text-[10px] text-[#7A7A6E] uppercase tracking-widest mt-2">Accept requests to see students here</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {students.map(s => (
              <div 
                key={s.id} 
                onClick={() => openDeepDive(s)}
                className="bg-[#FDFBF7] p-6 rounded-[2rem] border border-[#E0D9CE] hover:border-[#556B5F] hover:shadow-lg transition-all cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-4">
                   <div className="w-12 h-12 rounded-2xl bg-[#556B5F] text-white flex items-center justify-center font-black text-xl shadow-lg shadow-[#556B5F]/20">
                     {s.full_name[0].toUpperCase()}
                   </div>
                   <RiskBadge level={s.risk_level} />
                </div>
                <h4 className="font-black text-[#2C2C2C] text-lg leading-tight mb-1">{s.full_name}</h4>
                <p className="text-xs text-[#7A7A6E] mb-4 truncate">{s.email}</p>
                
                <div className="flex items-center justify-between pt-4 border-t border-[#E0D9CE]">
                  <span className="text-[10px] font-bold text-[#7A7A6E] uppercase">Score: {s.total_score}</span>
                  <button className="flex items-center gap-1.5 text-[10px] font-black text-[#556B5F] uppercase tracking-widest group-hover:underline">
                    <Eye size={12} /> Clinical Profile
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Deep Dive Modal ── */}
      {selectedStudent && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#FDFBF7] w-full max-w-4xl max-h-[90vh] rounded-[3rem] overflow-hidden flex flex-col shadow-2xl border border-[#E0D9CE]">
            {/* Modal Header */}
            <div className="p-8 border-b border-[#E0D9CE] flex justify-between items-start bg-[#556B5F] text-white">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-[2rem] bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-4xl border border-white/30">
                  {selectedStudent.full_name[0]}
                </div>
                <div>
                  <h2 className="text-3xl font-black">{selectedStudent.full_name}</h2>
                  <div className="flex gap-3 mt-2 items-center">
                    <span className="text-sm opacity-80">{selectedStudent.email}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-white/30"></span>
                    <RiskBadge level={selectedStudent.risk_level} />
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setSelectedStudent(null)}
                className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 flex overflow-hidden">
              {/* Sidebar Tabs */}
              <div className="w-64 border-r border-[#E0D9CE] p-6 space-y-2 bg-white">
                <button onClick={() => setActiveTab('profile')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${activeTab === 'profile' ? 'bg-[#556B5F] text-white' : 'text-[#7A7A6E] hover:bg-[#EFF4F1]'}`}>
                   <ClipboardList size={18} /> Student Profile
                </button>
                <button onClick={() => setActiveTab('resource')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${activeTab === 'resource' ? 'bg-[#556B5F] text-white' : 'text-[#7A7A6E] hover:bg-[#EFF4F1]'}`}>
                   <Send size={18} /> Prescribe Resource
                </button>
                <button onClick={() => setActiveTab('medicine')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${activeTab === 'medicine' ? 'bg-[#556B5F] text-white' : 'text-[#7A7A6E] hover:bg-[#EFF4F1]'}`}>
                   <Pill size={18} /> Medical Prescriber
                </button>
                <div className="mt-8 pt-8 border-t border-[#E0D9CE]">
                  <button 
                    onClick={() => {
                        setActiveChat({ appointmentId: selectedStudent.appointment_id, peerName: selectedStudent.full_name });
                        setSelectedStudent(null);
                    }}
                    className="w-full bg-[#EFF4F1] text-[#556B5F] py-4 rounded-2xl font-black text-sm hover:bg-[#556B5F] hover:text-white transition-all flex items-center justify-center gap-2 border border-[#556B5F]/20"
                  >
                    <Video size={18} /> Live Session
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto p-10 bg-[#FDFBF7]">
                {activeTab === 'profile' && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div>
                        <h3 className="text-xl font-black mb-4 border-l-4 border-[#556B5F] pl-4">Clinical Metadata</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white p-6 rounded-3xl border border-[#E0D9CE]">
                                <p className="text-[10px] font-black text-[#556B5F] uppercase mb-1">Last Score</p>
                                <p className="text-3xl font-black text-[#2C2C2C]">{selectedStudent.total_score}</p>
                            </div>
                            <div className="bg-white p-6 rounded-3xl border border-[#E0D9CE]">
                                <p className="text-[10px] font-black text-[#556B5F] uppercase mb-1">Joined Caseload</p>
                                <p className="text-lg font-bold text-[#2C2C2C]">{new Date(selectedStudent.registered_at).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#EFF4F1] p-8 rounded-[2.5rem] border border-[#556B5F]/10">
                        <div className="flex items-center gap-2 mb-4 text-[#556B5F]">
                            <Sparkles size={20} />
                            <h4 className="font-black uppercase tracking-widest text-xs">AI Pattern Insight</h4>
                        </div>
                        <p className="text-[#2C2C2C] text-sm leading-relaxed italic">
                            {clinicalDetails?.ai_analysis || `Gemini has flagged this student for '${selectedStudent.risk_level}' concerns. Recommend immediate follow-up via Live Session.`}
                        </p>
                    </div>

                    {/* Full Question Breakdown */}
                    <div className="space-y-4">
                        <h4 className="font-black text-[#2C2C2C] text-sm uppercase tracking-widest mb-4">Detailed Question Responses</h4>
                        {detailsLoading ? (
                             <div className="text-center py-8 text-[#7A7A6E] animate-pulse font-bold">Synchronizing clinical data...</div>
                        ) : clinicalDetails?.question_responses?.length > 0 ? (
                            clinicalDetails.question_responses.map((q, idx) => (
                                <div key={idx} className="bg-white p-6 rounded-[2rem] border border-[#E0D9CE] shadow-sm">
                                   <p className="font-bold text-[#2C2C2C] mb-3 text-sm">Q{idx+1}: {q.question}</p>
                                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div className="bg-[#EFF4F1] p-3 rounded-xl border border-[#556B5F]/10">
                                         <p className="text-[9px] font-black text-[#556B5F] uppercase mb-1">Option Selected</p>
                                         <p className="text-xs font-bold">{q.selected_option}</p>
                                      </div>
                                      <div className="bg-[#FDFBF7] p-3 rounded-xl border border-[#E0D9CE]">
                                         <p className="text-[9px] font-black text-[#7A7A6E] uppercase mb-1">Student Reflection</p>
                                         <p className="text-xs italic text-[#2C2C2C]">{q.text_answer || "No text provided."}</p>
                                      </div>
                                   </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-center py-8 text-[#7A7A6E] italic">No detailed question data available for this student.</p>
                        )}
                    </div>
                  </div>
                )}

                {activeTab === 'resource' && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <h3 className="text-xl font-black mb-6">Prescribe Support Resource</h3>
                    <form onSubmit={handleResource} className="space-y-6 max-w-lg">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-[#7A7A6E] uppercase">Resource Title</label>
                        <input required value={resForm.title} onChange={e => setResForm({...resForm, title: e.target.value})} className="w-full p-4 rounded-2xl border border-[#E0D9CE] bg-white outline-none focus:ring-2 focus:ring-[#556B5F]" placeholder="e.g. Anxiety Management Guide" />
                      </div>
                      <div className="flex gap-4">
                         <div className="flex-1 space-y-1.5">
                            <label className="text-[10px] font-black text-[#7A7A6E] uppercase">Source URL</label>
                            <input required value={resForm.url} onChange={e => setResForm({...resForm, url: e.target.value})} className="w-full p-4 rounded-2xl border border-[#E0D9CE] bg-white outline-none focus:ring-2 focus:ring-[#556B5F]" placeholder="https://..." />
                         </div>
                         <div className="w-32 space-y-1.5">
                            <label className="text-[10px] font-black text-[#7A7A6E] uppercase">Type</label>
                            <select value={resForm.type} onChange={e => setResForm({...resForm, type: e.target.value})} className="w-full p-4 rounded-2xl border border-[#E0D9CE] bg-white outline-none focus:ring-2 focus:ring-[#556B5F]">
                                <option>Article</option>
                                <option>Video</option>
                                <option>PDF</option>
                            </select>
                         </div>
                      </div>
                      <button disabled={loading} className="w-full bg-[#556B5F] text-white py-4 rounded-2xl font-black hover:bg-[#44554b] transition-all shadow-xl shadow-[#556B5F]/20 disabled:opacity-50">
                        {loading ? 'Sending...' : 'Assign Resource'}
                      </button>
                    </form>
                  </div>
                )}

                {activeTab === 'medicine' && (
                   <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                      <h3 className="text-xl font-black mb-6">Medical Prescriber</h3>
                      <form onSubmit={handleMedicine} className="space-y-6 max-w-lg">
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-[#7A7A6E] uppercase">Medication Name</label>
                              <input required value={medForm.med_name} onChange={e => setMedForm({...medForm, med_name: e.target.value})} className="w-full p-4 rounded-2xl border border-[#E0D9CE] bg-white outline-none focus:ring-2 focus:ring-[#556B5F]" placeholder="e.g. Sertraline" />
                           </div>
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-[#7A7A6E] uppercase">Dosage</label>
                              <input required value={medForm.dosage} onChange={e => setMedForm({...medForm, dosage: e.target.value})} className="w-full p-4 rounded-2xl border border-[#E0D9CE] bg-white outline-none focus:ring-2 focus:ring-[#556B5F]" placeholder="e.g. 50mg" />
                           </div>
                        </div>

                        <div className="space-y-3">
                           <label className="text-[10px] font-black text-[#7A7A6E] uppercase">Daily Slots (Frequency)</label>
                           <div className="flex gap-2">
                              {['Morning', 'Afternoon', 'Evening', 'Night'].map(slot => (
                                 <button 
                                    key={slot}
                                    type="button"
                                    onClick={() => toggleSlot(slot)}
                                    className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${medForm.slots.includes(slot) ? 'bg-[#556B5F] text-white border-[#556B5F]' : 'bg-white text-[#7A7A6E] border-[#E0D9CE] hover:border-[#556B5F]'}`}
                                 >
                                    {slot}
                                 </button>
                              ))}
                           </div>
                        </div>

                        <div className="space-y-1.5">
                           <label className="text-[10px] font-black text-[#7A7A6E] uppercase">Duration (Days)</label>
                           <input type="number" value={medForm.duration} onChange={e => setMedForm({...medForm, duration: e.target.value})} className="w-full p-4 rounded-2xl border border-[#E0D9CE] bg-white outline-none focus:ring-2 focus:ring-[#556B5F]" min="1" />
                        </div>

                        <button disabled={loading || medForm.slots.length === 0} className="w-full bg-[#556B5F] text-white py-4 rounded-2xl font-black hover:bg-[#44554b] transition-all shadow-xl shadow-[#556B5F]/20 disabled:opacity-50">
                          {loading ? 'Processing...' : 'Issue Prescription'}
                        </button>
                      </form>
                   </div>
                )}

                {submitMsg && (
                  <div className={`mt-6 p-4 rounded-2xl text-sm font-bold text-center ${submitMsg.type === 'success' ? 'bg-[#556B5F]/10 text-[#556B5F]' : 'bg-error/10 text-error'}`}>
                    {submitMsg.text}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
