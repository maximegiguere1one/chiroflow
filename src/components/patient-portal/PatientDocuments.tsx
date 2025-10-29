import { FileText } from 'lucide-react';

interface PatientDocumentsProps {
  patientId: string;
}

export default function PatientDocuments({ patientId: _patientId }: PatientDocumentsProps) {
  // _patientId will be used when implementing document management
  return (
    <div className="space-y-6">
      <div className="text-center py-12 bg-neutral-50 border border-neutral-200 rounded-lg">
        <FileText className="w-12 h-12 text-foreground/20 mx-auto mb-3" />
        <p className="text-foreground/60">Aucun document disponible pour le moment</p>
        <p className="text-sm text-foreground/40 mt-2">
          Les documents médicaux et formulaires apparaîtront ici
        </p>
      </div>
    </div>
  );
}
