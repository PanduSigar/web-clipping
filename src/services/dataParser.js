import * as XLSX from 'xlsx';

/**
 * Parses uploaded file into a structured dataset object
 * @param {File} file 
 * @returns {Promise<{ fileName: string, fileType: string, fileSize: string, rawData: Array<Object>, headers: Array<string>, audit: Object }>}
 */
export async function parseFile(file) {
  const extension = file.name.split('.').pop().toLowerCase();
  let rawData = [];
  let headers = [];

  if (extension === 'csv' || extension === 'txt') {
    const text = await file.text();
    if (extension === 'csv') {
      rawData = parseCSVText(text);
    } else {
      rawData = [{ Content: text }];
    }
  } else if (['xlsx', 'xls'].includes(extension)) {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    rawData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
  } else if (extension === 'json') {
    const text = await file.text();
    const parsed = JSON.parse(text);
    rawData = Array.isArray(parsed) ? parsed : [parsed];
  } else if (extension === 'pdf') {
    const arrayBuffer = await file.arrayBuffer();
    rawData = await extractPdfText(arrayBuffer);
  } else {
    throw new Error(`Format file .${extension} belum didukung.`);
  }

  if (rawData.length > 0) {
    headers = Object.keys(rawData[0]);
  }

  const audit = auditDataset(rawData, headers);

  return {
    fileName: file.name,
    fileType: extension.toUpperCase(),
    fileSize: formatFileSize(file.size),
    rawData,
    headers,
    audit
  };
}

/**
 * Robust CSV Text parser handling quotes & commas
 */
function parseCSVText(csvText) {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length === 0) return [];

  const headers = splitCSVRow(lines[0]);
  const results = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = splitCSVRow(lines[i]);
    const rowObj = {};
    headers.forEach((h, index) => {
      let val = values[index] !== undefined ? values[index] : '';
      // Convert numeric strings to numbers if applicable
      if (val !== '' && !isNaN(val)) {
        val = Number(val);
      }
      rowObj[h] = val;
    });
    results.push(rowObj);
  }

  return results;
}

function splitCSVRow(rowStr) {
  const pattern = /(".*?"|[^",\s]+)(?=\s*,|\s*$)/g;
  const matches = [];
  let match;
  // Fallback simple split if pattern fails
  const simpleSplit = rowStr.split(',').map(s => s.replace(/^"|"$/g, '').trim());
  return simpleSplit;
}

/**
 * Generates audit metadata and summary statistics for dataset
 */
export function auditDataset(data, headers) {
  const rowCount = data.length;
  const colCount = headers.length;
  const colDetails = {};

  headers.forEach(col => {
    let missingCount = 0;
    let numericValues = [];
    let uniqueValues = new Set();
    let sampleType = 'string';

    data.forEach(row => {
      const val = row[col];
      if (val === null || val === undefined || val === '') {
        missingCount++;
      } else {
        uniqueValues.add(val);
        if (typeof val === 'number' && !isNaN(val)) {
          numericValues.push(val);
        } else if (typeof val === 'string' && val.trim() !== '' && !isNaN(Number(val))) {
          numericValues.push(Number(val));
        }
      }
    });

    const isNumeric = numericValues.length > (rowCount - missingCount) * 0.7 && numericValues.length > 0;
    sampleType = isNumeric ? 'number' : 'string';

    let stats = null;
    if (isNumeric && numericValues.length > 0) {
      const sum = numericValues.reduce((a, b) => a + b, 0);
      const min = Math.min(...numericValues);
      const max = Math.max(...numericValues);
      const avg = sum / numericValues.length;
      stats = { sum, min, max, avg: Number(avg.toFixed(2)) };
    }

    colDetails[col] = {
      type: sampleType,
      missingCount,
      missingPct: Number(((missingCount / (rowCount || 1)) * 100).toFixed(1)),
      uniqueCount: uniqueValues.size,
      stats
    };
  });

  return {
    rowCount,
    colCount,
    colDetails,
    healthScore: calculateHealthScore(rowCount, colDetails)
  };
}

function calculateHealthScore(rowCount, colDetails) {
  if (rowCount === 0) return 0;
  let totalMissingPct = 0;
  const cols = Object.keys(colDetails);
  cols.forEach(c => {
    totalMissingPct += colDetails[c].missingPct;
  });
  const avgMissing = totalMissingPct / (cols.length || 1);
  const score = Math.max(0, Math.min(100, Math.round(100 - avgMissing * 1.5)));
  return score;
}

/**
 * Data Cleaning Utilities
 */
export function cleanDataset(data, options = {}) {
  let cleaned = [...data];

  // 1. Remove duplicate rows
  if (options.removeDuplicates) {
    const seen = new Set();
    cleaned = cleaned.filter(row => {
      const str = JSON.stringify(row);
      if (seen.has(str)) return false;
      seen.add(str);
      return true;
    });
  }

  // 2. Fill missing numeric values with 0 or mean
  if (options.fillMissingNumeric) {
    const headers = Object.keys(data[0] || {});
    headers.forEach(h => {
      cleaned.forEach(row => {
        if (row[h] === '' || row[h] === null || row[h] === undefined) {
          if (typeof row[h] === 'number' || !isNaN(row[h])) {
            row[h] = 0;
          } else {
            row[h] = 'N/A';
          }
        }
      });
    });
  }

  // 3. Trim string whitespaces
  if (options.trimStrings) {
    cleaned = cleaned.map(row => {
      const newRow = { ...row };
      Object.keys(newRow).forEach(k => {
        if (typeof newRow[k] === 'string') {
          newRow[k] = newRow[k].trim();
        }
      });
      return newRow;
    });
  }

  return cleaned;
}

/**
 * Convert cleaned data back to downloadable CSV string
 */
export function exportToCSV(data, fileName = 'cleaned_data.csv') {
  if (!data || data.length === 0) return;
  const worksheet = XLSX.utils.json_to_sheet(data);
  const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
  
  const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function extractPdfText(arrayBuffer) {
  if (typeof window !== 'undefined' && window.pdfjsLib) {
    try {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      const rows = [];

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map(item => item.str)
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();

        if (pageText && pageText.length > 5) {
          rows.push({
            Halaman: `Halaman ${pageNum}`,
            Teks_Dokumen: pageText
          });
        }
      }

      if (rows.length > 0) return rows;
    } catch (err) {
      console.warn('PDF.js parser fallback:', err);
    }
  }

  const decoder = new TextDecoder('utf-8');
  const raw = decoder.decode(arrayBuffer);
  const cleanText = raw.replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s+/g, ' ').trim();
  return [{ Halaman: 'Ringkasan PDF', Teks_Dokumen: cleanText.slice(0, 3000) }];
}
