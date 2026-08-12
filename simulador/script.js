let CONTEXTO_DOCUMENTOS = "";

document.addEventListener('DOMContentLoaded', () => {
    // Configuración de la IA
    const SYSTEM_CONTEXT = `Eres un experto consultor en políticas públicas y gestión de proyectos, especializado en la metodología del DNP (Departamento Nacional de Planeación) y el DANE de Colombia. Tu objetivo es guiar a los estudiantes en la formulación de indicadores.
Reglas de tu comportamiento:

Basa tus respuestas en la Cadena de Valor Pública: Insumo, Producto, Resultado e Impacto.

Exige que los indicadores cumplan con los criterios CREMAS (Claro, Relevante, Económico, Medible, Adecuado, Sensible).

Nunca resuelvas el ejercicio completo de inmediato; actúa como un profesor socrático, haciendo preguntas que guíen al usuario a estructurar correctamente el nombre del indicador, su fórmula y su unidad de medida.

Mantén un tono institucional, pedagógico y directo.`;

    // State
    let state = {
        currentView: 'step-1',
        data: {
            preguntaVaga: '',
            componentes: { poblacion: '', atributo: '', ambito: '', referente: '' },
            preguntaRefinada: '',
            cadenaValor: '',
            nombreIndicador: '',
            formulaCalculo: '',
            tipoCalidad: '',
            acumulacion: '',
            unidad: '',
            fuente: ''
        }
    };

    let portfolio = [];

    // Examples Database
    const examples = {
        salud1: { preguntaVaga: '¿Cómo va la atención en salud a las embarazadas del sector rural?' },
        edu1: { preguntaVaga: '¿Cómo va la educación rural en la provincia?' },
        seg1: { preguntaVaga: '¿El plan de vigilancia ha funcionado para reducir atracos?' },
        amb1: { preguntaVaga: '¿Cómo va el medio ambiente?' },
        movilidad1: { preguntaVaga: '¿La gente sí está usando el nuevo transporte y estamos reduciendo los tiempos de trancón?' },
        empleo1: { preguntaVaga: '¿El programa sí está sirviendo para que los jóvenes consigan trabajo digno o es plata botada?' },
        contratos1: { preguntaVaga: '¿Estamos ahorrando dinero al contratar por licitación pública?' },
        salud2: {
            compPoblacion: 'Mujeres gestantes con residencia en zona rural',
            compAtributo: 'Acceso oportuno y completo al control prenatal',
            compAmbito: 'Zona rural del Municipio X, año 2026',
            compReferente: 'Cobertura del año anterior',
            preguntaRefinada: '¿Estamos garantizando una cobertura adecuada y oportuna de controles prenatales a las gestantes de la zona rural del Municipio X durante el año 2026, mejorando frente al año 2025?'
        },
        edu2: {
            compPoblacion: 'Estudiantes matriculados en sedes educativas rurales oficiales',
            compAtributo: 'Retención escolar intra-anual (evitar abandono antes de finalizar el año)',
            compAmbito: 'Sedes rurales del municipio/provincia, año lectivo en curso',
            compReferente: 'Meta del plan de desarrollo vigente sobre tasa de deserción',
            preguntaRefinada: '¿Estamos reteniendo a los estudiantes de las sedes rurales durante el año escolar, frente a la meta del plan de desarrollo?'
        },
        seg2: {
            compPoblacion: 'Habitantes del casco urbano del municipio',
            compAtributo: 'Incidencia de hurto a personas ajustada por densidad poblacional',
            compAmbito: 'Casco urbano, trimestre actual vs. mismo trimestre del año anterior',
            compReferente: 'Tasa del mismo trimestre del año anterior',
            preguntaRefinada: '¿Está disminuyendo el hurto a personas en el último trimestre, frente al mismo periodo del año anterior?'
        },
        amb2: {
            compPoblacion: 'Hectáreas comprometidas en el plan de reforestación regional',
            compAtributo: 'Sobrevivencia vegetativa de lo sembrado, no solo la siembra inicial',
            compAmbito: 'Cuencas hidrográficas de la jurisdicción, verificación a los 12 meses',
            compReferente: 'Total de hectáreas comprometidas y programadas en el plan',
            preguntaRefinada: '¿Las hectáreas comprometidas en el plan de reforestación realmente sobreviven, frente a lo programado?'
        },
        salud4: {
            nombreIndicador: 'Porcentaje de gestantes en zona rural con 4 o más controles prenatales',
            formulaCalculo: '(Gestantes rurales con 4 o más controles / Total de gestantes rurales) * 100'
        },
        edu4: {
            nombreIndicador: 'Tasa de deserción escolar intra-anual en sedes educativas rurales',
            formulaCalculo: '(N.º estudiantes que abandonan durante el año / N.º matriculados al inicio del año) * 100'
        },
        seg4: {
            nombreIndicador: 'Variación porcentual de la tasa de hurto a personas por cada 10.000 habitantes',
            formulaCalculo: '((Tasa trimestre actual - Tasa año anterior) / Tasa año anterior) * 100'
        },
        amb4: {
            nombreIndicador: 'Porcentaje de hectáreas reforestadas con sobrevivencia mayor al 80% a los 12 meses',
            formulaCalculo: '(N.º hectáreas con sobrevivencia >80% verificada / N.º total hectáreas comprometidas) * 100'
        }
    };

    const helpTexts = {
        calidad: {
            title: "Tipo de Calidad del Indicador",
            body: `
                <p style="color: #000000 !important; font-size: 1rem; line-height: 1.6;">Define la dimensión del desempeño que se evalúa según las guías DNP y ESAP:</p>
                <ul style="margin-left: 1.2rem; margin-top: 0.5rem; display: flex; flex-direction: column; gap: 0.5rem; color: #000000 !important; list-style-type: disc;">
                    <li style="color: #000000 !important; font-size: 0.95rem; line-height: 1.5;"><strong style="color: #000000 !important;">Eficacia:</strong> Mide el grado de cumplimiento de los objetivos y metas (¿Se logró el resultado deseado?).</li>
                    <li style="color: #000000 !important; font-size: 0.95rem; line-height: 1.5;"><strong style="color: #000000 !important;">Eficiencia:</strong> Relaciona los productos entregados con los insumos y costos empleados (¿Se optimizaron los recursos?).</li>
                    <li style="color: #000000 !important; font-size: 0.95rem; line-height: 1.5;"><strong style="color: #000000 !important;">Efectividad:</strong> Evalúa el impacto o los efectos estructurales a mediano/largo plazo en la población objetivo.</li>
                    <li style="color: #000000 !important; font-size: 0.95rem; line-height: 1.5;"><strong style="color: #000000 !important;">Calidad:</strong> Mide las propiedades o atributos específicos del servicio entregado (Ej: oportunidad, satisfacción del usuario, accesibilidad).</li>
                </ul>
            `
        },
        acumulacion: {
            title: "Tipo de Acumulación (Medición)",
            body: `
                <p style="color: #000000 !important; font-size: 1rem; line-height: 1.6;">Establece cómo se registran y comparan los datos del indicador a lo largo del tiempo:</p>
                <ul style="margin-left: 1.2rem; margin-top: 0.5rem; display: flex; flex-direction: column; gap: 0.5rem; color: #000000 !important; list-style-type: disc;">
                    <li style="color: #000000 !important; font-size: 0.95rem; line-height: 1.5;"><strong style="color: #000000 !important;">Flujo:</strong> Logros que se repiten anualmente de manera independiente.</li>
                    <li style="color: #000000 !important; font-size: 0.95rem; line-height: 1.5;"><strong style="color: #000000 !important;">Acumulado:</strong> Suma continua de los avances logrados periodo tras periodo.</li>
                    <li style="color: #000000 !important; font-size: 0.95rem; line-height: 1.5;"><strong style="color: #000000 !important;">Stock:</strong> Mide el esfuerzo por mantener un resultado o nivel deseado en un instante.</li>
                    <li style="color: #000000 !important; font-size: 0.95rem; line-height: 1.5;"><strong style="color: #000000 !important;">Capacidad:</strong> Avance porcentual restando la línea base directamente del total de la meta.</li>
                    <li style="color: #000000 !important; font-size: 0.95rem; line-height: 1.5;"><strong style="color: #000000 !important;">Reducción:</strong> Esfuerzo orientado a disminuir un valor inicial indeseado frente a su línea base.</li>
                </ul>
            `
        },
        unidad: {
            title: "Unidad de Medida",
            body: `
                <p style="color: #000000 !important; font-size: 1rem; line-height: 1.6;">Es la recomendación de la magnitud o unidad en la que se cuantifica el indicador:</p>
                <ul style="margin-left: 1.2rem; margin-top: 0.5rem; display: flex; flex-direction: column; gap: 0.5rem; color: #000000 !important; list-style-type: disc;">
                    <li style="color: #000000 !important; font-size: 0.95rem; line-height: 1.5;"><strong style="color: #000000 !important;">Porcentaje (%):</strong> Relación proporcional entre dos variables homogéneas (Ej. % de cobertura).</li>
                    <li style="color: #000000 !important; font-size: 0.95rem; line-height: 1.5;"><strong style="color: #000000 !important;">Tasa:</strong> Relación de frecuencia de un evento respecto a una población expuesta en un periodo (Ej. Tasa de mortalidad por 100,000 hab).</li>
                    <li style="color: #000000 !important; font-size: 0.95rem; line-height: 1.5;"><strong style="color: #000000 !important;">Número absoluto:</strong> Conteo simple de elementos o productos entregados (Ej. Número de escuelas construidas).</li>
                    <li style="color: #000000 !important; font-size: 0.95rem; line-height: 1.5;"><strong style="color: #000000 !important;">Promedio:</strong> Suma de valores dividido entre la cantidad de elementos (Ej. Promedio de horas de atención).</li>
                </ul>
            `
        },
        formula: {
            title: "Ejemplo de Fórmula Matemática de Variación",
            body: `
                <div style="color: #000000 !important; font-family: 'Outfit', sans-serif; text-align: left;">
                    <p style="color: #000000 !important; margin-bottom: 0.8rem; font-weight: bold; font-size: 1.05rem;">Ficha Técnica del Indicador (Ejemplo DANE):</p>
                    <ul style="color: #000000 !important; margin-left: 1.2rem; display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1rem; list-style-type: disc;">
                        <li style="color: #000000 !important; font-size: 0.9rem;"><strong style="color: #000000 !important;">Nombre del Indicador:</strong> Variación de la Fuerza Laboral Activa en Cartagena.</li>
                        <li style="color: #000000 !important; font-size: 0.9rem;"><strong style="color: #000000 !important;">Objetivo de Gestión:</strong> Evaluar el crecimiento o contracción del volumen de personas en edad de trabajar que están contratadas o buscando empleo activamente en el distrito.</li>
                    </ul>
                    
                    <div style="background: #f8fafc; padding: 1.2rem; border-radius: 8px; border: 1px solid #cbd5e1; margin-bottom: 1rem; text-align: center; box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);">
                        <span style="font-size: 0.95rem; font-weight: bold; color: #000000 !important; display: block; margin-bottom: 0.8rem;">Fórmula de Cálculo:</span>
                        
                        <div style="display: inline-flex; align-items: center; gap: 10px; color: #000000 !important;">
                            <span style="font-size: 1.1rem; font-weight: bold; color: #000000 !important;">Variación % = </span>
                            <span style="font-size: 1.4rem; font-weight: 300; color: #000000 !important;">(</span>
                            <div style="display: inline-flex; flex-direction: column; align-items: center; vertical-align: middle; color: #000000 !important;">
                                <div style="font-size: 1.05rem; color: #000000 !important; font-weight: bold; border-bottom: 2px solid #000000; padding-bottom: 4px; padding-left: 10px; padding-right: 10px; font-family: Georgia, serif;">
                                    Fuerza Laboral 2024 - Fuerza Laboral 2023
                                </div>
                                <div style="font-size: 1.05rem; color: #000000 !important; font-weight: bold; padding-top: 4px; font-family: Georgia, serif;">
                                    Fuerza Laboral 2023
                                </div>
                            </div>
                            <span style="font-size: 1.4rem; font-weight: 300; color: #000000 !important;">)</span>
                            <span style="font-size: 1.1rem; font-weight: bold; color: #000000 !important;"> x 100</span>
                        </div>
                    </div>

                    <p style="color: #000000 !important; font-style: italic; font-size: 0.85rem; margin-bottom: 1rem; padding-left: 5px; border-left: 3px solid var(--primary);">
                        (Nota: La "Fuerza Laboral" equivale a la suma de personas ocupadas + desocupadas según la metodología GEIH del DANE).
                    </p>

                    <ul style="color: #000000 !important; margin-left: 1.2rem; display: flex; flex-direction: column; gap: 0.4rem; font-size: 0.9rem; list-style-type: disc;">
                        <li style="color: #000000 !important;"><strong style="color: #000000 !important;">Unidad de Medida:</strong> Porcentaje (%) o Puntos Porcentuales (p.p.) si comparas directamente las tasas de participación.</li>
                        <li style="color: #000000 !important;"><strong style="color: #000000 !important;">Periodicidad:</strong> Anual (o semestral/trimestral utilizando trimestres móviles para Cartagena).</li>
                    </ul>
                </div>
            `
        }
    };

    // DOM Elements
    const els = {
        stepBtns: document.querySelectorAll('.step-btn'),
        viewContents: document.querySelectorAll('.view-content'),
        resetBtn: document.getElementById('resetBtn'),
        stepMainTitle: document.getElementById('stepMainTitle'),
        stepMainDesc: document.getElementById('stepMainDesc'),
        copilotChat: document.getElementById('copilotChat'),
        portfolioContainer: document.getElementById('portfolio-container'),
        saveBtn: document.getElementById('saveIndicatorBtn')
    };

    const viewInfo = {
        'step-1': { title: 'Paso 1: Captura', desc: 'Ingresa la necesidad de información.' },
        'step-2': { title: 'Paso 2: Desglose', desc: 'Identifica los 4 componentes estructurales.' },
        'step-3': { title: 'Paso 3: Cadena de Valor', desc: 'Ubica el objetivo.' },
        'step-4': { title: 'Paso 4: Formulación', desc: 'Redacta nombre y fórmula.' },
        'step-5': { title: 'Paso 5: Ficha Técnica', desc: 'Consolida y guarda.' },
        'portfolio': { title: 'Mis Indicadores', desc: 'Tu portafolio de indicadores guardados.' },
        'learning': { title: '📚 Centro de Aprendizaje Metodológico', desc: 'Documentación oficial y guías para la construcción de indicadores.' }
    };

    // Configuración del Asistente Virtual
    const hoverHints = {
        '#preguntaVaga': 'Escribe aquí la inquietud o problema exactamente como lo plantea el ciudadano o el directivo, sin tecnicismos.',
        '#compPoblacion': '¿Sobre quién o qué se pregunta? Ej: estudiantes, viviendas, gestantes, hectáreas.',
        '#compAtributo': '¿Qué característica de esa población te interesa? Ej: cobertura, retención, sobrevivencia.',
        '#compAmbito': '¿Dónde y en qué periodo ocurre? Ej: Municipio X, vigencia actual.',
        '#compReferente': '¿Frente a qué evalúas? Ej: la meta del plan de desarrollo, o el año anterior.',
        '#preguntaRefinada': 'Aquí debes redactar la pregunta final uniendo los 4 componentes (población, atributo, ámbito, referente).',
        '.vc-card[data-vc="insumos"]': 'Los insumos son los recursos financieros, humanos y físicos que tienes disponibles. ¡No suelen ser el fin principal!',
        '.vc-card[data-vc="actividades"]': 'Las actividades son los procesos y tareas realizadas (como reuniones, talleres). Contar actividades no mide si hubo un cambio real.',
        '.vc-card[data-vc="productos"]': 'Los productos son los bienes o servicios entregados (ej. raciones, kits). Miden tu esfuerzo operativo.',
        '.vc-card[data-vc="resultados"]': '¡Excelente! Los resultados miden el cambio real en el comportamiento o condición de la población. Es lo más recomendado.',
        '.vc-card[data-vc="impactos"]': 'Los impactos miden transformaciones estructurales a largo plazo (ej. tasa de mortalidad, pobreza). Son muy difíciles de atribuir a un solo proyecto.',
        '#nombreIndicador': 'Recuerda la regla: Objeto de medición + Condición deseada (en participio) + Contexto descriptivo.',
        '#formulaCalculo': 'La fórmula más común es (Lo que se logró / La población total de referencia) * 100.',
        '#analyzeStep1Btn': 'Haz clic aquí para que valide si tu pregunta tiene sentido.',
        '#magicGenerateBtn': '¡Magia! Haz clic aquí y generaré toda la ficha técnica por ti basándome en lo que escribas.',
        '#analyzeStep2Btn': 'Revisaré si los 4 componentes están completos.',
        '#analyzeStep3Btn': 'Validaré el eslabón que elegiste.',
        '#analyzeStep4Btn': 'Aplicaré la lista de chequeo CREMAS a tu fórmula y nombre.',
        'span[data-concept="nombre"]': 'El nombre resume todo: qué mides y cuál es la condición deseada.',
        'span[data-concept="pregunta"]': 'Esta es la pregunta final consolidada que sirve de brújula a tu indicador.',
        'span[data-concept="cadena"]': 'Es vital tener claro en qué eslabón (Insumo, Actividad, Producto, Resultado o Impacto) te encuentras.',
        'span[data-concept="calidad"]': 'Define si mides Eficacia (logros), Eficiencia (recursos/tiempo), Economía (ahorro) o Calidad (satisfacción/estándares).',
        'span[data-concept="acumulacion"]': '¿Es Acumulativo (se suman los periodos) o Flujo/Stock (solo cuenta el periodo actual)?',
        'span[data-concept="formula"]': 'La expresión matemática. Verifica que el numerador y denominador tengan sentido juntos.',
        'span[data-concept="unidad"]': '¿Es un Porcentaje (%), Tasa, Número absoluto o Pesos ($)?',
        'span[data-concept="fuente"]': 'De dónde sale la información. Debe ser una fuente oficial confiable (DANE, ministerios, encuestas propias).',
        '.pizarra-step[data-step="1"]': 'Aquí empezamos con el dolor de cabeza real. Escribe lo que dice el directivo o el ciudadano sin filtrar nada.',
        '.pizarra-step[data-step="2"]': 'Tomamos ese dolor y lo partimos en 4 (Población, Atributo, Ámbito, Referente) y lo ubicamos en la Cadena de Valor.',
        '.pizarra-step[data-step="3"]': 'Finalmente, le aplicamos la lista CREMAS para asegurar que sea Claro, Relevante, Económico, Medible, Adecuado y Sensible.',
        '.pizarra-func[data-func="arboles"]': 'Usa el lienzo para dibujar cajas y flechas. Identifica las causas (raíces) y los efectos (ramas) antes de crear el indicador.',
        '.pizarra-func[data-func="mapeo"]': 'Dibuja cómo fluye tu proyecto: Insumo → Actividad → Producto → Resultado.',
        '.pizarra-func[data-func="formulas"]': 'Usa el lápiz para ensayar cuál debería ser el numerador y el denominador antes de pasarlo en limpio.',
        '.pizarra-func[data-func="lluvia"]': 'Un espacio libre para anotar todas las palabras clave de tu indicador y agruparlas hasta que tengan sentido.',
        '.diag-node[data-node="problema"]': 'El problema central es nuestro punto de partida. Todo lo que hagamos abajo debe apuntar a resolver esto.',
        '.diag-node[data-node="insumos"]': 'Aquí va la plata, la gente y las oficinas. Es lo que necesitas para arrancar.',
        '.diag-node[data-node="actividades"]': 'Las tareas del día a día: reuniones, viajes, contrataciones, capacitaciones. ¡No midas solo esto!',
        '.diag-node[data-node="resultados"]': 'El objetivo de oro. Si las actividades funcionaron, el problema original (arriba) debe empezar a desaparecer.'
    };

    function initHoverAssistant() {
        const assistant = document.getElementById('hover-assistant');
        const bubble = document.getElementById('assistant-bubble');
        if (!assistant || !bubble) return;

        let hideTimeout;

        // Añadir listeners a los elementos con hint
        Object.keys(hoverHints).forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                el.addEventListener('mouseenter', () => {
                    clearTimeout(hideTimeout);
                    bubble.innerHTML = hoverHints[selector];
                    assistant.classList.remove('hidden');
                });
                
                el.addEventListener('mouseleave', () => {
                    hideTimeout = setTimeout(() => {
                        assistant.classList.add('hidden');
                    }, 500); // Ocultar después de medio segundo
                });
            });
        });
    }

    function init() {
        loadData();
        bindEvents();
        updateUI();
        renderPortfolio();
        cargarContextoDocumentos();
        initParticles();
        updateGlowListeners();
        initHoverAssistant();
    }

    function initParticles() {
        if (typeof particlesJS !== 'undefined') {
            particlesJS('particles-js', {
                "particles": {
                    "number": {
                        "value": 90,
                        "density": { "enable": true, "value_area": 800 }
                    },
                    "color": { "value": ["#38bdf8", "#f59e0b", "#cbd5e1"] },
                    "shape": { "type": "circle" },
                    "opacity": {
                        "value": 0.6,
                        "random": true,
                        "anim": { "enable": true, "speed": 1.2, "opacity_min": 0.1, "sync": false }
                    },
                    "size": {
                        "value": 3.5,
                        "random": true,
                        "anim": { "enable": true, "speed": 2.5, "size_min": 0.1, "sync": false }
                    },
                    "line_linked": {
                        "enable": true,
                        "distance": 160,
                        "color": "#cbd5e1",
                        "opacity": 0.35,
                        "width": 1.2
                    },
                    "move": {
                        "enable": true,
                        "speed": 2,
                        "direction": "none",
                        "random": true,
                        "straight": false,
                        "out_mode": "out",
                        "bounce": false,
                        "attract": { "enable": true, "rotateX": 600, "rotateY": 1200 }
                    }
                },
                "interactivity": {
                    "detect_on": "window",
                    "events": {
                        "onhover": { "enable": true, "mode": "grab" },
                        "onclick": { "enable": true, "mode": "push" },
                        "resize": true
                    },
                    "modes": {
                        "grab": { "distance": 180, "line_linked": { "opacity": 0.65 } },
                        "push": { "particles_nb": 4 }
                    }
                },
                "retina_detect": true
            });
        }
    }

    async function cargarContextoDocumentos() {
        try {
            // Si la librería pdf.js está cargada (ideal para leer texto real)
            if (window.pdfjsLib) {
                window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
                
                const archivosPDF = [
                    '../12079-1.pdf',
                    '../Indicadores_Gestion_Publica_Preguntas_y_Respuestas.pdf',
                    '../Guia_para_elaborar_Indicadores.pdf',
                    '../Guia_construccion_interpretacion_indicadores.pdf',
                    '../Documento_base_preguntas_gestion_indicadores.pdf'
                ];
                
                let textoExtraido = '';
                
                for (const archivo of archivosPDF) {
                    try {
                        const loadingTask = window.pdfjsLib.getDocument(archivo);
                        const pdf = await loadingTask.promise;
                        for (let i = 1; i <= pdf.numPages; i++) {
                            const page = await pdf.getPage(i);
                            const textContent = await page.getTextContent();
                            const pageText = textContent.items.map(item => item.str).join(' ').replace(/(\. |\? )/g, '$1\n');
                            textoExtraido += pageText + '\n';
                        }
                    } catch(err) {
                        console.warn('No se pudo cargar el PDF: ' + archivo, err);
                    }
                }
                
                if (textoExtraido.length > 100) {
                    CONTEXTO_DOCUMENTOS = textoExtraido;
                    console.log("Cerebro local alimentado con PDFs (" + CONTEXTO_DOCUMENTOS.length + " caracteres)");
                    return; // Éxito
                }
            }
            
            // Intento de lectura de archivo local (respaldo)
            const response = await fetch('../Documento_base_preguntas_gestion_indicadores.pdf');
            if (!response.ok) throw new Error('No se pudo acceder al archivo local');
            CONTEXTO_DOCUMENTOS = await response.text();
            
        } catch (e) {
            console.warn("Fallo lectura local:", e.message);
            CONTEXTO_DOCUMENTOS = 'Basa tus respuestas en la metodología de indicadores del DNP y la Cadena de Valor Pública.';
        }
    }

    function bindEvents() {
        // Navigation
        els.stepBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.currentTarget.getAttribute('data-view');
                goToView(view);
            });
        });

        els.resetBtn.addEventListener('click', () => {
            if (confirm('¿Limpiar los datos del ejercicio actual? (No borrará el portafolio)')) {
                state.data = {
                    preguntaVaga: '',
                    componentes: { poblacion: '', atributo: '', ambito: '', referente: '' },
                    preguntaRefinada: '',
                    cadenaValor: '',
                    nombreIndicador: '',
                    formulaCalculo: '',
                    tipoCalidad: '',
                    acumulacion: '',
                    unidad: '',
                    fuente: ''
                };
                saveState();
                location.reload();
            }
        });

        // Inputs Auto-save
        document.getElementById('preguntaVaga').addEventListener('input', e => { state.data.preguntaVaga = e.target.value; saveState(); });
        ['compPoblacion', 'compAtributo', 'compAmbito', 'compReferente'].forEach(id => {
            document.getElementById(id).addEventListener('input', e => { state.data.componentes[id.replace('comp', '').toLowerCase()] = e.target.value; saveState(); });
        });
        document.getElementById('preguntaRefinada').addEventListener('input', e => { state.data.preguntaRefinada = e.target.value; saveState(); });
        document.querySelectorAll('input[name="cadenaValor"]').forEach(r => {
            r.addEventListener('change', e => { state.data.cadenaValor = e.target.value; saveState(); });
        });
        document.getElementById('nombreIndicador').addEventListener('input', e => { state.data.nombreIndicador = e.target.value; saveState(); });
        document.getElementById('formulaCalculo').addEventListener('input', e => { state.data.formulaCalculo = e.target.value; saveState(); });

        // Learning Center Tabs Logic
        const learningTabBtns = document.querySelectorAll('.learning-sidebar .tab-btn');
        const learningTabContents = document.querySelectorAll('.learning-body .tab-content');

        learningTabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetId = e.currentTarget.getAttribute('data-target');
                learningTabBtns.forEach(b => b.classList.remove('active'));
                learningTabContents.forEach(c => c.classList.remove('active'));
                e.currentTarget.classList.add('active');
                document.getElementById(targetId).classList.add('active');
            });
        });

        // Toggle Copilot Panel
        const toggleCopilotBtn = document.getElementById('toggleCopilotBtn');
        const appContainer = document.querySelector('.app-container');
        if (toggleCopilotBtn) {
            toggleCopilotBtn.addEventListener('click', () => {
                appContainer.classList.toggle('copilot-hidden');
            });
        }

        // Hero Scroll Button
        const startSimulatorBtn = document.getElementById('startSimulatorBtn');
        if (startSimulatorBtn) {
            startSimulatorBtn.addEventListener('click', () => {
                const topBar = document.querySelector('.top-bar');
                if (topBar) {
                    topBar.scrollIntoView({ behavior: 'smooth' });
                }
            });
        }

        // Concept Help Modals
        const helpModal = document.getElementById('helpModal');
        const helpModalTitle = document.getElementById('helpModalTitle');
        const helpModalBody = document.getElementById('helpModalBody');
        const closeHelpModalBtn = document.getElementById('closeHelpModalBtn');

        document.querySelectorAll('.info-help-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const helpKey = e.currentTarget.getAttribute('data-help');
                const textData = helpTexts[helpKey];
                if (textData) {
                    helpModalTitle.innerHTML = `ℹ️ ${textData.title}`;
                    helpModalTitle.style.color = '#000000';
                    helpModalBody.innerHTML = textData.body;
                    // Forzar el color de texto a negro puro directamente desde JS para evitar problemas de contraste y caché CSS
                    helpModalBody.style.color = '#000000';
                    helpModalBody.querySelectorAll('p, li, strong, span, ul').forEach(el => {
                        el.style.color = '#000000';
                    });
                    helpModal.classList.add('active');
                }
            });
        });

        if (closeHelpModalBtn) {
            closeHelpModalBtn.addEventListener('click', () => {
                helpModal.classList.remove('active');
            });
        }

        // PDF Download (Professional Print view trigger)
        const downloadPdfBtn = document.getElementById('downloadPdfBtn');
        if (downloadPdfBtn) {
            downloadPdfBtn.addEventListener('click', () => {
                window.print();
            });
        }

        // Analysis Actions (Instant)
        document.getElementById('analyzeStep1Btn').addEventListener('click', () => {
            if (!state.data.preguntaVaga) return alert("Escribe una pregunta.");
            addChat('Usuario', state.data.preguntaVaga);
            addChat('IA', 'He analizado tu pregunta según la guía del DNP. Asegúrate de que contenga los 4 componentes estructurales clave pasando al Paso 2.');
            goToView('step-2');
        });

        document.getElementById('magicGenerateBtn').addEventListener('click', () => {
            if (!state.data.preguntaVaga) return alert("Escribe un tema o pregunta vaga primero (ej. 'salud en el municipio X').");
            autoGenerateIndicator(state.data.preguntaVaga);
        });

        document.getElementById('analyzeStep2Btn').addEventListener('click', () => {
            addChat('IA', '¡Excelente! Los componentes están desglosados. Esto hace que tu pregunta sea completamente medible. Pasemos a la Cadena de Valor.');
            goToView('step-3');
        });

        document.getElementById('analyzeStep3Btn').addEventListener('click', () => {
            if (!state.data.cadenaValor) return alert("Selecciona un eslabón.");
            let f = state.data.cadenaValor === 'Resultados' ? 'Evaluar Resultados es recomendado por el DNP para medir impacto real.' : 'Estás midiendo ' + state.data.cadenaValor + '.';
            addChat('IA', f + ' Continuemos a la formulación.');
            goToView('step-4');
        });

        document.getElementById('analyzeStep4Btn').addEventListener('click', () => {
            addChat('IA', 'Auditoría CREMAS completada. Nombre estructurado y fórmula lista. ¡Veamos la Ficha Técnica Final!');
            goToView('step-5');
        });

        els.saveBtn.addEventListener('click', () => {
            if (!state.data.nombreIndicador) return alert('El indicador necesita al menos un nombre en el Paso 4.');
            const newInd = { id: Date.now(), date: new Date().toLocaleDateString(), ...state.data };
            portfolio.push(newInd);
            localStorage.setItem('indicadores_portfolio', JSON.stringify(portfolio));
            alert('¡Indicador guardado exitosamente!');
            goToView('portfolio');
        });

        // Expose loadExample to global scope for inline onclick handlers
        window.app = { loadExample };
    }

    function goToView(viewId) {
        state.currentView = viewId;
        saveState();
        updateUI();
        if (viewId === 'step-5') updateFichaTecnica();
        if (viewId === 'portfolio') renderPortfolio();
        updateGlowListeners();
    }

    function updateUI() {
        els.stepMainTitle.textContent = viewInfo[state.currentView].title;
        els.stepMainDesc.textContent = viewInfo[state.currentView].desc;

        els.stepBtns.forEach(btn => {
            if (btn.getAttribute('data-view') === state.currentView) btn.classList.add('active');
            else btn.classList.remove('active');
        });

        els.viewContents.forEach(content => {
            if (content.id === `view-${state.currentView}`) content.classList.add('active');
            else content.classList.remove('active');
        });

        const wizardStepper = document.getElementById('wizardStepper');
        const wizardActions = document.getElementById('wizardActions');

        if (state.currentView.startsWith('step-')) {
            const stepNum = parseInt(state.currentView.replace('step-', ''));
            if (wizardStepper) wizardStepper.style.display = 'flex';
            if (wizardActions) wizardActions.style.display = 'flex';

            document.querySelectorAll('.step-indicator').forEach(indicator => {
                const indicatorNum = parseInt(indicator.getAttribute('data-step'));
                indicator.classList.remove('active', 'completed');
                if (indicatorNum === stepNum) indicator.classList.add('active');
                else if (indicatorNum < stepNum) indicator.classList.add('completed');
            });

            const btnPrev = document.getElementById('btn-prev');
            const btnNext = document.getElementById('btn-next');
            if (btnPrev && btnNext) {
                btnPrev.disabled = stepNum === 1;

                const newBtnPrev = btnPrev.cloneNode(true);
                const newBtnNext = btnNext.cloneNode(true);
                btnPrev.replaceWith(newBtnPrev);
                btnNext.replaceWith(newBtnNext);

                newBtnNext.onclick = () => {
                    if (stepNum === 1 && !state.data.preguntaVaga) return alert("Escribe una pregunta.");
                    if (stepNum === 3 && !state.data.cadenaValor) return alert("Selecciona un eslabón.");
                    if (stepNum === 4 && !state.data.nombreIndicador) return alert('El indicador necesita al menos un nombre en el Paso 4.');

                    if (stepNum < 5) goToView(`step-${stepNum + 1}`);
                    else {
                        const saveBtn = document.getElementById('saveIndicatorBtn');
                        if (saveBtn) saveBtn.click();
                    }
                };
                newBtnPrev.onclick = () => {
                    if (stepNum > 1) goToView(`step-${stepNum - 1}`);
                };

                if (stepNum === 5) {
                    newBtnNext.textContent = 'Guardar Indicador';
                    newBtnNext.className = 'btn success-btn';
                } else {
                    newBtnNext.textContent = 'Siguiente';
                    newBtnNext.className = 'btn primary-btn';
                }
            }
        } else {
            if (wizardStepper) wizardStepper.style.display = 'none';
            if (wizardActions) wizardActions.style.display = 'none';
        }

        populateInputs();
    }

    function populateInputs() {
        document.getElementById('preguntaVaga').value = state.data.preguntaVaga;
        document.getElementById('compPoblacion').value = state.data.componentes.poblacion || '';
        document.getElementById('compAtributo').value = state.data.componentes.atributo || '';
        document.getElementById('compAmbito').value = state.data.componentes.ambito || '';
        document.getElementById('compReferente').value = state.data.componentes.referente || '';
        document.getElementById('preguntaRefinada').value = state.data.preguntaRefinada;
        if (state.data.cadenaValor) {
            const radio = document.querySelector(`input[name="cadenaValor"][value="${state.data.cadenaValor}"]`);
            if (radio) radio.checked = true;
        }
        document.getElementById('nombreIndicador').value = state.data.nombreIndicador;
        document.getElementById('formulaCalculo').value = state.data.formulaCalculo;
    }

    function loadExample(key) {
        const prefix = key.replace(/[0-9]/g, ''); // e.g. 'edu1' -> 'edu'
        
        // Load all data matching this prefix
        Object.keys(examples).forEach(k => {
            if (k.startsWith(prefix)) {
                const ex = examples[k];
                if (ex.preguntaVaga) state.data.preguntaVaga = ex.preguntaVaga;
                if (ex.compPoblacion) state.data.componentes.poblacion = ex.compPoblacion;
                if (ex.compAtributo) state.data.componentes.atributo = ex.compAtributo;
                if (ex.compAmbito) state.data.componentes.ambito = ex.compAmbito;
                if (ex.compReferente) state.data.componentes.referente = ex.compReferente;
                if (ex.preguntaRefinada) state.data.preguntaRefinada = ex.preguntaRefinada;
                if (ex.nombreIndicador) state.data.nombreIndicador = ex.nombreIndicador;
                if (ex.formulaCalculo) state.data.formulaCalculo = ex.formulaCalculo;
            }
        });

        // Set an appropriate Cadena de Valor based on the example
        if (prefix === 'salud') state.data.cadenaValor = 'productos';
        else if (prefix === 'edu' || prefix === 'seg' || prefix === 'amb') state.data.cadenaValor = 'resultados';
        else state.data.cadenaValor = 'actividades';

        saveState();
        populateInputs();
        
        // Ensure UI visually updates the radio buttons for step 3 if currently on step 3 or globally
        if (state.data.cadenaValor) {
            const radio = document.querySelector(`input[name="cadenaValor"][value="${state.data.cadenaValor}"]`);
            if (radio) radio.checked = true;
        }

        addChat('IA', `He cargado el caso completo de ejemplo para que veas cómo se conectan todos los pasos. Puedes revisar cada paso, modificar los datos o avanzar al final.`);
    }

    function updateFichaTecnica() {
        document.getElementById('ft-nombre').textContent = state.data.nombreIndicador || 'Sin definir';
        document.getElementById('ft-pregunta').textContent = state.data.preguntaRefinada || 'Sin definir';
        document.getElementById('ft-cadena').textContent = state.data.cadenaValor || 'Sin definir';
        document.getElementById('ft-formula').textContent = state.data.formulaCalculo || 'Sin definir';
        document.getElementById('ft-calidad').textContent = state.data.tipoCalidad || 'Pendiente';
        document.getElementById('ft-acumulacion').textContent = state.data.acumulacion || 'Pendiente';
        document.getElementById('ft-unidad').textContent = state.data.unidad || 'Pendiente';
        document.getElementById('ft-fuente').textContent = state.data.fuente || 'Sugerida por IA';

        // Calcular Score CREMAS localmente
        let score = 0;
        const criteria = {
            c: (state.data.nombreIndicador && state.data.nombreIndicador.length > 10),
            r: !!state.data.cadenaValor,
            e: (state.data.formulaCalculo && state.data.formulaCalculo.length > 5),
            m: (state.data.formulaCalculo && (state.data.formulaCalculo.includes('/') || state.data.formulaCalculo.includes('*'))),
            a: !!state.data.componentes.poblacion,
            s: !!state.data.componentes.atributo
        };

        let criteriaCount = 0;
        Object.keys(criteria).forEach(key => {
            const isMet = criteria[key];
            const tagEl = document.getElementById(`tag-${key}`);
            if (tagEl) {
                if (isMet) {
                    tagEl.style.background = 'rgba(16, 185, 129, 0.2)';
                    tagEl.style.color = '#10b981';
                    tagEl.style.border = '1px solid #10b981';
                    criteriaCount++;
                } else {
                    tagEl.style.background = 'rgba(255, 255, 255, 0.05)';
                    tagEl.style.color = 'rgba(255, 255, 255, 0.3)';
                    tagEl.style.border = 'none';
                }
            }
        });

        const pct = Math.round((criteriaCount / 6) * 100);
        const scoreEl = document.getElementById('cremasScore');
        const fillEl = document.getElementById('cremasGaugeFill');
        if (scoreEl) scoreEl.textContent = `Score: ${pct}%`;
        if (fillEl) fillEl.style.width = `${pct}%`;
    }

    function autoGenerateIndicator(query) {
        const lowerQuery = query.toLowerCase();
        let entity = "la Entidad";

        // Extract a simple entity/municipality name if it exists (very basic heuristic)
        const match = lowerQuery.match(/(?:en|del) (?:el |la |los |las )?([a-záéíóúñA-ZÁÉÍÓÚÑ]+(?:\s[a-záéíóúñA-ZÁÉÍÓÚÑ]+){0,2})/);
        if (match && match[1]) {
            entity = match[1].trim();
        }

        if (lowerQuery.includes('salud') || lowerQuery.includes('hospital') || lowerQuery.includes('enferm')) {
            state.data.componentes = { poblacion: `Habitantes de ${entity}`, atributo: 'Atención en salud oportuna', ambito: `${entity}, vigencia actual`, referente: 'Año anterior' };
            state.data.preguntaRefinada = `¿Estamos mejorando la atención en salud oportuna para los habitantes de ${entity} en la vigencia actual comparado con el año anterior?`;
            state.data.cadenaValor = 'Resultados';
            state.data.nombreIndicador = `Tasa de atención oportuna en salud en ${entity}`;
            state.data.formulaCalculo = '(Personas atendidas oportunamente / Total de personas que solicitaron atención) * 100';
            state.data.tipoCalidad = 'Eficacia (Oportunidad)';
            state.data.acumulacion = 'Capacidad (Avance hacia la meta)';
            state.data.unidad = 'Porcentaje (%)';
            state.data.fuente = 'Registros Individuales de Prestación de Servicios de Salud (RIPS) – SISPRO';
        } else if (lowerQuery.includes('educación') || lowerQuery.includes('colegio') || lowerQuery.includes('estudiant')) {
            state.data.componentes = { poblacion: `Estudiantes matriculados en ${entity}`, atributo: 'Retención escolar', ambito: `Instituciones públicas de ${entity}, año actual`, referente: 'Meta del plan de desarrollo' };
            state.data.preguntaRefinada = `¿Estamos logrando retener a los estudiantes matriculados en ${entity} durante el año actual frente a la meta del plan de desarrollo?`;
            state.data.cadenaValor = 'Resultados';
            state.data.nombreIndicador = `Tasa de deserción escolar intra-anual en ${entity}`;
            state.data.formulaCalculo = '(Estudiantes que abandonan durante el año / Total de estudiantes matriculados al inicio) * 100';
            state.data.tipoCalidad = 'Eficacia';
            state.data.acumulacion = 'Reducción (Se busca que sea menor que la meta)';
            state.data.unidad = 'Tasa / Porcentaje (%)';
            state.data.fuente = 'Sistema Integrado de Matrícula (SIMAT) / Secretaría de Educación';
        } else if (lowerQuery.includes('seguridad') || lowerQuery.includes('hurto') || lowerQuery.includes('policía') || lowerQuery.includes('atraco')) {
            state.data.componentes = { poblacion: `Ciudadanos de ${entity}`, atributo: 'Reducción de hurtos', ambito: `${entity}, último trimestre`, referente: 'Mismo trimestre año anterior' };
            state.data.preguntaRefinada = `¿Está disminuyendo el hurto a los ciudadanos de ${entity} en el último trimestre frente al mismo trimestre del año anterior?`;
            state.data.cadenaValor = 'Impactos';
            state.data.nombreIndicador = `Variación porcentual de la tasa de hurto a personas en ${entity}`;
            state.data.formulaCalculo = '((Tasa trimestre actual - Tasa mismo trimestre año anterior) / Tasa mismo trimestre año anterior) * 100';
            state.data.tipoCalidad = 'Efectividad (Impacto final)';
            state.data.acumulacion = 'Reducción';
            state.data.unidad = 'Tasa por 10.000 habitantes / Variación %';
            state.data.fuente = 'Sistema de Información Estadístico (SIEDCO) de la Policía Nacional';
        } else if (lowerQuery.includes('ambiente') || lowerQuery.includes('reforestación') || lowerQuery.includes('arbol')) {
            state.data.componentes = { poblacion: `Hectáreas comprometidas en ${entity}`, atributo: 'Sobrevivencia vegetativa de lo sembrado', ambito: `Cuencas de ${entity}, verificación a los 12 meses`, referente: 'Total programado en el plan' };
            state.data.preguntaRefinada = `¿Las hectáreas comprometidas en ${entity} realmente sobreviven, frente a lo programado?`;
            state.data.cadenaValor = 'Resultados';
            state.data.nombreIndicador = `Porcentaje de hectáreas reforestadas con sobrevivencia mayor al 80% en ${entity}`;
            state.data.formulaCalculo = '(N.º hectáreas con sobrevivencia >80% / N.º total hectáreas comprometidas) * 100';
            state.data.tipoCalidad = 'Efectividad';
            state.data.acumulacion = 'Acumulado';
            state.data.unidad = 'Porcentaje (%)';
            state.data.fuente = 'Visitas de verificación en campo, imágenes satelitales';
        } else if (lowerQuery.includes('movilidad') || lowerQuery.includes('transporte') || lowerQuery.includes('trancón')) {
            state.data.componentes = { poblacion: `Usuarios del sistema de transporte en ${entity}`, atributo: 'Reducción de tiempos de viaje', ambito: `Rutas principales de ${entity}, semestre actual`, referente: 'Semestre anterior' };
            state.data.preguntaRefinada = `¿Se están reduciendo los tiempos de viaje de los usuarios del sistema de transporte en ${entity} frente al semestre anterior?`;
            state.data.cadenaValor = 'Resultados';
            state.data.nombreIndicador = `Variación porcentual del tiempo promedio de viaje en rutas de transporte masivo en ${entity}`;
            state.data.formulaCalculo = '((Tiempo promedio viaje actual - Tiempo promedio viaje anterior) / Tiempo promedio viaje anterior) * 100';
            state.data.tipoCalidad = 'Eficacia (Calidad / Oportunidad)';
            state.data.acumulacion = 'Reducción';
            state.data.unidad = 'Porcentaje (%)';
            state.data.fuente = 'Sistema de recaudo (validadores) / GPS de la flota';
        } else if (lowerQuery.includes('empleo') || lowerQuery.includes('trabajo') || lowerQuery.includes('jóvenes') || lowerQuery.includes('jovenes')) {
            state.data.componentes = { poblacion: `Jóvenes beneficiarios de incentivos en ${entity}`, atributo: 'Mantenimiento del empleo formal', ambito: `${entity}, a los 6 meses de contratación`, referente: 'Meta de vinculación' };
            state.data.preguntaRefinada = `¿Los jóvenes beneficiarios en ${entity} mantienen su trabajo formal después de 6 meses?`;
            state.data.cadenaValor = 'Resultados';
            state.data.nombreIndicador = `Porcentaje de jóvenes vinculados formalmente sostenidos a 6 meses en ${entity}`;
            state.data.formulaCalculo = '(Jóvenes que siguen cotizando a los 6 meses / Total de jóvenes contratados inicialmente) * 100';
            state.data.tipoCalidad = 'Efectividad';
            state.data.acumulacion = 'Flujo / Acumulado';
            state.data.unidad = 'Porcentaje (%)';
            state.data.fuente = 'Planilla Integrada de Liquidación de Aportes (PILA)';
        } else if (lowerQuery.includes('contrato') || lowerQuery.includes('licitación') || lowerQuery.includes('licitacion') || lowerQuery.includes('ahorro')) {
            state.data.componentes = { poblacion: `Procesos de licitación pública en ${entity}`, atributo: 'Ahorro real generado', ambito: `${entity}, vigencia anual`, referente: 'Presupuesto oficial estimado' };
            state.data.preguntaRefinada = `¿Estamos generando ahorro real en los procesos de licitación pública en ${entity} comparado con el presupuesto planeado?`;
            state.data.cadenaValor = 'Resultados';
            state.data.nombreIndicador = `Porcentaje de ahorro real en contrataciones por licitación pública en ${entity}`;
            state.data.formulaCalculo = '((Presupuesto oficial ajustado - Valor adjudicado) / Presupuesto oficial ajustado) * 100';
            state.data.tipoCalidad = 'Economía / Eficiencia';
            state.data.acumulacion = 'Acumulado';
            state.data.unidad = 'Porcentaje (%)';
            state.data.fuente = 'SECOP II, estudios de mercado';
        } else {
            // Generic Fallback
            state.data.componentes = { poblacion: `Población objetivo de ${entity}`, atributo: 'Nivel de satisfacción', ambito: `${entity}, periodo actual`, referente: 'Periodo anterior' };
            state.data.preguntaRefinada = `¿Cuál es el nivel de satisfacción de la población objetivo de ${entity} en el periodo actual frente al periodo anterior?`;
            state.data.cadenaValor = 'Resultados';
            state.data.nombreIndicador = `Porcentaje de satisfacción del servicio en ${entity}`;
            state.data.formulaCalculo = '(Usuarios satisfechos / Total de usuarios encuestados) * 100';
            state.data.tipoCalidad = 'Calidad / Satisfacción del usuario';
            state.data.acumulacion = 'Capacidad / Acumulado';
            state.data.unidad = 'Porcentaje (%)';
            state.data.fuente = 'Encuestas de percepción / Sistema de Peticiones, Quejas y Reclamos (PQRS)';
        }

        saveState();
        populateInputs();
        addChat('IA', '✨ He generado una propuesta completa basada en tu solicitud. He llenado todos los pasos automáticamente aplicando la metodología del DNP. Puedes guardar este indicador o navegar a los pasos anteriores para ajustarlo.');
        goToView('step-5');
    }

    function addChat(sender, text) {
        const msgDiv = document.createElement('div');
        msgDiv.className = sender === 'IA' ? 'chat-bubble ai-bubble' : 'chat-bubble user-bubble';
        msgDiv.innerHTML = `<p>${text}</p>`;
        els.copilotChat.appendChild(msgDiv);
        els.copilotChat.scrollTop = els.copilotChat.scrollHeight;
    }

    function renderPortfolio() {
        els.portfolioContainer.innerHTML = '';
        if (portfolio.length === 0) {
            els.portfolioContainer.innerHTML = '<p style="color:var(--text-muted)">No has guardado indicadores aún.</p>';
            return;
        }

        portfolio.forEach(ind => {
            const card = document.createElement('div');
            card.className = 'portfolio-card';
            card.innerHTML = `
                <button class="delete-btn" onclick="app.deleteIndicator(${ind.id})">Borrar</button>
                <h3>${ind.nombreIndicador}</h3>
                <p><strong>Fecha:</strong> ${ind.date}</p>
                <p><strong>Cadena de Valor:</strong> ${ind.cadenaValor || 'N/A'}</p>
                <p><strong>Pregunta:</strong> ${ind.preguntaRefinada}</p>
                <p><strong>Fórmula:</strong> <code>${ind.formulaCalculo}</code></p>
            `;
            els.portfolioContainer.appendChild(card);
        });

        window.app.deleteIndicator = deleteIndicator;
    }

    function deleteIndicator(id) {
        if (confirm('¿Eliminar este indicador?')) {
            portfolio = portfolio.filter(i => i.id !== id);
            localStorage.setItem('indicadores_portfolio', JSON.stringify(portfolio));
            renderPortfolio();
        }
    }

    function saveState() { localStorage.setItem('indicadores_state_v2', JSON.stringify(state)); }

    function loadData() {
        const savedState = localStorage.getItem('indicadores_state_v2');
        if (savedState) try { state = JSON.parse(savedState); } catch (e) { }
        const savedPort = localStorage.getItem('indicadores_portfolio');
        if (savedPort) try { portfolio = JSON.parse(savedPort); } catch (e) { }
    }

    document.getElementById('whiteboardBtn')?.addEventListener('click', () => {
        document.getElementById('whiteboardModal').classList.add('active');
    });

    document.getElementById('closeWhiteboardBtn')?.addEventListener('click', () => {
        document.getElementById('whiteboardModal').classList.remove('active');
    });

    // Lógica del Copiloto Rápido - Local
    const copilotInput = document.getElementById('copilotInput');
    const copilotSendBtn = document.getElementById('copilotSendBtn');

    async function enviarMensajeGemini(mensajeUsuario) {
        const chatBox = document.querySelector('.chat-messages') || document.getElementById('chat-messages') || document.getElementById('copilotChat');
        if (!chatBox) return;

        // Dibujar mensaje del usuario
        const userDiv = document.createElement('div');
        userDiv.className = 'message user-message chat-bubble user-bubble';
        userDiv.textContent = mensajeUsuario;
        chatBox.appendChild(userDiv);

        // Indicador de carga
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'message bot-message typing-indicator chat-bubble ai-bubble';
        loadingDiv.textContent = 'Consultando documentos locales...';
        chatBox.appendChild(loadingDiv);
        chatBox.scrollTop = chatBox.scrollHeight;

        // Simular tiempo de procesamiento
        await new Promise(resolve => setTimeout(resolve, 800));
        loadingDiv.remove();

        let respuestaIA = "Lo siento, no encontré información específica en el documento base sobre lo que preguntas.";
        
        // Lógica del "cerebro local" mejorado: Detección de intenciones y heurística
        const lowerInput = mensajeUsuario.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Quitar tildes para buscar mejor
        
        let exactMatchFound = false;
        if (typeof QA_DATABASE !== 'undefined') {
            const exactMatch = QA_DATABASE.find(item => item.q.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === lowerInput);
            if (exactMatch) {
                respuestaIA = exactMatch.a;
                exactMatchFound = true;
            }
        }

        if (!exactMatchFound) {
        // 1. Reglas Semánticas (Intenciones conocidas sobre Indicadores DNP)
        if (lowerInput.includes('que es un indicador') || lowerInput.includes('que son los indicadores') || (lowerInput.includes('definicion') && lowerInput.includes('indicador'))) {
            respuestaIA = "📊 **¿Qué es un Indicador de Gestión?**\nEs una herramienta cuantitativa o cualitativa que permite medir el nivel de logro de los objetivos, evaluar el desempeño de un proceso o proyecto, y facilitar la toma de decisiones. Básicamente, te dice si estás alcanzando lo que te propusiste.";
        } else if (lowerInput.includes('tipos de indicador') || lowerInput.includes('cuales son los indicadores') || lowerInput.includes('clases de indicador')) {
            respuestaIA = "📑 **Tipos de Indicadores:**\nExisten varias formas de clasificarlos. Las más comunes son:\n1. **Por Cadena de Valor:** Insumo, Actividad, Producto, Resultado e Impacto.\n2. **Por Dimensión de Desempeño:** Eficacia (logro de metas), Eficiencia (uso de recursos), Economía (costos) y Calidad (satisfacción del usuario).";
        } else if (lowerInput.includes('poblacion') || lowerInput.includes('unidad de analisis')) {
            respuestaIA = "✅ **Población o unidad de análisis:**\nResponde a: *¿Sobre quién o qué se pregunta?* (ej: gestantes, hectáreas, estudiantes). Es el primer componente estructural para que tu pregunta sea medible.";
        } else if (lowerInput.includes('atributo') || lowerInput.includes('caracteristica')) {
            respuestaIA = "✅ **Atributo:**\nResponde a: *¿Qué característica de esa población te interesa medir?* (ej: cobertura, calidad, tasa de retención).";
        } else if (lowerInput.includes('ambito') || lowerInput.includes('territorio') || lowerInput.includes('tiempo')) {
            respuestaIA = "✅ **Ámbito temporal y espacial:**\nResponde a: *¿Dónde y en qué periodo ocurre?* (ej: Municipio X, durante la vigencia 2026). Sin esto, el indicador está incompleto.";
        } else if (lowerInput.includes('referente') || lowerInput.includes('comparacion')) {
            respuestaIA = "✅ **Referente de comparación:**\nResponde a: *¿Frente a qué vamos a evaluar el atributo?* (ej: el año anterior, una meta específica, el promedio nacional).";
        } else if (lowerInput.includes('cadena de valor') || lowerInput.includes('eslabones')) {
            respuestaIA = "🔗 **Cadena de Valor Pública:**\nTodo indicador debe clasificarse en uno de estos eslabones:\n1. **Insumos:** Recursos disponibles.\n2. **Actividades:** Procesos realizados.\n3. **Productos:** Bienes/servicios entregados.\n4. **Resultados:** Cambios en la población objetivo.\n5. **Impactos:** Cambios estructurales a largo plazo.";
        } else if (lowerInput.includes('crema') || lowerInput.includes('criterios')) {
            respuestaIA = "📏 **Criterios CREMA:**\nPara que tu indicador sea excelente debe ser:\n- **C**laro (sin ambigüedades)\n- **R**elevante (pertinente al objetivo)\n- **E**conómico (costo razonable de medir)\n- **M**edible (verificable)\n- **A**decuado (aporta base suficiente).";
        } else if (lowerInput.includes('ejemplo') && (lowerInput.includes('indicador') || lowerInput.includes('formula'))) {
            respuestaIA = "💡 **Ejemplo de indicador:**\n*Nombre:* Tasa de deserción escolar intra-anual.\n*Fórmula:* (Estudiantes que abandonan / Total matriculados) * 100.\n*Cadena de valor:* Resultado.";
        } else if (lowerInput.includes('movilidad') || lowerInput.includes('transporte') || lowerInput.includes('trancon')) {
            respuestaIA = "🚌 **Pista - Ejercicio de Movilidad:**\nRecuerda no mezclar indicadores. Es mejor tener uno para **Oferta** (ej: frecuencia de buses, que es un Producto) y otro para el **Efecto** en la gente (ej: tiempos de viaje, que es un Resultado). ¡Busca medir la variación en los minutos de recorrido real usando GPS o datos del validador!";
        } else if (lowerInput.includes('empleo') || lowerInput.includes('trabajo') || lowerInput.includes('jovenes')) {
            respuestaIA = "💼 **Pista - Ejercicio de Empleo:**\n¡Ojo con medir solo 'vacantes publicadas'! Eso es apenas producto. Para medir un verdadero resultado (empleo digno y sostenido), usa la Planilla Integrada de Liquidación de Aportes (PILA) para verificar si la persona sigue cotizando 6 meses después de ser contratada.";
        } else if (lowerInput.includes('contrato') || lowerInput.includes('licitacion') || lowerInput.includes('ahorro')) {
            respuestaIA = "⚖️ **Pista - Ejercicio de Contratación:**\nPara medir 'ahorro', asegúrate de que no haya sub-presupuestación voluntaria (inflar los presupuestos oficiales). Cruza los datos de adjudicación del SECOP II con verdaderos estudios de mercado. El criterio aquí es la Economía.";
        } else {
            // 2. Búsqueda profunda en los documentos locales (CONTEXTO_DOCUMENTOS)
            let matchedLines = [];
            if (CONTEXTO_DOCUMENTOS) {
                // Extraer palabras clave ignorando palabras comunes cortas
                const stopwords = ['como', 'para', 'este', 'esta', 'pero', 'cual', 'quien', 'donde', 'cuando', 'sobre'];
                const queryWords = lowerInput.split(/\s+/).filter(w => w.length > 3 && !stopwords.includes(w));
                
                const lineasContexto = CONTEXTO_DOCUMENTOS.split('\n');
                
                lineasContexto.forEach(linea => {
                    const cleanLinea = linea.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                    // Buscar si al menos 2 palabras clave coinciden (para mayor precisión semántica)
                    const matches = queryWords.filter(word => cleanLinea.includes(word)).length;
                    
                    if ((matches >= 2 || (queryWords.length === 1 && matches === 1)) && linea.trim().length > 15) {
                        if (!matchedLines.includes(linea.trim())) matchedLines.push(linea.trim());
                    }
                });
            }

            if (matchedLines.length > 0) {
                respuestaIA = "📚 **Revisando el repositorio oficial encontré esto:**\n\n" + 
                              matchedLines.slice(0, 2).map(l => "📌 " + l).join('\n\n');
            } else {
                // 3. Respuesta por defecto sin divagar
                respuestaIA = "No encontré una respuesta exacta en el manual oficial para esa consulta. Te sugiero seleccionar una de las preguntas sugeridas en los botones de arriba, o intentar usar términos más específicos como 'cadena de valor', 'SMART', o 'CREMA'.";
            }
        }
        } // Fin de if (!exactMatchFound)

        const botDiv = document.createElement('div');
        botDiv.className = 'message bot-message chat-bubble ai-bubble';
        botDiv.innerHTML = `<p>${respuestaIA.replace(/\n/g, '<br>')}</p>`;
        chatBox.appendChild(botDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    // Lógica del Modal de Preguntas
    const chatSuggestions = document.getElementById('chatSuggestions');
    const qaModal = document.getElementById('qaModal');
    const closeQaBtn = document.getElementById('closeQaBtn');
    const qaModalList = document.getElementById('qaModalList');

    if (closeQaBtn && qaModal) {
        closeQaBtn.addEventListener('click', () => {
            qaModal.classList.remove('active');
        });
    }

    if (chatSuggestions && qaModalList && typeof QA_DATABASE !== 'undefined') {
        // 1. Añadir el botón principal al panel lateral
        chatSuggestions.innerHTML = ''; 
        const openBtn = document.createElement('button');
        openBtn.className = 'suggestion-chip';
        openBtn.style.background = 'var(--primary)';
        openBtn.style.color = 'white';
        openBtn.style.fontWeight = 'bold';
        openBtn.innerHTML = '📚 Ver el Directorio Completo de Preguntas (25)';
        openBtn.addEventListener('click', () => {
            qaModal.classList.add('active');
        });
        chatSuggestions.appendChild(openBtn);

        // 2. Poblar el modal con todas las preguntas
        qaModalList.innerHTML = '';
        QA_DATABASE.forEach(item => {
            const btn = document.createElement('button');
            btn.className = 'qa-modal-btn';
            btn.textContent = item.q;
            btn.addEventListener('click', () => {
                qaModal.classList.remove('active');
                enviarMensajeGemini(item.q);
            });
            qaModalList.appendChild(btn);
        });
    }

    function handleMouseMove(e) {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
        e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
    }

    function updateGlowListeners() {
        document.querySelectorAll('.glass-panel, .vc-card, .card-info').forEach(el => {
            el.removeEventListener('mousemove', handleMouseMove);
            el.addEventListener('mousemove', handleMouseMove);
        });
    }

    init();
});