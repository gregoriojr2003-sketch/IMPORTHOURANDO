import React, { useState } from 'react';
import { Send, Plus, QrCode, CheckCircle2, ShieldAlert, Trash2, Zap, RefreshCw, Users, Smartphone, Key } from 'lucide-react';
import { WhatsAppChannel, AffiliateConfig } from '../types';

interface WhatsAppChannelsManagerProps {
  channels: WhatsAppChannel[];
  affiliateConfig?: AffiliateConfig;
  onAddChannel: (channel: Partial<WhatsAppChannel>) => void;
  onDeleteChannel: (channelId: string) => void;
  onOpenSettings: () => void;
  onRequirePlanActivation?: (actionName?: string) => boolean;
}

export const WhatsAppChannelsManager: React.FC<WhatsAppChannelsManagerProps> = ({
  channels,
  affiliateConfig,
  onAddChannel,
  onDeleteChannel,
  onOpenSettings,
  onRequirePlanActivation
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [channelName, setChannelName] = useState('');
  const [channelType, setChannelType] = useState<'CHANNEL' | 'GROUP' | 'BROADCAST'>('CHANNEL');
  const [phoneNumberOrJid, setPhoneNumberOrJid] = useState('');
  const [autoPost, setAutoPost] = useState(true);

  const [showQrModal, setShowQrModal] = useState(false);
  const [testSentChanId, setTestSentChanId] = useState<string | null>(null);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelName.trim()) return;

    onAddChannel({
      name: channelName,
      type: channelType,
      phoneNumberOrJid: phoneNumberOrJid || `120363${Date.now()}@newsletter`,
      autoPost
    });

    setChannelName('');
    setPhoneNumberOrJid('');
    setShowAddModal(false);
  };

  const handleSendTestMessage = (chanId: string) => {
    setTestSentChanId(chanId);
    setTimeout(() => setTestSentChanId(null), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Connect */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></span>
            <h2 className="text-xl font-bold text-white">Conexão do WhatsApp & Canais</h2>
          </div>
          <p className="text-xs text-slate-400">
            Gateway Ativo: <strong className="text-emerald-400">{affiliateConfig?.whatsappApiType || 'EVOLUTION_API'}</strong> ({affiliateConfig?.botName || 'ZapAffiliate Bot'})
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              if (onRequirePlanActivation && !onRequirePlanActivation('escanear QR Code e conectar o WhatsApp')) return;
              setShowQrModal(true);
            }}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium px-3.5 py-2 rounded-xl text-xs flex items-center space-x-2 transition-all"
          >
            <QrCode className="w-4 h-4 text-emerald-400" />
            <span>Escanear QR Code</span>
          </button>

          <button
            onClick={() => {
              if (onRequirePlanActivation && !onRequirePlanActivation('adicionar novos canais ou grupos do WhatsApp')) return;
              setShowAddModal(true);
            }}
            className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 shadow transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Canal / Grupo</span>
          </button>
        </div>
      </div>

      {/* Channels List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {channels.map((chan) => (
          <div
            key={chan.id}
            className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 space-y-4 transition-all shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center space-x-3 min-w-0">
                <div className={`p-2.5 rounded-xl font-bold text-slate-950 ${
                  chan.type === 'CHANNEL' ? 'bg-emerald-400' : 'bg-blue-400'
                }`}>
                  <Users className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-sm text-white truncate">{chan.name}</h3>
                  <p className="text-xs text-slate-400 truncate">
                    {chan.type === 'CHANNEL' ? 'Canal de Transmissão' : 'Grupo WhatsApp'} • {chan.membersCount.toLocaleString()} membros
                  </p>
                </div>
              </div>

              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                chan.status === 'CONNECTED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
              }`}>
                {chan.status === 'CONNECTED' ? 'Conectado' : 'Pendente'}
              </span>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>JID / Identificador:</span>
                <span className="font-mono text-slate-300 truncate max-w-[180px]">{chan.phoneNumberOrJid}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Postagem Automática:</span>
                <span className={`font-semibold ${chan.autoPost ? 'text-amber-300' : 'text-slate-500'}`}>
                  {chan.autoPost ? 'Ativada (Pelo Agendador)' : 'Apenas Manual'}
                </span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between text-xs border-t border-slate-800">
              <button
                onClick={() => handleSendTestMessage(chan.id)}
                className="text-slate-300 hover:text-white flex items-center space-x-1 font-medium"
              >
                <Send className="w-3.5 h-3.5 text-amber-400" />
                <span>{testSentChanId === chan.id ? '✅ Teste Enviado!' : 'Enviar Mensagem de Teste'}</span>
              </button>

              <button
                onClick={() => onDeleteChannel(chan.id)}
                className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                title="Remover Canal"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Channel Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md text-white p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-lg text-white">Cadastrar Canal ou Grupo do WhatsApp</h3>
            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Nome do Canal / Grupo</label>
                <input
                  type="text"
                  required
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  placeholder="Ex: Canal Promos VIP Mercado Livre"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Tipo de Destino</label>
                <select
                  value={channelType}
                  onChange={(e) => setChannelType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                >
                  <option value="CHANNEL">Canal do WhatsApp (Newsletter)</option>
                  <option value="GROUP">Grupo de WhatsApp</option>
                  <option value="BROADCAST">Lista de Transmissão</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">JID / Número / Link de Convite</label>
                <input
                  type="text"
                  value={phoneNumberOrJid}
                  onChange={(e) => setPhoneNumberOrJid(e.target.value)}
                  placeholder="Ex: 120363019283748291@newsletter ou chat.whatsapp.com/..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="autoPostCheck"
                  checked={autoPost}
                  onChange={(e) => setAutoPost(e.target.checked)}
                  className="rounded border-slate-700 text-amber-400 focus:ring-0 bg-slate-950"
                />
                <label htmlFor="autoPostCheck" className="text-slate-300 cursor-pointer">
                  Permitir disparo automático do Robô Agendador neste canal
                </label>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="w-1/2 bg-slate-800 hover:bg-slate-700 py-2.5 rounded-xl font-medium text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold py-2.5 rounded-xl"
                >
                  Salvar Canal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Modal Simulator */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm text-white p-6 space-y-4 text-center shadow-2xl">
            <h3 className="font-bold text-lg text-white">Conectar WhatsApp Web</h3>
            <p className="text-xs text-slate-400">
              Abra o WhatsApp no seu celular, vá em Dispositivos Conectados e escaneie o código abaixo:
            </p>

            <div className="bg-white p-4 rounded-xl inline-block mx-auto border-4 border-emerald-400 shadow-xl">
              <img
                src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=MeliOfertasWhatsAppGatewayConnected"
                alt="QR Code WhatsApp"
                className="w-48 h-48 mx-auto"
              />
            </div>

            <p className="text-[11px] text-emerald-400 font-semibold flex items-center justify-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Instância Conectada e Pronta para Disparar!</span>
            </p>

            <button
              onClick={() => setShowQrModal(false)}
              className="w-full bg-slate-800 hover:bg-slate-700 py-2.5 rounded-xl font-bold text-xs text-slate-200"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
