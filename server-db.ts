import fs from "fs";
import path from "path";
import { TherapySession, ChatMessage, GroupMessage, MoodLogInput, Product, DonationStat, SeasonalResource } from "./src/types";

// DB Path setup page
const DB_PATH = path.resolve("./data-store.json");

interface DatabaseSchema {
  users: Record<string, any>; // email -> hashed password & profiles
  therapySessions: Record<string, TherapySession[]>; // userId -> sessions
  moodLogs: Record<string, any[]>; // userId -> logs
  groupMessages: GroupMessage[]; // peer support room messages
  products: Product[];
  donationStat: DonationStat;
  forumRules?: string[];
  seasonalResources?: SeasonalResource[];
}

export const DEFAULT_FORUM_RULES = [
  "Embrace Radical Respect: Treat every peer with dignity. Zero tolerance for tribalism, gaslighting, or verbal attacks.",
  "Preserve Anonymous Integrity: Do not attempt to de-anonymize or speculate on the real-world identity of any contributor.",
  "Safe Space Protocol: No promotion of self-harm, medical diagnosing, or heavy spiritual shaming.",
  "Clinical Harbor Guardrails: Remember peer counseling is for emotional venting and strength; please use the Hotlines section for active acute crises."
];

export const DEFAULT_SEASONAL_RESOURCES: SeasonalResource[] = [
  {
    id: "seasonal-1",
    title: "Harmattan Rainy-Season Depression Support",
    description: "Specialized cognitive coping methods and community check-ins tailored to somatic fatigue during harsh dust storms, low solar visibility, and respiratory anxiety.",
    phoneOrLink: "Call clinical harbor hotline at 0800-RELIANCE (Free)",
    category: "Seasonal Support Desk",
    createdAt: new Date().toISOString()
  },
  {
    id: "seasonal-2",
    title: "Post-Holiday Financial Resilience Circles",
    description: "Interactive peer meetings analyzing economic strain and mental exhaustion during high inflation and seasonal family burdens.",
    phoneOrLink: "https://talkitthrough.com/circles/seasonal-finance",
    category: "Socio-Economic Well-being",
    createdAt: new Date().toISOString()
  }
];

const DEFAULT_PRODUCTS: Product[] = [
  // Apparel
  {
    id: "prod-tshirt-enough",
    title: "I Am Enough (Sage Tee)",
    category: "apparel",
    description: "Premium heavyweight organic cotton t-shirt in calming mind-health Sage Green. Features a subtle reminder that your worth is non-negotiable.",
    priceNaira: 3500,
    tags: ["apparel", "sage", "mindful"],
    imageUrl: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400&q=80"
  },
  {
    id: "prod-hoodie-talkit",
    title: "Talk It Through Hoodie",
    category: "apparel",
    description: "Ultra-soft charcoal-lined therapeutic hoodie designed for ultimate comfort and daily resilience. 100% of profits sponsor therapist fees.",
    priceNaira: 7500,
    tags: ["apparel", "resilience"],
    imageUrl: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&q=80"
  },
  {
    id: "prod-cap-mind",
    title: "Resilience Dad Cap",
    category: "apparel",
    description: "Low-profile sage-and-white cap. Minimalist mental health awareness embroidery.",
    priceNaira: 2000,
    tags: ["apparel", "accessory"],
    imageUrl: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400&q=80"
  },
  // Arts
  {
    id: "art-waves",
    title: "Waves of Emotion (Premium Digital Print)",
    category: "art",
    description: "High-resolution abstract composition mapping the beauty and cycles of emotional fluctuations. Calms any room.",
    priceNaira: 5000,
    tags: ["digital-art", "decor"],
    imageUrl: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=400&q=80"
  },
  {
    id: "art-faith",
    title: "Faith & Resilience Poster",
    category: "art",
    description: "Abstract representation pairing modern spiritual philosophy with mental health endurance metrics. Scaled for high-density A3 printing.",
    priceNaira: 4000,
    tags: ["art-poster", "spiritual"],
    imageUrl: "https://images.unsplash.com/photo-1549887534-1541e9326642?w=400&q=80"
  },
  // Digital
  {
    id: "dig-journal",
    title: "7-Day Reflective Mental Health Journal",
    category: "digital",
    description: "Detailed interactive workbook featuring mood analysis charts, daily Nigerian-Pidgin affirmation prompts, and cognitive restructuring exercise sheets.",
    priceNaira: 2000,
    tags: ["workbook", "pdf", "mental-tool"],
    imageUrl: "https://images.unsplash.com/photo-1517842645767-c639042777db?w=400&q=80"
  },
  {
    id: "dig-audio-guides",
    title: "Faith-Integrated Meditation Guides",
    category: "digital",
    description: "Set of 10 studio-recorded guided auditory breathing looping sessions (5-15 mins) that respectfully interweave faith perspectives with evidence-based relaxation strategies.",
    priceNaira: 3500,
    tags: ["audio", "mp3", "religious-harmony"],
    imageUrl: "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?w=400&q=80"
  }
];

const DEFAULT_GROUP_MESSAGES: GroupMessage[] = [
  {
    id: "g-msg-1",
    userId: "system-1",
    userName: "Emeka (Moderator)",
    room: "General Support",
    content: "Welcome to our safe room, brothers. Here, we leave the strongman mask outside. We are here to talk it through, listen, and stand together.",
    createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    isReported: false
  },
  {
    id: "g-msg-2",
    userId: "system-2",
    userName: "Tunde",
    room: "General Support",
    content: "I appreciate this space. It's not easy holding things down for my family. Every day of stress feels draining, but hearing your voices makes me feel less alone.",
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    isReported: false
  },
  {
    id: "g-msg-3",
    userId: "system-3",
    userName: "Musa",
    room: "Faith & Healing",
    content: "Salam brothers. The verse from Quran (94:5) 'For indeed, with hardship [will be] ease' keeps me grounded. Pairing my five daily prayers with journaling has done wonders for my anxiety.",
    createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    isReported: false
  },
  {
    id: "g-msg-4",
    userId: "system-4",
    userName: "Pastor Chidi",
    room: "Faith & Healing",
    content: "Blessings everyone. Remember that seeking mental help is NOT a sign of weak faith. God created doctors, therapists, and supportive systems. Pray, but also talk it through!",
    createdAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
    isReported: false
  },
  {
    id: "g-msg-5",
    userId: "system-5",
    userName: "Segun",
    room: "Workplace & Stress",
    content: "Bros, Lagos traffic alone is enough to give someone panic attacks! 😅 But seriously, balancing target-driven bank work with family pressure is breaking my back. How do you guys log off mentally?",
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    isReported: false
  }
];

function getInitialDB(): DatabaseSchema {
  return {
    users: {},
    therapySessions: {},
    moodLogs: {},
    groupMessages: DEFAULT_GROUP_MESSAGES,
    products: DEFAULT_PRODUCTS,
    donationStat: {
      totalNaira: 1045000,
      totalDonors: 142,
      healthcareSponsorshipsPaid: 18,
      ngoPartnershipsFunded: 4
    },
    forumRules: DEFAULT_FORUM_RULES,
    seasonalResources: DEFAULT_SEASONAL_RESOURCES
  };
}

export function readDB(): DatabaseSchema {
  try {
    if (!fs.existsSync(DB_PATH)) {
      writeDB(getInitialDB());
    }
    const data = fs.readFileSync(DB_PATH, "utf-8");
    const parsed = JSON.parse(data) as DatabaseSchema;
    if (!parsed.forumRules) {
      parsed.forumRules = DEFAULT_FORUM_RULES;
    }
    if (!parsed.seasonalResources) {
      parsed.seasonalResources = DEFAULT_SEASONAL_RESOURCES;
    }
    return parsed;
  } catch (err) {
    console.error("Error reading database file; recovering with initial default model", err);
    return getInitialDB();
  }
}

export function writeDB(db: DatabaseSchema): void {
  try {
    // Ensure parent directories exist
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing DatabaseSchema to JSON storage", err);
  }
}
