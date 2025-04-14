# IoT People Counter System

This project is an IoT-based people counting system that combines hardware sensors, machine learning, and web visualization to track and analyze foot traffic in real-time.

## System Components

### Hardware (Wokwi)
- Arduino-based sensor system using Wokwi simulator
- Implements sensor logic for detecting and counting people
- Generates real-time data for the bridge component

### Bridge
- `serial_to_api.py`: Acts as a middleware between hardware and software
- Handles serial communication with the hardware
- Forwards sensor data to the ML processing system

### Machine Learning (ML)
- `main.py`: Core ML processing system
- `counter.py`: People counting algorithm implementation
- Processes sensor data to accurately detect and count people
- Implements real-time analysis and data processing

### Web Client
- React-based web application
- Real-time visualization of people counting data
- Interactive dashboard for monitoring and analysis
- Built with modern web technologies (Vite, Tailwind CSS)

## System Flow
1. Hardware sensors detect movement and presence
2. Data is sent through the bridge component
3. ML system processes and analyzes the data
4. Results are displayed in real-time on the web client

## Key Features
- Real-time people counting
- Machine learning-based detection
- Web-based visualization
- Hardware simulation and testing
- Data processing and analysis
