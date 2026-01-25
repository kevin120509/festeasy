// Entorno de desarrollo
// ADVERTENCIA: La clave service_role NO debe usarse en el frontend
// Solo usar la clave 'anon' en aplicaciones cliente

export const environment = {
    production: false,
    supabaseUrl: 'https://ghlosgnopdmrowiygxdm.supabase.co',
    // IMPORTANTE: Regenerar estas claves ya que fueron expuestas en el repositorio
    // Usar solo la clave 'anon' en frontend, nunca 'service_role'
    supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdobG9zZ25vcGRtcm93aXlneGRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0NDc5MTYsImV4cCI6MjA4NDAyMzkxNn0.QBuV39Q41gCxU4mpr_WTMPsWZXRjEHglyQPm6R8WjV8',
    paypalClientId: 'Aep7v55aGp4_DdV4lKz2UGjX_mwGl9Mad09sU7CP_rV0UBeb5XP31eM4UaeCr3-m7t-LxqKlBOv9n-u-'
};
