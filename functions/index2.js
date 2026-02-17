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
            titulo: cabecera.indexOf("TÍTULO")
        };

        const limpiar = (val) => val ? val.replace(/^"|"$/g, '').trim() : "";

        // 2. GENERAR EL HTML DE LAS TARJETAS
        let htmlTarjetas = "";
        for (let i = 1; i < filas.length; i++) {
            const dato = filas[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            if (dato.length < 5) continue;

            const p = {
                id: limpiar(dato[idx.id]),
                tipo: limpiar(dato[idx.tipo]),
                operacion: limpiar(dato[idx.operacion]),
                precio: limpiar(dato[idx.precio]) || "0",
                moneda: limpiar(dato[idx.moneda]) || "$",
                habs: limpiar(dato[idx.habs]) || "0",
                banos: limpiar(dato[idx.banos]) || "0",
                parking: limpiar(dato[idx.estacionamiento]) || "0",
                area: limpiar(dato[idx.area]) || "0",
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
                        <img src="${p.foto}" onerror="this.src='https://via.placeholder.com/400x300?text=Cargando...';">
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

        // 4. RETORNAR EL HTML COMPLETO
        return new Response(generarPlantilla(htmlTarjetas, filas.length - 1), {
            headers: { "Content-Type": "text/html;charset=UTF-8" }
        });

    } catch (error) {
        return new Response("Error al renderizar: " + error.message, { status: 500 });
    }
}

function generarPlantilla(tarjetas, total) {
    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Listado de propiedades</title>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600&display=swap">
    <link rel="stylesheet" type="text/css" href="css/inmobiliaria.css">
    <link rel="stylesheet" type="text/css" href="css/icons.css">
    <style>
        body{ background: var(--color-gris-1); }
        .relleno-5 { padding: 10px 20px 55px 20px; }
        .houzez-icon.icon-Filter-Faders{ font-size: 30px; }
    </style>
</head>
<body>
    <header class="header">
        <div class="contenedor-header">
            <h1 class="logo"><a href="index.html"><img src="imagenes/logo-real-state-fx-2.png" alt="Logo del sitio header">RealState</a></h1>
            <button class="menu-toggle" aria-label="Abrir menú">
                <span></span><span></span><span></span>
            </button>
            <nav class="menu">
                <button class="menu-close">&times;</button>
                <ul>
                    <li><a href="index">Propiedades</a></li>
                    <li><a href="?nosotros">Nosotros</a></li>
                    <li><a href="#" class="cta-boton"><i class="houzez-icon icon-messaging-whatsapp" style="font-size: 20px;"></i>Contacto</a></li>
                </ul>
            </nav>
        </div>     
    </header>

    <section class="banner-inicio">
        <div class="contenedor">
            <h1>Encuentra <br>tu próximo hogar aquí</h1>
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
                <div class="contenedor-resultados" style="display:block;">
                    <div class="fila-info">
                        <div class="bloque-izquierdo">
                            <p class="conteo-propiedades"><span id="total-propiedades">${total}</span> Propiedades encontradas</p>
                            <div class="etiquetas-filtros" style="display: none;">
                                <span class="texto-pequeno">Filtros activos:</span>
                                <div id="contenedor-etiquetas-dinamicas" style="display:contents;"></div>
                                <button class="boton-limpiar">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="14"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                    Borrar todo
                                </button>
                            </div>
                        </div>
                        <div class="bloque-derecho">
                            <label class="texto-pequeno">Ordenar por:</label>
                            <select class="selector-orden">
                                <option value="precio-bajo">Ordenar por</option>
                                <option value="precio-bajo">Precio más bajo</option>
                                <option value="precio-alto">Precio más alto</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div class="grid-propiedades" id="listado-propiedades">
                    ${tarjetas}
                </div>
            </div>
        </section>

        <section id="nosotros" class="servicios relleno-1">
            <div class="contenedor">
                <h2>Servicios profesionales</h2>
                <div class="grid-servicios">
                    <article><i class="houzez-icon icon-check-circle-1"></i><h3>Arrendamientos</h3><p>Gestión eficiente y segura.</p></article>
                    <article><i class="houzez-icon icon-check-circle-1"></i><h3>Ventas</h3><p>Vendemos al mejor precio.</p></article>
                    <article><i class="houzez-icon icon-check-circle-1"></i><h3>Administración</h3><p>Profesionalismo y total confianza.</p></article>
                </div>
            </div>
        </section>
    </main>

 	<footer class="footer relleno-1">
    	<div class="contenedor">
        	<article class="info">
            	<img class="logo-footer" src="imagenes/logo-real-state-fx-2.png">
                <h1>RealSate</h1>                 
                
                <ul class="redes">
                    <li>
                        <a class="btn-facebook" target="_blank" href="https://facebook.com/Favethemes" aria-label="Facebook">
                            <i class="houzez-icon icon-social-media-facebook me-2" aria-hidden="true"></i>
                        </a>
                    </li>

                    <li>
                        <a class="btn-instagram" target="_blank" href="http://instagram.com" aria-label="Twitter">
                            <i class="houzez-icon icon-social-instagram me-2" aria-hidden="true"></i>
                        </a>
                    </li>

                    <li>
                        <a class="btn-x" target="_blank" href="http://x.com" aria-label="X">
                            <i class="houzez-icon icon-x-logo-twitter-logo-2" aria-hidden="true"></i>
                        </a>
                    </li>

                    <li>
                        <a class="btn-linkedin" target="_blank" href="http://linkedin.com" aria-label="Linkedin">
                            <i class="houzez-icon icon-professional-network-linkedin" aria-hidden="true"></i>
                        </a>
                    </li>

                    <li>
                        <a class="btn-pinterest" target="_blank" href="http://pinterest.com" aria-label="Pinterest">
                            <i class="houzez-icon icon-social-pinterest" aria-hidden="true"></i>
                        </a>
                    </li>

                    <li>
                        <a class="btn-pinterest" target="_blank" href="http://tiktok.com" aria-label="TikTok">
                            <i class="houzez-icon icon-tiktok-1-logos-24" aria-hidden="true"></i>
                        </a>
                    </li>

                    <li>
                        <a class="btn-google" target="_blank" href="http://google.com" aria-label="Google">
                            <i class="houzez-icon icon-social-media-google-plus-1" aria-hidden="true"></i>
                        </a>
                    </li>


                </ul>
                <p class="copy">© 2026 Inmobiliaria RealState</p>
            </article>
            

            <article>
                <h2>Información legal</h2>
                <ul>
    				<li><a href="terminos-y-condiciones.html" target="_blank">Términos y Condiciones</a></li>
    				<li><a href="politica-de-privacidad.html" target="_blank">Política de Privacidad</a></li>
    				<li><a href="politica-de-cookies.html" target="_blank">Política de Cookies</a></li>
				</ul>
            </article>

            <article>
                <h2>Menú rápido</h2>
                <ul>
                   <li><a href="index">Propiedades</a></li>
                    <li><a href="index?nosotros">Nosotros</a></li>
                    <li><a href="#arriba" onclick="event.preventDefault(); window.scrollTo({top: 0, behavior: 'smooth'});">Ir al iniio</a></li> 
    
                </ul>
            </article>


            <article class="contacto">
                <h2>Contácto</h2>
                <ul> 
                    <li><i class="houzez-icon icon-mobile-phone"></i> <span>+ 57</span> <span>3232844851</span></li>
                    <li><i class="houzez-icon icon-pin me-2"></i> <span> Calle 80 #65 15. Bogotá - Colombia</span></li> 
                    <li><i class="houzez-icon icon-envelope"></i> <span>email@artefox.com</span></li> 
                </ul>
            </article>

        </div>
    </footer>

    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const listado = document.getElementById('listado-propiedades');
            const formulario = document.getElementById('formulario-busqueda');
            const contenedorFiltros = document.querySelector('.etiquetas-filtros');
            const contenedorEtiquetas = document.getElementById('contenedor-etiquetas-dinamicas');
            const btnLimpiar = document.querySelector('.boton-limpiar');
            const tarjetasArr = Array.from(listado.getElementsByTagName('article'));

            function filtrar() {
                const query = formulario.ubicacion.value.toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "");
                const op = formulario.operacion.value;
                const tipo = formulario.tipo.value;
                let c = 0;

                tarjetasArr.forEach(t => {
                    const text = t.dataset.ubicacion.toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "");
                    const matchText = query.length < 3 || text.includes(query);
                    const matchOp = op === "" || t.dataset.operacion === op;
                    const matchTipo = tipo === "" || t.dataset.tipo === tipo;

                    if(matchText && matchOp && matchTipo) {
                        t.style.display = "grid";
                        c++;
                    } else {
                        t.style.display = "none";
                    }
                });

                document.getElementById('total-propiedades').innerText = c;
                actualizarEtiquetas(op, tipo);
            }

            function actualizarEtiquetas(op, tipo) {
                contenedorEtiquetas.innerHTML = '';
                if (op || tipo) {
                    contenedorFiltros.style.display = 'flex';
                    if(op) crearEtiqueta(op, 'operacion');
                    if(tipo) crearEtiqueta(tipo, 'tipo');
                } else {
                    contenedorFiltros.style.display = 'none';
                }
            }

            function crearEtiqueta(texto, campo) {
                const div = document.createElement('div');
                div.className = 'etiqueta';
                div.innerHTML = '<span>'+texto+'</span><button type="button" class="boton-quitar">×</button>';
                div.querySelector('button').onclick = () => {
                    formulario.querySelector('[name="'+campo+'"]').value = "";
                    filtrar();
                };
                contenedorEtiquetas.appendChild(div);
            }

            formulario.addEventListener('input', filtrar);
            btnLimpiar.onclick = () => { formulario.reset(); filtrar(); };
            document.getElementById('abrir-filtros').onclick = () => formulario.classList.toggle('activo');

            if (window.location.search.includes('nosotros')) {
                document.getElementById('nosotros').scrollIntoView({ behavior: 'smooth' });
            }
        });
    </script>
</body>
</html>`;
}


