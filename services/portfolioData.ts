import { PortfolioSection } from '../types';

export const PORTFOLIO_DATA: PortfolioSection[] = [
  {
    id: 'summary',
    title: 'Profile',
    color: '#F2C94C', // Safety Yellow
    position: [0, 4, -40],
    items: [
      {
        title: 'Odil Janandith',
        subtitle: 'BSc Eng (Hons) in Electronic and Telecommunication',
        description: 'I am an Engineering student with a passion for **robotics**, **computer vision**, and **startups**. I have a strong foundation in **SLAM**, **computer vision for robotic perception**, and **embedded systems**. For my final year thesis, I am building an **autonomous mobility system** for quadruped and wheeled platforms. When I\'m not building or coding robots, I work on developing **STEM curriculum** and **Ed-tech platforms** for the next generation of students.',
        details: [
          'Contact: odiljanandith@gmail.com',
          'Phone: +94(71) 183-1923',
          'Location: Colombo, Sri Lanka'
        ],
        techStack: [
          'ROS2',
          'Python',
          'C++',
          'Embedded C',
          'Git',
          'Linux',
          'OpenCV',
          'PyTorch',
          'Altium',
          'SolidWorks',
          'Docker',
          'STM32',
          'React',
        ],
        softSkills: ['Public Speaking', 'Problem Solving', 'Quizzing'],
        socials: [
          { name: 'LinkedIn', url: 'https://www.linkedin.com/in/odil-janandith-940a63166/', icon: 'linkedin' },
          { name: 'GitHub', url: 'https://github.com/EvilOdil', icon: 'github' },
          { name: 'Facebook', url: 'https://www.facebook.com/odil.janandith.1', icon: 'facebook' }
        ]
      }
    ]
  },
  {
    id: 'experience',
    title: 'Experience',
    color: '#FF8800', // Warning Orange
    position: [-40, 4, 0],
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
    id: 'publications',
    title: 'Publications',
    color: '#9B59B6', // Purple
    position: [40, 4, -20],
    items: [
      {
        title: 'Coming Soon',
        description: 'Research publications will be added here.',
      }
    ]
  },
  {
    id: 'projects',
    title: 'Projects',
    color: '#E0E0E0', // Off-White (High Contrast)
    position: [0, 2.5, -5],
    items: [
      {
        title: 'Obo Mouse v1.0, v2.0',
        subtitle: 'RoboticGen',
        description: 'Home grown micromouse robot based on STM32, programmed with Embedded C. Won 2nd Place at SLIIT Robofest and Championship at IIT MicroMaze 2024.',
        image: '/images/projects/obo-mouse.jpg',
        githubUrl: 'https://github.com/EvilOdil/OboMouse',
        markdownFile: '/projects/obo-mouse.md',
        tags: ['Robotics', 'Embedded Systems']
      },
      {
        title: 'Taprobane 3.0 Rover',
        subtitle: 'SEDS Sri Lanka',
        description: 'Control & Data Handling Lead. Designed control systems for the European Rover Challenge finalist rover. Proposed novel mapping/localization and MPFL architecture.',
        image: '/images/projects/taprobane-rover.jpg',
        githubUrl: 'https://github.com/SEDS-UOM/Taprobane3.0',
        markdownFile: '/projects/taprobane-rover.md',
        tags: ['Robotics', 'Software', 'Computer Vision']
      },
      {
        title: 'Smart Mask Brace',
        description: 'Wearable device converting surgical masks into smart masks. Monitors blood oxygen & temperature. Finalist in multiple innovation competitions.',
        image: '/images/projects/smart-mask.jpg',
        githubUrl: 'https://github.com/EvilOdil/SmartMask',
        markdownFile: '/projects/smart-mask.md',
        tags: ['Embedded Systems', 'Software']
      },
      {
        title: 'QSentinal IOT Suite',
        description: 'Developed IoT protocols (lotEN and lotUDP) for enhanced security and payload. Used for swarm robotics and cold chain supply chains.',
        image: '/images/projects/qsentinal.jpg',
        githubUrl: 'https://github.com/EvilOdil/QSentinal',
        markdownFile: '/projects/qsentinal.md',
        tags: ['Software', 'Embedded Systems', 'Robotics', 'Research']
      },
      {
        title: 'Agrivoltaic Solar Project',
        subtitle: 'Eco Nova',
        description: 'Award-winning project combining solar power with agriculture using IoT hardware to increase ROI by 4x.',
        image: '/images/projects/agrivoltaic.jpg',
        githubUrl: 'https://github.com/EvilOdil/Agrivoltaic',
        markdownFile: '/projects/agrivoltaic.md',
        tags: ['Embedded Systems', 'Software']
      },
      {
        title: 'Vision Based Bin Picking',
        description: 'Industrial warehouse computer vision system using FastSAM model achieving 7 FPS on CPU.',
        image: '/images/projects/bin-picking.jpg',
        githubUrl: 'https://github.com/EvilOdil/VisionBinPicking',
        markdownFile: '/projects/bin-picking.md',
        tags: ['Computer Vision', 'Robotics', 'Software']
      }
    ]
  },
  {
    id: 'education',
    title: 'Education',
    color: '#A0A0A0', // Muted Grey
    position: [-50, 4, 30],
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
  },
  {
    id: 'achievements',
    title: 'Awards',
    color: '#FFFFFF', // Pure White
    position: [30, 2, 30],
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
    id: 'speeches',
    title: 'Speeches',
    color: '#00A3FF', // Tech Blue
    position: [0, 2, 40],
    items: [
      {
        title: 'Coming Soon',
        description: 'Speeches and talks will be added here.',
      }
    ]
  },
  {
    id: 'blog',
    title: 'Blog',
    color: '#27AE60', // Green
    position: [50, 4, 0],
    items: [
      {
        title: 'Coming Soon',
        description: 'Blog posts will be added here.',
      }
    ]
  }
];