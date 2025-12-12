import React, { useState, useEffect } from 'react';
import { Megaphone, Info, AlertTriangle, PartyPopper } from 'lucide-react';
import { getBannerConfig } from '../services/storageService';
import { BannerConfig, BannerStyle } from '../types';

const HeroBanner: React.FC = () => {
  const [config, setConfig] = useState<BannerConfig | null>(null);

  useEffect(() => {
    // Poll for changes so user sees updates immediately if they happen
    const load = () => setConfig(getBannerConfig());
    load();
    const interval = setInterval(load, 5000); 
    return () => clearInterval(interval);
  }, []);

  if (!config || !config.isVisible) return null;

  const getStyleClasses = (style: BannerStyle) => {
    switch (style) {
        case 'promo':
            return 'bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 border-purple-400 text-white';
        case 'warning':
            return 'bg-amber-500 border-amber-600 text-white';
        case 'alert':
            return 'bg-red-600 border-red-700 text-white';
        case 'info':
        default:
            return 'bg-blue-600 border-blue-700 text-white';
    }
  };

  const getIcon = (style: BannerStyle) => {
      switch (style) {
          case 'promo': return <PartyPopper className="w-8 h-8 animate-bounce" />;
          case 'warning': return <AlertTriangle className="w-8 h-8" />;
          case 'alert': return <Megaphone className="w-8 h-8 animate-pulse" />;
          default: return <Info className="w-8 h-8" />;
      }
  };

  return (
    <div className={`mb-8 rounded-2xl shadow-lg border-2 p-6 relative overflow-hidden transition-all duration-300 transform hover:scale-[1.01] ${getStyleClasses(config.style)}`}>
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay"></div>
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white opacity-10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-5 text-center md:text-right">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm shadow-inner">
                {getIcon(config.style)}
            </div>
            <div className="flex-1">
                <h2 className="text-2xl font-black mb-2 tracking-tight">{config.title}</h2>
                <p className="text-white/90 text-lg font-medium leading-relaxed">
                    {config.message}
                </p>
            </div>
        </div>
    </div>
  );
};

export default HeroBanner;