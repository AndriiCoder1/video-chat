# Sign Language Video Chat Application

A full-stack application designed for the deaf community that translates sign language to text and vice versa in real-time.

## Features

- Real-time sign language recognition using machine learning
- Text-to-sign language translation using a 3D avatar
- Chat interface for communication
- Responsive design for various devices

## Technology Stack

### Frontend
- React.js
- Three.js (for 3D avatar rendering)
- TensorFlow.js/MediaPipe (for gesture recognition)
- WebRTC (for camera access)

### Backend
- Node.js
- Express.js
- Socket.io (for real-time communication)

## Project Structure

```
video-chat/
├── client/                 # Frontend React application
│   ├── public/             # Static files
│   └── src/                # React source code
│       ├── components/     # React components
│       ├── utils/          # Utility functions
│       ├── services/       # API services
│       └── assets/         # Images, 3D models, etc.
├── server/                 # Backend Node.js/Express application
│   ├── controllers/        # Request handlers
│   ├── models/             # Data models
│   ├── routes/             # API routes
│   └── services/           # Business logic
└── README.md               # Project documentation
```

## Installation

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- A modern web browser with WebGL and camera access support

### Setup Instructions

#### Option 1: Using the Setup Script (Recommended)

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/video-chat.git
   cd video-chat
   ```

2. Run the setup script
   ```bash
   node setup.js
   ```
   This script will automatically install all dependencies and start both the client and server.

3. Open your browser and navigate to `http://localhost:3000`

#### Option 2: Manual Setup

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/video-chat.git
   cd video-chat
   ```

2. Install backend dependencies
   ```bash
   cd server
   npm install
   ```

3. Install frontend dependencies
   ```bash
   cd ../client
   npm install
   ```

4. Start the development servers

   Backend:
   ```bash
   cd ../server
   npm run dev
   ```

   Frontend (in a new terminal):
   ```bash
   cd ../client
   npm start
   ```

5. Open your browser and navigate to `http://localhost:3000`

## Machine Learning Models

This application uses the following open-source models for sign language recognition:

- **MediaPipe Hands**: For hand tracking and gesture recognition
  - Provides real-time hand landmark detection
  - Identifies 21 3D landmarks of a hand from a single frame

- **TensorFlow.js**: For running the ML models in the browser
  - Enables on-device machine learning
  - Provides pre-trained models and tools for custom model training

## How It Works

### Sign Language Recognition

1. The application accesses the user's camera using WebRTC
2. Hand landmarks are detected using MediaPipe Hands
3. The landmarks are processed to extract features (angles, distances between joints)
4. These features are matched against known sign patterns or fed into a machine learning model
5. The recognized signs are displayed as text in the chat interface

### Text-to-Sign Translation

1. User types text messages in the chat interface
2. The text is sent to the server for processing
3. The server generates animation data for the 3D avatar
4. The 3D avatar performs the corresponding sign language gestures

## Extending the Application

### Adding New Signs

To add new signs to the recognition system:

1. Collect training data for the new signs
2. Extract features from the hand landmarks
3. Train a model or update the pattern matching system
4. Update the sign dictionary in the application

### Improving Recognition Accuracy

- Collect more training data from diverse users
- Implement more sophisticated feature extraction
- Use transfer learning with larger pre-trained models
- Implement sequence models (LSTM, GRU) for dynamic gestures

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [MediaPipe](https://mediapipe.dev/) for the hand tracking solution
- [TensorFlow.js](https://www.tensorflow.org/js) for the machine learning framework
- [Three.js](https://threejs.org/) for 3D rendering
- [Socket.io](https://socket.io/) for real-time communication