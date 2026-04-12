import fs from "fs/promises";
import * as pdfParse from "pdf-parse";

/** extracts text from pdf files 
 * @param {string} filePath - The path to the PDF file
 * @returns {Promise<{text:string, numPages: number}>} - The extracted text from the PDF
 */
export const extractTextFromPDF = async (filePath) => {
  try {
    const dataBuffer = await fs.readFile(filePath);
    const parser = new pdfParse(new Uint8Array(dataBuffer) );
    const data = await parser.getText();
    return { 
        text: data.text, 
        numPages: data.numpages ,
        info: data.info,

    };
  }
  catch (error) {
    console.error("PDF Parsing error:", error);
    throw new Error("Failed to extract text from PDF");
  }
};

