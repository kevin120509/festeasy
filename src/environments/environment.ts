// IMPORTANTE: Las claves de producción deben configurarse durante el build
// usando variables de entorno del sistema de CI/CD
// Ejemplo: ng build --configuration=production con fileReplacements

export const environment = {
    production: true,
    supabaseUrl: 'https://ghlosgnopdmrowiygxdm.supabase.co',
    supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdobG9zZ25vcGRtcm93aXlneGRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0NDc5MTYsImV4cCI6MjA4NDAyMzkxNn0.QBuV39Q41gCxU4mpr_WTMPsWZXRjEHglyQPm6R8WjV8',
    paypalClientId: 'Aep7v55aGp4_DdV4lKz2UGjX_mwGl9Mad09sU7CP_rV0UBeb5XP31eM4UaeCr3-m7t-LxqKlBOv9n-u-'
};
