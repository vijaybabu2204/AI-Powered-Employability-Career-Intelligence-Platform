import json
from backend.ai_client import chat_completion

def analyze_github_profile(profile_data, repos_data, readme_text):
    prompt = f"""
You are a Principal Software Engineer and Technical Recruiter.

Perform a thorough, critical analysis of the candidate's GitHub portfolio based on the provided GitHub profile metadata, repository details, and representative README text sample.

GitHub Profile:
{json.dumps(profile_data, indent=2)}

Repositories Details:
{json.dumps(repos_data, indent=2)}

Representative README Sample:
{readme_text}

Evaluate the profile across the following criteria:
1. Project Diversity & Complexity: Are the projects significant? Are they building real applications or just simple tutorials?
2. Language Stack & Mastery: Assess their tech stack balance, languages used, and tool selections.
3. Documentation & README Quality: Is the sample README well-structured? Does it explain setup, architecture, and deployment?
4. Technical Consistency: How does their portfolio match their stated interest?

Return ONLY a valid JSON object matching this format, with no markdown code blocks, introductory text, or explanations:
{{
    "portfolio_score": 0.0,
    "project_analysis": "Critique of project complexity and strengths.",
    "language_feedback": "Critique of their programming language stack and toolchains.",
    "readme_evaluation": "Critique of documentation standards, suggestions to improve README readability.",
    "action_items": [
        "Actionable recommendation 1",
        "Actionable recommendation 2",
        "Actionable recommendation 3"
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
    
    # Extract JSON boundary
    start_idx = content.find('{')
    end_idx = content.rfind('}')
    if start_idx != -1 and end_idx != -1:
        content = content[start_idx:end_idx + 1]

    return json.loads(content)
