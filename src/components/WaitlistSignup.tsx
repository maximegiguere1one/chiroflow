import { useState } from 'react';
import { Clock, CheckCircle, AlertCircle, User, Mail, Phone, Calendar } from 'lucide-react';

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const TIMES = ['Matin (8h-12h)', 'Après-midi (12h-17h)', 'Soir (17h-20h)'];

export function WaitlistSignup() {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    preferred_days: [] as string[],
    preferred_times: [] as string[],
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [position, setPosition] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/join-waitlist`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'inscription');
      }

      if (data.already_registered) {
        setError('Vous êtes déjà inscrit sur notre liste d\'attente!');
      } else if (data.already_invited) {
        setError('Vous avez déjà reçu une invitation! Vérifiez vos emails.');
      } else {
        setSuccess(true);
        setPosition(data.position);
        // Reset form
        setFormData({
          full_name: '',
          email: '',
          phone: '',
          preferred_days: [],
          preferred_times: [],
          notes: '',
        });
      }
    } catch (err: any) {
      console.error('Error joining waitlist:', err);
      setError(err.message || 'Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (day: string) => {
    setFormData((prev) => ({
      ...prev,
      preferred_days: prev.preferred_days.includes(day)
        ? prev.preferred_days.filter((d) => d !== day)
        : [...prev.preferred_days, day],
    }));
  };

  const toggleTime = (time: string) => {
    setFormData((prev) => ({
      ...prev,
      preferred_times: prev.preferred_times.includes(time)
        ? prev.preferred_times.filter((t) => t !== time)
        : [...prev.preferred_times, time],
    }));
  };

  if (success) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl mx-auto">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-3xl font-heading text-foreground mb-4">
            Inscription réussie!
          </h2>
          <p className="text-lg text-neutral-600 mb-4">
            Merci de votre intérêt! Vous êtes maintenant sur notre liste d'attente.
          </p>
          {position && (
            <div className="inline-block px-4 py-2 bg-gold-100 text-gold-700 rounded-lg mb-6">
              <p className="font-medium">
                Votre position: #{position}
              </p>
            </div>
          )}
          <div className="space-y-2 text-neutral-600">
            <p>Nous vous contacterons dès qu'une place se libère.</p>
            <p>Un email de confirmation vous a été envoyé.</p>
          </div>
          <button
            onClick={() => {
              setSuccess(false);
              setPosition(null);
            }}
            className="mt-6 px-6 py-3 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors"
          >
            Inscrire une autre personne
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gold-100 rounded-full mb-4">
          <Clock className="w-8 h-8 text-gold-600" />
        </div>
        <h2 className="text-3xl font-heading text-foreground mb-2">
          Rejoindre la liste d'attente
        </h2>
        <p className="text-neutral-600">
          Nous sommes complets actuellement, mais nous vous contacterons dès qu'une place se libère!
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <div className="space-y-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-2">
              <User className="w-4 h-4" />
              Nom complet *
            </label>
            <input
              type="text"
              required
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
              placeholder="Jean Tremblay"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-2">
              <Mail className="w-4 h-4" />
              Email *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
              placeholder="jean.tremblay@example.com"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-2">
              <Phone className="w-4 h-4" />
              Téléphone *
            </label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
              placeholder="514-555-0123"
            />
          </div>
        </div>

        {/* Preferences */}
        <div className="space-y-4 pt-6 border-t border-neutral-200">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-3">
              <Calendar className="w-4 h-4" />
              Jours préférés (optionnel)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {DAYS.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
                    formData.preferred_days.includes(day)
                      ? 'bg-gold-500 border-gold-500 text-white'
                      : 'border-neutral-300 text-neutral-700 hover:border-gold-300'
                  }`}
                >
                  {day.substring(0, 3)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-3">
              <Clock className="w-4 h-4" />
              Plages horaires préférées (optionnel)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {TIMES.map((time) => (
                <button
                  key={time}
                  type="button"
                  onClick={() => toggleTime(time)}
                  className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
                    formData.preferred_times.includes(time)
                      ? 'bg-gold-500 border-gold-500 text-white'
                      : 'border-neutral-300 text-neutral-700 hover:border-gold-300'
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-neutral-700 mb-2 block">
              Notes additionnelles (optionnel)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent resize-none"
              placeholder="Raison de la consultation, besoins spécifiques, etc."
            />
          </div>
        </div>

        {/* Submit */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Inscription en cours...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Rejoindre la liste d'attente
              </>
            )}
          </button>
        </div>

        <p className="text-xs text-neutral-500 text-center">
          En vous inscrivant, vous acceptez d'être contacté par notre clinique lorsqu'une place se libère.
        </p>
      </form>
    </div>
  );
}
