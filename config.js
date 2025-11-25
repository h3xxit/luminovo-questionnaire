const videoConfig = {
    "videoId": "zsMjkPzmqhA",
    "checkpoints": [
        // Section 1 – Category 1 shown early to demonstrate complex UI
        {
            "timestamp": 10,
            "id": "category1",
            "type": "rating_block",
            "title": "Section 2 of 5 – Category 1: ChatGPT specialized in knowing information about parts",
            "description": "This is a ChatGPT trained on all electronics parts, with access to external data sources. Please rate each feature and tell us what is missing.",
            "features": [
                { "id": "find_alternatives", "label": "Find part alternatives" },
                { "id": "find_prices", "label": "Find prices" },
                { "id": "find_suppliers", "label": "Find suppliers" },
                { "id": "find_lead_times", "label": "Find lead times" },
                { "id": "find_datasheet_url", "label": "Find datasheet URL" }
            ],
            "freeTextLabel": "Which feature is currently missing which you'd love to have in this category?"
        },
        // Section 2 – intro: company + role (now comes after first complex block)
        {
            "timestamp": 30,
            "id": "section1_intro",
            "type": "text",
            "question": "Briefly tell us: what type of company do you work at, and what is your role?"
        },
        // Section 3 – Category 2: ChatBOM
        {
            "timestamp": 50,
            "id": "category2",
            "type": "rating_block",
            "title": "Section 3 of 5 – Category 2: ChatGPT to upload excel BOM files, ask questions and fill them out",
            "description": "This is a chat interface that allows you to chat with your BOM files and perform certain operations. Please rate each feature and tell us what is missing.",
            "features": [
                { "id": "ask_questions", "label": "Ask questions about BOM" },
                { "id": "auto_fill_prices", "label": "Automatically fill in prices" },
                { "id": "auto_fill_params", "label": "Automatically fill in technical parameters of parts" },
                { "id": "assess_full_price", "label": "Assess full price of BOM" },
                { "id": "parts_risks", "label": "Identify parts that are subject to risks" },
                { "id": "auto_fill_alternatives", "label": "Auto fill in alternatives" }
            ],
            "freeTextLabel": "Which feature is currently missing which you'd love to have in this category?"
        },
        // Section 4 – Category 4: Background AI Agent
        {
            "timestamp": 70,
            "id": "category4",
            "type": "rating_block",
            "title": "Section 4 of 5 – Category 4: Background AI Agent",
            "description": "An AI agent that collects information in the background based on your query and presents it to you periodically. Please rate each feature and tell us what is missing.",
            "features": [
                { "id": "pcn_summary", "label": "PCN summary" },
                { "id": "obsolescence_risks", "label": "Notifications on obsolescence risks" }
            ],
            "freeTextLabel": "Which feature is currently missing which you'd love to have in this category?"
        },
        // Section 5 – Finale
        {
            "timestamp": 90,
            "id": "finale",
            "type": "rating_block",
            "title": "Section 5 of 5 – Finale",
            "description": "Please rate each category overall and share any final thoughts.",
            "features": [
                { "id": "cat1_overall", "label": "ChatGPT specialized in parts" },
                { "id": "cat2_overall", "label": "ChatBOM" },
                { "id": "cat4_overall", "label": "Background agent" }
            ],
            "freeTextLabel": "Any final thoughts? You can also leave your email if you'd like to give more detailed feedback over an interview."
        }
    ]
};
