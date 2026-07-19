const GEMINI_MODEL = 'gemini-flash-latest';
const GEMINI_API_VERSION = 'v1beta';

export const runDocumentIntelligence = async (
  fileUrl: string,
  fileName: string = ''
): Promise<{
  summary: string;
  extractedData: Record<string, string>;
  abnormalFlags: string[];
  actionItems: string[];
}> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not defined');

  // Step 1: Fetch the file from Cloudinary and convert to base64
  const fileResponse = await fetch(fileUrl);
  if (!fileResponse.ok) {
    throw new Error(`Failed to fetch document from Cloudinary: ${fileResponse.status}`);
  }
  const arrayBuffer = await fileResponse.arrayBuffer();
  const sizeInMB = arrayBuffer.byteLength / (1024 * 1024);
  if (sizeInMB > 18) {
    throw new Error('File too large for AI analysis. Please upload a file under 18MB.');
  }
  const base64Data = Buffer.from(arrayBuffer).toString('base64');

  // Step 2: Determine MIME type from URL or fileName
  const url = fileUrl.toLowerCase();
  const name = fileName.toLowerCase();
  let mimeType = 'application/pdf'; // default
  const contentType = fileResponse.headers.get('content-type') ?? '';
  if (contentType.includes('pdf')) {
    mimeType = 'application/pdf';
  } else if (contentType.includes('jpeg')) {
    mimeType = 'image/jpeg';
  } else if (contentType.includes('png')) {
    mimeType = 'image/png';
  } else if (url.includes('.jpg') || url.includes('.jpeg') || name.endsWith('.jpg') || name.endsWith('.jpeg')) {
    mimeType = 'image/jpeg';
  } else if (url.includes('.png') || name.endsWith('.png')) {
    mimeType = 'image/png';
  } else if (url.includes('.webp') || name.endsWith('.webp')) {
    mimeType = 'image/webp';
  } else if (url.includes('.gif') || name.endsWith('.gif')) {
    mimeType = 'image/gif';
  }

  // Step 3: Build Gemini request with inline file data
  const prompt = `You are a clinical AI assistant analyzing a medical document.
Extract and analyze all medical information from this document.

Respond ONLY with a valid JSON object in this exact format:
{
  "summary": "2-3 sentence plain English summary of what this document shows",
  "extractedData": {
    "key metric name": "value with unit",
    "another metric": "value"
  },
  "abnormalFlags": [
    "Specific abnormal finding 1",
    "Specific abnormal finding 2"
  ],
  "actionItems": [
    "Specific recommended action 1",
    "Specific recommended action 2"
  ]
}

Rules:
- summary: written for a patient, no medical jargon
- extractedData: key lab values, vitals, or findings as key-value pairs
- abnormalFlags: ONLY values outside normal range or concerning findings
  (empty array [] if everything is normal)
- actionItems: specific next steps the patient should take
- If this is not a medical document, still analyze what you can see
- Respond ONLY with the JSON. No markdown. No explanation.`;

  const requestBody = {
    contents: [{
      parts: [
        {
          inlineData: {
            mimeType,
            data: base64Data,
          }
        },
        { text: prompt }
      ]
    }],
    generationConfig: {
      temperature: 0.1,
    }
  };

  const response = await fetch(
    `https://generativelanguage.googleapis.com/${GEMINI_API_VERSION}/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Gemini API error: ${response.status} ${errorBody}`);
  }

  const data = await response.json() as any;
  const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!textContent) {
    throw new Error('Gemini returned empty response');
  }

  try {
    let cleanText = textContent.trim();
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.substring(7);
    } else if (cleanText.startsWith('```')) {
      cleanText = cleanText.substring(3);
    }
    if (cleanText.endsWith('```')) {
      cleanText = cleanText.substring(0, cleanText.length - 3);
    }
    cleanText = cleanText.trim();
    const parsed = JSON.parse(cleanText);
    return {
      summary: parsed.summary || 'Analysis complete.',
      extractedData: parsed.extractedData || {},
      abnormalFlags: Array.isArray(parsed.abnormalFlags) ? parsed.abnormalFlags : [],
      actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems : [],
    };
  } catch {
    console.error('Failed to parse Gemini output:', textContent);
    throw new Error('Invalid JSON received from Gemini');
  }
};
