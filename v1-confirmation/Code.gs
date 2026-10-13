/**
 * V1 - Confirmation automatique d'une demande client
 * Déclencheur : « Lors de l'envoi du formulaire » (feuille liée au formulaire)
 * Colonnes attendues : Nom, Courriel, Type de service, ID demande, Statut
 */

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
  const values = sheet.getRange(row, 1, 1, n).getValues()[0];
  const d = {};
  headers.forEach((h, i) => { d[String(h).trim()] = values[i]; });
  return d;
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

    const id = 'DEM-' + Utilities.formatString('%04d', row - 1);
    MailApp.sendEmail({
      to: courriel,
      subject: 'Votre demande ' + id + ' est bien reçue',
      body: 'Bonjour ' + nom + ',\n\nNous avons bien reçu votre demande (' + service +
            ').\nNuméro de suivi : ' + id + '\nNous vous contacterons très bientôt.\n\nL\'équipe'
    });

    sheet.getRange(row, colIndex(sheet, 'ID demande')).setValue(id);
    sheet.getRange(row, colIndex(sheet, 'Statut')).setValue('Nouveau');
  } catch (err) {
    MailApp.sendEmail(Session.getEffectiveUser().getEmail(), 'Erreur automatisation', err.message);
  }
}
