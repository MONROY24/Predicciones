export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ message: 'Only POST method is allowed' }), { status: 405 });
  }

  // Obtenemos las variables de entorno de forma segura.
  const edgeConfigId = process.env.EDGE_CONFIG.split('_')[1];
  const apiToken = process.env.VERCEL_API_TOKEN;

  if (!apiToken || !edgeConfigId) {
    return new Response(JSON.stringify({ error: 'Missing Vercel API Token or Edge Config ID' }), { status: 500 });
  }

  try {
    const { participants, partidos } = await request.json();

    const response = await fetch(`https://api.vercel.com/v1/edge-config/${edgeConfigId}/items`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [
          {
            operation: 'update',
            key: 'participants',
            value: participants,
          },
          {
            operation: 'update',
            key: 'partidos',
            value: partidos,
          },
        ],
      }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error.message);
    }

    return new Response(JSON.stringify({ message: 'Data saved successfully!' }), { status: 200 });
  } catch (error) {
    console.error('Error saving to Edge Config:', error);
    return new Response(JSON.stringify({ error: `Failed to save data: ${error.message}` }), { status: 500 });
  }
}
