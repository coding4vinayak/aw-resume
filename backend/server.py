from fastapi import FastAPI, APIRouter, HTTPException, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy import select, update, delete
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
from database import get_db, create_tables, User as UserModel, Resume as ResumeModel

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
SECRET_KEY = "resume_creator_secret_key_2025"
ALGORITHM = "HS256"

# Define Pydantic Models (for request/response)
class PersonalInfo(BaseModel):
    full_name: str = ""
    email: str = ""
    phone: str = ""
    location: str = ""
    linkedin: str = ""
    website: str = ""
    summary: str = ""
    github: str = ""
    twitter: str = ""
    photo_url: str = ""

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
    featured: bool = False

class Achievement(BaseModel):
    title: str = ""
    description: str = ""
    date: str = ""
    organization: str = ""

class Reference(BaseModel):
    name: str = ""
    position: str = ""
    company: str = ""
    email: str = ""
    phone: str = ""

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
    achievements: List[Achievement] = Field(default_factory=list)
    references: List[Reference] = Field(default_factory=list)
    social_links: List[str] = Field(default_factory=list)
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
    achievements: List[Achievement] = Field(default_factory=list)
    references: List[Reference] = Field(default_factory=list)
    social_links: List[str] = Field(default_factory=list)

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

# Convert SQLAlchemy model to Pydantic model
def resume_to_dict(resume: ResumeModel) -> dict:
    return {
        "id": resume.id,
        "user_id": resume.user_id,
        "title": resume.title,
        "template_id": resume.template_id,
        "personal_info": resume.personal_info or {},
        "experience": resume.experience or [],
        "education": resume.education or [],
        "skills": resume.skills or [],
        "projects": resume.projects or [],
        "achievements": resume.achievements or [],
        "references": resume.references or [],
        "social_links": resume.social_links or [],
        "created_at": resume.created_at,
        "updated_at": resume.updated_at
    }

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Resume Creator API with PostgreSQL"}

# User routes
@api_router.post("/register")
async def register_user(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    # Check if user already exists
    result = await db.execute(select(UserModel).where(UserModel.email == user_data.email))
    existing_user = result.scalar_one_or_none()
    
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    user = UserModel(
        email=user_data.email,
        full_name=user_data.full_name,
        password_hash=get_password_hash(user_data.password)
    )
    
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
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
async def login_user(user_data: UserLogin, db: AsyncSession = Depends(get_db)):
    # Find user
    result = await db.execute(select(UserModel).where(UserModel.email == user_data.email))
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(user_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
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

@api_router.post("/resumes", response_model=ResumeData, status_code=201)
async def create_resume(resume_data: ResumeCreate, db: AsyncSession = Depends(get_db)):
    try:
        # Create new resume
        resume = ResumeModel(
            title=resume_data.title,
            template_id=resume_data.template_id,
            personal_info=resume_data.personal_info.dict(),
            experience=[exp.dict() for exp in resume_data.experience],
            education=[edu.dict() for edu in resume_data.education],
            skills=resume_data.skills,
            projects=[proj.dict() for proj in resume_data.projects],
            achievements=[ach.dict() for ach in resume_data.achievements],
            references=[ref.dict() for ref in resume_data.references],
            social_links=resume_data.social_links
        )
        
        db.add(resume)
        await db.commit()
        await db.refresh(resume)
        
        return ResumeData(**resume_to_dict(resume))
    except Exception as e:
        await db.rollback()
        logging.error(f"Error creating resume: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create resume")

@api_router.get("/resumes", response_model=List[ResumeData])
async def get_resumes(db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(ResumeModel))
        resumes = result.scalars().all()
        return [ResumeData(**resume_to_dict(resume)) for resume in resumes]
    except Exception as e:
        logging.error(f"Error fetching resumes: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch resumes")

@api_router.get("/resumes/{resume_id}", response_model=ResumeData)
async def get_resume(resume_id: str, db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(ResumeModel).where(ResumeModel.id == resume_id))
        resume = result.scalar_one_or_none()
        
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found")
            
        return ResumeData(**resume_to_dict(resume))
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error fetching resume: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch resume")

@api_router.put("/resumes/{resume_id}", response_model=ResumeData)
async def update_resume(resume_id: str, resume_data: ResumeCreate, db: AsyncSession = Depends(get_db)):
    try:
        # Find existing resume
        result = await db.execute(select(ResumeModel).where(ResumeModel.id == resume_id))
        existing_resume = result.scalar_one_or_none()
        
        if not existing_resume:
            raise HTTPException(status_code=404, detail="Resume not found")
        
        # Update resume fields
        existing_resume.title = resume_data.title
        existing_resume.template_id = resume_data.template_id
        existing_resume.personal_info = resume_data.personal_info.dict()
        existing_resume.experience = [exp.dict() for exp in resume_data.experience]
        existing_resume.education = [edu.dict() for edu in resume_data.education]
        existing_resume.skills = resume_data.skills
        existing_resume.projects = [proj.dict() for proj in resume_data.projects]
        existing_resume.achievements = [ach.dict() for ach in resume_data.achievements]
        existing_resume.references = [ref.dict() for ref in resume_data.references]
        existing_resume.social_links = resume_data.social_links
        existing_resume.updated_at = datetime.utcnow()
        
        await db.commit()
        await db.refresh(existing_resume)
        
        return ResumeData(**resume_to_dict(existing_resume))
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logging.error(f"Error updating resume: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update resume")

@api_router.delete("/resumes/{resume_id}")
async def delete_resume(resume_id: str, db: AsyncSession = Depends(get_db)):
    try:
        # Find and delete resume
        result = await db.execute(select(ResumeModel).where(ResumeModel.id == resume_id))
        resume = result.scalar_one_or_none()
        
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found")
        
        await db.delete(resume)
        await db.commit()
        
        return {"message": "Resume deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logging.error(f"Error deleting resume: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete resume")

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

@app.on_event("startup")
async def startup_event():
    await create_tables()
    logger.info("PostgreSQL database tables created successfully")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Application shutdown")