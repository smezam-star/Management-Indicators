const QA_DATABASE = [
    {
        q: "¿Qué es un indicador de gestión pública?",
        a: "Es una expresión cuantitativa o cualitativa que permite describir características, comportamientos o fenómenos de la realidad a través de la evolución de una variable o el establecimiento de una relación entre variables, comparada con periodos anteriores o metas, para evaluar el desempeño."
    },
    {
        q: "¿Qué características tiene una medición adecuada?",
        a: "Una adecuada medición debe ser: Pertinente (relevante y útil para decisiones), Precisa (reflejar fielmente la magnitud real), Oportuna (disponible a tiempo para corregir y prevenir) y Económica (proporcionalidad entre los costos de medición y sus beneficios)."
    },
    {
        q: "¿Qué es un indicador cualitativo vs cuantitativo?",
        a: "Los cuantitativos son una representación numérica de la realidad que pueden ordenarse (ej: promedio de hijos). Los cualitativos evalúan heterogeneidad o capacidades referidas a una escala de cualidades (ej: categóricos como 'bueno/malo' o binarios 'sí/no')."
    },
    {
        q: "¿Cuáles son los criterios de calidad estadística?",
        a: "Relevancia, Credibilidad, Accesibilidad (conveniencia y facilidad de localización de datos), Oportunidad (tiempo entre disponibilidad y evento) y Coherencia (consistencia del proceso estadístico a lo largo del tiempo)."
    },
    {
        q: "¿Qué es la cadena de valor pública?",
        a: "Es el modelo que ubica cada intervención pública en una secuencia lógica: Insumos → Actividades → Productos → Resultados → Impactos. Evita el error común de redactar como 'resultado' algo que en realidad es un 'insumo' o 'producto'."
    },
    {
        q: "¿Qué diferencia hay entre seguimiento y evaluación?",
        a: "El seguimiento es la medición continua y periódica durante la ejecución para detectar desviaciones en tiempo real ('¿vamos bien?'). La evaluación es un ejercicio profundo y puntual que busca establecer relaciones causales de impacto ('¿funcionó, y por qué?')."
    },
    {
        q: "¿Cuáles son los errores más comunes al formular indicadores?",
        a: "1. Confundir producto con resultado.\n2. Formular sin tener una fuente de datos identificada.\n3. Definir metas 'a ojo' sin una línea base verificada.\n4. Redactar preguntas que asumen o presuponen el resultado (ej: ¿por qué ha mejorado tanto?)."
    },
    {
        q: "¿Cómo se articula un indicador con el MIPG?",
        a: "El Modelo Integrado de Planeación y Gestión (MIPG) conecta la planeación estratégica con el desempeño real en siete dimensiones. Los indicadores son el mecanismo de verificación del desempeño anual medido a través del formulario FURAG."
    },
    {
        q: "¿Qué significa que un objetivo sea SMART?",
        a: "SMART es un acrónimo que significa: Specific (Específico y sin ambigüedad), Measurable (Medible con datos), Achievable (Alcanzable), Realistic (Realista según capacidad) y Time-bound (Limitado en el tiempo para su cumplimiento)."
    },
    {
        q: "¿Qué significa que un indicador sea CREMA?",
        a: "CREMA aplica a los indicadores para que sean: Claros (fáciles de interpretar), Relevantes (pertinentes), Económicos (costo razonable de obtener), Medibles (verificables objetivamente) y Adecuados (aportan base suficiente para juzgar el desempeño)."
    },
    {
        q: "¿Es necesario que un indicador tenga siempre una fórmula matemática?",
        a: "La mayoría de indicadores de eficiencia y eficacia requieren fórmula matemática explícita (tasas, razones). Sin embargo, indicadores de calidad pueden construirse a partir de mediciones cualitativas (encuestas) que luego se traducen en un valor cuantitativo agregado."
    },
    {
        q: "¿Cuáles son los cuatro componentes de una pregunta de gestión?",
        a: "1. Población o unidad de análisis (sobre quién/qué).\n2. Atributo o dimensión (qué característica).\n3. Ámbito territorial y temporal (dónde y cuándo).\n4. Referente de comparación (frente a qué se evalúa, ej. una meta o año anterior)."
    },
    {
        q: "¿Cuáles son los indicadores de ejecución presupuestal más utilizados?",
        a: "Los más frecuentes son: Porcentaje de ejecución presupuestal (compromisos vs. asignado), Porcentaje de ejecución de pagos (giros vs. asignado), y Velocidad de ejecución trimestral para detectar rezagos de inversión en el ciclo fiscal."
    },
    {
        q: "¿Qué es la línea base y por qué es indispensable?",
        a: "Es el valor del indicador en el momento inicial contra el cual se medirá todo avance posterior. Fijar una meta sin línea base verificada carece de sentido operativo porque no se sabe con precisión desde qué cifra se parte."
    },
    {
        q: "¿Qué es un indicador de impacto y por qué es el más difícil de construir?",
        a: "Mide cambios estructurales a mediano y largo plazo en la población, asociados a múltiples intervenciones simultáneas (ej: razón de mortalidad). Es el más difícil porque exige atribuir causalidad estricta y a menudo requiere evaluaciones de impacto complejas."
    },
    {
        q: "¿Qué es un indicador de producto?",
        a: "Se refieren a la cantidad y calidad de los bienes y servicios que se generan mediante las actividades de una institución (ej: número de techos construidos o número de talleres realizados)."
    },
    {
        q: "¿Qué es un indicador de resultado?",
        a: "Se refieren a los efectos inmediatos de la acción institucional y/o de un programa sobre la sociedad o entorno (ej: porcentaje de niños vacunados, porcentaje de cobertura de acueducto)."
    },
    {
        q: "¿Qué es un indicador de proceso?",
        a: "Se refieren al seguimiento de la realización de las actividades programadas, respecto a los recursos, tiempos y presupuesto. Miden el esfuerzo administrativo aplicado para lograr los bienes y servicios."
    },
    {
        q: "¿Qué es un indicador de insumo?",
        a: "Se refieren al seguimiento de los recursos financieros, físicos o de talento humano disponibles y utilizados en una intervención o proceso (ej: presupuesto gastado, horas hombre asignadas)."
    },
    {
        q: "¿Cuál es el rol del DANE respecto a los indicadores?",
        a: "Como coordinador del Sistema Estadístico Nacional (SEN), el DANE busca establecer lineamientos técnicos y estándares de calidad para que la información producida por las entidades sea veraz, coherente e imparcial."
    },
    {
        q: "¿Qué evalúa la dimensión de Eficiencia en un indicador?",
        a: "Permite establecer la relación de productividad en el uso de los recursos. Mide qué tantos insumos se requirieron para generar cierta cantidad de productos (ej: costo promedio por estudiante matriculado)."
    },
    {
        q: "¿Qué evalúa la dimensión de Eficacia en un indicador?",
        a: "Expresa el grado de cumplimiento o logro de los objetivos, metas y resultados planeados, independientemente de los costos incurridos (ej: porcentaje de avance en la construcción de una obra)."
    },
    {
        q: "¿Qué evalúa la dimensión de Economía en un indicador?",
        a: "Mide la capacidad de la institución para movilizar o administrar adecuadamente los recursos financieros, minimizando los costos de los insumos pero manteniendo la calidad (ej: ahorro en gastos de funcionamiento)."
    },
    {
        q: "¿Qué es el sistema SINERGIA?",
        a: "Es la herramienta del Gobierno Nacional de Colombia (liderada por el DNP) para hacer seguimiento sistemático al Plan Nacional de Desarrollo y evaluar estratégicamente el desempeño de las políticas públicas."
    },
    {
        q: "¿Por qué se dice que una buena medición debe ser Oportuna?",
        a: "Porque la información recolectada debe estar disponible en el periodo de tiempo exacto en que es relevante para la toma de decisiones, permitiendo corregir rumbos y prevenir fallos estructurales a tiempo."
    }
];
