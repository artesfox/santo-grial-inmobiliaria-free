export async function onRequest(context) {
    const SHEET_URL = "https://docs.google.com/spreadsheets/d/1VctscCRyoQ-sdWa1vlGG0xsjjGY5Jznw6LaK20syz3g/export?format=csv";

    try {
        const res = await fetch(SHEET_URL);
        const csv = await res.text();
        const filas = csv.split(/\r?\n/).filter(f => f.trim() !== "");

        // 1. PROCESAR CABECERAS
        const cabecera = filas[0].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(h => h.replace(/^"|"$/g, '').trim().toUpperCase());
        
        const idx = {
            id: cabecera.indexOf("ID"),
            tipo: cabecera.indexOf("TIPO"),
            operacion: cabecera.indexOf("OPERACIÓN"),
            precio: cabecera.indexOf("PRECIO"),
            moneda: cabecera.indexOf("MONEDA"),
            habs: cabecera.indexOf("HABITACIONES"),
            banos: cabecera.indexOf("BAÑOS"),
            estacionamiento: cabecera.indexOf("ESTACIONAMIENTO"),
            area: cabecera.indexOf("ÁREA CONSTRUIDA"),
            zona: cabecera.indexOf("ZONA"),
            dir: cabecera.indexOf("DIRECCIÓN"),
            foto: cabecera.indexOf("FOTO URL 1"),
            titulo: cabecera.indexOf("TÍTULO"),
            // Campos de Configuración (Fila 2)
            logo: cabecera.indexOf("FOTO URL 1"), // Usaremos el mismo mapeo o el que definas
            whatsapp: cabecera.indexOf("TELÉFONO"),
        };

        // 2. EXTRAER CONFIGURACIÓN (Fila 2)
        const datoConfig = filas[1].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        const config = {
            nombre: datoConfig[idx.titulo].replace(/^"|"$/g, '') || "Mi Inmobiliaria",
            logo: datoConfig[idx.foto].replace(/^"|"$/g, ''),
            whatsapp: datoConfig[idx.whatsapp].replace(/^"|"$/g, ''),
            direccion: datoConfig[idx.dir].replace(/^"|"$/g, '') + " - " + datoConfig[idx.zona].replace(/^"|"$/g, '')
        };

        // 3. GENERAR HTML DE LAS TARJETAS (SSR para Google)
        let htmlTarjetas = "";
        for (let i = 1; i < filas.length; i++) {
            const dato = filas[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            if (dato.length < 5) continue;

            const limpiar = (val) => val ? val.replace(/^"|"$/g, '').trim() : "";
            const p = {
                id: limpiar(dato[idx.id]),
                tipo: limpiar(dato[idx.tipo]),
                operacion: limpiar(dato[idx.operacion]),
                precio: limpiar(dato[idx.precio]) || "0",
                moneda: limpiar(dato[idx.moneda]) || "$",
                habs: limpiar(dato[idx.habs]),
                banos: limpiar(dato[idx.banos]),
                area: limpiar(dato[idx.area]),
                parking: limpiar(dato[idx.estacionamiento]),
                zona: limpiar(dato[idx.zona]),
                dir: limpiar(dato[idx.dir]),
                foto: limpiar(dato[idx.foto]),
                titulo: limpiar(dato[idx.titulo])
            };

            htmlTarjetas += `
                <article class="item-propiedad" 
                         style="cursor:pointer" 
                         onclick="window.location.href='./propiedad?id=${p.id}'"
                         data-tipo="${p.tipo}" 
                         data-operacion="${p.operacion}" 
                         data-precio="${p.precio}" 
                         data-ubicacion="${p.dir} ${p.zona}">
                    <div class="contenedor-img">
                        <img src="${p.foto}" loading="lazy" onerror="this.src='https://via.placeholder.com/400x300?text=Cargando...';">
                    </div>
                    <h2>${p.titulo || (p.operacion + ' en ' + p.zona)}</h2>
                    <span class="direccion"><i class="houzez-icon icon-pin me-2"></i> ${p.dir} - ${p.zona}</span>
                    <span class="detalle">
                        ${p.habs && p.habs !== "0" ? `<span class="dormitorios"><i class="houzez-icon icon-hotel-double-bed-1"></i> ${p.habs}</span>` : ''}
                        ${p.banos && p.banos !== "0" ? `<span class="banos"><i class="houzez-icon icon-bathroom-shower-1"></i> ${p.banos}</span>` : ''}
                        ${p.area && p.area !== "0" ? `<span class="area"><i class="houzez-icon icon-ruler-triangle"></i> ${p.area} m²</span>` : ''}
                        ${p.parking && p.parking !== "0" ? `<span class="garaje"><i class="houzez-icon icon-car-1 me-2"></i> ${p.parking}</span>` : ''}
                    </span>
                    <span class="precio">${p.moneda} ${Number(p.precio).toLocaleString('es-CO')}</span>
                </article>`;
        }

        // 4. RETORNAR EL HTML FINAL
        return new Response(buildPage(config, htmlTarjetas, filas.length - 1), {
            headers: { "Content-Type": "text/html;charset=UTF-8" }
        });

    } catch (e) {
        return new Response("Error: " + e.message, { status: 500 });
    }
}

function buildPage(config, tarjetas, total) {
    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${config.nombre} - Catálogo Inmobiliario</title>
    <link rel="preload" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">
    <link rel="stylesheet" type="text/css" href="css/inmobiliaria.css">
    <link rel="stylesheet" type="text/css" href="css/icons.css">
    <style>
        body{ background: var(--color-gris-1); font-family: 'Montserrat', sans-serif; }
        .relleno-5 { padding: 10px 20px 55px 20px; }
        .houzez-icon.icon-Filter-Faders{ font-size: 30px; }
    </style>
</head>
<body>
    <header class="header">
        <div class="contenedor-header">
            <h1 class="logo"><a href="index.html"><img src="${config.logo}" alt="Logo ${config.nombre}"> ${config.nombre}</a></h1>
            <button class="menu-toggle"><span></span><span></span><span></span></button>
            <nav class="menu">
                <ul>
                    <li><a href="index">Propiedades</a></li>
                    <li><a href="?nosotros">Nosotros</a></li>
                    <li><a href="https://wa.me/${config.whatsapp}" class="cta-boton"><i class="houzez-icon icon-messaging-whatsapp"></i> Contacto</a></li>
                </ul>
            </nav>
        </div>
    </header>

    <section class="banner-inicio">
        <div class="contenedor">
            <h1>Encuentra <br>tu próximo hogar en ${config.nombre}</h1>
        </div>
    </section>

    <button type="button" class="disparador-movil" id="abrir-filtros">
        <i class="houzez-icon icon-Filter-Faders"></i> Buscar y Filtrar
    </button>

    <form id="formulario-busqueda" class="barra-busqueda">
        <div class="item-busqueda">
            <label>Ubicación</label>
            <input type="text" name="ubicacion" placeholder="Ubicación, direccion..">
        </div>
        <div class="item-busqueda">
            <label>Operación</label>
            <select name="operacion">
                <option value="">Cualquiera</option>
                <option value="Venta">Venta</option>
                <option value="Alquiler">Alquiler</option>
            </select>
        </div>
        <div class="item-busqueda">
            <label>Inmueble</label>
            <select name="tipo">
                <option value="">Todos</option>
                <option value="Apartamento">Apartamento</option>
                <option value="Casa">Casa</option>
                <option value="Oficina">Oficina</option>
            </select>
        </div>
        <button type="submit" class="boton-buscar">Buscar</button>
    </form>

    <main>
        <section class="propiedades relleno-5">
            <div class="contenedor">
                <div class="fila-info">
                    <p class="conteo-propiedades"><span id="total-propiedades">${total}</span> Propiedades encontradas</p>
                </div>
                <div class="grid-propiedades" id="listado-propiedades">
                    ${tarjetas}
                </div>
            </div>
        </section>
        
        <section id="nosotros" class="servicios relleno-1">
            <div class="contenedor">
                <h2>Servicios profesionales en ${config.nombre}</h2>
                <div class="grid-servicios">
                    <article><h3>Ventas</h3><p>Gestión segura al mejor precio.</p></article>
                    <article><h3>Arrendamientos</h3><p>Tranquilidad garantizada.</p></article>
                    <article><h3>Administración</h3><p>Profesionalismo total.</p></article>
                </div>
            </div>
        </section>
    </main>

    <footer class="footer relleno-1">
        <div class="contenedor">
            <article class="info">
                <img class="logo-footer" src="${config.logo}">
                <h1>${config.nombre}</h1>
                <p class="copy">&copy; 2026 ${config.nombre}</p>
            </article>
            <article class="contacto">
                <h2>Contacto</h2>
                <ul>
                    <li><i class="houzez-icon icon-mobile-phone"></i> ${config.whatsapp}</li>
                    <li><i class="houzez-icon icon-pin"></i> ${config.direccion}</li>
                </ul>
            </article>
        </div>
    </footer>

    <script>
        // Lógica de filtrado (HIDRATACIÓN)
        document.addEventListener('DOMContentLoaded', () => {
            const listado = document.getElementById('listado-propiedades');
            const formulario = document.getElementById('formulario-busqueda');
            const tarjetas = Array.from(listado.getElementsByTagName('article'));

            function filtrar() {
                const query = formulario.ubicacion.value.toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "");
                const op = formulario.operacion.value;
                const tipo = formulario.tipo.value;
                let count = 0;

                tarjetas.forEach(t => {
                    const text = t.dataset.ubicacion.toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "");
                    const matchText = query.length < 3 || text.includes(query);
                    const matchOp = op === "" || t.dataset.operacion === op;
                    const matchTipo = tipo === "" || t.dataset.tipo === tipo;

                    if(matchText && matchOp && matchTipo) {
                        t.style.display = "grid";
                        count++;
                    } else {
                        t.style.display = "none";
                    }
                });
                document.getElementById('total-propiedades').innerText = count;
            }

            formulario.addEventListener('input', filtrar);
            
            // Acción móvil
            document.getElementById('abrir-filtros').onclick = () => {
                formulario.classList.toggle('activo');
            };

            // Ancla nosotros
            if (window.location.search.includes('nosotros')) {
                document.getElementById('nosotros').scrollIntoView({ behavior: 'smooth' });
            }
        });
    </script>
</body>
</html>`;
}