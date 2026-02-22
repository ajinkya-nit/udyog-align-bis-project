const fs = require('fs');
const path = require('path');

// Load parsed BIS data for RAG
let parsedBisData = [];
try {
  const dataPath = path.join(__dirname, '..', 'parsed_bis_data.json');
  const rawData = fs.readFileSync(dataPath, 'utf-8');
  parsedBisData = JSON.parse(rawData);
} catch (error) {
  console.log("Could not load parsed_bis_data.json. Make sure to run the extraction script first.");
}

// Dummy BIS Certification Data Knowledge Base (used for Mock Mode fallback)
const bisStandardsData = {
  "ceiling fan": {
    isCode: "IS 374:2019",
    pdfFilename: "302-2-3-PM.pdf",
    productCategories: ["ceiling fan", "fan", "regulator"],
    mandatoryEquipment: [
      { name: "High-Voltage Breakdown Tester", requiredFor: "Electrical Safety", critical: true },
      { name: "Air Delivery Test Rig", requiredFor: "Performance", critical: true },
      { name: "Wattmeter", requiredFor: "Power Consumption", critical: true },
      { name: "Tachometer", requiredFor: "RPM Measurement", critical: false },
    ],
    documentationRequired: [
      "Factory Layout Plan",
      "List of Manufacturing Machinery",
      "List of Testing Personnel",
      "Calibration Certificates for Testing Equipment"
    ],
    subsidyCategory: "Micro"
  },
  "shoe": {
    isCode: "IS 15298 (Part 2): 2024",
    pdfFilename: "Revised-PM-IS-15298-Part-2.pdf",
    productCategories: ["shoe", "footwear", "safety shoe", "safety footwear", "boot"],
    mandatoryEquipment: [
      { name: "Tensile testing machine", requiredFor: "Upper/outsole bond strength", critical: true },
      { name: "Impact test apparatus", requiredFor: "Toe protection", critical: true },
      { name: "Slip resistance test machine", requiredFor: "Slip resistance", critical: true },
      { name: "Water bath / pressure sensor", requiredFor: "Leak proofness", critical: false }
    ],
    documentationRequired: [
      "Factory Layout Plan",
      "Raw Material Test Certificates"
    ],
    subsidyCategory: "Micro"
  },
  "plug": {
    isCode: "IS 1293:2019",
    pdfFilename: "PM_1293_V2.pdf",
    productCategories: ["plug", "socket", "socket-outlet", "switch"],
    mandatoryEquipment: [
      { name: "High voltage test equipment", requiredFor: "Electric strength", critical: true },
      { name: "Tumbling barrel", requiredFor: "Mechanical Strength", critical: true },
      { name: "Glow wire test apparatus", requiredFor: "Resistance to heat", critical: true },
      { name: "Insulation test equipment (Megger)", requiredFor: "Insulation resistance", critical: true }
    ],
    documentationRequired: [
      "Factory Layout Plan",
      "List of Manufacturing Machinery"
    ],
    subsidyCategory: "Micro"
  }
};

/**
 * AI Engine Core Module
 * Responsible for factual grounding of user statements into BIS Standards.
 */
class AIEngine {
  constructor() {
    this.bisDatabase = bisStandardsData;
  }

  /**
   * Mapping logic to map product name to exact IS code and PDF Manual text.
   * @param {string} userProductInput 
   * @returns {Object|null} Ground Truth standard config
   */
  mapProductToStandard(userProductInput) {
    if (!userProductInput) return null;
    const input = userProductInput.toLowerCase();
    
    // Simple mock semantic search
    for (const [key, standard] of Object.entries(this.bisDatabase)) {
      if (standard.productCategories.some(cat => input.includes(cat))) {
        
        // Find corresponding PDF text from the parsed knowledge base
        const pdfRecord = parsedBisData.find(p => p.filename === standard.pdfFilename);
        
        return {
          ...standard,
          // Truncate text to 12000 characters to comfortably fit inside the LLM context window limits
          pdfText: pdfRecord ? pdfRecord.text.substring(0, 12000) : ''
        };
      }
    }
    return null; // Standard not found in naive mock database
  }

  /**
   * Generates the system prompt for AGENT 1 (The State Extractor)
   * This agent ONLY returns a strict JSON object parsing the current compliance state.
   */
  generateExtractorPrompt(standardContext) {
    if (!standardContext) {
      return `You are a strict data extraction system. The user has not yet specified a valid product. Return exactly this JSON: {"isCode": null, "readinessScore": 0, "checklist": [], "subsidyCategory": null}`;
    }

    return `
You are a strict, invisible data extraction algorithm. You do NOT chat. You ONLY output raw JSON.

GROUND TRUTH PRODUCT MANUAL (Extracted from official BIS PDF for ${standardContext.isCode}):
=============================
${standardContext.pdfText}
=============================

YOUR JOB:
1. Analyze the chat history and any user uploaded documents.
2. Determine which mandatory equipment from the PRODUCT MANUAL the user actually possesses.
   - If the user explicitly mentions having the equipment (e.g. "Yes, I confirm we have a finalized Factory Layout Plan" or "we have a Megger"), mark its status as "green".
   - If they uploaded a document (e.g. "test_reports.pdf") and the equipment is mentioned in the chat or document, mark its status as "green".
   - Otherwise, mark its status as "red" or "yellow" (Pending Verification).
3. Calculate a "readinessScore" (0-100) based on how many items they possess vs how many are required in the manual's "List of Test Equipment" or "Scheme of Inspection". 
4. Output STRICTLY a JSON object matching this structure:
{
  "readinessScore": <number 0-100>,
  "isCode": "${standardContext.isCode}",
  "subsidyCategory": "${standardContext.subsidyCategory}",
  "checklist": [
     { "item": "<Exact Equipment from the PDF List Of Test Equipment>", "status": "green|yellow|red", "suggestion": "<Short rationale why it is needed based on the PDF>" }
  ]
}

Only return the JSON object. Do not wrap it in markdown \`\`\`json. Never output conversational text.
`;
  }

  /**
   * Generates the system prompt for AGENT 2 (The Conversationalist)
   * This agent ONLY returns a conversational string, guided by the extracted JSON state.
   */
  generateConversationalistPrompt(standardContext, extractedJsonState) {
     if (!standardContext) {
      return `You are an expert BIS (Bureau of Indian Standards) Compliance Consultant. The user has not yet specified a product that exists in our database. Politely ask them to clarify what product they manufacture (e.g., Ceiling Fans, Plugs & Sockets, or Safety Footwear). Keep answers brief and professional. Talk directly to the user.`;
    }

    const jsonString = JSON.stringify(extractedJsonState, null, 2);

    return `
You are an expert BIS Compliance Consultant conducting a virtual gap analysis for an MSME factory.

CURRENT EXTRACTED COMPLIANCE STATE:
${jsonString}

YOUR JOB:
Use the state provided above to generate a conversational response to the user's latest message.
If their "checklist" has "red" or missing items, politely point out the next missing item from the list and ask if they possess it, or if they outsource testing to a NABL accredited lab.
If their score is high, politely ask about their Factory Layout Plan or other documentation.
Keep your response to 2-3 sentences. Do not mention that you are reading from JSON. Simply talk to the user.
Do NOT output JSON. Just natural text.
`;
  }
}

module.exports = new AIEngine();
