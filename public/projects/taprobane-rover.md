# Taprobane 3.0 Rover

## Project Overview
Taprobane 3.0 is Sri Lanka's premier Mars rover developed by SEDS (Students for the Exploration and Development of Space) at University of Moratuwa. The rover was designed to compete in the European Rover Challenge (ERC), one of the most prestigious robotics competitions in the world.

## Role: Control & Data Handling Lead
As the Control & Data Handling Lead, I was responsible for:
- Designing and implementing the rover's control architecture
- Developing the communication protocols
- Creating novel mapping and localization algorithms
- Proposing and implementing the MPFL (Mission Planning and Fault Localization) architecture

## Technical Architecture

### Control System
- **Framework**: ROS2 (Robot Operating System 2)
- **Programming**: C++ and Python
- **Hardware Interface**: Custom PCB with STM32 microcontrollers
- **Communication**: CAN Bus for internal systems, WiFi for ground station

### Navigation & Localization
Proposed and implemented a novel approach combining:
1. **Visual Odometry**: Camera-based position estimation
2. **IMU Fusion**: Gyroscope and accelerometer data integration
3. **GPS Integration**: For absolute positioning
4. **Terrain Mapping**: LiDAR and camera-based 3D reconstruction

### MPFL Architecture (Mission Planning & Fault Localization)
A proprietary system designed to:
- **Mission Planning**: Autonomous task scheduling and execution
- **Fault Detection**: Real-time system health monitoring
- **Fault Localization**: Pinpoint hardware/software failures
- **Recovery Strategies**: Automatic failover and recovery procedures

## Competition Tasks
The rover was designed to complete multiple complex tasks:

1. **Autonomous Traversal**: Navigate through challenging Martian-like terrain
2. **Science Task**: Collect soil samples and perform on-site analysis
3. **Equipment Servicing**: Perform maintenance operations on mock equipment
4. **Probing Task**: Use robotic arm to probe and identify objects

## Key Innovations

### Novel Mapping Algorithm
Developed a custom SLAM (Simultaneous Localization and Mapping) variant optimized for:
- Low computational overhead
- Resilience to sensor noise
- Real-time performance on embedded systems

### Predictive Fault Management
Implemented machine learning models to predict component failures before they occur, allowing proactive maintenance scheduling.

## Results
- **Finalist** at European Rover Challenge 2024
- Successfully completed all autonomous navigation tasks
- Demonstrated superior fault tolerance compared to competing designs

## Technical Stack
- ROS2 Humble
- C++17, Python 3.10
- OpenCV for computer vision
- PCL (Point Cloud Library) for LiDAR processing
- Custom embedded firmware in C

## Team
- **Control & Data Handling Lead**: Odil Janandith
- **Organization**: SEDS Sri Lanka
- **Institution**: University of Moratuwa
- **Year**: 2023-2024

## Future Work
- Integration of AI-based terrain classification
- Enhanced autonomous decision-making
- Improved power management for extended missions
