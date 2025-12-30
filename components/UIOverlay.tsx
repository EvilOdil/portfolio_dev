import React from 'react';
import { PortfolioSection } from '../types';

interface UIOverlayProps {
  speed: number;
  nearbyZone: PortfolioSection | null;
  activeZone: PortfolioSection | null;
  onClose: () => void;
  selectedMode: 'TELEOP' | 'AUTO' | null;
  isMobile?: boolean;
}

export const UIOverlay: React.FC<UIOverlayProps> = ({ speed, nearbyZone, activeZone, onClose, selectedMode, isMobile }) => {
  
  // Get mode display text
  const getModeText = () => {
    switch (selectedMode) {
      case 'TELEOP': return 'TELEOPERATION';
      case 'AUTO': return 'AUTONOMOUS';
      default: return 'NULL';
    }
  };
  
  // --- ACTIVE MODAL VIEW ---
  if (activeZone) {
    return (
      <div className="absolute inset-0 bg-deep-slate/90 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        {/* Main Container - Sharp corners, Concrete Grey, Thin Border */}
        <div className={`bg-concrete border border-[#444] w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl relative overflow-hidden ${isMobile ? 'scale-90 max-w-md h-[60vh]' : ''}`}>
          {/* Decorative Hazard Strip Top */}
          <div className="h-2 w-full hazard-stripes border-b border-black"></div>
          {/* Header */}
          <div className={`border-b border-[#444] bg-[#1a1a1a] flex justify-between items-center sticky top-0 z-10 ${isMobile ? 'p-3' : 'p-6'}`}>
            <div>
              <p className={`font-code text-xs text-safety-yellow mb-1 tracking-widest ${isMobile ? 'text-[10px]' : ''}`}>// SECTOR_DATA</p>
              <h2 className={`${isMobile ? 'text-lg' : 'text-4xl'} font-tech font-bold text-white uppercase tracking-wider`}>
                {activeZone.title}
              </h2>
            </div>
            <button 
              onClick={onClose}
              className={`group flex items-center gap-3 ${isMobile ? 'px-2 py-1' : 'px-6 py-2'} bg-transparent border border-safety-yellow hover:bg-safety-yellow transition-all duration-100`}
              aria-label="Close Panel"
            >
              {isMobile ? (
                <span className="font-code text-lg text-safety-yellow group-hover:text-black font-bold">✕</span>
              ) : (
                <span className="font-code text-sm text-safety-yellow group-hover:text-black font-bold">[ CLOSE_PANEL ]</span>
              )}
            </button>
          </div>
          {/* Content Scroll Area */}
          <div className={`flex-1 overflow-y-auto grid gap-4 custom-scrollbar bg-deep-slate ${isMobile ? 'p-2' : 'p-8'}`}>
            {activeZone.items.map((item, idx) => (
              <div 
                key={idx} 
                className={`group bg-concrete border border-[#444] hover:border-safety-yellow transition-colors duration-200 ${isMobile ? 'p-2 text-xs' : 'p-6'}`}
              >
                <div className={`flex flex-col md:flex-row justify-between items-start mb-2 border-b border-[#3a3a3a] pb-2 ${isMobile ? 'gap-1' : ''}`}>
                  <div>
                    <h3 className={`${isMobile ? 'text-base' : 'text-2xl'} font-tech font-semibold text-off-white group-hover:text-white`}>
                      {item.title}
                    </h3>
                    {item.subtitle && (
                      <p className="text-safety-yellow font-code text-xs mt-1 uppercase tracking-wide">
                        {item.subtitle}
                      </p>
                    )}
                  </div>
                  {item.date && (
                    <span className="mt-2 md:mt-0 font-code text-xs text-muted-grey bg-[#1a1a1a] px-2 py-1 border border-[#333]">
                      TIME: {item.date}
                    </span>
                  )}
                </div>
                <p className={`text-muted-grey font-body leading-relaxed ${isMobile ? 'text-xs' : 'text-sm md:text-base'}`}>
                  {item.description}
                </p>
                {item.details && (
                  <div className={`mt-3 bg-[#222] border-l-2 border-safety-yellow ${isMobile ? 'p-2' : 'p-4'}`}>
                    <p className="font-code text-[10px] text-[#666] mb-2 uppercase">System_Logs:</p>
                    <ul className="space-y-2">
                      {item.details.map((detail, dIdx) => (
                        <li key={dIdx} className={`font-code ${isMobile ? 'text-[10px]' : 'text-xs'} text-off-white flex items-start gap-2`}>
                          <span className="text-safety-yellow opacity-50">{'>'}</span> 
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
          {/* Footer Status Bar */}
          <div className={`border-t border-[#444] bg-[#1a1a1a] flex justify-between items-center text-[10px] font-code text-[#555] uppercase ${isMobile ? 'p-1' : 'p-2'}`}>
             <span>System Status: Online</span>
             <span>Data Integrity: 100%</span>
          </div>
        </div>
      </div>
    );
  }

  // --- HUD VIEW ---
  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-8">
      
      {/* Top Left: System Header */}
      <div className="flex flex-col border-l-4 border-safety-yellow pl-4 bg-deep-slate/80 p-2 backdrop-blur-sm max-w-md">
        <h1
          className={
            `${isMobile ? 'text-xl' : 'text-3xl'} font-tech font-bold text-white uppercase tracking-widest`
          }
        >
          ODIL.OS <span className="text-safety-yellow">//</span> SYSTEM
        </h1>
        <div className="flex gap-4 mt-2 font-code text-[10px] text-muted-grey uppercase">
           <span>Unit: ODI-001</span>
           <span>Mode: {getModeText()}</span>
        </div>
      </div>

      {/* Center Interaction Prompt (desktop) */}
      {nearbyZone && !isMobile && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-40">
           <div className="bg-[#1a1a1a]/90 border border-safety-yellow p-1 backdrop-blur-md">
              <div className="border border-safety-yellow/30 p-6 flex flex-col items-center text-center min-w-[300px]">
                <div className="w-full flex justify-between text-[10px] font-code text-safety-yellow mb-2 opacity-70">
                   <span>PROXIMITY_ALERT</span>
                   <span>[ ! ]</span>
                </div>
                
                <h2 className="text-3xl font-tech font-bold text-white uppercase mb-4 tracking-widest">
                  {nearbyZone.title}
                </h2>
                
                <div className="flex flex-col gap-1 w-full">
                  <div className="h-[1px] w-full bg-safety-yellow/30"></div>
                  <div className="flex justify-between items-center py-2">
                     <span className="font-code text-xs text-muted-grey">ACCESS DATA?</span>
                     <div className="bg-safety-yellow text-black px-3 py-1 font-bold font-tech text-sm tracking-widest">
                       PRESS ENTER
                     </div>
                  </div>
                </div>
              </div>
              {/* Decorative corners */}
              <div className="absolute top-0 left-0 w-2 h-2 border-l-2 border-t-2 border-safety-yellow"></div>
              <div className="absolute top-0 right-0 w-2 h-2 border-r-2 border-t-2 border-safety-yellow"></div>
              <div className="absolute bottom-0 left-0 w-2 h-2 border-l-2 border-b-2 border-safety-yellow"></div>
              <div className="absolute bottom-0 right-0 w-2 h-2 border-r-2 border-b-2 border-safety-yellow"></div>
           </div>
        </div>
      )}

      {/* Center Interaction Prompt (mobile, auto popup) */}
      {nearbyZone && isMobile && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-40">
           <div className="bg-[#1a1a1a]/90 border border-safety-yellow p-1 backdrop-blur-md">
              <div className="border border-safety-yellow/30 p-4 flex flex-col items-center text-center min-w-[180px]">
                <div className="w-full flex justify-between text-[10px] font-code text-safety-yellow mb-2 opacity-70">
                   <span>PROXIMITY_ALERT</span>
                   <span>[ ! ]</span>
                </div>
                <h2 className="text-xl font-tech font-bold text-white uppercase mb-2 tracking-widest">
                  {nearbyZone.title}
                </h2>
                <div className="flex flex-col gap-1 w-full">
                  <div className="h-[1px] w-full bg-safety-yellow/30"></div>
                  <div className="flex justify-between items-center py-2">
                     <span className="font-code text-xs text-muted-grey">ACCESS DATA?</span>
                     <button
                       className="bg-safety-yellow text-black px-2 py-1 font-bold font-tech text-xs tracking-widest rounded"
                       onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))}
                     >ENTER</button>
                  </div>
                </div>
              </div>
              {/* Decorative corners */}
              <div className="absolute top-0 left-0 w-2 h-2 border-l-2 border-t-2 border-safety-yellow"></div>
              <div className="absolute top-0 right-0 w-2 h-2 border-r-2 border-t-2 border-safety-yellow"></div>
              <div className="absolute bottom-0 left-0 w-2 h-2 border-l-2 border-b-2 border-safety-yellow"></div>
              <div className="absolute bottom-0 right-0 w-2 h-2 border-r-2 border-b-2 border-safety-yellow"></div>
           </div>
        </div>
      )}

      {/* Bottom Right: Context Info (hide on mobile) */}
      {!isMobile && (
        <div className="absolute bottom-8 right-8 text-right font-code text-xs text-[#555]">
          <p>CONTROLS: WASD / ARROWS</p>
          <p>INTERACT: ENTER</p>
        </div>
      )}

    </div>
  );
};