from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime
import hashlib
import jwt
from passlib.context import CryptContext


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
SECRET_KEY = "resume_creator_secret_key_2025"
ALGORITHM = "HS256"


# Define Models
class PersonalInfo(BaseModel):
    full_name: str = ""
    email: str = ""
    phone: str = ""
    location: str = ""
    linkedin: str = ""
    website: str = ""
    summary: str = ""

class Experience(BaseModel):
    title: str = ""
    company: str = ""
    location: str = ""
    start_date: str = ""
    end_date: str = ""
    current: bool = False
    description: str = ""

class Education(BaseModel):
    degree: str = ""
    institution: str = ""
    location: str = ""
    graduation_date: str = ""
    gpa: str = ""

class Project(BaseModel):
    name: str = ""
    description: str = ""
    technologies: str = ""
    link: str = ""

class ResumeData(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: Optional[str] = None
    title: str = "My Resume"
    template_id: str = "template1"
    personal_info: PersonalInfo = Field(default_factory=PersonalInfo)
    experience: List[Experience] = Field(default_factory=list)
    education: List[Education] = Field(default_factory=list)
    skills: List[str] = Field(default_factory=list)
    projects: List[Project] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class ResumeCreate(BaseModel):
    title: str = "My Resume"
    template_id: str = "template1"
    personal_info: PersonalInfo = Field(default_factory=PersonalInfo)
    experience: List[Experience] = Field(default_factory=list)
    education: List[Education] = Field(default_factory=list)
    skills: List[str] = Field(default_factory=list)
    projects: List[Project] = Field(default_factory=list)

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    full_name: str
    password_hash: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserCreate(BaseModel):
    email: str
    full_name: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class ResumeTemplate(BaseModel):
    id: str
    name: str
    description: str
    preview_image: str


# Helper functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Resume Creator API"}

# User routes
@api_router.post("/register")
async def register_user(user_data: UserCreate):
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    user = User(
        email=user_data.email,
        full_name=user_data.full_name,
        password_hash=get_password_hash(user_data.password)
    )
    
    await db.users.insert_one(user.dict())
    
    # Create access token
    access_token = create_access_token(data={"sub": user.email, "user_id": user.id})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name
        }
    }

@api_router.post("/login")
async def login_user(user_data: UserLogin):
    # Find user
    user = await db.users.find_one({"email": user_data.email})
    if not user or not verify_password(user_data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Create access token
    access_token = create_access_token(data={"sub": user["email"], "user_id": user["id"]})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "email": user["email"],
            "full_name": user["full_name"]
        }
    }

# Resume routes
@api_router.get("/templates")
async def get_resume_templates():
    templates = [
        {
            "id": "template1",
            "name": "Classic Professional",
            "description": "Clean and professional layout perfect for corporate roles",
            "preview_image": "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=300&h=400&fit=crop"
        },
        {
            "id": "template2", 
            "name": "Modern Creative",
            "description": "Contemporary design with subtle color accents",
            "preview_image": "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=300&h=400&fit=crop"
        },
        {
            "id": "template3",
            "name": "Minimalist Clean",
            "description": "Simple and elegant design focused on content",
            "preview_image": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop"
        },
        {
            "id": "template4",
            "name": "Executive Elite",
            "description": "Sophisticated layout for senior positions",
            "preview_image": "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=300&h=400&fit=crop"
        },
        {
            "id": "template5",
            "name": "Tech Focus",
            "description": "Perfect for developers and tech professionals",
            "preview_image": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=300&h=400&fit=crop"
        },
        {
            "id": "template6",
            "name": "Creative Bold",
            "description": "Eye-catching design for creative industries",
            "preview_image": "https://images.unsplash.com/photo-1552664730-d307ca884978?w=300&h=400&fit=crop"
        },
        {
            "id": "template7",
            "name": "Academic Scholar",
            "description": "Traditional format ideal for academic positions",
            "preview_image": "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=400&fit=crop"
        },
        {
            "id": "template8",
            "name": "Startup Dynamic",
            "description": "Modern layout for startup and entrepreneurial roles",
            "preview_image": "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=300&h=400&fit=crop"
        },
        {
            "id": "template9",
            "name": "Healthcare Pro",
            "description": "Professional design for healthcare professionals",
            "preview_image": "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=300&h=400&fit=crop"
        },
        {
            "id": "template10",
            "name": "Sales Champion",
            "description": "Results-focused layout for sales professionals",
            "preview_image": "https://images.unsplash.com/photo-1507680434567-5739c80be1ac?w=300&h=400&fit=crop"
        }
    ]
    return templates

@api_router.post("/resumes", response_model=ResumeData)
async def create_resume(resume_data: ResumeCreate):
    resume = ResumeData(**resume_data.dict())
    await db.resumes.insert_one(resume.dict())
    return resume

@api_router.get("/resumes", response_model=List[ResumeData])
async def get_resumes():
    resumes = await db.resumes.find().to_list(1000)
    return [ResumeData(**resume) for resume in resumes]

@api_router.get("/resumes/{resume_id}", response_model=ResumeData)
async def get_resume(resume_id: str):
    resume = await db.resumes.find_one({"id": resume_id})
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    return ResumeData(**resume)

@api_router.put("/resumes/{resume_id}", response_model=ResumeData)
async def update_resume(resume_id: str, resume_data: ResumeCreate):
    existing_resume = await db.resumes.find_one({"id": resume_id})
    if not existing_resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    updated_data = resume_data.dict()
    updated_data["id"] = resume_id
    updated_data["created_at"] = existing_resume["created_at"]
    updated_data["updated_at"] = datetime.utcnow()
    
    resume = ResumeData(**updated_data)
    await db.resumes.replace_one({"id": resume_id}, resume.dict())
    return resume

@api_router.delete("/resumes/{resume_id}")
async def delete_resume(resume_id: str):
    result = await db.resumes.delete_one({"id": resume_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Resume not found")
    return {"message": "Resume deleted successfully"}


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()