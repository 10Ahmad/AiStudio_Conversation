import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { Mic, MicOff, Power, PowerOff, Wand2, Loader2, X, Volume2 } from 'lucide-react';
import { createPcmBlob, decodeAudioData, base64ToUint8Array } from '../utils/audio';

// Default placeholder avatar
const DEFAULT_AVATAR = "https://raw.githubusercontent.com/d-id/d-id-sdk-client/main/assets/avatar.jpg";

export const LiveTutor: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState(DEFAULT_AVATAR);
  
  // Avatar Generation State
  const [showGenModal, setShowGenModal] = useState(false);
  const [genPrompt, setGenPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Audio & Session Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef<number>(0);
  const avatarImgRef = useRef<HTMLImageElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>(0);
  const sourceNodesRef = useRef<AudioBufferSourceNode[]>([]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectSession();
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  // Animation Loop for Avatar Lip Sync
  const animateAvatar = () => {
    if (!analyserRef.current || !avatarImgRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Calculate average volume
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    const average = sum / dataArray.length;
    
    // Apply transform based on volume
    // Scale Y up and X down slightly to simulate jaw opening
    const scaleY = 1 + (average / 255) * 0.2; // Max 1.2 scale
    const scaleX = 1 - (average / 255) * 0.1; // Max 0.9 scale
    
    avatarImgRef.current.style.transform = `scale(${scaleX}, ${scaleY})`;
    
    animationFrameRef.current = requestAnimationFrame(animateAvatar);
  };

  const connectSession = async () => {
    if (isConnected) return;

    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey) throw new Error("API Key missing");
      const ai = new GoogleGenAI({ apiKey });

      // 1. Setup Audio Contexts
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      inputContextRef.current = new AudioContext({ sampleRate: 16000 });
      
      // Setup Analyser for Animation
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.5;

      // 2. Start Live Session
      const session = await ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: "You are a friendly, helpful English language tutor. Your goal is to have a natural, spoken conversation with the user to help them practice. Keep responses concise and encouraging.",
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
          }
        },
        callbacks: {
          onopen: async () => {
            console.log("Session connected");
            setIsConnected(true);
            
            // Start Animation Loop
            animateAvatar();

            // Start Microphone Stream
            try {
              const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
              const source = inputContextRef.current!.createMediaStreamSource(stream);
              const processor = inputContextRef.current!.createScriptProcessor(4096, 1, 1);
              
              processor.onaudioprocess = (e) => {
                // Only send if mic is logically on
                // We use a ref or check state in a way that works inside callback
                // For simplicity, we'll just send data and handle muting by not processing if needed, 
                // but usually disconnecting the node is better. Here we assume constant stream.
                const inputData = e.inputBuffer.getChannelData(0);
                const pcmBlob = createPcmBlob(inputData);
                session.sendRealtimeInput({ media: pcmBlob });
              };
              
              source.connect(processor);
              processor.connect(inputContextRef.current!.destination);
            } catch (err) {
              console.error("Microphone access error:", err);
            }
          },
          onmessage: async (msg: LiveServerMessage) => {
            // Handle Audio Output
            const base64Audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio && audioContextRef.current) {
              const ctx = audioContextRef.current;
              const buffer = await decodeAudioData(
                base64ToUint8Array(base64Audio),
                ctx,
                24000
              );
              
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              
              // Connect to analyser for animation AND destination for hearing
              source.connect(analyserRef.current!); 
              analyserRef.current!.connect(ctx.destination);

              // Schedule playback
              // Ensure smooth playback by scheduling next chunk at the end of the last
              if (nextStartTimeRef.current < ctx.currentTime) {
                nextStartTimeRef.current = ctx.currentTime;
              }
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              
              sourceNodesRef.current.push(source);
              source.onended = () => {
                sourceNodesRef.current = sourceNodesRef.current.filter(s => s !== source);
              };
            }
          },
          onclose: () => {
            console.log("Session closed");
            setIsConnected(false);
          },
          onerror: (err) => {
            console.error("Session error:", err);
            setIsConnected(false);
          }
        }
      });
      
      sessionRef.current = session;

    } catch (e: any) {
      console.error(e);
      alert("Failed to connect: " + e.message);
      setIsConnected(false);
    }
  };

  const disconnectSession = () => {
    if (sessionRef.current) {
      // There is no explicit close method on the session promise result wrapper in some versions,
      // but usually closing the socket is handled by the library or we just let it drop.
      // However, we MUST close AudioContexts.
      // The GenAI SDK LiveSession usually exposes a close method if awaited.
      // Since `connect` returns a promise that resolves to the session, we can try closing it if stored.
      // For now, we mainly focus on client-side cleanup.
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (inputContextRef.current) {
      inputContextRef.current.close();
      inputContextRef.current = null;
    }
    
    sourceNodesRef.current.forEach(node => node.stop());
    sourceNodesRef.current = [];
    nextStartTimeRef.current = 0;
    
    cancelAnimationFrame(animationFrameRef.current);
    setIsConnected(false);
    sessionRef.current = null;
  };

  const generateAvatar = async () => {
    if (!genPrompt.trim()) return;
    setIsGenerating(true);

    try {
        const apiKey = process.env.API_KEY;
        if (!apiKey) throw new Error("API Key missing");
        const ai = new GoogleGenAI({ apiKey });

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    { text: "Generate a friendly, high-quality, front-facing portrait of " + genPrompt + " on a simple background. The character should look like a language tutor." }
                ]
            }
        });

        let base64Data = null;
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                base64Data = part.inlineData.data;
                break;
            }
        }

        if (base64Data) {
            const newUrl = `data:image/png;base64,${base64Data}`;
            setAvatarUrl(newUrl);
            setShowGenModal(false);
            setGenPrompt('');
        } else {
            alert("No image generated.");
        }

    } catch (e: any) {
        console.error(e);
        alert("Generation failed: " + e.message);
    } finally {
        setIsGenerating(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-900">
        {/* Main Interface */}
        <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden p-6">
            
            {/* Connection Status */}
            <div className={`absolute top-6 right-6 flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md border ${
                isConnected ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-slate-800/50 border-slate-700 text-slate-400'
            }`}>
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-slate-500'}`} />
                <span className="text-sm font-medium">{isConnected ? 'Live Connected' : 'Disconnected'}</span>
            </div>

            {/* Avatar Display */}
            <div className="relative mb-12 group">
                {/* Glow Effect */}
                <div className={`absolute inset-0 rounded-full bg-cyan-500/20 blur-3xl transition-opacity duration-500 ${isConnected ? 'opacity-100' : 'opacity-0'}`} />
                
                <div className="w-64 h-64 md:w-80 md:h-80 rounded-full border-4 border-slate-700 overflow-hidden relative shadow-2xl bg-slate-950">
                    <img 
                        ref={avatarImgRef}
                        src={avatarUrl} 
                        alt="Tutor Avatar" 
                        className={`w-full h-full object-cover transition-transform duration-100 origin-bottom ${!isConnected ? 'grayscale opacity-70' : ''}`}
                    />
                </div>

                {/* Edit Button */}
                <button
                    onClick={() => setShowGenModal(true)}
                    className="absolute bottom-4 right-4 bg-slate-800 hover:bg-slate-700 text-white p-3 rounded-full shadow-lg border border-slate-600 transition-colors z-10"
                    title="Generate New Avatar"
                >
                    <Wand2 size={20} />
                </button>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-6">
                 {!isConnected ? (
                     <button 
                        onClick={connectSession}
                        className="flex items-center gap-3 bg-cyan-600 hover:bg-cyan-500 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-lg shadow-cyan-900/20 transition-all transform hover:scale-105"
                     >
                        <Power size={24} />
                        Start Conversation
                     </button>
                 ) : (
                     <div className="flex items-center gap-4 bg-slate-800/50 p-2 rounded-2xl border border-slate-700 backdrop-blur-sm">
                        <button
                            onClick={() => setIsMicOn(!isMicOn)}
                            className={`p-4 rounded-xl transition-all ${
                                isMicOn ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                            }`}
                        >
                            {isMicOn ? <Mic size={24} /> : <MicOff size={24} />}
                        </button>
                        
                        <div className="h-8 w-[1px] bg-slate-700 mx-2" />
                        
                        <button 
                            onClick={disconnectSession}
                            className="p-4 rounded-xl bg-red-600 hover:bg-red-500 text-white transition-colors shadow-lg shadow-red-900/20"
                        >
                            <PowerOff size={24} />
                        </button>
                     </div>
                 )}
            </div>

            {/* Instructions Hint */}
            <p className="mt-8 text-slate-400 text-sm max-w-md text-center">
                {isConnected 
                    ? "Speak naturally. The avatar will listen and respond in real-time." 
                    : "Connect to practice your English with a native-speaking AI tutor."}
            </p>
        </div>

        {/* Generate Avatar Modal */}
        {showGenModal && (
            <div className="absolute inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
                <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
                    <button 
                        onClick={() => !isGenerating && setShowGenModal(false)} 
                        className="absolute top-4 right-4 text-slate-400 hover:text-white"
                    >
                        <X size={24} />
                    </button>

                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-pink-500/10 rounded-xl">
                            <Wand2 className="text-pink-500" size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-white">Design Your Tutor</h3>
                    </div>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Who do you want to talk to?</label>
                            <textarea
                                value={genPrompt}
                                onChange={(e) => setGenPrompt(e.target.value)}
                                placeholder="e.g., A friendly elderly professor with glasses, A futuristic robot teacher, A casual student in a hoodie..."
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-pink-500 focus:outline-none h-32 resize-none placeholder-slate-500"
                            />
                        </div>

                        <button
                            onClick={generateAvatar}
                            disabled={isGenerating || !genPrompt.trim()}
                            className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-purple-900/20"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                'Create Avatar'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
