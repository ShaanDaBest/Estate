# Real Estate Agent Scheduler - PRD

## Original Problem Statement
Build a real estate agent scheduler that routes 5 clients per day, finds ideal visit order to finish early, manages open house times, client times, and provides good UI.

## User Requirements
- Route optimization with customizable prioritization (open house, location, city, appointment, time at house, distance)
- Client info: textable number (Android/Apple indicator), email, name, current address
- House notes separate from client info
- House status tracking
- Grey and Gold color scheme

## Architecture
- **Frontend**: React 19 with Tailwind CSS, Shadcn UI components
- **Backend**: FastAPI with async MongoDB (Motor)
- **Database**: MongoDB
- **Styling**: Grey & Gold luxury theme with Playfair Display + Manrope fonts

## Core Features Implemented (Jan 30, 2026)
1. **Dashboard** - Daily schedule overview with stats cards, optimized route map
2. **Client Management** - CRUD with name, phone (Apple/Android), email, address
3. **Appointment Scheduling** - Create appointments with address, city, date, time, duration, open house toggle
4. **Route Optimizer** - Drag-drop priority reordering, weight adjustment, auto-optimization
5. **House Notes** - Property-specific notes with follow-up tracking
6. **House Status** - Track available, pending, sold, off_market, open_house

## API Endpoints
- `/api/clients` - CRUD for clients
- `/api/appointments` - CRUD for appointments
- `/api/notes` - CRUD for house notes
- `/api/priorities` - Route priority settings
- `/api/optimize-route` - Route optimization
- `/api/dashboard/stats` - Dashboard statistics

## P0/P1/P2 Backlog
### P0 (Done)
- ✅ Client CRUD with phone type
- ✅ Appointment scheduling
- ✅ Route optimization
- ✅ House notes management

### P1 (Next)
- Google Maps integration for real distance calculation
- SMS/Email client notifications
- Calendar sync (Google Calendar)

### P2 (Future)
- Multi-agent support
- Commission tracking
- Document management
- Mobile app version

## Next Action Items
1. Add Google Maps API for real distance/route optimization
2. Implement SMS notifications via Twilio
3. Add calendar export/import functionality
