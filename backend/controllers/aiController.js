const { HfInference } = require('@huggingface/inference');
const aiEngine = require('../services/aiEngine');
const Session = require('../models/UserSession');

// Initialize HF SDK conditionally and safely
const hasValidKey = process.env.HUGGINGFACE_API_KEY && process.env.HUGGINGFACE_API_KEY !== 'your_hf_api_key_here';
const hf = hasValidKey ? new HfInference(process.env.HUGGINGFACE_API_KEY) : null;

exports.processChat = async (req, res) => {
  try {
    const { sessionId, message, fileUrl, productName, chatHistory = [], uploadedDocumentText } = req.body;
    
    // 1. In a real app, load session from DB. Here we just rely on client state for demo speed.
    // 2. Fetch ground truth from AI Engine
    const standardContext = aiEngine.mapProductToStandard(productName || message);
    
    // 3. Generate Agent 1 Extractor Prompt
    const extractorPrompt = aiEngine.generateExtractorPrompt(standardContext);

    // 4. Construct payload for Extractor
    const extractorPromptString = `
      User Message: "${message}"
      Uploaded File URL: ${fileUrl || 'None'}
      ${uploadedDocumentText ? `\n\n=== USER UPLOADED DOCUMENT CONTENT ===\n${uploadedDocumentText}\n======================================\n\nTask: Analyze the user's uploaded document content above. Cross-reference it with the GROUND TRUTH PRODUCT MANUAL. Does their document prove they have the required equipment? Update the JSON status to green if they do.` : ''}
    `;

    if (!hasValidKey) {
      // Mock mode if no API key provided for the hackathon
      console.log('Returning mock AI response as HUGGINGFACE_API_KEY is not set');
      
      const isYesInput = message && message.toLowerCase().includes('yes');
      let score = isYesInput ? 85 : Math.floor(Math.random() * 40) + 30;
      
      let aiResponseText = `Hello! What product do you manufacture so I can find the right BIS code?`;
      
      if (standardContext) {
         const pastUserMessages = chatHistory.filter(m => m.role === 'user').length;
         
         if (pastUserMessages <= 1) {
             aiResponseText = `I noticed you manufacture products under ${standardContext.isCode}. I've loaded the requirements. Do you have the ${standardContext.mandatoryEquipment[0]?.name || 'required equipment'} installed?`;
         } else if (pastUserMessages === 2) {
             if (uploadedDocumentText) {
                aiResponseText = `I see you uploaded a document. I have reviewed the text from it. Based on the logs provided, I've marked the ${standardContext.mandatoryEquipment[0]?.name || 'test rig'} as complete. Do you also have the ${standardContext.mandatoryEquipment[1]?.name || 'other test rigs'} ready for evaluation?`;
                score = 65;
             } else if (isYesInput) {
                aiResponseText = `Great! I've marked the ${standardContext.mandatoryEquipment[0]?.name || 'test rig'} as complete. Do you also have the ${standardContext.mandatoryEquipment[1]?.name || 'other test rigs'} ready for evaluation?`;
                score = 65;
             } else {
                aiResponseText = `That's okay! Many MSMEs outsource this. Are you planning to partner with a NABL accredited lab?`;
             }
         } else {
             aiResponseText = `Understood. I have logged your responses against ${standardContext.isCode}. Your Readiness Score is looking good. What about your factory layout plan documentation?`;
             score = 85;
         }
      }

      return res.json({
        readinessScore: score,
        isCode: standardContext ? standardContext.isCode : null,
        subsidyCategory: standardContext ? standardContext.subsidyCategory : null,
        checklist: standardContext ? standardContext.mandatoryEquipment.map(e => ({
          item: e.name,
          status: isYesInput ? 'green' : (Math.random() > 0.5 ? 'green' : 'red'),
          suggestion: isYesInput ? 'Verified.' : 'Mock evaluation.'
        })) : [],
        aiMessage: aiResponseText
      });
    }

    // Format chat history just once for both agents
    const formattedHistory = chatHistory.map(m => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.content
    }));

    // --- AGENT 1: THE EXTRACTOR ---
    console.log("Running Agent 1: State Extractor...");
    const extractorResponse = await hf.chatCompletion({
      model: 'meta-llama/Llama-3.1-8B-Instruct',
      messages: [
        { role: 'system', content: extractorPrompt },
        ...formattedHistory,
        { role: 'user', content: extractorPromptString + "\n\nCRITICAL: Return ONLY JSON as requested in the system prompt. No markdown."}
      ],
      max_tokens: 1000,
      temperature: 0.1, // Low temp for strictly formatted data
    });

    const extractorText = extractorResponse.choices[0].message.content;
    let extractedState = {};
    
    try {
      const jsonStr = extractorText.replace(/```json/g, '').replace(/```/g, '').trim();
      extractedState = JSON.parse(jsonStr);
      console.log("Agent 1 Successfully extracted state:", jsonStr);
    } catch (parseErr) {
      console.error('Agent 1 Failed to parse JSON. Falling back. Text:', extractorText);
      // Fallback state if LLM hallucinated
      extractedState = {
         readinessScore: 50,
         isCode: standardContext ? standardContext.isCode : "Unknown",
         subsidyCategory: standardContext ? standardContext.subsidyCategory : "Unknown",
         checklist: standardContext ? standardContext.mandatoryEquipment.map(e => ({ item: e.name, status: "yellow", suggestion: "Pending Verification" })) : []
      };
    }

    // --- AGENT 2: THE CONVERSATIONALIST ---
    console.log("Running Agent 2: Conversationalist...");
    const conversationalistPrompt = aiEngine.generateConversationalistPrompt(standardContext, extractedState);
    
    const chatResponse = await hf.chatCompletion({
      model: 'meta-llama/Llama-3.1-8B-Instruct',
      messages: [
        { role: 'system', content: conversationalistPrompt },
        ...formattedHistory,
        { role: 'user', content: message }
      ],
      max_tokens: 500,
      temperature: 0.6, // Higher temp for conversational nuance
    });

    const aiMessageText = chatResponse.choices[0].message.content.trim();
    
    // Combine state and chat 
    res.json({
        ...extractedState,
        aiMessage: aiMessageText
    });

  } catch (error) {
    console.error('AI Controller Error:', error);
    res.status(500).json({ error: 'Server error processing chat' });
  }
};
