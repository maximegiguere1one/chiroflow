import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [appointmentsData, confirmationsData, followupsData, cronData] = await Promise.all([
      supabaseAdmin
        .from('appointments')
        .select('*')
        .gte('created_at', oneWeekAgo),

      supabaseAdmin
        .from('appointment_confirmations')
        .select('*')
        .gte('created_at', oneWeekAgo),

      supabaseAdmin
        .from('automated_followups')
        .select('*')
        .gte('created_at', oneWeekAgo),

      supabaseAdmin
        .from('cron_job_executions')
        .select('*')
        .gte('executed_at', oneWeekAgo)
    ]);

    const appointments = appointmentsData.data || [];
    const confirmations = confirmationsData.data || [];
    const followups = followupsData.data || [];
    const cronJobs = cronData.data || [];

    const totalAppointments = appointments.length;
    const completedAppointments = appointments.filter(a => a.status === 'completed').length;
    const cancelledAppointments = appointments.filter(a => a.status === 'cancelled').length;
    const noShowAppointments = appointments.filter(a => a.status === 'no_show').length;

    const reminders48h = confirmations.filter(c => c.reminder_48h_sent).length;
    const reminders24h = confirmations.filter(c => c.reminder_24h_sent).length;
    const reminders2h = confirmations.filter(c => c.reminder_2h_sent).length;
    const confirmedAppointments = confirmations.filter(c => c.confirmation_status === 'confirmed').length;

    const followupsSent = followups.filter(f => f.status === 'sent').length;
    const followupsPending = followups.filter(f => f.status === 'pending').length;

    const totalCronExecutions = cronJobs.length;
    const successfulCronExecutions = cronJobs.filter(c => c.success).length;
    const failedCronExecutions = cronJobs.filter(c => !c.success).length;

    const adminEmail = Deno.env.get('ADMIN_EMAIL') || 'admin@example.com';
    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY non configuré');
    }

    const subject = `📊 Rapport hebdomadaire ChiroFlow - Semaine du ${new Date(oneWeekAgo).toLocaleDateString('fr-FR')}`;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 700px; margin: 0 auto; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
    .content { background: #ffffff; padding: 40px 30px; }
    .metric-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin: 30px 0; }
    .metric-card { background: #f9fafb; border: 2px solid #e5e7eb; border-radius: 12px; padding: 20px; }
    .metric-value { font-size: 36px; font-weight: bold; color: #1f2937; margin: 10px 0; }
    .metric-label { font-size: 14px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
    .section { margin: 30px 0; padding: 25px; background: #f9fafb; border-radius: 12px; border-left: 5px solid #667eea; }
    .section h3 { margin: 0 0 15px 0; color: #1f2937; font-size: 18px; }
    .stat-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
    .stat-label { color: #6b7280; }
    .stat-value { font-weight: bold; color: #1f2937; }
    .success { color: #10b981; }
    .warning { color: #f59e0b; }
    .danger { color: #ef4444; }
    .footer { background: #f5f5f5; padding: 30px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 32px;">📊 Rapport Hebdomadaire</h1>
      <p style="margin: 10px 0 0 0; font-size: 16px;">Semaine du ${new Date(oneWeekAgo).toLocaleDateString('fr-FR')} au ${new Date().toLocaleDateString('fr-FR')}</p>
    </div>

    <div class="content">
      <h2 style="color: #1f2937; margin: 0 0 20px 0;">Résumé de votre semaine</h2>

      <div class="metric-grid">
        <div class="metric-card">
          <div class="metric-label">Total Rendez-vous</div>
          <div class="metric-value">${totalAppointments}</div>
          <div style="font-size: 12px; color: #10b981; margin-top: 5px;">
            ${completedAppointments} complétés
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-label">Taux Confirmation</div>
          <div class="metric-value">${totalAppointments > 0 ? Math.round((confirmedAppointments / totalAppointments) * 100) : 0}%</div>
          <div style="font-size: 12px; color: #6b7280; margin-top: 5px;">
            ${confirmedAppointments} / ${totalAppointments} RDV
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-label">Rappels Envoyés</div>
          <div class="metric-value">${reminders48h + reminders24h + reminders2h}</div>
          <div style="font-size: 12px; color: #6b7280; margin-top: 5px;">
            Automatiquement
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-label">Suivis Post-RDV</div>
          <div class="metric-value">${followupsSent}</div>
          <div style="font-size: 12px; color: #6b7280; margin-top: 5px;">
            Emails envoyés
          </div>
        </div>
      </div>

      <div class="section">
        <h3>📅 Rendez-vous</h3>
        <div class="stat-row">
          <span class="stat-label">Total créés</span>
          <span class="stat-value">${totalAppointments}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Complétés</span>
          <span class="stat-value success">${completedAppointments}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Annulés</span>
          <span class="stat-value warning">${cancelledAppointments}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">No-shows</span>
          <span class="stat-value danger">${noShowAppointments}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Taux de présence</span>
          <span class="stat-value">${totalAppointments > 0 ? Math.round(((totalAppointments - noShowAppointments - cancelledAppointments) / totalAppointments) * 100) : 0}%</span>
        </div>
      </div>

      <div class="section">
        <h3>📧 Rappels Automatiques</h3>
        <div class="stat-row">
          <span class="stat-label">Rappels 48h envoyés</span>
          <span class="stat-value">${reminders48h}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Rappels 24h envoyés</span>
          <span class="stat-value">${reminders24h}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Rappels 2h envoyés</span>
          <span class="stat-value">${reminders2h}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Confirmations reçues</span>
          <span class="stat-value success">${confirmedAppointments}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Taux de confirmation</span>
          <span class="stat-value">${totalAppointments > 0 ? Math.round((confirmedAppointments / totalAppointments) * 100) : 0}%</span>
        </div>
      </div>

      <div class="section">
        <h3>💙 Suivis Post-RDV</h3>
        <div class="stat-row">
          <span class="stat-label">Emails de suivi envoyés</span>
          <span class="stat-value success">${followupsSent}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">En attente d'envoi</span>
          <span class="stat-value">${followupsPending}</span>
        </div>
      </div>

      <div class="section">
        <h3>🤖 Automatisations</h3>
        <div class="stat-row">
          <span class="stat-label">Exécutions automatiques</span>
          <span class="stat-value">${totalCronExecutions}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Succès</span>
          <span class="stat-value success">${successfulCronExecutions}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Échecs</span>
          <span class="stat-value ${failedCronExecutions > 5 ? 'danger' : 'warning'}">${failedCronExecutions}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Taux de réussite</span>
          <span class="stat-value">${totalCronExecutions > 0 ? Math.round((successfulCronExecutions / totalCronExecutions) * 100) : 100}%</span>
        </div>
      </div>

      ${failedCronExecutions > 5 ? `
      <div style="background: #fef2f2; border: 2px solid #fecaca; border-radius: 12px; padding: 20px; margin: 20px 0;">
        <h3 style="color: #991b1b; margin: 0 0 10px 0;">⚠️ Attention</h3>
        <p style="color: #991b1b; margin: 0;">
          Plusieurs automatisations ont échoué cette semaine (${failedCronExecutions} échecs).
          Consultez le dashboard d'automatisation pour plus de détails.
        </p>
      </div>
      ` : ''}

      <div style="background: #ecfdf5; border: 2px solid #a7f3d0; border-radius: 12px; padding: 20px; margin: 30px 0;">
        <h3 style="color: #065f46; margin: 0 0 10px 0;">✨ Résumé</h3>
        <p style="color: #065f46; margin: 0; line-height: 1.6;">
          Cette semaine, votre système ChiroFlow a géré automatiquement <strong>${totalAppointments} rendez-vous</strong>,
          envoyé <strong>${reminders48h + reminders24h + reminders2h} rappels</strong>,
          et <strong>${followupsSent} suivis</strong> post-RDV.
          ${totalCronExecutions > 0 ? `Les automatisations ont été exécutées <strong>${totalCronExecutions} fois</strong> avec un taux de réussite de <strong>${Math.round((successfulCronExecutions / totalCronExecutions) * 100)}%</strong>.` : ''}
        </p>
        <p style="color: #065f46; margin: 15px 0 0 0;">
          🎯 <strong>Vous n'avez eu rien à faire!</strong> Le système a tout géré automatiquement.
        </p>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <p style="font-size: 14px; color: #6b7280;">
          Ce rapport est généré automatiquement chaque dimanche soir.
        </p>
      </div>
    </div>

    <div class="footer">
      <p style="margin: 0 0 10px 0;">Rapport généré automatiquement par ChiroFlow</p>
      <p style="margin: 0;">© ${new Date().getFullYear()} ChiroFlow - Tous droits réservés</p>
    </div>
  </div>
</body>
</html>
    `;

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'ChiroFlow <reports@resend.dev>',
        to: [adminEmail],
        subject,
        html: htmlContent,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text();
      throw new Error(`Resend API error: ${errorData}`);
    }

    const emailData = await emailResponse.json();

    console.log('✅ Rapport hebdomadaire envoyé:', adminEmail);

    return new Response(
      JSON.stringify({
        message: 'Rapport hebdomadaire envoyé avec succès',
        email_id: emailData.id,
        stats: {
          totalAppointments,
          completedAppointments,
          confirmedAppointments,
          totalReminders: reminders48h + reminders24h + reminders2h,
          followupsSent,
          cronExecutions: totalCronExecutions,
          cronSuccessRate: totalCronExecutions > 0 ? Math.round((successfulCronExecutions / totalCronExecutions) * 100) : 100
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Erreur fonction send-weekly-report:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
