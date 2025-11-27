const videoConfig = {
    "videoId": "9JBLiGMWpTA",
    "checkpoints": [
        {
            "timestamp": 44,
            "id": "company_role",
            "type": "single_choice",
            "question": "In welcher Art von Unternehmen arbeiten Sie?",
            "options": ["OEM", "ODM", "EMS", "E2MS", "Sonstiges"]
        },
        {
            "timestamp": 44,
            "id": "role",
            "type": "text", 
            "question": "Was ist Ihre Rolle?"
        },
        // Bedeutung von Preisen und Verfügbarkeit
        {
            "timestamp": 76,
            "id": "pricing_importance",
            "type": "scale_1_to_5",
            "question": "Wie bewerten Sie die Bedeutung der Suche nach Preis- und Verfügbarkeitsdaten mittels GPT?"
        },
        // Bedeutung der Datenmanipulation
        {
            "timestamp": 101,
            "id": "data_manipulation",
            "type": "scale_1_to_5",
            "question": "Wie bewerten Sie die Bedeutung der Datenaufbereitung in maßgeschneiderte Tabellen mittels GPT?"
        },
        // Bedeutung von Bauteilalternativen bei 94 Sekunden
        {
            "timestamp": 139,
            "id": "alternatives_importance",
            "type": "scale_1_to_5",
            "question": "Wie bewerten Sie die Bedeutung der Suche nach Bauteilalternativen mittels GPT?"
        },
        // Bedeutung von Datenblättern bei 124 Sekunden
        {
            "timestamp": 173,
            "id": "datasheets_importance",
            "type": "scale_1_to_5",
            "question": "Wie bewerten Sie die Bedeutung des Abrufens, Vergleichens und Erläuterns von Datenblättern mittels GPT?"
        },
        // Bedeutung von Compliance bei 141 Sekunden
        {
            "timestamp": 206,
            "id": "compliance_importance",
            "type": "scale_1_to_5",
            "question": "Wie bewerten Sie die Bedeutung der Überprüfung von Compliance-Informationen mittels GPT?"
        },
        // Bedeutung von Dokumentation bei 165 Sekunden
        {
            "timestamp": 242,
            "id": "docs_importance",
            "type": "scale_1_to_5",
            "question": "Wie bewerten Sie die Bedeutung des Hochladens eigener Dokumentation und deren Verfügbarkeit über mehrere Konversationen hinweg?"
        },
        // Bedeutung der Inhaltserstellung bei 182 Sekunden
        {
            "timestamp": 260,
            "id": "content_generation",
            "type": "scale_1_to_5",
            "question": "Wie bewerten Sie die Bedeutung der Inhaltserstellung (z.B. E-Mails) mittels GPT?"
        },
        // Fehlende Funktionen und Präferenzen bei 188 Sekunden
        {
            "timestamp": 267,
            "id": "missing_features",
            "type": "text",
            "question": "Welche Funktion fehlt derzeit, die Sie in dieser Kategorie gerne hätten?"
        },
        {
            "timestamp": 267,
            "id": "feature_preference",
            "type": "single_choice",
            "question": "Wenn Sie heute nur eine dieser Funktionen haben könnten, welche wäre es?",
            "options": ["Suche & Verfügbarkeit", "Datenaufbereitung", "Alternativen finden", "Datenblätter abrufen und erläutern", "Compliance-Prüfungen", "Dokumente über Konversationen hinweg", "E-Mail-/Vorlagenerstellung"]
        },
        // Hintergrund-Agent-Funktionen bei 235 Sekunden
        {
            "timestamp": 345,
            "id": "background_agent",
            "type": "rating_block",
            "title": "Hintergrund-KI-Agent-Funktionen",
            "description": "Bitte bewerten Sie jede Funktion für den Hintergrund-KI-Agenten.",
            "features": [
                { "id": "pcn_summary", "label": "PCN-Zusammenfassung" },
                { "id": "obsolescence_risks", "label": "Obsoleszenz-Risiken" }
            ],
            "freeTextLabel": "Welche Funktion fehlt derzeit, die Sie in dieser Kategorie gerne hätten?"
        },
        {
            "timestamp": 348,
            "id": "agent_preference",
            "type": "single_choice",
            "question": "Wenn Sie heute nur eine dieser Funktionen haben könnten, welche wäre es?",
            "options": ["PCN-Zusammenfassung", "Obsoleszenz-Risiko"]
        },
        // Abschließende Gedanken bei 253 Sekunden
        {
            "timestamp": 348,
            "id": "final_thoughts",
            "type": "text",
            "question": "Haben Sie noch abschließende Gedanken?"
        },
        {
            "timestamp": 348,
            "id": "email_feedback",
            "type": "text",
            "question": "Optional: Wenn Sie detaillierteres Feedback in einem Interview geben möchten, hinterlassen Sie bitte Ihre E-Mail-Adresse."
        }
    ]
};
