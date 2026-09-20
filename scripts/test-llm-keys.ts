import { GoogleGenAI } from '@google/genai';

async function testApis() {
  const geminiKey = process.env.GEMINI_API_KEY || '';
  const nvidiaKey = process.env.NVIDIA_NIM_API_KEY || '';

  console.log('--- 1. Testing Google Gemini API ---');
  try {
    const ai = new GoogleGenAI({ apiKey: geminiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Hello, respond with {"status": "ok"} in JSON',
    });
    console.log('✅ Gemini API Success! Response:', response.text);
  } catch (e: any) {
    console.log('❌ Gemini API Error:', e.message);
  }

  console.log('\n--- 2. Testing NVIDIA NIM API ---');
  try {
    const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${nvidiaKey}`
      },
      body: JSON.stringify({
        model: 'meta/llama-3.1-70b-instruct',
        messages: [{ role: 'user', content: 'Respond with {"status": "ok"} in JSON' }],
        temperature: 0.1,
        max_tokens: 50
      })
    });
    const data = await res.json();
    if (res.ok) {
      console.log('✅ NVIDIA NIM Success! Response:', data.choices?.[0]?.message?.content);
    } else {
      console.log('❌ NVIDIA NIM Error:', data);
    }
  } catch (e: any) {
    console.log('❌ NVIDIA NIM Exception:', e.message);
  }
}

testApis();
