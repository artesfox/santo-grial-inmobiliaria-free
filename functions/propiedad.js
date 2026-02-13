export async function onRequest(context) {
  const url = new URL(context.request.url);
  const idBusqueda = url.searchParams.get('id');

  // 1. Validar si enviaron un ID
  if (!idBusqueda) {
    return new Response("Error: No se proporcionó un ID de propiedad.", { status: 400 });
  }

  // 2. Tu URL de Google Sheets en formato CSV (La que ya tienes de Artefox)
  const SHEET_URL = "https://docs.google.com/spreadsheets/d/1VctscCRyoQ-sdWa1vlGG0xsjjGY5Jznw6LaK20syz3g/export?format=csv";

  try {
    const response = await fetch(SHEET_URL);
    const csvText = await response.text();
    
    // 3. Procesar las filas del CSV
    const filas = csvText.split('\n').map(fila => {
      // Separar por comas respetando el texto entre comillas
      return fila.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
    });

    // 4. Buscar la propiedad por ID (Asumiendo que el ID está en la Columna A)
    // Limpiamos espacios y comillas para que la búsqueda sea exacta
    const propiedad = filas.find(f => f[0].replace(/"/g, '').trim() === idBusqueda.trim());

    if (!propiedad) {
      return new Response(`Propiedad con ID ${idBusqueda} no encontrada en el sistema.`, { status: 404 });
    }

    // MAPEO DE DATOS (Ajusta los números según el orden de tus columnas en Excel)
    const titulo = propiedad[1]?.replace(/"/g, '') || "Sin título";
    const precio = propiedad[2]?.replace(/"/g, '') || "Consultar precio";
    const descripcion = propiedad[3]?.replace(/"/g, '') || "Sin descripción disponible.";
    const imagenDestacada = propiedad[4]?.replace(/"/g, '') || "https://via.placeholder.com/800x600?text=Sin+Imagen";

    // 5. Entregar el HTML con los datos inyectados
    return new Response(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Artefox - ${titulo}</title>
          <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
              .card { border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); background: white; }
              .foto-principal { width: 100%; height: 400px; object-fit: cover; }
              .contenido { padding: 30px; }
              .precio { color: #27ae60; font-size: 24px; font-weight: bold; margin-bottom: 10px; }
              h1 { margin-top: 0; color: #2c3e50; }
              .btn-contacto { display: inline-block; background: #2980b9; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          </style>
      </head>
      <body>
          <div class="card">
              <img src="${imagenDestacada}" alt="${titulo}" class="foto-principal">
              <div class="contenido">
                  <div class="precio">${precio}</div>
                  <h1>${titulo}</h1>
                  <p>${descripcion}</p>
                  <a href="#" class="btn-contacto">Contactar Agente</a>
              </div>
          </div>
          <p style="text-align:center; font-size: 12px; color: #888; margin-top: 30px;">
            Propiedad ID: ${idBusqueda} | Generado por el Santo Grial de Artefox
          </p>
      </body>
      </html>
    `, { headers: { "content-type": "text/html;charset=UTF-8" } });

  } catch (error) {
    return new Response("Error técnico al conectar con los datos: " + error.message, { status: 500 });
  }
}
