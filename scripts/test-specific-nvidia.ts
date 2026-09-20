async function testNvidiaInference() {
  const nvidiaKey = process.env.NVIDIA_NIM_API_KEY || '';
  const modelsToTest = [
    'google/gemma-3-12b-it',
    'google/gemma-3-4b-it',
    'deepseek-ai/deepseek-v4-flash-0731',
    'meta/llama-3.3-70b-instruct'
  ];

  for (const model of modelsToTest) {
    try {
      console.log(`Testing model: ${model}...`);
      const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${nvidiaKey}`
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: 'Respond with exactly: {"status":"success","model":"' + model + '"}' }],
          temperature: 0.1,
          max_tokens: 50
        })
      });
      const data = await res.json();
      if (res.ok) {
        console.log(`✅ Model ${model} WORKS! Content:`, data.choices?.[0]?.message?.content);
        return model;
      } else {
        console.log(`❌ Model ${model} failed:`, data.detail || data.message || data);
      }
    } catch (e: any) {
      console.log(`❌ Model ${model} exception:`, e.message);
    }
  }
}

testNvidiaInference();
