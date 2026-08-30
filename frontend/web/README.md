# WeatherGPT Frontend

A modern, responsive web application built with Next.js for the WeatherGPT platform.

## Features

- 🌤️ Beautiful weather dashboard with real-time data
- 🌍 Multi-language support (10 Indian languages)
- 💬 AI-powered conversational chat interface
- 📅 7-day weather forecast visualization
- 📍 Location-based weather queries
- 🌙 Dark mode support
- 📱 Fully responsive design (mobile, tablet, desktop)

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **UI Components**: Radix UI primitives
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Charts**: Recharts
- **Notifications**: React Hot Toast
- **State Management**: React hooks

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Building

```bash
npm run build
npm start
```

## API Configuration

Set the API URL in `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

## Environment Variables

Create a `.env.local` file in the root:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1

# Optional: Backend URL for Docker deployment
NEXT_PUBLIC_BACKEND_URL=http://backend:8000
```

## Project Structure

```
frontend/web/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout with ThemeProvider
│   ├── globals.css        # Global styles
│   └── page.tsx           # Main homepage
├── components/            # React components
│   ├── ui/                # Shared UI components (Button, Card, etc.)
│   ├── WeatherCard.tsx    # Weather information card
│   ├── ChatInterface.tsx  # Chat widget
│   ├── LocationSelector.tsx
│   └── LanguageSelector.tsx
├── lib/                   # Utility functions
│   └── utils.ts           # Helper functions
├── public/                # Static assets
├── .gitignore
├── Dockerfile
├── next.config.js         # Next.js configuration
├── package.json
├── tailwind.config.ts     # Tailwind CSS configuration
└── tsconfig.json
```

## Docker Deployment

```bash
# Build and run with docker-compose
cd ../..
docker-compose up --build
```

The frontend will be available at `http://localhost:3000`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## License

MIT
