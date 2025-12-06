import React from 'react';
import { AppView } from '../types';
import { 
  LayoutDashboard, 
  Mic
} from 'lucide-react';

interface NavigationProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentView, onNavigate }) => {
  const navItems = [
    { id: AppView.DASHBOARD, label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: AppView.LIVE_TUTOR, label: 'Live Tutor', icon: <Mic size={20} /> },
  ];

  return (
    <nav className="w-20 lg:w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full shrink-0 transition-all duration-300">
      <div className="p-6 flex items-center justify-center lg:justify-start gap-3 border-b border-slate-800">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
          S
        </div>
        <span className="font-bold text-xl text-white hidden lg:block tracking-tight">Soulingo</span>
      </div>
      
      <div className="flex-1 py-6 space-y-2 px-3">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${
              currentView === item.id 
                ? 'bg-slate-800 text-cyan-400 shadow-lg shadow-cyan-900/20' 
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
            }`}
          >
            <span className={`${currentView === item.id ? 'text-cyan-400' : 'text-slate-400 group-hover:text-white'}`}>
              {item.icon}
            </span>
            <span className="font-medium hidden lg:block">{item.label}</span>
            {currentView === item.id && (
              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400 hidden lg:block shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
            )}
          </button>
        ))}
      </div>

      <div className="p-4 border-t border-slate-800">
        <div className="p-4 rounded-xl bg-gradient-to-br from-purple-900/40 to-slate-800 border border-purple-500/20">
          <p className="text-xs text-purple-200 font-medium mb-1 hidden lg:block">Pro Member</p>
          <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden hidden lg:block">
            <div className="bg-gradient-to-r from-cyan-400 to-purple-500 w-3/4 h-full" />
          </div>
        </div>
      </div>
    </nav>
  );
};