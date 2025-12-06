import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Clapperboard, Video as VideoIcon, Loader, RefreshCw, AlertTriangle } from 'lucide-react';
import { arrayBufferToBase64 } from '../utils/audio';

export const VisualImmersion: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [hasKey, setHasKey] = useState<boolean>(false);
  const [loadingKey, setLoadingKey] = useState(true);

  // Check for Veo Key
  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio && window.aistudio.hasSelectedApiKey) {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasKey(selected);
      }
      setLoadingKey(false);
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
      if (window.aistudio && window.aistudio.openSelectKey) {
          await window.aistudio.openSelectKey();
          const selected = await window.aistudio.hasSelectedApiKey();
          setHasKey(selected);
      }
  };

  const generateVideo = async () => {
    if (!prompt) return;
    setGenerating(true);
    setVideoUrl(null);

    try {
      // Create new instance to ensure key is fresh
      const apiKey = process.env.API_KEY;
      if (!apiKey) throw new Error("API Key missing");
      const ai = new GoogleGenAI({ apiKey });

      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        config: {
          numberOfVideos: 1,
          resolution: '1080p',
          aspectRatio: '16:9'
        }
      });

      // Poll for completion
      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await ai.operations.getVideosOperation({ operation });
      }

      const uri = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (uri) {
        // Must fetch blob with key to display in video tag
        const videoRes = await fetch(`${uri}&key=${apiKey}`);
        const blob = await videoRes.blob();
        setVideoUrl(URL.createObjectURL(blob));
      }

    } catch (e: any) {
      console.error(e);
      if (e.message?.includes("Requested entity was not found")) {
          setHasKey(false); // Reset key state if invalid
      }
      alert("Video generation failed: " + e.message);
    } finally {
      setGenerating(false);
    }
  };

  if (loadingKey) return <div className="p-10 text-white">Checking access...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-white flex items-center gap-3">
          <Clapperboard className="text-cyan-400" size={32} />
          Visual Immersion
        </h2>
        <p className="text-slate-400 mt-2">
          Generate short video clips to visualize contexts. "A busy market in Marrakech" or "A quiet library in Oxford".
        </p>
      </header>

      {!hasKey ? (
        <div className="bg-yellow-900/20 border border-yellow-600/50 p-6 rounded-xl text-center">
            <AlertTriangle className="mx-auto text-yellow-500 mb-2" size={32} />
            <h3 className="text-xl font-bold text-white mb-2">Access Required</h3>
            <p className="text-slate-300 mb-4">Veo video generation requires a specific paid project selection.</p>
            <div className="mb-4 text-sm text-slate-400">
                <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="underline hover:text-white">Read about billing</a>
            </div>
            <button 
                onClick={handleSelectKey}
                className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
            >
                Select Paid Project
            </button>
        </div>
      ) : (
        <div className="space-y-6">
            <div className="flex gap-3">
                <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe a scene (e.g., 'A futuristic Tokyo street with neon signs in rain')"
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
                <button
                onClick={generateVideo}
                disabled={generating || !prompt}
                className="bg-cyan-600 hover:bg-cyan-700 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                {generating ? <RefreshCw className="animate-spin" /> : <VideoIcon />}
                Generate
                </button>
            </div>

            <div className="aspect-video bg-black rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center relative">
                {generating && (
                    <div className="text-center">
                        <Loader className="w-10 h-10 text-cyan-500 animate-spin mx-auto mb-4" />
                        <p className="text-cyan-400 font-medium animate-pulse">Generating video with Veo...</p>
                        <p className="text-slate-500 text-sm mt-2">This may take a minute.</p>
                    </div>
                )}
                
                {!generating && !videoUrl && (
                    <div className="text-slate-600 flex flex-col items-center">
                        <Clapperboard size={64} className="mb-4 opacity-30" />
                        <p>Your immersive video will play here</p>
                    </div>
                )}

                {videoUrl && !generating && (
                    <video 
                        src={videoUrl} 
                        controls 
                        autoPlay 
                        loop 
                        className="w-full h-full object-cover"
                    />
                )}
            </div>
        </div>
      )}
    </div>
  );
};
