# Smart Mask Brace

## Innovation Overview
The Smart Mask Brace is a wearable health monitoring device that converts ordinary surgical masks into intelligent health monitoring systems. Developed during the COVID-19 pandemic, this device addresses the need for continuous health monitoring in public spaces.

## Problem Statement
During the pandemic, there was a critical need for:
- Non-invasive health monitoring
- Real-time vital signs tracking
- Early detection of health anomalies
- Affordable solution for mass deployment

## Solution
A compact, attachable device that clips onto standard surgical masks and monitors:
- **Blood Oxygen Saturation (SpO2)**
- **Body Temperature**
- **Breathing Rate**
- **Heart Rate** (derived from SpO2 sensor)

## Technical Specifications

### Hardware Components
- **Sensors**:
  - MAX30102 Pulse Oximeter and Heart Rate Sensor
  - MLX90614 Non-contact Infrared Temperature Sensor
- **Microcontroller**: ESP32 for processing and wireless communication
- **Power**: Rechargeable Li-ion battery (8+ hours operation)
- **Display**: OLED screen for real-time readings
- **Connectivity**: Bluetooth Low Energy (BLE) and WiFi

### Software Features
- Real-time data processing and filtering
- Mobile app for data visualization
- Cloud integration for health data analytics
- Alert system for abnormal readings
- Data logging and historical tracking

## Key Features

### 1. Non-Invasive Monitoring
All sensors work without direct skin contact, making it hygienic and comfortable for extended use.

### 2. Real-Time Alerts
Instant notifications for:
- Low oxygen levels (SpO2 < 95%)
- Elevated temperature (> 37.5°C)
- Irregular breathing patterns

### 3. Data Analytics
Cloud-based dashboard providing:
- Historical health trends
- Statistical analysis
- Predictive health insights
- Export capabilities for medical consultation

### 4. Low Power Design
Optimized firmware ensures:
- 8+ hours of continuous operation
- Fast charging (< 1 hour)
- Sleep modes during inactivity

## Recognition & Awards
- **Finalist**: National Innovation Competition 2021
- **Finalist**: IEEE Innovation Challenge
- **Featured**: Local tech media coverage

## Market Potential
- Healthcare facilities and hospitals
- Corporate offices and workplaces
- Educational institutions
- Public transportation systems
- Smart city infrastructure

## Technical Challenges Overcome

### 1. Sensor Placement
Optimized sensor positioning to get accurate readings without discomfort.

### 2. Motion Artifacts
Implemented advanced filtering algorithms to reduce noise from head movements.

### 3. Power Efficiency
Achieved optimal balance between sampling rate and battery life.

### 4. Data Privacy
Implemented end-to-end encryption for all health data transmission.

## Future Development
- Integration with telemedicine platforms
- AI-based health prediction models
- Miniaturization for integration into mask fabric
- Multi-user tracking system for organizations
- Integration with smartwatches and fitness trackers

## Technical Stack
- **Firmware**: Arduino C/C++ on ESP32
- **Mobile App**: React Native (cross-platform)
- **Backend**: Node.js with Express
- **Database**: MongoDB for time-series health data
- **Cloud**: AWS IoT Core for device management

## Impact
During field testing:
- Monitored 100+ users over 6 months
- Detected 12 potential health issues early
- Achieved 98.5% uptime and reliability
- Received positive feedback from healthcare professionals

## Team
- **Lead Developer**: Odil Janandith
- **Project Type**: Independent Research
- **Year**: 2021
