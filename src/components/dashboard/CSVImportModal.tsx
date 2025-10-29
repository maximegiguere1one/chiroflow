import { motion } from 'framer-motion';
import { useState } from 'react';
import { X, Upload, Download, FileText, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { importPatientsFromCSV, importAppointmentsFromCSV, downloadCSVTemplate, type CSVImportResult } from '../../lib/csvImporter';
import { useToastContext } from '../../contexts/ToastContext';

interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'patients' | 'appointments';
  onSuccess: () => void;
}

export function CSVImportModal({ isOpen, onClose, type, onSuccess }: CSVImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<CSVImportResult | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [dragActive, setDragActive] = useState(false);
  const toast = useToastContext();

  const title = type === 'patients' ? 'Importer des patients' : 'Importer des rendez-vous';

  function handleDrag(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'text/csv' || droppedFile.name.endsWith('.csv')) {
        setFile(droppedFile);
        setResult(null);
      } else {
        toast.error('Veuillez sélectionner un fichier CSV');
      }
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
        setResult(null);
      } else {
        toast.error('Veuillez sélectionner un fichier CSV');
      }
    }
  }

  async function handleImport() {
    if (!file) return;

    setImporting(true);
    setResult(null);
    setProgress({ current: 0, total: 0 });

    try {
      const importResult = type === 'patients'
        ? await importPatientsFromCSV(file, (current, total) => setProgress({ current, total }))
        : await importAppointmentsFromCSV(file, (current, total) => setProgress({ current, total }));

      setResult(importResult);

      if (importResult.success > 0) {
        toast.success(`${importResult.success} ${type === 'patients' ? 'patient(s)' : 'rendez-vous'} importé(s) avec succès`);
        onSuccess();
      }

      if (importResult.errors.length > 0) {
        toast.error(`${importResult.errors.length} erreur(s) lors de l'import`);
      }
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de l\'import');
    } finally {
      setImporting(false);
    }
  }

  function handleDownloadTemplate() {
    downloadCSVTemplate(type);
    toast.success('Template téléchargé avec succès');
  }

  function handleClose() {
    if (!importing) {
      setFile(null);
      setResult(null);
      setProgress({ current: 0, total: 0 });
      onClose();
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-lifted"
      >
        <div className="sticky top-0 bg-white border-b border-neutral-200 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Upload className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-heading text-foreground">{title}</h3>
              <p className="text-sm text-foreground/60 mt-1">Format CSV requis</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={importing}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-blue-900 mb-2">Format du fichier CSV</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Le fichier doit être au format CSV (virgule comme séparateur)</li>
                  <li>• La première ligne doit contenir les en-têtes des colonnes</li>
                  <li>• Les colonnes requises: {type === 'patients' ? 'Prénom, Nom' : 'Nom, Email, Téléphone, Motif'}</li>
                  <li>• Les doublons (basés sur email ou nom complet) seront ignorés</li>
                </ul>
                <button
                  onClick={handleDownloadTemplate}
                  className="flex items-center gap-2 mt-3 text-sm text-blue-700 hover:text-blue-800 font-medium"
                >
                  <Download className="w-4 h-4" />
                  Télécharger un template d'exemple
                </button>
              </div>
            </div>
          </div>

          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
              dragActive
                ? 'border-gold-400 bg-gold-50'
                : file
                ? 'border-green-400 bg-green-50'
                : 'border-neutral-300 bg-neutral-50'
            }`}
          >
            {file ? (
              <div className="space-y-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <FileText className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{file.name}</p>
                  <p className="text-sm text-foreground/60 mt-1">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
                <button
                  onClick={() => setFile(null)}
                  disabled={importing}
                  className="text-sm text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
                >
                  Supprimer
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-12 h-12 bg-neutral-200 rounded-full flex items-center justify-center mx-auto">
                  <Upload className="w-6 h-6 text-neutral-600" />
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    Glissez-déposez votre fichier CSV ici
                  </p>
                  <p className="text-sm text-foreground/60 mt-1">ou</p>
                </div>
                <label className="inline-block">
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-gold-500 text-white rounded hover:bg-gold-600 transition-colors cursor-pointer">
                    Sélectionner un fichier
                  </span>
                </label>
              </div>
            )}
          </div>

          {importing && (
            <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <Loader className="w-5 h-5 text-gold-600 animate-spin" />
                <span className="font-medium text-foreground">Import en cours...</span>
              </div>
              {progress.total > 0 && (
                <>
                  <div className="w-full bg-neutral-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-gold-500 to-gold-600 transition-all duration-300"
                      style={{ width: `${(progress.current / progress.total) * 100}%` }}
                    />
                  </div>
                  <p className="text-sm text-foreground/60 mt-2 text-center">
                    {progress.current} / {progress.total} lignes traitées
                  </p>
                </>
              )}
            </div>
          )}

          {result && (
            <div className="space-y-3">
              {result.success > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-900">
                        {result.success} {type === 'patients' ? 'patient(s)' : 'rendez-vous'} importé(s) avec succès
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {result.duplicates > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-orange-900">
                        {result.duplicates} doublon(s) ignoré(s)
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {result.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-red-900 mb-2">
                        {result.errors.length} erreur(s) détectée(s)
                      </p>
                      <div className="max-h-40 overflow-y-auto space-y-2">
                        {result.errors.slice(0, 10).map((error, index) => (
                          <div key={index} className="text-sm text-red-800">
                            <span className="font-medium">Ligne {error.row}:</span> {error.error}
                          </div>
                        ))}
                        {result.errors.length > 10 && (
                          <p className="text-sm text-red-700 italic">
                            ... et {result.errors.length - 10} autres erreurs
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
            <button
              onClick={handleClose}
              disabled={importing}
              className="px-6 py-3 border border-neutral-300 text-foreground hover:bg-neutral-50 transition-all disabled:opacity-50"
            >
              {result ? 'Fermer' : 'Annuler'}
            </button>
            {!result && (
              <button
                onClick={handleImport}
                disabled={!file || importing}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-soft"
              >
                {importing ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>Import en cours...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Importer</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
