const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

const pdfDir = path.join(__dirname, '..', 'pdf-rag');
const outputFile = path.join(__dirname, '..', 'parsed_bis_data.json');

async function extractPdfs() {
  try {
    const files = fs.readdirSync(pdfDir).filter(f => f.endsWith('.pdf'));
    const parsedData = [];

    for (const file of files) {
      console.log(`Parsing ${file}...`);
      const dataBuffer = fs.readFileSync(path.join(pdfDir, file));
      const data = await pdfParse(dataBuffer);
      parsedData.push({
        filename: file,
        text: data.text.trim()
      });
    }

    fs.writeFileSync(outputFile, JSON.stringify(parsedData, null, 2));
    console.log(`✅ Successfully extracted ${files.length} PDFs to parsed_bis_data.json`);
  } catch (error) {
    console.error('❌ Error parsing PDFs:', error);
  }
}

extractPdfs();
