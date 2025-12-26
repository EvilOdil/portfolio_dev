import { PortfolioSection } from '../types';

export const PORTFOLIO_DATA: PortfolioSection[] = [
  {
    id: 'summary',
    title: 'About Odil',
    color: '#00f3ff',
    position: [0, 0, -40],
    items: [
      {
        title: 'Odil Janandith',
        subtitle: 'BSc Eng (Hons) in Electronic and Telecommunication',
        description: 'I am a project-oriented creative person with a passion towards space tech, wearables, robotics, and startups. My vision is to come up with tech solutions to solve pressing socio-economic problems in the world.',
        details: [
          'Contact: janandithwao.21@uom.lk',
          'Phone: +94(71) 183-1923',
          'Location: Colombo, Sri Lanka'
        ]
      }
    ]
  },
  {
    id: 'projects',
    title: 'Projects',
    color: '#ff00ff',
    position: [40, 0, 0],
    items: [
      {
        title: 'Obo Mouse v1.0, v2.0',
        subtitle: 'RoboticGen',
        description: 'Home grown micromouse robot based on STM32, programmed with Embedded C. Won 2nd Place at SLIIT Robofest and Championship at IIT MicroMaze 2024.',
      },
      {
        title: 'Taprobane 3.0 Rover',
        subtitle: 'SEDS Sri Lanka',
        description: 'Control & Data Handling Lead. Designed control systems for the European Rover Challenge finalist rover. Proposed novel mapping/localization and MPFL architecture.',
      },
      {
        title: 'Smart Mask Brace',
        description: 'Wearable device converting surgical masks into smart masks. Monitors blood oxygen & temperature. Finalist in multiple innovation competitions.',
      },
      {
        title: 'QSentinal IOT Suite',
        description: 'Developed IoT protocols (lotEN and lotUDP) for enhanced security and payload. Used for swarm robotics and cold chain supply chains.',
      },
      {
        title: 'Agrivoltaic Solar Project',
        subtitle: 'Eco Nova',
        description: 'Award-winning project combining solar power with agriculture using IoT hardware to increase ROI by 4x.',
      },
      {
        title: 'Vision Based Bin Picking',
        description: 'Industrial warehouse computer vision system using FastSAM model achieving 7 FPS on CPU.',
      }
    ]
  },
  {
    id: 'experience',
    title: 'Experience',
    color: '#ffff00',
    position: [-40, 0, 0],
    items: [
      {
        title: 'Chief Technology Officer',
        subtitle: 'RoboticGen Academy | Sep 2023 - Present',
        description: 'Leading the "Future of Learning" project and developing "Oboverse" edutech hardware/software ecosystem.',
      },
      {
        title: 'Robotics Engineer Intern',
        subtitle: 'RoboticGen | Dec 2024 - Jun 2025',
        description: 'Developing custom robotics stack based on the Unitree Go2 Air platform.',
      },
      {
        title: 'Technical Team Lead',
        subtitle: 'Team Taprobane 4.0 | Mar 2024 - Present',
        description: 'Leading the team for the remote edition of European Rover Challenge 2024.',
      },
      {
        title: 'Intern',
        subtitle: 'Circuit Breakers Robotics | Aug 2020 - Mar 2022',
        description: 'Created content to teach robotics to kids and empowered robotics education in Sri Lanka.',
      }
    ]
  },
  {
    id: 'skills',
    title: 'Skills & Tech',
    color: '#00ff00',
    position: [0, 0, 40],
    items: [
      {
        title: 'Technical Stack',
        description: 'C++, Embedded C, Python, ROS, System Verilog, Git.',
      },
      {
        title: 'Hardware Design',
        description: 'PCB Designing (Altium), Parametric Modelling (SolidWorks, Onshape).',
      },
      {
        title: 'Machine Vision',
        description: 'Segmentation (UNET), Object Detection (YOLO), Transformers (SAM, Depth Anything).',
      }
    ]
  },
  {
    id: 'achievements',
    title: 'Achievements',
    color: '#ff8800',
    position: [30, 0, 30],
    items: [
      {
        title: 'Champions - SPARK Challenge',
        date: 'Nov 2024',
        description: 'Team Eco Nova won for agri-voltaic solar project.',
      },
      {
        title: 'Champions - IIT MicroMaze',
        date: 'Sep 2024',
        description: 'First place with Obo Mouse v2.0.',
      },
      {
        title: 'Winners - Comfix\'4',
        date: 'Sep 2024',
        description: 'First place pitching QSentinal IOT Suite research.',
      },
      {
        title: 'Champions - IESL RoboGame',
        date: 'Nov 2023',
        description: 'First place with computer vision system for Kobuki platform.',
      }
    ]
  },
  {
    id: 'education',
    title: 'Education',
    color: '#ffffff',
    position: [-30, 0, 30],
    items: [
      {
        title: 'University of Moratuwa',
        subtitle: '2022 - Present',
        description: 'BSc Eng (Hons) in Electronic and Telecommunication. CGPA: 3.52/4.0.',
      },
      {
        title: 'Ananda College',
        subtitle: '2007 - 2020',
        description: 'Physical Science Stream. Senior Quiz Team, Sinhala Literary Union.',
      }
    ]
  }
];
