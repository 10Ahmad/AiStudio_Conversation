import React, { useState, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import { ImagePlus, Wand2, Download, AlertCircle } from 'lucide-react';
import { arrayBufferToBase64 } from '../utils/audio'; // Reusing utility

export const ScenarioBuilder: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setGeneratedImage(null); // Reset prev generation
      };
      reader.readAsDataURL(file);
    }
  };

  const editImage = async () => {
    if (!image || !prompt) return;
    setLoading(true);
    setGeneratedImage(null);

    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey) throw new Error("API Key missing");
      const ai = new GoogleGenAI({ apiKey });

      // Strip base64 prefix
      const base64Data = image.split(',')[1];
      const mimeType = image.match(/:(.*?);/)?.[1] || 'image/png';

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { inlineData: { data: base64Data, mimeType } },
            { text: prompt }
          ]
        }
      });

      // Find image part
      let foundImage = false;
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          const imgUrl = `data:image/png;base64,${part.inlineData.data}`;
          setGeneratedImage(imgUrl);
          foundImage = true;
          break;
        }
      }
      
      if (!foundImage && response.text) {
        alert("The model returned text instead of an image: " + response.text);
      }

    } catch (e: any) {
      console.error(e);
      alert('Error editing image: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-white flex items-center gap-3">
          <Wand2 className="text-pink-500" size={32} />
          Scenario Builder
        </h2>
        <p className="text-slate-400 mt-2">
          Upload a photo and ask AI to modify it to create custom learning scenarios.
          <br/>
          <span className="text-sm text-slate-500">e.g., "Add a waiter holding a menu" to a photo of an empty table.</span>
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Input Column */}
        <div className="space-y-6">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl h-80 flex flex-col items-center justify-center cursor-pointer transition-all ${image ? 'border-purple-500 bg-slate-900' : 'border-slate-700 hover:border-slate-500 hover:bg-slate-800'}`}
          >
            {image ? (
              <img src={image} alt="Original" className="h-full w-full object-contain rounded-xl" />
            ) : (
              <>
                <ImagePlus className="text-slate-500 mb-4" size={48} />
                <p className="text-slate-400 font-medium">Click to upload base image</p>
              </>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleImageUpload}
            />
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the change (e.g., 'Make it night time')"
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-pink-500 focus:outline-none"
            />
            <button
              onClick={editImage}
              disabled={loading || !image || !prompt}
              className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Processing...' : 'Generate'}
            </button>
          </div>
        </div>

        {/* Output Column */}
        <div className="border border-slate-700 bg-slate-800/30 rounded-2xl h-80 md:h-[calc(100%+88px)] flex items-center justify-center relative overflow-hidden">
          {loading && (
             <div className="absolute inset-0 bg-slate-900/80 z-10 flex flex-col items-center justify-center">
               <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mb-3"></div>
               <p className="text-pink-400 animate-pulse">Gemini is editing your image...</p>
             </div>
          )}
          
          {generatedImage ? (
            <div className="relative w-full h-full p-2 group">
              <img src={generatedImage} alt="Edited" className="w-full h-full object-contain rounded-xl" />
              <a 
                href={generatedImage} 
                download="soulingo-scenario.png"
                className="absolute bottom-6 right-6 bg-white text-slate-900 p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Download size={20} />
              </a>
            </div>
          ) : (
            <div className="text-slate-600 text-center px-6">
              <Wand2 size={48} className="mx-auto mb-4 opacity-50" />
              <p>Edited scenario will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
