
const pdfParse = require('pdf-parse');

const mammoth = require('mammoth');

async function extractText(buffer, mimeType) {
  switch (mimeType) {
    case 'application/pdf': {
      try {
        const result = await pdfParse(buffer);
        return result.text;
      } catch (err) {
        if (err.message.includes('bad XRef entry') || err.message.includes('Invalid PDF')) {
          const { PDFDocument } = require('pdf-lib');
          const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
          const repairedBytes = await pdfDoc.save();
          const result = await pdfParse(Buffer.from(repairedBytes));
          return result.text;
        }
        throw err;
      }
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