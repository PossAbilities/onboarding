/**
 * Domain model for the PossAbilities induction journey.
 * These types are shared by the data layer (Supabase + demo seed) and the UI.
 */

export type ModuleKind =
  | "video" // welcome video
  | "directors" // meet the directors
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
  avatarUrl: string | null;
  isAdmin: boolean;
  journeyPoints: number;
  status: StarterStatus;
  startedAt: string | null;
  lastActivityAt: string | null;
  invitedBy: string | null;
}

export interface ContentBlock {
  type: "heading" | "paragraph" | "list" | "quote" | "callout";
  text?: string;
  items?: string[];
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

export type CollectionName =
  | "directors"
  | "benefits"
  | "pets"
  | "locations"
  | "badges";

/** Aggregated journey state for the signed-in employee. */
export interface JourneyState {
  profile: Profile;
  modules: Module[];
  progress: ModuleProgress[];
  badges: Badge[];
  earnedBadges: UserBadge[];
  percentComplete: number;
}
