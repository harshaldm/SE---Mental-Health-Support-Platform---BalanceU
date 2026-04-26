import { useState, useEffect } from 'react';
import axios from 'axios';
import { BASE_URL } from '../config/apiConfig';
import { useAuth } from '../context/AuthContext';
import { Search, X, Activity, Target, MessageSquare } from 'lucide-react';

const S = {
  cream:   '#FDFBF7',
  sage:    '#556B5F',
  sageLight: '#EFF4F1',
  charcoal: '#2C2C2C',
  muted:   '#7A7A6E',
  border:  '#E0D9CE',
  white:   '#FFFFFF',
  error:   '#DC2626',
  warning: '#D97706',
  success: '#059669',
};

const getRiskColors = (level) => {
  switch(level?.toLowerCase()) {
    case 'severe':
    case 'moderately severe':
    case 'high risk':
      return { bg: '#FEE2E2', text: '#DC2626' };
    case 'moderate':
      return { bg: '#FEF3C7', text: '#D97706' };
    case 'mild':
    case 'minimal':
    case 'stable':
      return { bg: '#D1FAE5', text: '#059669' };
    default:
      return { bg: '#EFF4F1', text: '#556B5F' };
  }
};

export default function AdminStudents() {
  const { token } = useAuth();
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [deepDiveData, setDeepDiveData] = useState(null);
  const [loadingModal, setLoadingModal] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, [token]);

  const fetchStudents = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/admin/students`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log("API Response:", res.data);
      setStudents(res.data.students || []);
    } catch (e) { console.error("Error fetching students:", e); }
  };

  const handleDeepDive = async (student) => {
    setSelectedStudent(student);
    setLoadingModal(true);
    setDeepDiveData(null);
    try {
      const res = await axios.get(`${BASE_URL}/api/admin/student/${student.id}/details`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDeepDiveData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingModal(false);
    }
  };

  const filteredStudents = students.filter(s => 
    s.name?.toLowerCase().includes(search.toLowerCase()) || 
    s.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl w-full mx-auto">
      <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h1 className="text-4xl font-black mb-2" style={{ color: S.charcoal }}>Student Directory</h1>
           <p className="text-[#7A7A6E] text-base font-medium">Manage and review clinical oversight across the institute.</p>
        </div>
        
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7A7A6E]" size={18} />
          <input 
            type="text" 
            placeholder="Search students..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-80 pl-11 pr-4 py-3 rounded-2xl border text-sm font-medium focus:ring-2 outline-none transition-all"
            style={{ borderColor: S.border, backgroundColor: S.white }}
          />
        </div>
      </header>

      {/* Directory List */}
      <div className="bg-white rounded-[2.5rem] p-8 border shadow-sm overflow-x-auto" style={{ borderColor: S.border }}>
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="border-b" style={{ borderColor: S.border }}>
              <th className="pb-4 text-xs font-bold text-[#7A7A6E] uppercase tracking-wider pl-4">Student</th>
              <th className="pb-4 text-xs font-bold text-[#7A7A6E] uppercase tracking-wider">Email</th>
              <th className="pb-4 text-xs font-bold text-[#7A7A6E] uppercase tracking-wider">Latest Risk Tag</th>
              <th className="pb-4"></th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((s, idx) => {
              const riskStyle = getRiskColors(s.riskLevel);
              return (
                <tr key={idx} className="border-b last:border-0 hover:bg-[#FDFBF7] transition-colors" style={{ borderColor: S.border }}>
                  <td className="py-5 font-bold pl-4" style={{ color: S.charcoal }}>{s.name}</td>
                  <td className="py-5 text-sm text-[#7A7A6E] font-medium">{s.email}</td>
                  <td className="py-5">
                    {console.log(`[AdminStudents.jsx] -> Rendering Risk Tag: ${s.riskLevel} for ${s.name}.`)}
                    <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider" style={{ backgroundColor: riskStyle.bg, color: riskStyle.text }}>
                      {s.riskLevel}
                    </span>
                  </td>
                  <td className="py-5 text-right pr-4">
                    <button 
                      onClick={() => handleDeepDive(s)}
                      className="text-xs font-bold px-4 py-2 rounded-xl transition-all hover:bg-[#EFF4F1] hover:text-[#556B5F]"
                      style={{ color: S.sage }}
                    >
                      Deep Dive
                    </button>
                  </td>
                </tr>
              )
            })}
            {filteredStudents.length === 0 && (
              <tr>
                <td colSpan="4" className="py-12 text-center text-[#7A7A6E] font-medium font-sm">No students found matching your criteria.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Deep Dive Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-[#FDFBF7] w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <header className="p-8 pb-6 border-b flex justify-between items-center" style={{ borderColor: S.border, backgroundColor: S.white }}>
              <div>
                <h2 className="text-2xl font-black">{selectedStudent.name}</h2>
                <p className="text-xs font-bold text-[#7A7A6E] uppercase tracking-widest mt-1">{selectedStudent.email}</p>
              </div>
              <button onClick={() => setSelectedStudent(null)} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors">
                <X size={20} />
              </button>
            </header>

            <div className="p-8 overflow-y-auto flex-1">
              {loadingModal ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-10 h-10 border-4 border-[#EFF4F1] border-t-[#556B5F] rounded-full animate-spin"></div>
                  <p className="mt-4 text-sm font-bold text-[#7A7A6E]">Aggregating Clinical Profile...</p>
                </div>
              ) : deepDiveData && (
                <>
                  {/* Top Metrics Row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div className="bg-white p-6 rounded-[2rem] border shadow-sm flex flex-col" style={{ borderColor: S.border }}>
                       <Activity className="text-[#556B5F] mb-4" size={24} />
                       <span className="text-3xl font-black mb-1">{deepDiveData.quizCount}</span>
                       <span className="text-[10px] uppercase tracking-wider font-bold text-[#7A7A6E]">Assessments Taken</span>
                    </div>
                    <div className="bg-white p-6 rounded-[2rem] border shadow-sm flex flex-col" style={{ borderColor: S.border }}>
                       <Target className="text-[#D97706] mb-4" size={24} />
                       <span className="text-3xl font-black mb-1">{deepDiveData.streak} <span className="text-lg opacity-50">Days</span></span>
                       <span className="text-[10px] uppercase tracking-wider font-bold text-[#7A7A6E]">Active Log Streak</span>
                    </div>
                    <div className="bg-white p-6 rounded-[2rem] border shadow-sm flex flex-col" style={{ borderColor: S.border }}>
                       <MessageSquare className="text-[#DC2626] mb-4" size={24} />
                       <span className="text-3xl font-black mb-1">{deepDiveData.avgMood}</span>
                       <span className="text-[10px] uppercase tracking-wider font-bold text-[#7A7A6E]">Avg Mood (30D)</span>
                    </div>
                  </div>

                  {/* Latest Report Section */}
                  <h3 className="text-lg font-black mb-4 flex justify-between items-end">
                    Latest Assessment Breakdown 
                    {deepDiveData.latestReport && (
                      <span className="text-xs font-bold text-[#7A7A6E] uppercase tracking-widest">{new Date(deepDiveData.latestReport.createdAt).toLocaleDateString()}</span>
                    )}
                  </h3>
                  
                  {deepDiveData.latestReport ? (
                    <div className="bg-white border rounded-[2rem] p-8 shadow-sm" style={{ borderColor: S.border }}>
                      
                      {/* Score Badge */}
                      <div className="mb-8 p-4 rounded-xl border border-[#556B5F] bg-[#EFF4F1] flex justify-between items-center">
                         <span className="text-sm font-black uppercase tracking-widest text-[#556B5F]">Assessment Score</span>
                         <span className="text-xl font-black text-[#2C2C2C]">{deepDiveData.latestReport.total_score} <span className="text-sm text-[#7A7A6E] font-medium">/ 27</span></span>
                      </div>

                      {/* AI Sentiment */}
                      {deepDiveData.latestReport.ai_sentiment_analysis && (
                        <div className="mb-8 bg-[#EFF4F1] p-6 rounded-3xl border border-[#556B5F]/20">
                          <h4 className="text-xs font-black uppercase text-[#556B5F] tracking-widest mb-3">AI Pattern Insight</h4>
                          <p className="text-sm font-medium leading-relaxed text-[#2C2C2C]">
                             {deepDiveData.latestReport.ai_sentiment_analysis}
                          </p>
                        </div>
                      )}

                      {/* Question Details */}
                      <h4 className="text-xs font-black uppercase text-[#7A7A6E] tracking-widest mb-4">Diagnostic Responses</h4>
                      <div className="space-y-4">
                        {deepDiveData.latestReport.responses?.map((q, i) => {
                          console.log(`[AdminStudents.jsx] -> Item ${i} has text_answer: ${q.text_answer}`);
                          const hasText = q.text_answer && q.text_answer.trim().length > 0;
                          return (
                          <div key={i} className="flex flex-col py-4 border-b last:border-0 gap-3" style={{ borderColor: S.border }}>
                            <div className="flex flex-col md:flex-row md:justify-between gap-4">
                              <span className="text-sm font-bold max-w-xl leading-tight">{q.question}</span>
                              <span className="text-sm bg-gray-50 px-3 py-1 rounded-lg border font-medium whitespace-nowrap self-start">
                                {q.selected_option}
                              </span>
                            </div>
                            {hasText ? (
                               <div className="bg-gray-50 rounded-md p-3 border border-gray-100 text-sm italic text-[#7A7A6E]">
                                 "{q.text_answer}"
                               </div>
                            ) : (
                               <div className="bg-gray-50/50 rounded-md p-2 text-xs text-gray-400 italic">
                                 [No qualitative text provided]
                               </div>
                            )}
                          </div>
                        )})}
                      </div>

                    </div>
                  ) : (
                    <div className="bg-gray-50 p-6 rounded-[2rem] text-center border">
                      <p className="text-sm text-[#7A7A6E] font-medium">No assessment records found for this student.</p>
                    </div>
                  )}

                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
