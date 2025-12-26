# Odil's Portfolio World

An interactive 3D portfolio where you control a robotic dog to explore projects, experience, and skills in a futuristic factory environment.

## 🚀 Local Setup Guide

Follow these instructions to run the project on your local machine.

### Prerequisites
1. **Node.js**: Install Node.js (version 18 or higher) from [nodejs.org](https://nodejs.org/).

### Installation

1.  **Open your terminal** and navigate to this project folder.
2.  **Install dependencies** using npm:
    ```bash
    npm install
    ```

### Configuration (API Key)

This project uses Google's Gemini API for dynamic commentary.
1.  Create a file named `.env` in the root directory.
2.  Add your API key to it:
    ```env
    API_KEY=your_google_genai_api_key_here
    ```

### Running the App

1.  **Start the development server**:
    ```bash
    npm run dev
    ```
2.  Open your browser and navigate to the local URL shown in the terminal (usually `http://localhost:5173`).

---

## 🛠 Project Structure

- **package.json**: Lists all the libraries and tools required (React, Three.js, Vite).
- **vite.config.ts**: Settings for the build tool.
- **components/**: Contains the 3D objects (RoboticDog, FactoryWorld, Zones).
- **models/**: Place your `.glb` 3D files in `public/models/`.

## 📦 Adding Custom Models

To replace the robot or factory with your own 3D models:
1. Place your `.glb` file in the `public/models/` folder.
2. Update the filename reference in `components/RoboticDog.tsx` or `components/FactoryWorld.tsx`.
3. If the model is complex, consider using [gltfjsx](https://github.com/pmndrs/gltfjsx) to generate a React component for it.
