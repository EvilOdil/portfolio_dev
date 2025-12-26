import React, { useEffect, useRef } from 'react';
import { PortfolioSection } from '../types';
import { PORTFOLIO_DATA } from '../services/portfolioData';
import { Vector3 } from 'three';

interface UIOverlayProps {
  speed: number;
  nearbyZone: PortfolioSection | null;
  activeZone: PortfolioSection | null;
  onClose: () => void;
  carPositionRef: React.MutableRefObject<Vector3>;
}

const Minimap = ({ carPositionRef }: { carPositionRef: React.MutableRefObject<Vector3> }) => {
  const carDotRef = useRef<HTMLDivElement>(null);
  const MAP_SIZE = 150; // px
  const WORLD_RANGE = 70; // Map radius in world units

  useEffect(() => {
    let animationFrameId: number;

    const update = () => {
      if (carDotRef.current && carPositionRef.current) {
        // Invert X because in CSS left increases to right, 
        // but in 3D world +X is usually right. So X maps directly.
        // Z in 3D usually maps to Y on 2D map. +Z is "down" / towards camera.
        const x = carPositionRef.current.x;
        const z = carPositionRef.current.z;

        // Map world coordinates to pixel coordinates relative to center
        // Center of map is (MAP_SIZE/2, MAP_SIZE/2)
        const mapX = (x / WORLD_RANGE) * (MAP_SIZE / 2);
        const mapY = (z / WORLD_RANGE) * (MAP_SIZE / 2);

        // Clamp to circle for visuals
        const dist = Math.sqrt(mapX * mapX + mapY * mapY);
        const maxDist = (MAP_SIZE / 2) - 5; // padding
        
        let finalX = mapX;
        let finalY = mapY;

        if (dist > maxDist) {
          finalX = (mapX / dist) * maxDist;
          finalY = (mapY / dist) * maxDist;
        }

        carDotRef.current.style.transform = `translate(${finalX}px, ${finalY}px)`;
      }
      animationFrameId = requestAnimationFrame(update);
    };

    update();
    return () => cancelAnimationFrame(animationFrameId);
  }, [carPositionRef]);

  return (
    <div 
      className="bg-black/90 border-2 border-cyan-800 rounded-full relative overflow-hidden backdrop-blur-md shadow-[0_0_15px_rgba(0,243,255,0.2)]"
      style={{ width: MAP_SIZE, height: MAP_SIZE }}
    >
      {/* Radar Grid */}
      <div className="absolute inset-0 opacity-30" 
           style={{ 
             backgroundImage: 'radial-gradient(circle, #00f3ff 1px, transparent 1px)',
             backgroundSize: '20px 20px',
           }} 
      />
      
      {/* Center Crosshair */}
      <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-cyan-900/50" />
      <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-cyan-900/50" />

      {/* Zones Markers */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {PORTFOLIO_DATA.map(zone => {
          const x = (zone.position[0] / WORLD_RANGE) * (MAP_SIZE / 2);
          const y = (zone.position[2] / WORLD_RANGE) * (MAP_SIZE / 2);
          
          // Check bounds roughly
          if (Math.abs(x) > MAP_SIZE/2 || Math.abs(y) > MAP_SIZE/2) return null;

          return (
            <div 
              key={zone.id}
              className="absolute w-2 h-2 rounded-sm transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 animate-pulse"
              style={{ 
                transform: `translate(${x}px, ${y}px)`, 
                backgroundColor: zone.color,
                boxShadow: `0 0 6px ${zone.color}`
              }}
            />
          );
        })}

        {/* Player Marker */}
        <div 
          ref={carDotRef}
          className="absolute w-3 h-3 bg-white rounded-full border-2 border-cyan-400 shadow-sm z-10"
          style={{ willChange: 'transform' }} // Optimization
        />
      </div>
      
      <div className="absolute bottom-2 left-0 right-0 text-center">
        <span className="text-[9px] font-mono text-cyan-700 bg-black/50 px-1 rounded">RADAR</span>
      </div>
    </div>
  );
};

export const UIOverlay: React.FC<UIOverlayProps> = ({ speed, nearbyZone, activeZone, onClose, carPositionRef }) => {
  
  // If a modal is open, show full content
  if (activeZone) {
    return (
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
        <div className="bg-gray-900 border-2 border-cyan-500 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl shadow-cyan-500/20">
          
          {/* Header */}
          <div className="p-6 border-b border-gray-800 flex justify-between items-center sticky top-0 bg-gray-900 z-10">
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
              {activeZone.title}
            </h2>
            <button 
              onClick={onClose}
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white rounded-lg transition-colors font-bold"
            >
              CLOSE [ESC]
            </button>
          </div>

          {/* Content */}
          <div className="p-6 grid gap-6">
            {activeZone.items.map((item, idx) => (
              <div key={idx} className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 hover:border-cyan-500/50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold text-white">{item.title}</h3>
                  {item.date && <span className="text-xs font-mono text-cyan-400 bg-cyan-900/30 px-2 py-1 rounded">{item.date}</span>}
                </div>
                {item.subtitle && <p className="text-purple-300 text-sm mb-3 font-semibold">{item.subtitle}</p>}
                <p className="text-gray-300 leading-relaxed">{item.description}</p>
                
                {item.details && (
                  <ul className="mt-4 space-y-1">
                    {item.details.map((detail, dIdx) => (
                      <li key={dIdx} className="text-gray-400 text-sm flex items-start gap-2">
                        <span className="text-cyan-500">›</span> {detail}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
          
          <div className="p-4 border-t border-gray-800 text-center text-gray-500 text-sm">
            Press ESC or Click Close to return to driving
          </div>
        </div>
      </div>
    );
  }

  // HUD
  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6">
      
      {/* Top Bar Container */}
      <div className="flex justify-between items-start w-full">
        {/* Top Left: Title */}
        <div>
          <h1 className="text-4xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-600 drop-shadow-md">
            ODIL'S WORLD
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Explore the Resume | Drive to glowing boxes
          </p>
        </div>

        {/* Top Right: Minimap */}
        <div className="pointer-events-auto">
          <Minimap carPositionRef={carPositionRef} />
        </div>
      </div>

      {/* Interaction Prompt (Center) */}
      {nearbyZone && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center z-40">
           <div className="bg-black/80 border-2 border-cyan-400 text-cyan-400 px-8 py-4 rounded-xl backdrop-blur-sm animate-bounce shadow-[0_0_20px_rgba(0,243,255,0.3)]">
              <p className="text-sm uppercase tracking-widest mb-1">Approaching</p>
              <h2 className="text-2xl font-bold text-white mb-2">{nearbyZone.title}</h2>
              <div className="flex items-center justify-center gap-2">
                 <span className="bg-white text-black px-2 py-1 rounded font-bold text-xs">ENTER</span>
                 <span className="text-sm">TO VIEW</span>
              </div>
           </div>
        </div>
      )}

      {/* Bottom Right: Speedometer */}
      <div className="flex justify-end items-end">
        <div className="text-right">
          <span className="text-5xl font-mono font-bold text-white/80">
            {Math.round(speed)}
          </span>
          <span className="text-sm text-cyan-400 ml-2 font-bold">MPH</span>
        </div>
      </div>
    </div>
  );
};
