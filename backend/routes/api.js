const express = require('express');
const router = express.Router();
const { upload } = require('../config/cloudinary');
const aiController = require('../controllers/aiController');
const pdfParse = require('pdf-parse');

// Upload Factory Manual to Cloudinary
router.post('/upload', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    // Return the secure Cloudinary URL or a dummy local URL if in memory mode
    const finalUrl = req.file.path || 'https://dummy-local-storage.com/simulated-upload.pdf';
    
    let extractedText = "";
    try {
      if (req.file.buffer) {
        // Fallback Mock mode (Memory Storage) allows direct buffer access
        const pdfData = await pdfParse(req.file.buffer);
        extractedText = pdfData.text;
      } else if (req.file.path) {
        // Download from Cloudinary URL and parse
        const response = await fetch(req.file.path);
        const arrayBuffer = await response.arrayBuffer();
        const pdfData = await pdfParse(Buffer.from(arrayBuffer));
        extractedText = pdfData.text;
      }
    } catch (parseErr) {
       console.log('Document text parsing skipped or failed:', parseErr.message);
    }
    
    res.json({ 
      fileUrl: finalUrl, 
      extractedText: extractedText.substring(0, 10000), // Avoid max_tokens LLM explosion
      message: 'Upload successful. Analying document context for BIS compliance.'
    });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ error: 'Failed to upload document' });
  }
});

// Process Chat with AI Auditor
router.post('/chat', aiController.processChat);

// (Optional) Calculate Subsidy Logic
router.post('/subsidy', (req, res) => {
  const { category, estimatedFee } = req.body;
  if (category === 'Micro') {
    res.json({ originalFee: estimatedFee, finalFee: estimatedFee * 0.2, concession: '80%' });
  } else {
    res.json({ originalFee: estimatedFee, finalFee: estimatedFee, concession: '0%' });
  }
});

module.exports = router;
