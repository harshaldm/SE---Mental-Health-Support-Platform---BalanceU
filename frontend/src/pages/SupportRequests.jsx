import React from 'react';
import { Inbox, Eye, CheckCircle, Clock, XCircle, X } from 'lucide-react';
import axios from 'axios';
import { BASE_URL } from '../config/apiConfig';

const API = BASE_URL;

// ─── Status Badge ──────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const cfg = {
    active:   { icon: <CheckCircle size={12} />, label: 'Active',   cls: 'bg-primary/10 text-primary' },
    pending:  { icon: <Clock size={12} />,        label: 'Pending',  cls: 'bg-amber-100 text-amber-700' },
    rejected: { icon: <XCircle size={12} />,      label: 'Rejected', cls: 'bg-error/10 text-error' },
    accepted: { icon: <CheckCircle size={12} />, label: 'Accepted', cls: 'bg-primary/10 text-primary' },
  }[status] || { icon: null, label: status, cls: 'bg-surface-variant text-on-surface-variant' };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${cfg.cls}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
};

// ─── Assessment Modal ───────────────────────────────────────────────────────
export const AssessmentModal = ({ assessment, onClose, token }) => {
  if (!assessment) return null;

  const responses = assessment.answers || assessment.responses || [];
  console.log(`[SupportRequests.jsx] -> Analysis logic synced with Admin-parity data.`);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#FDFBF7] w-full max-w-2xl max-h-[85vh] rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl border border-[#E0D9CE]">
        <div className="p-6 border-b border-[#E0D9CE] flex justify-between items-center bg-[#556B5F] text-white">
          <div>
            <h2 className="text-xl font-bold">Detailed Clinical View</h2>
            <p className="text-sm opacity-80">Student: {assessment.studentName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* AI Pattern Insight */}
          <div className="bg-[#EFF4F1] p-6 rounded-[2rem] border border-[#556B5F]/20 relative overflow-hidden">
             <div className="flex items-center gap-2 mb-2 text-[#556B5F]">
               <CheckCircle size={16} />
               <h4 className="text-[10px] font-black uppercase tracking-widest">AI Pattern Insight</h4>
             </div>
             <p className="text-sm italic text-[#2C2C2C] leading-relaxed">
               {assessment.ai_analysis || `Strategic analysis pending for ${assessment.studentName}. Base risk indicates ${assessment.riskLevel}.`}
             </p>
          </div>

          <div className="flex gap-4">
             <div className="bg-white p-4 rounded-2xl border border-[#E0D9CE] flex-1">
               <p className="text-xs font-bold text-[#7A7A6E] uppercase mb-1">Total Score</p>
               <p className="text-2xl font-black text-[#556B5F]">{assessment.score}</p>
             </div>
             <div className="bg-white p-4 rounded-2xl border border-[#E0D9CE] flex-1">
               <p className="text-xs font-bold text-[#7A7A6E] uppercase mb-1">Risk Level</p>
               <p className={`text-xl font-black ${
                 assessment.riskLevel?.toLowerCase().includes('high') || assessment.riskLevel?.toLowerCase().includes('severe') ? 'text-error' : 'text-[#556B5F]'
               }`}>{assessment.riskLevel}</p>
             </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-[#2C2C2C] border-l-4 border-[#556B5F] pl-3">Diagnostic Breakdown</h3>
            {assessment.loading ? (
                <div className="text-center py-12 text-[#7A7A6E] font-bold animate-pulse">Syncing Admin-parity clinical data...</div>
            ) : responses.length === 0 ? (
                <p className="text-[#7A7A6E] text-center py-4 italic">No detailed responses available for this assessment.</p>
            ) : responses.map((item, idx) => (
              <div key={idx} className="bg-white p-5 rounded-2xl border border-[#E0D9CE] shadow-sm">
                <p className="font-bold text-[#2C2C2C] mb-3 text-sm">Q{idx + 1}: {item.question}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="bg-[#EFF4F1] p-3 rounded-xl border border-[#556B5F]/10">
                    <p className="text-[10px] font-bold text-[#556B5F] uppercase mb-1">Response</p>
                    <p className="font-semibold text-[#2C2C2C] text-xs">{item.selected_option || item.choiceLabel || item.label || item.choice || `Score: ${item.score}`}</p>
                  </div>
                  <div className="bg-[#FDFBF7] p-3 rounded-xl border border-[#E0D9CE]">
                    <p className="text-[10px] font-bold text-[#7A7A6E] uppercase mb-1">Reflection</p>
                    <p className="text-[#2C2C2C] italic text-xs">{item.text_answer || item.text || item.comment || 'No reflection provided.'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {console.log(`[SupportRequests.jsx] -> Prescribe Resource section removed (Migration to Caseload complete).`)}
        </div>
        
        <div className="p-6 border-t border-[#E0D9CE] flex justify-end">
          <button onClick={onClose} className="bg-[#556B5F] text-white px-8 py-3 rounded-full font-bold hover:bg-[#44554b] transition-colors shadow-lg">
            Close View
          </button>
        </div>
      </div>
    </div>
  );
};

export default function SupportRequests({ 
  requests, 
  respondToRequest, 
  respondingId, 
  openAssessment,
  setActiveChat,
  selectedAssessment,
  setSelectedAssessment,
  token
}) {
  return (
    <>
      <div className="bg-white rounded-[2.5rem] border border-[#E0D9CE] p-8 shadow-sm h-full flex flex-col">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-3 shrink-0"><Inbox size={22} className="text-[#556B5F]" /> Incoming Requests</h3>
        
        <div className="flex-1 overflow-y-auto pr-2">
            {requests.length === 0 ? (
                <div className="text-center py-24 border-2 border-dashed border-[#E0D9CE] rounded-[2rem]">
                   <p className="text-[#7A7A6E] font-bold italic">No active support requests at this time.</p>
                   <p className="text-[10px] text-[#7A7A6E] uppercase tracking-widest mt-2">Check back later for new applications</p>
                </div>
            ) : (
                <div className="space-y-4">
                {requests.map(req => (
                    <div key={req.id} className="bg-[#FDFBF7] p-8 rounded-[2rem] border border-[#E0D9CE] hover:border-[#556B5F] hover:shadow-xl transition-all relative overflow-hidden group">
                    {console.log(`[SupportRequests.jsx] -> Rendering incoming request with full Clinical Logic for Student ${req.student?.id}.`)}
                    
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-[#556B5F] text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-[#556B5F]/20">
                                {(req.student?.name || 'S')[0].toUpperCase()}
                            </div>
                            <div>
                                <h4 className="font-black text-[#2C2C2C] text-xl leading-tight">{req.student?.name}</h4>
                                <p className="text-xs text-[#7A7A6E] mb-2">{req.student?.email}</p>
                                <div className="flex gap-2">
                                   <span className="px-3 py-1 bg-white border border-[#E0D9CE] rounded-full text-[10px] font-black text-[#556B5F] uppercase tracking-tighter shadow-sm">
                                      📊 Score: {req.score ?? 'N/A'}
                                   </span>
                                   <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-sm ${
                                      req.score <= 9 ? 'bg-[#556B5F]/10 text-[#556B5F]' : 
                                      req.score <= 18 ? 'bg-amber-100 text-amber-700' : 'bg-error/10 text-error'
                                   }`}>
                                      {req.score <= 9 ? 'Low Risk' : req.score <= 18 ? 'Moderate Risk' : 'Severe Risk'}
                                   </span>
                                </div>
                            </div>
                        </div>
                        <button 
                            onClick={() => openAssessment(req)} 
                            className="bg-white p-3 rounded-2xl border border-[#E0D9CE] text-[#556B5F] hover:bg-[#556B5F] hover:text-white transition-all shadow-sm group-hover:scale-105"
                            title="View Detailed Analysis"
                        >
                            <Eye size={20} />
                        </button>
                    </div>

                    <div className="flex gap-3 mt-6 border-t border-[#E0D9CE] pt-6">
                        <button 
                            onClick={() => respondToRequest(req.id, 'accepted')} 
                            disabled={respondingId === req.id} 
                            className="flex-1 bg-[#556B5F] text-white py-4 rounded-2xl font-black text-sm hover:bg-[#44554b] transition-all shadow-lg shadow-[#556B5F]/20 disabled:opacity-50"
                        >
                            {respondingId === req.id ? 'Processing...' : 'Accept to Caseload'}
                        </button>
                        <button 
                            onClick={() => respondToRequest(req.id, 'rejected')} 
                            disabled={respondingId === req.id} 
                            className="px-6 bg-white border border-error text-error py-4 rounded-2xl font-black text-xs hover:bg-error/5 transition-all disabled:opacity-50"
                        >
                            Decline
                        </button>
                    </div>
                    </div>
                ))}
                </div>
            )}
        </div>
      </div>

      <AssessmentModal assessment={selectedAssessment} onClose={() => setSelectedAssessment(null)} token={token} />
    </>
  );
}
