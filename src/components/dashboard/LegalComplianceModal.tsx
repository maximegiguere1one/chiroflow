import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { X, Shield, FileText, CheckCircle, AlertTriangle, Lock, Eye, Download, Trash2 } from 'lucide-react';

interface LegalComplianceModalProps {
  patientId: string;
  patientName: string;
  onClose: () => void;
  onConsentGranted?: () => void;
}

export function LegalComplianceModal({ patientId, patientName, onClose, onConsentGranted }: LegalComplianceModalProps) {
  const [consents, setConsents] = useState({
    treatment: false,
    dataCollection: false,
    dataSharing: false,
    electronicCommunication: false,
    photoVideo: false,
    billing: false,
  });

  const [acknowledgedRights, setAcknowledgedRights] = useState(false);
  const [signatureName, setSignatureName] = useState('');
  const [signatureDate, setSignatureDate] = useState(new Date().toISOString().split('T')[0]);

  const allConsentsGranted = Object.values(consents).every(c => c) && acknowledgedRights && signatureName;

  const handleSubmit = () => {
    if (!allConsentsGranted) return;

    onConsentGranted?.();
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItaDJ2LTJoLTJ6bTAtNGgydjJoLTJ2LTJ6bTAgOGgydjJoLTJ2LTJ6bTQtNHYyaDJ2LTJoLTJ6bS00IDB2Mmgydi0yaC0yem0tOCAwdjJoMnYtMmgtMnptOC00djJoMnYtMmgtMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />

            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">
                    Consentement & Conformité Légale
                  </h2>
                  <p className="text-blue-200 text-sm">
                    Conforme à la Loi 25 (Québec) et LPRPDE (Canada)
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-xl transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Patient Info */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border-2 border-blue-200">
              <div className="flex items-center gap-3 mb-3">
                <FileText className="w-6 h-6 text-blue-600" />
                <h3 className="text-lg font-bold text-slate-900">Patient: {patientName}</h3>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                Ce formulaire de consentement est requis par la loi avant toute collecte, utilisation ou
                communication de renseignements personnels de santé conformément à la <strong>Loi 25</strong> du
                Québec et à la <strong>LPRPDE</strong> fédérale.
              </p>
            </div>

            {/* Droits du Patient */}
            <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Vos Droits en Vertu de la Loi
                </h3>
              </div>
              <div className="p-6 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">Droit d'accès</h4>
                    <p className="text-sm text-slate-600">
                      Vous avez le droit de consulter votre dossier et d'en obtenir une copie à tout moment.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">Droit de rectification</h4>
                    <p className="text-sm text-slate-600">
                      Vous pouvez demander la correction de toute information inexacte ou incomplète.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">Droit au retrait du consentement</h4>
                    <p className="text-sm text-slate-600">
                      Vous pouvez retirer votre consentement en tout temps, sous réserve des restrictions légales.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">Droit à la portabilité</h4>
                    <p className="text-sm text-slate-600">
                      Vous pouvez demander le transfert de vos données vers un autre professionnel.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">Droit à l'effacement (droit à l'oubli)</h4>
                    <p className="text-sm text-slate-600">
                      Vous pouvez demander la suppression de vos données après la période légale de conservation (5 ans).
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Consentements Requis */}
            <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Consentements Requis
                </h3>
              </div>
              <div className="p-6 space-y-4">
                {/* Consentement aux soins */}
                <label className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border-2 border-slate-200 cursor-pointer hover:border-blue-300 transition-all">
                  <input
                    type="checkbox"
                    checked={consents.treatment}
                    onChange={(e) => setConsents({ ...consents, treatment: e.target.checked })}
                    className="mt-1 w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="font-bold text-slate-900 mb-2">
                      1. Consentement aux soins chiropratiques
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Je consens à recevoir des traitements chiropratiques. J'ai été informé(e) des bénéfices,
                      risques et alternatives. Je comprends que je peux refuser ou cesser les soins en tout temps.
                    </p>
                  </div>
                </label>

                {/* Collecte de données */}
                <label className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border-2 border-slate-200 cursor-pointer hover:border-blue-300 transition-all">
                  <input
                    type="checkbox"
                    checked={consents.dataCollection}
                    onChange={(e) => setConsents({ ...consents, dataCollection: e.target.checked })}
                    className="mt-1 w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="font-bold text-slate-900 mb-2">
                      2. Collecte et utilisation de renseignements personnels de santé (OBLIGATOIRE)
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Je consens à la collecte, l'utilisation et la conservation de mes renseignements personnels de
                      santé aux fins de traitement, de suivi clinique et de facturation. Ces données seront conservées
                      pour une période minimale de 5 ans conformément au Code des professions du Québec.
                    </p>
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-xs text-blue-800 font-semibold">
                        <strong>Données collectées:</strong> Nom, coordonnées, date de naissance, historique médical,
                        notes cliniques, résultats d'examens, plan de traitement, facturation.
                      </p>
                    </div>
                  </div>
                </label>

                {/* Partage de données */}
                <label className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border-2 border-slate-200 cursor-pointer hover:border-blue-300 transition-all">
                  <input
                    type="checkbox"
                    checked={consents.dataSharing}
                    onChange={(e) => setConsents({ ...consents, dataSharing: e.target.checked })}
                    className="mt-1 w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="font-bold text-slate-900 mb-2">
                      3. Communication avec les professionnels de la santé
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Je consens à ce que mon chiropraticien communique avec d'autres professionnels de la santé
                      (médecin, physiothérapeute, etc.) lorsque nécessaire pour assurer la continuité des soins.
                      Seules les informations pertinentes seront partagées.
                    </p>
                  </div>
                </label>

                {/* Communications électroniques */}
                <label className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border-2 border-slate-200 cursor-pointer hover:border-blue-300 transition-all">
                  <input
                    type="checkbox"
                    checked={consents.electronicCommunication}
                    onChange={(e) => setConsents({ ...consents, electronicCommunication: e.target.checked })}
                    className="mt-1 w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="font-bold text-slate-900 mb-2">
                      4. Communications électroniques sécurisées
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Je consens à recevoir des communications par courriel et/ou SMS (rappels de rendez-vous,
                      résultats, informations administratives). Je comprends les risques liés aux communications
                      électroniques et que des mesures de sécurité sont en place.
                    </p>
                  </div>
                </label>

                {/* Photos et vidéos */}
                <label className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border-2 border-slate-200 cursor-pointer hover:border-blue-300 transition-all">
                  <input
                    type="checkbox"
                    checked={consents.photoVideo}
                    onChange={(e) => setConsents({ ...consents, photoVideo: e.target.checked })}
                    className="mt-1 w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="font-bold text-slate-900 mb-2">
                      5. Photos et vidéos à des fins cliniques (OPTIONNEL)
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Je consens à ce que des photos ou vidéos soient prises à des fins de documentation clinique,
                      d'analyse posturale et de suivi de progression. Ces images seront conservées de façon
                      confidentielle dans mon dossier.
                    </p>
                  </div>
                </label>

                {/* Facturation */}
                <label className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border-2 border-slate-200 cursor-pointer hover:border-blue-300 transition-all">
                  <input
                    type="checkbox"
                    checked={consents.billing}
                    onChange={(e) => setConsents({ ...consents, billing: e.target.checked })}
                    className="mt-1 w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="font-bold text-slate-900 mb-2">
                      6. Transmission aux assureurs
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Je consens à ce que mes informations de santé pertinentes soient transmises à ma compagnie
                      d'assurance aux fins de remboursement. Je comprends que seules les informations nécessaires
                      au traitement de la réclamation seront partagées.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Mesures de Sécurité */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
                  <Lock className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Mesures de Sécurité en Place</h3>
              </div>
              <ul className="space-y-2 text-sm text-slate-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Chiffrement des données en transit (TLS/SSL) et au repos (AES-256)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Contrôle d'accès strict avec authentification multi-facteurs</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Journal d'audit complet de tous les accès et modifications</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Sauvegardes automatiques quotidiennes avec rétention de 90 jours</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Serveurs hébergés au Canada conformes aux normes SOC 2 Type II</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Formation continue du personnel sur la confidentialité</span>
                </li>
              </ul>
            </div>

            {/* Acknowledgment */}
            <div className="bg-white rounded-2xl border-2 border-slate-200 p-6">
              <label className="flex items-start gap-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acknowledgedRights}
                  onChange={(e) => setAcknowledgedRights(e.target.checked)}
                  className="mt-1 w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="font-bold text-slate-900 mb-2">
                    Déclaration de compréhension
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Je déclare avoir lu, compris et accepté les conditions ci-dessus. J'ai été informé(e) de mes
                    droits en vertu de la Loi 25 et de la LPRPDE. Je comprends que je peux retirer mon consentement
                    en tout temps en soumettant une demande écrite.
                  </p>
                </div>
              </label>
            </div>

            {/* Signature */}
            <div className="bg-white rounded-2xl border-2 border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Signature Électronique</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Nom complet
                  </label>
                  <input
                    type="text"
                    value={signatureName}
                    onChange={(e) => setSignatureName(e.target.value)}
                    placeholder="Entrez votre nom complet"
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={signatureDate}
                    onChange={(e) => setSignatureDate(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div className="p-4 bg-amber-50 border-2 border-amber-200 rounded-xl">
                  <p className="text-sm text-amber-900">
                    <strong>Note:</strong> Votre signature électronique a la même valeur légale qu'une signature
                    manuscrite conformément à la Loi concernant le cadre juridique des technologies de l'information
                    (LCCJTI) du Québec.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-slate-200 bg-slate-50 p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="text-sm text-slate-600">
                {!allConsentsGranted && (
                  <div className="flex items-center gap-2 text-red-600">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="font-semibold">Tous les consentements obligatoires doivent être accordés</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-white border-2 border-slate-200 text-slate-700 rounded-xl hover:border-slate-300 hover:shadow-sm transition-all font-semibold"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!allConsentsGranted}
                  className={`px-8 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                    allConsentsGranted
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-xl'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <CheckCircle className="w-5 h-5" />
                  Confirmer et Signer
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
