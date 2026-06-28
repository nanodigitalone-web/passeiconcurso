// Services layer — the ONLY gateway between the UI and data sources.
//
// UI components and hooks must import from "@/services" and never access
// localStorage, the Supabase client, or src/data directly. To migrate to a
// different backend (e.g. full Supabase tables), swap the service internals only.

export * from "./types";

export { quizService } from "./quizService";
export type { Concurso, Categoria, Question } from "./quizService";

export { resultsService } from "./resultsService";
export { authService } from "./authService";
export type { Profile } from "./authService";
export { accessService, clearAccessCache } from "./accessService";
export { notificationsService } from "./notificationsService";
export type { NotificationRow } from "./notificationsService";
export { activityService } from "./activityService";
export { rankingService } from "./rankingService";
export type { RankRow } from "./rankingService";
export { friendsService } from "./friendsService";
export type { FoundUser, FriendRow } from "./friendsService";
export { battlesService } from "./battlesService";
export type { BattleRow } from "./battlesService";
export { paymentsService } from "./paymentsService";
export { adminService } from "./adminService";
export { pushService } from "./pushService";
export { recursosService } from "./recursosService";
export type { RecursoSeccao, RecursoItem, RecursoTipo } from "./recursosService";
export { cursosService } from "./cursosService";
export type { CursoPreparatorio } from "./cursosService";
export { coinsService, COIN_RULES } from "./coinsService";
export type { CoinTx, TopupRequest, WithdrawalRequest } from "./coinsService";
export type { PushStatus } from "./pushService";
