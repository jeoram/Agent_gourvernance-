# 🧠 Architecture Technique — Agent IA de Gouvernance MGEN

> Ce document décrit l'architecture interne du **MGEN Governance Steward**, un agent IA conversationnel de gouvernance et qualité des données. Il a été conçu pour démontrer une maîtrise des concepts clés du poste : dictionnaire de données (OpenMetadata), qualité des données pour l'IA (Data-Centric AI), et assistance fonctionnelle aux utilisateurs.

---

## 1. Vue d'ensemble — Architecture Générale

```mermaid
flowchart TD
    subgraph UI["🖥️ Interface Utilisateur (Navigateur)"]
        direction LR
        ChatPanel["💬 Chat Panel\n(Agent conversationnel)"]
        CatalogPanel["📂 Catalogue OpenMetadata\n(Dictionnaire de données)"]
        QualityPanel["🛡️ Data Quality Registry\n(Assertions SQL)"]
        SQLConsole["⚙️ Console de Remédiation SQL\n(Résultats en temps réel)"]
    end

    User(["👤 Utilisateur MGEN\n(Chargé de Gouvernance)"])

    subgraph Agent["🤖 Agent IA de Gouvernance (agent_logic.js)"]
        direction TB
        NLP["🔍 Analyseur d'Intention\n(NLP - Détection par mots-clés)"]
        ThoughtLog["📋 Journal d'Activité\n(Raisonnement visible de l'IA)"]
        SQLGen["🖊️ Générateur de Requêtes SQL\n(Écriture automatique de requêtes)"]
        MetaEngine["📖 Moteur de Métadonnées\n(Documentation automatique)"]
        AuditEngine["🔎 Moteur d'Audit Qualité\n(Règles DQ pour l'IA)"]
    end

    subgraph DataLayer["💾 Couche Données (db_init.js)"]
        direction LR
        AlaSQL[("🗄️ AlaSQL\n(SQLite en mémoire)")]
        T1["📋 Table: adherents\n(id, nom, email, code_postal...)"]
        T2["📋 Table: remboursements\n(id, montant, statut...)"]
        T3["🧠 Table: predictions_ia\n(score_anomalie, confiance...)"]
        Anomalies["⚠️ Anomalies injectées\n(doublons, formats, FK orphelines)"]
    end

    User -->|"Message en langage naturel"| ChatPanel
    ChatPanel -->|"Texte utilisateur"| NLP
    NLP -->|"Intent: audit_qualite"| AuditEngine
    NLP -->|"Intent: sql / rédiger_test"| SQLGen
    NLP -->|"Intent: documenter / openmetadata"| MetaEngine
    NLP -->|"Intent: aide / question"| ThoughtLog

    AuditEngine -->|"Requêtes SQL de contrôle"| AlaSQL
    SQLGen -->|"Requête SQL générée"| AlaSQL
    AlaSQL --> T1 & T2 & T3
    T1 & T2 & T3 --> Anomalies

    AlaSQL -->|"Lignes anomalies retournées"| SQLConsole
    MetaEngine -->|"Descriptions + Tags + Owners"| CatalogPanel
    AuditEngine -->|"Rapport d'assertions"| QualityPanel
    ThoughtLog -->|"Journal de raisonnement"| ChatPanel

    SQLConsole & CatalogPanel & QualityPanel -->|"Affichage mis à jour"| User
```

---

## 2. Pipeline de Traitement d'une Requête

```mermaid
sequenceDiagram
    actor User as 👤 Utilisateur MGEN
    participant Chat as 💬 Chat Panel
    participant NLP as 🔍 Analyseur NLP
    participant Agent as 🤖 Agent IA
    participant SQL as 🗄️ AlaSQL (DB)
    participant UI as 🖥️ Dashboard

    User->>Chat: "Auditer la qualité pour l'IA"
    Chat->>NLP: Analyse du texte
    NLP-->>Agent: Intent = "audit_qualite_ia"
    Agent->>Chat: 🟡 Journal: "Analyse des tables critiques pour l'IA..."
    Agent->>SQL: SELECT count(*) FROM predictions_ia WHERE score_anomalie > 1
    SQL-->>Agent: 2 anomalies (score hors [0,1])
    Agent->>SQL: SELECT * FROM adherents WHERE email NOT LIKE '%@%.%'
    SQL-->>Agent: 1 email invalide
    Agent->>SQL: SELECT * FROM remboursements WHERE montant_rembourse > montant_facture
    SQL-->>Agent: 1 remboursement incohérent
    Agent->>UI: Mise à jour onglet "Data Quality"
    Agent->>UI: Mise à jour console SQL avec les requêtes
    Agent->>Chat: ✅ Réponse : "5 anomalies critiques détectées, données non fiables pour l'entraînement IA"
    Chat-->>User: Affichage du rapport complet
```

---

## 3. Classification des Intentions (NLP)

L'agent utilise une détection par mots-clés pondérés pour classifier les intentions. Voici la matrice complète :

| Intention détectée | Mots-clés déclencheurs | Action de l'Agent |
|---|---|---|
| `audit_qualite_ia` | "audit", "qualité", "ia", "golden", "anomalie" | Lance `auditQualityForAI()` sur les 3 tables |
| `documenter_table` | "documente", "documentation", "décris", "décrit" | Injecte descriptions + tags dans le catalogue |
| `aide_openmetadata` | "openmetadata", "aide", "comment", "tutoriel" | Retourne une fiche d'aide interactive |
| `rédiger_sql` | "sql", "requête", "trouve", "cherche", "filtre" | Génère + exécute une requête SQL ciblée |
| `corriger_anomalies` | "corrige", "nettoie", "répare", "fix" | Exécute les requêtes `DELETE`/`UPDATE` de remédiation |
| `general` | *(par défaut)* | Réponse générale sur la gouvernance |

---

## 4. Modèle de Données (Tables en Mémoire AlaSQL)

```mermaid
erDiagram
    ADHERENTS {
        int id_adherent PK
        string nom
        string prenom
        string email
        string code_postal
        date date_naissance
        string statut
    }

    REMBOURSEMENTS {
        int id_remboursement PK
        int id_adherent FK
        date date_soin
        string acte_medical
        float montant_facture
        float montant_rembourse
        string statut_remboursement
    }

    PREDICTIONS_IA {
        int id_prediction PK
        int id_adherent FK
        date date_prediction
        float score_anomalie
        float confiance_modele
        string statut_prediction
    }

    ADHERENTS ||--o{ REMBOURSEMENTS : "a des"
    ADHERENTS ||--o{ PREDICTIONS_IA : "est analysé par"
```

---

## 5. Anomalies de Qualité Injectées (Golden Data Testing)

Le jeu de données simule des problèmes réels rencontrés en production :

| Table | Anomalie | Type DQ | Impact IA |
|---|---|---|---|
| `adherents` | Doublon id_adherent=1007 | Unicité | Biais d'entraînement |
| `adherents` | Email "jean.martin[at]gmail" | Format | Enrichissement impossible |
| `adherents` | Code postal "750" (3 chiffres) | Cohérence | Feature engineering cassé |
| `remboursements` | Montant remboursé > facturé | Cohérence métier | Faux positif modèle fraude |
| `remboursements` | Montant = -50€ | Plausibilité | Outlier toxique |
| `remboursements` | id_adherent=9999 inexistant | Intégrité référentielle | Jointure silencieuse |
| `predictions_ia` | score_anomalie = 1.45 (> 1.0) | Domaine de valeur | Erreur de normalisation |
| `predictions_ia` | confiance_modele = NULL | Complétude | Prédiction non fiable |

---

## 6. Stack Technologique

```mermaid
graph LR
    subgraph Frontend
        HTML5["HTML5\nStructure sémantique"]
        CSS3["CSS3\nGlassmorphism + Variables"]
        VanillaJS["Vanilla JS\nES6+ Modules"]
    end

    subgraph Libraries
        AlaSQL["AlaSQL 4.4\nSQLite en mémoire"]
        FontAwesome["FontAwesome 6.4\nIconographie"]
    end

    subgraph Deployment
        GitHub["GitHub\nVersationing"]
        Pages["GitHub Pages\nHosting statique"]
    end

    HTML5 --> VanillaJS
    CSS3 --> HTML5
    VanillaJS --> AlaSQL
    VanillaJS --> FontAwesome
    GitHub --> Pages
```

> **Zéro dépendance serveur** — 100% client-side. Fonctionne hors-ligne une fois chargé.

---

## 7. Alignement avec le Poste MGEN

| Mission du Poste | Fonctionnalité dans l'Agent |
|---|---|
| Enrichissement du dictionnaire OpenMetadata | Commande "Documente la table X" → injection auto de métadonnées |
| Formation & assistance utilisateurs | Section "Aide OpenMetadata" avec fiches explicatives interactives |
| Data Quality for AI (Golden Data) | Moteur d'audit complet sur les 3 tables avec rapport HTML détaillé |
| Identification des anomalies pour l'IA | Détection de 8 types d'anomalies, impact IA documenté par anomalie |
| Rédaction de tests SQL | Commande "Rédige un test SQL" → génération + exécution instantanée |
