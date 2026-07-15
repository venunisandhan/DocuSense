
const pdfParse = require('pdf-parse');

const mammoth = require('mammoth');

async function extractText(buffer, mimeType) {
  switch (mimeType) {
    case 'application/pdf': {
      const result = await pdfParse(buffer);
      return result.text;
    }
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    }
    case 'text/plain':
      return buffer.toString('utf-8');
    default:
      throw new Error(`Unsupported mime type for text extraction: ${mimeType}`);
  }
}

module.exports = extractText;