import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Download, 
  Upload, 
  Database, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  ShieldCheck, 
  RefreshCw, 
  Layers, 
  Clock, 
  Store, 
  Send, 
  Radio, 
  Zap,
  HardDrive,
  History,
  Trash2,
  Calendar,
  FileJson
} from 'lucide-react';
import { 
  AffiliateConfig, 
  WhatsAppChannel, 
  OfferPostTemplate, 
  DispatchedOffer, 
  AutoSchedulerConfig, 
  MercadoLivreProduct, 
  PriceAlertRule, 
  MLMonitorConfig,
  Subscriber
} from '../types';
import { 
  AppBackupData, 
  createBackupObject, 
  downloadBackupFile, 
  validateBackupJson, 
  applyBackupToLocalStorage,
  getRestoreHistory,
  clearRestoreHistory,
  RestoreHistoryItem
} from '../utils/backupUtils';

interface BackupManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  affiliateConfig: AffiliateConfig;
  channels: WhatsAppChannel[];
  templates: OfferPostTemplate[];
  dispatchedLogs: DispatchedOffer[];
  schedulerConfig: AutoSchedulerConfig;
  mlMonitorConfig: MLMonitorConfig;
  products: MercadoLivreProduct[];
  priceAlerts: PriceAlertRule[];
  subscribers?: Subscriber[];
  onRestoreBackup: (backup: AppBackupData, mode: 'REPLACE' | 'MERGE') => void;
}

export const BackupManagerModal: React.FC<BackupManagerModalProps> = ({
  isOpen,
  onClose,
  affiliateConfig,
  channels,
  templates,
  dispatchedLogs,
  schedulerConfig,
  mlMonitorConfig,
  products,
  priceAlerts,
  subscribers,
  onRestoreBackup
}) => {
  const [activeTab, setActiveTab] = useState<'EXPORT' | 'IMPORT' | 'HISTORY'>('EXPORT');
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Import State
  const [importedFile, setImportedFile] = useState<File | null>(null);
  const [parsedBackup, setParsedBackup] = useState<AppBackupData | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [restoreMode, setRestoreMode] = useState<'REPLACE' | 'MERGE'>('REPLACE');
  const [restoreSuccess, setRestoreSuccess] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  // Restore History State
  const [restoreHistory, setRestoreHistory] = useState<RestoreHistoryItem[]>([]);

  useEffect(() => {
    if (isOpen) {
      setRestoreHistory(getRestoreHistory());
    }
  }, [isOpen]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleExportBackup = () => {
    setIsExporting(true);
    setDownloadSuccess(false);

    setTimeout(() => {
      const backupObj = createBackupObject({
        affiliateConfig,
        channels,
        templates,
        dispatchedLogs,
        schedulerConfig,
        mlMonitorConfig,
        products,
        priceAlerts,
        subscribers
      });

      downloadBackupFile(backupObj);
      setIsExporting(false);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    }, 500);
  };

  const handleFileSelect = (file: File) => {
    setImportError(null);
    setParsedBackup(null);
    setRestoreSuccess(false);

    if (!file.name.endsWith('.json')) {
      setImportError('Por favor selecione um arquivo de backup válido no formato .json.');
      return;
    }

    setImportedFile(file);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const jsonObj = JSON.parse(text);
        const { isValid, error, backup } = validateBackupJson(jsonObj);

        if (!isValid || !backup) {
          setImportError(error || 'O arquivo selecionado não contém uma estrutura de backup válida.');
          setParsedBackup(null);
        } else {
          setParsedBackup(backup);
        }
      } catch (err: any) {
        setImportError('Erro ao ler o arquivo JSON: ' + (err.message || 'Formato inválido'));
        setParsedBackup(null);
      }
    };

    reader.onerror = () => {
      setImportError('Não foi possível ler o arquivo selecionado.');
    };

    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleConfirmRestore = () => {
    if (!parsedBackup) return;

    setIsRestoring(true);
    setTimeout(() => {
      applyBackupToLocalStorage(parsedBackup, restoreMode, importedFile?.name || 'backup.json');
      onRestoreBackup(parsedBackup, restoreMode);
      setRestoreHistory(getRestoreHistory());
      setIsRestoring(false);
      setRestoreSuccess(true);

      setTimeout(() => {
        setRestoreSuccess(false);
        setImportedFile(null);
        setParsedBackup(null);
        onClose();
      }, 1800);
    }, 600);
  };

  const handleClearHistory = () => {
    clearRestoreHistory();
    setRestoreHistory([]);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl text-slate-900 shadow-2xl overflow-hidden my-8 animate-fade-in">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-[#2D3277] border border-indigo-100">
              <Database className="w-6 h-6 text-[#2D3277]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-slate-900 text-lg">Backup & Restauração de Dados</h3>
                <span className="bg-[#FFE600] text-[#2D3277] text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                  JSON Local
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Guarde uma cópia de segurança das suas contas, templates, agendamentos e tags de afiliados.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 bg-slate-100/80 p-1.5 gap-1 text-sm font-semibold">
          <button
            onClick={() => setActiveTab('EXPORT')}
            className={`flex-1 py-2.5 px-3 rounded-xl flex items-center justify-center space-x-2 transition-all ${
              activeTab === 'EXPORT'
                ? 'bg-white text-[#2D3277] shadow border border-slate-200/80 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Download className="w-4 h-4 text-[#3483FA]" />
            <span>Exportar</span>
          </button>

          <button
            onClick={() => setActiveTab('IMPORT')}
            className={`flex-1 py-2.5 px-3 rounded-xl flex items-center justify-center space-x-2 transition-all ${
              activeTab === 'IMPORT'
                ? 'bg-white text-[#2D3277] shadow border border-slate-200/80 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Upload className="w-4 h-4 text-emerald-600" />
            <span>Restaurar</span>
          </button>

          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`flex-1 py-2.5 px-3 rounded-xl flex items-center justify-center space-x-2 transition-all relative ${
              activeTab === 'HISTORY'
                ? 'bg-white text-[#2D3277] shadow border border-slate-200/80 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <History className="w-4 h-4 text-purple-600" />
            <span>Histórico</span>
            {restoreHistory.length > 0 && (
              <span className="bg-purple-100 text-purple-800 text-[10px] font-black px-1.5 py-0.5 rounded-full border border-purple-200">
                {restoreHistory.length}
              </span>
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {activeTab === 'EXPORT' && (
            <div className="space-y-5">
              <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4 space-y-3">
                <div className="flex items-start space-x-3">
                  <ShieldCheck className="w-5 h-5 text-[#2D3277] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-[#2D3277] text-sm">O que será incluído no seu arquivo de backup?</h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      O arquivo gerado contém todas as suas preferências do sistema e pode ser usado para restaurar suas configurações a qualquer momento caso o cache ou <code>localStorage</code> do navegador seja limpo.
                    </p>
                  </div>
                </div>

                {/* Items Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 text-xs font-medium text-slate-700 font-mono">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center space-x-2">
                    <Store className="w-4 h-4 text-amber-500 shrink-0" />
                    <span className="truncate">Tags de Afiliado</span>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center space-x-2">
                    <Radio className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="truncate">{channels.length} Canais WhatsApp</span>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                    <span className="truncate">{templates.length} Templates</span>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-purple-500 shrink-0" />
                    <span className="truncate">Agendamentos Robô</span>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-yellow-500 shrink-0" />
                    <span className="truncate">{priceAlerts.length} Regras Alerta</span>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center space-x-2">
                    <Send className="w-4 h-4 text-indigo-500 shrink-0" />
                    <span className="truncate">{dispatchedLogs.length} Logs Disparo</span>
                  </div>
                </div>
              </div>

              {/* Status or Success Notification */}
              {downloadSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center space-x-3 text-xs font-semibold animate-fade-in">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <p className="font-bold">Arquivo de Backup baixado com sucesso!</p>
                    <p className="text-[11px] font-normal text-emerald-700">
                      O arquivo .json foi salvo na pasta de downloads do seu dispositivo.
                    </p>
                  </div>
                </div>
              )}

              {/* Action Button */}
              <button
                onClick={handleExportBackup}
                disabled={isExporting}
                className="w-full bg-[#2D3277] hover:bg-[#3D438F] text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center space-x-2 shadow-md hover:shadow-lg disabled:opacity-60 text-sm"
              >
                {isExporting ? (
                  <>
                    <RefreshCw className="w-5 h-5 text-[#FFE600] animate-spin" />
                    <span>Gerando Arquivo JSON de Backup...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5 text-[#FFE600]" />
                    <span>Baixar Cópia de Segurança do Sistema (.json)</span>
                  </>
                )}
              </button>
            </div>
          )}

          {activeTab === 'IMPORT' && (
            <div className="space-y-5">
              {/* File Dropzone */}
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                  importedFile
                    ? 'border-emerald-500 bg-emerald-50/30'
                    : 'border-slate-300 hover:border-indigo-500 bg-slate-50 hover:bg-slate-100/80'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelect(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />

                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className={`p-3 rounded-full ${importedFile ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-[#2D3277]'}`}>
                    <Upload className="w-6 h-6" />
                  </div>

                  {importedFile ? (
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{importedFile.name}</p>
                      <p className="text-xs text-slate-500">
                        {(importedFile.size / 1024).toFixed(1)} KB • Clique para trocar de arquivo
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="font-bold text-slate-800 text-sm">
                        Clique aqui ou arraste o arquivo .json de backup
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Formatos aceitos: <code>importhourando_backup_*.json</code>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Error Message */}
              {importError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-xl flex items-center space-x-2.5 text-xs font-medium">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{importError}</span>
                </div>
              )}

              {/* Parsed Backup Summary Preview */}
              {parsedBackup && (
                <div className="bg-slate-900 text-slate-100 border border-slate-800 rounded-2xl p-4 space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      Backup Válido Detectado
                    </span>
                    <span className="text-slate-400 text-[10px]">
                      {parsedBackup.exportDate || 'Data N/D'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                    <div>
                      • Canais WhatsApp:{' '}
                      <strong className="text-white">{parsedBackup.channels?.length || 0}</strong>
                    </div>
                    <div>
                      • Templates de Oferta:{' '}
                      <strong className="text-white">{parsedBackup.templates?.length || 0}</strong>
                    </div>
                    <div>
                      • Regras Alerta Preço:{' '}
                      <strong className="text-white">{parsedBackup.priceAlerts?.length || 0}</strong>
                    </div>
                    <div>
                      • Logs de Disparos:{' '}
                      <strong className="text-white">{parsedBackup.dispatchedLogs?.length || 0}</strong>
                    </div>
                    <div>
                      • Tag ML Principal:{' '}
                      <strong className="text-amber-300">
                        {parsedBackup.affiliateConfig?.affiliateTag || 'N/D'}
                      </strong>
                    </div>
                    <div>
                      • Marca Configurada:{' '}
                      <strong className="text-indigo-300">
                        {parsedBackup.affiliateConfig?.brandVoice?.brandName || 'N/D'}
                      </strong>
                    </div>
                  </div>

                  {/* Restore Mode Options */}
                  <div className="pt-2 border-t border-slate-800 font-sans space-y-2">
                    <label className="block font-bold text-slate-300 text-xs">Modo de Restauração:</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setRestoreMode('REPLACE')}
                        className={`p-2.5 rounded-xl text-left border transition-all text-xs ${
                          restoreMode === 'REPLACE'
                            ? 'bg-indigo-950 border-indigo-500 text-white font-bold'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span className="block font-semibold">Substituir Atual (Recomendado)</span>
                        <span className="text-[10px] opacity-80 block font-normal">
                          Sobrescreve configurações locais com os dados do backup.
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRestoreMode('MERGE')}
                        className={`p-2.5 rounded-xl text-left border transition-all text-xs ${
                          restoreMode === 'MERGE'
                            ? 'bg-indigo-950 border-indigo-500 text-white font-bold'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span className="block font-semibold">Mesclar com Dados Atuais</span>
                        <span className="text-[10px] opacity-80 block font-normal">
                          Combina canais e templates sem deletar os existentes.
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Restore Success Banner */}
              {restoreSuccess && (
                <div className="bg-emerald-500 text-white p-4 rounded-xl flex items-center space-x-3 text-xs font-bold animate-fade-in shadow-lg">
                  <CheckCircle2 className="w-6 h-6 shrink-0" />
                  <div>
                    <p className="text-sm">Configurações Restauradas com Sucesso!</p>
                    <p className="font-normal text-[11px] opacity-90">
                      O sistema e a persistência local foram atualizados.
                    </p>
                  </div>
                </div>
              )}

              {/* Confirm Import Button */}
              {parsedBackup && (
                <button
                  onClick={handleConfirmRestore}
                  disabled={isRestoring || restoreSuccess}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center space-x-2 shadow-md disabled:opacity-60 text-sm"
                >
                  {isRestoring ? (
                    <>
                      <RefreshCw className="w-5 h-5 text-white animate-spin" />
                      <span>Restaurando Configurações...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-white" />
                      <span>Confirmar e Restaurar Backup ({restoreMode === 'REPLACE' ? 'Substituir' : 'Mesclar'})</span>
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {activeTab === 'HISTORY' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                <div>
                  <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                    <History className="w-4 h-4 text-purple-600" />
                    Histórico de Restauração de Backups
                  </h4>
                  <p className="text-xs text-slate-500">
                    Acompanhe quando suas configurações foram alteradas a partir de um arquivo de backup externo.
                  </p>
                </div>
                {restoreHistory.length > 0 && (
                  <button
                    onClick={handleClearHistory}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg border border-rose-200 transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Limpar Histórico
                  </button>
                )}
              </div>

              {restoreHistory.length === 0 ? (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 text-slate-400 flex items-center justify-center mx-auto">
                    <History className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-700 text-sm">Nenhuma restauração realizada recentemente</p>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                      Quando você restaurar um arquivo <code>.json</code> de backup, os detalhes da operação (data, hora e modo) serão registrados aqui.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                  {restoreHistory.map((item) => (
                    <div
                      key={item.id}
                      className="bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-2xl p-4 transition-all space-y-2.5 shadow-xs"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="space-y-1 overflow-hidden">
                          <div className="flex items-center gap-2">
                            <FileJson className="w-4 h-4 text-indigo-600 shrink-0" />
                            <span className="font-bold text-slate-900 text-xs truncate" title={item.fileName}>
                              {item.fileName}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 font-mono">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              Restaurado em: <strong className="text-slate-800">{item.timestamp}</strong>
                            </span>
                            {item.exportDate && (
                              <span className="text-slate-400">
                                • Criado em: {item.exportDate}
                              </span>
                            )}
                          </div>
                        </div>

                        <span
                          className={`self-start sm:self-auto px-2.5 py-1 rounded-full text-[10px] font-black uppercase shrink-0 border ${
                            item.restoreMode === 'REPLACE'
                              ? 'bg-indigo-100 text-indigo-900 border-indigo-300'
                              : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                          }`}
                        >
                          Modo: {item.restoreMode === 'REPLACE' ? 'Substituir (REPLACE)' : 'Mesclar (MERGE)'}
                        </span>
                      </div>

                      {/* Items details breakdown */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono bg-white p-2.5 rounded-xl border border-slate-200/80">
                        <div className="text-slate-600">
                          Canais: <strong className="text-slate-900 font-extrabold">{item.channelsCount}</strong>
                        </div>
                        <div className="text-slate-600">
                          Templates: <strong className="text-slate-900 font-extrabold">{item.templatesCount}</strong>
                        </div>
                        <div className="text-slate-600">
                          Alertas: <strong className="text-slate-900 font-extrabold">{item.alertsCount}</strong>
                        </div>
                        <div className="text-slate-600">
                          Disparos: <strong className="text-slate-900 font-extrabold">{item.dispatchesCount}</strong>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between font-mono">
          <span>Formato: JSON Seguro (100% Client-Side)</span>
          <span>IMPORTHOURANDO v1.0</span>
        </div>
      </div>
    </div>
  );
};
