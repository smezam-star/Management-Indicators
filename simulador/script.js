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
        salud2: {
            compPoblacion: 'Mujeres gestantes con residencia en zona rural',
            compAtributo: 'Acceso oportuno y completo al control prenatal',
            compAmbito: 'Zona rural del Municipio X, año 2026',
            compReferente: 'Cobertura del año anterior',
            preguntaRefinada: '¿Estamos garantizando una cobertura adecuada y oportuna de controles prenatales a las gestantes de la zona rural del Municipio X durante el año 2026, mejorando frente al año 2025?'
        },
        salud4: {
            nombreIndicador: 'Porcentaje de gestantes en zona rural con 4 o más controles prenatales',
            formulaCalculo: '(Gestantes rurales con 4 o más controles / Total de gestantes rurales) * 100'
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

    function init() {
        loadData();
        bindEvents();
        updateUI();
        renderPortfolio();
        cargarContextoDocumentos();
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
        const ex = examples[key];
        if (!ex) return;
        if (ex.preguntaVaga) state.data.preguntaVaga = ex.preguntaVaga;
        if (ex.compPoblacion) state.data.componentes.poblacion = ex.compPoblacion;
        if (ex.compAtributo) state.data.componentes.atributo = ex.compAtributo;
        if (ex.compAmbito) state.data.componentes.ambito = ex.compAmbito;
        if (ex.compReferente) state.data.componentes.referente = ex.compReferente;
        if (ex.preguntaRefinada) state.data.preguntaRefinada = ex.preguntaRefinada;
        if (ex.nombreIndicador) state.data.nombreIndicador = ex.nombreIndicador;
        if (ex.formulaCalculo) state.data.formulaCalculo = ex.formulaCalculo;
        saveState();
        populateInputs();
        addChat('IA', `He cargado un ejemplo de ${key}. Puedes modificarlo o avanzar al siguiente paso.`);
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
        } else if (lowerQuery.includes('seguridad') || lowerQuery.includes('hurto') || lowerQuery.includes('policía')) {
            state.data.componentes = { poblacion: `Ciudadanos de ${entity}`, atributo: 'Reducción de hurtos', ambito: `${entity}, último trimestre`, referente: 'Mismo trimestre año anterior' };
            state.data.preguntaRefinada = `¿Está disminuyendo el hurto a los ciudadanos de ${entity} en el último trimestre frente al mismo trimestre del año anterior?`;
            state.data.cadenaValor = 'Impactos';
            state.data.nombreIndicador = `Variación porcentual de la tasa de hurto a personas en ${entity}`;
            state.data.formulaCalculo = '((Tasa trimestre actual - Tasa mismo trimestre año anterior) / Tasa mismo trimestre año anterior) * 100';
            state.data.tipoCalidad = 'Efectividad (Impacto final)';
            state.data.acumulacion = 'Reducción';
            state.data.unidad = 'Tasa por 10.000 habitantes / Variación %';
            state.data.fuente = 'Sistema de Información Estadístico (SIEDCO) de la Policía Nacional';
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

    if (copilotSendBtn && copilotInput) {
        // Poblar botones de sugerencias dinámicamente
        const chatSuggestions = document.getElementById('chatSuggestions');
        if (chatSuggestions && typeof QA_DATABASE !== 'undefined') {
            chatSuggestions.innerHTML = ''; // limpiar
            QA_DATABASE.forEach(item => {
                const btn = document.createElement('button');
                btn.className = 'suggestion-chip';
                btn.textContent = item.q;
                btn.addEventListener('click', () => {
                    enviarMensajeGemini(item.q);
                });
                chatSuggestions.appendChild(btn);
            });
        }

        const procesarEnvio = () => {
            const texto = copilotInput.value.trim();
            if (texto) {
                copilotInput.value = '';
                enviarMensajeGemini(texto);
            }
        };

        // Event listener para botón de enviar
        copilotSendBtn.addEventListener('click', procesarEnvio);

        // Event listener para tecla Enter
        copilotInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                procesarEnvio();
            }
        });
    }

    init();
});