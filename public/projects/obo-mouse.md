# Obo Mouse v1.0, v2.0

## Overview
The Obo Mouse is a home-grown micromouse robot platform developed at RoboticGen, designed to compete in micromouse maze-solving competitions. Built using STM32 microcontrollers and programmed entirely in Embedded C, this project showcases advanced embedded systems design and autonomous navigation algorithms.

## Achievements
- **2nd Place** at SLIIT Robofest 2024
- **Championship** at IIT MicroMaze 2024

## Technical Specifications

### Hardware
- **Microcontroller**: STM32F4 series
- **Motors**: High-speed DC motors with encoders
- **Sensors**: 
  - IR distance sensors for wall detection
  - Gyroscope for orientation tracking
  - Encoders for precise movement control
- **Power**: LiPo battery system with custom power management

### Software Architecture
- **Programming Language**: Embedded C
- **Algorithm**: Flood-fill maze solving algorithm
- **Control System**: PID-based motor control
- **Navigation**: Dead reckoning with sensor fusion

## Key Features
1. **Autonomous Navigation**: Self-learning maze-solving algorithm
2. **Speed Optimization**: Optimized path planning for fastest runs
3. **Robust Sensors**: Multiple redundant sensors for reliability
4. **Real-time Processing**: All computation done on-board in real-time

## Design Evolution

### v1.0
- Initial prototype with basic flood-fill algorithm
- Single-layer PCB design
- Standard DC motors

### v2.0 (Championship Version)
- Enhanced algorithm with diagonal movement support
- Custom multi-layer PCB with improved power distribution
- High-performance motors with better acceleration
- Optimized sensor placement for better wall detection

## Competition Performance
The Obo Mouse demonstrated exceptional performance in competitions, consistently solving mazes faster than competing designs. The v2.0 version achieved sub-10-second solve times on standard competition mazes.

## Future Improvements
- Integration of machine learning for adaptive navigation
- Wireless telemetry for debugging and performance analysis
- Smaller form factor for tighter turns
- Implementation of SLAM for more complex maze scenarios

## Team
- **Lead Developer**: Odil Janandith
- **Organization**: RoboticGen
- **Year**: 2024
