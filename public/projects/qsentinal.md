# QSentinal IoT Suite

![QSentinal IoT Architecture](/images/linux.png)

## Project Overview
QSentinal is a comprehensive IoT communication suite designed to address critical security and efficiency limitations in existing IoT protocols. The project introduces two novel protocols: **lotEN** (IoT Enhanced Network) and **lotUDP** (IoT Universal Data Protocol), optimized for swarm robotics and industrial IoT applications.

## Motivation
Traditional IoT protocols suffer from:
- Inadequate security for sensitive industrial data
- Large payload overhead reducing efficiency
- Poor scalability for swarm systems
- Lack of real-time guarantees

QSentinal was developed to solve these challenges with a ground-up protocol design.

## Core Protocols

### lotEN (IoT Enhanced Network)
A lightweight, secure protocol optimized for:
- **Low Latency**: Sub-millisecond response times
- **High Security**: AES-256 encryption with perfect forward secrecy
- **Low Overhead**: 60% reduction in packet size vs. MQTT
- **Reliability**: Built-in error correction and packet recovery

#### Technical Features
- Custom binary serialization format
- Dynamic payload compression
- Multi-level authentication
- Mesh networking support
- Quality of Service (QoS) levels: 0, 1, 2

### lotUDP (IoT Universal Data Protocol)
Designed for high-throughput, real-time data streams:
- **Speed**: UDP-based for minimal latency
- **Efficiency**: Optimized packet structure
- **Multicast**: Support for one-to-many communication
- **Time Synchronization**: Built-in NTP-like sync mechanism

## Key Applications

### 1. Swarm Robotics
- Inter-robot communication
- Coordinated movement and task allocation
- Real-time sensor data sharing
- Emergency stop propagation

**Performance**: Successfully tested with 50+ robots simultaneously communicating with < 5ms latency.

### 2. Cold Chain Supply Management
- Temperature and humidity monitoring
- Real-time alerts for threshold violations
- GPS tracking integration
- Predictive maintenance for refrigeration units

**Impact**: Reduced spoilage by 35% in pilot deployment.

## Technical Architecture

### Protocol Stack
```
┌─────────────────────────┐
│   Application Layer     │
├─────────────────────────┤
│   lotEN / lotUDP        │
├─────────────────────────┤
│   Security Layer        │
├─────────────────────────┤
│   Transport (TCP/UDP)   │
├─────────────────────────┤
│   Network (IP)          │
└─────────────────────────┘
```

### Security Features
1. **End-to-End Encryption**: All data encrypted at source
2. **Certificate-Based Auth**: PKI infrastructure
3. **Replay Protection**: Timestamp and nonce validation
4. **Secure Boot**: Device firmware verification
5. **OTA Updates**: Secure over-the-air firmware updates

### Hardware Support
- ESP32/ESP8266 modules
- STM32 microcontrollers
- Raspberry Pi
- Custom hardware with network chips (W5500, ENC28J60)

## Performance Benchmarks

### Throughput
- lotEN: 1,000+ messages/sec per device
- lotUDP: 10,000+ messages/sec per device

### Latency
- lotEN: Average 2-5ms (TCP-based)
- lotUDP: Average < 1ms (UDP-based)

### Packet Overhead
- lotEN: 18 bytes header (vs MQTT's 45+ bytes)
- lotUDP: 12 bytes header

### Power Consumption
- 40% more efficient than MQTT-TLS
- Enables battery-powered devices to last 2x longer

## Recognition & Awards
- **1st Place**: Comfix'4 Research Pitch Competition 2024
- **Featured**: IEEE IoT Journal submission
- **Patent**: Provisional patent filed for protocol design

## Real-World Deployments

### Pilot Project 1: University Smart Campus
- 200+ sensor nodes
- Real-time environmental monitoring
- 6 months of continuous operation
- 99.8% uptime achieved

### Pilot Project 2: Agricultural IoT
- 50 nodes monitoring soil and weather
- Integration with automated irrigation
- 45% water savings demonstrated

## Open Source Components
- Protocol specification (RFC-style documentation)
- Reference implementation in C/C++
- Python client library
- Node.js SDK
- Example projects and tutorials

## Technical Challenges Solved

### 1. NAT Traversal
Implemented STUN/TURN-like mechanism for devices behind NATs.

### 2. Packet Loss Handling
Custom ARQ (Automatic Repeat Request) optimized for IoT constraints.

### 3. Time Synchronization
Developed lightweight time sync algorithm (accuracy ±10ms).

### 4. Scalability
Hierarchical addressing scheme supporting millions of devices.

## Future Roadmap
- IPv6 full support
- 5G integration
- Edge computing support
- AI-based anomaly detection
- Blockchain integration for audit trails

## Technical Stack
- **Core Protocol**: C/C++
- **Testing**: Python with pytest
- **Simulation**: ns-3 network simulator
- **Documentation**: Markdown, Doxygen
- **CI/CD**: GitHub Actions

## Publications
- Conference paper submitted to IEEE IoT Conference 2025
- Technical blog series on protocol design

## Team
- **Lead Developer & Architect**: Odil Janandith
- **Project Type**: Research & Development
- **Year**: 2023-2024

## Resources
- GitHub Repository: [github.com/EvilOdil/QSentinal](https://github.com/EvilOdil/QSentinal)
- Documentation: Comprehensive API docs and tutorials
- Community: Active Discord server for developers
