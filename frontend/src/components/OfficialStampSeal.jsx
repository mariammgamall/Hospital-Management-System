import React from 'react';

/**
 * Reusable Official Hospital Stamp & Seal Component
 * Rendered on printed medical documents (Prescriptions, Invoices, EMR files, Lab Reports, Discharge Summaries)
 */
export default function OfficialStampSeal({ 
  doctorName = "Dr. Ahmed Mostafa", 
  roleTitle = "Senior Consultant & Clinical Supervisor",
  issueDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
  docRef = "HMS-CERT-2026-8819"
}) {
  return (
    <div className="mt-6 pt-4 border-t border-slate-300 grid grid-cols-2 items-end gap-6 select-none print:break-inside-avoid">
      {/* Left: Doctor / Officer Signature */}
      <div className="space-y-1">
        <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Authorized Clinical Signature</div>
        <div className="h-12 flex items-center pl-2">
          {/* Simulated Cursive Doctor Signature SVG */}
          <svg className="w-36 h-10 text-slate-800" viewBox="0 0 200 60" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 40 Q 30 10, 50 35 T 90 20 T 130 45 T 170 15" />
            <path d="M30 45 Q 60 55, 110 45" />
            <path d="M120 25 L 140 40 L 160 20" />
          </svg>
        </div>
        <div className="text-xs font-bold text-slate-800">{doctorName}</div>
        <div className="text-[10px] text-slate-500 font-medium">{roleTitle}</div>
      </div>

      {/* Right: Official Certified Hospital Rubber Stamp Seal */}
      <div className="flex justify-end">
        <div className="relative w-32 h-32 rounded-full border-4 border-double border-emerald-700/80 p-1 flex flex-col items-center justify-center text-center transform -rotate-6 shadow-sm bg-emerald-50/20 print:bg-transparent">
          {/* Inner ring */}
          <div className="w-full h-full rounded-full border border-dashed border-emerald-700/60 flex flex-col items-center justify-center p-1 space-y-0.5">
            <div className="text-[7px] uppercase font-black tracking-widest text-emerald-800">★ OFFICIAL CERTIFIED ★</div>
            <div className="text-[9px] font-extrabold uppercase tracking-tight text-emerald-900 leading-none">HOSPITAL MEDICAL</div>
            <div className="text-[8px] font-black uppercase text-emerald-700 tracking-wider">SEAL & STAMP</div>
            <div className="text-[8px] font-bold text-emerald-800 border-t border-b border-emerald-600/40 py-0.5 px-1 my-0.5">
              {issueDate}
            </div>
            <div className="text-[7px] font-semibold text-emerald-700 font-mono">{docRef}</div>
            <div className="text-[6px] font-black tracking-widest text-emerald-800 uppercase">VALIDATED</div>
          </div>
        </div>
      </div>
    </div>
  );
}
