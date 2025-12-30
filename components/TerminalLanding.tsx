import React, { useState, useEffect, useRef } from 'react';

interface TerminalLandingProps {
  isExpanded: boolean;
  onToggle: () => void;
  onModeSelect: (mode: 'TELEOP' | 'AUTO' | null) => void;
  selectedMode: 'TELEOP' | 'AUTO' | null;
  isMobile?: boolean;
}

// ASCII art profile picture
const ASCII_ART = `++;;;;;;;;;;;;;;;;;;;;;;;;;;;::::::::::::::::;;::::;;++++++++;;;;;;;:;;;;;;;:::::::;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
++;;;;;;;;;;;;;;;;;;;;;;;;;;:;;:::::::::::::;::;+**?%%%%%%%%?*++;;;;;;;;:;:::::::::;::;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
++;;;;;;;;;;;;;;;;;;;;;;;;;;;;;::::::::::::::+?SSS#SSSSS#####SS?*+++**??**+;;::;::;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
++;;;;;;;;;;;;;;;;;;;;;;;;;;;;:::::::::::::;?S#SSSSSSS#########SS??%%SSSSSS%?*+::;;;;;;;;;;;;;:;;;;;;;;;;;;;;;;;;;;;;;;;
++;;;;;;;;;;;;;;;;;;;;;;;;;;;;:::::::::::;*S#SSSSSSSSSS#######@#######SSSSSS#S%?;:;;;;:::;:;;;;;:;;;;;;;;;;;;;;;;;;;;;;;
++;;;;;;;;;;;;;;;;;;;;;;;;;;::::::::::::+%S#S##SSSS##########@@@@@@@@@##########S*::::::::::;;;;;;;;;;;;;;;;;;;;;;;;;;;;
++;;;;;;;;;;;;;;;;;;;;;;;;;:::::::::::*?SSSSSSSSSSSS#####@#@@@@@@@@@@#############?::::::::::;;;;;;;;;;;;;;;;;;;;;;;;;;;
+;;;;;;;;;;;;;;;;;;;;;;;;;:::::::::::*%SSSSSSSSSSS#######@###@#@@@@@@@###########S#%::::::::::;;;;;;;;;;;;;;;;;;;;;;;;;;
+;;;;;;;;;;;;;;;;;;;;;;;::::::::::::+%S#SSS#################@@#####@@@@@@@##@###@#S#?:::::::::;:;;;;;;;;;;;;;;;;;;;;;;;;
+;;;;;;;;;;;;;;;;;;;;;;;:::::::::::+S#########################S%SSS##@@@@@@@@####@##S+::::::;::;;;;;;;;;;;;;;;;;;;;;;;;;
+;;;;;;;;;;;;;;;;;;;;;;:::::::::::*######################SSS%?**????%S#@@@@@@@###@###?;:::::;;:;;;;;;;;;;;;;;;;;;;;;;;;;
+++;;;;;;;;;;;;;;;;;;;;::::::::::+##################SSSS%S%??********?%S#@@@@@#@@@##@%;:::::::;;;:;;;;;;;;;:;:;;;;;;;;;;
+++;;;;;;;;;;;;;;;;;;;;;:::::::::%#S############SSSS%%%%%%?**+++++++***?%S#@@@@@@@##@#+::::::::::::;;;;;;;::;;;;;;;;;;;;
+++;;;;;;;;;;;;;;;;;;;;;:::::::::%S##@@@@#@@#SS%%%????%??***+++++++++***?%S#@@@@@#@##@?:;:::;:::::::::;;;;;;;;;;;;;;;;;;
+++;;;;;;;;;;;;;;;;;;;;::::::::::*S##@@@@@##S%?????????****++++++++++***??%S#@@@@#@@#@#+::::::::::::::;;;;;::;;;;;;;;;;;
+++;;;;;;;;;;;;;;;;;;;;::::::::::;%##@@@@@#S????*********++++++++++******?%%S#@@@#@@###S;::::::::::;:;;;;;:::;;;;;;;;;;;
+++;;;;;;;;;;;;;;;;;;;;;:::;::::::*##@@@@@S%?*****+++++++++++++++++++***???%S#@@@###@###%:::::::;;;;;;;::::::;;;;;;;;;;;
+++;;;;;;;;;;;;;;;;;;;;;;:::::::::?#@@@@@#%?*****++++++++++++++++++****????%%S#@@##@##@#S+:;:;;;;;;;;;;::::::;;;;;;;;;;;
+++;;;;;;;;;;;;;;;;;;;;;:::::::::+####@@@S?*****++++++++++++++++++*******???%S#@@##@#@@##+:;:;;;;;;;::;::::;;;;;;;;;;;;;
++++;;;;;;;;;;;;;;;;;;;;:;:::::::*##S###@%**?????%%%%%%%??******??%%%%%%%SS%%%S@@#S@##@#S;:::::;;;;;;:::::::;;;;;;;;;;;;
++++;;;;;;;;;;;;;;;;;;;;;::::::::*#####@#?*?%SSS#######S%%?????%%S##########S%%#@####@@#?;:::;;;;;;;;;:::::;;;;;;;;;;;;;
++++;;;;;;;;;;;;;;;;;;;;;::::::::+##SS#@S**????%%SS##SSS%%???%%SSS#####SS%%?%??#@#####@#+;;;;;;;;;;;;;;;;;;::;;;;;;;;;;;
++++;;;;;;;;;;;;;;;;;;;;:::::::::;##S##@%***??%SS######SS%*++*%SS##@#@###S%%?**S@######?;;;;;;;;;;;;;;;;;;:;;;;;;;;;;;;;
+++++;;;;;;;;;;;;;;;;;;;;:;:::::::%###@@%**%SSSS###SS##S%*++++*?S###S####S#SS??%@######*;;;;;;;;;;;;;;;:;;;;;;;;;;;;;;;;
+++++;;;;;;;;;;;;;;;;;;;;:::::::;:+#@#@@%**???%%%SSSS%%?*++++***?%%%SSSSSS%%%???#######?;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
+++++;;;;;;;;;;;;;;;;;;;;;;::;:::;:*S###?**++**????**+*+++++++*??????%%%%%???***S######?+;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
+++++;;;;;;;;;;;;;;;;;;;:::;:::;;;++?#@#?**++++++;;;+++++;;;+++***?********?****S#####%+;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
+++++;;;;;;;;;;;;;;;;;;;;::;:::::;;?S###*+++++++;;+++++++++++++*++*?**+++***???*%S%#%*+;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
++++++;;;;;;;;;;;;;;;;;;;::;::::;;;++?%%**+++++++++**+*??*****?%%**??*********?*?S%%+;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
++++++;;;;;;;;;;;;;;;;;;;;;;::::;;+;;*%?**************%##%????S##S%???*??????***?%%+;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
++++++;;;;;;;;;;;;;;;;;;;;;;::::;;;++*%?***********++*?%?%%%%%%%%%%????????????*?%?;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
+++++++;;;;;;;;;;;;;;;;;;;;;::;;;;;;+%@%*???????***+++++**?%%%??????*???%%%???????+;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
+++++++;;;;;;;;;;;;;;;;;;;;;;:;;;;;;+?%??**????*****+++++++**********???%%%?????%?*+;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
+++++++;;;;;;;;;;;;;;;;;;;;;::;;;;;;;;+???*******?S?**????%%%%%%%%%?%S%??%??????%?*;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
+++++++;;;;;;;;;;;;;;;;;;;;;;:;;;;;;;;;+???*****?SSSSS???%??%??%?%%###S%???????%*+;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
+++++++;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;*???****??*****++++++++***?????%??????%?++;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
+++++++;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;*S??****?**+***********????????%%????%%+++;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
+++++++;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;+%%??*********??%%%%%%%%%%%%???%%??%%%+++;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
+++++++;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;?%?*?*********?%%%%%%%%%??????%%%%S*;+;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
+++++++;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;%S????******++++++*****??????%%%S?+++;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
++++++++;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;*%S%?%?***+++++++++++***????%%SS%*+++;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
++++++++;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;+?%S%%%%?************?????%%SSS%?++++;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
++++++++;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;*+?%SS%SS%%%??????%%%%%%%SSS#S%%*;+++;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
++++++++;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;+*%%:;?%SSSSSSS%%%S%SSSSSSSSS#SS%%*;;+;;+;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
++++++++;;;;;;;;;;;;;;;;;;;;;;;;:;;+*?%SSSSS;::+?%SSSSSSSSSSSSSSSSSSSSS%?+;:;%*+;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
++++++++;;;;;;;;;;;;;;;;;;;::;;+*%%S###SSSSS+::::+?%%%SSSSSSSSSSSSSSS%?+;:;:;##S%%?++;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
+++++++;;;;;;;;;;;;;;:::;;+*?%%SSS###SSSSSSS*::::::;*?%%SSSSSSSSSSS%?+;:;;;:*#######S%?*+;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
++++++++;;;;;;;:::;;;+*??%SSSSSSSS##SSSSSSSS%::::::::;+*%%SSSSSSS%?+;:;;::;:?#S#SS######S%?*+;;;;;;;;;;;;;;;;;;;;;;;;;;;
++++++;;;;;;;;;+*?%%SSSSSSSSSSSSS#SSSSSSSSSSS+::::::::::;*?%%%%%*+::;;;:::::*###############SS%?*+;;;;;;;;;;;;;;;;;;;;;;
++++++***???%%SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS*::::::::::;+++**?*?%%*;:::::;;*##SSSSS#####SSSSS##SSS%%?*++;;;;::;;;;;;;;;
++++?SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS%:::::::,;+*?%%%SSSS%%%?*;:::;;+##SSSSSSSSS#SSSSSSSSSSSSSSS%%%?*++:;;;;;;;;
+++%SSSSSSSS%%SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS%;::::::*%*?SSSS%%%S#%**?*+::;;;S#S#SSSSSSSSSSSSSSSSSSSSSSSSSSSSS+:;;;;;;;;
++%SSS%SSSS%%%%S%SSSSS%%S%SSSSSSSSSSSSSSSSSSSS;::::;+*?*++*?%SSS%SS*+++**;;;;S#SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS+:;;;;;;;
+*SSSS%%%%%%%%%%%%%%%%%%%%SSSSSSSSSS%SSSSSSSSS+:::;+++++**+++*?#S*+;;;;+++;;;%#SSSSSSSSSSS##SSSSSSSSSSSSSSSSSSS%;;;;;;;;
+?SSSS%%%%%%%%%%%%%%%%%%%%%SSSSSS%SSSSSSSSSSSS+::;;;;;;;?S%?*+*?*;;;;;;;;;;;;?#SSSSSSSSSS##SSSSSSSSSSSSSSSSSS#SS+:;;;;;;
+%SSSS%%%%%%%%%%%%%%%%%%%%%%%%S%%%S%SSSSSSSSSS*:;:::::::+?%%S%?+;;;;;;;;;;;;:*SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS?:;;;;;;
+%SSSS%%%%%%%%%%%%%%%%%%%%%%%%%%SSS%%SSSSSSS%S*:::::::::;???%#S+;:;;;;;;::;::;SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS#SS;:;;;;;
*%SSSSS%%%%%%%%%%%%%%%%%%%%%%%%SSS%%%SSSSSSSSS?:::::::::;?%%%%%+::;;;:;;::;::;%SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS#S#+:;;;;;
*%SSSS%S%%%%%%%%%%%%%%%%%%%%%SSSSS%%%SSSSSSSSS?:::::::::;?S%%S%;:::;;:;;::::::?SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS#S#?:;;;;;
%%SSSSSSSSS%%%%%%%%%%%%%%%%%%SSSS%%%%%SSSS%S%S%:::::;:::;%??%SS+:::;::;:::::::*SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS#SSS;;;;;;
%%SSSSSSSS%SS%%%%%%%%%SS%%SS%SSSS%%%%%%%%%%S%S%:::::;:::+?%SS%*%;::;::;:::::::+SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS#SS#*:;;;;
%%SSSSSSS%SSSSS%%%%%%%SSS%%S%SSSS%%%%%S%%SSS%SS;::::;:::?SS%*++%%::;::;:::::::+SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS#SS#%;:;;;
%SSSSSSSSSSSSSSS%%%%%SSSS%%S%SSS%%%%%%%SSSSSSSS;::::;;:;S%*+++?S%+::::;:::::::;%SSSSSSSSSSSSSSSSSSSSSSSSSSSSS##SSSS*:;;;
%SSSS#SSSSSSSSSS%%%%%SSSS%%SS%SSS%%%%%%SS%SSSSS;::::;;:%%+++*%S%?%;:::;:::::::;%SSSSSSSSSSSSSSSSSSSSSSSSSSSSS##SSSS%;;;;
%SSSS#SSSSSSSSSSSSSSSSSSS%%%S%SS%%%%%%%S%SSSSSS+:::::;??+++?%S%?SS+:::;::::::::%SSSSSSSSSSSSSSSSSSSSSSSSSSSSS##SS#SS+:;;
%SSSS#SSSSSSSSSSSSS%SSSSS%%%S%SS%%%%%S%SSSS%SSS*:::::??++*%S%??SS?+;::;::::::::?SSSSSSSSSSSSSSSSSSSSSSSS##SSS##SSSS#?:;;`;

export const TerminalLanding: React.FC<TerminalLandingProps> = ({
  isExpanded,
  onToggle,
  onModeSelect,
  selectedMode,
  isMobile
}) => {
  const [displayedLines, setDisplayedLines] = useState<string[]>([]);
  // State to ensure a sentence is only printed once
  const [hasPrintedSentence, setHasPrintedSentence] = useState(false);
  const [currentInput, setCurrentInput] = useState('');
  const [commandExecuted, setCommandExecuted] = useState(false);
  const [isCollapsing, setIsCollapsing] = useState(false);
  const [isAnimating, setIsAnimating] = useState(true);
  const [pendingCommand, setPendingCommand] = useState<'T' | 'A' | null>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const allLinesRef = useRef<string[]>([]);
  
  // Resizable terminal state
  const [terminalSize, setTerminalSize] = useState({
    width: isMobile ? Math.min(window.innerWidth - 24, 380) : 1050,
    height: isMobile ? Math.min(window.innerHeight - 24, 600) : 600
  });
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef<{ startX: number; startY: number; startWidth: number; startHeight: number } | null>(null);

  // ASCII art title
  const ASCII_TITLE = `
  ___  ____ _ _    _  ____    _  _  _ ___  ____  _    ____ 
 /   \\|  _ \\| | |  ( )/ ___|  | || || / _ \\|  _ \\| |  |  _ \\ 
| | | | | | | | |  |/ \\___ \\  | || || | | | |_) | |  | | | |
| |_| | |_| | | |__     ___) | | |/\\|| |_| |  _ <| |__| |_| |
 \\___/|____/|_|____|   |____/  |__/\\__\\___/|_| \\_\\____|____/
`;

  // Initialize terminal with welcome message - line by line animation (reliable setTimeout version)
  useEffect(() => {
    const introLines = [
      ...(!hasPrintedSentence ? ['This sentence should only appear once.'] : []),
      '__ASCII_TITLE__',
      '',
      '',
      'I am an Engineering Student with a passion for Robotics, Computer Vision and Startups.',
      '',
      '',
      'ODI-001, my virtual robot dog, is here to take you on a journey to explore my world.',
      '',
      '',
      ...(isMobile
        ? [
            '┌─────────────────┐',
            '│  Select Mode:   │',
            '│  [T] Teleop     │',
            '│  [A] AutoNav    │',
            '└─────────────────┘',
            ''
          ]
        : [
            '┌───────────────────────────────────────┐',
            '│  Select navigation mode:              │',
            '│    [T] Teleoperate                    │',
            '│    [A] Autonomous navigation          │',
            '└───────────────────────────────────────┘',
            ''
          ]),
    ];

    setDisplayedLines([]);
    setIsAnimating(true);
    let cancelled = false;

    function showLine(index: number) {
      if (cancelled) return;
      if (index < introLines.length) {
        setDisplayedLines(prev => [...prev, introLines[index]]);
        if (introLines[index] === 'This sentence should only appear once.') {
          setHasPrintedSentence(true);
        }
        setTimeout(() => showLine(index + 1), 80);
      } else {
        setIsAnimating(false);
      }
    }

    showLine(0);

    return () => {
      cancelled = true;
    };
  }, [hasPrintedSentence]);

  // Handle resize mouse events
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !resizeRef.current) return;
      
      const deltaX = e.clientX - resizeRef.current.startX;
      const deltaY = e.clientY - resizeRef.current.startY;
      
      setTerminalSize({
        width: Math.max(500, Math.min(window.innerWidth - 40, resizeRef.current.startWidth + deltaX)),
        height: Math.max(400, Math.min(window.innerHeight - 40, resizeRef.current.startHeight + deltaY))
      });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      resizeRef.current = null;
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    resizeRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startWidth: terminalSize.width,
      startHeight: terminalSize.height
    };
  };

  // Handle keyboard input
  useEffect(() => {
    if (!isExpanded) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle terminal with backtick
      if (e.key === '`' || e.key === 'Backquote') {
        e.preventDefault();
        onToggle();
        return;
      }

      // Don't process input if command already executed and collapsing, or still animating
      if (isCollapsing || isAnimating) return;

      // Handle T or A input
      if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        setCurrentInput('T');
        setPendingCommand('T');
      } else if (e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        setCurrentInput('A');
        setPendingCommand('A');
      } else if (e.key === 'Enter' && pendingCommand) {
        e.preventDefault();
        executeCommand(pendingCommand);
        setPendingCommand(null);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        setCurrentInput('');
        setPendingCommand(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded, isCollapsing, isAnimating, onToggle, pendingCommand]);

  const executeCommand = (mode: 'T' | 'A') => {
    setCommandExecuted(true);
    setIsCollapsing(true);

    const commandLines: string[] = [];
    commandLines.push(`odil@odi-001:~$ ${mode}`);
    
    if (mode === 'T') {
      commandLines.push('$ ./teleop.sh');
      commandLines.push('[INFO] Initializing teleoperation module...');
      commandLines.push('[OK] Loading ODI-001 controller...');
      commandLines.push('[OK] Launching teleop node...');
      commandLines.push('[OK] ODI-001 connected. use WASD to move.');
      commandLines.push('[OK] Ready. Enjoy the journey!');
      commandLines.push('');
      onModeSelect('TELEOP');
    } else {
      commandLines.push('$ ./auto_nav.sh');
      commandLines.push('[INFO] Initializing autonomous navigation...');
      commandLines.push('[WARN] Autonomous navigation module is under development.');
      commandLines.push('[WARN] Feature coming soon...');
      commandLines.push('[INFO] Falling back to manual mode. Press T to teleoperate.');
      commandLines.push('');
      onModeSelect('AUTO');
    }

    // Animate command output lines one by one
    let lineIndex = 0;
    const interval = setInterval(() => {
      if (lineIndex < commandLines.length) {
        setDisplayedLines(prev => [...prev, commandLines[lineIndex]]);
        lineIndex++;
      } else {
        clearInterval(interval);
        // Collapse terminal after all lines displayed
        setTimeout(() => {
          onToggle();
          setIsCollapsing(false);
        }, 1000);
      }
    }, 150); // 150ms delay between command output lines
  };

  // Auto-scroll to bottom
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [displayedLines]);

  // Handle re-expanding terminal for mode change
  useEffect(() => {
    if (isExpanded && commandExecuted) {
      // Reset input state when terminal is re-expanded
      setCurrentInput('');
      setIsCollapsing(false);
    }
  }, [isExpanded, commandExecuted]);

  // Minimized bar
  if (!isExpanded) {
    if (isMobile) return null;
    return (
      <div 
        onClick={onToggle}
        className="fixed bottom-0 left-0 right-0 h-10 bg-[#0d0d0d] border-t border-[#333] flex items-center px-4 cursor-pointer hover:bg-[#1a1a1a] transition-colors z-50"
      >
        <div className="flex items-center gap-2 flex-1">
          <span className="text-[#00ff00] font-code text-xs" style={{ textShadow: '0 0 4px #008f11' }}>
            odil@odi-001:~$ {selectedMode === 'TELEOP' ? './teleop.sh' : selectedMode === 'AUTO' ? './auto_nav.sh' : ''}
          </span>
          
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[#888] font-code text-[10px]">MODE: {selectedMode || 'NULL'}</span>
          <button className="text-[#888] hover:text-[#00ff00] transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  // Full terminal - centered resizable window
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 font-code">
      {/* Terminal Window */}
      <div 
        className="bg-[#0d0d0d] border border-[#333] rounded-lg shadow-2xl flex flex-col overflow-hidden relative"
        style={{ 
          width: isMobile ? '95vw' : `${terminalSize.width}px`,
          height: isMobile ? '60vh' : `${terminalSize.height}px`,
          maxWidth: isMobile ? '95vw' : 'calc(100vw - 32px)',
          maxHeight: isMobile ? '70vh' : 'calc(100vh - 32px)'
        }}
      >
        {/* Terminal Header Bar */}
        <div className="h-8 bg-[#1a1a1a] border-b border-[#333] flex items-center px-3 shrink-0 rounded-t-lg">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#ff5f56] hover:brightness-110 cursor-pointer" />
            <div className="w-3 h-3 rounded-full bg-[#ffbd2e] hover:brightness-110 cursor-pointer" />
            <div 
              className="w-3 h-3 rounded-full bg-[#27ca40] hover:brightness-110 cursor-pointer"
              onClick={onToggle}
            />
          </div>
          <div className="flex-1 text-center text-[#888] text-xs">
            odil@odi-001: ~
          </div>
          <div className="text-[#666] text-[10px]">
            bash
          </div>
        </div>

        {/* Terminal Content */}
        <div 
          ref={terminalRef}
          className="flex-1 overflow-auto p-6 custom-scrollbar"
          style={{ 
            backgroundColor: '#0d0d0d',
          }}
        >
          {/* Side by side Layout: ASCII art on left, content on right */}
          <div className={isMobile ? 'flex flex-col gap-1' : 'flex flex-row gap-8'} style={isMobile ? { fontSize: '10px' } : {}}>
            {/* ASCII Art Profile - Left Side */}
            <div className="shrink-0 overflow-x-auto flex items-start">
              <pre 
                className="text-[#00ff00] leading-none select-none"
                style={{ 
                  fontSize: isMobile ? '2px' : '6px',
                  lineHeight: isMobile ? '2px' : '6px',
                  textShadow: '0 0 4px #008f11',
                  fontFamily: "'Courier New', 'Lucida Console', monospace",
                  letterSpacing: '0px',
                  maxWidth: isMobile ? '40px' : undefined
                }}
              >
                {ASCII_ART}
              </pre>
            </div>

            {/* Terminal Output - Right Side */}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              {/* Output lines */}
              {displayedLines.map((line, index) => {
                // Render ASCII title
                if (line === '__ASCII_TITLE__') {
                  return (
                    <pre 
                      key={index}
                      className="text-[#00ff00] leading-tight select-none mb-4"
                      style={{ 
                        fontSize: isMobile ? '8px' : '14px',
                        textShadow: '0 0 8px #008f11',
                        fontFamily: "'Courier New', 'Lucida Console', monospace"
                      }}
                    >
                      {ASCII_TITLE}
                    </pre>
                  );
                }
                // Skip old ASCII art marker
                if (line === '__ASCII_ART__') {
                  return null;
                }
                return (
                  <div 
                    key={index} 
                    className={`text-[#00ff00] whitespace-pre-wrap break-words ${isMobile ? 'text-xs' : 'text-sm'}`}
                    style={{ textShadow: '0 0 4px #008f11' }}
                  >
                    {line || '\u00A0'}
                  </div>
                );
              })}

              {/* Current prompt line with blinking cursor */}
              {!isCollapsing && !isAnimating && (
                <>
                  <div className={`flex items-center ${isMobile ? 'text-xs' : 'text-sm'} mt-2`} style={{ textShadow: '0 0 4px #008f11' }}>
                    <span>$ </span>
                    <span>{currentInput}</span>
                    <span className="animate-pulse ml-0.5">▌</span>
                  </div>
                  {/* Mobile floating Enter button */}
                  {isMobile && pendingCommand && (
                    <button
                      style={{
                        marginTop: 8,
                        alignSelf: 'flex-start',
                        background: '#111',
                        color: '#00ff00',
                        border: '1px solid #00ff00',
                        borderRadius: 6,
                        padding: '2px 16px',
                        fontSize: 14,
                        fontFamily: 'inherit',
                        fontWeight: 700,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                        letterSpacing: 1,
                        marginLeft: 0
                      }}
                      onClick={() => {
                        if (pendingCommand) {
                          // Hide button immediately
                          setTimeout(() => {
                            // This ensures the button disappears before executeCommand triggers collapse
                            // and avoids double execution if user taps fast
                          }, 0);
                          executeCommand(pendingCommand);
                        }
                      }}
                      aria-label="Enter"
                    >
                      Enter
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Terminal Footer: Only show on desktop */}
        {!isMobile && (
          <div className="h-6 bg-[#1a1a1a] border-t border-[#333] flex items-center justify-between px-3 text-[10px] text-[#666] shrink-0 rounded-b-lg">
            <span>Type T or A, then press Enter</span>
          
          </div>
        )}

        {/* Resize Handle */}
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize group"
          onMouseDown={startResize}
        >
          <svg 
            className="w-4 h-4 text-[#444] group-hover:text-[#00ff00] transition-colors" 
            viewBox="0 0 24 24" 
            fill="currentColor"
          >
            <path d="M22 22H20V20H22V22ZM22 18H20V16H22V18ZM18 22H16V20H18V22ZM22 14H20V12H22V14ZM18 18H16V16H18V18ZM14 22H12V20H14V22Z" />
          </svg>
        </div>
      </div>
    </div>
  );
};
