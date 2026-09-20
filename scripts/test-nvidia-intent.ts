async function testNvidiaOrderIntent() {
  const nvidiaKey = process.env.NVIDIA_NIM_API_KEY || '';
  const systemPrompt = `You are the natural-language understanding component of KiranaPilot. Extract structured JSON order intent from customer messages.
JSON Schema:
{
  "intent": "PLACE_ORDER" | "REORDER_USUAL" | "CONFIRM_SUBSTITUTION",
  "confidence": number,
  "items": [
    {
      "raw_name": string,
      "brand": string | null,
      "pack_size": string | null,
      "quantity": number
    }
  ]
}
Respond with raw JSON only.`;

  const userMessage = 'Bhaiya 2 packet Fortune mustard oil aur 5kg Aashirvaad atta bhej do';

  try {
    const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${nvidiaKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-ai/deepseek-v4-flash-0731',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.1,
        max_tokens: 500
      })
    });

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    console.log('Raw content from NVIDIA NIM:', content);
    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);
    console.log('✅ Successfully parsed JSON from NVIDIA NIM:', JSON.stringify(parsed, null, 2));
  } catch (e: any) {
    console.error('Error testing NVIDIA NIM:', e.message);
  }
}

testNvidiaOrderIntent();
