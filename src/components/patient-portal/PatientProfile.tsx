import { User, Mail, Phone, MapPin } from 'lucide-react';

interface PatientProfileProps {
  patient: any;
  onUpdate: () => void;
}

export default function PatientProfile({ patient }: PatientProfileProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white border border-neutral-200 p-6 rounded-lg shadow-soft">
        <h2 className="text-xl font-heading text-foreground mb-6">Informations personnelles</h2>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-foreground/40" />
            <div>
              <div className="text-sm text-foreground/60">Nom complet</div>
              <div className="font-medium text-foreground">
                {patient.first_name} {patient.last_name}
              </div>
            </div>
          </div>

          {patient.email && (
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-foreground/40" />
              <div>
                <div className="text-sm text-foreground/60">Courriel</div>
                <div className="font-medium text-foreground">{patient.email}</div>
              </div>
            </div>
          )}

          {patient.phone && (
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-foreground/40" />
              <div>
                <div className="text-sm text-foreground/60">Téléphone</div>
                <div className="font-medium text-foreground">{patient.phone}</div>
              </div>
            </div>
          )}

          {patient.address && (
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-foreground/40" />
              <div>
                <div className="text-sm text-foreground/60">Adresse</div>
                <div className="font-medium text-foreground">{patient.address}</div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 pt-6 border-t border-neutral-200">
          <p className="text-sm text-foreground/60">
            Pour modifier vos informations, veuillez contacter votre clinique.
          </p>
        </div>
      </div>
    </div>
  );
}
