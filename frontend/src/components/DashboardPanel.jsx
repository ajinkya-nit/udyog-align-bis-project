import React from 'react';
import { AlertTriangle, CheckCircle, XCircle, FileBadge2, Landmark, Gauge } from 'lucide-react';

const DashboardPanel = ({ sessionData }) => {
  const { readinessScore, isCode, checklist, subsidyCategory, productName } = sessionData;

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 50) return 'text-amber-500';
    return 'text-red-500';
  };

  const getStatusIcon = (status) => {
    if (status === 'green') return <CheckCircle className="text-green-500" size={20} />;
    if (status === 'yellow') return <AlertTriangle className="text-amber-500" size={20} />;
    return <XCircle className="text-red-500" size={20} />;
  };

  if (!isCode) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 mt-24">
        <div className="w-24 h-24 bg-slate-200 rounded-full flex items-center justify-center mb-6 shadow-inner">
          <Gauge className="text-slate-400" size={48} />
        </div>
        <h3 className="text-xl font-bold text-slate-700 mb-2">Awaiting Context</h3>
        <p className="text-slate-500 max-w-sm">
          Please tell the AI Interrogator what product you manufacture to begin mapping your BIS standards.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Top Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-3xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] border border-slate-100 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Readiness</span>
            <Gauge className={getScoreColor(readinessScore)} size={24} />
          </div>
          <div className="flex items-end space-x-2">
            <span className={`text-5xl font-black ${getScoreColor(readinessScore)} tracking-tight`}>
              {readinessScore}%
            </span>
          </div>
          <div className="w-full bg-slate-100 h-2 mt-4 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-1000 ${readinessScore >= 80 ? 'bg-green-500' : readinessScore >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
              style={{ width: `${readinessScore}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-500 to-primary-600 p-5 rounded-3xl shadow-lg shadow-primary-500/20 text-white flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2 opacity-80">
            <span className="text-sm font-semibold uppercase tracking-wider">Target IC Code</span>
            <FileBadge2 size={24} />
          </div>
          <div>
            <div className="text-3xl font-black tracking-tight mb-1">{isCode}</div>
            <div className="text-indigo-100 font-medium text-sm line-clamp-2">{productName}</div>
          </div>
        </div>
      </div>

      {/* Gap Analysis Checklist */}
      <div className="bg-white rounded-3xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-bold text-slate-800">Gap Analysis Checklist</h3>
          <p className="text-xs text-slate-500 mt-1">Extracted from {isCode} scheme of testing</p>
        </div>
        <div className="divide-y divide-slate-100">
          {checklist.map((item, idx) => (
            <div key={idx} className="p-4 flex items-start space-x-4 hover:bg-slate-50 transition-colors">
              <div className="mt-0.5 flex-shrink-0">
                {getStatusIcon(item.status)}
              </div>
              <div>
                <h4 className="font-semibold text-slate-800 text-sm">{item.item}</h4>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed bg-slate-100 inline-block p-1.5 px-2 rounded-md border border-slate-200/60">
                  {item.suggestion}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Subsidy Calculator */}
      {subsidyCategory && (
        <div className="bg-emerald-50 rounded-3xl border border-emerald-200 p-5 mt-6 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 text-emerald-100 opacity-50">
            <Landmark size={120} />
          </div>
          <div className="relative z-10 text-emerald-900">
            <h3 className="font-bold text-emerald-800 flex items-center space-x-2">
              <Landmark size={18} />
              <span>Government Concession Authorized</span>
            </h3>
            <div className="mt-3 bg-white/60 backdrop-blur-sm p-4 rounded-2xl border border-emerald-100">
              <div className="flex justify-between items-center border-b border-emerald-100/50 pb-2 mb-2">
                <span className="text-sm font-medium text-emerald-700">Enterprise Scale</span>
                <span className="font-bold bg-emerald-200/50 px-2 py-0.5 rounded text-emerald-800 text-sm">{subsidyCategory} Unit</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-emerald-700">Certification Fee Discount</span>
                <span className="font-black text-lg text-emerald-600">80% OFF</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DashboardPanel;
