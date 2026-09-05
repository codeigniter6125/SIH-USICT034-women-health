/**
 * api.ts — Central API client for FastAPI backend communication.
 * Handles chat routing, escalation triggers, demo auth tokens, and session persistence.
 */

export const BACKEND_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_BACKEND_URL) ||
  "http://localhost:8000";

export interface ChatPayload {
  message: string;
  phone?: string;
  language?: string;
  location?: { lat: number; lng: number } | null;
}

export interface ChatResponse {
  reply: string;
  agent?: string;
  escalation?: {
    escalated: boolean;
    rule_id?: string;
    helplines?: string[];
    hospital?: any;
    sms_result?: any;
  };
  sources?: any[];
  cycle_state?: any;
  report_flags?: string[];
  error?: boolean;
  rateLimited?: boolean;
}

export interface EmergencyPayload {
  phone?: string;
  symptoms?: string;
  location?: { lat: number; lng: number } | null;
}

export interface EmergencyResponse {
  escalated: boolean;
  rule_id?: string;
  helplines?: string[];
  hospital?: {
    name?: string;
    maps_link?: string;
    address?: string;
    distance?: string;
    phone?: string;
  };
  sms_result?: {
    success?: boolean;
    recipient?: string;
    message?: string;
  };
  guidance?: string[];
}

export function getIdToken(): string | null {
  try {
    return localStorage.getItem("idToken");
  } catch {
    return null;
  }
}

export function getUserPhone(): string {
  try {
    return localStorage.getItem("userPhone") || "+919876543210";
  } catch {
    return "+919876543210";
  }
}

export function getUserId(): string {
  try {
    return localStorage.getItem("uid") || "demo-user";
  } catch {
    return "demo-user";
  }
}

export function setUserSession(session: {
  idToken?: string;
  userPhone?: string;
  uid?: string;
  name?: string;
}): void {
  try {
    if (session.idToken) localStorage.setItem("idToken", session.idToken);
    if (session.userPhone) localStorage.setItem("userPhone", session.userPhone);
    if (session.uid) localStorage.setItem("uid", session.uid);
    if (session.name) localStorage.setItem("userName", session.name);
  } catch (err) {
    console.warn("Error saving session to localStorage:", err);
  }
}

export function clearUserSession(): void {
  try {
    localStorage.removeItem("idToken");
    localStorage.removeItem("userPhone");
    localStorage.removeItem("uid");
    localStorage.removeItem("userName");
  } catch (err) {
    console.warn("Error clearing session:", err);
  }
}

/**
 * Sends a user message to the Orchestrator agent endpoint (/api/chat).
 */
export async function sendChatMessage(payload: ChatPayload): Promise<ChatResponse> {
  const phone = payload.phone || getUserPhone();
  const token = getIdToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/chat`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        message: payload.message,
        user_phone: phone,
        language: payload.language || "English",
        location: payload.location || null,
      }),
    });

    if (res.status === 429) {
      const data = await res.json().catch(() => ({}));
      return {
        reply:
          data.detail ||
          "Maya is catching her breath — please wait a few seconds before asking again.",
        error: true,
        rateLimited: true,
      };
    }

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return {
        reply:
          errData.detail ||
          "I ran into an issue processing that. Please try asking again in a moment.",
        error: true,
      };
    }

    return await res.json();
  } catch (err: any) {
    console.error("sendChatMessage fetch error:", err);
    return {
      reply:
        "Unable to reach the server. Please check your internet connection or try again shortly.",
      error: true,
    };
  }
}

/**
 * Triggers the Escalation Agent directly (/api/emergency/trigger) with GPS location.
 */
export async function triggerEmergency(payload: EmergencyPayload): Promise<EmergencyResponse> {
  const phone = payload.phone || getUserPhone();
  const token = getIdToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/emergency/trigger`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        user_phone: phone,
        symptoms: payload.symptoms || "Emergency assistance requested via Emergency Screen",
        location: payload.location || null,
      }),
    });

    if (!res.ok) {
      throw new Error(`Emergency trigger returned status ${res.status}`);
    }

    return await res.json();
  } catch (err: any) {
    console.error("triggerEmergency error:", err);
    // Return safe fallback values so the UI never crashes during emergencies
    return {
      escalated: true,
      rule_id: "EMERGENCY_FALLBACK",
      helplines: ["112", "108", "181"],
      hospital: {
        name: "City General Hospital & Emergency Care",
        maps_link: payload.location
          ? `https://www.google.com/maps/search/?api=1&query=${payload.location.lat},${payload.location.lng}`
          : "https://www.google.com/maps/search/nearest+hospital",
      },
      guidance: [
        "Stay calm and find a safe, comfortable spot.",
        "Keep your ID and medical information ready.",
        "Clearly share your symptoms with the healthcare responder.",
      ],
    };
  }
}

/**
 * Requests a demo bearer token for testing / demo login (/api/auth/demo-token).
 */
export async function getDemoToken(userId: string): Promise<string> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/demo-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.access_token || userId;
    }
  } catch (err) {
    console.warn("Could not fetch demo token from server:", err);
  }
  return userId;
}

/**
 * Submits a daily check-in (mood, symptoms, energy, sleep, notes) to /api/checkin.
 */
export async function submitCheckIn(payload: {
  mood?: number | null;
  symptoms?: string[];
  energy?: number | null;
  sleep_hours?: number | null;
  notes?: string | null;
}): Promise<{ status: string; checkin_history_count: number }> {
  const token = getIdToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BACKEND_URL}/api/checkin`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Check-in failed with status ${res.status}`);
  }
  return await res.json();
}

/**
 * Fetches computed cycle state (/api/cycle).
 */
export async function getCycleState(): Promise<{
  has_data: boolean;
  cycle_day?: number;
  phase?: string;
  avg_cycle_length_days?: number;
  is_irregular?: boolean;
  last_period_start?: string;
  predicted_next_period?: string;
  predicted_ovulation_day?: number;
  fertile_window?: { start: string; end: string };
  note?: string;
  message?: string;
}> {
  const token = getIdToken();
  const phone = getUserPhone();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BACKEND_URL}/api/cycle?user_phone=${encodeURIComponent(phone)}`, {
    headers,
  });

  if (!res.ok) {
    throw new Error(`Failed to load cycle state: ${res.status}`);
  }
  return await res.json();
}

/**
 * Updates period start date and cycle baseline (/api/cycle/log).
 */
export async function logCycleStart(periodStartDate: string, cycleLength = 28, periodLength = 5): Promise<any> {
  const phone = getUserPhone();
  const res = await fetch(`${BACKEND_URL}/api/cycle/log`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_phone: phone,
      period_start_date: periodStartDate,
      cycle_length_days: cycleLength,
      period_length_days: periodLength,
    }),
  });
  return await res.json();
}

/**
 * Uploads report document (photo/PDF) to /api/reports/upload with Google Cloud Vision OCR.
 */
export async function uploadReportFile(file: File, category = "Lab Reports"): Promise<any> {
  const phone = getUserPhone();
  const formData = new FormData();
  formData.append("file", file);
  formData.append("user_phone", phone);
  formData.append("category", category);

  const res = await fetch(`${BACKEND_URL}/api/reports/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`Report upload failed: ${res.status}`);
  }
  return await res.json();
}

/**
 * Fetches saved lab report history (/api/reports).
 */
export async function getUserReports(): Promise<any[]> {
  const phone = getUserPhone();
  try {
    const res = await fetch(`${BACKEND_URL}/api/reports?user_phone=${encodeURIComponent(phone)}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.reports || [];
  } catch (err) {
    console.warn("Could not fetch reports:", err);
    return [];
  }
}

/**
 * Fetches the aggregated Doctor Visit Summary (/api/doctor-summary).
 */
export async function getDoctorSummary(): Promise<any> {
  const phone = getUserPhone();
  const token = getIdToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BACKEND_URL}/api/doctor-summary?user_phone=${encodeURIComponent(phone)}`, {
    headers,
  });
  if (!res.ok) {
    throw new Error(`Failed to load doctor summary: ${res.status}`);
  }
  return await res.json();
}

/**
 * Fetches user profile settings (/api/user/profile).
 */
export async function getUserProfile(): Promise<any> {
  const phone = getUserPhone();
  const res = await fetch(`${BACKEND_URL}/api/user/profile?user_phone=${encodeURIComponent(phone)}`);
  if (!res.ok) return null;
  return await res.json();
}

/**
 * Updates user profile settings (/api/user/profile).
 */
export async function updateUserProfile(profile: any): Promise<any> {
  const phone = getUserPhone();
  const res = await fetch(`${BACKEND_URL}/api/user/profile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_phone: phone,
      ...profile,
    }),
  });
  return await res.json();
}

/**
 * Fetches educational content and tip of the day (/api/education/insights).
 */
export async function getEducationalInsights(): Promise<any> {
  const res = await fetch(`${BACKEND_URL}/api/education/insights`);
  if (!res.ok) return null;
  return await res.json();
}
