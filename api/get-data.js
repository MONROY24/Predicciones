import { getAll } from '@vercel/edge-config';

export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  try {
    // Lee 'participants' y 'partidos' de Edge Config al mismo tiempo.
    const data = await getAll(['participants', 'partidos']);
    
    // Si no existen, devuelve arrays vacíos para que la app no falle.
    const responsePayload = {
      participants: data.participants || [],
      partidos: data.partidos || [],
    };

    return new Response(JSON.stringify(responsePayload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching from Edge Config:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch data' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
