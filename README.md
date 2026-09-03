# FireGuard — AI-Powered Fire & Smoke Detection System

Real-time fire and smoke detection powered by YOLO AI. Citizens report incidents, track active fires on an interactive satellite map, and help their communities stay safe.

## Live Demo

- **Frontend:** [fireguard.muhammadhamzao241.workers.dev](https://fireguard.muhammadhamzao241.workers.dev)
- **Backend API:** [boston-historic-phases-ecological.trycloudflare.com](https://boston-historic-phases-ecological.trycloudflare.com)
- **API Docs:** [boston-historic-phases-ecological.trycloudflare.com/docs](https://boston-historic-phases-ecological.trycloudflare.com/docs)

## Features

### Detection
- AI-powered fire & smoke detection using YOLO model
- Image upload detection with confidence scores
- Video upload detection with frame-by-frame analysis
- Live webcam detection with 10-second capture

### Map & Monitoring
- Interactive Leaflet map with 4 tile layers (Satellite, Streets, Humanitarian, Terrain)
- Marker clustering for dense incident areas
- Real-time WebSocket fire alerts
- Auto-scan for nearest fire within 10km radius
- Fire spread prediction with risk scoring
- Weather overlay using Open-Meteo API
- Nearby emergency places (Hospitals, Fire Departments, Police, Pharmacies)
- Evacuation routing via OSRM
- Zoom controls and recenter on user location

### Reporting & Alerts
- Citizen fire reporting with voice notes
- Firebase Cloud Messaging push notifications
- Live fire alerts sidebar with 10km proximity indicator
- Auto-generated incident messages

### Dashboard & Analytics
- Citizen level system (Bronze, Silver, Gold, Platinum)
- Points-based gamification
- Dashboard charts (Pie, Bar, Area)
- Incident status tracking (Detected, In Progress, Resolved)
- PDF report export with Google Maps links

### Authentication & Security
- Supabase Auth (signup/login)
- Automatic JWT token refresh
- Protected routes with middleware
- User profile management

## Tech Stack

### Backend
- **Framework:** FastAPI (Python)
- **AI Model:** YOLO (Ultralytics) for fire/smoke detection
- **Database:** Supabase (PostgreSQL)
- **Storage:** Supabase Storage (fire-media, fire-audio buckets)
- **Auth:** Supabase Auth (JWT-based)
- **Push Notifications:** Firebase Cloud Messaging
- **Weather:** Open-Meteo API
- **Geocoding:** Nominatim (OpenStreetMap)
- **Routing:** OSRM (Open Source Routing Machine)
- **Nearby Places:** Overpass API (OpenStreetMap)
- **WebSockets:** FastAPI native WebSocket support
- **Video Processing:** OpenCV

### Frontend
- **Framework:** React 19 + Vite 8
- **Styling:** Tailwind CSS v4
- **Charts:** Recharts
- **Maps:** React Leaflet + MarkerCluster
- **PDF:** jsPDF
- **Notifications:** Firebase v12 (Client SDK)
- **HTTP Client:** Axios
- **Routing:** React Router DOM v7

## Project Structure

```
fire_checker/
├── backend/
│   ├── app/
│   │   ├── core/           # Auth middleware (deps.py)
│   │   ├── models/         # YOLO model loader
│   │   ├── routes/         # API endpoints
│   │   ├── schemas/        # Pydantic models
│   │   └── services/       # Business logic
│   ├── api/                # Vercel entry point
│   ├── .env                # Environment variables (not in git)
│   ├── requirements.txt    # Python dependencies
│   ├── vercel.json         # Vercel config
│   └── run.py              # Local dev server
├── dashboard/
│   ├── public/             # Static assets, service worker
│   ├── src/
│   │   ├── api/            # Axios config
│   │   ├── components/     # Reusable components
│   │   ├── config/         # Firebase config
│   │   ├── context/        # Auth context
│   │   ├── hooks/          # Custom hooks
│   │   ├── pages/          # Page components
│   │   └── utils/          # PDF generator
│   ├── .env                # Frontend env vars
│   └── package.json        # Node dependencies
└── README.md
```

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/signup` | No | Register new user |
| POST | `/auth/login` | No | Login user |
| POST | `/auth/refresh` | No | Refresh JWT token |
| POST | `/image_processing` | Yes | Detect fire in image |
| POST | `/video_processing` | Yes | Detect fire in video |
| WS | `/webcam` | No | Real-time webcam detection |
| POST | `/fire_alert` | Yes | Submit fire report |
| POST | `/upload_audio` | Yes | Upload voice note |
| GET | `/incidents` | Yes | List user incidents |
| GET | `/incidents/{id}` | Yes | Get incident detail |
| PUT | `/incidents/{id}` | Yes | Update incident status |
| DELETE | `/incidents/{id}` | Yes | Delete incident |
| POST | `/nearest_fire` | No | Find nearest fire + route |
| GET | `/profile/me` | Yes | Get user profile |
| WS | `/ws/live-alerts` | No | Live fire alerts |
| POST | `/weather` | No | Get weather data |
| POST | `/fire-spread/predict` | No | Predict fire spread |
| POST | `/notifications/subscribe` | Yes | Subscribe to push |
| DELETE | `/notifications/unsubscribe` | Yes | Unsubscribe push |

## Local Development

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: .\venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env  # Fill in your values
python run.py
```

Backend runs at `http://localhost:8000`
API docs at `http://localhost:8000/docs`

### Frontend

```bash
cd dashboard
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`

### Public URL (Cloudflare Tunnel)

```bash
cloudflared tunnel --url http://localhost:8000
```

## Environment Variables

### Backend (.env)

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_STORAGE_BUCKET=fire-media
```

### Frontend (.env)

```
VITE_API_BASE_URL=http://localhost:8000
```

## Deployment

### Backend — Local PC + Cloudflare Tunnel

1. Run backend locally
2. `cloudflared tunnel --url http://localhost:8000`
3. Get public URL

### Frontend — Cloudflare Pages

1. `cd dashboard && npm run build`
2. Upload `dist/` folder to Cloudflare Pages

## Citizen Level System

| Level | Points Required |
|-------|----------------|
| Bronze | 0 |
| Silver | 50 |
| Gold | 150 |
| Platinum | 300 |

### Points Rules
- +10 per incident report
- +5 bonus if confidence > 70%
- +15 when incident marked In Progress
- +25 when incident resolved
- -20 penalty for false reports

## License

MIT
