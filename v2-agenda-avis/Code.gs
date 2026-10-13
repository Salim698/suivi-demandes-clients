/**
 * V2 - Rendez-vous dans Google Agenda + demande d'avis
 * Déclencheurs :
 *   onFormSubmit  -> « Lors de l'envoi du formulaire »
 *   onEditStatut  -> « Lors de la modification »
 * Colonnes attendues : Nom, Courriel, Téléphone, Type de service, Adresse,
 *   Date du rendez-vous, Heure du rendez-vous, ID demande, Statut, Avis envoyé
 */

const LIEN_AVIS = 'https://g.page/r/VOTRE_LIEN/review'; // à remplacer par un vrai lien d'avis

function colIndex(sheet, header) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
    .map(h => String(h).trim());
  const i = headers.indexOf(header);
  if (i === -1) throw new Error('Colonne introuvable : ' + header);
  return i + 1;
}

function lireLigne(sheet, row) {
  const n = sheet.getLastColumn();
  const headers = sheet.getRange(1, 1, 1, n).getValues()[0];
  const values = sheet.getRange(row, 1, 1, n).getDisplayValues()[0];
  const d = {};
  headers.forEach((h, i) => { d[String(h).trim()] = values[i]; });
  return d;
}

// Convertit « 14/10/2026 » + « 14:30 » en date. Retourne null si le format est invalide.
function creerDate(dateTxt, heureTxt) {
  const d = String(dateTxt).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  const h = String(heureTxt).match(/^(\d{1,2}):(\d{2})/);
  if (!d || !h) return null;
  return new Date(+d[3], +d[2] - 1, +d[1], +h[1], +h[2]);
}

function alerter(err) {
  MailApp.sendEmail(Session.getEffectiveUser().getEmail(), 'Erreur automatisation', err.message);
}

function onFormSubmit(e) {
  const sheet = e.range.getSheet();
  const row = e.range.getRow();
  try {
    const d = lireLigne(sheet, row);
    const nom = String(d['Nom'] || '').trim();
    const courriel = String(d['Courriel'] || '').trim();
    const service = String(d['Type de service'] || '');

    const emailValide = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(courriel);
    if (!nom || !emailValide) {
      const raison = !nom ? 'nom manquant' : 'courriel invalide';
      sheet.getRange(row, colIndex(sheet, 'Statut')).setValue('À vérifier : ' + raison);
      return;
    }

    const debut = creerDate(d['Date du rendez-vous'], d['Heure du rendez-vous']);
    if (!debut) {
      sheet.getRange(row, colIndex(sheet, 'Statut')).setValue('À vérifier : date ou heure invalide');
      return;
    }

    const id = 'DEM-' + Utilities.formatString('%04d', row - 1);
    const fin = new Date(debut.getTime() + 60 * 60 * 1000); // durée : 1 heure
    CalendarApp.getDefaultCalendar().createEvent(
      'Intervention ' + service + ' - ' + nom, debut, fin,
      { description: 'Demande ' + id + '\nTél : ' + d['Téléphone'], location: String(d['Adresse'] || '') });

    MailApp.sendEmail({
      to: courriel,
      subject: 'Votre demande ' + id + ' est bien reçue',
      body: 'Bonjour ' + nom + ',\n\nNous avons bien reçu votre demande (' + service + ').' +
            '\nRendez-vous prévu le ' + d['Date du rendez-vous'] + ' à ' + d['Heure du rendez-vous'] +
            '.\nNuméro de suivi : ' + id + '\n\nL\'équipe'
    });

    sheet.getRange(row, colIndex(sheet, 'ID demande')).setValue(id);
    sheet.getRange(row, colIndex(sheet, 'Statut')).setValue('Planifié');
  } catch (err) {
    alerter(err);
  }
}

// Quand le statut passe à « Terminé », envoie une demande d'avis (une seule fois par ligne)
function onEditStatut(e) {
  try {
    const sheet = e.range.getSheet();
    const row = e.range.getRow();
    if (row < 2 || e.range.getColumn() !== colIndex(sheet, 'Statut')) return;
    if (String(e.value) !== 'Terminé') return;

    const colAvis = colIndex(sheet, 'Avis envoyé');
    if (sheet.getRange(row, colAvis).getValue()) return; // déjà envoyé : pas de doublon

    const d = lireLigne(sheet, row);
    MailApp.sendEmail({
      to: d['Courriel'],
      subject: 'Votre avis nous intéresse',
      body: 'Bonjour ' + d['Nom'] + ',\n\nMerci de nous avoir fait confiance. ' +
            'Pourriez-vous prendre une minute pour laisser un avis ?\n' + LIEN_AVIS + '\n\nL\'équipe'
    });
    sheet.getRange(row, colAvis).setValue(new Date());
  } catch (err) {
    alerter(err);
  }
}

// À exécuter une fois : autorise Agenda et Gmail, affiche le quota d'e-mails restant
function autoriser() {
  CalendarApp.getDefaultCalendar();
  Logger.log('E-mails restants aujourd\'hui : ' + MailApp.getRemainingDailyQuota());
}
