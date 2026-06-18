/**
 * Domain model for the PossAbilities induction journey.
 * These types are shared by the data layer (Supabase + demo seed) and the UI.
 */

export type ModuleKind =
  | "video" // welcome video
  | "photo" // upload your profile / ID photo
  | "directors" // meet the directors
  | "manager" // meet your (assigned) manager
  | "culture" // culture & values
  | "benefits" // perks
  | "bigidea" // innovation portal
  | "pets" // very important pets wellbeing hub
  | "locations" // locations & services gallery
  | "game" // interactive checkpoint
  | "content" // generic rich content
  | "certificate"; // completion

export type ProgressStatus =
  | "locked"
  | "available"
  | "in_progress"
  | "completed";

export type StarterStatus = "invited" | "active" | "completed";

export interface Profile {
  id: string;
  fullName: string;
  email: string;
  roleTag: string;
  department: string | null;
  managerId: string | null;
  avatarUrl: string | null;
  isAdmin: boolean;
  journeyPoints: number;
  status: StarterStatus;
  startedAt: string | null;
  lastActivityAt: string | null;
  invitedBy: string | null;
}

/** A manager whose intro video appears on their assigned starters' journeys. */
export interface Manager {
  id: string;
  name: string;
  role: string;
  department: string;
  bio: string;
  photoUrl: string;
  videoUrl: string | null;
  calendarUrl: string | null;
  order: number;
}

export interface ContentBlock {
  type: "heading" | "paragraph" | "list" | "quote" | "callout" | "gallery";
  text?: string;
  items?: string[];
  images?: string[];
  author?: string;
}

export interface Module {
  id: string;
  slug: string;
  order: number;
  level: number;
  kind: ModuleKind;
  title: string;
  shortTitle: string;
  description: string;
  estMinutes: number;
  required: boolean;
  badgeId: string | null;
  rewardXp: number;
  heroMediaUrl: string | null;
  heroPoster: string | null;
  icon?: string | null; // optional Material Symbol override for the path node
  content: ContentBlock[];
}

export interface Director {
  id: string;
  name: string;
  role: string;
  bio: string;
  photoUrl: string;
  videoUrl: string | null;
  order: number;
}

export interface Benefit {
  id: string;
  category: string;
  title: string;
  description: string;
  icon: string; // material symbol name
  order: number;
  highlight: boolean;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  xp: number;
  criteria: string;
}

export type IdeaStatus = "submitted" | "reviewing" | "implemented" | "popular";

export interface Idea {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string | null;
  title: string;
  description: string;
  category: string;
  status: IdeaStatus;
  votes: number;
  createdAt: string;
}

export interface Pet {
  id: string;
  name: string;
  species: string;
  owner: string;
  photoUrl: string;
  funFact: string;
}

export interface Location {
  id: string;
  name: string;
  region: string;
  description: string;
  imageUrl: string;
  services: string[];
}

export interface ModuleProgress {
  moduleId: string;
  status: ProgressStatus;
  completedAt: string | null;
  score: number | null;
}

export interface UserBadge {
  badgeId: string;
  unlockedAt: string;
}

export interface Invite {
  id: string;
  email: string;
  fullName: string;
  roleTag: string;
  token: string;
  status: "pending" | "accepted" | "expired";
  invitedBy: string;
  createdAt: string;
}

/** A document a starter must read and digitally sign (native e-sign). */
export interface SignDocument {
  id: string;
  title: string;
  description: string;
  body: string | null; // rich text/HTML shown inline (if no file)
  fileUrl: string | null; // uploaded PDF/image shown in a viewer
  required: boolean;
  order: number;
}

export interface DocumentSignature {
  documentId: string;
  signedName: string;
  signatureData: string | null; // PNG data URL of the drawn signature
  signedAt: string;
}

/** API key allowing an external system to call the inbound webhooks. */
export interface ApiKey {
  id: string;
  name: string;
  key: string;
  revoked: boolean;
  lastUsedAt: string | null;
  createdAt: string;
}

export interface InboundEvent {
  id: string;
  endpoint: string;
  ok: boolean;
  status: number;
  summary: string;
  createdAt: string;
}

/** Outbound API integration (webhook) configured by an admin. */
export interface IntegrationHeader {
  key: string;
  value: string;
}

export interface Integration {
  id: string;
  name: string;
  event: string; // an IntegrationEvent value
  enabled: boolean;
  method: "POST" | "PUT" | "PATCH" | "GET";
  url: string;
  headers: IntegrationHeader[];
  bodyTemplate: string; // JSON with {{token}} placeholders
  updatedAt: string | null;
}

export interface IntegrationDelivery {
  id: string;
  integrationId: string;
  integrationName: string;
  event: string;
  statusCode: number | null;
  ok: boolean;
  error: string | null;
  createdAt: string;
}

/** A starter's saved sign-in for one of their platforms (encrypted at rest). */
export interface Credential {
  id: string;
  platform: string;
  username: string;
  secret: string; // decrypted only when returned to the owner
  url: string | null;
  notes: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  icon: string;
  href: string | null;
  read: boolean;
  createdAt: string;
}

export type EmailTrigger = "welcome" | "reminder" | "completion" | "custom";

export interface EmailTemplate {
  id: string;
  name: string;
  trigger: EmailTrigger;
  subject: string;
  html: string;
  enabled: boolean;
  updatedAt: string | null;
}

/** A PossAbilities value used in the culture Values-Match game. */
export interface CompanyValue {
  id: string;
  label: string; // e.g. "Remain Passionate"
  icon: string; // material symbol
  match: string; // the description the player matches to the value
  order: number;
}

export type CollectionName =
  | "directors"
  | "benefits"
  | "pets"
  | "locations"
  | "badges"
  | "values"
  | "managers";

/** Aggregated journey state for the signed-in employee. */
export interface JourneyState {
  profile: Profile;
  modules: Module[];
  progress: ModuleProgress[];
  badges: Badge[];
  earnedBadges: UserBadge[];
  percentComplete: number;
}
