import type {
  Badge,
  Benefit,
  Director,
  Idea,
  Location,
  Module,
  Pet,
  Profile,
} from "./types";

/**
 * Seed / demo content. This populates every page out-of-the-box so the site is
 * fully viewable without a backend. When Supabase is configured this same data
 * is used to seed the database (see supabase/seed.sql). Replace placeholder
 * media via the admin Content Editor.
 */

// A reliable, small, public-domain sample video for native playback.
// Swap for your real welcome video in the admin Content Editor.
export const SAMPLE_VIDEO =
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4";
const SAMPLE_VIDEO_2 =
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";

const img = (seed: string, w = 800, h = 480) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`;
const avatar = (n: number) => `https://i.pravatar.cc/300?img=${n}`;

export const BADGES: Badge[] = [
  {
    id: "first-contact",
    name: "First Contact",
    description: "Watched the Welcome video from our CEO.",
    icon: "verified",
    xp: 50,
    criteria: "Complete the Welcome module",
  },
  {
    id: "culture-champion",
    name: "Culture Champion",
    description: "Completed all of the culture & values modules.",
    icon: "diversity_3",
    xp: 150,
    criteria: "Complete Culture & Values",
  },
  {
    id: "the-pioneer",
    name: "The Pioneer",
    description: "Submitted your first BIG Idea.",
    icon: "lightbulb",
    xp: 100,
    criteria: "Submit an idea to the BIG Idea portal",
  },
  {
    id: "navigator",
    name: "Navigator",
    description: "Found all 3 hidden Easter eggs across the journey.",
    icon: "explore",
    xp: 120,
    criteria: "Find 3 Easter eggs",
  },
  {
    id: "people-person",
    name: "People Person",
    description: "Met all of the directors.",
    icon: "groups",
    xp: 80,
    criteria: "Complete Meet the Directors",
  },
  {
    id: "summit",
    name: "Summit",
    description: "Completed the entire induction journey.",
    icon: "emoji_events",
    xp: 300,
    criteria: "Reach 100% completion",
  },
];

export const MODULES: Module[] = [
  {
    id: "m-welcome",
    slug: "welcome",
    order: 1,
    level: 1,
    kind: "video",
    title: "Mission 01: The Welcome",
    shortTitle: "Welcome Home",
    description:
      "A message from our leadership about our mission and the road ahead. Meet the directors and learn who's who.",
    estMinutes: 5,
    required: true,
    badgeId: "first-contact",
    rewardXp: 50,
    heroMediaUrl: SAMPLE_VIDEO,
    heroPoster: img("welcome-hero", 1200, 675),
    content: [
      {
        type: "heading",
        text: "Let's Get Started!",
      },
      {
        type: "paragraph",
        text: "This module is designed to give you a soft landing. You'll find three main components below: a welcome video from our CEO, a map of the campus, and a quick 'Vibe Check' quiz to see what you already know about PossAbilities.",
      },
      {
        type: "quote",
        text: "Pushing back the boundaries of what it means to be person centred; helping to create a level playing field for vulnerable people.",
        author: "Sarah Chen, CEO",
      },
    ],
  },
  {
    id: "m-culture",
    slug: "culture",
    order: 2,
    level: 2,
    kind: "culture",
    title: "Mission 02: Our Culture & Values",
    shortTitle: "Our Culture",
    description:
      "Step into the heart of PossAbilities. Discover how we celebrate brilliance, foster innovation, and recognise the people who make our mission possible.",
    estMinutes: 12,
    required: true,
    badgeId: "culture-champion",
    rewardXp: 150,
    heroMediaUrl: SAMPLE_VIDEO_2,
    heroPoster: img("culture-hero", 1200, 675),
    content: [
      { type: "heading", text: "Values in Action" },
      {
        type: "paragraph",
        text: "Our values aren't posters on a wall — they shape every decision we make. Match each value to how it shows up day-to-day in the mini-game, then explore real stories from the team.",
      },
    ],
  },
  {
    id: "m-benefits",
    slug: "benefits",
    order: 3,
    level: 3,
    kind: "benefits",
    title: "Mission 03: Your Life, Your Perks",
    shortTitle: "Benefits",
    description:
      "We believe that when you thrive, we thrive. Our benefits are designed to support your financial health, professional growth, and personal wellbeing.",
    estMinutes: 8,
    required: true,
    badgeId: null,
    rewardXp: 90,
    heroMediaUrl: null,
    heroPoster: img("benefits-hero", 1200, 675),
    content: [
      { type: "heading", text: "More than a salary" },
      {
        type: "paragraph",
        text: "From competitive pay and pension to a £24k Employee Assistance fund and retail discounts, here's everything that comes with being part of the team.",
      },
    ],
  },
  {
    id: "m-bigidea",
    slug: "big-idea",
    order: 4,
    level: 4,
    kind: "bigidea",
    title: "Mission 04: The BIG Idea Portal",
    shortTitle: "The BIG Idea",
    description:
      "Got a better way to do things? We want to hear it! Join the movement of thinkers and builders making our company better every day.",
    estMinutes: 6,
    required: false,
    badgeId: "the-pioneer",
    rewardXp: 100,
    heroMediaUrl: null,
    heroPoster: img("bigidea-hero", 1200, 675),
    content: [
      { type: "heading", text: "Rewards for Brilliance" },
      {
        type: "paragraph",
        text: "Every implemented idea translates to tangible rewards. Reach the top of the Mastermind ladder and unlock exclusive experience mentoring.",
      },
    ],
  },
  {
    id: "m-pets",
    slug: "very-important-pets",
    order: 5,
    level: 5,
    kind: "pets",
    title: "Mission 05: Very Important Pets",
    shortTitle: "V.I.P. Wellbeing",
    description:
      "Our furry teammates are a huge part of our culture. Meet them here — and discover our wellbeing hub.",
    estMinutes: 4,
    required: false,
    badgeId: null,
    rewardXp: 60,
    heroMediaUrl: null,
    heroPoster: img("pets-hero", 1200, 675),
    content: [
      { type: "heading", text: "Wellbeing comes first" },
      {
        type: "paragraph",
        text: "Say hello to the office pets and explore the resources, support lines and activities that keep our team happy and healthy.",
      },
    ],
  },
  {
    id: "m-locations",
    slug: "locations",
    order: 6,
    level: 6,
    kind: "locations",
    title: "Mission 06: Locations & Services",
    shortTitle: "Locations",
    description:
      "Explore where we work and the brilliant services we deliver across the region.",
    estMinutes: 5,
    required: false,
    badgeId: null,
    rewardXp: 60,
    heroMediaUrl: null,
    heroPoster: img("locations-hero", 1200, 675),
    content: [
      { type: "heading", text: "Find your way around" },
      {
        type: "paragraph",
        text: "From day services to supported living, here's a gallery of the places that make up PossAbilities.",
      },
    ],
  },
  {
    id: "m-certificate",
    slug: "certificate",
    order: 7,
    level: 7,
    kind: "certificate",
    title: "Mission 07: Reach the Summit",
    shortTitle: "Certificate",
    description:
      "Finalise your induction by reviewing and signing your digital documents, then download your official completion certificate.",
    estMinutes: 3,
    required: true,
    badgeId: "summit",
    rewardXp: 300,
    heroMediaUrl: null,
    heroPoster: img("summit-hero", 1200, 675),
    content: [
      { type: "heading", text: "You've reached the summit!" },
      {
        type: "paragraph",
        text: "Your journey data has been synchronized with the HR portal. You can now download your official certificate for your professional development records.",
      },
    ],
  },
];

export const DIRECTORS: Director[] = [
  {
    id: "d-sarah",
    name: "Sarah Chen",
    role: "Chief Executive Officer",
    bio: "Sarah leads our mission to push back the boundaries of person-centred care. Her door is always open and she wants to make sure you feel right at home.",
    photoUrl: avatar(47),
    videoUrl: null,
    order: 1,
  },
  {
    id: "d-marcus",
    name: "Marcus Thorne",
    role: "Director of Operations",
    bio: "Our mission is to streamline brilliance for our frontline teams. Marcus is here to ensure you have the tools to succeed.",
    photoUrl: avatar(12),
    videoUrl: null,
    order: 2,
  },
  {
    id: "d-elena",
    name: "Elena Rodriguez",
    role: "Director of People & Culture",
    bio: "You aren't just an employee, you're a part of our ecosystem. Elena's home is a culture of belonging.",
    photoUrl: avatar(45),
    videoUrl: null,
    order: 3,
  },
  {
    id: "d-david",
    name: "David Park",
    role: "Director of Innovation",
    bio: "Never stop asking 'what if?'. David can't wait to hear the fresh perspectives you bring to the table.",
    photoUrl: avatar(33),
    videoUrl: null,
    order: 4,
  },
];

export const BENEFITS: Benefit[] = [
  {
    id: "b-pay",
    category: "Growth & Lifestyle",
    title: "Competitive Pay & Pension",
    description:
      "A salary that recognises your value, paired with a leading pension contribution scheme to secure your future.",
    icon: "payments",
    order: 1,
    highlight: false,
  },
  {
    id: "b-wellbeing",
    category: "Health & Wellbeing",
    title: "Flexible Working",
    description:
      "Work-life balance is not just a buzzword here. We trust our teams and offer flexible patterns where roles allow.",
    icon: "self_improvement",
    order: 2,
    highlight: false,
  },
  {
    id: "b-eap",
    category: "Health & Wellbeing",
    title: "Employee Assistance",
    description:
      "24/7 confidential support for mental health, legal advice, and personal financial guidance when you need it most.",
    icon: "health_and_safety",
    order: 3,
    highlight: false,
  },
  {
    id: "b-learning",
    category: "Growth & Lifestyle",
    title: "Learning & Development Fund",
    description:
      "Every employee gets a personal budget for professional courses, certifications, and conferences.",
    icon: "school",
    order: 4,
    highlight: false,
  },
  {
    id: "b-retail",
    category: "Growth & Lifestyle",
    title: "Retail & Leisure Discounts",
    description:
      "Save on the things you love — from your weekly shop to gym memberships, cinema tickets and days out.",
    icon: "redeem",
    order: 5,
    highlight: true,
  },
  {
    id: "b-bigidea",
    category: "Growth & Lifestyle",
    title: "The BIG Idea Reward",
    description:
      "Our innovation reward program: got a better way to do things? Pitch it and earn rewards up to £500 if implemented.",
    icon: "emoji_objects",
    order: 6,
    highlight: false,
  },
];

export const IDEAS: Idea[] = [
  {
    id: "idea-1",
    authorId: "u-james",
    authorName: "James Miller",
    authorAvatar: avatar(15),
    title: "Automated Inventory Restocking via AI",
    description:
      "A proposal to use computer vision to track stock levels in supply cupboards and auto-order essentials before they run out.",
    category: "Operations",
    status: "implemented",
    votes: 3248,
    createdAt: "2026-05-02T09:00:00Z",
  },
  {
    id: "idea-2",
    authorId: "u-sarahj",
    authorName: "Sarah Jenkins",
    authorAvatar: avatar(48),
    title: "Paperless Onboarding Flow",
    description:
      "Digitising all HR contracts and safety modules so new starters can complete everything before day one.",
    category: "People",
    status: "popular",
    votes: 3199,
    createdAt: "2026-05-11T11:30:00Z",
  },
  {
    id: "idea-3",
    authorId: "u-ananya",
    authorName: "Ananya Sharma",
    authorAvatar: avatar(44),
    title: "Sustainable Packaging Initiative",
    description:
      "Replacing plastic fillers with biodegradable mushroom-based alternatives across all deliveries.",
    category: "Sustainability",
    status: "reviewing",
    votes: 1438,
    createdAt: "2026-06-01T14:15:00Z",
  },
];

export const PETS: Pet[] = [
  {
    id: "p-1",
    name: "Biscuit",
    species: "Office Labrador",
    owner: "with Elena",
    photoUrl: img("pet-biscuit", 600, 600),
    funFact: "Chief Morale Officer. Will trade a paw for a belly rub.",
  },
  {
    id: "p-2",
    name: "Mochi",
    species: "Therapy Cat",
    owner: "with the Wellbeing team",
    photoUrl: img("pet-mochi", 600, 600),
    funFact: "Naps through every meeting and somehow still gets promoted.",
  },
  {
    id: "p-3",
    name: "Pickle",
    species: "Reception Parrot",
    owner: "with Front of House",
    photoUrl: img("pet-pickle", 600, 600),
    funFact: "Greets everyone with 'Live the life you choose!'",
  },
  {
    id: "p-4",
    name: "Nugget",
    species: "Garden Tortoise",
    owner: "with Facilities",
    photoUrl: img("pet-nugget", 600, 600),
    funFact: "Slow and steady — our unofficial mascot for patience.",
  },
];

export const LOCATIONS: Location[] = [
  {
    id: "loc-1",
    name: "The Hub — Rochdale",
    region: "Greater Manchester",
    description:
      "Our flagship community centre and head office, home to day services and the leadership team.",
    imageUrl: img("loc-rochdale", 800, 500),
    services: ["Day Services", "Head Office", "Training Suite"],
  },
  {
    id: "loc-2",
    name: "Heywood Supported Living",
    region: "Greater Manchester",
    description:
      "Person-centred supported living homes helping people live independently, their way.",
    imageUrl: img("loc-heywood", 800, 500),
    services: ["Supported Living", "Outreach"],
  },
  {
    id: "loc-3",
    name: "Middleton Wellbeing Garden",
    region: "Greater Manchester",
    description:
      "A green space for horticulture therapy, community projects and our Very Important Pets.",
    imageUrl: img("loc-middleton", 800, 500),
    services: ["Horticulture", "Wellbeing", "Community"],
  },
  {
    id: "loc-4",
    name: "Bury Enterprise Café",
    region: "Greater Manchester",
    description:
      "A social enterprise café offering real-world employment and training opportunities.",
    imageUrl: img("loc-bury", 800, 500),
    services: ["Enterprise", "Employment", "Café"],
  },
];

/** The demo employee used when Supabase is not configured. */
export const DEMO_USER: Profile = {
  id: "demo-user",
  fullName: "Alex Guru",
  email: "demo@possabilities.org.uk",
  roleTag: "Support Worker",
  avatarUrl: avatar(68),
  isAdmin: false,
  journeyPoints: 850,
  status: "active",
  startedAt: "2026-06-10T09:00:00Z",
  lastActivityAt: "2026-06-17T08:30:00Z",
  invitedBy: "admin",
};

export const DEMO_ADMIN: Profile = {
  id: "demo-admin",
  fullName: "Jordan Admin",
  email: "digital@possabilities.org.uk",
  roleTag: "People & Culture",
  avatarUrl: avatar(5),
  isAdmin: true,
  journeyPoints: 0,
  status: "active",
  startedAt: "2026-01-05T09:00:00Z",
  lastActivityAt: "2026-06-17T10:00:00Z",
  invitedBy: null,
};

/** Sample starters shown in the admin dashboard. */
export const DEMO_STARTERS: Profile[] = [
  {
    id: "s-sarah",
    fullName: "Sarah Miller",
    email: "s.miller@possabilities.org",
    roleTag: "Support Worker",
    avatarUrl: avatar(20),
    isAdmin: false,
    journeyPoints: 540,
    status: "active",
    startedAt: "2026-06-15T09:00:00Z",
    lastActivityAt: "2026-06-17T06:30:00Z",
    invitedBy: "demo-admin",
  },
  {
    id: "s-james",
    fullName: "James Davidson",
    email: "j.davidson@possabilities.org",
    roleTag: "Manager",
    avatarUrl: avatar(13),
    isAdmin: false,
    journeyPoints: 120,
    status: "active",
    startedAt: "2026-06-12T09:00:00Z",
    lastActivityAt: "2026-06-16T09:00:00Z",
    invitedBy: "demo-admin",
  },
  {
    id: "s-elena",
    fullName: "Elena Wright",
    email: "e.wright@possabilities.org",
    roleTag: "Volunteer",
    avatarUrl: avatar(32),
    isAdmin: false,
    journeyPoints: 60,
    status: "invited",
    startedAt: null,
    lastActivityAt: null,
    invitedBy: "demo-admin",
  },
  {
    id: "s-omar",
    fullName: "Omar Haddad",
    email: "o.haddad@possabilities.org",
    roleTag: "Support Worker",
    avatarUrl: avatar(60),
    isAdmin: false,
    journeyPoints: 1500,
    status: "completed",
    startedAt: "2026-05-20T09:00:00Z",
    lastActivityAt: "2026-06-02T15:00:00Z",
    invitedBy: "demo-admin",
  },
];

export const ROLE_TAGS = [
  "Support Worker",
  "Manager",
  "Volunteer",
  "Administrator",
  "Care Coordinator",
  "People & Culture",
];
