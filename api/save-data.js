import { kv } from '@vercel/kv';

// Es recomendable usar 'edge' runtime para funciones de KV por su rapidez.
export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  // Solo permitir peticiones POST
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ message: 'Only POST method is allowed' }), { status: 405 });
  }

  try {
    // Lee los datos que el front-end envía en el cuerpo de la petición
    const { participants, partidos } = await request.json();

    // Valida que los datos existan antes de intentar guardarlos
    if (!participants || !partidos) {
        return new Response(JSON.stringify({ error: 'Missing participants or partidos data' }), { status: 400 });
    }

    // Guarda ambos arrays en Vercel KV. 'set' sobrescribe los datos existentes.
    await kv.set('participants', participants);
    await kv.set('partidos', partidos);

    return new Response(JSON.stringify({ message: 'Data saved successfully!' }), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: 'Failed to save data' }), { status: 500 });
  }
}