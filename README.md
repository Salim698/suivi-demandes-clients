# Suivi des demandes clients — Google Apps Script

Projet de démonstration : automatiser la prise en charge d'une demande de service avec Google Forms, Google Sheets, Gmail et Google Agenda, en Google Apps Script (JavaScript).

## Problème

Une entreprise de services reçoit des demandes de clients par formulaire. Sans automatisation, quelqu'un doit recopier les informations, confirmer chaque client, planifier le rendez-vous et penser à demander un avis après l'intervention.

## Ce que fait le projet

**V1 — Confirmation automatique** (`v1-confirmation/`)
- À chaque envoi du formulaire, le script valide le nom et le format du courriel.
- Il génère un numéro de suivi unique (`DEM-0001`…), envoie un courriel de confirmation et inscrit l'ID et le statut dans la feuille.
- Si les données sont invalides, le statut indique la raison (« À vérifier : courriel invalide »).
- En cas d'erreur du script, une alerte est envoyée par courriel.

**V2 — Agenda et demande d'avis** (`v2-agenda-avis/`)
- Crée l'événement de rendez-vous dans Google Agenda (durée d'une heure, adresse et téléphone dans les détails).
- Statut « Planifié » à la création ; l'équipe passe ensuite le statut à « Terminé » dans la feuille.
- Quand le statut passe à « Terminé », un courriel de demande d'avis est envoyé une seule fois (colonne « Avis envoyé » comme protection contre les doublons).

## Installation

1. Créer un Google Form avec : Nom, Courriel, Téléphone, Type de service, Adresse (V2 : Date du rendez-vous, Heure du rendez-vous).
2. Associer le formulaire à une feuille Google Sheets (onglet Réponses).
3. Ajouter les colonnes `ID demande`, `Statut` (liste déroulante : Nouveau, Planifié, Terminé, À vérifier) et, pour la V2, `Avis envoyé`.
4. Dans la feuille : Extensions > Apps Script, coller le contenu de `Code.gs`.
5. Créer les déclencheurs (horloge) :
   - `onFormSubmit` : source feuille de calcul, « Lors de l'envoi du formulaire »
   - V2 seulement, `onEditStatut` : source feuille de calcul, « Lors de la modification »
6. V2 : exécuter `autoriser` une fois, vérifier que le fuseau horaire du projet est correct, et remplacer `LIEN_AVIS` par un vrai lien d'avis.

## Choix techniques

- Les colonnes sont retrouvées par leur titre (`colIndex`), pas par leur position : on peut ajouter des colonnes sans casser le script.
- Les données sont lues directement dans la ligne de la feuille (`getValues` / `getDisplayValues`).
- Deux déclencheurs distincts pour deux événements : l'envoi du formulaire et la modification de la feuille.
- Chaque erreur est interceptée (`try/catch`) et signalée par courriel.

## Limites et pistes d'amélioration

- Le nombre de courriels par jour est limité par le quota de Google (voir `MailApp.getRemainingDailyQuota()`), et une exécution ne peut pas durer indéfiniment.
- Durée de rendez-vous fixe (1 heure), pas de vérification des conflits d'horaire dans l'agenda.
- Idées : rappel la veille du rendez-vous, rapport hebdomadaire, journal des exécutions dans une feuille dédiée, relance des demandes restées « Nouveau ».

## Auteur

Alidou Nombré — projet  de démonstration.
