async function checkNvidiaModels() {
  const nvidiaKey = process.env.NVIDIA_NIM_API_KEY || '';
  try {
    const res = await fetch('https://integrate.api.nvidia.com/v1/models', {
      headers: { 'Authorization': `Bearer ${nvidiaKey}` }
    });
    const data = await res.json();
    console.log(`Found ${data.data?.length || 0} models on NVIDIA NIM:`);
    const modelIds = (data.data || []).map((m: any) => m.id).slice(0, 20);
    console.log(modelIds);
  } catch (e: any) {
    console.log('Error fetching NVIDIA models:', e.message);
  }
}

checkNvidiaModels();
