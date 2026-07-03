from backend.ai_client import chat_completion
import json

SYSTEM_PROMPT = """
You are an experienced Technical Interviewer.

Generate 10 interview questions based on the candidate profile.

Mix:
- HR
- Technical
- SQL
- Python
- Projects
- Resume

Return ONLY JSON.

{
    "questions":[
        {
            "question":"",
            "category":""
        }
    ]
}
"""

def generate_interview(profile):
    content = chat_completion(
        messages=[
            {
                "role":"system",
                "content":SYSTEM_PROMPT
            },
            {
                "role":"user",
                "content":json.dumps(profile)
            }
        ],
        format_json=True
    )

    content=content.replace("```json","").replace("```","").strip()
    return json.loads(content)

def evaluate_answer(question, answer, role):

    prompt = f"""
You are a Senior Technical Interviewer.

Role:
{role}

Question:
{question}

Candidate Answer:
{answer}

Evaluate.

Return ONLY JSON.

{{
    "technical_score":0,
    "communication_score":0,
    "confidence_score":0,
    "overall_score":0,
    "feedback":"",
    "correct_answer":""
}}
"""

    content = chat_completion(
        messages=[
            {
                "role":"user",
                "content":prompt
            }
        ],
        format_json=True
    )

    return json.loads(content.strip())

def evaluate_full_interview(answers, role):
    prompt = f"""
You are a Senior Technical Recruiter, HR Director, and English Grammar Expert.

Evaluate the candidate's performance across the entire mock interview session.

Role:
{role}

Interview Transcript (Questions and Candidate Answers):
{json.dumps(answers, indent=2)}

Please thoroughly analyze:
1. Technical accuracy of the candidate's answers.
2. Communication clarity, vocabulary depth, and delivery.
3. Grammar and structural correctness (highlighting specific grammatical mistakes and providing corrections).

Scoring scale: 0 to 10 for each score.

Return ONLY a valid JSON object in EXACTLY this format, with no markdown, conversational text, or explanation:
{{
    "technical_score": 0,
    "communication_score": 0,
    "grammar_score": 0,
    "overall_score": 0,
    "general_feedback": "Detailed overall summary of technical and professional strengths and areas to improve.",
    "grammar_feedback": "List specific grammatical errors found in their speech and how to fix them.",
    "breakdown": [
        {{
            "question": "Question text",
            "candidate_answer": "Candidate answer text",
            "score": 0,
            "feedback": "Specific feedback for this question.",
            "expert_answer": "Provide a high-quality model answer demonstrating technical depth and vocabulary."
        }}
    ]
}}
"""

    content = chat_completion(
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ],
        format_json=True
    )

    content = content.replace("```json", "").replace("```", "").strip()
    
    # Robust JSON boundary extraction
    start_idx = content.find('{')
    end_idx = content.rfind('}')
    if start_idx != -1 and end_idx != -1:
        content = content[start_idx:end_idx + 1]

    return json.loads(content)