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
                {/* Special Layout for Profile Data Section - Desktop */}
                {activeZone.id === 'summary' && !isMobile ? (
                  <div className="space-y-8">
                    {/* Top Section: Image and Basic Info */}
                    <div className="flex gap-8 items-start">
                      {/* Profile Image */}
                      <div className="flex-shrink-0">
                        <div className="w-56 h-56 border-4 border-safety-yellow overflow-hidden bg-[#1a1a1a]">
                          <img 
                            src="/images/odil.jpeg" 
                            alt="Odil Janandith"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                      
                      {/* Profile Content */}
                      <div className="flex-1">
                        <h3 className="text-5xl font-tech font-bold text-off-white group-hover:text-white mb-3">
                          {item.title}
                        </h3>
                        {item.subtitle && (
                          <p className="text-safety-yellow font-code text-lg mt-2 mb-6 uppercase tracking-wide">
                            {item.subtitle}
                          </p>
                        )}
                        
                        {/* Description with Bold Highlights */}
                        <p className="text-muted-grey font-body leading-relaxed text-lg mb-6">
                          {item.description.split('**').map((part, i) => 
                            i % 2 === 0 ? (
                              <span key={i}>{part}</span>
                            ) : (
                              <span key={i} className="text-white font-semibold">{part}</span>
                            )
                          )}
                        </p>
                        
                        {/* Download CV Button */}
                        <div className="mb-6 text-center">
                          <a
                            href="/cv.pdf"
                            download="Odil_Janandith_CV.pdf"
                            className="group inline-flex items-center gap-3 bg-safety-yellow text-black px-8 py-4 font-tech text-lg font-bold uppercase tracking-widest hover:bg-yellow-300 transition-all duration-200 hover:scale-105"
                          >
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                            </svg>
                            Download CV
                          </a>
                        </div>
                      </div>
                    </div>
                    
                    {/* Connect with me Section */}
                    {item.details && (
                      <div className="bg-[#1a1a1a] border border-[#444] p-6">
                        <h4 className="font-tech text-2xl font-bold text-safety-yellow mb-4 uppercase tracking-wider flex items-center gap-2">
                          <span className="text-safety-yellow">{'>'}</span> Connect with me
                        </h4>
                        <ul className="space-y-3 mb-5">
                          {item.details.map((detail, dIdx) => {
                            // Determine icon based on detail content
                            let icon = null;
                            if (detail.toLowerCase().includes('contact') || detail.includes('@')) {
                              icon = (
                                <svg className="w-5 h-5 text-safety-yellow flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                                </svg>
                              );
                            } else if (detail.toLowerCase().includes('phone')) {
                              icon = (
                                <svg className="w-5 h-5 text-safety-yellow flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                                </svg>
                              );
                            } else if (detail.toLowerCase().includes('location')) {
                              icon = (
                                <svg className="w-5 h-5 text-safety-yellow flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                                </svg>
                              );
                            }
                            
                            return (
                              <li key={dIdx} className="font-code text-base text-off-white flex items-start gap-3">
                                {icon}
                                <span>{detail}</span>
                              </li>
                            );
                          })}
                        </ul>
                        
                        {/* Social Media Links */}
                        {item.socials && (
                          <div className="mt-5 pt-4 border-t border-[#333]">
                            <p className="font-code text-sm text-[#999] mb-3 uppercase tracking-wider">Social Links:</p>
                                <div className="flex gap-4">
                                  {item.socials.map((social, sIdx) => (
                                    <a
                                      key={sIdx}
                                      href={social.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="group flex items-center gap-2 bg-[#1a1a1a] border-2 border-[#444] hover:border-safety-yellow px-4 py-2.5 transition-all duration-200 hover:scale-105"
                                      title={social.name}
                                    >
                                      {social.icon === 'linkedin' && (
                                        <svg className="w-5 h-5 text-off-white group-hover:text-safety-yellow transition-colors" fill="currentColor" viewBox="0 0 24 24">
                                          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                                        </svg>
                                      )}
                                      {social.icon === 'github' && (
                                        <svg className="w-5 h-5 text-off-white group-hover:text-safety-yellow transition-colors" fill="currentColor" viewBox="0 0 24 24">
                                          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                                        </svg>
                                      )}
                                      {social.icon === 'facebook' && (
                                        <svg className="w-5 h-5 text-off-white group-hover:text-safety-yellow transition-colors" fill="currentColor" viewBox="0 0 24 24">
                                          <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
                                        </svg>
                                      )}
                                      <span className="font-code text-sm font-semibold text-off-white group-hover:text-white transition-colors">
                                        {social.name}
                                      </span>
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                      </div>
                    )}
                    
                    {/* Tech Stack Section */}
                    {item.techStack && (
                      <div className="bg-[#1a1a1a] border border-[#444] p-6">
                        <h4 className="font-tech text-2xl font-bold text-safety-yellow mb-4 uppercase tracking-wider flex items-center gap-2">
                          <span className="text-safety-yellow">{'>'}</span> Tech Stack
                        </h4>
                        <div className="flex flex-wrap gap-3">
                          {item.techStack.map((tech, tIdx) => {
                            // Map tech names to icon file paths
                            const getIconPath = (techName: string) => {
                              const name = techName.toLowerCase();
                              if (name.includes('ros')) return '/images/ros2.jpeg';
                              if (name.includes('python')) return '/images/Python.png';
                              if (name.includes('c++')) return '/images/cplusplus.png';
                              if (name.includes('embedded')) return '/images/embeddedC.png';
                              if (name.includes('git')) return '/images/git.png';
                              if (name.includes('linux')) return '/images/linux.png';
                              if (name.includes('opencv')) return '/images/opencv.png';
                              if (name.includes('pytorch')) return '/images/pytorch.png';
                              if (name.includes('altium')) return '/images/altium.png';
                              if (name.includes('solidworks')) return '/images/solidworks.png';
                              if (name.includes('docker')) return '/images/docker.png';
                              if (name.includes('stm32')) return '/images/stm32.png';
                              if (name.includes('react')) return '/images/React.png';
                              return null;
                            };
                            
                            const iconPath = getIconPath(tech);
                            
                            return (
                              <div 
                                key={tIdx}
                                className="bg-concrete border-2 border-[#555] hover:border-safety-yellow px-4 py-2.5 font-code text-sm font-bold text-off-white hover:text-white transition-all duration-200 hover:scale-105 flex items-center gap-2"
                              >
                                {iconPath && (
                                  <img 
                                    src={iconPath} 
                                    alt={tech}
                                    className="w-5 h-5 object-contain"
                                  />
                                )}
                                {tech}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    {/* Soft Skills Section */}
                    {item.softSkills && (
                      <div className="bg-[#1a1a1a] border border-[#444] p-6">
                        <h4 className="font-tech text-2xl font-bold text-safety-yellow mb-4 uppercase tracking-wider flex items-center gap-2">
                          <span className="text-safety-yellow">{'>'}</span> Soft Skills
                        </h4>
                        <div className="flex flex-wrap gap-4">
                          {item.softSkills.map((skill, sIdx) => (
                            <div 
                              key={sIdx}
                              className="bg-deep-slate border-2 border-safety-yellow px-6 py-3 font-tech text-base font-semibold text-white tracking-wide hover:bg-safety-yellow hover:text-black transition-all duration-200"
                            >
                              {skill}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : activeZone.id === 'summary' && isMobile ? (
                  /* Special Layout for Profile Data Section - Mobile */
                  <div className="space-y-4">
                    {/* Profile Image - Centered */}
                    <div className="flex justify-center mb-4">
                      <div className="w-32 h-32 border-2 border-safety-yellow overflow-hidden bg-[#1a1a1a]">
                        <img 
                          src="/images/odil.jpeg" 
                          alt="Odil Janandith"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    
                    {/* Name and Title */}
                    <div className="text-center mb-4">
                      <h3 className="text-2xl font-tech font-bold text-off-white mb-2">
                        {item.title}
                      </h3>
                      {item.subtitle && (
                        <p className="text-safety-yellow font-code text-xs uppercase tracking-wide">
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                    
                    {/* Description */}
                    <p className="text-muted-grey font-body leading-relaxed text-sm mb-4">
                      {item.description.split('**').map((part, i) => 
                        i % 2 === 0 ? (
                          <span key={i}>{part}</span>
                        ) : (
                          <span key={i} className="text-white font-semibold">{part}</span>
                        )
                      )}
                    </p>
                    
                    {/* Download CV Button */}
                    <div className="mb-4 text-center">
                      <a
                        href="/cv.pdf"
                        download="Odil_Janandith_CV.pdf"
                        className="inline-flex items-center gap-2 bg-safety-yellow text-black px-4 py-2 font-tech text-xs font-bold uppercase tracking-widest hover:bg-yellow-300 transition-all duration-200"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                        </svg>
                        Download CV
                      </a>
                    </div>
                    
                    {/* Connect with me Section */}
                    {item.details && (
                      <div className="bg-[#1a1a1a] border border-[#444] p-3 mb-4">
                        <h4 className="font-tech text-sm font-bold text-safety-yellow mb-3 uppercase tracking-wider flex items-center gap-2">
                          <span className="text-safety-yellow">{'>'}</span> Connect
                        </h4>
                        <ul className="space-y-2 mb-3">
                          {item.details.map((detail, dIdx) => {
                            let icon = null;
                            if (detail.toLowerCase().includes('contact') || detail.includes('@')) {
                              icon = (
                                <svg className="w-4 h-4 text-safety-yellow flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                                </svg>
                              );
                            } else if (detail.toLowerCase().includes('phone')) {
                              icon = (
                                <svg className="w-4 h-4 text-safety-yellow flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                                </svg>
                              );
                            } else if (detail.toLowerCase().includes('location')) {
                              icon = (
                                <svg className="w-4 h-4 text-safety-yellow flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                                </svg>
                              );
                            }
                            
                            return (
                              <li key={dIdx} className="font-code text-xs text-off-white flex items-start gap-2">
                                {icon}
                                <span className="break-all">{detail}</span>
                              </li>
                            );
                          })}
                        </ul>
                        
                        {/* Social Media Links */}
                        {item.socials && (
                          <div className="pt-3 border-t border-[#333]">
                            <p className="font-code text-[10px] text-[#999] mb-2 uppercase tracking-wider">Socials:</p>
                            <div className="flex flex-wrap gap-2">
                              {item.socials.map((social, sIdx) => (
                                <a
                                  key={sIdx}
                                  href={social.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 bg-[#1a1a1a] border border-[#444] hover:border-safety-yellow px-2 py-1.5 transition-all duration-200"
                                  title={social.name}
                                >
                                  {social.icon === 'linkedin' && (
                                    <svg className="w-4 h-4 text-off-white" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                                    </svg>
                                  )}
                                  {social.icon === 'github' && (
                                    <svg className="w-4 h-4 text-off-white" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                                    </svg>
                                  )}
                                  {social.icon === 'facebook' && (
                                    <svg className="w-4 h-4 text-off-white" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
                                    </svg>
                                  )}
                                  <span className="font-code text-[10px] font-semibold text-off-white">
                                    {social.name}
                                  </span>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Tech Stack Section */}
                    {item.techStack && (
                      <div className="bg-[#1a1a1a] border border-[#444] p-3 mb-4">
                        <h4 className="font-tech text-sm font-bold text-safety-yellow mb-3 uppercase tracking-wider flex items-center gap-2">
                          <span className="text-safety-yellow">{'>'}</span> Tech Stack
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {item.techStack.map((tech, tIdx) => {
                            const getIconPath = (techName: string) => {
                              const name = techName.toLowerCase();
                              if (name.includes('ros')) return '/images/ros2.jpeg';
                              if (name.includes('python')) return '/images/Python.png';
                              if (name.includes('c++')) return '/images/cplusplus.png';
                              if (name.includes('embedded')) return '/images/embeddedC.png';
                              if (name.includes('git')) return '/images/git.png';
                              if (name.includes('linux')) return '/images/linux.png';
                              if (name.includes('opencv')) return '/images/opencv.png';
                              if (name.includes('pytorch')) return '/images/pytorch.png';
                              if (name.includes('altium')) return '/images/altium.png';
                              if (name.includes('solidworks')) return '/images/solidworks.png';
                              if (name.includes('docker')) return '/images/docker.png';
                              if (name.includes('stm32')) return '/images/stm32.png';
                              if (name.includes('react')) return '/images/React.png';
                              return null;
                            };
                            
                            const iconPath = getIconPath(tech);
                            
                            return (
                              <div 
                                key={tIdx}
                                className="bg-concrete border border-[#555] hover:border-safety-yellow px-2 py-1.5 font-code text-[10px] font-bold text-off-white flex items-center gap-1.5"
                              >
                                {iconPath && (
                                  <img 
                                    src={iconPath} 
                                    alt={tech}
                                    className="w-3.5 h-3.5 object-contain"
                                  />
                                )}
                                {tech}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    {/* Soft Skills Section */}
                    {item.softSkills && (
                      <div className="bg-[#1a1a1a] border border-[#444] p-3">
                        <h4 className="font-tech text-sm font-bold text-safety-yellow mb-3 uppercase tracking-wider flex items-center gap-2">
                          <span className="text-safety-yellow">{'>'}</span> Soft Skills
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {item.softSkills.map((skill, sIdx) => (
                            <div 
                              key={sIdx}
                              className="bg-deep-slate border border-safety-yellow px-3 py-1.5 font-tech text-xs font-semibold text-white tracking-wide"
                            >
                              {skill}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Default Layout for Other Sections */
                  <>
                    <div className={`flex flex-col md:flex-row justify-between items-start mb-2 border-b border-[#3a3a3a] pb-2 ${isMobile ? 'gap-1' : ''}`}>
                      <div>
                        <h3 className={`${isMobile ? 'text-base' : 'text-2xl'} font-tech font-semibold text-off-white group-hover:text-white`}>
                          {item.title}
                        </h3>
                        {item.subtitle && (
                          <p className={`text-safety-yellow font-code mt-1 uppercase tracking-wide ${isMobile ? 'text-xs' : 'text-sm'}`}>
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
                    <p className={`text-muted-grey font-body leading-relaxed ${isMobile ? 'text-xs' : 'text-base'}`}>
                      {item.description}
                    </p>
                    {item.details && (
                      <div className={`mt-3 bg-[#222] border-l-2 border-safety-yellow ${isMobile ? 'p-2' : 'p-4'}`}>
                        <p className="font-code text-[10px] text-[#666] mb-2 uppercase">System_Logs:</p>
                        <ul className="space-y-2">
                          {item.details.map((detail, dIdx) => (
                            <li key={dIdx} className={`font-code ${isMobile ? 'text-[10px]' : 'text-sm'} text-off-white flex items-start gap-2`}>
                              <span className="text-safety-yellow opacity-50">{'>'}</span> 
                              {detail}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
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
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-40 pointer-events-auto">
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
                     <button
                       className="bg-safety-yellow text-black px-3 py-1 font-bold font-tech text-sm tracking-widest hover:bg-yellow-300 transition-colors cursor-pointer"
                       onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))}
                     >
                       ENTER
                     </button>
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
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-40 pointer-events-auto">
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
                       className="bg-safety-yellow text-black px-2 py-1 font-bold font-tech text-xs tracking-widest rounded hover:bg-yellow-300 transition-colors cursor-pointer"
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