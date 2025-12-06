import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { Trophy, Flame, Target, Star } from 'lucide-react';

const data = [
  { name: 'Mon', score: 65, accuracy: 70 },
  { name: 'Tue', score: 72, accuracy: 75 },
  { name: 'Wed', score: 68, accuracy: 72 },
  { name: 'Thu', score: 85, accuracy: 82 },
  { name: 'Fri', score: 82, accuracy: 88 },
  { name: 'Sat', score: 90, accuracy: 92 },
  { name: 'Sun', score: 95, accuracy: 94 },
];

export const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Welcome back, Alex!</h1>
        <p className="text-slate-400">You're on a 12-day streak. Keep the momentum going.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total XP', value: '12,450', icon: <Star className="text-yellow-400" />, change: '+12%' },
          { label: 'Day Streak', value: '12', icon: <Flame className="text-orange-500" />, change: 'Best: 45' },
          { label: 'Words Learned', value: '843', icon: <Target className="text-cyan-400" />, change: '+24 this week' },
          { label: 'Fluency Score', value: 'B2', icon: <Trophy className="text-purple-500" />, change: 'Intermediate' },
        ].map((stat, i) => (
          <div key={i} className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700/50 backdrop-blur-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-slate-800 rounded-lg">{stat.icon}</div>
              <span className="text-xs font-medium text-slate-400 bg-slate-800 px-2 py-1 rounded-full">{stat.change}</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">{stat.value}</h3>
            <p className="text-sm text-slate-400">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 flex flex-col">
          <h2 className="text-lg font-semibold text-white mb-6">Pronunciation Accuracy</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" tick={{fill: '#64748b'}} axisLine={false} tickLine={false} />
                <YAxis stroke="#64748b" tick={{fill: '#64748b'}} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  itemStyle={{ color: '#e2e8f0' }}
                />
                <Area type="monotone" dataKey="score" stroke="#22d3ee" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-900 to-slate-900 p-6 rounded-2xl border border-purple-500/30 relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-lg font-semibold text-white mb-4">Daily Challenge</h2>
            <p className="text-purple-200 mb-6 text-sm">Complete a 5-minute conversation with the AI tutor about your favorite travel destination.</p>
            <button className="w-full py-3 bg-white text-purple-900 rounded-xl font-bold hover:bg-purple-50 transition-colors shadow-lg shadow-purple-900/50">
              Start Challenge
            </button>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl transform translate-x-10 -translate-y-10" />
        </div>
      </div>
    </div>
  );
};