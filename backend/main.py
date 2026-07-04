from backend.ollama_service import analyze_resume
from backend.roadmap_service import generate_roadmap
from backend.interview_service import generate_interview
from backend.interview_service import evaluate_answer, evaluate_full_interview
from backend.github_service import analyze_github_profile
from fastapi.middleware.cors import CORSMiddleware

from fastapi import FastAPI, UploadFile, File, HTTPException
import shutil
import pdfplumber
import joblib


from backend.database import get_connection
from pydantic import BaseModel

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "https://frontend-theta-swart-30.vercel.app",
        "https://frontend-k1qasions-vijaybabukada22-6322s-projects.vercel.app",
        "https://frontend-lbz4y8qqm-vijaybabukada22-6322s-projects.vercel.app",
        "https://frontend-196t2akq9-vijaybabukada22-6322s-projects.vercel.app",
        "https://frontend-three-liart-16.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def init_db():
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        # 1. Users
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            UserID INT AUTO_INCREMENT PRIMARY KEY,
            Name VARCHAR(100) NOT NULL,
            Email VARCHAR(100) UNIQUE NOT NULL,
            Password VARCHAR(255) NOT NULL,
            CreatedDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """)
        
        # 2. Skills
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS skills (
            SkillID INT AUTO_INCREMENT PRIMARY KEY,
            StudentID INT NOT NULL,
            SkillName VARCHAR(100) NOT NULL,
            SkillLevel VARCHAR(50) DEFAULT 'Intermediate'
        )
        """)
        
        # Check if skills exist for student 1, if not seed
        cursor.execute("SELECT COUNT(*) FROM skills WHERE StudentID = 1")
        if cursor.fetchone()[0] == 0:
            skills_to_seed = [
                ("Python", "Advanced"),
                ("React", "Advanced"),
                ("JavaScript", "Advanced"),
                ("SQL", "Intermediate"),
                ("Git", "Advanced"),
                ("FastAPI", "Intermediate"),
                ("HTML/CSS", "Advanced")
            ]
            cursor.executemany(
                "INSERT INTO skills (StudentID, SkillName, SkillLevel) VALUES (1, %s, %s)",
                skills_to_seed
            )
            print("Seeded default skills for student 1.")
            
        conn.commit()
        conn.close()
    except Exception as e:
        print("Database initialization failed:", e)


@app.on_event("startup")
def startup_event():
    init_db()

model = joblib.load("ml/placement_model.pkl")

@app.get("/")
def home():
    return {"message": "Career Intelligence Platform Running"}


@app.get("/students")
def get_students():

    conn = get_connection()

    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT * FROM students")

    data = cursor.fetchall()

    conn.close()

    return data

@app.post("/upload-resume")
async def upload_resume(file: UploadFile = File(...)):
    import os
    os.makedirs("uploads", exist_ok=True)
    file_path = f"uploads/{file.filename}"

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    text = ""

    with pdfplumber.open(file_path) as pdf:

        for page in pdf.pages:

            page_text = page.extract_text()

            if page_text:
                text += page_text
    
    def to_text(value):
        if isinstance(value, list):
            return ", ".join(map(str, value))
        if isinstance(value, dict):
            return str(value)
        return str(value)

    analysis = analyze_resume(text)

    ats_score = analysis.get("ats_score", 0)
    role_match = analysis.get("role_match", 0)
    candidate_name = to_text(analysis.get("candidate_name"))
    email = to_text(analysis.get("email"))
    phone = to_text(analysis.get("phone"))
    education = to_text(analysis.get("education"))
    experience = to_text(analysis.get("experience"))
    projects = to_text(analysis.get("projects"))
    certifications = to_text(analysis.get("certifications"))
    skills_found = to_text(analysis.get("skills"))
    missing_skills = to_text(analysis.get("missing_skills"))
    best_role = to_text(analysis.get("best_roles"))
    strengths = to_text(analysis.get("strengths"))
    weaknesses = to_text(analysis.get("weaknesses"))
    resume_suggestions = to_text(analysis.get("resume_suggestions"))
    recommended_courses = to_text(analysis.get("recommended_courses"))
    recommended_projects = to_text(analysis.get("recommended_projects"))
    
    conn = get_connection()

    cursor = conn.cursor()

    print(analysis)
    for key, value in analysis.items():
        print(key, type(value), value)

# Save Resume Details
    cursor.execute(
    """
    INSERT INTO resume
    (
        StudentID,
        ResumePath,
        ATSScore,
        SkillsFound,
        MissingSkills,
        BestRole,
        RoleMatch,
        Strengths,
        Weaknesses,
        Suggestions,
        RecommendedCourses,
        RecommendedProjects,
        CandidateName,
        Email,
        Phone,
        Education,
        Experience,
        Projects,
        Certifications,
        UploadDate
    )
    VALUES
    (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,CURDATE())
    """,
    (
        1,
        file_path,
        ats_score,
        skills_found,
        missing_skills,
        best_role,
        role_match,
        strengths,
        weaknesses,
        resume_suggestions,
        recommended_courses,
        recommended_projects,
        candidate_name,
        email,
        phone,
        education,
        experience,
        projects,
        certifications
    )
)

    conn.commit()
    conn.close()
    
    return analysis




@app.get("/resume-results")
def get_resume_results():

    conn = get_connection()

    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT * FROM resume")

    data = cursor.fetchall()

    conn.close()

    return data




class StudentInput(BaseModel):
    cgpa: float
    coding_score: int
    aptitude_score: int
    communication_score: int
    projects: int
    internships: int

@app.post("/predict-placement")
def predict_placement(student: StudentInput):

    data = [[
        student.cgpa,
        student.coding_score,
        student.aptitude_score,
        student.communication_score,
        student.projects,
        student.internships
    ]]

    prediction = model.predict_proba(data)

    probability = round(prediction[0][1] * 100, 2)

    conn = get_connection()
    cursor = conn.cursor()

    # Query latest BestRole from Resume table
    cursor.execute("""
        SELECT BestRole 
        FROM resume 
        WHERE StudentID = 1 
        ORDER BY ResumeID DESC 
        LIMIT 1
    """)
    resume_row = cursor.fetchone()
    predicted_role = "Data Analyst"
    if resume_row and resume_row[0]:
        raw_role = resume_row[0]
        predicted_role = raw_role.split(",")[0].strip()

    cursor.execute(
        """
        INSERT INTO placements
        (
            StudentID,
            CGPA,
            AptitudeScore,
            CommunicationScore,
            CodingScore,
            Projects,
            Internships,
            PlacementProbability,
            PredictedRole
        )
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """,
        (
            1,
            student.cgpa,
            student.aptitude_score,
            student.communication_score,
            student.coding_score,
            student.projects,
            student.internships,
            probability,
            predicted_role
        )
    )
    conn.commit()
    conn.close()

    return {
        "placement_probability": probability
    }
    
@app.get("/placement-results")
def placement_results():

    conn = get_connection()

    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT * FROM placements")

    data = cursor.fetchall()

    conn.close()

    return data


@app.get("/skills")
def get_skills():

    conn = get_connection()

    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT * FROM skills")

    data = cursor.fetchall()

    conn.close()

    return data

@app.post("/generate-roadmap")
def roadmap():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT *
        FROM resume
        ORDER BY ResumeID DESC
        LIMIT 1
    """)
    resume = cursor.fetchone()
    
    if not resume:
        conn.close()
        # Fallback profile if database contains no resumes
        fallback_profile = {
            "StudentID": 1,
            "BestRole": "Software Engineer",
            "SkillsFound": "Python, Java, Git, SQL",
            "MissingSkills": "Docker, Kubernetes, MLOps",
            "Projects": "Online Library Management System",
            "Education": "Bachelor of Technology",
            "Experience": "1 year academic intern"
        }
        return generate_roadmap(fallback_profile)

    from decimal import Decimal
    from datetime import date

    for key, value in resume.items():
        if isinstance(value, Decimal):
            resume[key] = float(value)
        elif isinstance(value, date):
            resume[key] = value.isoformat()
            
    conn.close()
    
    roadmap = generate_roadmap(resume)
    return roadmap


class MockInterviewInput(BaseModel):
    role: str = None

@app.post("/mock-interview")
def mock_interview(input: MockInterviewInput = None):

    conn = get_connection()

    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT *
        FROM resume
        ORDER BY ResumeID DESC
        LIMIT 1
    """)

    resume = cursor.fetchone()

    conn.close()

    target_role = (input.role if input and input.role else None) or (resume["BestRole"] if resume and "BestRole" in resume else None) or "Software Engineer"

    profile = {
        "skills": resume["SkillsFound"] if resume and "SkillsFound" in resume else "Core Programming",
        "best_role": target_role,
        "projects": resume["Projects"] if resume and "Projects" in resume else "",
        "education": resume["Education"] if resume and "Education" in resume else "",
        "experience": resume["Experience"] if resume and "Experience" in resume else ""
    }

    return generate_interview(profile)

class InterviewInput(BaseModel):

    question: str

    answer: str

    role: str
    



@app.post("/evaluate-answer")
def evaluate(input: InterviewInput):

    result = evaluate_answer(

        input.question,

        input.answer,

        input.role

    )

    conn = get_connection()

    cursor = conn.cursor()

    cursor.execute(
        """
        INSERT INTO interviewhistory
        (
        StudentID,
        Question,
        Answer,
        TechnicalScore,
        CommunicationScore,
        ConfidenceScore,
        OverallScore,
        Feedback
        )

        VALUES
        (%s,%s,%s,%s,%s,%s,%s,%s)
        """,

        (

            1,

            input.question,

            input.answer,

            result["technical_score"],

            result["communication_score"],

            result["confidence_score"],

            result["overall_score"],

            result["feedback"]

        )
    )

    conn.commit()
    conn.close()

    return result


class UserRegister(BaseModel):
    name: str
    email: str
    password: str


class UserLogin(BaseModel):
    email: str
    password: str


@app.post("/register")
def register_user(user: UserRegister):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    
    # Check if user already exists
    cursor.execute("SELECT * FROM users WHERE Email = %s", (user.email,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Account with this email already exists.")
        
    # Insert new user
    cursor.execute(
        "INSERT INTO users (Name, Email, Password) VALUES (%s, %s, %s)",
        (user.name, user.email, user.password)
    )
    conn.commit()
    
    # Fetch the newly created UserID
    cursor.execute("SELECT UserID FROM users WHERE Email = %s", (user.email,))
    user_record = cursor.fetchone()
    new_user_id = user_record["UserID"]
    
    # Automatically seed a matching student profile so they show up on the dashboard
    cursor.execute("SELECT * FROM students WHERE Email = %s", (user.email,))
    if not cursor.fetchone():
        cursor.execute(
            """
            INSERT INTO students (StudentID, Name, Branch, CGPA, YearOfStudy, Email)
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (new_user_id, user.name, "Computer Science", 8.0, 3, user.email)
        )
        conn.commit()
        
    conn.close()
    return {"message": "Registration successful", "name": user.name, "email": user.email, "student_id": new_user_id}


@app.post("/login")
def login_user(user: UserLogin):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("SELECT * FROM users WHERE Email = %s AND Password = %s", (user.email, user.password))
    user_record = cursor.fetchone()
    
    if not user_record:
        conn.close()
        raise HTTPException(status_code=401, detail="Invalid email or password.")
        
    # Fetch matching student profile
    cursor.execute("SELECT * FROM students WHERE Email = %s", (user.email,))
    student_record = cursor.fetchone()
    
    conn.close()
    return {
        "message": "Login successful",
        "name": user_record["Name"],
        "email": user_record["Email"],
        "student_id": student_record["StudentID"] if student_record else user_record["UserID"]
    }


class AnswerItem(BaseModel):
    question: str
    answer: str
    category: str


class FullInterviewInput(BaseModel):
    answers: list[AnswerItem]
    role: str


@app.post("/evaluate-interview")
def evaluate_full(input: FullInterviewInput):
    # Map pydantic list to standard dict list
    answers_list = [
        {
            "question": a.question,
            "answer": a.answer,
            "category": a.category
        } for a in input.answers
    ]
    
    result = evaluate_full_interview(answers_list, input.role)
    
    # Store aggregated scorecard details in InterviewHistory table
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO interviewhistory
        (
            StudentID,
            Question,
            Answer,
            TechnicalScore,
            CommunicationScore,
            ConfidenceScore,
            OverallScore,
            Feedback
        )
        VALUES
        (%s, %s, %s, %s, %s, %s, %s, %s)
        """,
        (
            1,
            f"Full Mock Interview: {input.role}",
            "Evaluated complete mock interview block.",
            result.get("technical_score", 0),
            result.get("communication_score", 0),
            result.get("grammar_score", 0),
            result.get("overall_score", 0),
            result.get("general_feedback", "")
        )
    )
    conn.commit()
    conn.close()
    
    return result


import uuid

reset_tokens = {}  # token -> email


class ResetPasswordInput(BaseModel):
    token: str
    new_password: str


@app.post("/forgot-password")
def forgot_password(data: dict):
    email = data.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
        
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE Email = %s", (email,))
    user = cursor.fetchone()
    conn.close()
    
    if not user:
        raise HTTPException(status_code=404, detail="Email not registered in database")
        
    # Generate reset token
    token = str(uuid.uuid4())
    reset_tokens[token] = email
    
    # Clickable link in local host template
    reset_link = f"http://localhost:5173/?reset_token={token}"
    
    # Print simulated SMTP message in server logs
    print(f"\n==================================================")
    print(f"[SMTP EMAIL OUTBOX] To: {email}")
    print(f"Subject: Reset Your Password - CAREER.AI")
    print(f"Please click the link below to choose your new password:")
    print(f"{reset_link}")
    print(f"==================================================\n")
    
    return {
        "message": "Reset link generated and sent",
        "reset_link": reset_link,
        "token": token
    }


@app.post("/reset-password")
def reset_password(input: ResetPasswordInput):
    token = input.token
    new_password = input.new_password
    
    if token not in reset_tokens:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
        
    email = reset_tokens[token]
    
    # Update password in MySQL Users table
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE users SET Password = %s WHERE Email = %s",
        (new_password, email)
    )
    conn.commit()
    conn.close()
    
    # Clear the token
    del reset_tokens[token]
    
    return {"message": "Password updated successfully in database"}


class GitHubAnalysisInput(BaseModel):
    profile: dict
    repos: list[dict]
    readme: str = ""


@app.post("/analyze-github")
def analyze_github(input: GitHubAnalysisInput):
    result = analyze_github_profile(input.profile, input.repos, input.readme)
    return result