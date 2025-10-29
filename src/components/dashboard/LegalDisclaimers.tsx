import { AlertTriangle, Shield, FileText, Info } from 'lucide-react';

export function LegalDisclaimers() {
  return (
    <div className="space-y-4">
      {/* Main Disclaimer */}
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border-2 border-blue-200">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-900 mb-3">
              Avis de Confidentialité et de Conformité
            </h3>
            <div className="space-y-3 text-sm text-slate-700 leading-relaxed">
              <p>
                Ce système de gestion de dossiers patients est conforme aux exigences de la{' '}
                <strong>Loi 25</strong> (Loi modernisant des dispositions législatives en matière de protection
                des renseignements personnels) du Québec et de la <strong>LPRPDE</strong> (Loi sur la protection
                des renseignements personnels et les documents électroniques) fédérale.
              </p>
              <p>
                Toutes les données de santé sont considérées comme des <strong>renseignements personnels sensibles</strong> et
                bénéficient d'un niveau de protection maximale conformément au <strong>Code des professions du Québec</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Professional Obligations */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border-2 border-amber-200">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-900 mb-3">
              Obligations Professionnelles
            </h3>
            <div className="space-y-3 text-sm text-slate-700 leading-relaxed">
              <p>
                En tant que professionnel de la santé régi par l'<strong>Ordre des chiropraticiens du Québec</strong>,
                vous êtes tenu de:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Tenir un dossier à jour pour chaque patient (Code des professions, art. 60.5)</li>
                <li>Conserver les dossiers pendant au moins 5 ans après la dernière visite</li>
                <li>Assurer la confidentialité absolue des informations de santé</li>
                <li>Obtenir un consentement éclairé avant tout traitement</li>
                <li>Permettre au patient d'accéder à son dossier sur demande</li>
                <li>Signaler tout incident de confidentialité aux autorités compétentes</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-900 mb-3">
              Mesures de Sécurité Techniques
            </h3>
            <div className="space-y-2 text-sm text-slate-700">
              <div className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span><strong>Chiffrement:</strong> TLS 1.3 en transit, AES-256 au repos</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span><strong>Authentification:</strong> MFA obligatoire pour tous les utilisateurs</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span><strong>Audit:</strong> Journal complet de tous les accès et modifications</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span><strong>Sauvegardes:</strong> Quotidiennes automatiques avec rétention 90 jours</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span><strong>Hébergement:</strong> Serveurs au Canada (conformité résidence des données)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span><strong>Certifications:</strong> SOC 2 Type II, ISO 27001</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Patient Rights */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <Info className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-900 mb-3">
              Droits des Patients (Loi 25)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-slate-700">
              <div>
                <strong className="block mb-1">Droit d'accès</strong>
                <p className="text-xs">Consulter et obtenir copie du dossier</p>
              </div>
              <div>
                <strong className="block mb-1">Droit de rectification</strong>
                <p className="text-xs">Corriger les informations inexactes</p>
              </div>
              <div>
                <strong className="block mb-1">Droit à l'oubli</strong>
                <p className="text-xs">Demander l'effacement après période légale</p>
              </div>
              <div>
                <strong className="block mb-1">Droit à la portabilité</strong>
                <p className="text-xs">Transférer les données vers un autre professionnel</p>
              </div>
              <div>
                <strong className="block mb-1">Droit d'opposition</strong>
                <p className="text-xs">S'opposer à certains traitements des données</p>
              </div>
              <div>
                <strong className="block mb-1">Retrait du consentement</strong>
                <p className="text-xs">Retirer le consentement en tout temps</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Breach Notification */}
      <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl p-6 border-2 border-red-200">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-900 mb-3">
              Protocole en Cas d'Incident de Confidentialité
            </h3>
            <div className="space-y-3 text-sm text-slate-700 leading-relaxed">
              <p>
                En cas d'incident de confidentialité susceptible de causer un préjudice sérieux, la <strong>Loi 25</strong> exige:
              </p>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>
                  <strong>Notification à la CAI</strong> (Commission d'accès à l'information du Québec) sans délai
                </li>
                <li>
                  <strong>Notification aux patients concernés</strong> dans les plus brefs délais
                </li>
                <li>
                  <strong>Conservation dans un registre</strong> de tous les incidents pour une période minimale de 5 ans
                </li>
                <li>
                  <strong>Mesures correctives</strong> pour prévenir la récurrence
                </li>
              </ol>
              <div className="mt-4 p-4 bg-red-100 rounded-xl border border-red-300">
                <p className="text-xs font-semibold text-red-900">
                  <strong>Contact CAI:</strong> 1-888-528-7741 | commission@cai.gouv.qc.ca
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Retention Policy */}
      <div className="bg-white rounded-2xl p-6 border-2 border-slate-200">
        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-slate-600" />
          Politique de Conservation des Données
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-slate-200">
                <th className="text-left py-3 px-4 font-bold text-slate-900">Type de Données</th>
                <th className="text-left py-3 px-4 font-bold text-slate-900">Période</th>
                <th className="text-left py-3 px-4 font-bold text-slate-900">Base Légale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-3 px-4">Dossiers patients</td>
                <td className="py-3 px-4">5 ans minimum</td>
                <td className="py-3 px-4">Code des professions, art. 60.5</td>
              </tr>
              <tr>
                <td className="py-3 px-4">Notes SOAP</td>
                <td className="py-3 px-4">5 ans minimum</td>
                <td className="py-3 px-4">Code des professions</td>
              </tr>
              <tr>
                <td className="py-3 px-4">Formulaires de consentement</td>
                <td className="py-3 px-4">5 ans</td>
                <td className="py-3 px-4">Loi 25 et LPRPDE</td>
              </tr>
              <tr>
                <td className="py-3 px-4">Documents de facturation</td>
                <td className="py-3 px-4">7 ans</td>
                <td className="py-3 px-4">Loi sur les impôts</td>
              </tr>
              <tr>
                <td className="py-3 px-4">Journaux d'audit</td>
                <td className="py-3 px-4">7 ans</td>
                <td className="py-3 px-4">Loi 25, art. 3.5</td>
              </tr>
              <tr>
                <td className="py-3 px-4">Consentements marketing</td>
                <td className="py-3 px-4">3 ans</td>
                <td className="py-3 px-4">LPRPDE</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Notice */}
      <div className="text-xs text-slate-500 text-center p-4 bg-slate-50 rounded-xl">
        <p>
          Ce système est mis à jour régulièrement pour maintenir la conformité avec les lois en vigueur.
          Dernière révision: {new Date().toLocaleDateString('fr-CA')}
        </p>
        <p className="mt-2">
          Pour toute question relative à la protection des renseignements personnels, contactez votre
          responsable de la protection des données ou consultez la Commission d'accès à l'information du Québec.
        </p>
      </div>
    </div>
  );
}
