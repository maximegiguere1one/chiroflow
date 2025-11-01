export type Language = 'fr' | 'en';

export interface Translation {
  fr: string;
  en: string;
}

export const translations = {
  email: {
    reminder24h: {
      subject: {
        fr: 'Confirmez votre présence - RDV le {date}',
        en: 'Confirm your attendance - Appointment on {date}'
      },
      greeting: {
        fr: 'Bonjour {name},',
        en: 'Hello {name},'
      },
      approaching: {
        fr: 'Votre rendez-vous approche!',
        en: 'Your appointment is coming up!'
      },
      date: {
        fr: 'Date:',
        en: 'Date:'
      },
      time: {
        fr: 'Heure:',
        en: 'Time:'
      },
      duration: {
        fr: 'Durée:',
        en: 'Duration:'
      },
      service: {
        fr: 'Service:',
        en: 'Service:'
      },
      pleaseConfirm: {
        fr: 'Merci de confirmer votre présence en cliquant sur le bouton ci-dessous:',
        en: 'Please confirm your attendance by clicking the button below:'
      },
      confirmButton: {
        fr: '✅ Je confirme ma présence',
        en: '✅ I confirm my attendance'
      },
      needToChange: {
        fr: 'Besoin d\'annuler ou modifier votre RDV?',
        en: 'Need to cancel or reschedule?'
      },
      manageAppointment: {
        fr: 'Gérer mon rendez-vous',
        en: 'Manage my appointment'
      },
      tip: {
        fr: '💡 Astuce: Arrivez 10 minutes avant votre rendez-vous et apportez votre carte d\'assurance.',
        en: '💡 Tip: Arrive 10 minutes before your appointment and bring your insurance card.'
      }
    },
    sms2h: {
      message: {
        fr: '🩺 ChiroFlow: Rappel de RDV dans 2h à {time}. Confirmez: {confirmUrl}. Gérer: {manageUrl}',
        en: '🩺 ChiroFlow: Appointment reminder in 2h at {time}. Confirm: {confirmUrl}. Manage: {manageUrl}'
      }
    },
    confirmation: {
      subject: {
        fr: '✅ Rendez-vous confirmé',
        en: '✅ Appointment confirmed'
      },
      thanks: {
        fr: 'Merci d\'avoir confirmé votre présence!',
        en: 'Thank you for confirming your attendance!'
      },
      lookingForward: {
        fr: 'Nous avons hâte de vous voir! 💚',
        en: 'We look forward to seeing you! 💚'
      },
      reminder: {
        fr: '💡 Rappel: Arrivez 10 minutes avant votre rendez-vous et apportez votre carte d\'assurance.',
        en: '💡 Reminder: Arrive 10 minutes before your appointment and bring your insurance card.'
      }
    },
    followup: {
      subject: {
        fr: '💜 Comment vous sentez-vous après votre visite?',
        en: '💜 How are you feeling after your visit?'
      },
      thankYou: {
        fr: 'Merci d\'avoir choisi notre clinique hier pour votre traitement!',
        en: 'Thank you for choosing our clinic yesterday for your treatment!'
      },
      hopeBetter: {
        fr: 'Nous espérons que vous vous sentez mieux. Votre bien-être est notre priorité. 🌟',
        en: 'We hope you\'re feeling better. Your well-being is our priority. 🌟'
      },
      howWasIt: {
        fr: 'Comment s\'est passé votre rendez-vous?',
        en: 'How was your appointment?'
      },
      feedback: {
        fr: 'Votre avis nous aide à améliorer nos services',
        en: 'Your feedback helps us improve our services'
      },
      giveFeedback: {
        fr: 'Donner mon avis (2 min)',
        en: 'Give feedback (2 min)'
      },
      nextAppointment: {
        fr: 'Planifier votre prochain rendez-vous',
        en: 'Schedule your next appointment'
      },
      recommend: {
        fr: 'Pour maintenir les progrès, nous recommandons un suivi dans 2-4 semaines.',
        en: 'To maintain progress, we recommend a follow-up in 2-4 weeks.'
      },
      bookNext: {
        fr: 'Réserver mon prochain RDV',
        en: 'Book my next appointment'
      },
      tips: {
        fr: '💡 Conseils entre les séances:',
        en: '💡 Tips between sessions:'
      },
      tip1: {
        fr: 'Maintenez une bonne posture',
        en: 'Maintain good posture'
      },
      tip2: {
        fr: 'Appliquez de la glace si besoin (15 min max)',
        en: 'Apply ice if needed (15 min max)'
      },
      tip3: {
        fr: 'Faites les exercices recommandés',
        en: 'Do recommended exercises'
      },
      tip4: {
        fr: 'Buvez beaucoup d\'eau',
        en: 'Drink plenty of water'
      }
    },
    rebook: {
      subject: {
        fr: '📅 Il est temps de reprendre RDV - Maintenez vos progrès!',
        en: '📅 Time for your next appointment - Maintain your progress!'
      },
      greeting: {
        fr: 'Cela fait maintenant 3 semaines depuis votre dernière visite. Comment allez-vous?',
        en: 'It\'s been 3 weeks since your last visit. How are you doing?'
      },
      studies: {
        fr: 'Des études montrent que des soins réguliers espacés de 3-4 semaines permettent:',
        en: 'Studies show that regular care spaced 3-4 weeks apart allows:'
      },
      benefit1: {
        fr: 'De maintenir les progrès obtenus',
        en: 'To maintain the progress achieved'
      },
      benefit2: {
        fr: 'De prévenir la réapparition des douleurs',
        en: 'To prevent pain from returning'
      },
      benefit3: {
        fr: 'D\'améliorer durablement votre bien-être',
        en: 'To sustainably improve your well-being'
      },
      benefit4: {
        fr: 'De réduire les coûts à long terme',
        en: 'To reduce long-term costs'
      },
      recommend: {
        fr: 'Nous vous recommandons de planifier votre prochain rendez-vous dès maintenant:',
        en: 'We recommend scheduling your next appointment now:'
      },
      bookButton: {
        fr: '📅 Réserver mon prochain RDV',
        en: '📅 Book my next appointment'
      },
      advantages: {
        fr: '🎁 Avantages de la réservation en ligne:',
        en: '🎁 Benefits of online booking:'
      },
      adv1: {
        fr: 'Choisissez l\'heure qui vous convient',
        en: 'Choose the time that suits you'
      },
      adv2: {
        fr: 'Confirmation instantanée',
        en: 'Instant confirmation'
      },
      adv3: {
        fr: 'Rappels automatiques',
        en: 'Automatic reminders'
      },
      adv4: {
        fr: 'Modification facile si besoin',
        en: 'Easy modification if needed'
      }
    }
  },
  voice: {
    reminder: {
      fr: 'Bonjour, c\'est ChiroFlow. Vous avez un rendez-vous aujourd\'hui à {time}. Appuyez sur 1 pour confirmer, ou sur 2 pour annuler.',
      en: 'Hello, this is ChiroFlow. You have an appointment today at {time}. Press 1 to confirm, or 2 to cancel.'
    },
    confirmed: {
      fr: 'Merci! Votre rendez-vous est confirmé. À bientôt!',
      en: 'Thank you! Your appointment is confirmed. See you soon!'
    },
    cancelled: {
      fr: 'Votre rendez-vous a été annulé. Nous vous recontacterons bientôt.',
      en: 'Your appointment has been cancelled. We\'ll contact you again soon.'
    }
  }
};

export function t(
  path: string,
  language: Language = 'fr',
  vars?: Record<string, string>
): string {
  const keys = path.split('.');
  let value: any = translations;

  for (const key of keys) {
    value = value?.[key];
    if (!value) {
      console.warn(`Translation missing for: ${path}`);
      return path;
    }
  }

  let text = value[language] || value.fr || '';

  if (vars) {
    Object.entries(vars).forEach(([key, val]) => {
      text = text.replace(new RegExp(`\\{${key}\\}`, 'g'), val);
    });
  }

  return text;
}

export function getPatientLanguage(contactId: string): Promise<Language> {
  return Promise.resolve('fr');
}

export function formatDate(date: Date, language: Language): string {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };

  const locale = language === 'fr' ? 'fr-FR' : 'en-US';
  return date.toLocaleDateString(locale, options);
}

export function formatTime(date: Date, language: Language): string {
  const options: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit'
  };

  const locale = language === 'fr' ? 'fr-FR' : 'en-US';
  return date.toLocaleTimeString(locale, options);
}
