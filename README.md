# Estate Scheduler Pro

A real estate agent scheduling app with route optimization, client management, and property notes.

## Features
- 📅 Daily schedule dashboard with optimized routes
- 👥 Client management (name, phone type, email, address)
- 🏠 Appointment scheduling with open house tracking
- 🗺️ Real maps with OpenStreetMap + address validation
- 📝 Property-specific notes
- ⚡ Route optimization with customizable priorities

## Deploy to GitHub Pages

### Step 1: Create GitHub Repository
```bash
# Initialize git (if not already)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit"

# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/estate-scheduler.git
git branch -M main
git push -u origin main
```

### Step 2: Configure GitHub Repository

1. Go to your repo on GitHub
2. Click **Settings** → **Pages**
3. Under "Build and deployment", select **GitHub Actions**

### Step 3: Set Backend URL

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click **Variables** tab
3. Click **New repository variable**
4. Name: `BACKEND_URL`
5. Value: `https://agent-timeplanner.preview.emergentagent.com` (your Emergent backend URL)

### Step 4: Deploy

Push to `main` branch or go to **Actions** → **Deploy to GitHub Pages** → **Run workflow**

Your site will be live at: `https://YOUR_USERNAME.github.io/estate-scheduler/`

## Local Development

### Frontend
```bash
cd frontend
yarn install
yarn start
```

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn server:app --reload --port 8001
```

## Tech Stack
- **Frontend**: React, Tailwind CSS, Shadcn UI, Leaflet Maps
- **Backend**: FastAPI, MongoDB
- **Maps**: OpenStreetMap + Nominatim (free, no API key needed)

## Environment Variables

### Frontend (.env)
```
REACT_APP_BACKEND_URL=https://your-backend-url.com
```

### Backend (.env)
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=estate_scheduler
```
