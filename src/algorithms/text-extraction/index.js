/**
 * Text Extraction Module
 */
import * as pdfjsLib from 'pdfjs-dist';
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

/**
 * Extract text from PDF buffer
 * @param {ArrayBuffer} arrayBuffer - PDF file buffer
 * @returns {Promise<string>} Extracted text
 */
export async function extractPdfText(arrayBuffer) {
  const typedArray = new Uint8Array(arrayBuffer);
  const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;
  let text = "";
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    
    // Group items by line (y position)
    let lastY = null;
    let line = [];
    
    content.items.forEach(item => {
      if (lastY === null || Math.abs(item.transform[5] - lastY) < 2) {
        line.push(item.str);
      } else {
        text += line.join(" ") + "\n";
        line = [item.str];
      }
      lastY = item.transform[5];
    });
    
    if (line.length) {
      text += line.join(" ") + "\n";
    }
  }
  
  return text;
} 