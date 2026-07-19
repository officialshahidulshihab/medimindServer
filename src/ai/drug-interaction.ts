async function resolveMedications(medications: string[]): Promise<{
  resolved: Array<{ original: string; generic: string; wasResolved: boolean }>;
  unresolvable: string[];
}> {
  const apiKey = process.env.GROQ_API_KEY;

  const prompt = `You are a global pharmaceutical database with knowledge of 
brand names, trade names, and generic names from all countries including 
Bangladesh, India, USA, UK, and Southeast Asia.

For each medication name provided, identify:
1. If it is a real medication (brand OR generic)
2. Its standard generic/INN (International Nonproprietary Name)

Medications: ${medications.join(', ')}

Respond ONLY with JSON:
{
  "medications": [
    {
      "original": "Ceftron",
      "generic": "Ceftriaxone",
      "isReal": true,
      "wasResolved": true
    },
    {
      "original": "Napa",
      "generic": "Paracetamol", 
      "isReal": true,
      "wasResolved": true
    },
    {
      "original": "Aspirin",
      "generic": "Aspirin",
      "isReal": true,
      "wasResolved": false
    },
    {
      "original": "oiloil",
      "generic": "",
      "isReal": false,
      "wasResolved": false
    }
  ]
}

Rules:
- Bangladesh/India brand names: Napa=Paracetamol, Monas=Montelukast, 
  Ceftron=Ceftriaxone, Seclo=Omeprazole, Amdocal=Amlodipine,
  Tafnil=Clomipramine, Naprosyn=Naproxen, Fimoxyl=Amoxicillin
- If generic name IS the common name (Aspirin, Ibuprofen), wasResolved=false
- If unrecognizable as any medication anywhere: isReal=false, generic=""
- Output ONLY the JSON object. No markdown. No explanation.`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'You are a pharmaceutical API. Output only valid JSON. Never use markdown.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.0,
      response_format: { type: 'json_object' },
      max_tokens: 800,
    }),
  });

  const data = await response.json() as any;
  const parsed = JSON.parse(data.choices[0].message.content);

  const resolved: Array<{ original: string; generic: string; wasResolved: boolean }> = [];
  const unresolvable: string[] = [];

  for (const item of parsed.medications) {
    if (!item.isReal || !item.generic) {
      unresolvable.push(item.original);
    } else {
      resolved.push({
        original: item.original,
        generic: item.generic,
        wasResolved: item.wasResolved,
      });
    }
  }

  return { resolved, unresolvable };
}

export const runDrugInteractionCheck = async (
  medications: string[]
): Promise<{
  interactionMatrix: Array<{
    drug1: string;
    drug2: string;
    severity: 'low' | 'moderate' | 'high' | 'severe';
    description: string;
  }>;
  dangerFlags: string[];
  overallRiskLevel: 'low' | 'moderate' | 'high' | 'severe';
  resolvedMedications: Array<{ original: string; generic: string; wasResolved: boolean }>;
}> => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY is not defined');

  // Step 1: Resolve trade names to generics + validate in one AI call
  const { resolved, unresolvable } = await resolveMedications(medications);

  if (unresolvable.length > 0) {
    throw new Error(`INVALID_MEDICATIONS:${unresolvable.join(',')}`);
  }

  if (resolved.length < 2) {
    throw new Error('At least 2 valid medications are required.');
  }

  // Use generic names for interaction check
  const genericNames = resolved.map(r => r.generic);

  // Continue with valid medications only
  // Build all drug pairs explicitly so AI knows exactly what to analyze
  const pairs: string[] = [];
  for (let i = 0; i < genericNames.length; i++) {
    for (let j = i + 1; j < genericNames.length; j++) {
      pairs.push(`${genericNames[i]} + ${genericNames[j]}`);
    }
  }

  const prompt = `You are a clinical pharmacology AI. Analyze drug interactions for: ${genericNames.join(', ')}.

Drug pairs to analyze: ${pairs.join(' | ')}

You MUST respond with ONLY a valid JSON object. No explanation. No markdown. No extra text.

Required format:
{
  "interactionMatrix": [
    {
      "drug1": "EXACT_DRUG_NAME",
      "drug2": "EXACT_DRUG_NAME", 
      "severity": "Low",
      "description": "Brief clinical description of the interaction"
    }
  ],
  "dangerFlags": ["flag1", "flag2"],
  "overallRiskLevel": "Low"
}

Rules:
- interactionMatrix MUST be an array (not an object)
- severity MUST be exactly one of: Low, Moderate, High, Severe (capitalized)
- overallRiskLevel MUST be exactly one of: Low, Moderate, High, Severe (capitalized)  
- Include one entry per drug pair listed above
- dangerFlags is an array of strings (can be empty array [])
- drug1 and drug2 must match the medication names provided exactly`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',  // upgraded from 3.1-8b-instant
      messages: [
        {
          role: 'system',
          content: 'You are a pharmacology API. You output only valid JSON. Never use markdown. Never add explanation.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.0,  // zero temperature = maximum consistency
      response_format: { type: 'json_object' },
      max_tokens: 1500,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Groq API error: ${response.status} ${errorBody}`);
  }

  const data = await response.json() as any;
  const content = data.choices[0].message.content;

  let parsed: any;
  try {
    parsed = JSON.parse(content);
  } catch {
    console.error('Failed to parse Groq JSON:', content);
    throw new Error('AI returned invalid JSON. Please try again.');
  }

  // Normalize and validate — never trust the AI blindly
  const matrix = Array.isArray(parsed.interactionMatrix)
    ? parsed.interactionMatrix
    : Object.entries(parsed.interactionMatrix || {}).map(([key, val]: [string, any]) => {
        const [drug1, drug2] = key.split(/[+&,]/).map((s: string) => s.trim());
        return {
          drug1: drug1 || genericNames[0],
          drug2: drug2 || genericNames[1],
          severity: normalizeRisk(val?.severity || val?.risk || val?.risk_level || 'Low'),
          description: val?.description || val?.interaction || val?.details || 'Interaction detected.',
        };
      });

  return {
    interactionMatrix: matrix.map((item: any) => ({
      drug1: item.drug1 || '',
      drug2: item.drug2 || '',
      severity: normalizeRisk(item.severity),
      description: item.description || 'See a pharmacist for details.',
    })),
    dangerFlags: Array.isArray(parsed.dangerFlags) ? parsed.dangerFlags : [],
    overallRiskLevel: normalizeRisk(parsed.overallRiskLevel || 'Low'),
    resolvedMedications: resolved,
  };
};

function normalizeRisk(val: string): 'low' | 'moderate' | 'high' | 'severe' {
  if (!val || typeof val !== 'string') return 'low';
  const map: Record<string, 'low' | 'moderate' | 'high' | 'severe'> = {
    low: 'low', moderate: 'moderate', high: 'high', severe: 'severe',
    Low: 'low', Moderate: 'moderate', High: 'high', Severe: 'severe',
    medium: 'moderate', critical: 'severe', none: 'low', minimal: 'low',
  };
  return map[val.trim()] ?? 'low';
}
