interface SlotInvitationEmailProps {
  patientName: string;
  slotDate: string;
  slotTime: string;
  duration: number;
  acceptUrl: string;
  declineUrl: string;
  expiresIn: string;
}

export function generateSlotInvitationEmail({
  patientName,
  slotDate,
  slotTime,
  duration,
  acceptUrl,
  declineUrl,
  expiresIn,
}: SlotInvitationEmailProps): { subject: string; html: string; text: string } {
  const subject = '🎯 Un créneau vient de se libérer pour vous!';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8f9fa;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #d4af37 0%, #c5a028 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                Bonne nouvelle!
              </h1>
              <p style="margin: 10px 0 0 0; color: rgba(255, 255, 255, 0.95); font-size: 16px;">
                Un rendez-vous vient de se libérer
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                Bonjour <strong>${patientName}</strong>,
              </p>

              <p style="margin: 0 0 30px 0; color: #555555; font-size: 16px; line-height: 1.6;">
                Un client vient d'annuler son rendez-vous et nous avons pensé à vous!
                Ce créneau correspond à vos disponibilités et nous serions ravis de vous recevoir.
              </p>

              <!-- Slot Details Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #fff8e1 0%, #fff3cd 100%); border-radius: 8px; margin-bottom: 30px; border: 2px solid #d4af37;">
                <tr>
                  <td style="padding: 30px; text-align: center;">
                    <div style="margin-bottom: 8px;">
                      <span style="font-size: 14px; color: #666; text-transform: uppercase; letter-spacing: 1px;">Rendez-vous disponible</span>
                    </div>
                    <div style="margin-bottom: 15px;">
                      <span style="font-size: 32px; font-weight: 700; color: #d4af37;">📅</span>
                    </div>
                    <div style="margin-bottom: 8px;">
                      <span style="font-size: 24px; font-weight: 600; color: #333;">${slotDate}</span>
                    </div>
                    <div style="margin-bottom: 8px;">
                      <span style="font-size: 28px; font-weight: 700; color: #d4af37;">${slotTime}</span>
                    </div>
                    <div>
                      <span style="font-size: 14px; color: #666;">Durée: ${duration} minutes</span>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Urgency Banner -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 15px 20px;">
                    <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.5;">
                      ⏰ <strong>Cette invitation expire dans ${expiresIn}</strong><br>
                      Premier arrivé, premier servi! Réservez vite votre place.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA Buttons -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                <tr>
                  <td align="center" style="padding: 0 0 15px 0;">
                    <a href="${acceptUrl}" style="display: inline-block; background: linear-gradient(135deg, #28a745 0%, #218838 100%); color: #ffffff; text-decoration: none; padding: 18px 50px; border-radius: 8px; font-size: 18px; font-weight: 600; box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);">
                      ✅ Oui, je prends ce rendez-vous!
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <a href="${declineUrl}" style="display: inline-block; background-color: transparent; color: #6c757d; text-decoration: none; padding: 12px 30px; border: 2px solid #dee2e6; border-radius: 8px; font-size: 14px;">
                      Non merci, je ne peux pas
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; color: #777; font-size: 14px; line-height: 1.6;">
                Si vous acceptez ce créneau, vous recevrez immédiatement une confirmation avec tous les détails.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #dee2e6;">
              <p style="margin: 0 0 10px 0; color: #6c757d; font-size: 12px;">
                Clinique Chiropratique
              </p>
              <p style="margin: 0; color: #adb5bd; font-size: 11px;">
                Vous recevez cet email car vous êtes sur notre liste de rappel.
                <br>
                <a href="#" style="color: #6c757d; text-decoration: underline;">Se désinscrire</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const text = `
Bonjour ${patientName},

Bonne nouvelle! Un rendez-vous vient de se libérer:

📅 ${slotDate}
🕐 ${slotTime}
⏱️ Durée: ${duration} minutes

Cette invitation expire dans ${expiresIn}.

Pour accepter ce rendez-vous:
${acceptUrl}

Si vous ne pouvez pas:
${declineUrl}

À bientôt!
Clinique Chiropratique
  `;

  return { subject, html, text };
}

interface ConfirmationEmailProps {
  patientName: string;
  appointmentDate: string;
  appointmentTime: string;
  duration: number;
  address: string;
}

export function generateConfirmationEmail({
  patientName,
  appointmentDate,
  appointmentTime,
  duration,
  address,
}: ConfirmationEmailProps): { subject: string; html: string; text: string } {
  const subject = '✅ Votre rendez-vous est confirmé!';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8f9fa;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #28a745 0%, #218838 100%); padding: 40px 30px; text-align: center;">
              <div style="font-size: 64px; margin-bottom: 15px;">✅</div>
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                Rendez-vous confirmé!
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                Bonjour <strong>${patientName}</strong>,
              </p>

              <p style="margin: 0 0 30px 0; color: #555555; font-size: 16px; line-height: 1.6;">
                Excellent! Votre rendez-vous est maintenant confirmé. Nous avons hâte de vous voir!
              </p>

              <!-- Appointment Details -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 8px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 25px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 10px 0;">
                          <span style="font-size: 14px; color: #6c757d;">📅 Date</span><br>
                          <span style="font-size: 18px; font-weight: 600; color: #333;">${appointmentDate}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0; border-top: 1px solid #dee2e6;">
                          <span style="font-size: 14px; color: #6c757d;">🕐 Heure</span><br>
                          <span style="font-size: 18px; font-weight: 600; color: #333;">${appointmentTime}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0; border-top: 1px solid #dee2e6;">
                          <span style="font-size: 14px; color: #6c757d;">⏱️ Durée</span><br>
                          <span style="font-size: 18px; font-weight: 600; color: #333;">${duration} minutes</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0; border-top: 1px solid #dee2e6;">
                          <span style="font-size: 14px; color: #6c757d;">📍 Adresse</span><br>
                          <span style="font-size: 16px; color: #333;">${address}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Important Notes -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #e7f3ff; border-left: 4px solid #0066cc; border-radius: 4px; margin-bottom: 25px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 10px 0; color: #004085; font-size: 14px; font-weight: 600;">
                      📋 À noter:
                    </p>
                    <ul style="margin: 0; padding-left: 20px; color: #004085; font-size: 14px; line-height: 1.8;">
                      <li>Arrivez 10 minutes à l'avance pour l'accueil</li>
                      <li>Apportez votre carte d'assurance</li>
                      <li>Portez des vêtements confortables</li>
                    </ul>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 20px 0; color: #555555; font-size: 14px; line-height: 1.6;">
                Si vous devez annuler ou modifier votre rendez-vous, merci de nous prévenir au moins 24h à l'avance.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="#" style="display: inline-block; background-color: transparent; color: #0066cc; text-decoration: none; padding: 12px 30px; border: 2px solid #0066cc; border-radius: 8px; font-size: 14px; font-weight: 500;">
                      📅 Ajouter à mon calendrier
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #dee2e6;">
              <p style="margin: 0 0 10px 0; color: #333; font-size: 14px; font-weight: 500;">
                Clinique Chiropratique
              </p>
              <p style="margin: 0; color: #6c757d; font-size: 12px;">
                Pour toute question, contactez-nous au (XXX) XXX-XXXX
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const text = `
✅ Votre rendez-vous est confirmé!

Bonjour ${patientName},

Votre rendez-vous est maintenant confirmé:

📅 Date: ${appointmentDate}
🕐 Heure: ${appointmentTime}
⏱️ Durée: ${duration} minutes
📍 Adresse: ${address}

À noter:
- Arrivez 10 minutes à l'avance
- Apportez votre carte d'assurance
- Portez des vêtements confortables

À bientôt!
Clinique Chiropratique
  `;

  return { subject, html, text };
}

export function generateExpirationEmail(patientName: string): { subject: string; html: string; text: string } {
  const subject = '⏰ Votre invitation a expiré';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8f9fa;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px;">
          <tr>
            <td style="padding: 40px 30px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 20px;">⏰</div>
              <h2 style="margin: 0 0 20px 0; color: #333; font-size: 24px;">Invitation expirée</h2>
              <p style="margin: 0 0 20px 0; color: #555; font-size: 16px; line-height: 1.6;">
                Bonjour ${patientName},
              </p>
              <p style="margin: 0 0 20px 0; color: #666; font-size: 15px; line-height: 1.6;">
                Le créneau que nous vous avions proposé a été attribué à une autre personne.
              </p>
              <p style="margin: 0; color: #666; font-size: 15px; line-height: 1.6;">
                Vous restez sur notre liste de rappel et nous vous contacterons dès qu'un nouveau créneau se libère!
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #dee2e6;">
              <p style="margin: 0; color: #6c757d; font-size: 12px;">Clinique Chiropratique</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const text = `
⏰ Votre invitation a expiré

Bonjour ${patientName},

Le créneau que nous vous avions proposé a été attribué à une autre personne.

Vous restez sur notre liste de rappel et nous vous contacterons dès qu'un nouveau créneau se libère!

Clinique Chiropratique
  `;

  return { subject, html, text };
}
