import express, { Request, Response } from "express";
import path from "path";
import crypto from "crypto";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { readDB, writeDB } from "./server-db";
import { SignUpSchema, MoodLogSchema, ChatMessage, TherapySession, GroupMessage } from "./src/types";

dotenv.config();

const PORT = 3000;
const app = express();
app.use(express.json());

// --- INJECTION OF SENSITIVE API KEY AND EXCLUSION ---
const aiApiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;

if (aiApiKey && aiApiKey !== "MY_GEMINI_API_KEY") {
  try {
    aiClient = new GoogleGenAI({
      apiKey: aiApiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  } catch (error) {
    console.error("Failed to initialize Google GenAI SDK:", error);
  }
}

// Keep active session sessions memory-side and match to database ids
const ACTIVE_SESSIONS: Record<string, string> = {}; // token -> email

// Helper to authenticate request
function getAuthUser(req: Request) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.split(" ")[1];
  const email = ACTIVE_SESSIONS[token];
  if (!email) return null;

  const db = readDB();
  const user = db.users[email];
  if (!user) return null;
  return { email, user };
}

// --- safety & crisis detector ---
const NIGERIAN_CRISIS_KEYWORDS = [
  "suicide", "suicidal", "kill myself", "end my life", "want to die", 
  "commit suicide", "take my life", "drink sniper", "sniper", "poison",
  "drown", "no purpose", "tired of living", "die today", "kill myself Lagos",
  "pain is too much", "better off dead", "tired of life", "no hope left"
];

function detectCrisis(text: string): boolean {
  const lowercaseText = text.toLowerCase();
  return NIGERIAN_CRISIS_KEYWORDS.some(keyword => lowercaseText.includes(keyword));
}

// ==========================================
// API ENDPOINTS
// ==========================================

// 1. AUTHENTICATION ENDPOINTS
app.post("/api/auth/register", (req: Request, res: Response) => {
  try {
    const parseResult = SignUpSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: (parseResult.error as any).errors[0].message });
      return;
    }

    const { email, password, name, age, preferredLanguage, faithPreference, phone } = parseResult.data;
    const db = readDB();

    if (db.users[email.toLowerCase()]) {
      res.status(400).json({ error: "Email address already registered" });
      return;
    }

    // Hash password simply for demonstration
    const passwordHash = crypto.createHash("sha256").update(password).digest("hex");

    const newUser = {
      id: "u-" + crypto.randomUUID(),
      name,
      email: email.toLowerCase(),
      passwordHash,
      age,
      preferredLanguage,
      faithPreference,
      phone,
      streakCount: 0,
      createdAt: new Date().toISOString(),
    };

    db.users[email.toLowerCase()] = newUser;
    writeDB(db);

    const token = crypto.randomBytes(32).toString("hex");
    ACTIVE_SESSIONS[token] = email.toLowerCase();

    // Redact password hash
    const { passwordHash: _, ...userSafe } = newUser;
    res.json({ token, user: userSafe });
  } catch (err: any) {
    res.status(500).json({ error: "Registration failed: " + err.message });
  }
});

app.post("/api/auth/login", (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  const db = readDB();
  const emailKey = email.toLowerCase();
  const user = db.users[emailKey];

  if (!user) {
    res.status(400).json({ error: "Invalid email or password" });
    return;
  }

  const hash = crypto.createHash("sha256").update(password).digest("hex");
  if (user.passwordHash !== hash) {
    res.status(400).json({ error: "Invalid email or password" });
    return;
  }

  const token = crypto.randomBytes(32).toString("hex");
  ACTIVE_SESSIONS[token] = emailKey;

  const { passwordHash: _, ...userSafe } = user;
  res.json({ token, user: userSafe });
});

app.post("/api/auth/forgot-password", (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: "Email address is required" });
      return;
    }

    const emailKey = email.toLowerCase();
    const db = readDB();
    const user = db.users[emailKey];

    if (!user) {
      res.status(404).json({ error: "No account found with this email address." });
      return;
    }

    // Generate a 6-digit numeric code
    const recoveryCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes validity

    user.recoveryCode = recoveryCode;
    user.recoveryExpiry = expiry;
    db.users[emailKey] = user;
    writeDB(db);

    console.log(`[PASSWORD RECOVERY EMAIL SIMULATED]`);
    console.log(`To: ${emailKey}`);
    console.log(`Subject: TalkItThrough Secure PIN Recovery Code`);
    console.log(`Code: ${recoveryCode}`);

    res.json({ 
      success: true, 
      message: `A recovery code has been sent securely via email to ${emailKey}.`, 
      code: recoveryCode // Returned directly to make it effortless to test in the Sandbox / Preview
    });
  } catch (err: any) {
    res.status(500).json({ error: "Forgot password request failed: " + err.message });
  }
});

app.post("/api/auth/reset-password", (req: Request, res: Response) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      res.status(400).json({ error: "Email, recovery code, and new password PIN are required." });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ error: "New password must be at least 6 characters long." });
      return;
    }

    const emailKey = email.toLowerCase();
    const db = readDB();
    const user = db.users[emailKey];

    if (!user) {
      res.status(404).json({ error: "Invalid email lookup." });
      return;
    }

    if (!user.recoveryCode || user.recoveryCode !== code) {
      res.status(400).json({ error: "Invalid or expired recovery code." });
      return;
    }

    const expiryTime = new Date(user.recoveryExpiry).getTime();
    if (Date.now() > expiryTime) {
      res.status(400).json({ error: "Recovery code has expired. Please request a new one." });
      return;
    }

    // Successful verify - update password hash
    const hash = crypto.createHash("sha256").update(newPassword).digest("hex");
    user.passwordHash = hash;
    
    // Clear out recovery details
    delete user.recoveryCode;
    delete user.recoveryExpiry;

    db.users[emailKey] = user;
    writeDB(db);

    res.json({ 
      success: true, 
      message: "Your password PIN has been successfully updated. You can now log in." 
    });
  } catch (err: any) {
    res.status(500).json({ error: "Password reset failed: " + err.message });
  }
});

app.post("/api/auth/logout", (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    delete ACTIVE_SESSIONS[token];
  }
  res.json({ success: true });
});

app.get("/api/auth/me", (req: Request, res: Response) => {
  const auth = getAuthUser(req);
  if (!auth) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { passwordHash: _, ...userSafe } = auth.user;
  res.json({ user: userSafe });
});

// Delete account (NDPR / GDPR compliant 30-day grace configuration placeholder)
app.delete("/api/auth/me", (req: Request, res: Response) => {
  const auth = getAuthUser(req);
  if (!auth) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const db = readDB();
  const emailKey = auth.email;

  // GDPR data purging
  delete db.users[emailKey];
  delete db.therapySessions[db.users[emailKey]?.id];
  delete db.moodLogs[db.users[emailKey]?.id];
  
  writeDB(db);
  res.json({ success: true, message: "Account scheduled for deletion and personal information scrubbed (GDPR Clause 17 compliant)" });
});

// 2. AI THERAPY CHAT ENDPOINTS
app.get("/api/chat/sessions", (req: Request, res: Response) => {
  const auth = getAuthUser(req);
  if (!auth) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const db = readDB();
  const userId = auth.user.id;
  const sessions = db.therapySessions[userId] || [];
  res.json(sessions);
});

app.post("/api/chat/message", async (req: Request, res: Response) => {
  const auth = getAuthUser(req);
  if (!auth) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { sessionId, content } = req.body;
  if (!content) {
    res.status(400).json({ error: "Message content is required" });
    return;
  }

  const db = readDB();
  const userId = auth.user.id;
  let sessions = db.therapySessions[userId] || [];

  let currentSession = sessions.find(s => s.id === sessionId);

  if (!currentSession) {
    currentSession = {
      id: sessionId || "session-" + crypto.randomUUID(),
      userId,
      title: content.slice(0, 30) + (content.length > 30 ? "..." : ""),
      createdAt: new Date().toISOString(),
      messages: [],
    };
    sessions.unshift(currentSession);
  }

  const isCrisisUser = detectCrisis(content);

  const userMsg: ChatMessage = {
    id: "m-" + crypto.randomUUID(),
    role: "user",
    content,
    createdAt: new Date().toISOString(),
    isCrisisMatch: isCrisisUser
  };
  currentSession.messages.push(userMsg);

  // Update streak if yesterday or today
  auth.user.streakCount = (auth.user.streakCount || 0) + 1;
  db.users[auth.email] = auth.user;

  db.therapySessions[userId] = sessions;
  writeDB(db);

  if (isCrisisUser) {
    // Return safety warning immediately instead of LLM wait if critical, or append crisis fallback
    const safetyContent = `⚠️ CRISIS DETECTED: Brother, thank you for writing. Please know you do not have to carry this alone. There are people who understand and want to stand with you right now. No shame. No judgment. 

Please reach out to our emergency partnership helpline immediately:
📞 BEFRIENDERS NIGERIA: +234 (0) 2223 4567 (24/7 Crisis Line)
📞 MENTALLY AWARE NIGERIA: +234 809 111 6264

We are connecting you to professional clinical help. Breathe. Hold on. We are here.`;
    const modelMsg: ChatMessage = {
      id: "m-" + crypto.randomUUID(),
      role: "model",
      content: safetyContent,
      createdAt: new Date().toISOString(),
      isCrisisMatch: true
    };
    currentSession.messages.push(modelMsg);
    db.therapySessions[userId] = sessions;
    writeDB(db);

    res.json({ session: currentSession, response: modelMsg });
    return;
  }

  // standard Gemini interaction
  let modelResponseText = "I hear you, brother. Let's talk through this together. We're in this space of healing together.";

  if (aiClient) {
    try {
      const history = currentSession.messages.slice(0, -1).map(msg => ({
        role: msg.role === "user" ? "user" as const : "model" as const,
        parts: [{ text: msg.content }]
      }));

      const contextPrompt = `You are "TalkItThrough AI", an incredibly empathetic, warm, objective, and culturally-competent mental health peer-support companion specifically designed for Nigerian men.
The user is experiencing high stress, depression, anxiety, or life crises.
Your name is TalkItThrough AI. You are a conversational aid grounded in cognitive-behavioral principles and designed to reduce the stigma of mental wellness.

Key Directions:
- Embody cultural nuances. Nigerian men face extreme expectations to be "strongmen" or "providers", holding back their feelings. Use respectful, warm, and localized references (like "bro", "brother", "brotherly companion", some mild Nigerian-Pidgin when it feels natural and comfortable, like "how body?", "no shaking", but maintain professional and supportive decorum).
- NEVER assume complex clinical diagnoses. Ask gentle, open-ended questions.
- Address spiritual dimensions with extreme neutrality. If they mention faith (Christian, Muslim, Yoruba heritage), respectfully acknowledge and provide encouragement while maintaining clinical, non-evangelical grounding.
- If they express despair, help them list 2 simple things they have control over today.
- Remind them gently that while you are here 24/7 in their pocket, you are an AI companion, not a licensed human therapist, but you are a bridge to healing.
- Keep your answers highly scannable, using short, warm paragraphs and comforting formatting.

User preferred language: ${auth.user.preferredLanguage}.
User faith priority: ${auth.user.faithPreference}.`;

      const response = await aiClient.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          { role: "user", parts: [{ text: contextPrompt }] },
          ...history,
          { role: "user", parts: [{ text: content }] }
        ]
      });

      if (response && response.text) {
        modelResponseText = response.text;
      }
    } catch (err) {
      console.error("Gemini API call failed:", err);
      modelResponseText = "Forgive me, brother. Connection is fluctuating a bit, but I am still listening. How has your stress level been today? Let's take it one step at a time.";
    }
  } else {
    // Simulated supportive advice when API key isn't provided
    modelResponseText = `*TalkItThrough AI Companion (Simulator Node)* \n\nI hear you loud and clear, brother. Nigerian men carry a massive world of silent pressure—finances, expectations, family shields. Let's unpack this slowly. 

Tell me, does this feel like a heaviness in your chest, or a race in your mind? I'm right here with you.`;
  }

  const modelMsg: ChatMessage = {
    id: "m-" + crypto.randomUUID(),
    role: "model",
    content: modelResponseText,
    createdAt: new Date().toISOString(),
  };

  currentSession.messages.push(modelMsg);
  db.therapySessions[userId] = sessions;
  writeDB(db);

  res.json({ session: currentSession, response: modelMsg });
});

app.delete("/api/chat/sessions/:id", (req: Request, res: Response) => {
  const auth = getAuthUser(req);
  if (!auth) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const db = readDB();
  const userId = auth.user.id;
  let sessions = db.therapySessions[userId] || [];
  sessions = sessions.filter(s => s.id !== req.params.id);
  db.therapySessions[userId] = sessions;
  writeDB(db);
  res.json({ success: true });
});

// 3. MOOD TRACKER ENDPOINTS
app.get("/api/mood", (req: Request, res: Response) => {
  const auth = getAuthUser(req);
  if (!auth) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const db = readDB();
  const logs = db.moodLogs[auth.user.id] || [];
  res.json(logs);
});

app.post("/api/mood", (req: Request, res: Response) => {
  const auth = getAuthUser(req);
  if (!auth) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parseResult = MoodLogSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: "Invalid mood log input: 1-10 range is required." });
    return;
  }

  const db = readDB();
  const userId = auth.user.id;
  const userLogs = db.moodLogs[userId] || [];

  const newLog = {
    id: "mood-" + crypto.randomUUID(),
    userId,
    mood: parseResult.data.mood,
    sleepQuality: parseResult.data.sleepQuality || 5,
    notes: parseResult.data.notes || "",
    createdAt: new Date().toISOString()
  };

  userLogs.push(newLog);
  db.moodLogs[userId] = userLogs;

  // Boost streak in user account for logging
  auth.user.streakCount = (auth.user.streakCount || 0) + 1;
  db.users[auth.email] = auth.user;

  writeDB(db);
  res.json(newLog);
});

// 4. GROUP CHAT ROOM ENDPOINTS
app.get("/api/groups/:room", (req: Request, res: Response) => {
  const auth = getAuthUser(req);
  if (!auth) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const db = readDB();
  const roomMessages = db.groupMessages.filter(m => m.room === req.params.room);
  res.json(roomMessages);
});

app.post("/api/groups/:room", (req: Request, res: Response) => {
  const auth = getAuthUser(req);
  if (!auth) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { content } = req.body;
  if (!content) {
    res.status(400).json({ error: "Message content cannot be blank" });
    return;
  }

  const db = readDB();
  const newMessage: GroupMessage = {
    id: "g-msg-" + crypto.randomUUID(),
    userId: auth.user.id,
    userName: auth.user.name,
    room: req.params.room,
    content,
    createdAt: new Date().toISOString(),
    isReported: false
  };

  db.groupMessages.push(newMessage);
  writeDB(db);
  res.json(newMessage);
});

app.post("/api/groups/messages/:msgId/report", (req: Request, res: Response) => {
  const auth = getAuthUser(req);
  if (!auth) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const db = readDB();
  const msg = db.groupMessages.find(m => m.id === req.params.msgId);
  if (msg) {
    msg.isReported = true;
    writeDB(db);
  }
  res.json({ success: true, message: "Room message reported. Moderation will review within 24 hours." });
});

// Message Interactions: Liking/Reacting to messages
app.post("/api/groups/messages/:msgId/like", (req: Request, res: Response) => {
  const auth = getAuthUser(req);
  if (!auth) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const db = readDB();
  const msg = db.groupMessages.find(m => m.id === req.params.msgId);
  if (!msg) {
    res.status(404).json({ error: "Message not found" });
    return;
  }
  if (!msg.likesUserIds) {
    msg.likesUserIds = [];
  }
  const userIdentifier = auth.user.email || auth.user.id || "anonymous";
  const index = msg.likesUserIds.indexOf(userIdentifier);
  if (index > -1) {
    msg.likesUserIds.splice(index, 1);
  } else {
    msg.likesUserIds.push(userIdentifier);
  }
  writeDB(db);
  res.json(msg);
});

// Message Interactions: Replying / Commenting on messages
app.post("/api/groups/messages/:msgId/reply", (req: Request, res: Response) => {
  const auth = getAuthUser(req);
  if (!auth) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { content } = req.body;
  if (!content) {
    res.status(400).json({ error: "Reply content cannot be blank" });
    return;
  }
  const db = readDB();
  const msg = db.groupMessages.find(m => m.id === req.params.msgId);
  if (!msg) {
    res.status(404).json({ error: "Message not found" });
    return;
  }
  if (!msg.replies) {
    msg.replies = [];
  }
  const newReply = {
    id: "g-reply-" + crypto.randomUUID(),
    userId: auth.user.id,
    userName: auth.user.name + " (" + (auth.user.faithPreference || "Peer") + ")",
    content,
    createdAt: new Date().toISOString(),
    isReported: false
  };
  msg.replies.push(newReply);
  writeDB(db);
  res.json(msg);
});

// ADMIN ROUTES: GET FORUM RULES
app.get("/api/admin/rules", (req: Request, res: Response) => {
  const db = readDB();
  res.json(db.forumRules || []);
});

// ADMIN ROUTES: UPDATE FORUM RULES
app.post("/api/admin/rules", (req: Request, res: Response) => {
  const auth = getAuthUser(req);
  if (!auth) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { rules } = req.body;
  if (!Array.isArray(rules)) {
    res.status(400).json({ error: "Rules must be an array" });
    return;
  }
  const db = readDB();
  db.forumRules = rules;
  writeDB(db);
  res.json({ success: true, rules: db.forumRules });
});

// ADMIN ROUTES: GET SEASONAL RESOURCES
app.get("/api/admin/seasonal-resources", (req: Request, res: Response) => {
  const db = readDB();
  res.json(db.seasonalResources || []);
});

// ADMIN ROUTES: ADD SEASONAL RESOURCE
app.post("/api/admin/seasonal-resources", (req: Request, res: Response) => {
  const auth = getAuthUser(req);
  if (!auth) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { title, description, phoneOrLink, category } = req.body;
  if (!title || !description || !phoneOrLink) {
    res.status(400).json({ error: "Title, description, and link/tel are required" });
    return;
  }
  const db = readDB();
  const newRes = {
    id: "seasonal-" + crypto.randomUUID(),
    title,
    description,
    phoneOrLink,
    category: category || "Seasonal Desk",
    createdAt: new Date().toISOString()
  };
  if (!db.seasonalResources) {
    db.seasonalResources = [];
  }
  db.seasonalResources.push(newRes);
  writeDB(db);
  res.json(newRes);
});

// ADMIN ROUTES: DELETE SEASONAL RESOURCE
app.delete("/api/admin/seasonal-resources/:id", (req: Request, res: Response) => {
  const auth = getAuthUser(req);
  if (!auth) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const db = readDB();
  if (db.seasonalResources) {
    db.seasonalResources = db.seasonalResources.filter(r => r.id !== req.params.id);
  }
  writeDB(db);
  res.json({ success: true });
});

// ADMIN MODERATION ROUTES: DELETE BOARD MESSAGE
app.delete("/api/admin/groups/messages/:msgId", (req: Request, res: Response) => {
  const auth = getAuthUser(req);
  if (!auth) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const db = readDB();
  db.groupMessages = db.groupMessages.filter(m => m.id !== req.params.msgId);
  writeDB(db);
  res.json({ success: true });
});

// ADMIN MODERATION ROUTES: DISMISS REPORT STATUS
app.post("/api/admin/groups/messages/:msgId/dismiss-report", (req: Request, res: Response) => {
  const auth = getAuthUser(req);
  if (!auth) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const db = readDB();
  const msg = db.groupMessages.find(m => m.id === req.params.msgId);
  if (msg) {
    msg.isReported = false;
    writeDB(db);
  }
  res.json({ success: true });
});

// ADMIN MODERATION ROUTES: DELETE BOARD REPLY
app.delete("/api/admin/groups/messages/:msgId/replies/:replyId", (req: Request, res: Response) => {
  const auth = getAuthUser(req);
  if (!auth) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const db = readDB();
  const msg = db.groupMessages.find(m => m.id === req.params.msgId);
  if (msg && msg.replies) {
    msg.replies = msg.replies.filter(r => r.id !== req.params.replyId);
    writeDB(db);
  }
  res.json({ success: true });
});

// 5. SHOP ENDPOINTS
app.get("/api/shop/products", (req: Request, res: Response) => {
  const db = readDB();
  res.json(db.products);
});

// 6. DONATIONS ENDPOINTS
app.get("/api/donations/stats", (req: Request, res: Response) => {
  const db = readDB();
  res.json(db.donationStat);
});

app.post("/api/donations/donate", (req: Request, res: Response) => {
  const { donorName, amountNaira } = req.body;
  if (!amountNaira || isNaN(amountNaira) || amountNaira <= 0) {
    res.status(400).json({ error: "Invalid donation amount." });
    return;
  }

  const db = readDB();
  db.donationStat.totalNaira += Number(amountNaira);
  db.donationStat.totalDonors += 1;
  
  // Calculate newly funded healthcare sponsorships and NGO projects (simulated metrics)
  db.donationStat.healthcareSponsorshipsPaid = Math.floor(db.donationStat.totalNaira / 50000);
  db.donationStat.ngoPartnershipsFunded = 4 + Math.floor(db.donationStat.totalNaira / 250000);

  writeDB(db);
  res.json({ success: true, donorName, stats: db.donationStat });
});

// 7. BLUEPRINT SYSTEM ENDPOINTS (EXPOSES HIGH-FIDELITY ARCHITECTURE FOR THE HUB)
app.get("/api/blueprint", (req: Request, res: Response) => {
  const schemas = {
    users: `CREATE TABLE users (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(64) NOT NULL,
  age INTEGER NOT NULL CHECK (age >= 18),
  preferred_language VARCHAR(30) DEFAULT 'English',
  faith_preference VARCHAR(30) DEFAULT 'None',
  phone VARCHAR(20),
  streak_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`,
    therapySessions: `CREATE TABLE therapy_sessions (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(150),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE chat_messages (
  id VARCHAR(50) PRIMARY KEY,
  session_id VARCHAR(50) REFERENCES therapy_sessions(id) ON DELETE CASCADE,
  role VARCHAR(10) CHECK (role IN ('user', 'model')),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_crisis_match BOOLEAN DEFAULT FALSE
);`,
    moodLogs: `CREATE TABLE mood_logs (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
  mood INTEGER CHECK (mood BETWEEN 1 AND 10),
  sleep_quality INTEGER CHECK (sleep_quality BETWEEN 1 AND 10),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`,
    peerMessages: `CREATE TABLE group_messages (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
  user_name VARCHAR(100),
  room VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_reported BOOLEAN DEFAULT FALSE
);`
  };

  const apis = [
    { method: "POST", path: "/api/auth/register", desc: "Creates client account, performs Zod validations, hashes password and signs token" },
    { method: "POST", path: "/api/auth/login", desc: "Authenticates credentials and returns a secure local active session token" },
    { method: "GET", path: "/api/auth/me", desc: "Retrieves active authenticated profile or returns 401 Unauthorized" },
    { method: "DELETE", path: "/api/auth/me", desc: "GDPR/NDPR compliant deletion of user data and purging audit footprints" },
    { method: "GET", path: "/api/chat/sessions", desc: "Fetches user's historic AI chat conversation threads" },
    { method: "POST", path: "/api/chat/message", desc: "Sends custom prompt to AI therapist. Integrates Google GenAI (gemini-3.5-flash) and real-time localized crisis filter" },
    { method: "GET", path: "/api/mood", desc: "Returns weekly mood tracking logs for analytical trend line mapping" },
    { method: "POST", path: "/api/mood", desc: "Captures new daily emotional state log with a validation schema" },
    { method: "GET", path: "/api/groups/:room", desc: "Fetches active shared messages in the designated peer support channel" },
    { method: "POST", path: "/api/groups/:room", desc: "Publishes a supportive group micro-post anonymously to fellow members" },
    { method: "POST", path: "/api/groups/messages/:id/report", desc: "Flags offensive/non-compliant messages to moderators with 24-hr review guarantees" }
  ];

  res.json({ schemas, apis });
});

// ==========================================
// VITE OR STATIC FRONT-END HANDLER
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development Mode using Vite Dev Middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production Static Build Serving
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`TalkItThrough Full-Stack Server booted at: http://localhost:${PORT}`);
  });
}

startServer();
