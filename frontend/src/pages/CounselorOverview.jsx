import React from 'react';
import { LayoutGrid, Users, ClipboardList, Briefcase, Heart } from 'lucide-react';

const S = {
  sage: '#556B5F',
  sageLight: '#EFF4F1',
  charcoal: '#2C2C2C',
  muted: '#7A7A6E',
  border: '#E0D9CE',
  white: '#FFFFFF',
};

export default function CounselorOverview({ user, stats = {} }) {
  console.log(`[CounselorOverview.jsx] -> Rendering personalized greeting for ${user?.full_name || 'Counselor'}.`);

  return (
    <div className="max-w-5xl animate-in fade-in duration-500">
      <header className="mb-12">
        <h1 className="text-4xl font-black mb-2 text-[#2C2C2C]">
          Welcome Back, {user?.full_name || 'Counselor'}
          {console.log(`[CounselorOverview] -> Greeting rendered with Name: ${user?.full_name || 'Counselor'}.`)}
        </h1>
        <p className="text-[#7A7A6E] text-base font-medium">
          Here's what's happening across your institute today.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm hover:shadow-md transition-all group" style={{ borderColor: S.border }}>
          <div className="w-12 h-12 rounded-2xl bg-[#EFF4F1] border flex items-center justify-center mb-6 group-hover:scale-110 transition-transform" style={{ borderColor: S.border }}>
            <Users className="text-[#556B5F]" />
          </div>
          <p className="text-4xl font-black mb-1">{stats.studentCount ?? '...'}</p>
          <p className="text-xs font-black uppercase tracking-widest text-[#7A7A6E]">Your Caseload</p>
          <p className="text-[10px] text-[#7A7A6E] mt-2 italic">Active Students</p>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm hover:shadow-md transition-all group" style={{ borderColor: S.border }}>
          <div className="w-12 h-12 rounded-2xl bg-[#EFF4F1] border flex items-center justify-center mb-6 group-hover:scale-110 transition-transform" style={{ borderColor: S.border }}>
            <ClipboardList className="text-[#556B5F]" />
          </div>
          <p className="text-4xl font-black mb-1">{stats.pendingRequests ?? '...'}</p>
          <p className="text-xs font-black uppercase tracking-widest text-[#7A7A6E]">Support Queue</p>
          <p className="text-[10px] text-[#7A7A6E] mt-2 italic">Pending Requests</p>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm hover:shadow-md transition-all group" style={{ borderColor: S.border }}>
          <div className="w-12 h-12 rounded-2xl bg-[#EFF4F1] border flex items-center justify-center mb-6 group-hover:scale-110 transition-transform" style={{ borderColor: S.border }}>
            <Heart className="text-[#556B5F]" />
          </div>
          <p className="text-4xl font-black mb-1">{stats.avgRisk ?? '...'}</p>
          <p className="text-xs font-black uppercase tracking-widest text-[#7A7A6E]">Risk Context</p>
          <p className="text-[10px] text-[#7A7A6E] mt-2 italic">Avg. Severity</p>
        </div>
      </div>
      
      <div className="bg-white p-10 rounded-[3rem] border border-[#E0D9CE]">
         <h3 className="font-black text-xl text-[#2C2C2C] mb-4">Daily Overview</h3>
         <p className="text-[#7A7A6E] text-sm leading-relaxed mb-6">
           Your student list is up-to-date with the latest quiz results. 
           Check the 'Requests' tab for any new students who need urgent support.
         </p>
         <div className="flex gap-4">
            <div className="flex-1 p-6 bg-[#EFF4F1] rounded-3xl border border-[#556B5F]/10">
               <span className="text-[10px] font-black uppercase text-[#556B5F] block mb-2">Sync Status</span>
               <p className="text-xs font-bold text-[#556B5F]">AI Analysis is now identical to what the Admin sees.</p>
            </div>
            <div className="flex-1 p-6 bg-[#FDFBF7] rounded-3xl border border-[#E0D9CE]">
               <span className="text-[10px] font-black uppercase text-[#7A7A6E] block mb-2">Data Privacy</span>
               <p className="text-xs font-bold text-[#7A7A6E]">All student records are correctly filtered for your current institute.</p>
            </div>
         </div>
      </div>
    </div>
  );
}

console.log("[CounselorOverview.jsx] -> User Interface simplified. Jargon removed for better readability.");
