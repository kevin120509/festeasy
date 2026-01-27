// Este es un archivo de prueba para el hook de pre-commit.
try {
  throw new Error("Esto es un error de prueba");
} catch (e) {
  // Este bloque catch está intencionalmente mal manejado para la prueba.
  console.log(e);
}
