import { DispatchedOffer } from '../types';

/**
 * Export Dispatched Offers History to a formatted CSV file and trigger download.
 */
export function exportDispatchesToCSV(logs: DispatchedOffer[]): void {
  if (!logs || logs.length === 0) {
    alert('Não há registros no histórico para exportar.');
    return;
  }

  const headers = [
    'ID do Disparo',
    'Data e Hora',
    'Nome do Produto',
    'Marketplace',
    'Preco Promocional (R$)',
    'Preco De (R$)',
    'Canal / Grupo WhatsApp',
    'Comissao Estimada (R$)',
    'Cliques Registrados',
    'Link de Afiliado Rastreavel',
    'Copy Enviada (Texto)'
  ];

  const escapeCSV = (value: string | number | undefined | null): string => {
    if (value === null || value === undefined) return '""';
    const stringified = String(value).replace(/"/g, '""');
    return `"${stringified}"`;
  };

  const rows = logs.map(log => [
    escapeCSV(log.id),
    escapeCSV(log.sentAt),
    escapeCSV(log.productTitle),
    escapeCSV(log.marketplace || 'Mercado Livre'),
    escapeCSV(log.price.toFixed(2).replace('.', ',')),
    escapeCSV(log.originalPrice ? log.originalPrice.toFixed(2).replace('.', ',') : ''),
    escapeCSV(log.channelName),
    escapeCSV(log.estimatedComission ? log.estimatedComission.toFixed(2).replace('.', ',') : '0,00'),
    escapeCSV(log.clicksCount || 0),
    escapeCSV(log.affiliateUrl),
    escapeCSV(log.messageText ? log.messageText.replace(/\n/g, ' ') : '')
  ]);

  // UTF-8 BOM for proper accents opening in Excel
  const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', url);
  downloadAnchor.setAttribute('download', `historico_disparos_importhourando_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  document.body.removeChild(downloadAnchor);
  URL.revokeObjectURL(url);
}
