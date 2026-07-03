from backend.ai_client import chat_completion
import json

ROADMAP_PROMPT = """
You are an Expert Career Mentor.

Based on the student's profile generate:

1. Personalized Learning Roadmap
2. Month-wise Plan
3. Free Courses
4. Project Ideas
5. Certifications
6. Interview Preparation Tips

Return ONLY valid JSON.

{
  "roadmap":[
      {
        "month":1,
        "focus":"",
        "topics":[]
      }
  ],

  "courses":[],
  "projects":[],
  "certifications":[],
  "interview_tips":[]
}
"""

def get_default_roadmap(profile):
    best_role = profile.get("BestRole", "Software Engineer") if profile else "Software Engineer"
    skills = profile.get("SkillsFound", "Core Programming") if profile else "Core Programming"
    
    return {
        "roadmap": [
            {
                "month": 1,
                "focus": f"Core Foundations for {best_role}",
                "topics": ["Advanced System Design", "Database Query Optimization", "Git Flow & CI/CD Pipelines"]
            },
            {
                "month": 2,
                "focus": "Cloud Deployments & Infrastructure",
                "topics": ["Docker & Containers", "Kubernetes Orchestration Basics", "AWS/GCP Cloud Architecture"]
            },
            {
                "month": 3,
                "focus": "Production Scaling & MLOps",
                "topics": ["Model Observability & Monitoring", "Automated Pipelines (MLflow/Airflow)", "Security & Compliance Audits"]
            }
        ],
        "courses": [
            "Architecting Smart Systems on AWS (Coursera)",
            "Kubernetes Mastery: From Zero to Hero (Udemy)",
            "Production Machine Learning Systems (Google Cloud)"
        ],
        "projects": [
            f"Build and deploy a scalable microservice cluster matching {best_role} metrics",
            "Establish a fully automated deployment pipeline with automated regression tests",
            "Configure real-time system monitoring dashboards using Prometheus & Grafana"
        ],
        "certifications": [
            "Certified Kubernetes Administrator (CKA)",
            "AWS Solutions Architect - Associate"
        ],
        "interview_tips": [
            f"Focus on describing system scaling strategies for a {best_role} position",
            "Practice architectural tradeoffs (e.g. SQL vs NoSQL, CAP theorem balance)",
            "Prepare detailed post-mortem walkthroughs of past project failures you handled"
        ]
    }

def generate_roadmap(profile):
    try:
        content = chat_completion(
            messages=[
                {
                    "role": "system",
                    "content": ROADMAP_PROMPT
                },
                {
                    "role": "user",
                    "content": json.dumps(profile)
                }
            ],
            format_json=True
        )
        
        # Robust JSON extraction: Find first '{' and last '}'
        start_idx = content.find('{')
        end_idx = content.rfind('}')
        
        if start_idx != -1 and end_idx != -1:
            json_str = content[start_idx:end_idx + 1]
            try:
                return json.loads(json_str)
            except json.JSONDecodeError as je:
                print(f"Groq output was not valid JSON. Error: {je}")
        
        # Fallback if cleanup failed
        cleaned_content = content.replace("```json", "").replace("```", "").strip()
        return json.loads(cleaned_content)
        
    except Exception as e:
        print(f"Error generating roadmap using Groq: {e}. Returning default profile roadmap.")
        return get_default_roadmap(profile)