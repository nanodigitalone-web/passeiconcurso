// Categorias que já têm Recursos clínicos disponíveis (concursoId/categoriaId).
export const RECURSOS_DISPONIVEIS = new Set([
  "licenciatura-medicina/medicina-interna",
  "licenciatura-medicina/pediatria",
]);

export const temRecursos = (concursoId: string, categoriaId: string) =>
  RECURSOS_DISPONIVEIS.has(`${concursoId}/${categoriaId}`);
