// Datos de contacto y servicios externos. Todo lo vacío se OCULTA solo en la web (no se muestran enlaces rotos).
export const site = {
  url: 'https://33rec.github.io',          // cambia al dominio propio cuando exista
  name: '33r',
  year: new Date().getFullYear(),
  contact: {
    whatsapp: '',    // solo dígitos con país, ej. 593999999999
    email: '',       // ej. hola@tudominio.com
    instagram: '',   // URL completa
    linkedin: '',    // URL completa
  },
  founders: [
    { name: 'Daniel Goyes M.', role: { es: '', en: '' } },  // rol: pendiente de Daniel
    { name: 'Juan Lozada M.', role: { es: '', en: '' } },   // rol: pendiente de Daniel
  ],
  // Analítica: elige proveedor y pon el ID. provider: 'plausible' | 'ga4' | 'umami' | ''
  analytics: { provider: '', id: '', src: '' },
  // Supabase: SOLO claves públicas (anon). Se leen de variables PUBLIC_* en el build.
  supabase: {
    url: import.meta.env.PUBLIC_SUPABASE_URL ?? '',
    anonKey: import.meta.env.PUBLIC_SUPABASE_ANON_KEY ?? '',
  },
};
