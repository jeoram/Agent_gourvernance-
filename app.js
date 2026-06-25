/**
 * app.js - Script de contrôle global et d'affichage pour l'Agent de Gouvernance
 */

let selectedTable = "adherents";

document.addEventListener("DOMContentLoaded", () => {
    // 1. Initialiser AlaSQL
    initDatabase();

    // 2. Exécuter l'audit initial de qualité
    runDatabaseAudit();

    // 3. Charger le catalogue par défaut (adherents)
    refreshCatalogDisplay();

    // 4. Configurer les onglets du panneau droit
    setupTabs();

    // 5. Configurer la sélection des tables du catalogue
    setupCatalogSelection();

    // 6. Configurer la saisie du chat
    setupChatInteraction();

    // 7. Configurer le theme toggle
    setupThemeToggle();

    // 8. Envoyer le message de bienvenue de l'agent
    sendWelcomeMessage();
});

// Gérer les onglets du panneau droit
function setupTabs() {
    const tabBtns = document.querySelectorAll(".panel-tab-btn");
    const tabContents = document.querySelectorAll(".panel-tab-content");

    tabBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            tabBtns.forEach(b => b.classList.remove("active"));
            tabContents.forEach(c => c.classList.remove("active"));

            btn.classList.add("active");
            const targetId = btn.getAttribute("data-tab");
            document.getElementById(targetId).classList.add("active");
        });
    });
}

// Configurer le catalogue
function setupCatalogSelection() {
    const treeItems = document.querySelectorAll(".tree-item");
    treeItems.forEach(item => {
        item.addEventListener("click", () => {
            treeItems.forEach(i => i.classList.remove("active"));
            item.classList.add("active");

            selectedTable = item.getAttribute("data-table");
            refreshCatalogDisplay();
        });
    });
}

// Rafraîchir l'affichage du catalogue à droite
function refreshCatalogDisplay() {
    const tableData = dynamicCatalog[selectedTable];
    if (!tableData) return;

    // Métadonnées
    document.getElementById("table-title").textContent = tableData.title;
    document.getElementById("table-description").textContent = tableData.description;
    document.getElementById("table-owner").textContent = tableData.owner;
    document.getElementById("table-classification").textContent = tableData.classification;

    // Badges
    const badgesContainer = document.getElementById("table-badges");
    badgesContainer.innerHTML = "";
    tableData.badges.forEach(badgeText => {
        let badgeClass = "badge-mgen";
        if (badgeText.includes("GOLDEN")) badgeClass = "badge-success";
        if (badgeText.includes("SORTIE")) badgeClass = "badge-info";
        if (badgeText.includes("RGPD")) badgeClass = "badge-danger";
        
        const badge = document.createElement("span");
        badge.className = `badge ${badgeClass}`;
        badge.textContent = badgeText;
        badge.style.marginLeft = "0.25rem";
        badgesContainer.appendChild(badge);
    });

    // Tableau de colonnes
    const schemaBody = document.getElementById("schema-table-body");
    schemaBody.innerHTML = "";
    tableData.columns.forEach(col => {
        const tr = document.createElement("tr");

        // Clés de colonnes
        let colNameHtml = col.name;
        if (col.name.startsWith("id_")) {
            if (col.name === `id_${selectedTable}` || col.name === "id_prediction") {
                colNameHtml = `<span class="text-warning"><i class="fa-solid fa-key"></i></span> <strong>${col.name}</strong>`;
            } else {
                colNameHtml = `<span class="text-info"><i class="fa-solid fa-link"></i></span> ${col.name}`;
            }
        }

        // Badges des tags
        let tagsHtml = "";
        col.tags.forEach(t => {
            let tagClass = "badge-mgen";
            if (t.includes("RGPD")) tagClass = "badge-danger";
            tagsHtml += `<span class="badge ${tagClass}" style="font-size: 0.65rem; margin-right: 0.25rem;">${t}</span>`;
        });

        tr.innerHTML = `
            <td>${colNameHtml}</td>
            <td style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--text-muted);">${col.type}</td>
            <td>${col.desc}</td>
            <td>${tagsHtml}</td>
        `;
        schemaBody.appendChild(tr);
    });
}

// Configurer l'interaction du Chat
function setupChatInteraction() {
    const input = document.getElementById("chat-input");
    const sendBtn = document.getElementById("send-btn");

    if (!input || !sendBtn) return;

    // Ajustement automatique de la hauteur du champ de saisie
    input.addEventListener("input", () => {
        input.style.height = "auto";
        input.style.height = (input.scrollHeight - 10) + "px";
    });

    // Envoyer au clic
    sendBtn.addEventListener("click", () => {
        const text = input.value;
        if (text.trim() !== "") {
            handleUserMessage(text);
            input.value = "";
            input.style.height = "40px";
        }
    });

    // Envoyer avec la touche Enter (sans shift)
    input.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendBtn.click();
        }
    });
}

// Envoyer un message rapide au clic sur les bulles de raccourcis
function sendQuickMessage(text) {
    handleUserMessage(text);
}

// Message de bienvenue de l'agent au chargement
function sendWelcomeMessage() {
    appendMessage("agent", `Bonjour Jeoram ! Je suis votre **Steward IA de Gouvernance**. 
    
Je peux auditer la qualité des données de mutuelle, enrichir le catalogue OpenMetadata, écrire des scripts SQL de remédiation, ou vous guider sur les règles de gouvernance MGEN.

Que souhaitez-vous faire aujourd'hui ?`);
}

// Afficher un message de l'utilisateur et déclencher l'Agent
function handleUserMessage(text) {
    appendMessage("user", text);

    // Afficher l'indicateur de frappe
    const typingIndicator = showTypingIndicator();

    // Appeler la logique de l'agent
    generateAgentResponse(
        text, 
        // Callback thought
        (thought) => {
            updateTypingThought(typingIndicator, thought);
        },
        // Callback response finale
        (response) => {
            typingIndicator.remove(); // Supprimer l'indicateur
            appendMessage("agent", response, typingIndicator.thoughtLog);
        }
    );
}

// Ajouter une bulle de message dans le chat
function appendMessage(sender, text, thoughtText = "") {
    const chatBox = document.getElementById("chat-box");
    if (!chatBox) return;

    const messageDiv = document.createElement("div");
    messageDiv.className = `message message-${sender}`;

    // Avatar
    const avatarDiv = document.createElement("div");
    avatarDiv.className = sender === "agent" ? "agent-avatar" : "user-avatar";
    avatarDiv.textContent = sender === "agent" ? "AI" : "JR";
    messageDiv.appendChild(avatarDiv);

    // Contenu du message
    const bubbleDiv = document.createElement("createElement");
    bubbleDiv.className = "message-bubble";

    // Si l'agent a eu un "thought process", l'intégrer sous forme de bloc dépliable
    let thoughtHtml = "";
    if (sender === "agent" && thoughtText !== "") {
        thoughtHtml = `
            <div class="agent-thought-container">
                <div class="thought-header" onclick="toggleThought(this)">
                    <i class="fa-solid fa-brain pulse-thought"></i> Journal d'Activité de l'Agent <i class="fa-solid fa-chevron-down" style="margin-left: auto; font-size: 0.7rem;"></i>
                </div>
                <div class="thought-content" style="display: none;">${thoughtText}</div>
            </div>
        `;
    }

    // Convertir les tags markdown de base en HTML
    let formattedText = text
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/g, "<em>$1</em>")
        .replace(/`(.*?)`/g, "<code style='font-family: var(--font-mono); font-size: 0.85em; background: rgba(255,255,255,0.06); padding: 0.1rem 0.3rem; border-radius: 4px;'>$1</code>")
        .replace(/\n/g, "<br>");

    // Gérer les blocs de code en markdown
    if (formattedText.includes("```sql")) {
        formattedText = formattedText.replace(/```sql(.*?)```/gs, "<pre class='code-block'>$1</pre>");
    } else if (formattedText.includes("```")) {
        formattedText = formattedText.replace(/```(.*?)```/gs, "<pre>$1</pre>");
    }

    bubbleDiv.innerHTML = `
        ${thoughtHtml}
        <div>${formattedText}</div>
    `;
    messageDiv.appendChild(bubbleDiv);

    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight; // Scroll vers le bas
}

// Afficher l'indicateur de frappe
function showTypingIndicator() {
    const chatBox = document.getElementById("chat-box");
    if (!chatBox) return;

    const messageDiv = document.createElement("div");
    messageDiv.className = "message message-agent";

    // Avatar
    const avatarDiv = document.createElement("div");
    avatarDiv.className = "agent-avatar";
    avatarDiv.textContent = "AI";
    messageDiv.appendChild(avatarDiv);

    // Contenu (Indicateur + Thought invisible au début)
    const bubbleDiv = document.createElement("div");
    bubbleDiv.className = "message-bubble";
    bubbleDiv.innerHTML = `
        <div class="agent-thought-container" style="display: none;" id="typing-thought-box">
            <div class="thought-header"><i class="fa-solid fa-brain pulse-thought"></i> Réflexion de l'Agent...</div>
            <div class="thought-content" id="typing-thought-content" style="display: block;"></div>
        </div>
        <div class="typing-indicator">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        </div>
    `;
    messageDiv.appendChild(bubbleDiv);

    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;

    // Référence pour mise à jour
    return {
        remove: () => messageDiv.remove(),
        thoughtBox: messageDiv.querySelector("#typing-thought-box"),
        thoughtContent: messageDiv.querySelector("#typing-thought-content"),
        thoughtLog: "" // Stocke le log complet
    };
}

// Mettre à jour la réflexion de l'agent pendant qu'il "réfléchit"
function updateTypingThought(indicator, thought) {
    if (indicator.thoughtBox) {
        indicator.thoughtBox.style.display = "block";
        indicator.thoughtContent.textContent = thought;
        indicator.thoughtLog = thought;
        
        const chatBox = document.getElementById("chat-box");
        if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;
    }
}

// Activer / Désactiver l'affichage du thought process
function toggleThought(header) {
    const content = header.nextElementSibling;
    const icon = header.querySelector(".fa-chevron-down") || header.querySelector(".fa-chevron-up");
    
    if (content.style.display === "none") {
        content.style.display = "block";
        if (icon) icon.className = "fa-solid fa-chevron-up";
    } else {
        content.style.display = "none";
        if (icon) icon.className = "fa-solid fa-chevron-down";
    }
}

// Thème toggle
function setupThemeToggle() {
    const toggleBtn = document.getElementById("theme-toggle");
    if (!toggleBtn) return;

    toggleBtn.addEventListener("click", () => {
        const currentTheme = document.documentElement.getAttribute("data-theme");
        const nextTheme = currentTheme === "dark" ? "light" : "dark";
        
        document.documentElement.setAttribute("data-theme", nextTheme);

        if (nextTheme === "dark") {
            toggleBtn.innerHTML = '<i class="fa-solid fa-sun"></i> Thème';
        } else {
            toggleBtn.innerHTML = '<i class="fa-solid fa-moon"></i> Thème';
        }
    });
}
