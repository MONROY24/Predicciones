import { kv } from '@vercel/kv';

export default async function handler(request, response) {
  try {
    // Obtiene los participantes y partidos desde Vercel KV
    // Si no existen, devuelve un array vacío para evitar errores en el front-end.
    const participants = await kv.get('participants') || [];
    const partidos = await kv.get('partidos') || [];
    
    // Envía los datos como respuesta en formato JSON
    return response.status(200).json({ participants, partidos });
  } catch (error) {
    console.error(error);
    return response.status(500).json({ error: 'Failed to fetch data' });
  }
}