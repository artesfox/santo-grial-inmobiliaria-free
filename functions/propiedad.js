export async function onRequest(context) {
  const url = new URL(context.request.url);
  const idBusqueda = url.searchParams.get('id');

  if (!idBusqueda) return new Response("ID no proporcionado", { status: 400 });

  const SHEET_URL = "https://docs.google.com/spreadsheets/d/1VctscCRyoQ-sdWa1vlGG0xsjjGY5Jznw6LaK20syz3g/export?format=csv";

  try {
    const response = await fetch(SHEET_URL);
    const csvText = await response.text();
    const filas = csvText.split('\n').map(f => f.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/));
    const encabezados = filas[0].map(h => h.replace(/"/g, '').trim().toUpperCase());
    const propiedad = filas.find(f => f[0].replace(/"/g, '').trim() === idBusqueda.trim());

    if (!propiedad) return new Response("Propiedad no encontrada", { status: 404 });

    const getDato = (nombre) => {
      const i = encabezados.indexOf(nombre.toUpperCase());
      return (i !== -1 && propiedad[i]) ? propiedad[i].replace(/"/g, '').trim() : "";
    };

    // --- Lógica de Galería ---
    const fotos = [];
    for (let n = 1; n <= 8; n++) {
      const u = getDato(`FOTO URL ${n}`);
      if (u && u.startsWith('http')) fotos.push(u);
    }

    // --- Metadatos Dinámicos ---
    const tituloMeta = `${getDato("TÍTULO")} - Artefox Real Estate`;
    const descMeta = `${getDato("OPERACIÓN")} de ${getDato("TIPO")} en ${getDato("ZONA")} con: ${getDato("HABITACIONES")} habitaciones, ${getDato("BAÑOS")} baños, ${getDato("ÁREA CONSTRUIDA")} de área.`;
    const imagenMeta = fotos[0] || "";

    return new Response(`
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    
    <title>${tituloMeta}</title>
    <meta name="description" content="${descMeta}">
    <meta property="og:title" content="${tituloMeta}">
    <meta property="og:description" content="${descMeta}">
    <meta property="og:image" content="${imagenMeta}">
    <meta property="og:type" content="website">

    <link rel="preload" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">
    <noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600&display=swap"></noscript>
    
    <link rel="stylesheet" type="text/css" href="/css/inmobiliaria.css">
    <link rel="stylesheet" type="text/css" href="/css/icons.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/magnific-popup/dist/magnific-popup.css">
    
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/magnific-popup/dist/jquery.magnific-popup.min.js"></script>
    <script src="/script.js"></script>

    <style>
         body{
        background: var(--color-gris-1);
    }

    @media (min-width: 768px) {
        .contenido-propiedad{
        grid-template-columns: repeat(6, 1fr);
        display: grid;
        gap: 20px;
        }
    	.detalle-propiedad .bloques .col-iz{
    	grid-column: span 4;
    	}
      .detalle-propiedad .bloques .col-de{
    	grid-column: span 2;
    	}
    	.detalle-propiedad .bloques .col-iz .bloque:last-child{
		margin-bottom: 0;
		}
	}

    .detalle-propiedad .bloques .col-de .bloque:last-child{
        margin-bottom: 0;
    }

    .detalles-items-fx{
        padding: 25px;
        background: rgba(234,236,240,1);
        border: solid 2px #ccc;
        border-radius: 7px;
        
    }
    @media (max-width: 768px){

        .detalles-items-fx{
        padding: 18px;
        }
    }
    @media (min-width: 768px){
        .detalles-items-fx{
            grid-template-columns: 1fr 1fr;
            display: grid;
            gap:0 30px;
        }

    }

    .detalles-items-fx .item-detalle-fx{
        display: flex;
        justify-content: space-between;
        border-bottom: 1px solid #dce0e0;
        padding: 8px 0px;
        gap:5px;
    }

    .detalles-items-fx .item-detalle-fx  span:first-child{
        font-weight: 600;
        color: var(--color-negro-1);
    }

    .detalles-items-fx .item-detalle-fx  span:last-child{
        text-align: right;
        display: flex;
        flex-direction: column;
        justify-content: center;
    }


 /*====BLOQUE DETALLE ICONOS PROPIEDAD UNICA====*/
   .grupo-detalle {
        margin-top: 20px;   
    }

    .detalle-fx{ 
        display: flex;
        justify-content: space-between;
        color: var(--color-negro-1);
    }


	.detalle-propiedad .bloques  .grupo-bloque-fx{
		margin-bottom: 20px;
		background: #fff;
		padding: 18px;
		border-radius: 8px;      
	}

    @media (max-width: 768px) {
        .detalle-fx .bloque-texto-fx{
        display: none;
        }
    }
/*====FIN BLOQUE DETALLE ICONOS PROPIEDAD UNICA====*/      

/*====CABECERA TITULO PRECIO====*/
    @media (min-width: 768px) {
        .cabecera-fx {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        }
        .cabecera-fx .precio{
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: end;                     
        }
    }
    
    .cabecera-fx span.titulo{
       grid-column: 2 span;
    }

    .cabecera-fx span.titulo h1{
        font-size: 19px;
        font-weight: 500;
        color: var(--color-negro-1)        
    }

    .cabecera-fx span.titulo p{
        padding: 0; 
        margin: 0;       
    }

    .cabecera-fx .precio p{
       font-size: 23px;  
       color:var(--color-negro-1);  
       font-weight: 800;
       margin-bottom: 0;  
    }
     @media (max-width: 768px) {
       .cabecera-fx .precio p{
       font-size: 19px;  
       }
       .cabecera-fx span.titulo h1{
       font-size: 17px;
       margin-bottom: 10px;
        }
    }
/*====FIN CABECERA TITULO PRECIO====*/


/*==GALERÍA DE FOTOS PARA PROPIEDADES- JS SWIPER==*/
   .contenodie .swiper {
        width: 100%;
        margin: auto;
    }

   .contenodie .mySwiper2 {
        padding-top:70% !important;
        width: 100%;
        border:solid 3px #000;
        border-radius:8px;
        box-sizing: border-box;
    }

   .contenodie .mySwiper2 .swiper-wrapper{
        top:0;
        position: absolute;
    }

    .contenodie  .mySwiper {
        height: 20%;
        padding: 10px 0;
    }

   .contenodie .mySwiper .swiper-slide {
        width: 25%;
        height: 100%;
        opacity: 0.4;
    }

    .contenodie .mySwiper .swiper-slide-thumb-active {
        opacity: 1;
    }

    .contenodie .swiper-slide a {
        display: block;
        width: 100%;
        height: 100%;
    }

    .contenodie .swiper-slide a:before {
        display: block;
        position: absolute;
        top: 0;
        bottom: 0;
        right: 0;
        left: 0;
        background: inherit;
        filter: blur(8px);
        content: "";
        backdrop-filter: blur(8px);
        background-color: rgba(0, 0, 0, 0.6);
        background-size: cover;
    }

   .contenodie .swiper-slide a:after{
        display: block;
        position: absolute;
        top: 0;
        left: 0;
        bottom: 0;
        right: 0;
        background-image: inherit;
        content: "";
        background-size: contain;
        background-position: center;
        background-repeat: no-repeat;
        background-color: rgba(255, 255, 255, 0.4);
   }

    .contenodie .swiper-slide img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: contain;
        cursor: pointer;
        padding: 0px;
    }

    .miniaturas-fx-galeria{
        padding-top: 15% !important;
        margin-top: 10px !important;
    }

    .miniaturas-fx-galeria .swiper-wrapper{
        position: absolute;
        top:0;
    }

    .miniaturas-fx-galeria .swiper-slide{
        border:solid 2px #ccc;
        padding: 4px !important;
        border-radius:5px;
        box-sizing: border-box;

        }

    .miniaturas-fx-galeria .swiper-slide img{ 
        padding: 0px !important;
        object-fit: cover;
    }
       
    .contenodie .swiper-button-next, .contenodie .swiper-button-prev {
        color: #fff !important;
        filter: drop-shadow(0px 0px 2px #000);
        height: 60px;
    }

    .swiper-button-next:after, .swiper-button-prev:after {
        font-size: 19px !important;
        font-weight: bold;
    
    }

    .contenodie .swiper-button-next.swiper-button-disabled, .swiper-button-prev.swiper-button-disabled {
        pointer-events: all !important;
    }

    .miniaturas-fx-galeria .swiper-slide {
        border: solid 2px #000;
    }
/*====FIN GALERÍA DE FOTOS PARA PROPIEDADES - JS SWIPER====*/

/*====FORMULARIO DE CONTACTO====*/
    .formulario-contacto {
        margin: 0;
        padding: 10px;
        border-radius: 5px;
        font-family: Arial, sans-serif;
    }


    .formulario-contacto label {
        display: block;
        margin-bottom: 5px;
        font-weight: bold;
    }

    .formulario-contacto input[type="text"],
    .formulario-contacto input[type="tel"] {
        width: 100%;
        padding: 10px;
        margin-bottom: 15px;
        border: 2px solid #ccc;
        border-radius: 5px;
        box-sizing: border-box;
        font-size: 14px;
        min-height: 50px;
    }

    .formulario-contacto .btn-whatsapp {    
        width: 100%;
        padding: 12px;
        background-color: var(--color-maestro);
        color: #fff;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: 1px;
        min-height: 50px;
        font-weight: 600;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 3px;
    }

    .formulario-contacto input[type="submit"]:hover {
        background-color: var(--color-maestro);
    }

    @media (min-width: 767px) {
        .formulario-fx {
        position: -webkit-sticky; /* Soporte para Safari */
        position: sticky;
        top: 20px; 
        z-index: 100; 
        }
    }
/*====FORMULARIO DE CONTACTO====*/
</style>
</head>
<body>
    <header class="header">
        <div class="contenedor-header">
            <h1 class="logo"><a href="/index.html"><img src="/imagenes/logo-real-state-fx-2.png" alt="Logo"></a></h1>
            <nav class="menu">
                <ul>
                    <li><a href="/index.html">Inicio</a></li>
                    <li><a href="/propiedades.html">Propiedades</a></li>
                </ul>
            </nav>
        </div>
    </header>

    <main>
        <section class="detalle-propiedad relleno-1">
            <article class="contenedor contenido-propiedad bloques">
                <div class="col-iz">
                    <div class="galeria-fx">
                        <div class="contenodie">
                            <div class="swiper mySwiper2">
                                <div class="swiper-wrapper">
                                    ${fotos.map(f => `
                                        <div class="swiper-slide">
                                            <a href="${f}" class="popup-image" style="background-image: url('${f}');"></a>
                                        </div>
                                    `).join('')}
                                </div>
                                <div class="swiper-button-next"></div>
                                <div class="swiper-button-prev"></div>
                            </div>
                            <div thumbsSlider="" class="swiper mySwiper miniaturas-fx-galeria">
                                <div class="swiper-wrapper">
                                    ${fotos.map(f => `
                                        <div class="swiper-slide">
                                            <img src="${f}" alt="miniatura">
                                        </div>
                                    `).join('')}
                                </div>
                                <div class="swiper-button-next mini-next"></div>
                                <div class="swiper-button-prev mini-prev"></div>
                            </div>
                        </div>
                    </div>

                    <div class="grupo-bloque-fx grupo-detalle">
                        <span class="detalle-fx">
                            <span class="doemitorios"><i class="houzez-icon icon-hotel-double-bed-1 me-2"></i> ${getDato("HABITACIONES")} <span class="bloque-texto-fx">Habitaciones</span></span>
                            <span class="banos"><i class="houzez-icon icon-bathroom-shower-1 me-2"></i> ${getDato("BAÑOS")} <span class="bloque-texto-fx">Baños</span></span>
                            <span class="area-total"><i class="houzez-icon icon-ruler-triangle me-2"></i> ${getDato("ÁREA CONSTRUIDA")} m² <span class="bloque-texto-fx">Área</span></span>
                            <span class="estacionamientos"><i class="houzez-icon icon-car-1 me-2"></i> ${getDato("ESTACIONAMIENTO")} <span class="bloque-texto-fx">Estacionamientos</span></span>
                        </span>
                    </div>

                    <div class="grupo-bloque-fx cabecera-fx">
                        <span class="titulo">
                            <h1>${getDato("TÍTULO")}</h1>
                            <p style="color:var(--color-maestro);">📍 ${getDato("DIRECCIÓN")} - ${getDato("CIUDAD/UBICACIÓN")}</p>
                        </span>
                        <span class="precio">
                            <p>$ ${getDato("PRECIO")}</p>
                        </span>
                    </div>
                
                    <div class="grupo-bloque-fx descripcion-fx">
                        <h2>Descripción</h2>
                        <p style="white-space: pre-wrap;">${getDato("DESCRIPCIÓN")}</p>
                    </div>

                    <div class="grupo-bloque-fx detalles-fx">
                        <h2>Detalles</h2>
                        <div class="detalles-items-fx">
                            <div class="item-detalle-fx"><span>Tipo:</span> <span>${getDato("TIPO")}</span></div>
                            <div class="item-detalle-fx"><span>Operación:</span> <span>${getDato("OPERACIÓN")}</span></div>
                            <div class="item-detalle-fx"><span>Precio:</span> <span>$ ${getDato("PRECIO")}</span></div>
                            <div class="item-detalle-fx"><span>Habitaciones:</span> <span>${getDato("HABITACIONES")}</span></div>
                            <div class="item-detalle-fx"><span>Baños:</span> <span>${getDato("BAÑOS")}</span></div>
                            <div class="item-detalle-fx"><span>Área construida:</span> <span>${getDato("ÁREA CONSTRUIDA")}</span></div>
                            <div class="item-detalle-fx"><span>País:</span> <span>${getDato("PÁIS")}</span></div>
                            <div class="item-detalle-fx"><span>Ciudad:</span> <span>${getDato("CIUDAD/UBICACIÓN")}</span></div>
                            <div class="item-detalle-fx"><span>Zona:</span> <span>${getDato("ZONA")}</span></div>
                        </div>
                    </div>
                </div>

                <div class="col-de">
                    <div class="grupo-bloque-fx formulario-fx">
                        <div class="formulario-contacto">
                            <h3 style="margin-top:0">¿Te interesa?</h3>
                            <a href="https://wa.me/3232844851?text=Hola,%20me%20interesa%20la%20propiedad:%20${getDato("TÍTULO")}%20(ID:%20${idBusqueda})" class="btn-whatsapp">
                                <i class="houzez-icon icon-messaging-whatsapp" style="font-size: 20px;"></i>
                                Contactar por WhatsApp
                            </a>
                            <p style="font-size:12px; text-align:center; margin-top:10px; color:#666">O déjanos tus datos y te llamamos.</p>
                        </div>
                    </div>
                </div>
            </article>
        </section>
    </main>

    <footer class="footer relleno-1">
        <div class="contenedor">
            <article class="info">
                <img class="logo-footer" src="/imagenes/logo-real-state-fx-2.png" alt="logo">
                <p>&copy; 2026 Inmobiliaria RealState - Santo Grial por Artefox</p>
            </article>
        </div>
    </footer>

    <script>
        document.addEventListener("DOMContentLoaded", function() {
            var swiperThumbs = new Swiper(".mySwiper", {
                spaceBetween: 10,
                slidesPerView: 4,
                freeMode: true,
                watchSlidesProgress: true,
                navigation: { nextEl: ".mini-next", prevEl: ".mini-prev" }
            });
            var swiperMain = new Swiper(".mySwiper2", {
                spaceBetween: 10,
                navigation: { nextEl: ".swiper-button-next", prevEl: ".swiper-button-prev" },
                thumbs: { swiper: swiperThumbs }
            });

            jQuery(".popup-image").magnificPopup({
                type: "image",
                gallery: { enabled: true }
            });
        });
    </script>
</body>
</html>
    `, { headers: { "content-type": "text/html;charset=UTF-8" } });

  } catch (error) {
    return new Response("Error: " + error.message, { status: 500 });
  }
}
