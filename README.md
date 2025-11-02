# Gymzarski - PPL Workout Tracker

A modern, mobile-first Progressive Web App for tracking Push/Pull/Legs workouts.

## Features

- 📱 Mobile-first design with responsive UI
- 💪 Track Push, Pull, and Legs workouts
- 📊 Progress tracking and visualization
- 🎨 Clean, minimalist interface
- 💾 Local storage for offline functionality
- ⚡ Fast and lightweight

## Tech Stack

- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Vite** for blazing-fast development
- **React Router** for navigation
- **date-fns** for date formatting
- **Recharts** for data visualization
- **Lucide React** for icons

## Getting Started

### Prerequisites

- Node.js 16+ and npm

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
gymzarski/
├── src/
│   ├── components/
│   │   ├── layout/        # Layout components (BottomNav, Layout)
│   │   └── ui/            # Reusable UI components (Button, Card, Input, Modal)
│   ├── pages/             # Page components (Home, Workouts, Progress, Profile)
│   ├── services/          # API and data services
│   ├── hooks/             # Custom React hooks
│   ├── types/             # TypeScript type definitions
│   ├── utils/             # Utility functions
│   ├── App.tsx           # Main app component
│   ├── main.tsx          # App entry point
│   └── index.css         # Global styles with Tailwind
├── public/               # Static assets
└── index.html           # HTML entry point
```

## Development Phases

### ✅ Phase 0: Setup & Architecture (COMPLETED)
- [x] Initialize React project with Vite
- [x] Configure Tailwind CSS
- [x] Set up folder structure
- [x] Create base layout with bottom navigation
- [x] Build reusable UI components
- [x] Set up mock data service layer

### 🔄 Phase 1: Core Workout Features (NEXT)
- [ ] Workout selection screen
- [ ] Exercise list and management
- [ ] Set tracking with weight/reps
- [ ] Workout timer
- [ ] Save and complete workouts

### 📅 Phase 2: History & Progress
- [ ] Workout history view
- [ ] Exercise progress charts
- [ ] Personal records tracking
- [ ] Filter and search workouts

### 🎯 Phase 3: Advanced Features
- [ ] Custom workout templates
- [ ] Export/import data
- [ ] Cloud sync (database integration)
- [ ] Progressive Web App features

## Design Principles

- **Mobile-First**: Optimized for touch interfaces with 44px minimum touch targets
- **Performance**: Lightweight and fast with code splitting
- **Accessibility**: Semantic HTML and ARIA labels
- **User Experience**: Clean, intuitive interface with smooth animations

## License

MIT

## Author

Built for PPL workout tracking enthusiasts 💪

