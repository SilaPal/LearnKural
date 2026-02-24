# Thirukural Learning Web App

A comprehensive interactive learning platform for children (ages 6-14) to explore the ancient Tamil text Thirukkural through modern web technologies.

## Features

### Core Learning Experience
- **Interactive Kural Display** - Individual verses with Tamil and English text and meanings
- **Audio Pronunciation** - Play authentic Tamil and English pronunciation recordings
- **Speech Recognition** - Practice Tamil pronunciation with real-time feedback
- **Video Integration** - Embedded YouTube videos for enhanced learning context
- **Progress Tracking** - Points-based system with milestone celebrations

### Technical Features
- **Bilingual Interface** - Seamless switching between Tamil and English
- **Google Sheets Integration** - Dynamic content management and synchronization
- **Responsive Design** - Mobile-first approach with Tailwind CSS
- **Real-time Feedback** - Speech recognition scoring and pronunciation guidance
- **Admin Panel** - Content management and synchronization tools

## Technology Stack

### Frontend
- **React 18** with TypeScript for type safety
- **Vite** for fast development and optimized builds
- **Tailwind CSS** for responsive styling
- **Radix UI** with shadcn/ui components
- **TanStack Query** for state management
- **Wouter** for lightweight routing
- **Web Speech API** for pronunciation practice

### Backend
- **Node.js** with Express.js
- **TypeScript** with ES modules
- **In-memory storage** for data persistence
- **Simple authentication** system
- **Google Sheets proxy** for CORS handling

### Audio & Speech
- **HTML5 Audio API** for playback
- **webkitSpeechRecognition** for Tamil speech recognition
- **Levenshtein distance** algorithm for pronunciation scoring
- **Multilingual support** (Tamil ta-IN, English en-US)

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation
1. Clone the repository
```bash
git clone <your-repo-url>
cd thirukural-learning-app
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
# Copy example environment file
cp .env.example .env

# Add your configuration
SESSION_SECRET=your-session-secret-here
```

4. Start development server
```bash
npm run dev
```

The app will be available at `http://localhost:5000`

### Production Build
```bash
npm run build
npm start
```

## Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/           # Utility functions
│   │   ├── pages/         # Page components
│   │   └── App.tsx        # Main application component
├── server/                # Backend Express application
│   ├── auth.ts           # Authentication logic
│   ├── routes.ts         # API endpoints
│   ├── storage.ts        # Data storage layer
│   └── index.ts          # Server entry point
├── shared/               # Shared types and schemas
│   └── schema.ts         # Data type definitions
└── components.json       # shadcn/ui configuration
```

## Configuration

### Authentication
- Default admin credentials: `admin` / `thirukural2025`
- Session-based authentication with secure cookies
- Admin-only routes for content management

### Google Sheets Integration
- Configure your Google Sheets URL in the admin panel
- Supports CSV export format with specific column structure
- Automatic URL conversion for GitHub and YouTube links

### Audio Files
- Supports external audio hosting (GitHub, CDN, etc.)
- Automatic conversion of GitHub blob URLs to raw URLs
- HTML5 audio with fallback handling

## Content Management

### Kural Data Structure
Each kural contains:
- `id` - Unique identifier
- `kural_tamil` - Tamil verse text
- `kural_english` - English translation
- `meaning_tamil` - Tamil meaning/explanation
- `meaning_english` - English meaning/explanation
- `audio_tamil_url` - Tamil pronunciation audio URL
- `audio_english_url` - English pronunciation audio URL
- `youtube_tamil_url` - Tamil educational video URL
- `youtube_english_url` - English educational video URL

### Google Sheets Format
The app expects a CSV with columns matching the above structure. URLs are automatically processed:
- GitHub blob URLs → raw URLs
- YouTube share links → embed URLs

## Speech Recognition

### Supported Languages
- **Tamil (ta-IN)** - Primary language for pronunciation practice
- **English (en-US)** - Secondary language support

### Pronunciation Scoring
- Uses Levenshtein distance algorithm
- Compares spoken words with expected kural text
- Provides real-time feedback and encouragement
- Threshold-based scoring system

## API Endpoints

### Public Endpoints
- `GET /api/kurals` - Fetch all kurals
- `GET /api/kurals/:id` - Fetch specific kural
- `POST /api/proxy-sheet` - Proxy Google Sheets requests

### Admin Endpoints (Authentication Required)
- `POST /api/sync-kurals` - Synchronize with Google Sheets
- `POST /api/kurals/add-test` - Add test kural for development

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Deployment

### Replit
This app is optimized for Replit deployment:
- Automatic workflow configuration
- Environment variable management
- One-click deployment

### Other Platforms
Compatible with:
- Vercel
- Netlify
- Railway
- Heroku
- Any Node.js hosting platform

## License

MIT License - see LICENSE file for details

## Acknowledgments

- **Thiruvalluvar** - Original author of Thirukkural
- **Tamil Literary Heritage** - Source of wisdom and inspiration
- **Open Source Community** - Tools and libraries that made this possible

## Support

For questions or issues:
1. Check existing GitHub issues
2. Create a new issue with detailed description
3. Include steps to reproduce any bugs

---

Built with ❤️ for preserving and sharing Tamil cultural heritage through modern technology.