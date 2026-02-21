import React, { useState } from 'react';
import ChatPanel from './components/ChatPanel';
import DashboardPanel from './components/DashboardPanel';

function App() {
  const [sessionData, setSessionData] = useState({
    readinessScore: 0,
    isCode: null,
    checklist: [],
    subsidyCategory: null,
    productName: '',
  });

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans overflow-hidden">
      {/* Left Panel: AI Interrogator (Chat & Upload) */}
      <div className="w-1/2 flex flex-col border-r border-gray-200 bg-white shadow-sm z-10">
        <header className="p-4 border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0">
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-indigo-600 bg-clip-text text-transparent">
            UDYOG ALIGN
          </h1>
          <p className="text-xs text-gray-500 font-medium tracking-wide update-status">
            AI Compliance Consultant
          </p>
        </header>
        
        <main className="flex-1 overflow-hidden relative">
          <ChatPanel sessionData={sessionData} setSessionData={setSessionData} />
        </main>
      </div>

      {/* Right Panel: Live Dashboard */}
      <div className="w-1/2 flex flex-col bg-slate-50 relative overflow-y-auto">
        <header className="p-4 border-b border-gray-200 bg-slate-100/50 backdrop-blur-sm sticky top-0 z-10">
          <h2 className="text-lg font-semibold text-slate-800">
            Live Readiness Dashboard
          </h2>
          <p className="text-sm text-slate-500">Real-time analysis & compliance tracking</p>
        </header>
        
        <div className="p-6">
          <DashboardPanel sessionData={sessionData} />
        </div>
      </div>
    </div>
  );
}

export default App;
