import React, { useState } from 'react';
import { Navigation } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { LiveTutor } from './components/LiveTutor';
import { AppView } from './types';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);

  const renderContent = () => {
    switch (currentView) {
      case AppView.DASHBOARD:
        return <Dashboard />;
      case AppView.LIVE_TUTOR:
        return <LiveTutor />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-900 text-slate-200 font-sans selection:bg-cyan-500/30">
      <Navigation currentView={currentView} onNavigate={setCurrentView} />
      
      <main className="flex-1 h-full overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 pointer-events-none -z-10" />
        
        {/* Subtle animated background mesh */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none -z-10" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none -z-10" />

        <div className="h-full overflow-y-auto custom-scrollbar">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}