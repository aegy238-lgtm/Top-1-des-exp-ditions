import React, { useState, useEffect } from 'react';
import { Megaphone, Info, AlertTriangle, PartyPopper } from 'lucide-react';
import { getBannerConfig } from '../services/storageService';
import { BannerConfig, BannerStyle } from '../types';

const HeroBanner: React.FC = () => {
  const [config, setConfig] = useState<BannerConfig | null>(null);

  useEffect(() => {
    const load = () => setConfig(getBannerConfig());
    load();
    const interval = setInterval(load, 5000); 
    return () => clearInterval(interval);
  }, []);

  if (!config || !config.isVisible) return null;

  // Check if a custom image exists
  const hasCustomBg = !!config.backgroundUrl && config.backgroundUrl.length > 10;
  
  const getStyleClasses = (style: BannerStyle) => {
    if (hasCustomBg) return 'text-white border-transparent'; 

    switch (style) {
        case 'promo':
            return 'bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 border-purple-400 text-white min-h-[150px]';
        case 'warning':
            return 'bg-amber-500 border-amber-600 text-white min-h-[150px]';
        case 'alert':
            return 'bg-red-600 border-red-700 text-white min-h-[150px]';
        case 'info':
        default:
            return 'bg-blue-600 border-blue-700 text-white min-h-[150px]';
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
    <div className={`mb-6 rounded-2xl shadow-md border relative overflow-hidden transition-all duration-300 transform ${getStyleClasses(config.style)}`}>
        
        {/* Render Image with strictly controlled height */}
        {hasCustomBg && (
            <img 
                src={config.backgroundUrl} 
                alt="Hero Banner" 
                className="w-full h-auto max-h-[160px] md:max-h-[260px] object-cover block w-full"
            />
        )}

        {/* Overlays (Only if NO image is present) */}
        {!hasCustomBg && (
             <div className="absolute inset-0 opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay"></div>
        )}
        
        {/* Text Overlay - Positioned Absolutely over the image if text is enabled */}
        {config.showText && (
            <div className={`
                ${hasCustomBg ? 'absolute inset-0 bg-black/40 backdrop-blur-[1px] flex flex-col justify-center' : 'relative z-10 flex flex-col justify-center h-full'}
            `}>
                <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-right p-5">
                    <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm shadow-inner overflow-hidden">
                        {config.iconUrl ? (
                        <img src={config.iconUrl} alt="Banner Icon" className="w-6 h-6 md:w-8 md:h-8 object-contain" />
                        ) : (
                        getIcon(config.style)
                        )}
                    </div>
                    <div className="flex-1">
                        <h2 className="text-lg md:text-2xl font-black mb-1 tracking-tight drop-shadow-md">{config.title}</h2>
                        <p className="text-white/95 text-xs md:text-base font-medium leading-relaxed drop-shadow-sm max-w-2xl">
                            {config.message}
                        </p>
                    </div>
                </div>
            </div>
        )}

        {/* Decorative circle only if no image */}
        {!hasCustomBg && (
             <div className="absolute -right-10 -top-10 w-32 h-32 bg-white opacity-10 rounded-full blur-3xl"></div>
        )}
    </div>
  );
};

export default HeroBanner;