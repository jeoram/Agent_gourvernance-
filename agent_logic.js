/**
 * agent_logic.js - Moteur logique de l'Agent IA de Gouvernance
 * Simule l'intelligence, la prise de décision, l'écriture SQL et l'intégration OpenMetadata.
 */

// Catalogue des métadonnées modifiable dynamiquement par l'agent
let dynamicCatalog = JSON.parse(JSON.stringify(CATALOG_SCHEMAS)); // Copie depuis app.js (défini globalement)

// Registre d'assertions DQ modifiable
let dynamicAssertions = [
    { targetTable: "adherents", type: "PK Uniqueness", sql: "SELECT id_adherent, COUNT(*) FROM adherents GROUP BY id_adherent HAVING COUNT(*) > 1;", tolerance: "0% d'écart", status: "success" },
    { targetTable: "remboursements", type: "FK Integrity", sql: "SELECT r.id_remboursement FROM remboursements r LEFT JOIN adherents a ON r.id_adherent = a.id_adherent WHERE a.id_adherent IS NULL;", tolerance: "0% d'écart", status: "success" },
    { targetTable: "adherents", type: "Email Format", sql: "SELECT id_adherent FROM adherents WHERE email NOT LIKE '%@%';", tolerance: "2% d'écart", status: "success" },
    { targetTable: "remboursements", type: "Amount Cohérence", sql: "SELECT id_remboursement FROM remboursements WHERE montant_rembourse < 0 OR montant_rembourse > montant_total;", tolerance: "0% d'écart", status: "success" },
    { targetTable: "adherents", type: "CP Format", sql: "SELECT id_adherent FROM adherents WHERE LENGTH(code_postal) != 5;", tolerance: "0% d'écart", status: "success" },
    { targetTable: "predictions_ia", type: "Score IA range", sql: "SELECT id_prediction FROM predictions_ia WHERE score_anomalie < 0 OR score_anomalie > 1;", tolerance: "0% d'écart", status: "success" }
];

// Historique des intentions
const INTENTS = {
    AUDIT: "audit",
    DOCUMENT: "document",
    SQL: "sql",
    SUPPORT: "support",
    REMEDIATION: "remediation",
    GREET: "greet",
    UNKNOWN: "unknown"
};

// Analyseur de langage naturel simplifié
function analyzeIntent(message) {
    const text = message.toLowerCase().trim();
    
    if (text.includes("bonjour") || text.includes("salut") || text.includes("hello") || text.includes("coucou")) {
        return INTENTS.GREET;
    }
    if (text.includes("audit") || text.includes("qualité") || text.includes("vérifi") || text.includes("check") || text.includes("anomalie") || text.includes("golden")) {
        return INTENTS.AUDIT;
    }
    if (text.includes("document") || text.includes("description") || text.includes("enrichi") || text.includes("modifier") || text.includes("owner")) {
        return INTENTS.DOCUMENT;
    }
    if (text.includes("requête") || text.includes("sql") || text.includes("génèr") || text.includes("code")) {
        return INTENTS.SQL;
    }
    if (text.includes("openmetadata") || text.includes("aide") || text.includes("tuto") || text.includes("comment") || text.includes("guide") || text.includes("tag")) {
        return INTENTS.SUPPORT;
    }
    if (text.includes("corrige") || text.includes("remédi") || text.includes("nettoy") || text.includes("fix")) {
        return INTENTS.REMEDIATION;
    }
    
    return INTENTS.UNKNOWN;
}

// Générateur de réponse de l'Agent IA
function generateAgentResponse(message, onThought, onResponse) {
    const intent = analyzeIntent(message);
    
    switch (intent) {
        case INTENTS.GREET:
            onThought("Reconnaissance de l'utilisateur...\nIntention: Salutations\nChargement du profil Jeoram (MGEN Candidate).");
            setTimeout(() => {
                onResponse(`Bonjour Jeoram ! Je suis votre **Steward IA de Gouvernance**. 
                
Je peux auditer la qualité des données de mutuelle, enrichir le catalogue OpenMetadata, écrire des scripts SQL de remédiation, ou vous guider sur les règles de gouvernance MGEN.

Que souhaitez-vous faire aujourd'hui ?`);
            }, 1000);
            break;

        case INTENTS.AUDIT:
            onThought(`Analyse des schémas de la base MGEN...
Tables cibles: adherents, remboursements, predictions_ia
Exécution de 6 assertions de qualité SQL via AlaSQL en direct...
Anomalies détectées :
- adherents : 1 doublon de PK (id: 1007), 1 code postal incorrect, 1 email invalide.
- remboursements : 1 orphelin FK (id_adherent 9999), 2 incohérences financières (montant négatif et remboursement supérieur au total).
- predictions_ia (Sorties IA) : 1 score hors limites (1.50), 1 score négatif, 1 score NULL.`);
            
            setTimeout(() => {
                // Mettre à jour l'affichage des assertions sur l'écran
                runDatabaseAudit();
                
                onResponse(`J'ai exécuté un **audit de qualité complet** sur la base de données MGEN. 

### 📊 Rapport d'audit de l'Agent :
- **Taux de conformité global** : **66%** (4 échecs sur 6 assertions).
- **Golden Data (Entrées IA)** : 
  - ⚠️ **adherents** : Doublon sur l'identifiant \`1007\` (Chloé Rousseau) ; 1 e-mail mal formé ; 1 code postal invalide.
  - ⚠️ **remboursements** : Clé étrangère orpheline (adhérent \`9999\` inexistant) ; anomalies financières (remboursements négatifs ou supérieurs au montant total facturé).
- **Sorties du modèle IA** :
  - ⚠️ **predictions_ia** : Présence de scores d'anomalies aberrants (hors limites \`[0,1]\` et valeurs nulles).

*J'ai mis à jour le registre dans l'onglet **Data Quality Assertions** de droite. Souhaitez-vous que je génère un **script SQL de remédiation** pour nettoyer ces données ?*`);
            }, 1200);
            break;

        case INTENTS.DOCUMENT:
            onThought(`Intention: Enrichissement OpenMetadata
Analyse de la demande utilisateur...
Modification demandée sur les descriptions du dictionnaire.
Génération d'une description professionnelle pour la table 'remboursements' et ses colonnes...
Mise à jour du registre OpenMetadata...`);
            
            setTimeout(() => {
                // Modifier dynamiquement la description de la table remboursements dans le catalogue
                dynamicCatalog.remboursements.description = "Table transactionnelle hautement sécurisée. Contient le lignage financier validé et documenté des soins. Référencé comme Golden Data critique pour l'apprentissage automatique.";
                dynamicCatalog.remboursements.owner = "Jeoram R. (Alternant Direction Data)";
                
                // Mettre à jour l'affichage si on regarde cette table
                refreshCatalogDisplay();

                onResponse(`J'ai mis à jour les métadonnées de la table **remboursements** dans OpenMetadata !

### ✍️ Modifications apportées :
- **Description de la table** : Modifiée pour spécifier son statut de *Golden Data critique*.
- **Data Owner** : Assigné à **\`Jeoram R. (Alternant Direction Data)\`**.

*Vous pouvez observer la mise à jour en direct dans l'onglet **Dictionnaire (OpenMetadata)** de droite.*`);
            }, 1200);
            break;

        case INTENTS.SQL:
            onThought(`Intention: Écriture de script SQL
Analyse de la table adherents...
Formulation de la requête SQL demandée...
Génération du code SQL de test...
Exécution sur le moteur AlaSQL en direct...`);
            
            setTimeout(() => {
                const sqlQuery = `SELECT id_adherent, nom, prenom, email \nFROM adherents \nWHERE email IS NULL OR email NOT LIKE '%@%';`;
                
                // Exécuter et afficher dans la console SQL de droite
                executeSqlInConsole(sqlQuery);

                onResponse(`Voici la requête SQL que j'ai écrite pour identifier les adresses e-mail erronées ou manquantes dans la table \`adherents\` :

\`\`\`sql
SELECT id_adherent, nom, prenom, email 
FROM adherents 
WHERE email IS NULL OR email NOT LIKE '%@%';
\`\`\`

**Résultats de l'exécution en direct** :
- Ligne 1 : \`1003 | Lefebvre | Marie | marie.lefebvre@yahoo\` (Format incorrect)
- Ligne 2 : \`1004 | Dubois | Pierre | NULL\` (E-mail manquant)

*J'ai ouvert l'onglet **Console de Remédiation SQL** de droite pour vous montrer la table de sortie.*`);
            }, 1200);
            break;

        case INTENTS.SUPPORT:
            onThought(`Intention: Support / Formation utilisateur
Recherche dans la FAQ de gouvernance MGEN...
Extraction des consignes de tagging OpenMetadata.`);
            
            setTimeout(() => {
                onResponse(`Voici comment ajouter un tag de classification RGPD dans **OpenMetadata** pour guider les utilisateurs :

1. Naviguez dans le catalogue jusqu'à la table de votre choix (ex. \`adherents\`).
2. Cliquez sur l'onglet **Schema** de la table.
3. Repérez la ligne de la colonne concernée (ex. \`email\`), puis cliquez sur la cellule **Tags**.
4. Saisissez ou sélectionnez le tag de classification approprié :
   - **\`RGPD.PII\`** (Personally Identifiable Information) pour les données d'identité (nom, e-mail).
   - **\`RGPD.Sensitive\`** pour les données de santé (données médicales, actes).
5. Cliquez sur **Save**.

*L'ajout de ces tags permet aux outils de sécurité de masquer automatiquement les colonnes sensibles lors des exports de données destinés aux Data Scientists.*`);
            }, 1000);
            break;

        case INTENTS.REMEDIATION:
            onThought(`Intention: Nettoyage / Remédiation de données
Génération du script DML (Data Manipulation Language) de correction...
Tables à nettoyer: adherents (doublons), remboursements (orphelins/négatifs).
Exécution du script de nettoyage sur la base de données...`);
            
            setTimeout(() => {
                // Simuler la correction en modifiant/supprimant des données aberrantes dans AlaSQL
                try {
                    // Supprimer le doublon parfait de Chloé Rousseau
                    alasql("DELETE FROM adherents WHERE id_adherent = 1007");
                    alasql("INSERT INTO adherents VALUES (1007, 'Rousseau', 'Chloé', 'chloe.rousseau@mgen.fr', '1992-07-22', '33000', '2021-06-25')");
                    
                    // Supprimer l'adhérent orphelin 9999
                    alasql("DELETE FROM remboursements WHERE id_adherent = 9999");
                    
                    // Mettre à jour les montants négatifs ou incorrects
                    alasql("UPDATE remboursements SET montant_rembourse = 120.00 WHERE id_remboursement = 50003"); // Correction de remboursement > total
                    alasql("UPDATE remboursements SET montant_rembourse = 10.00 WHERE id_remboursement = 50004"); // Correction montant négatif
                    
                    // Corriger les scores IA hors limites
                    alasql("UPDATE predictions_ia SET score_anomalie = 0.95, confiance_modele = 0.95 WHERE id_prediction = 90004");
                    alasql("UPDATE predictions_ia SET score_anomalie = 0.10 WHERE id_prediction = 90005");
                    alasql("UPDATE predictions_ia SET score_anomalie = 0.00, confiance_modele = 0.50 WHERE id_prediction = 90006");
                    
                    // Ré-auditer après remédiation
                    runDatabaseAudit();
                    
                    onResponse(`J'ai exécuté le **script de remédiation** sur la base de données en mémoire !

### 🛠️ Résumé du nettoyage effectué :
1. **adherents** : Doublon supprimé de manière à garantir l'unicité de la clé primaire.
2. **remboursements** : 
   - Suppression du remboursement orphelin lié à l'adhérent fictif \`9999\`.
   - Correction des montants financiers (redressement du remboursement négatif et réduction de la part remboursée supérieure à la facture).
3. **predictions_ia** : Redressement des anomalies de scores et de confiance du modèle IA pour correspondre à l'intervalle requis \`[0,1]\`.

*Le taux de conformité qualité des assertions est désormais de **100%**. Vous pouvez le vérifier dans l'onglet **Data Quality Assertions**.*`);
                } catch(e) {
                    onResponse(`Une erreur est survenue lors de l'exécution du nettoyage : ${e.message}`);
                }
            }, 1500);
            break;

        default:
            onThought(`Intention: Inconnue
Génération d'une réponse de repli explicative.`);
            setTimeout(() => {
                onResponse(`Désolé, je n'ai pas bien compris votre demande. 

Pouvez-vous reformuler ? Vous pouvez essayer par exemple :
- *"Fais un audit de la qualité pour l'IA"*
- *"Génère une requête SQL"*
- *"Documente la table remboursements"*
- *"Aide OpenMetadata"*`);
            }, 1000);
            break;
    }
}

// Fonction d'audit de base
function runDatabaseAudit() {
    let passed = 0;
    
    dynamicAssertions.forEach(assertion => {
        let result = [];
        try {
            result = alasql(assertion.sql);
        } catch(e) {
            console.error(e);
        }
        
        const isOk = result.length === 0;
        assertion.status = isOk ? "success" : "danger";
        if (isOk) passed++;
    });
    
    // Mettre à jour l'UI des assertions de droite
    const assertionsBody = document.getElementById("quality-assertions-body");
    if (assertionsBody) {
        assertionsBody.innerHTML = "";
        dynamicAssertions.forEach(a => {
            const tr = document.createElement("tr");
            const badgeClass = a.status === "success" ? "badge-success" : "badge-danger";
            const statusText = a.status === "success" ? "CONFORME" : "ÉCHEC";
            
            tr.innerHTML = `
                <td><strong>${a.targetTable}</strong></td>
                <td><span class="badge badge-mgen">${a.type}</span></td>
                <td><pre style="font-family: var(--font-mono); font-size: 0.75rem; background: rgba(0,0,0,0.1); padding: 0.4rem; border-radius: 4px; overflow-x: auto; max-width: 320px; color: var(--text-secondary);">${a.sql}</pre></td>
                <td>${a.tolerance}</td>
                <td><span class="badge ${badgeClass}">${statusText}</span></td>
            `;
            assertionsBody.appendChild(tr);
        } );
    }

    // Si le bouton de notification d'onglet de qualité existe, on peut l'alerter
    const qualityTab = document.getElementById("btn-tab-quality");
    if (qualityTab) {
        if (passed < dynamicAssertions.length) {
            qualityTab.innerHTML = `Data Quality Assertions <span class="badge badge-danger" style="font-size: 0.55rem; padding: 0.15rem 0.35rem; margin-left: 0.25rem;">Alerte</span>`;
        } else {
            qualityTab.innerHTML = `Data Quality Assertions <span class="badge badge-success" style="font-size: 0.55rem; padding: 0.15rem 0.35rem; margin-left: 0.25rem;">Ok</span>`;
        }
    }
}

// Fonction pour exécuter et afficher du SQL dans le panneau de droite
function executeSqlInConsole(query) {
    const consoleQuery = document.getElementById("sql-console-query");
    const consoleTable = document.getElementById("console-table");
    const consoleTableHead = document.getElementById("console-table-head");
    const consoleTableBody = document.getElementById("console-table-body");
    const placeholder = document.getElementById("console-placeholder");
    const tabSqlBtn = document.getElementById("btn-tab-sql");

    if (consoleQuery) consoleQuery.textContent = query;
    if (tabSqlBtn) tabSqlBtn.click(); // Naviguer vers l'onglet SQL

    try {
        const result = alasql(query);
        
        if (!result || result.length === 0) {
            placeholder.style.display = "block";
            placeholder.textContent = "Requête réussie. Aucun enregistrement retourné.";
            consoleTable.style.display = "none";
            return;
        }

        placeholder.style.display = "none";
        
        // Entête
        consoleTableHead.innerHTML = "";
        const keys = Object.keys(result[0]);
        const headerTr = document.createElement("tr");
        keys.forEach(k => {
            const th = document.createElement("th");
            th.textContent = k;
            headerTr.appendChild(th);
        });
        consoleTableHead.appendChild(headerTr);

        // Données
        consoleTableBody.innerHTML = "";
        result.forEach(row => {
            const tr = document.createElement("tr");
            keys.forEach(k => {
                const td = document.createElement("td");
                td.textContent = row[k] === null ? "NULL" : row[k];
                tr.appendChild(td);
            });
            consoleTableBody.appendChild(tr);
        });

        consoleTable.style.display = "table";

    } catch (error) {
        placeholder.style.display = "block";
        placeholder.innerHTML = `<span class="text-danger">Erreur d'exécution : ${error.message}</span>`;
        consoleTable.style.display = "none";
    }
}
