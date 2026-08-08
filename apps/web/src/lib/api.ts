const API_URL = "/api";

export interface SessionResponse {
  user: {
    id: string;
    fullName: string;
    email: string;
    roleKey: string;
    roleName: string;
  };
  tenant: {
    id: string;
    name: string;
    nameAr: string;
    type: string;
    logoUrl: string | null;
    primaryColor: string;
    secondaryColor: string;
  };
}

export interface OverviewResponse {
  activeSystemsCount: number;
  systemHealthPct: number;
  weatherRiskPct: number;
  currentTempC: number | null;
  currentSiteName: string | null;
  externalFactors: { factorType: string; impactPct: number; reason: string | null }[];
  telecomStatus: { providerName: string; status: string; latencyMs: number; uptimePct: number }[];
}

export interface PredictionAction {
  id: string;
  description: string;
  status: string;
  assignedRoleKey: string | null;
  assignedUserName: string | null;
}

export interface Prediction {
  id: string;
  title: string;
  confidencePct: number;
  rootCause: string;
  windowStart: string;
  windowEnd: string;
  siteName: string | null;
  actions: PredictionAction[];
}

export interface Alert {
  id: string;
  category: string;
  severity: string;
  title: string;
  description: string;
  status: string;
  siteName: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

export interface RiskFactorBreakdown {
  factorType: string;
  averageScore: number;
  weight: number;
  sampleCount: number;
}

export interface PowerSite {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  currentLoadKw: number | null;
  maxCapacityKw: number | null;
  loadPct: number;
  generatorFuelPct: number | null;
  upsChargePct: number | null;
  voltage: number | null;
}

export interface PowerCurvePoint {
  recordedAt: string;
  loadPct: number;
}

export interface TelecomSite {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  topologyStatus: "GREEN" | "ORANGE" | "RED";
  providers: {
    providerId: string;
    providerName: string;
    latencyMs: number | null;
    packetLossPct: number | null;
    status: string;
  }[];
}

export interface RiskSite {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  riskScorePct: number;
  infrastructureAgeYears: number;
  historicalIncidentCount: number;
  currentTempC: number | null;
}

export interface WeatherSite {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  temperatureC: number | null;
  humidityPct: number | null;
  aqi: number | null;
  band: "GREEN" | "YELLOW" | "ORANGE" | "RED" | "CRITICAL";
}

export interface EnvironmentResponse {
  compositeIndex: number;
  factors: { key: string; labelAr: string; riskPct: number }[];
  sites: { id: string; name: string; aqi: number | null; temperatureC: number | null; scheduledEventsCount: number }[];
}

export interface DeviceCategoryRow {
  id: string;
  siteName: string;
  category: string;
  activeCount: number;
  offCount: number;
  scheduledCount: number;
  consumptionKw: number;
}

export interface RationingScheduleRow {
  id: string;
  siteName: string;
  name: string;
  timeOfDay: string;
  actionDescription: string;
  expectedSavingsPct: number;
  isActive: boolean;
}

export interface EnergyResponse {
  deviceCategories: DeviceCategoryRow[];
  schedules: RationingScheduleRow[];
  consumptionSummary: { totalConsumptionKw: number; totalSavingsKw: number };
}

export interface SystemComponentRow {
  id: string;
  name: string;
  category: string;
  status: string;
  loadPct: number;
}

export interface SupportTeamMember {
  id: string;
  fullName: string;
  availabilityStatus: string;
  role: { key: string; name: string };
}

export interface EscalationRule {
  id: string;
  level: number;
  delayMinutes: number;
  notifyRoles: string[];
}

export interface CreateAlertPayload {
  title: string;
  description: string;
  severity: "CRITICAL" | "WARNING" | "INFO";
  category: string;
}

export interface CreateAlertResponse {
  alert: Alert;
  assignedUser: { id: string; fullName: string; roleName: string } | null;
}

export interface NotificationChannel {
  id: string;
  type: string;
  isActive: boolean;
}

export interface NotificationPreview {
  channel: string;
  renderedContent: string;
}

export interface NotificationLogRow {
  id: string;
  channel: string;
  status: string;
  renderedContent: string;
  sentAt: string | null;
}

async function authedGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("UNAUTHORIZED");
  }

  return res.json();
}

async function authedPost<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("REQUEST_FAILED");
  }

  return res.json();
}

async function authedPostJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error("REQUEST_FAILED");
  }

  return res.json();
}

async function authedPutJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error("REQUEST_FAILED");
  }

  return res.json();
}

export async function login(email: string, password: string): Promise<SessionResponse> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    throw new Error(res.status === 401 ? "INVALID_CREDENTIALS" : "GENERIC_ERROR");
  }

  return res.json();
}

export async function logout(): Promise<void> {
  await fetch(`${API_URL}/auth/logout`, {
    method: "POST",
    credentials: "include",
  });
}

export interface SetupTenantPayload {
  nameAr: string;
  name: string;
  type: "GOVERNMENT" | "HEALTHCARE" | "PRIVATE" | "NONPROFIT";
  primaryColor: string;
  secondaryColor: string;
  regionName: string;
  siteName: string;
  adminFullName: string;
  adminEmail: string;
  adminPassword: string;
}

export async function setupTenant(
  payload: SetupTenantPayload,
): Promise<{ tenantId: string; adminEmail: string }> {
  const res = await fetch(`${API_URL}/tenants/setup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { message?: string } | null;
    throw new Error(body?.message ?? "GENERIC_ERROR");
  }

  return res.json();
}

export function fetchMe(): Promise<SessionResponse> {
  return authedGet<SessionResponse>("/auth/me");
}

export function fetchOverview(): Promise<OverviewResponse> {
  return authedGet<OverviewResponse>("/overview");
}

export function fetchPredictions(): Promise<Prediction[]> {
  return authedGet<Prediction[]>("/predictions");
}

export function fetchAlerts(): Promise<Alert[]> {
  return authedGet<Alert[]>("/risk/alerts");
}

export function fetchRiskFactors(): Promise<RiskFactorBreakdown[]> {
  return authedGet<RiskFactorBreakdown[]>("/risk/factors");
}

export function fetchPowerMap(): Promise<PowerSite[]> {
  return authedGet<PowerSite[]>("/maps/power");
}

export function fetchPowerCurve(siteId: string): Promise<PowerCurvePoint[]> {
  return authedGet<PowerCurvePoint[]>(`/maps/power/${siteId}/curve`);
}

export function fetchTelecomMap(): Promise<TelecomSite[]> {
  return authedGet<TelecomSite[]>("/maps/telecom");
}

export function fetchRiskMap(): Promise<RiskSite[]> {
  return authedGet<RiskSite[]>("/maps/risk");
}

export function fetchWeatherMap(): Promise<WeatherSite[]> {
  return authedGet<WeatherSite[]>("/maps/weather");
}

export function fetchEnvironment(): Promise<EnvironmentResponse> {
  return authedGet<EnvironmentResponse>("/environment");
}

export function fetchEnergy(): Promise<EnergyResponse> {
  return authedGet<EnergyResponse>("/energy");
}

export function turnOffAc(): Promise<EnergyResponse> {
  return authedPost<EnergyResponse>("/energy/actions/turn-off-ac");
}

export function enableNightRationing(): Promise<EnergyResponse> {
  return authedPost<EnergyResponse>("/energy/actions/enable-night-rationing");
}

export function toggleSchedule(scheduleId: string): Promise<EnergyResponse> {
  return authedPost<EnergyResponse>(`/energy/schedules/${scheduleId}/toggle`);
}

export function fetchSystems(): Promise<SystemComponentRow[]> {
  return authedGet<SystemComponentRow[]>("/systems");
}

export function fetchSupportTeam(): Promise<SupportTeamMember[]> {
  return authedGet<SupportTeamMember[]>("/support/team");
}

export function fetchEscalationRules(): Promise<EscalationRule[]> {
  return authedGet<EscalationRule[]>("/support/escalation-rules");
}

export function createSupportAlert(payload: CreateAlertPayload): Promise<CreateAlertResponse> {
  return authedPostJson<CreateAlertResponse>("/support/alerts", payload);
}

export function fetchNotificationChannels(): Promise<NotificationChannel[]> {
  return authedGet<NotificationChannel[]>("/notifications/channels");
}

export function fetchNotificationPreview(alertId: string): Promise<NotificationPreview[]> {
  return authedGet<NotificationPreview[]>(`/notifications/preview/${alertId}`);
}

export function sendNotifications(alertId: string): Promise<NotificationLogRow[]> {
  return authedPost<NotificationLogRow[]>(`/notifications/send/${alertId}`);
}

export interface IotSensorReading {
  value: number;
  unit: string;
  status: "NORMAL" | "WARNING" | "CRITICAL";
}

export interface IotSite {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  status: "NORMAL" | "WARNING" | "CRITICAL";
  readings: Record<string, IotSensorReading>;
  activeAlertsCount: number;
}

export interface IotOverview {
  summary: { critical: number; warning: number; normal: number };
  sites: IotSite[];
}

export interface AlertPreference {
  id: string;
  channels: string[];
  thresholds: Record<string, number>;
  watchedRegionIds: string[];
}

export interface RegionOption {
  id: string;
  name: string;
}

export interface CategorySummaryRow {
  category: string;
  openCount: number;
}

export interface ChatMessageRow {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  createdAt: string;
}

export interface CompositeAlert {
  id: string;
  siteName: string;
  factors: string[];
  recommendation: string;
  actionType: "ENABLE_NIGHT_RATIONING" | "TURN_OFF_AC" | null;
}

export function fetchIotOverview(): Promise<IotOverview> {
  return authedGet<IotOverview>("/iot/overview");
}

export function fetchMyAlertPreference(): Promise<AlertPreference> {
  return authedGet<AlertPreference>("/alert-preferences/me");
}

export function updateMyAlertPreference(
  payload: { channels: string[]; thresholds: Record<string, number>; watchedRegionIds: string[] },
): Promise<AlertPreference> {
  return authedPutJson<AlertPreference>("/alert-preferences/me", payload);
}

export function fetchRegions(): Promise<RegionOption[]> {
  return authedGet<RegionOption[]>("/alert-preferences/regions");
}

export function fetchCategorySummary(): Promise<CategorySummaryRow[]> {
  return authedGet<CategorySummaryRow[]>("/alert-preferences/category-summary");
}

export function createChatConversation(): Promise<{ id: string }> {
  return authedPost<{ id: string }>("/chat/conversations");
}

export function fetchChatMessages(conversationId: string): Promise<ChatMessageRow[]> {
  return authedGet<ChatMessageRow[]>(`/chat/conversations/${conversationId}/messages`);
}

export function sendChatMessage(conversationId: string, content: string): Promise<ChatMessageRow> {
  return authedPostJson<ChatMessageRow>(`/chat/conversations/${conversationId}/messages`, { content });
}

export function fetchCompositeAlerts(): Promise<CompositeAlert[]> {
  return authedGet<CompositeAlert[]>("/chat/composite-alerts");
}

export interface FederatedRound {
  roundNumber: number;
  aggregateAccuracy: number | null;
  completedAt: string | null;
}

export interface FederatedAuditEntry {
  id: string;
  tenantName: string;
  tenantType: string;
  weightsHash: string;
  auditHashSelf: string;
  submittedAt: string;
}

export interface FederatedStatus {
  isParticipating: boolean;
  participatingTenantsCount: number;
  rounds: FederatedRound[];
  myLatestUpdate: { accuracyBefore: number; accuracyAfter: number; submittedAt: string } | null;
  auditChain: FederatedAuditEntry[];
}

export interface FederatedRoundResult {
  roundNumber: number;
  aggregateAccuracy: number;
  participatingTenants: {
    tenantId: string;
    tenantName: string;
    sampleCount: number;
    accuracyBefore: number;
    accuracyAfter: number;
  }[];
}

export function fetchFederatedStatus(): Promise<FederatedStatus> {
  return authedGet<FederatedStatus>("/federated/status");
}

export function joinFederatedNetwork(): Promise<unknown> {
  return authedPost("/federated/join");
}

export function leaveFederatedNetwork(): Promise<unknown> {
  return authedPost("/federated/leave");
}

export function runFederatedRound(): Promise<FederatedRoundResult> {
  return authedPost<FederatedRoundResult>("/federated/rounds/run");
}

export interface ScenarioFactorsInput {
  temperatureC: number;
  loadPct: number;
  humidityPct: number;
  aqi: number;
  powerOutageHours: number;
  suspiciousLoginAttempts: number;
}

export interface ScenarioImpactRow {
  siteName: string;
  affectedService: string;
  estimatedCost: number | null;
  cascadeStep: number;
}

export interface ScenarioRunResult {
  id: string;
  isNovel: boolean;
  impactScore: number;
  rootCauseExplanation: string;
  impacts: {
    siteId: string;
    siteName: string;
    combined: number;
    affectedService: string;
    estimatedCost: number;
    cascadeStep: number;
  }[];
}

export interface ScenarioListRow {
  id: string;
  triggeredBy: "MANUAL" | "NIGHTLY_SWEEPER";
  isNovel: boolean;
  impactScore: number | null;
  rootCauseExplanation: string | null;
  createdAt: string;
  impacts: ScenarioImpactRow[];
}

export interface SweepResult {
  scanned: number;
  discovered: { id: string; impactScore: number; rootCauseExplanation: string | null; inputFactors: ScenarioFactorsInput }[];
}

export interface Playbook {
  id: string;
  name: string;
  isFrozen: boolean;
  activatedAt: string | null;
  scenarioRun: { impactScore: number | null; rootCauseExplanation: string | null };
}

export function runScenario(factors: ScenarioFactorsInput): Promise<ScenarioRunResult> {
  return authedPostJson<ScenarioRunResult>("/scenarios/run", factors);
}

export function runNightlySweep(): Promise<SweepResult> {
  return authedPost<SweepResult>("/scenarios/sweep/run");
}

export function fetchScenarios(): Promise<ScenarioListRow[]> {
  return authedGet<ScenarioListRow[]>("/scenarios");
}

export function freezePlaybook(scenarioId: string, name: string): Promise<Playbook> {
  return authedPostJson<Playbook>(`/scenarios/${scenarioId}/freeze`, { name });
}

export function fetchPlaybooks(): Promise<Playbook[]> {
  return authedGet<Playbook[]>("/scenarios/playbooks/all");
}

export function activatePlaybook(playbookId: string): Promise<Playbook> {
  return authedPost<Playbook>(`/scenarios/playbooks/${playbookId}/activate`);
}

export type ScheduledServiceType = "HEARING" | "APPOINTMENT" | "TRANSACTION";
export type ContinuityActionType = "REMOTE" | "RE_ROUTED" | "CANCELLED";
export type ContinuitySourceType = "PREDICTION" | "SCENARIO";

export interface ScheduledServiceRow {
  id: string;
  type: ScheduledServiceType;
  siteName: string;
  scheduledAt: string;
  beneficiaryContact: string;
}

export interface ContinuityProposal {
  scheduledServiceId: string;
  type: ScheduledServiceType;
  siteName: string;
  scheduledAt: string;
  beneficiaryContact: string;
  severity: number;
  recommendedAction: ContinuityActionType;
  reason: string;
  alreadyApplied: boolean;
}

export interface ContinuityActionRow {
  id: string;
  sourceType: ContinuitySourceType;
  sourceLabel: string | null;
  serviceType: ScheduledServiceType;
  siteName: string;
  scheduledAt: string;
  beneficiaryContact: string;
  actionTaken: ContinuityActionType;
  notifiedAt: string | null;
  createdAt: string;
}

export interface ApplyContinuityResult {
  action: {
    id: string;
    sourceType: ContinuitySourceType;
    predictionId: string | null;
    scenarioRunId: string | null;
    scheduledServiceId: string;
    actionTaken: ContinuityActionType;
    notifiedAt: string | null;
    createdAt: string;
  };
  notificationPreview: string;
}

export function fetchScheduledServices(): Promise<ScheduledServiceRow[]> {
  return authedGet<ScheduledServiceRow[]>("/continuity/scheduled-services");
}

export function evaluateContinuity(
  sourceType: ContinuitySourceType,
  sourceId: string,
): Promise<ContinuityProposal[]> {
  return authedPostJson<ContinuityProposal[]>("/continuity/evaluate", {
    sourceType,
    sourceId,
  });
}

export function applyContinuityAction(
  payload: {
    scheduledServiceId: string;
    sourceType: ContinuitySourceType;
    sourceId: string;
    actionTaken: ContinuityActionType;
  },
): Promise<ApplyContinuityResult> {
  return authedPostJson<ApplyContinuityResult>("/continuity/actions", payload);
}

export function fetchContinuityActions(): Promise<ContinuityActionRow[]> {
  return authedGet<ContinuityActionRow[]>("/continuity/actions");
}

export interface AuditLogRow {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  actor: { fullName: string } | null;
}

export function fetchAuditLogs(): Promise<AuditLogRow[]> {
  return authedGet<AuditLogRow[]>("/audit-logs");
}
