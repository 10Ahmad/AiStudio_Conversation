import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import ReactMarkdown from 'react-markdown';
import { BrainCircuit, Sparkles, BookOpen, Loader2 } from 'lucide-react';

export const SmartCurriculum: React.FC = () => {
  const [goal, setGoal] = useState('');
  const [level, setLevel] = useState('Intermediate');
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<string>('');

  const generatePlan = async () => {
    if (!goal) return;
    
    setLoading(true);
    setPlan('');
    
    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey) throw new Error("API Key missing");

      const ai = new GoogleGenAI({ apiKey });
      
      const prompt = `Create a detailed 7-day language learning study plan for a user at ${level} level.
      Their specific goal is: "${goal}".
      Include daily vocabulary, grammar focus, and a practical exercise.
      Format using Markdown with headers and bullet points.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
          thinkingConfig: { thinkingBudget: 32768 }, // Max thinking budget
        }
      });
      
      setPlan(response.text || "No plan generated.");

    } catch (e: any) {
      console.error(e);
      setPlan(`Error: ${e.message || 'Failed to generate plan'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 h-full overflow-y-auto max-w-5xl mx-auto">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-white flex items-center gap-3">
          <BrainCircuit className="text-purple-400" size={32} />
          Smart Curriculum
        </h2>
        <p className="text-slate-400 mt-2">
          Powered by Gemini 3 Pro with advanced reasoning. Describe your goal, and we'll engineer the perfect path.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input Section */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
            <label className="block text-sm font-medium text-slate-300 mb-2">Current Level</label>
            <select 
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none mb-4"
            >
              <option>Beginner (A1-A2)</option>
              <option>Intermediate (B1-B2)</option>
              <option>Advanced (C1-C2)</option>
            </select>

            <label className="block text-sm font-medium text-slate-300 mb-2">Learning Goal</label>
            <textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g., I'm visiting Tokyo in 2 weeks and need to order food and ask for directions."
              className="w-full h-32 bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none resize-none mb-4"
            />

            <button
              onClick={generatePlan}
              disabled={loading || !goal}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
              Generate Plan
            </button>
          </div>
          
          {loading && (
             <div className="bg-purple-900/20 border border-purple-500/30 p-4 rounded-xl text-purple-200 text-sm animate-pulse">
                Gemini is thinking deeply about your personalized curriculum... This may take a moment to ensure quality.
             </div>
          )}
        </div>

        {/* Output Section */}
        <div className="lg:col-span-2 min-h-[500px] bg-slate-800/30 rounded-2xl border border-slate-700/50 p-8">
          {plan ? (
            <div className="prose prose-invert prose-purple max-w-none">
                <ReactMarkdown>{plan}</ReactMarkdown>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50">
              <BookOpen size={64} className="mb-4" />
              <p>Your custom study plan will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
