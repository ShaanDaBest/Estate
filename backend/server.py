from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

# Enums
class PhoneType(str, Enum):
    APPLE = "apple"
    ANDROID = "android"

class HouseStatus(str, Enum):
    AVAILABLE = "available"
    PENDING = "pending"
    SOLD = "sold"
    OFF_MARKET = "off_market"
    OPEN_HOUSE = "open_house"

class AppointmentType(str, Enum):
    OPEN_HOUSE = "open_house"
    PRIVATE_VIEWING = "private_viewing"
    CONSULTATION = "consultation"

# Client Models
class ClientBase(BaseModel):
    name: str
    phone: str
    phone_type: PhoneType
    email: str
    current_address: str

class ClientCreate(ClientBase):
    pass

class Client(ClientBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# Appointment Models
class AppointmentBase(BaseModel):
    client_id: str
    property_address: str
    city: str
    date: str
    start_time: str
    end_time: str
    time_at_house: int  # minutes
    is_open_house: bool = False
    appointment_type: AppointmentType = AppointmentType.PRIVATE_VIEWING
    house_status: HouseStatus = HouseStatus.AVAILABLE
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class AppointmentCreate(AppointmentBase):
    pass

class Appointment(AppointmentBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    order_index: int = 0

# House Notes Models
class HouseNoteBase(BaseModel):
    appointment_id: str
    property_address: str
    notes: str
    follow_up_required: bool = False

class HouseNoteCreate(HouseNoteBase):
    pass

class HouseNote(HouseNoteBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# Route Priority Models
class PriorityItem(BaseModel):
    key: str
    label: str
    weight: int
    enabled: bool = True

class RoutePrioritySettings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = "default"
    priorities: List[PriorityItem] = Field(default_factory=lambda: [
        PriorityItem(key="open_house", label="Open House First", weight=5, enabled=True),
        PriorityItem(key="appointment_time", label="Appointment Time", weight=4, enabled=True),
        PriorityItem(key="distance", label="Shortest Distance", weight=3, enabled=True),
        PriorityItem(key="time_at_house", label="Time at House", weight=2, enabled=True),
        PriorityItem(key="city_cluster", label="Same City Cluster", weight=1, enabled=True),
    ])

# Optimized Route Response
class OptimizedRoute(BaseModel):
    appointments: List[Appointment]
    total_estimated_time: int
    total_distance_estimate: float
    finish_time_estimate: str

# === CLIENT ENDPOINTS ===
@api_router.post("/clients", response_model=Client)
async def create_client(client_data: ClientCreate):
    client_obj = Client(**client_data.model_dump())
    doc = client_obj.model_dump()
    await db.clients.insert_one(doc)
    return client_obj

@api_router.get("/clients", response_model=List[Client])
async def get_clients():
    clients = await db.clients.find({}, {"_id": 0}).to_list(1000)
    return clients

@api_router.get("/clients/{client_id}", response_model=Client)
async def get_client(client_id: str):
    client = await db.clients.find_one({"id": client_id}, {"_id": 0})
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return client

@api_router.put("/clients/{client_id}", response_model=Client)
async def update_client(client_id: str, client_data: ClientCreate):
    existing = await db.clients.find_one({"id": client_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Client not found")
    update_data = client_data.model_dump()
    await db.clients.update_one({"id": client_id}, {"$set": update_data})
    updated = await db.clients.find_one({"id": client_id}, {"_id": 0})
    return updated

@api_router.delete("/clients/{client_id}")
async def delete_client(client_id: str):
    result = await db.clients.delete_one({"id": client_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Client not found")
    return {"message": "Client deleted"}

# === APPOINTMENT ENDPOINTS ===
@api_router.post("/appointments", response_model=Appointment)
async def create_appointment(appt_data: AppointmentCreate):
    # Verify client exists
    client = await db.clients.find_one({"id": appt_data.client_id})
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    appt_obj = Appointment(**appt_data.model_dump())
    doc = appt_obj.model_dump()
    await db.appointments.insert_one(doc)
    return appt_obj

@api_router.get("/appointments", response_model=List[Appointment])
async def get_appointments(date: Optional[str] = None):
    query = {}
    if date:
        query["date"] = date
    appointments = await db.appointments.find(query, {"_id": 0}).to_list(1000)
    return appointments

@api_router.get("/appointments/{appt_id}", response_model=Appointment)
async def get_appointment(appt_id: str):
    appt = await db.appointments.find_one({"id": appt_id}, {"_id": 0})
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return appt

@api_router.put("/appointments/{appt_id}", response_model=Appointment)
async def update_appointment(appt_id: str, appt_data: AppointmentCreate):
    existing = await db.appointments.find_one({"id": appt_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Appointment not found")
    update_data = appt_data.model_dump()
    await db.appointments.update_one({"id": appt_id}, {"$set": update_data})
    updated = await db.appointments.find_one({"id": appt_id}, {"_id": 0})
    return updated

@api_router.put("/appointments/{appt_id}/status")
async def update_house_status(appt_id: str, status: HouseStatus):
    existing = await db.appointments.find_one({"id": appt_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Appointment not found")
    await db.appointments.update_one({"id": appt_id}, {"$set": {"house_status": status.value}})
    return {"message": "Status updated", "status": status.value}

@api_router.delete("/appointments/{appt_id}")
async def delete_appointment(appt_id: str):
    result = await db.appointments.delete_one({"id": appt_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Appointment not found")
    # Also delete associated notes
    await db.house_notes.delete_many({"appointment_id": appt_id})
    return {"message": "Appointment deleted"}

# === HOUSE NOTES ENDPOINTS ===
@api_router.post("/notes", response_model=HouseNote)
async def create_house_note(note_data: HouseNoteCreate):
    note_obj = HouseNote(**note_data.model_dump())
    doc = note_obj.model_dump()
    await db.house_notes.insert_one(doc)
    return note_obj

@api_router.get("/notes", response_model=List[HouseNote])
async def get_house_notes(appointment_id: Optional[str] = None):
    query = {}
    if appointment_id:
        query["appointment_id"] = appointment_id
    notes = await db.house_notes.find(query, {"_id": 0}).to_list(1000)
    return notes

@api_router.get("/notes/{note_id}", response_model=HouseNote)
async def get_house_note(note_id: str):
    note = await db.house_notes.find_one({"id": note_id}, {"_id": 0})
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return note

@api_router.put("/notes/{note_id}", response_model=HouseNote)
async def update_house_note(note_id: str, note_data: HouseNoteCreate):
    existing = await db.house_notes.find_one({"id": note_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Note not found")
    update_data = note_data.model_dump()
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.house_notes.update_one({"id": note_id}, {"$set": update_data})
    updated = await db.house_notes.find_one({"id": note_id}, {"_id": 0})
    return updated

@api_router.delete("/notes/{note_id}")
async def delete_house_note(note_id: str):
    result = await db.house_notes.delete_one({"id": note_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Note not found")
    return {"message": "Note deleted"}

# === ROUTE PRIORITY SETTINGS ===
@api_router.get("/priorities", response_model=RoutePrioritySettings)
async def get_priorities():
    settings = await db.route_priorities.find_one({"id": "default"}, {"_id": 0})
    if not settings:
        # Return default settings
        default = RoutePrioritySettings()
        return default
    return settings

@api_router.put("/priorities", response_model=RoutePrioritySettings)
async def update_priorities(settings: RoutePrioritySettings):
    settings.id = "default"
    doc = settings.model_dump()
    await db.route_priorities.update_one(
        {"id": "default"}, 
        {"$set": doc}, 
        upsert=True
    )
    return settings

# === ROUTE OPTIMIZATION ===
def calculate_mock_distance(addr1: str, addr2: str) -> float:
    """Mock distance calculation based on string similarity"""
    # Simple hash-based mock distance
    hash1 = sum(ord(c) for c in addr1) % 100
    hash2 = sum(ord(c) for c in addr2) % 100
    return abs(hash1 - hash2) * 0.1 + 1.0  # Returns 1-11 miles

def time_to_minutes(time_str: str) -> int:
    """Convert time string (HH:MM) to minutes from midnight"""
    try:
        parts = time_str.split(":")
        return int(parts[0]) * 60 + int(parts[1])
    except:
        return 0

@api_router.post("/optimize-route", response_model=OptimizedRoute)
async def optimize_route(date: str):
    # Get appointments for the date
    appointments = await db.appointments.find({"date": date}, {"_id": 0}).to_list(100)
    
    if not appointments:
        return OptimizedRoute(
            appointments=[],
            total_estimated_time=0,
            total_distance_estimate=0,
            finish_time_estimate=""
        )
    
    # Get priority settings
    settings = await db.route_priorities.find_one({"id": "default"}, {"_id": 0})
    if not settings:
        settings = RoutePrioritySettings().model_dump()
    
    priorities = {p["key"]: p for p in settings["priorities"] if p["enabled"]}
    
    # Calculate scores for each appointment
    scored_appointments = []
    for appt in appointments:
        score = 0
        
        # Open house priority
        if "open_house" in priorities and appt.get("is_open_house"):
            score += priorities["open_house"]["weight"] * 100
        
        # Appointment time priority (earlier = higher priority)
        if "appointment_time" in priorities:
            time_mins = time_to_minutes(appt.get("start_time", "12:00"))
            score += priorities["appointment_time"]["weight"] * (1440 - time_mins) / 14.4
        
        # Time at house (shorter visits first for efficiency)
        if "time_at_house" in priorities:
            time_at = appt.get("time_at_house", 60)
            score += priorities["time_at_house"]["weight"] * (120 - min(time_at, 120)) / 1.2
        
        scored_appointments.append((score, appt))
    
    # Sort by score (highest first)
    scored_appointments.sort(key=lambda x: x[0], reverse=True)
    
    # Build optimized route considering distance clustering
    optimized = []
    remaining = [a[1] for a in scored_appointments]
    
    if remaining:
        # Start with highest priority
        current = remaining.pop(0)
        current["order_index"] = 0
        optimized.append(current)
        
        order_idx = 1
        while remaining:
            # Find nearest from remaining (considering city clustering)
            best_idx = 0
            best_score = float('inf')
            
            for i, appt in enumerate(remaining):
                distance = calculate_mock_distance(
                    current.get("property_address", ""),
                    appt.get("property_address", "")
                )
                
                # Bonus for same city
                if "city_cluster" in priorities:
                    if current.get("city") == appt.get("city"):
                        distance -= priorities["city_cluster"]["weight"]
                
                if distance < best_score:
                    best_score = distance
                    best_idx = i
            
            current = remaining.pop(best_idx)
            current["order_index"] = order_idx
            optimized.append(current)
            order_idx += 1
    
    # Calculate totals
    total_time = sum(a.get("time_at_house", 30) for a in optimized)
    total_distance = 0
    for i in range(len(optimized) - 1):
        total_distance += calculate_mock_distance(
            optimized[i].get("property_address", ""),
            optimized[i + 1].get("property_address", "")
        )
    
    # Add travel time estimate (assume 30 min per 10 miles)
    travel_time = int(total_distance * 3)
    total_time += travel_time
    
    # Calculate finish time
    if optimized:
        first_start = time_to_minutes(optimized[0].get("start_time", "09:00"))
        finish_mins = first_start + total_time
        finish_hours = finish_mins // 60
        finish_mins_remain = finish_mins % 60
        finish_time = f"{finish_hours:02d}:{finish_mins_remain:02d}"
    else:
        finish_time = ""
    
    # Convert to Appointment models
    appt_models = [Appointment(**a) for a in optimized]
    
    return OptimizedRoute(
        appointments=appt_models,
        total_estimated_time=total_time,
        total_distance_estimate=round(total_distance, 1),
        finish_time_estimate=finish_time
    )

# === DASHBOARD STATS ===
@api_router.get("/dashboard/stats")
async def get_dashboard_stats(date: Optional[str] = None):
    query = {}
    if date:
        query["date"] = date
    
    appointments = await db.appointments.find(query, {"_id": 0}).to_list(1000)
    clients_count = await db.clients.count_documents({})
    
    open_houses = len([a for a in appointments if a.get("is_open_house")])
    private_viewings = len([a for a in appointments if not a.get("is_open_house")])
    
    return {
        "total_appointments": len(appointments),
        "open_houses": open_houses,
        "private_viewings": private_viewings,
        "total_clients": clients_count,
        "appointments_today": len(appointments) if date else 0
    }

@api_router.get("/")
async def root():
    return {"message": "Real Estate Agent Scheduler API"}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
