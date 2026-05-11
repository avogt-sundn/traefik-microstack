import type { Firma, Carnet, Prüfung, TimelineEvent, OffenerVorgang } from '../types';

export const firmen: Firma[] = [
  { id: 'f1', name: 'Günther Maschinenbau AG', kammer: 'Aachen', ansprechpartner: 'R. Günther', telefon: '+49 241 8800-0' },
  { id: 'f2', name: 'Müller Werkzeugbau GmbH', kammer: 'Aachen', ansprechpartner: 'S. Müller', telefon: '+49 241 9900-1' },
  { id: 'f3', name: 'Becker Präzisionstechnik GmbH', kammer: 'München', ansprechpartner: 'H. Becker', telefon: '+49 89 2100-5' },
  { id: 'f4', name: 'Schmidt & Söhne Logistik KG', kammer: 'München', ansprechpartner: 'W. Schmidt', telefon: '+49 89 3300-2' },
];

export const carnets: Carnet[] = [
  { id: 'c1', nummer: '#2024-00456', inhaberId: 'f1', limit: 45000, status: 'aktiv' },
  { id: 'c2', nummer: '#2024-00789', inhaberId: 'f2', limit: 20000, status: 'aktiv' },
  { id: 'c3', nummer: '#2024-01001', inhaberId: 'f4', limit: 80000, status: 'gesperrt' },
];

export const prüfungen: Prüfung[] = [
  { id: 'p1', nummer: '#2024-P-012', firmaId: 'f3', termin: '2024-06-15', status: 'Genehmigung ausstehend' },
  { id: 'p2', nummer: '#2024-P-019', firmaId: 'f1', termin: '2024-07-03', status: 'bestätigt' },
];

export const synonyms: Record<string, string[]> = {
  anrufen: ['telefon', 'phone', 'call', 'kontakt'],
  email: ['mail', 'schreiben', 'nachricht'],
  stornieren: ['löschen', 'cancel', 'delete'],
  verschieben: ['übertragen', 'transfer'],
  bearbeiten: ['editieren', 'ändern', 'update', 'edit'],
  genehmigen: ['freigeben', 'bestätigen', 'approve'],
  limit: ['kreditlimit', 'betrag'],
};

export const multiWordActions: Record<string, string> = {
  'inhaber wechseln': 'verschieben',
  'adresse bearbeiten': 'bearbeiten',
  'termin verschieben': 'termin',
};

export const users = [
  { name: 'Katrin', rolle: 'Sachbearbeiter', kammern: ['Aachen', 'München'] },
  { name: 'Thomas', rolle: 'Sachbearbeiter', kammern: ['Aachen'] },
];

export const initialTimelineEvents: TimelineEvent[] = [
  {
    id: 'te-1', date: '05.05.2026', timestamp: '09:14', user: 'Katrin',
    entityType: 'carnet', entityId: 'c1', action: 'Limit geändert',
    details: '35.000 → 45.000 €', commandTokens: 'günther carnet limit 45000', source: 'own',
  },
  {
    id: 'te-2', date: '05.05.2026', timestamp: '09:31', user: 'System',
    entityType: 'carnet', entityId: 'c2', action: 'Import: Limit adjustiert (Nachtlauf)',
    details: '', commandTokens: '', source: 'system',
  },
  {
    id: 'te-3', date: '06.05.2026', timestamp: '10:02', user: 'Thomas',
    entityType: 'firma', entityId: 'f3', action: 'Adresse aktualisiert',
    details: 'Hauptstr. 14 → Nr. 16', commandTokens: 'becker adresse', source: 'colleague',
  },
  {
    id: 'te-4', date: '06.05.2026', timestamp: '10:45', user: 'Katrin',
    entityType: 'prüfung', entityId: 'p1', action: 'Genehmigt',
    details: '', commandTokens: 'prüfung p-012 genehmigen', source: 'own',
  },
];

export const offeneVorgänge: OffenerVorgang[] = [
  { id: 'ov-1', entityType: 'firma', entityId: 'f3', title: 'Limit prüfen', clerk: 'Katrin' },
  { id: 'ov-2', entityType: 'prüfung', entityId: 'p1', title: 'Genehmigung offen', clerk: 'Katrin' },
];
