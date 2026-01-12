# Agrivoltaic Solar Project

## Project Overview
The Agrivoltaic Solar Project, developed under Team Eco Nova, is an innovative solution that combines solar power generation with agricultural production. This award-winning project demonstrates how the same land can be used for both farming and renewable energy, maximizing return on investment (ROI) by 4x compared to traditional solar farms.

## The Agrivoltaic Concept
Agrivoltaics (or agrophotovoltaics) is the co-development of the same area of land for both solar photovoltaic power and agriculture. By raising solar panels to appropriate heights, crops can be grown underneath, creating a symbiotic relationship between energy and food production.

## Award Recognition
🏆 **Champions - SPARK Challenge November 2024**

Team Eco Nova was recognized for innovation in sustainable agriculture and renewable energy integration.

## Key Innovations

### 1. Smart IoT Monitoring System
Developed a comprehensive IoT hardware and software ecosystem to:
- Monitor soil moisture levels
- Track temperature and humidity
- Measure light intensity reaching crops
- Monitor solar panel performance
- Optimize irrigation schedules

### 2. Dynamic Panel Positioning
Implemented automated tracking system:
- Adjusts panel tilt based on sun position
- Optimizes light distribution to crops below
- Maximizes solar energy capture
- Responsive to weather conditions

### 3. Crop Selection Algorithm
AI-powered system to recommend:
- Optimal crops for given light conditions
- Planting schedules
- Rotation strategies
- Expected yield predictions

## Technical Architecture

### Hardware Components
- **Solar Panels**: 300W monocrystalline panels with adjustable mounting
- **IoT Sensors**:
  - DHT22 (Temperature & Humidity)
  - Capacitive soil moisture sensors
  - BH1750 (Light intensity)
  - INA219 (Solar panel current/voltage)
- **Microcontrollers**: ESP32 for each monitoring node
- **Actuators**: Servo motors for panel adjustment
- **Irrigation**: Solenoid valves with automated control

### Software Stack
- **Firmware**: Arduino C++ on ESP32
- **Communication**: MQTT protocol for sensor data
- **Backend**: Node.js with Express
- **Database**: InfluxDB for time-series sensor data
- **Frontend**: React dashboard for real-time monitoring
- **ML Models**: TensorFlow for crop recommendations

## Performance Metrics

### ROI Improvement: 4x
Traditional solar farm ROI: ~10-12% annually
Agrivoltaic ROI: ~40-45% annually

#### Revenue Streams:
1. **Solar Energy**: Electricity generation and net metering
2. **Agricultural Produce**: Crop sales
3. **Water Savings**: 20-30% reduction in irrigation needs
4. **Land Efficiency**: Dual use of same land area

### Energy Production
- Panel Efficiency: 19.5% (maintained)
- Annual Generation: 450 kWh per panel
- Minimal shading loss: < 5%

### Agricultural Benefits
- Crop yield: 85-90% of traditional farming
- Water usage: 30% reduction
- Soil quality: Improved due to reduced evaporation
- Crop varieties tested: Leafy greens, berries, root vegetables

## Environmental Impact

### Carbon Footprint Reduction
- Displaces 4.5 tons of CO2 per kW installed annually
- Promotes sustainable farming practices
- Reduces water stress on agricultural land

### Biodiversity
- Creates microclimate beneficial for pollinators
- Provides shade and habitat for beneficial insects
- Reduces soil degradation

## Pilot Implementation

### Site Details
- Location: Colombo, Sri Lanka
- Area: 1000 square meters
- Solar Capacity: 50 kW
- Crops: Spinach, lettuce, strawberries

### Results (6-month pilot)
- Energy Generated: 22,500 kWh
- Crop Yield: 850 kg (mixed vegetables)
- Water Saved: 35% compared to traditional farming
- Maintenance Downtime: < 2%

## IoT Dashboard Features

### Real-Time Monitoring
- Live sensor data visualization
- Solar panel performance metrics
- Crop health indicators
- Weather forecast integration

### Automation Controls
- Automated irrigation scheduling
- Panel tilt optimization
- Alert system for anomalies
- Remote control via mobile app

### Analytics
- Historical data analysis
- Predictive models for yield
- Energy generation forecasts
- ROI tracking and projections

## Challenges & Solutions

### Challenge 1: Uneven Light Distribution
**Solution**: Dynamic panel tracking algorithm to ensure uniform light exposure throughout the day.

### Challenge 2: Sensor Reliability
**Solution**: Redundant sensor deployment with data validation algorithms.

### Challenge 3: Water Management
**Solution**: AI-based irrigation scheduling using soil moisture, weather forecast, and crop type.

### Challenge 4: Panel Cleaning
**Solution**: Scheduled automated cleaning system and dust accumulation monitoring.

## Scalability

### Small Scale (< 1000m²)
- Residential applications
- Community gardens
- Educational institutions

### Medium Scale (1000-10,000m²)
- Small farms
- Commercial agriculture
- Industrial rooftops

### Large Scale (> 10,000m²)
- Agricultural farms
- Solar parks with integrated farming
- Government renewable energy projects

## Economic Model

### Initial Investment
- Solar panels & mounting: $15,000
- IoT system: $2,000
- Irrigation system: $1,500
- Installation: $2,500
- **Total**: ~$21,000 for 1000m²

### Annual Returns
- Electricity sales: $6,000
- Crop sales: $3,500
- Water cost savings: $500
- **Total**: ~$10,000/year

**Payback Period**: ~2.1 years

## Future Enhancements
- Integration of vertical farming techniques
- Energy storage with batteries
- Greenhouse integration for controlled environment
- Blockchain for transparent energy trading
- AI for pest and disease prediction
- Integration with smart grid

## Technical Stack Summary
- **IoT**: ESP32, MQTT, InfluxDB
- **Backend**: Node.js, Express, MongoDB
- **Frontend**: React, Chart.js
- **ML**: TensorFlow, scikit-learn
- **Mobile**: Flutter (cross-platform)
- **Cloud**: AWS IoT Core

## Team Eco Nova
- **Technical Lead**: Odil Janandith
- **Project Type**: Research & Commercialization
- **Year**: 2024
- **Status**: Active deployment and scaling

## Resources & Documentation
- Detailed installation guide
- API documentation
- Mobile app (iOS/Android)
- Video demonstrations
- Case study reports

## Media Coverage
- Featured in national newspapers
- Interview on sustainable agriculture TV program
- Technical presentation at renewable energy conference

---

*This project demonstrates the potential of combining modern technology with traditional agriculture to create sustainable, profitable, and environmentally friendly food and energy production systems.*
