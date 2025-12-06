import React from 'react';

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  LIVE_TUTOR = 'LIVE_TUTOR'
}

export interface NavItem {
  id: AppView;
  label: string;
  icon: React.ReactNode;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface CurriculumPlan {
  title: string;
  content: string;
}

// Augment window for Veo API key selection
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    webkitAudioContext: typeof AudioContext;
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

export interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start: () => void;
    stop: () => void;
    abort: () => void;
    onresult: (event: any) => void;
    onerror: (event: any) => void;
    onend: (event: any) => void;
}
