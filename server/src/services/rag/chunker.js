

function chunkText(text, chunkSize, overlap) {
  const cleaned = text.replace(/\s+/g, ' ').trim();

  if (cleaned.length === 0) {
    return [];
  }

  const chunks = [];
  let start = 0;

  while (start < cleaned.length) {
    const end = Math.min(start + chunkSize, cleaned.length);
    chunks.push(cleaned.slice(start, end));

    if (end === cleaned.length) break;
    start = end - overlap;
  }

  return chunks;
}

module.exports = chunkText;