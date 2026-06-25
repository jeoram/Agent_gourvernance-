/**
 * db_init.js - Initialisation de la base de données SQLite en mémoire (via AlaSQL)
 * Contient les données factices MGEN avec des anomalies de qualité délibérées.
 */

// Structure des données de base
const MOCK_ADHERENTS = [
    { id_adherent: 1001, nom: "Martin", prenom: "Sophie", email: "sophie.martin@mgen.fr", date_naissance: "1985-04-12", code_postal: "75015", date_inscription: "2020-01-15" },
    { id_adherent: 1002, nom: "Dupont", prenom: "Jean", email: "jean.dupont@gmail.com", date_naissance: "1972-11-23", code_postal: "92120", date_inscription: "2019-05-20" },
    { id_adherent: 1003, nom: "Lefebvre", prenom: "Marie", email: "marie.lefebvre@yahoo", date_naissance: "1990-08-30", code_postal: "59000", date_inscription: "2021-03-10" }, // Email invalide
    { id_adherent: 1004, nom: "Dubois", prenom: "Pierre", email: null, date_naissance: "1965-02-14", code_postal: "69002", date_inscription: "2018-11-01" }, // Email NULL
    { id_adherent: 1005, nom: "Moreau", prenom: "Thomas", email: "tmoreau@mgen.fr", date_naissance: "2030-05-12", code_postal: "44000", date_inscription: "2022-09-18" }, // Date naissance dans le futur (Anomalie)
    { id_adherent: 1006, nom: "Petit", prenom: "Lucas", email: "lucas.petit@gmail.com", date_naissance: "1998-12-05", code_postal: "1300", date_inscription: "2023-01-10" }, // Code postal incomplet (4 chiffres)
    { id_adherent: 1007, nom: "Rousseau", prenom: "Chloé", email: "chloe.rousseau@mgen.fr", date_naissance: "1992-07-22", code_postal: "33000", date_inscription: "2021-06-25" },
    { id_adherent: 1007, nom: "Rousseau", prenom: "Chloé", email: "chloe.rousseau@mgen.fr", date_naissance: "1992-07-22", code_postal: "33000", date_inscription: "2021-06-25" }, // Doublon parfait
    { id_adherent: 1008, nom: "Bernard", prenom: "Michel", email: "michel.bernard@orange.fr", date_naissance: "1950-10-10", code_postal: "99999", date_inscription: "2015-04-12" } // Code postal inexistant
];

const MOCK_REMBOURSEMENTS = [
    { id_remboursement: 50001, id_adherent: 1001, type_acte: "Consultation", montant_total: 25.00, montant_rembourse: 25.00, statut_traitement: "Traite", date_remboursement: "2026-06-01" },
    { id_remboursement: 50002, id_adherent: 1002, type_acte: "Optique", montant_total: 350.00, montant_rembourse: 280.00, statut_traitement: "Traite", date_remboursement: "2026-06-02" },
    { id_remboursement: 50003, id_adherent: 1003, type_acte: "Dentaire", montant_total: 120.00, montant_rembourse: 150.00, statut_traitement: "Traite", date_remboursement: "2026-06-03" }, // Remboursement > Total (Anomalie)
    { id_remboursement: 50004, id_adherent: 1004, type_acte: "Pharmacie", montant_total: 45.50, montant_rembourse: -10.00, statut_traitement: "Traite", date_remboursement: "2026-06-04" }, // Montant négatif
    { id_remboursement: 50005, id_adherent: 9999, type_acte: "Consultation", montant_total: 60.00, montant_rembourse: 42.00, statut_traitement: "Traite", date_remboursement: "2026-06-05" }, // id_adherent inexistant (Viol FK)
    { id_remboursement: 50006, id_adherent: 1006, type_acte: "Optique", montant_total: 200.00, montant_rembourse: 140.00, statut_traitement: "Traite", date_remboursement: "2026-06-06" },
    { id_remboursement: 50007, id_adherent: 1007, type_acte: "Dentaire", montant_total: 450.00, montant_rembourse: null, statut_traitement: "En attente", date_remboursement: null }
];

const MOCK_PREDICTIONS_IA = [
    { id_prediction: 90001, id_remboursement: 50001, score_anomalie: 0.02, decision_ia: "Valide", confiance_modele: 0.98, date_prediction: "2026-06-01" },
    { id_prediction: 90002, id_remboursement: 50002, score_anomalie: 0.15, decision_ia: "Valide", confiance_modele: 0.85, date_prediction: "2026-06-02" },
    { id_prediction: 90003, id_remboursement: 50003, score_anomalie: 0.94, decision_ia: "Alerte", confiance_modele: 0.94, date_prediction: "2026-06-03" }, // Détecté correctement
    { id_prediction: 90004, id_remboursement: 50004, score_anomalie: 1.50, decision_ia: "Alerte", confiance_modele: 1.20, date_prediction: "2026-06-04" }, // Score > 1 et Confiance > 1 (Anomalie)
    { id_prediction: 90005, id_remboursement: 50005, score_anomalie: -0.10, decision_ia: "Valide", confiance_modele: 0.70, date_prediction: "2026-06-05" }, // Score négatif
    { id_prediction: 90006, id_remboursement: 50006, score_anomalie: null, decision_ia: "Inconnu", confiance_modele: null, date_prediction: "2026-06-06" } // Sortie NULL
];

// Initialisation de la base
function initDatabase() {
    try {
        try { alasql('DROP TABLE IF EXISTS adherents'); } catch(e){}
        try { alasql('DROP TABLE IF EXISTS remboursements'); } catch(e){}
        try { alasql('DROP TABLE IF EXISTS predictions_ia'); } catch(e){}

        alasql('CREATE TABLE adherents (id_adherent INT, nom STRING, prenom STRING, email STRING, date_naissance STRING, code_postal STRING, date_inscription STRING)');
        alasql('CREATE TABLE remboursements (id_remboursement INT, id_adherent INT, type_acte STRING, montant_total DOUBLE, montant_rembourse DOUBLE, statut_traitement STRING, date_remboursement STRING)');
        alasql('CREATE TABLE predictions_ia (id_prediction INT, id_remboursement INT, score_anomalie DOUBLE, decision_ia STRING, confiance_modele DOUBLE, date_prediction STRING)');

        MOCK_ADHERENTS.forEach(row => {
            alasql('INSERT INTO adherents VALUES (?,?,?,?,?,?,?)', [row.id_adherent, row.nom, row.prenom, row.email, row.date_naissance, row.code_postal, row.date_inscription]);
        });

        MOCK_REMBOURSEMENTS.forEach(row => {
            alasql('INSERT INTO remboursements VALUES (?,?,?,?,?,?,?)', [row.id_remboursement, row.id_adherent, row.type_acte, row.montant_total, row.montant_rembourse, row.statut_traitement, row.date_remboursement]);
        });

        MOCK_PREDICTIONS_IA.forEach(row => {
            alasql('INSERT INTO predictions_ia VALUES (?,?,?,?,?,?)', [row.id_prediction, row.id_remboursement, row.score_anomalie, row.decision_ia, row.confiance_modele, row.date_prediction]);
        });

        console.log("Base de données initialisée !");
        return true;
    } catch (error) {
        console.error("Erreur AlaSQL :", error);
        return false;
    }
}
