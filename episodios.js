// episodios.js - Base de datos de series y episodios (modernizada 2025-2026)
// Soporta: solo audio, solo video, o ambos en el mismo episodio

// ---------- FUNCIÓN AUXILIAR PARA CREAR SLUGS ----------
function slugify(text) {
    if (!text) return '';
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

// ---------- LISTA DE SERIES ----------
export const series = [
    {
        seriesid: "teoria-del-proceso",
        portada_serie: 'https://balta-media.odoo.com/web/image/658-redirect/960bc627aab97e6134955b4d5d1c99d0.jpg',
        titulo_serie: 'Teoría del proceso',
        descripcion_serie: 'Proceso en el derecho y la forma de poner en movimiento la maquinaria de Justicia',
        url_serie: '/teoria-del-proceso',
        bgColor: '#056aa8'
    },
    {
        seriesid: "ddhh",
        portada_serie: 'https://scout.es/wp-content/uploads/2021/12/186-01.jpg',
        titulo_serie: 'Derechos Humanos',
        descripcion_serie: 'Derechos Humanos',
        url_serie: '/ddhh',
        bgColor: '#7c3aed'
    },
    {
        seriesid: "procesal-constitucional",
        portada_serie: 'https://balta.odoo.com/web/image/417-e2fd48e0/media.webp',
        titulo_serie: 'Derecho Procesal Constitucional',
        descripcion_serie: 'Derecho Procesal Constitucional',
        url_serie: '/procesal-constitucional',
        bgColor: '#1e40af'
    },
    {
        seriesid: "ddpp-3-clases",
        portada_serie: 'https://balta-media.odoo.com/web/image/925-6ed84678/DERECHO%20PENAL%20III.png',
        titulo_serie: 'Derecho penal 3',
        descripcion_serie: 'Derecho Público',
        url_serie: '/ddpp-3/clases'
    },
    {
        seriesid: "dp-indigenas",
        portada_serie: 'https://balta-media.odoo.com/web/image/1031-a693e9ca/Pueblos%20ind%C3%ADgenas.webp',
        titulo_serie: 'Derecho de los pueblos indígenas',
        descripcion_serie: 'Los derechos de tercera generación. Desarrolla los derechos de los pueblos indígenas o también conocidos como derechos de solidaridad.',
        url_serie: '/dp-indigenas'
    },
    {
        seriesid: "derecho-laboral-1",
        portada_serie: 'https://balta-media.odoo.com/web/image/1030-545c090f/DERECHO%20LABORAL.webp',
        titulo_serie: 'Derecho Laboral 1',
        descripcion_serie: 'Un derecho humano por excelencia. Es la ciencia, una disciplina pública. Ciencias Sociales.',
        url_serie: '/derecho-laboral-1'
    },
    {
        seriesid: "derecho-civil-3",
        portada_serie: 'https://balta-media.odoo.com/web/image/1036-2f9d7316/civil%20iii.webp',
        titulo_serie: 'Derecho Civil 3',
        descripcion_serie: 'Contratos. Sociedad. Mercado. Economía. Derecho Privado. Sociedad.',
        url_serie: '/derecho-civil-3'
    },
    {
        seriesid: "el-mundo-de-la-quimica",
        portada_serie: 'https://canal.uned.es/uploads/pic/Serial/296/Video/7848/5385eb3e1d0c7.png',
        titulo_serie: 'El Mundo de la Química',
        descripcion_serie: 'Ciencas Naturales. Tecnología. Ciencia. Química. Biología',
        url_serie: '/m-quimica'
    }
];

const seriesMap = Object.fromEntries(series.map(s => [s.seriesid, s]));

// ---------- EPISODIOS ORIGINALES + CAMPOS MODERNIZADOS ----------
const episodiosBase = [
    {
        id: "la-excepcion",
        date: '2025-11-28',
        mediaUrl: 'https://d3ctxlq1ktw2nl.cloudfront.net/staging/2025-10-29/413399242-44100-2-2f259e66aeac3.m4a',
        coverUrl: 'https://s3-us-west-2.amazonaws.com/anchor-generated-image-bank/staging/podcast_uploaded_nologo400/44500417/44500417-1759018829686-8b0dde55850ed.jpg',
        title: 'La excepción en el proceso de administración de Justicia',
        description: 'La excepción en el proceso de administración de Justicia',
        allowDownload: false,
        author: "Barahona",
        seriesid: "teoria-del-proceso"
    },
    {
        id: "principios-procesales",
        date: '2025-11-28',
        mediaUrl: 'https://balta-derecho.odoo.com/documents/content/3L5vYn32Sq-M5sUKB96S1Ao9',
        coverUrl: 'https://s3-us-west-2.amazonaws.com/anchor-generated-image-bank/staging/podcast_uploaded_nologo400/44500417/44500417-1759018829686-8b0dde55850ed.jpg',
        title: 'Principios procesales',
        description: 'La excepción en el proceso de administración de Justicia',
        allowDownload: false,
        author: "Barahona",
        seriesid: "teoria-del-proceso"
    },
    {
        id: "responsabilidad-penal-adolecencia",
        date: '2025-11-01',
        mediaVideo: 'https://lb.s3.odysee.tv/vods2.odysee.live/odysee-replays/84515919a2e010fa2c381702a6777c1035c2deb3/1762812470.mp4',
        coverUrl: 'https://balta.odoo.com/web/image/417-e2fd48e0/media.webp',
        title: 'Responsabilidad penal en la adolecencia',
        description: 'Conferencia de Derechos Humanos. Sobre la responsabilidad penal de la adolecencia, las penas y las medidas de seguridad.',
        allowDownload: false,
        author: "Rony Eulalio",
        seriesid: "ddhh",
        detailUrl: '/ddhh/adolecencia'
    },
    {
        id: "repaso-dd-procesal-constitucional",
        date: '2025-11-01',
        mediaVideo: 'https://lb.s3.odysee.tv/vods2.odysee.live/odysee-replays/84515919a2e010fa2c381702a6777c1035c2deb3/1762807738.mp4',
        coverUrl: 'https://balta.odoo.com/web/image/417-e2fd48e0/media.webp',
        title: 'Repaso de DD Procesal Constitucional',
        description: 'Penultima clase de Derecho Procesal Constitucional 2025',
        allowDownload: false,
        author: "César Solares",
        seriesid: "procesal-constitucional"
    },
    {
        id: "corrientes-teoria-delito",
        date: '2026-02-10',
        mediaUrl: "https://d3ctxlq1ktw2nl.cloudfront.net/staging/2026-1-13/418061888-44100-2-bd0c488cd9ace.m4a",
        coverUrl: 'https://balta-media.odoo.com/web/image/925-6ed84678/DERECHO%20PENAL%20III.png',
        title: "Corrientes de la teoría del delito",
        author: "Lemus",
        description: "Continuación de las corrientes de la teoría del delito. Teoría causalista, finalista y funcionalista.",
        allowDownload: false,
        seriesid: "ddpp-3-clases"
    },
    {
        id: "teoria-causalista",
        date: '2026-02-03',
        mediaVideo: "https://lb.s3.odysee.tv/vods2.odysee.live/odysee-replays/dd57d90536480f9a751ba4429447fd5f613efce3/1770150346.mp4",
        coverUrl: 'https://balta-media.odoo.com/web/image/925-6ed84678/DERECHO%20PENAL%20III.png',
        title: "La teoría causalista",
        author: "Lemus",
        description: "Desarrollo de la teoría causalista. Derecho Penal 3. Historia, Ciencia.",
        allowDownload: false,
        seriesid: "ddpp-3-clases"
    },
    {
        id: "que-es-derecho-penal",
        date: '2026-01-29',
        mediaUrl: "https://podcasts.com/api/download-episode/214790939",
        coverUrl: 'https://balta-media.odoo.com/web/image/925-6ed84678/DERECHO%20PENAL%20III.png',
        title: "¿Qué es el Derecho Penal?",
        author: "Lemus",
        description: "Conjunto de normas jurídicas de naturaleza pública que regulan los delitos, las penas y las medidas de seguridad. Ciencia pública. Derecho, Historia.",
        allowDownload: false,
        seriesid: "ddpp-3-clases"
    },
    {
        id: "tipicidad-elementos-delito",
        date: '2026-02-12',
        mediaUrl: "https://d3ctxlq1ktw2nl.cloudfront.net/staging/2026-1-13/418069738-44100-2-616f210f1eb48.m4a",
        coverUrl: 'https://balta-media.odoo.com/web/image/925-6ed84678/DERECHO%20PENAL%20III.png',
        title: "La tipicidad y los elementos del delito",
        author: "Lemus",
        description: "Análisis profundo del concepto de tipicidad en derecho y sociedad. Una mirada crítica y actual. Ciencia.",
        allowDownload: false,
        seriesid: "ddpp-3-clases"
    },
    {
        id: "crisis-estado-derecho",
        date: '2026-02-06',
        mediaUrl: "https://d3ctxlq1ktw2nl.cloudfront.net/staging/2026-1-13/418064713-44100-2-ed2c58b07cd6.m4a",
        coverUrl: 'https://balta-media.odoo.com/web/image/927-edc793ab/Pueblos%20ind%C3%ADgenas.png',
        title: "Crisis del Estado de Derecho",
        author: "Raymundo",
        description: "La crisis del Estado de Derecho. Por Lic. Raymundo Catz. El estado de derecho en crisis por los derechos de segunda y tercera generación.",
        allowDownload: false,
        seriesid: "dp-indigenas"
    },
    {
        id: "conceptos-basicos-ddhh",
        date: '2026-02-04',
        mediaVideo: "https://lb.s3.odysee.tv/vods2.odysee.live/odysee-replays/dd57d90536480f9a751ba4429447fd5f613efce3/1770236623.mp4",
        coverUrl: 'https://balta-media.odoo.com/web/image/927-edc793ab/Pueblos%20ind%C3%ADgenas.png',
        title: "Conceptos básicos de los Derechos Humanos",
        author: "Raymundo",
        description: "Conceptos básicos de los Derechos Humanos",
        allowDownload: false,
        seriesid: "dp-indigenas"
    },
    {
        id: "racismo-despojo",
        date: '2026-02-27',
        mediaUrl: "https://d3ctxlq1ktw2nl.cloudfront.net/staging/2026-1-28/418987705-44100-2-8e6e4199302ae.m4a",
        coverUrl: 'https://balta-media.odoo.com/web/image/927-edc793ab/Pueblos%20ind%C3%ADgenas.png',
        title: "El despojo y el racismo",
        author: "Raymundo",
        description: "Continuidad del tema: El despojo en Guatemala de las tierras indígenas. Y un análisis del racismo en Guatemala. Guerra, conflicto",
        allowDownload: false,
        seriesid: "dp-indigenas",
        detailUrl: '/dp-indigenas/despojo-y-racismo'
    },
    {
        id: "antecedentes-derecho-trabajo",
        date: '2026-02-02',
        mediaUrl: 'https://d3ctxlq1ktw2nl.cloudfront.net/staging/2026-1-2/417347225-44100-2-38463f72786e9.m4a',
        coverUrl: 'https://balta-media.odoo.com/web/image/929-b905c3ef/DERECHO%20LABORAL.png',
        title: 'Antecedentes Históricos del derecho de Trabajo',
        description: 'Antecedentes históricos del derecho de trabajo. Avidan Ortiz. Historia del derecho Laboral.',
        allowDownload: false,
        author: "Avidan Ortiz",
        seriesid: "derecho-laboral-1"
    },
    {
        id: "derechos-sociales-minimos",
        date: '2026-02-17',
        mediaUrl: 'https://d3ctxlq1ktw2nl.cloudfront.net/staging/2026-1-18/418308999-44100-2-4ae99683be33e.m4a',
        coverUrl: 'https://balta-media.odoo.com/web/image/929-b905c3ef/DERECHO%20LABORAL.png',
        title: 'Derechos sociales mínimos (DL)',
        description: 'Derechos sociales mínimos del derecho de trabajo. Consitución. Son derechos sociales mínimos que fundamentan la legislación del trabajo y la actividad de los tribunales y autoridades.',
        allowDownload: false,
        author: "Avidan Ortiz",
        seriesid: "derecho-laboral-1",
        detailUrl: '/derecho-laboral-1/ds-minimos'
    },
    {
        id: "fundamento-constitucional-laboral",
        date: '2026-02-27',
        mediaUrl: 'https://d3ctxlq1ktw2nl.cloudfront.net/staging/2026-1-28/418987766-44100-2-e2401169376bd.m4a',
        coverUrl: 'https://balta-media.odoo.com/web/image/929-b905c3ef/DERECHO%20LABORAL.png',
        title: 'Fundamento Constitucional Laboral',
        description: 'Fundamento constitucional del derecho de trabajo. Artículos 108 al 117 de la Constitución Política de la República de Guatemala.',
        allowDownload: false,
        author: "Avidan Ortiz",
        seriesid: "derecho-laboral-1",
        detailUrl: '/derecho-laboral-1/constitucional'
    },
    {
        id: "fuentes-derecho-trabajo",
        date: '2026-02-06',
        mediaVideo: 'https://d3ctxlq1ktw2nl.cloudfront.net/staging/2026-1-13/ca5f6f25-3b96-ff31-bb04-e712a81ce076.m4a',
        coverUrl: 'https://balta-media.odoo.com/web/image/929-b905c3ef/DERECHO%20LABORAL.png',
        title: 'Fuentes del Derecho de Trabajo',
        description: 'Historia. Fuentes del Derecho de trabajo. Ciencia.',
        allowDownload: false,
        author: "Avidan Ortiz",
        seriesid: "derecho-laboral-1"
    },
    {
        id: "veliz-franco-vs-guatemala",
        date: '2025-09-27',
        mediaUrl: 'https://d3ctxlq1ktw2nl.cloudfront.net/staging/2025-8-28/408260699-44100-2-4b5edeb875805.m4a',
        coverUrl: 'https://s3-us-west-2.amazonaws.com/anchor-generated-image-bank/staging/podcast_uploaded_episode400/44500417/44500417-1759018710643-950caadc41ea7.jpg',
        title: 'Veliz Franco y Otros Vs. Guatemala - Exposición',
        description: 'Guatemala presentaba un alto índice de impunidad general, en cuyo marco la mayoría de los actos violentos que conllevaban la muerte de mujeres quedaban impunes.',
        allowDownload: true,
        author: "Melany y Laura",
        seriesid: "ddhh",
        detailUrl: '/dh/caso-veliz-franco-vs-guatemala'
    },
    {
        id: "analisis-art-321-c-penal",
        date: '2026-03-17',
        mediaUrl: "https://d3ctxlq1ktw2nl.cloudfront.net/staging/2026-2-17/420234670-44100-2-de45e5688c25e.m4a",
        coverUrl: 'https://balta-media.odoo.com/web/image/925-6ed84678/DERECHO%20PENAL%20III.png',
        title: "Análisis Artículo 321 Código Penal",
        author: "Lemus",
        description: "Análisis de los artículos 321 y 322. Falsedad material y falsedad idieolígica. Derecho Penal Guatemalteco. Delitos. Criminal. Derehcos Humanos. Ciencia. Investigación.",
        allowDownload: false,
        seriesid: "ddpp-3-clases"
    },
    {
        id: "analisis-art-323-326-c-penal",
        date: '2026-03-19',
        mediaUrl: "https://podcasts.com/api/download-episode/214799043",
        coverUrl: 'https://balta-media.odoo.com/web/image/925-6ed84678/DERECHO%20PENAL%20III.png',
        title: "Análisis Artículos 323 a 326 Código Penal",
        author: "Lemus",
        description: "Análisis de los artículos 321 y 322. Falsedad material y falsedad idieolígica. Derecho Penal Guatemalteco. Delitos. Criminal. Derehcos Humanos. Ciencia. Investigación.",
        allowDownload: true,
        seriesid: "ddpp-3-clases",
        detailUrl: '/ddpp-3-clases/323-326'
    },
    {
        id: "derecho-de-obligaciones",
        date: '2026-01-28',
        mediaUrl: "https://d3ctxlq1ktw2nl.cloudfront.net/staging/2026-2-6/419435680-44100-2-430de7e946de8.m4a",
        coverUrl: 'https://balta-media.odoo.com/web/image/1036-2f9d7316/civil%20iii.webp',
        title: "Derecho de obligaciones (Clase 1)",
        author: "Héctor Ortíz",
        description: "Conferencia. Derecho de Obligaciones. Contrato.",
        allowDownload: false,
        seriesid: "derecho-civil-3",
        detailUrl: '/derecho-civil-3/clase-1'
    },
    {
        id: "fuentes-de-las-obligaciones",
        date: '2026-01-29',
        mediaUrl: "https://d3ctxlq1ktw2nl.cloudfront.net/staging/2026-2-6/419435797-44100-2-c0e15358ed6c5.m4a",
        coverUrl: 'https://balta-media.odoo.com/web/image/1036-2f9d7316/civil%20iii.webp',
        title: "Fuentes de las obligaciones (Clase 2)",
        author: "Héctor Ortíz",
        description: "Conferencia. Fuentes de las obligaciones. Historia. Derecho Romano.",
        allowDownload: false,
        seriesid: "derecho-civil-3",
        detailUrl: '/derecho-civil-3/clase-2'
    },
    {
        id: "hechos-ilicitos",
        date: '2026-02-03',
        mediaUrl: "https://d3ctxlq1ktw2nl.cloudfront.net/staging/2026-2-6/419435898-44100-2-8f4e3581effeb.m4a",
        coverUrl: 'https://balta-media.odoo.com/web/image/1036-2f9d7316/civil%20iii.webp',
        title: "Hechos Ilícitos -Cuasidelitos- (Clase 3)",
        author: "Héctor Ortíz",
        description: "Conferencia. Cuadidelitos. Pena de daños y perjuicios.",
        allowDownload: false,
        seriesid: "derecho-civil-3",
        detailUrl: '/derecho-civil-3/clase-3'
    },
    {
        id: "teoria-de-la-culpabilidad-civil",
        date: '2026-02-05',
        mediaUrl: "https://d3ctxlq1ktw2nl.cloudfront.net/staging/2026-2-6/419435997-44100-2-8214ff3e298b.m4a",
        coverUrl: 'https://balta-media.odoo.com/web/image/1036-2f9d7316/civil%20iii.webp',
        title: "Teoría de la culpabilidad civil (Clase 4)",
        author: "Héctor Ortíz",
        description: "Conferencia. Derecho de Obligaciones. Contrato.",
        allowDownload: false,
        seriesid: "derecho-civil-3",
        detailUrl: '/derecho-civil-3/clase-4'
    },
    {
        id: "respondabilidad-civil",
        date: '2026-02-11',
        mediaUrl: "https://d3ctxlq1ktw2nl.cloudfront.net/staging/2026-2-6/419436066-44100-2-ee664322a702d.m4a",
        coverUrl: 'https://balta-media.odoo.com/web/image/1036-2f9d7316/civil%20iii.webp',
        title: "Responsabilidad Civil -cuasidelitos-fianl (clase 5)",
        author: "Héctor Ortíz",
        description: "Conferencia. Derecho de Obligaciones. Contrato.",
        allowDownload: false,
        seriesid: "derecho-civil-3",
        detailUrl: '/derecho-civil-3/clase-5'
    },
    {
        id: "actos-ilicitos-sin-convenio",
        date: '2026-02-12',
        mediaUrl: "https://d3ctxlq1ktw2nl.cloudfront.net/staging/2026-2-6/419436157-44100-2-ed4e4d5f050cb.m4a",
        coverUrl: 'https://balta-media.odoo.com/web/image/1036-2f9d7316/civil%20iii.webp',
        title: "Actos Ilícitos sin convenio (clase 6)",
        author: "Héctor Ortíz",
        description: "Conferencia. Derecho de Obligaciones. Contrato.",
        allowDownload: false,
        seriesid: "derecho-civil-3",
        detailUrl: '/derecho-civil-3/clase-6'
    },
    {
        id: "gestion-de-negocios",
        date: '2026-02-17',
        mediaUrl: "https://d3ctxlq1ktw2nl.cloudfront.net/staging/2026-2-6/419436248-44100-2-cad693ad7a9b.m4a",
        coverUrl: 'https://balta-media.odoo.com/web/image/1036-2f9d7316/civil%20iii.webp',
        title: "Gestión de negocios (clase 7)",
        author: "Héctor Ortíz",
        description: "Conferencia. Derecho de Obligaciones. Contrato. Otras ciencias.",
        allowDownload: false,
        seriesid: "derecho-civil-3",
        detailUrl: '/derecho-civil-3/clase-7'
    },
    {
        id: "declaracion-unilateral-de-voluntad",
        date: '2026-02-19',
        mediaUrl: "https://d3ctxlq1ktw2nl.cloudfront.net/staging/2026-2-6/419436328-44100-2-1905ccdfa1797.m4a",
        coverUrl: 'https://balta-media.odoo.com/web/image/1036-2f9d7316/civil%20iii.webp',
        title: "Declaración unilateral de voluntad (clase 8)",
        author: "Héctor Ortíz",
        description: "Conferencia. Derecho de Obligaciones. Contrato.",
        allowDownload: false,
        seriesid: "derecho-civil-3",
        detailUrl: '/derecho-civil-3/clase-8'
    },
    {
        id: "obligaciones-segun-el-sujeto-1",
        date: '2026-03-03',
        mediaUrl: "https://d3ctxlq1ktw2nl.cloudfront.net/staging/2026-2-17/420234086-44100-2-df4d595ab8d8d.m4a",
        coverUrl: 'https://balta-media.odoo.com/web/image/1036-2f9d7316/civil%20iii.webp',
        title: "Obligaciones según el sujeto parte-1 (clase 9)",
        author: "Héctor Ortíz",
        description: "Conferencia. Derecho de Obligaciones. Contrato.",
        allowDownload: false,
        seriesid: "derecho-civil-3",
        detailUrl: '/derecho-civil-3/clase-9'
    },
    {
        id: "obligaciones-segun-el-sujeto-2",
        date: '2026-03-03',
        mediaUrl: "https://d3ctxlq1ktw2nl.cloudfront.net/staging/2026-2-6/419436066-44100-2-ee664322a702d.m4a",
        coverUrl: 'https://balta-media.odoo.com/web/image/1036-2f9d7316/civil%20iii.webp',
        title: "Obligaciones según el sujeto parte-2 (clase 10)",
        author: "Héctor Ortíz",
        description: "Conferencia. Derecho de Obligaciones. Contrato.",
        allowDownload: false,
        seriesid: "derecho-civil-3",
        detailUrl: '/derecho-civil-3/clase-10'
    },
    {
        id: "el-atomo-6",
        date: '1988-01-01',
        mediaVideo: "https://archive.org/download/mundo-quimica-atomo/emq-atomo.mp4",
        coverUrl: 'https://archive.org/download/mundo-quimica-atomo/atomo.jpg',
        title: "El átomo episodio 6",
        author: "University of Maryland",
        description: "El mundo de la química. Ciencias Naturales. Tecnología. La ciencia atómica. Biología. Química. TV. Cine. Serie",
        allowDownload: false,
        seriesid: "el-mundo-de-la-quimica",
        detailUrl: '/m-quimica/episodio-6'
    },
    {
        id: "el-atomo-1",
        date: '1988-01-01',
        mediaVideo: "https://archive.org/download/mundo-quimica-1/EMQ-0101.mp4",
        coverUrl: 'https://dn721602.ca.archive.org/0/items/mundo-quimica-1/__ia_thumb.jpg',
        title: "El átomo episodio 1",
        author: "University of Maryland",
        description: "El mundo de la química. Ciencias Naturales. Tecnología. La ciencia atómica. Biología. Química. Cine. TV. Serie.",
        allowDownload: false,
        seriesid: "el-mundo-de-la-quimica",
        detailUrl: '/m-quimica/episodio-1'
    },
    {
        id: "queen-isablella-1",
        date: '2023-09-17',
        mediaVideo: "https://archive.org/download/cccomd-Queen_Isabella_I_en_Espanol/Queen_Isabella_I_en_Espanol.mp4",
        coverUrl: 'https://dn721802.ca.archive.org/0/items/cccomd-Queen_Isabella_I_en_Espanol/__ia_thumb.jpg',
        title: "Reina Isabela clip",
        author: "Charlie",
        description: "Historia. Ciencia. TV. Cine. ",
        allowDownload: false,
        detailUrl: '/queen-isabella'
    },
    {
        id: "electromagnetismo-efectos",
        date: '2024-10-03',
        mediaVideo: "https://archive.org/download/4-efectos-de-las-radiaciones-electromagneticas-sobre-el-adn-5-g-documental-en-espanol/4_Efectos%20de%20las%20radiaciones%20electromagn%C3%A9ticas%20sobre%20el%20ADN%20%285G%29%20%20%20Documental%20en%20Espa%C3%B1ol.mp4",
        coverUrl: 'https://archive.org/download/4-efectos-de-las-radiaciones-electromagneticas-sobre-el-adn-5-g-documental-en-espanol/4-efectos-de-las-radiaciones-electromagneticas-sobre-el-adn-5-g-documental-en-espanol.thumbs/4_Efectos%20de%20las%20radiaciones%20electromagn%C3%A9ticas%20sobre%20el%20ADN%20%285G%29%20%20%20Documental%20en%20Espa%C3%B1ol_000001.jpg',
        title: "Efectos De Las Radiaciones Electromagnéticas Sobre El ADN",
        author: "University of Maryland",
        description: "El mundo de la química. Ciencias Naturales. Tecnología. La ciencia atómica. Biología. Química. El documental sobre el efecto de las radiaciones electromagnéticas sobre el ADN explora cómo la exposición a radiaciones de alta energía, como los rayos ultravioleta y las radiaciones ionizantes, puede provocar daños graves en el ADN celular. Estos daños pueden incluir mutaciones, ruptura de cadenas de ADN, y alteraciones que, si no son reparadas por los mecanismos celulares, podrían transmitirse a las células hijas, con el potencial de causar enfermedades como el cáncer. El documental destaca la importancia de la protección frente a estas radiaciones. Medicina. Biología. Ciencia. Química.",
        allowDownload: false,
        detailUrl: '/electromagnetismo-efectos-4'
    }
];

// ---------- PROCESAMIENTO FINAL ── TODOS LOS CAMPOS REQUERIDOS ----------
const episodios = episodiosBase.map(ep => {
    const hasVideo = !!ep.mediaVideo;
    const hasAudio = !!ep.mediaUrl;

    return {
        id: ep.id,
        date: ep.date,
        title: ep.title,
        author: ep.author,
        description: ep.description,
        allowDownload: ep.allowDownload ?? false,
        seriesid: ep.seriesid,
        detailUrl: ep.detailUrl ?? 
            (seriesMap[ep.seriesid]?.url_serie 
                ? `${seriesMap[ep.seriesid].url_serie}/${slugify(ep.title)}` 
                : '/'),

        // ── Campos para el reproductor ──
        mediaUrl:     ep.mediaUrl    ?? '',
        mediaVideo:   ep.mediaVideo  ?? '',
        initialMode:  ep.initialMode ?? (hasVideo ? 'video' : (hasAudio ? 'audio' : 'audio')),

        coverUrl:     ep.coverUrl    ?? '',
        coverInfo:    ep.coverUrl    ?? '',   // copia automática como en demo
        text:         ep.description ?? '',
        subtitlesUrl: ep.subtitlesUrl ?? '',
        bgColor:      ep.bgColor     ?? seriesMap[ep.seriesid]?.bgColor ?? '#0a0a0a',
        premium:      ep.premium     ?? 'false'
    };
});

export { episodios };

// ---------- FUNCIONES DE ACCESO ----------
export function getEpisodioById(id) {
    return episodios.find(ep => ep.id === id);
}

export function getEpisodioByDetailUrl(url) {
    return episodios.find(ep => ep.detailUrl === url);
}

export function getSerieByUrl(url) {
    return series.find(s => s.url_serie === url);
}

export function getSerieById(seriesid) {
    return seriesMap[seriesid];
}

export function getEpisodiosBySerieId(seriesid) {
    return episodios.filter(ep => ep.seriesid === seriesid);
}

export function getEpisodiosBySerieUrl(url) {
    const serie = getSerieByUrl(url);
    return serie ? getEpisodiosBySerieId(serie.seriesid) : [];
}

export function getAllEpisodios() {
    return episodios;
}

export function getEpisodiosConSerie() {
    return episodios.map(ep => ({
        ...ep,
        series: getSerieById(ep.seriesid) || null
    }));
}
