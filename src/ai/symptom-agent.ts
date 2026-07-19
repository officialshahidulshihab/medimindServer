export const runSymptomAgent = async (history: { role: string, content: string }[], userMessage: string): Promise<string> => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY is not defined');

  // Format history for Groq (OpenAI compatible)
  const messages = [
    { 
      role: 'system', 
      content: 'You are MediMind, a clinical AI assistant. Your role is to help users understand their symptoms through careful, structured questioning.\n\nGuidelines:\n- Ask one focused follow-up question at a time to narrow down the differential\n- After 3-4 exchanges, provide a structured assessment\n- Always include an urgency score (format: "Urgency: X/10") in your assessment\n- Always recommend a specialist (format: "See a: [Specialty]")  \n- End serious assessments with red flag warnings\n- NEVER diagnose. Always recommend professional consultation.\n- Be empathetic, clear, and concise.' 
    },
    ...history.map(t => ({ role: t.role, content: t.content })),
    { role: 'user', content: userMessage }
  ];

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant', // or any available fast model on Groq
      messages,
      temperature: 0.7,
      max_tokens: 1024,
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Groq API error: ${response.status} ${errorBody}`);
  }

  const data = await response.json() as any;
  return data.choices[0].message.content;
};
