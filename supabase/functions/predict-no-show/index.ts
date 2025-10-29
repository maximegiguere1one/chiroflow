import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@^2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface AppointmentData {
  id: string;
  patient_id: string | null;
  name: string;
  email: string;
  phone: string;
  scheduled_date: string;
  scheduled_time: string;
  status: string;
  created_at: string;
  reason: string;
  duration_minutes: number;
}

interface PatientHistory {
  total_appointments: number;
  no_show_count: number;
  cancellation_count: number;
  completion_rate: number;
  avg_lead_time_days: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { appointment_id } = await req.json();

    if (!appointment_id) {
      return new Response(
        JSON.stringify({ error: "appointment_id is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: appointment, error: aptError } = await supabase
      .from("appointments")
      .select("*")
      .eq("id", appointment_id)
      .single();

    if (aptError || !appointment) {
      return new Response(
        JSON.stringify({ error: "Appointment not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const prediction = await generateNoShowPrediction(appointment as AppointmentData, supabase);

    const { data: predictionRecord, error: predError } = await supabase
      .from("no_show_predictions")
      .upsert({
        appointment_id: appointment.id,
        patient_id: appointment.patient_id,
        risk_level: prediction.risk_level,
        risk_score: prediction.risk_score,
        confidence_score: prediction.confidence_score,
        factors: prediction.factors,
        model_version: "v1.0",
        metadata: prediction.metadata,
      })
      .select()
      .single();

    if (predError) {
      console.error("Error saving prediction:", predError);
      return new Response(
        JSON.stringify({ error: "Failed to save prediction" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        prediction: predictionRecord,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in predict-no-show function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function generateNoShowPrediction(
  appointment: AppointmentData,
  supabase: any
): Promise<{
  risk_level: "low" | "medium" | "high";
  risk_score: number;
  confidence_score: number;
  factors: any;
  metadata: any;
}> {
  let riskScore = 0.0;
  const factors: any = {};
  const metadata: any = {};

  const patientHistory = await getPatientHistory(appointment, supabase);
  factors.patient_history = patientHistory;

  if (patientHistory.no_show_count > 0) {
    const noShowRate = patientHistory.no_show_count / patientHistory.total_appointments;
    riskScore += noShowRate * 0.4;
    metadata.no_show_rate = noShowRate;
  }

  if (patientHistory.completion_rate < 0.7) {
    riskScore += 0.15;
  } else if (patientHistory.completion_rate > 0.9) {
    riskScore -= 0.1;
  }

  const leadTimeDays = calculateLeadTime(appointment);
  factors.booking_lead_time = leadTimeDays;

  if (leadTimeDays < 2) {
    riskScore += 0.1;
  } else if (leadTimeDays > 14) {
    riskScore += 0.15;
  } else if (leadTimeDays >= 3 && leadTimeDays <= 7) {
    riskScore -= 0.05;
  }

  const timeFactors = analyzeTimeFactors(appointment);
  factors.time_analysis = timeFactors;
  riskScore += timeFactors.risk_adjustment;

  const isNewPatient = !appointment.patient_id || patientHistory.total_appointments === 0;
  factors.is_new_patient = isNewPatient;
  if (isNewPatient) {
    riskScore += 0.2;
  }

  if (appointment.reason && appointment.reason.toLowerCase().includes("urgence")) {
    riskScore -= 0.05;
    factors.is_urgent = true;
  }

  if (appointment.duration_minutes > 60) {
    riskScore += 0.05;
  }

  riskScore = Math.max(0, Math.min(1, riskScore));

  let riskLevel: "low" | "medium" | "high";
  if (riskScore >= 0.6) {
    riskLevel = "high";
  } else if (riskScore >= 0.35) {
    riskLevel = "medium";
  } else {
    riskLevel = "low";
  }

  const confidenceScore = calculateConfidenceScore(patientHistory, appointment);

  return {
    risk_level: riskLevel,
    risk_score: parseFloat(riskScore.toFixed(4)),
    confidence_score: parseFloat(confidenceScore.toFixed(4)),
    factors,
    metadata: {
      ...metadata,
      calculated_at: new Date().toISOString(),
      lead_time_days: leadTimeDays,
    },
  };
}

async function getPatientHistory(
  appointment: AppointmentData,
  supabase: any
): Promise<PatientHistory> {
  if (!appointment.patient_id) {
    return {
      total_appointments: 0,
      no_show_count: 0,
      cancellation_count: 0,
      completion_rate: 0,
      avg_lead_time_days: 0,
    };
  }

  const { data: history, error } = await supabase
    .from("appointments")
    .select("status, created_at, scheduled_date")
    .eq("patient_id", appointment.patient_id)
    .neq("id", appointment.id);

  if (error || !history) {
    return {
      total_appointments: 0,
      no_show_count: 0,
      cancellation_count: 0,
      completion_rate: 0,
      avg_lead_time_days: 0,
    };
  }

  const total = history.length;
  const noShows = history.filter((a) => a.status === "no_show").length;
  const cancellations = history.filter((a) => a.status === "cancelled").length;
  const completed = history.filter((a) => a.status === "completed").length;

  let totalLeadTime = 0;
  history.forEach((a) => {
    const created = new Date(a.created_at);
    const scheduled = new Date(a.scheduled_date);
    const leadDays = Math.floor((scheduled.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    if (leadDays >= 0) {
      totalLeadTime += leadDays;
    }
  });

  return {
    total_appointments: total,
    no_show_count: noShows,
    cancellation_count: cancellations,
    completion_rate: total > 0 ? completed / total : 0,
    avg_lead_time_days: total > 0 ? totalLeadTime / total : 0,
  };
}

function calculateLeadTime(appointment: AppointmentData): number {
  const now = new Date();
  const scheduledDate = new Date(appointment.scheduled_date);
  const diffTime = scheduledDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

function analyzeTimeFactors(appointment: AppointmentData): {
  day_of_week: string;
  time_of_day: string;
  risk_adjustment: number;
} {
  const scheduledDate = new Date(appointment.scheduled_date);
  const dayOfWeek = scheduledDate.getDay();
  const hour = parseInt(appointment.scheduled_time.split(":")[0]);

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  let riskAdjustment = 0;

  if (dayOfWeek === 1) {
    riskAdjustment += 0.05;
  } else if (dayOfWeek === 5) {
    riskAdjustment += 0.03;
  }

  let timeOfDay = "morning";
  if (hour >= 12 && hour < 17) {
    timeOfDay = "afternoon";
  } else if (hour >= 17) {
    timeOfDay = "evening";
    riskAdjustment += 0.05;
  }

  if (hour === 8 || hour === 9) {
    riskAdjustment += 0.02;
  }

  return {
    day_of_week: dayNames[dayOfWeek],
    time_of_day: timeOfDay,
    risk_adjustment: riskAdjustment,
  };
}

function calculateConfidenceScore(
  patientHistory: PatientHistory,
  appointment: AppointmentData
): number {
  let confidence = 0.7;

  if (patientHistory.total_appointments >= 5) {
    confidence += 0.15;
  } else if (patientHistory.total_appointments >= 10) {
    confidence += 0.2;
  }

  if (appointment.patient_id) {
    confidence += 0.1;
  }

  return Math.min(1.0, confidence);
}
