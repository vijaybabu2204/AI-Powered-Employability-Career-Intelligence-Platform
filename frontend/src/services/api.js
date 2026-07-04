const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://career-ai-backendd.onrender.com';

export async function fetchStudents() {
  const response = await fetch(`${API_BASE_URL}/students`);
  if (!response.ok) throw new Error('Failed to fetch students');
  return response.json();
}

export async function uploadResume(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/upload-resume`, {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) throw new Error('Failed to upload resume');
  return response.json();
}

export async function fetchResumeResults() {
  const response = await fetch(`${API_BASE_URL}/resume-results`);
  if (!response.ok) throw new Error('Failed to fetch resume results');
  return response.json();
}

export async function predictPlacement(data) {
  const response = await fetch(`${API_BASE_URL}/predict-placement`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to predict placement');
  return response.json();
}

export async function fetchPlacementResults() {
  const response = await fetch(`${API_BASE_URL}/placement-results`);
  if (!response.ok) throw new Error('Failed to fetch placement results');
  return response.json();
}

export async function fetchInterviewHistory() {
  const response = await fetch(`${API_BASE_URL}/interview-history`);
  if (!response.ok) throw new Error('Failed to fetch interview history');
  return response.json();
}

export async function fetchSkills() {
  const response = await fetch(`${API_BASE_URL}/skills`);
  if (!response.ok) throw new Error('Failed to fetch skills');
  return response.json();
}

export async function generateRoadmap() {
  const response = await fetch(`${API_BASE_URL}/generate-roadmap`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error('Failed to generate roadmap');
  return response.json();
}

export async function mockInterview(role) {
  const body = role ? JSON.stringify({ role }) : undefined;
  const headers = role ? { 'Content-Type': 'application/json' } : undefined;
  const response = await fetch(`${API_BASE_URL}/mock-interview`, {
    method: 'POST',
    headers,
    body,
  });
  if (!response.ok) throw new Error('Failed to fetch mock interview questions');
  return response.json();
}

export async function evaluateAnswer(question, answer, role) {
  const response = await fetch(`${API_BASE_URL}/evaluate-answer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, answer, role }),
  });
  if (!response.ok) throw new Error('Failed to evaluate answer');
  return response.json();
}

export async function loginUser(email, password) {
  const response = await fetch(`${API_BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || 'Failed to login');
  }
  return response.json();
}

export async function registerUser(name, email, password) {
  const response = await fetch(`${API_BASE_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || 'Failed to register');
  }
  return response.json();
}

export async function evaluateFullInterview(answers, role) {
  const response = await fetch(`${API_BASE_URL}/evaluate-interview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answers, role }),
  });
  if (!response.ok) throw new Error('Failed to evaluate mock interview');
  return response.json();
}

export async function forgotPassword(email) {
  const response = await fetch(`${API_BASE_URL}/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || 'Failed to send reset link');
  }
  return response.json();
}

export async function resetPassword(token, newPassword) {
  const response = await fetch(`${API_BASE_URL}/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, new_password: newPassword }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || 'Failed to reset password');
  }
  return response.json();
}

export async function analyzeGitHub(profile, repos, readme) {
  const response = await fetch(`${API_BASE_URL}/analyze-github`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profile, repos, readme }),
  });
  if (!response.ok) throw new Error('Failed to analyze GitHub profile');
  return response.json();
}

