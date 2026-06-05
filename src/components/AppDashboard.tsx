import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Home, MessageSquare, Compass, Sliders, LogOut, 
  Trash2, Download, Check, AlertCircle, Sparkles, Send, 
  Mic, Smile, Moon, Users, Flag, Calendar, Activity,
  ChevronRight, Volume2, ShieldAlert, Heart, Loader2,
  Menu, X
} from "lucide-react";
import { SignUpInput, MoodLogInput, ChatMessage, TherapySession, GroupMessage } from "../types";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface AppDashboardProps {
  token: string;
  user: any;
  onLogout: (redirectToRegister?: boolean) => void;
  onUserUpdate: (updatedUser: any) => void;
}

const LANGUAGES_LIST = [
  { code: "en", label: "English", tts: "en-US", asr: "en-US" },
  { code: "pcm", label: "Nigerian Pidgin", tts: "en-NG", asr: "en-NG" },
  { code: "fr", label: "Français (French)", tts: "fr-FR", asr: "fr-FR" },
  { code: "es", label: "Español (Spanish)", tts: "es-ES", asr: "es-ES" },
  { code: "de", label: "German (Deutsch)", tts: "de-DE", asr: "de-DE" },
  { code: "yo", label: "Yorùbá (Yoruba)", tts: "yo-NG", asr: "yo-NG" },
  { code: "ar", label: "العربية (Arabic)", tts: "ar-AE", asr: "ar-AE" },
  { code: "hi", label: "हिन्दी (Hindi)", tts: "hi-IN", asr: "hi-IN" },
  { code: "zh", label: "中文 (Chinese)", tts: "zh-CN", asr: "zh-CN" },
  { code: "ja", label: "日本語 (Japanese)", tts: "ja-JP", asr: "ja-JP" },
];

const PREFERRED_VOICES = {
  'en-US': [
    'Microsoft Aria Online (Natural) - English (United States)',
    'Microsoft Guy Online (Natural) - English (United States)',
    'Microsoft Jenny Online (Natural) - English (United States)',
    'Google US English Female',
    'Google US English Male',
    'Siri',
  ],
  'en-GB': [
    'Microsoft Sonia Online (Natural) - English (United Kingdom)',
    'Microsoft Ryan Online (Natural) - English (United Kingdom)',
    'Microsoft Libby Online (Natural) - English (United Kingdom)',
    'Google UK English Female',
    'Google UK English Male',
    'Siri',
  ],
  'en-NG': [
    'Microsoft Abeo Online (Natural) - English (Nigeria)',
    'Microsoft Ezinne Online (Natural) - English (Nigeria)',
    'Google English (Nigeria) Male',
    'Google English (Nigeria) Female',
    'Google UK English Female',
    'Siri',
  ],
  'fr-FR': [
    'Microsoft Denise Online (Natural) - French (France)',
    'Microsoft Henri Online (Natural) - French (France)',
    'Google français',
    'Siri',
  ],
  'es-ES': [
    'Microsoft Elvira Online (Natural) - Spanish (Spain)',
    'Microsoft Alvaro Online (Natural) - Spanish (Spain)',
    'Google español',
    'Siri',
  ],
  'de-DE': [
    'Microsoft Katja Online (Natural) - German (Germany)',
    'Microsoft Conrad Online (Natural) - German (Germany)',
    'Google Deutsch',
    'Siri',
  ],
  'yo-NG': [],
  'ar-AE': [
    'Microsoft Fatima Online (Natural) - Arabic (United Arab Emirates)',
    'Google العربية',
  ],
  'hi-IN': [
    'Microsoft Swara Online (Natural) - Hindi (India)',
    'Google हिन्दी',
  ],
  'zh-CN': [
    'Microsoft Xiaoxiao Online (Natural) - Chinese (Mainland)',
    'Google 中文',
  ],
  'ja-JP': [
    'Microsoft Nanami Online (Natural) - Japanese (Japan)',
    'Google 日本語',
  ]
};

export default function AppDashboard({ token, user, onLogout, onUserUpdate }: AppDashboardProps) {
  const [activeTab, setActiveTab] = useState<"home" | "chat" | "mood" | "groups" | "faith" | "settings">("home");
  const [timeOfDay, setTimeOfDay] = useState("");

  // AI Therapy states
  const [chatSessions, setChatSessions] = useState<TherapySession[]>([]);
  const [activeSession, setActiveSession] = useState<TherapySession | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  
  // Mood states
  const [preChatMood, setPreChatMood] = useState<number>(5);
  const [postChatMood, setPostChatMood] = useState<number>(5);
  const [showMoodCheckIn, setShowMoodCheckIn] = useState<"pre" | "post" | null>(null);
  const [chatLanguage, setChatLanguage] = useState<string>("en");
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [asrFallbackTip, setAsrFallbackTip] = useState<string | null>(null);
  const [utteranceRef, setUtteranceRef] = useState<any>(null);

  const [moodLogs, setMoodLogs] = useState<any[]>([]);
  const [moodForm, setMoodForm] = useState<MoodLogInput>({ mood: 6, sleepQuality: 6, notes: "" });
  const [moodSubmitted, setMoodSubmitted] = useState(false);

  // Group Peer Boards states
  const [activeGroupRoom, setActiveGroupRoom] = useState("General Support");
  const [groupMessages, setGroupMessages] = useState<GroupMessage[]>([]);
  const [groupInput, setGroupInput] = useState("");
  const [reportedIds, setReportedIds] = useState<string[]>([]);

  // Interactive peer support & moderation states
  const [rules, setRules] = useState<string[]>([]);
  const [seasonalResources, setSeasonalResources] = useState<any[]>([]);
  const [openReplies, setOpenReplies] = useState<Record<string, boolean>>({});
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});

  // Administrative dashboard control states
  const [adminRulesText, setAdminRulesText] = useState("");
  const [adminNewSeasonal, setAdminNewSeasonal] = useState({
    title: "",
    description: "",
    phoneOrLink: "",
    category: "Seasonal Support Desk"
  });
  const [reportedMessagesOnly, setReportedMessagesOnly] = useState(false);
  const [adminAllMessages, setAdminAllMessages] = useState<GroupMessage[]>([]);

  // Local state alerts
  const [alertText, setAlertText] = useState<string | null>(null);
  const [restrictAlertOpen, setRestrictAlertOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [chatSubView, setChatSubView] = useState<"chat" | "history">("chat");
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Subtle Password Verification for Admin Toggle
  const [adminPasscodeModalOpen, setAdminPasscodeModalOpen] = useState(false);
  const [adminPasscodeInput, setAdminPasscodeInput] = useState("");
  const [adminPasscodeError, setAdminPasscodeError] = useState("");
  const [adminPasscodeLoading, setAdminPasscodeLoading] = useState(false);

  // Settings states
  const [settingsForm, setSettingsForm] = useState({
    preferredLanguage: user.preferredLanguage || "English",
    faithPreference: user.faithPreference || "None",
    gender: user.gender || "Rather not say",
    phone: user.phone || ""
  });
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // ROTATIONAL PIECES: AFFIRMATION
  const dynamicFamiliarTerm = user.gender === "Female" ? "sister" : user.gender === "Male" ? "brother" : "friend";
  const dynamicBrosTerm = user.gender === "Female" ? "Sista" : user.gender === "Male" ? "Bros" : "Friend";
  const PIDGIN_AFFIRMATIONS = [
    `No condition is permanent, ${dynamicFamiliarTerm}. Better days dey ahead. Hold on tight.`,
    "You dey try well-well. To fail today no mean say you cannot master tomorrow.",
    `${dynamicBrosTerm}, clean your chest of heavy weight. No shame in saying things dey hot.`,
    "You are a strong shield, but every shield needs a safe harbor to rest.",
    "I stand correct, my worth dey high. Pressure no fit break my spirit."
  ];
  const [affirmation, setAffirmation] = useState(PIDGIN_AFFIRMATIONS[0]);

  // Interactive Paced Breathing states
  const [isBreathing, setIsBreathing] = useState(false);
  const [breathPhase, setBreathPhase] = useState<"Inhale" | "Hold (In)" | "Exhale" | "Hold (Out)">("Inhale");
  const [breathSeconds, setBreathSeconds] = useState(4);

  // ================= SPEECH SYNTHESIS & RECOGNITION HELPERS =================
  const getSmsVoice = (locale: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return null;
    const voices = window.speechSynthesis.getVoices() || [];
    if (!voices.length) return null;

    const prefs = PREFERRED_VOICES[locale as keyof typeof PREFERRED_VOICES] || [];
    for (const pref of prefs) {
      const v = voices.find(v => (v.name || '').toLowerCase().includes(pref.toLowerCase()));
      if (v) return v;
    }

    let v = voices.find(v => v.lang && v.lang.toLowerCase() === locale.toLowerCase());
    if (v) return v;

    const base = locale.split('-')[0].toLowerCase();
    v = voices.find(v => v.lang && v.lang.toLowerCase().startsWith(base));
    if (v) return v;

    return voices.find(v => v.lang && v.lang.toLowerCase().startsWith('en')) || null;
  };

  const speakText = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      // Clean standard markdown symbols before rendering audio outputs for natural narrative flow
      const cleanText = text.replace(/[*#`_\[\]]/g, ""); 
      const activeLangObj = LANGUAGES_LIST.find(l => l.code === chatLanguage) || LANGUAGES_LIST[0];
      const utter = new SpeechSynthesisUtterance(cleanText);
      utter.lang = activeLangObj.tts;
      const voice = getSmsVoice(activeLangObj.tts);
      if (voice) utter.voice = voice;
      
      // Config rate and pacing dynamically based on language choice
      if (activeLangObj.code === "en") {
        utter.rate = 1.15; // Slightly faster natural pacing to eliminate robotic pauses and monotone feeling
      } else {
        utter.rate = 0.95; // Relaxed therapeutic pacing for other dialects/languages
      }
      utter.pitch = 1.0;
      
      utter.onstart = () => setIsSpeaking(true);
      utter.onend = () => setIsSpeaking(false);
      utter.onerror = () => setIsSpeaking(false);
      
      window.speechSynthesis.speak(utter);
      setUtteranceRef(utter);
    } catch (e) {
      console.error(e);
      setIsSpeaking(false);
    }
  };

  const stopSpeakingText = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  const startSpeechRecognition = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      alert("Acoustic voice recording is unrecognized or unsupported in this native browser wrapper. Please use Google Chrome or Microsoft Edge.");
      return;
    }

    try {
      stopSpeakingText(); // Cancel current AI speak narrative when user starts speaking
      const activeLangObj = LANGUAGES_LIST.find(l => l.code === chatLanguage) || LANGUAGES_LIST[0];
      const recognition = new SR();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      try {
        recognition.lang = activeLangObj.asr;
      } catch (err) {
        recognition.lang = 'en-GB';
        setAsrFallbackTip("Preferred voice recognition language profile not found locally. Standard English recognition utilized.");
      }

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        if (text) {
          setMessageInput(prev => prev ? prev + " " + text : text);
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech Recognition error", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
      (window as any)._recognitionRef = recognition;
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  };

  const stopSpeechRecognition = () => {
    if ((window as any)._recognitionRef) {
      try {
        ((window as any)._recognitionRef).stop();
      } catch (err) {}
    }
    setIsListening(false);
  };

  useEffect(() => {
    let timer: any = null;
    if (isBreathing) {
      timer = setInterval(() => {
        setBreathSeconds(prev => {
          if (prev <= 1) {
            setBreathPhase(curr => {
              if (curr === "Inhale") return "Hold (In)";
              if (curr === "Hold (In)") return "Exhale";
              if (curr === "Exhale") return "Hold (Out)";
              return "Inhale";
            });
            return 4;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setBreathSeconds(4);
      setBreathPhase("Inhale");
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isBreathing]);

  useEffect(() => {
    // Clock greeting setup
    const hrs = new Date().getHours();
    if (hrs < 12) setTimeOfDay("Good Morning");
    else if (hrs < 17) setTimeOfDay("Good Afternoon");
    else setTimeOfDay("Good Evening");

    // Randomize daily affirmation
    const rand = PIDGIN_AFFIRMATIONS[Math.floor(Math.random() * PIDGIN_AFFIRMATIONS.length)];
    setAffirmation(rand);

    // Initial API loads
    loadTherapySessions();
    loadMoodLogs();
    loadGroupRoomHistory();
    loadForumRules();
    loadSeasonalResources();
    if (activeTab === "admin") {
      loadAllMessagesForAdmin();
    }
  }, [activeTab, activeGroupRoom]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeSession?.messages, chatLoading]);

  // --- API HANDLERS ---

  const loadTherapySessions = () => {
    fetch("/api/chat/sessions", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setChatSessions(data);
          if (data.length > 0 && !activeSession) {
            setActiveSession(data[0]);
          }
        }
      })
      .catch(err => console.error(err));
  };

  const loadMoodLogs = () => {
    fetch("/api/mood", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setMoodLogs(data);
        }
      })
      .catch(err => console.error(err));
  };

  const loadGroupRoomHistory = () => {
    fetch(`/api/groups/${encodeURIComponent(activeGroupRoom)}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setGroupMessages(data);
        }
      })
      .catch(err => console.error(err));
  };

  const loadForumRules = () => {
    fetch("/api/admin/rules")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setRules(data);
          setAdminRulesText(data.join("\n"));
        }
      })
      .catch(err => console.error(err));
  };

  const loadSeasonalResources = () => {
    fetch("/api/admin/seasonal-resources")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setSeasonalResources(data);
        }
      })
      .catch(err => console.error(err));
  };

  const loadAllMessagesForAdmin = () => {
    const rooms = ["General Support", "Faith & Healing", "Workplace & Stress", "Sleep & Anxiety", "Health & Wellness"];
    Promise.all(rooms.map(room => 
      fetch(`/api/groups/${encodeURIComponent(room)}`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => res.json())
    )).then(results => {
      const merged = results.flat().filter(m => m && m.id);
      merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setAdminAllMessages(merged);
    }).catch(err => console.error(err));
  };

  const handleLikeMessage = (msgId: string) => {
    fetch(`/api/groups/messages/${msgId}/like`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(() => {
        loadGroupRoomHistory();
        if (activeTab === "admin") {
          loadAllMessagesForAdmin();
        }
      })
      .catch(err => console.error(err));
  };

  const handlePostReply = (msgId: string) => {
    const text = replyInputs[msgId];
    if (!text || !text.trim()) return;

    fetch(`/api/groups/messages/${msgId}/reply`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ content: text.trim() })
    })
      .then(res => res.json())
      .then(() => {
        setReplyInputs(prev => ({ ...prev, [msgId]: "" }));
        loadGroupRoomHistory();
        if (activeTab === "admin") {
          loadAllMessagesForAdmin();
        }
      })
      .catch(err => console.error(err));
  };

  const toggleReplies = (msgId: string) => {
    setOpenReplies(prev => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  // ADMIN OPERATIONS
  const handleAdminSaveRules = () => {
    const rulesArr = adminRulesText.split("\n").map(r => r.trim()).filter(Boolean);
    fetch("/api/admin/rules", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ rules: rulesArr })
    })
      .then(res => res.json())
      .then(() => {
        setRules(rulesArr);
        setAlertText("Community Code of Conduct rules successfully updated across the hub.");
        setTimeout(() => setAlertText(null), 5000);
      })
      .catch(err => console.error(err));
  };

  const handleAdminCreateSeasonal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminNewSeasonal.title || !adminNewSeasonal.description || !adminNewSeasonal.phoneOrLink) return;

    fetch("/api/admin/seasonal-resources", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(adminNewSeasonal)
    })
      .then(res => res.json())
      .then(() => {
        setAdminNewSeasonal({
          title: "",
          description: "",
          phoneOrLink: "",
          category: "Seasonal Support Desk"
        });
        loadSeasonalResources();
        setAlertText("New seasonal counseling resource published successfully!");
        setTimeout(() => setAlertText(null), 5000);
      })
      .catch(err => console.error(err));
  };

  const handleAdminDeleteSeasonal = (id: string) => {
    fetch(`/api/admin/seasonal-resources/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(() => {
        loadSeasonalResources();
        setAlertText("Seasonal resource purged from directory listings.");
        setTimeout(() => setAlertText(null), 5000);
      })
      .catch(err => console.error(err));
  };

  const handleAdminDismissReport = (msgId: string) => {
    fetch(`/api/admin/groups/messages/${msgId}/dismiss-report`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(() => {
        loadGroupRoomHistory();
        loadAllMessagesForAdmin();
        setAlertText("Report status cleared. Post flagged as safe.");
        setTimeout(() => setAlertText(null), 5000);
      })
      .catch(err => console.error(err));
  };

  const handleAdminDeletePost = (msgId: string) => {
    if (!window.confirm("Are you sure you want to permanently purge this post?")) return;
    fetch(`/api/admin/groups/messages/${msgId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(() => {
        loadGroupRoomHistory();
        loadAllMessagesForAdmin();
        setAlertText("Message permanently removed from TalkItThrough board databases.");
        setTimeout(() => setAlertText(null), 5000);
      })
      .catch(err => console.error(err));
  };

  const handleDeleteReply = (msgId: string, replyId: string) => {
    if (!window.confirm("Are you sure you want to delete this reply?")) return;
    fetch(`/api/admin/groups/messages/${msgId}/replies/${replyId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(() => {
        loadGroupRoomHistory();
        loadAllMessagesForAdmin();
        setAlertText("Reply removed successfully.");
        setTimeout(() => setAlertText(null), 5000);
      })
      .catch(err => console.error(err));
  };

  const handleCreateNewChatThread = () => {
    // Show Pre-Chat Check-in prompt
    setShowMoodCheckIn("pre");
  };

  const executeThreadCreation = () => {
    // Submit mood to logs
    fetch("/api/mood", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ mood: preChatMood, sleepQuality: 5, notes: "[System Pre-Chat Rating]" })
    })
      .then(() => loadMoodLogs());

    // Create unique sessionId
    const newSessionId = "session-" + Math.floor(Math.random() * 1000000);
    const mockSession = {
      id: newSessionId,
      userId: user.id,
      title: `CBT Counselling Thread #${chatSessions.length + 1}`,
      createdAt: new Date().toISOString(),
      messages: []
    };

    setChatSessions(prev => [mockSession, ...prev]);
    setActiveSession(mockSession);
    setShowMoodCheckIn(null);
    setActiveTab("chat");
    setChatSubView("chat");
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeSession) return;

    // Interrupt any active speaking when sending a new message
    stopSpeakingText();

    const userText = messageInput;
    setMessageInput("");
    setChatLoading(true);

    // Append to local right away for optimal responsiveness
    const tempUserMsg: ChatMessage = {
      id: "temp-user",
      role: "user",
      content: userText,
      createdAt: new Date().toISOString()
    };

    setActiveSession(prev => prev ? { ...prev, messages: [...prev.messages, tempUserMsg] } : null);

    const activeLangObj = LANGUAGES_LIST.find(l => l.code === chatLanguage) || LANGUAGES_LIST[0];

    fetch("/api/chat/message", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ 
        sessionId: activeSession.id, 
        content: userText,
        language: activeLangObj.label
      })
    })
      .then(res => res.json())
      .then(data => {
        setChatLoading(false);
        if (data.session) {
          // Sync with server session
          setActiveSession(data.session);
          setChatSessions(prev => prev.map(s => s.id === data.session.id ? data.session : s));
          
          // If crisis was triggered, post warning
          if (data.response?.isCrisisMatch) {
            const title = user.gender === "Female" ? "Sister" : user.gender === "Male" ? "Brother" : "Friend";
            setAlertText(`CRISIS COMPASS: ${title}, we detected high-alert keywords. Please check local emergency networks immediately.`);
          }

          // Automatically speak AI response in the correct language representation
          if (data.response?.content) {
            speakText(data.response.content);
          }
        }
      })
      .catch(err => {
        console.error(err);
        setChatLoading(false);
      });
  };

  const handleFinishChatThread = () => {
    setShowMoodCheckIn("post");
  };

  const executePostChatLog = () => {
    fetch("/api/mood", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ mood: postChatMood, sleepQuality: 5, notes: "[System Post-Chat Rating]" })
    })
      .then(() => {
        loadMoodLogs();
        setShowMoodCheckIn(null);
        setActiveTab("home");
        const term = user.gender === "Female" ? "sister" : user.gender === "Male" ? "brother" : "friend";
        alert(`Session saved, ${term}. Your post-chat wellness metrics have been archived correctly!`);
      });
  };

  const handleLogManualMood = (e: React.FormEvent) => {
    e.preventDefault();
    fetch("/api/mood", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(moodForm)
    })
      .then(res => res.json())
      .then(data => {
        if (data.id) {
          loadMoodLogs();
          setMoodSubmitted(true);
          setMoodForm({ mood: 6, sleepQuality: 6, notes: "" });
          setTimeout(() => setMoodSubmitted(false), 4000);
        }
      })
      .catch(err => console.error(err));
  };

  const handlePostGroupMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupInput.trim()) return;

    fetch(`/api/groups/${encodeURIComponent(activeGroupRoom)}`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ content: groupInput })
    })
      .then(res => res.json())
      .then(() => {
        setGroupInput("");
        loadGroupRoomHistory();
      })
      .catch(err => console.error(err));
  };

  const handleReportMessage = (msgId: string) => {
    fetch(`/api/groups/messages/${msgId}/report`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setReportedIds(prev => [...prev, msgId]);
        alert(data.message);
      });
  };

  const handleExportDataGDPR = () => {
    const backupData = {
      profile: user,
      moodLogs,
      chatSessions
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `talkitthrough-gdpr-profile-${user.id}.json`;
    a.click();
  };

  const handleAccountErasure = () => {
    const confirmation = window.confirm("⚠️ GDPR RIGHT TO ERASURE: Are you absolutely certain you wish to purge your entire account footprint? This action is critical, immediate, and completely deletes all profiles, mood history, and therapy session notes under NDPR policies. This cannot be undone.");
    if (!confirmation) return;

    fetch("/api/auth/me", {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        alert(data.message);
        onLogout();
      });
  };

  const handleSeedDemoLogs = () => {
    const demoLogs = [
      { mood: 6, sleepQuality: 5, notes: "Feeling stable and ready for the week" },
      { mood: 7, sleepQuality: 6, notes: "A bit tired but spirit is high" },
      { mood: 8, sleepQuality: 8, notes: "Amazing support from the therapy chat" },
      { mood: 7, sleepQuality: 7, notes: "Work pressure but containing it with deep box breathing" },
      { mood: 9, sleepQuality: 8, notes: "Feeling empowered after sharing anonymously in the peer room" },
      { mood: 8, sleepQuality: 7, notes: "Very peaceful sleep and clear mindset" },
      { mood: 9, sleepQuality: 9, notes: "Highly optimistic. Resiliency is my nature!" }
    ];

    Promise.all(demoLogs.map(log => {
      return fetch("/api/mood", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(log)
      });
    })).then(() => {
      loadMoodLogs();
    }).catch(err => console.error(err));
  };

  // Convert logs to Recharts friendly structure with unique date increments per log if they are posted in rapid succession
  const chartData = moodLogs.slice(-7).map((log, index, arr) => {
    const daysAgo = arr.length - 1 - index;
    const dateObj = new Date(log.createdAt);
    // If multiple entries exist on the same calendar day, shift them back sequentially so the chart spreads out beautifully across consecutive days
    const allOnSameDay = arr.every(l => new Date(l.createdAt).toDateString() === new Date(arr[0].createdAt).toDateString());
    if (arr.length > 1 && allOnSameDay) {
      dateObj.setDate(dateObj.getDate() - daysAgo);
    }
    return {
      date: dateObj.toLocaleDateString("en-NG", { weekday: "short" }),
      dateLabel: dateObj.toLocaleDateString("en-NG", { weekday: "short", day: "numeric" }),
      Mood: log.mood,
      Sleep: log.sleepQuality || 5,
      notes: log.notes || ""
    };
  });

  return (
    <div className="h-screen w-screen bg-slate-50 flex flex-col md:flex-row text-xs md:text-sm overflow-hidden">
      
      {/* SECURE ADMIN ENTRY MODAL */}
      <AnimatePresence>
        {adminPasscodeModalOpen && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-[2px] flex items-center justify-center z-50 p-4 text-xs">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="bg-white border border-[#C5A059] rounded-xl shadow-2xl p-6 w-full max-w-sm relative overflow-hidden"
            >
              {/* Spinner/Loading Overlay for verification */}
              {adminPasscodeLoading && (
                <div className="absolute inset-0 bg-white/95 backdrop-blur-[1px] flex flex-col items-center justify-center z-10 select-none">
                  <div className="text-center space-y-3 p-4">
                    <Loader2 className="w-8 h-8 text-[#8A1B29] animate-spin mx-auto" />
                    <p className="text-[10px] uppercase font-mono tracking-widest text-[#8A1B29] font-extrabold pb-0">
                      Authenticating...
                    </p>
                    <p className="text-slate-500 text-[10px] font-sans">
                      Checking clearance credentials...
                    </p>
                  </div>
                </div>
              )}

              {/* Close Button */}
              <button 
                type="button"
                onClick={() => setAdminPasscodeModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition text-sm font-bold cursor-pointer"
              >
                ✕
              </button>

              <div className="text-center space-y-2 select-none">
                <div className="mx-auto w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <h3 className="font-display font-serif font-bold text-slate-950 text-base mt-2">
                  Verify Administrative Access
                </h3>
                <p className="text-slate-500 text-[10.5px]">
                  Please enter your passcode to modify system resources.
                </p>
              </div>

              {adminPasscodeError && (
                <div className="mt-4 bg-red-50 text-red-800 p-2 text-[10.5px] border border-red-200 text-center font-bold">
                  ⚠️ {adminPasscodeError}
                </div>
              )}

              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  setAdminPasscodeLoading(true);
                  setAdminPasscodeError("");
                  
                  // Simulate 1.2 second authentication check with backend
                  setTimeout(() => {
                    if (adminPasscodeInput === "Yetundes4321#") {
                      // Correct!
                      const updatedUser = { ...user, role: "admin" };
                      onUserUpdate(updatedUser);
                      setAdminPasscodeModalOpen(false);
                      setAdminPasscodeLoading(false);
                      setAlertText("Admin powers simulation enabled. You can now configure rules, add seasonal resources, and purge posts!");
                      setActiveTab("admin");
                    } else {
                      setAdminPasscodeLoading(false);
                      setAdminPasscodeError("Invalid Administrative Password. Access denied.");
                    }
                  }, 1200);
                }}
                className="mt-4 space-y-3"
              >
                <div className="space-y-1 focus-within:text-[#C5A059]">
                  <label className="text-slate-800 text-[9px] uppercase font-mono tracking-wider font-semibold">Passcode</label>
                  <input
                    required
                    type="password"
                    placeholder="Enter security passcode..."
                    value={adminPasscodeInput}
                    onChange={(e) => setAdminPasscodeInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-none px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#C5A059] placeholder-slate-400 font-semibold text-slate-1500 text-slate-950"
                    autoFocus
                  />
                </div>

                <div className="flex gap-2 pt-1.5">
                  <button 
                    type="button" 
                    onClick={() => setAdminPasscodeModalOpen(false)}
                    className="w-1/3 bg-slate-50 hover:bg-slate-100 text-slate-700 font-mono text-[10px] tracking-wider uppercase py-2 rounded-none border border-slate-300 transition text-center cursor-pointer font-bold"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-mono text-[10px] tracking-widest uppercase py-2 rounded-none shadow transition duration-150 flex items-center justify-center gap-1 cursor-pointer font-bold"
                  >
                    Verify Passcode
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PRE-CHAT INTAKE OR POST-CHAT RESOLUTION MODALS */}
      <AnimatePresence>
        {showMoodCheckIn === "pre" && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-[3px] flex items-center justify-center z-50 p-4 text-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border-2 border-slate-900 rounded-2xl shadow-2xl p-6 w-full max-w-md relative overflow-hidden"
            >
              <div className="absolute top-0 inset-x-0 h-2 bg-brand-coral" />
              
              <div className="text-center space-y-1.5 mb-6">
                <div className="mx-auto w-12 h-12 rounded-full bg-brand-coral/10 flex items-center justify-center text-brand-coral">
                  <Sparkles className="w-6 h-6 animate-pulse" />
                </div>
                <h3 className="font-display font-black text-slate-800 text-base mt-2">
                  CBT Intake & Mood Check-In
                </h3>
                <p className="text-slate-500 text-[10.5px]">
                  Help us adapt our empathetic companionship to your heart state.
                </p>
              </div>

              <div className="space-y-5">
                {/* Range picker */}
                <div className="space-y-2">
                  <label className="text-slate-700 text-xs font-bold block">
                    How is your emotional or mental strain right now? (1-10)
                  </label>
                  <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setPreChatMood(num)}
                        className={`h-9 rounded-lg border-2 font-bold text-xs flex items-center justify-center transition-all cursor-pointer ${
                          preChatMood === num
                            ? "bg-slate-900 border-slate-900 text-[#FFF200]"
                            : "bg-white border-slate-200 text-slate-600 hover:border-slate-400 font-semibold"
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold px-1 select-none">
                    <span>1 - Heavy Strain</span>
                    <span>10 - Restful Peace</span>
                  </div>
                </div>

                {/* Language Selection */}
                <div className="space-y-2">
                  <label className="text-slate-700 text-xs font-bold block">
                    Choose Therapy Session Language
                  </label>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                    {LANGUAGES_LIST.map((lang) => (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => setChatLanguage(lang.code)}
                        className={`px-3 py-2.5 rounded-xl border-2 font-bold text-xs flex items-center justify-between transition-all cursor-pointer ${
                          chatLanguage === lang.code
                            ? "bg-brand-coral text-white border-slate-900 shadow-[2px_2px_0px_0px_rgba(21,30,40,1)]"
                            : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 font-semibold"
                        }`}
                      >
                        <span>{lang.label}</span>
                        {chatLanguage === lang.code && <Check className="w-4 h-4" />}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400">
                    AI responses, listening voice recognition, and spoken narrative audio feedback will conform to this selection.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowMoodCheckIn(null)}
                  className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-3 rounded-xl border-2 border-slate-300 transition-all cursor-pointer"
                >
                  Cancel Intake
                </button>
                <button
                  type="button"
                  onClick={executeThreadCreation}
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-3 rounded-xl shadow-md border-2 border-slate-900 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4 animate-bounce" />
                  Start Therapy Session
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showMoodCheckIn === "post" && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-[3px] flex items-center justify-center z-50 p-4 text-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border-2 border-slate-900 rounded-2xl shadow-2xl p-6 w-full max-w-sm relative overflow-hidden"
            >
              <div className="absolute top-0 inset-x-0 h-2 bg-emerald-500" />

              <div className="text-center space-y-1.5 mb-6">
                <div className="mx-auto w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <Check className="w-6 h-6 animate-pulse" />
                </div>
                <h3 className="font-display font-black text-slate-800 text-base mt-2">
                  Post-Session Check-in
                </h3>
                <p className="text-slate-500 text-[10.5px]">
                  Excellent check-in, {dynamicFamiliarTerm}. How has your stress metric improved after writing or dialoguing?
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-slate-700 text-xs font-bold block">
                    Rate your mental state now (1-10)
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setPostChatMood(num)}
                        className={`h-9 rounded-lg border-2 font-bold text-xs flex items-center justify-center transition-all cursor-pointer ${
                          postChatMood === num
                            ? "bg-slate-900 border-slate-900 text-[#FFF200]"
                            : "bg-white border-slate-200 text-slate-600 hover:border-slate-400 font-semibold"
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold px-1 select-none">
                    <span>1 - Melancholy</span>
                    <span>10 - Resolute Light</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  type="button"
                  onClick={executePostChatLog}
                  className="w-full bg-slate-900 hover:bg-slate-850 text-white font-bold text-xs py-3 rounded-xl shadow-md border-2 border-slate-900 transition-all flex items-center justify-center gap-1.5 cursor-pointer align-middle"
                >
                  Archive & Complete Session
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* MOBILE HEADER BAR */}
      <header className="sticky top-0 z-30 flex md:hidden items-center justify-between bg-slate-900 text-white px-4 py-3 border-b border-slate-800 shrink-0 select-none">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2.5 -ml-2 text-slate-350 hover:text-white rounded-lg focus:outline-none transition active:bg-slate-800/60"
            aria-label="Open menu"
            id="mobile-menu-open-btn"
          >
            <Menu className="w-5 h-5 text-slate-100" />
          </button>
          
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-coral pulse-heart" />
            <span className="font-display font-extrabold text-white tracking-wide text-xs whitespace-nowrap">TalkItThrough App</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="bg-brand-coral/20 border border-brand-coral/45 px-2 py-1 rounded text-[9px] font-bold text-white flex items-center gap-1">
            <span>🔥</span>
            <span>{user.streakCount || 0}d</span>
          </div>
          {user.isAnonymous && (
            <span className="bg-amber-500/20 border border-amber-500/40 text-[8px] font-mono font-bold text-amber-500 px-1.5 py-0.5 rounded uppercase tracking-wider">
              Guest
            </span>
          )}
        </div>
      </header>

      {/* BACKGROUND DRAWER BACKDROP */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-slate-950/65 backdrop-blur-[2px] md:hidden"
            id="mobile-menu-backdrop"
          />
        )}
      </AnimatePresence>

      {/* SIDEBAR NAVIGATION PANEL */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col justify-between shrink-0 border-r border-slate-850 transform transition-transform duration-300 md:relative md:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
        id="app-sidebar-nav"
      >
        
        {/* Upper elements */}
        <div>
          {/* Logo container */}
          <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-brand-coral pulse-heart" />
              <span className="font-display font-extrabold text-[#ffffff] tracking-wide text-sm whitespace-nowrap">TalkItThrough App</span>
            </div>
            
            {/* Close button for mobile views */}
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden p-2 -mr-2 text-slate-400 hover:text-white transition rounded-xl"
              aria-label="Close menu"
              id="mobile-menu-close-btn"
            >
              <X className="w-5 h-5" />
            </button>
            
            <span className="bg-emerald-900/40 text-emerald-400 text-[10px] font-bold border border-emerald-800 rounded px-1.5 py-0.5 uppercase tracking-wider hidden md:inline-block">ONLINE</span>
          </div>
 
          {/* Logged in Profiler */}
          <div className="px-6 py-4.5 bg-slate-950/40">
            {user.isAnonymous ? (
              <p className="text-[10px] uppercase text-amber-500 font-mono font-bold tracking-widest leading-none mb-1">Guest Sneak Peek</p>
            ) : (
              <>
                {user.gender === "Female" && (
                  <p className="text-[10px] uppercase text-[#C5A059] font-mono font-bold tracking-widest leading-none mb-1">Active Sister</p>
                )}
                {user.gender === "Male" && (
                  <p className="text-[10px] uppercase text-slate-450 font-mono font-bold tracking-widest leading-none mb-1">Active Brother</p>
                )}
              </>
            )}
            <p className="font-display font-bold text-slate-200 mt-1">{user.name}</p>
            <p className="text-[10px] text-slate-400 truncate mt-0.5">{user.email}</p>
            <div 
              className="flex items-center gap-1.5 bg-brand-coral/20 border border-brand-coral/45 px-2.5 py-1.5 rounded-lg mt-3.5 select-none leading-none"
              style={{ color: '#f8f8f8' }}
            >
              <span className="text-sm">🔥</span>
              <span 
                className="font-extrabold text-xs uppercase"
                style={{ color: '#f8f8f8' }}
              >
                STREAK: {user.streakCount || 0} DAYS LOGGED
              </span>
            </div>
          </div>
 
          {/* NAV ITEMS MAP */}
          <nav className="p-4 space-y-1.5 font-medium">
            {[
              { id: "home", label: "Dashboard Portal", icon: <Home className="w-4 h-4" /> },
              { id: "chat", label: "CBT Therapy Chat", icon: <MessageSquare className="w-4 h-4" /> },
              { id: "mood", label: "Mood Analytics", icon: <Activity className="w-4 h-4" /> },
              { id: "groups", label: "Peer support Boards", icon: <Users className="w-4 h-4" /> },
              { id: "faith", label: "Faith & Wellness Library", icon: <Compass className="w-4 h-4" /> },
              { id: "settings", label: "GDPR Account Settings", icon: <Sliders className="w-4 h-4" /> }
            ].map(item => {
              const isRestricted = user.isAnonymous === true && ["groups", "faith", "settings"].includes(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => { 
                    if (isRestricted) {
                      setRestrictAlertOpen(true);
                      return;
                    }
                    setActiveTab(item.id as any); 
                    setAlertText(null); 
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition font-semibold text-left relative active:scale-[0.98] ${isRestricted ? "opacity-70 hover:opacity-100" : ""} ${activeTab === item.id ? "bg-brand-coral text-white shadow-md font-bold" : "text-slate-400 hover:text-white hover:bg-slate-800/40"}`}
                >
                  <div className="flex items-center gap-3">
                    {item.icon}
                    <span className="text-xs">{item.label}</span>
                  </div>
                  {isRestricted && (
                    <span className="bg-brand-coral text-white border border-brand-coral/50 text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase font-mono">
                      Locked
                    </span>
                  )}
                </button>
              );
            })}
 
            {user.role === "admin" && (
              <button
                onClick={() => { 
                  setActiveTab("admin"); 
                  setAlertText(null);
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition font-semibold text-left active:scale-[0.98] ${activeTab === "admin" ? "bg-amber-500 text-slate-950 shadow-md font-bold" : "text-amber-400 hover:text-white hover:bg-amber-500/10"}`}
              >
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold">Admin Control Desk</span>
              </button>
            )}
          </nav>
        </div>
 
        {/* Lower exit item & Subtle Admin entry */}
        <div className="p-4 border-t border-slate-800 space-y-1">
          {/* Subtle Admin Action */}
          <button 
            onClick={() => {
              setIsSidebarOpen(false);
              if (user.role === "admin") {
                // Switch back to peer immediately
                const updatedUser = { ...user, role: "peer" };
                onUserUpdate(updatedUser);
                setAlertText("Returned to general peer support perspective.");
                if (activeTab === "admin") setActiveTab("home");
              } else {
                // Open Passcode Modal
                setAdminPasscodeModalOpen(true);
                setAdminPasscodeInput("");
                setAdminPasscodeError("");
              }
            }}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-slate-400 hover:text-amber-400 hover:bg-slate-800/20 text-[10px] font-medium tracking-tight text-left transition cursor-pointer group active:scale-[0.98]"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 animate-pulse" />
            <span>{user.role === "admin" ? "Toggle to Peer View" : "Toggle Admin Mode"}</span>
          </button>
 
          <button 
            onClick={() => {
              setIsSidebarOpen(false);
              onLogout();
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 font-bold tracking-tight text-left transition active:scale-[0.98]"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out Offline</span>
          </button>
        </div>
      </aside>

      {/* COMPANION MAIN AREA */}
      <main className="grow flex flex-col h-[calc(100vh-53px)] md:h-screen overflow-y-auto">
        
        {/* Alert prompt if safe overrides generated */}
        {alertText && (
          <div className="bg-red-50 text-red-800 border-b border-red-200 px-6 py-3.5 flex items-start gap-2.5 text-xs">
            <ShieldAlert className="w-5 h-5 text-red-650 shrink-0 mt-0.5 animate-bounce" />
            <div>
              <p className="font-bold">CRITICAL COMPASS INITIATIVE ALERT</p>
              <p className="mt-0.5">{alertText}</p>
              <p className="font-bold mt-1">📞 Crisis dispatch responders BEFRIENDERS NIGERIA waiting: +234 (0) 2223 4567</p>
            </div>
          </div>
        )}

        <div className="p-4 md:p-8 space-y-4 md:space-y-6">
          
          {/* ================= TAB 1: DASHBOARD PORTAL ================= */}
          {activeTab === "home" && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-6 text-slate-705"
            >
              {/* Header Greet with Calming Therapeutic Breath Guide */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-2xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(21,30,40,1)] bg-brand-cream/30 relative overflow-hidden">
                {/* Visual calming subtle gradient ray */}
                <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-[#00AFB2]/10 to-transparent pointer-events-none hidden md:block" />
                
                <div className="flex flex-col sm:flex-row sm:items-center gap-5 relative z-10">
                  {/* Calming visual bubble element built with the 'breath-bubble' class */}
                  <div className="relative shrink-0 flex items-center justify-center w-12 h-12">
                    {/* Pulsing ring outer */}
                    <div className="absolute w-12 h-12 rounded-full border-3 border-[#00AFB2]/40 breath-bubble" style={{ transformOrigin: 'center' }} />
                    {/* Pulsing ring inner */}
                    <div className="w-9 h-9 rounded-full bg-[#005CB9] border-2 border-slate-900 flex items-center justify-center breath-bubble relative z-10 shadow-[2px_2px_0px_0px_rgba(21,30,40,1)]" style={{ animationDelay: '0.5s', transformOrigin: 'center' }}>
                      <Heart className="w-4 h-4 text-[#FFF200] animate-pulse shrink-0" />
                    </div>
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="font-display text-2xl font-extrabold text-slate-800 leading-none">{timeOfDay}, {user.name.split(" ")[0]}</h1>
                      <span className="inline-flex items-center gap-1.5 bg-[#00AFB2]/10 text-brand-blue border-2 border-slate-900 text-[9px] font-extrabold px-2.5 py-0.5 rounded-full select-none uppercase">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00AFB2] animate-ping" /> Synchronous Breath Active
                      </span>
                    </div>
                    <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">We stand in your corner today. Inhale slow deep comfort, exhale silent stress with the pacer loop.</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 relative z-10">
                  <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCreateNewChatThread}
                    className="w-full sm:w-auto bg-brand-coral hover:bg-[#d66b49] text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-[3px_3px_0px_0px_rgba(21,30,40,1)] hover:shadow-[5px_5px_0px_0px_rgba(21,30,40,1)] border-2 border-slate-900 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4 animate-bounce" /> Start Therapy Session
                  </motion.button>
                </div>
              </div>

              {/* PIDGIN DYNAMIC AFFIRMATION BANNER */}
              <motion.div 
                whileHover={{ scale: 1.01 }}
                className="bg-[#FFF200] border-2 border-slate-900 p-6 rounded-2xl text-slate-900 shadow-[4px_4px_0px_0px_rgba(21,30,40,1)] flex items-center justify-between gap-4 relative overflow-hidden select-none"
              >
                <div className="space-y-2">
                  <span className="bg-slate-900 text-[#FFF200] font-extrabold tracking-wider text-[9px] px-2.5 py-1 rounded uppercase leading-none">DAILY HARBOR REMINDER (PIDGIN)</span>
                  <p className="font-display font-extrabold text-lg text-slate-900 leading-snug">"{affirmation}"</p>
                </div>
                <Sparkles className="w-12 h-12 text-[#151E28]/40 shrink-0 rotate-12 hidden sm:block animate-pulse" />
              </motion.div>

              {/* ACTION QUICK CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  {
                    id: "mood",
                    icon: <Smile className="text-brand-sage w-5 h-5" />,
                    title: "Log Daily Mood",
                    desc: "Trace your emotional recovery line today.",
                    action: () => setActiveTab("mood"),
                    bg: "bg-white"
                  },
                  {
                    id: "groups",
                    icon: <Users className="text-brand-blue w-5 h-5" />,
                    title: "Supportive Boards",
                    desc: `Anonymously share stories with other ${user.gender === "Female" ? "sisters" : user.gender === "Male" ? "brothers" : "peers"}.`,
                    action: () => setActiveTab("groups"),
                    bg: "bg-white"
                  },
                  {
                    id: "faith",
                    icon: <Compass className="text-brand-taupe w-5 h-5" />,
                    title: "Audio Meditations",
                    desc: "Listen to relaxing breathing loop structures.",
                    action: () => setActiveTab("faith"),
                    bg: "bg-white"
                  },
                  {
                    id: "settings",
                    icon: <Sliders className="text-brand-coral w-5 h-5" />,
                    title: "NDPR Compliance",
                    desc: "Export data models or verify secure encryptions.",
                    action: () => setActiveTab("settings"),
                    bg: "bg-white"
                  }
                ].map((card, i) => {
                  const isRestricted = user.isAnonymous === true && ["groups", "faith", "settings"].includes(card.id);
                  return (
                    <motion.div 
                      key={i} 
                      onClick={() => {
                        if (isRestricted) {
                          setRestrictAlertOpen(true);
                          return;
                        }
                        card.action();
                      }}
                      whileHover={{ scale: 1.05, y: -4 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 350, damping: 15 }}
                      className={`${card.bg} p-5 cursor-pointer border-2 border-slate-900 rounded-2xl shadow-[3px_3px_0px_0px_rgba(21,30,40,1)] hover:shadow-[5px_5px_0px_0px_rgba(21,30,40,1)] transition-all duration-150 flex flex-col justify-between h-40 relative`}
                    >
                      {isRestricted && (
                        <span className="absolute top-3 right-3 bg-brand-coral/10 border border-brand-coral/30 text-brand-coral text-[8px] font-extrabold px-2 py-0.5 rounded uppercase font-mono tracking-wider">
                          Locked
                        </span>
                      )}
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 w-10 h-10 flex items-center justify-center">
                        {card.icon}
                      </div>
                      <div>
                        <h4 className="font-display font-bold text-slate-800 text-sm leading-tight flex items-center gap-1.5">
                          {card.title}
                        </h4>
                        <p className="text-slate-500 text-[11px] mt-1.5 leading-relaxed">{card.desc}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* TWO COLUMN SUMMARY: Chart snapshot + Upcoming options */}
              <div id="mood-trends-container" className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
                
                {/* Recharts Mood Trends Consistent with Mind.org.uk */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(21,30,40,1)] space-y-5 relative overflow-hidden flex flex-col justify-between">
                  {/* Absolute visual highlights */}
                  <div className="absolute right-0 top-0 w-32 h-32 bg-[#FFF200]/10 rounded-full blur-2xl pointer-events-none" />
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
                    <div>
                      <h3 className="font-display font-extrabold text-brand-charcoal text-base flex items-center gap-1.5 leading-none">
                        <Activity className="text-brand-blue w-5 h-5 animate-pulse" /> Mood & Recovery Trends
                      </h3>
                      <p className="text-slate-500 text-xs mt-1.5">Visualizing your daily mental resilience logs over the past week</p>
                    </div>

                    {/* Dynamic Status indicators if data exists */}
                    {chartData.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="bg-brand-blue/15 text-brand-blue text-[9px] font-extrabold px-2.5 py-1 rounded-lg border-2 border-slate-900">
                          Avg Mood: {chartData.length > 0 ? (chartData.reduce((acc, curr) => acc + curr.Mood, 0) / chartData.length).toFixed(1) : "—"}/10
                        </span>
                        <span className="bg-brand-sage/15 text-brand-blue text-[9px] font-extrabold px-2.5 py-1 rounded-lg border-2 border-slate-900">
                          Avg Sleep: {chartData.length > 0 ? (chartData.reduce((acc, curr) => acc + curr.Sleep, 0) / chartData.length).toFixed(1) : "—"}/10
                        </span>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleSeedDemoLogs}
                          className="bg-[#FFF200] hover:bg-yellow-400 text-slate-900 text-[9.5px] font-extrabold px-2 py-1 rounded-lg border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(21,30,40,1)] cursor-pointer"
                        >
                          Reset Demo Loop
                        </motion.button>
                      </div>
                    )}
                  </div>

                  {/* Line Chart Area */}
                  <div className="h-48 w-full relative z-10 mt-3">
                    {chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                          <XAxis dataKey="date" stroke="#4B5563" fontSize={10} fontWeight="700" tickLine={false} />
                          <YAxis stroke="#4B5563" fontSize={10} fontWeight="700" domain={[1, 10]} tickLine={false} axisLine={false} />
                          <Tooltip 
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                  <div className="bg-[#FFFDF9] border-2 border-slate-900 p-3 rounded-lg shadow-[3px_3px_0px_0px_rgba(21,30,40,1)] text-[11px] font-medium space-y-1.5 text-slate-800">
                                    <p className="font-bold text-brand-charcoal text-xs border-b border-slate-200 pb-1 flex items-center gap-1">
                                      <span>📅 {data.dateLabel || data.date}</span>
                                    </p>
                                    <div className="space-y-0.5">
                                      <p className="text-[#005CB9] font-extrabold">● Mood Level: {data.Mood} / 10</p>
                                      <p className="text-[#00AFB2] font-extrabold">● Sleep Quality: {data.Sleep} / 10</p>
                                    </div>
                                    {data.notes && (
                                      <p className="text-[10px] text-slate-500 italic max-w-[200px] border-t border-dashed border-slate-200 pt-1 mt-1 font-sans">
                                        "{data.notes}"
                                      </p>
                                    )}
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="Mood" 
                            stroke="#005CB9" 
                            strokeWidth={3} 
                            dot={{ r: 5, stroke: "#151E28", strokeWidth: 2, fill: "#FFF200" }} 
                            activeDot={{ r: 7, stroke: "#151E28", strokeWidth: 2 }} 
                          />
                          <Line 
                            type="monotone" 
                            dataKey="Sleep" 
                            stroke="#00AFB2" 
                            strokeWidth={2.5} 
                            strokeDasharray="4 4"
                            dot={{ r: 4, stroke: "#151E28", strokeWidth: 1.5, fill: "#FFFFFF" }} 
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-slate-400 bg-brand-cream/50 border-2 border-dashed border-slate-900/30 rounded-xl p-4 text-center">
                        <Smile className="w-8 h-8 text-brand-blue opacity-50 mb-2 animate-bounce" />
                        <p className="font-bold text-xs text-slate-705">No mental logs analyzed yet.</p>
                        <p className="text-[10px] text-slate-500 max-w-sm mt-1 leading-snug">
                          Trace your dynamic mood inside the index panel, or seed standard parameters to see your resilience graph instantly.
                        </p>
                        <div className="flex items-center gap-3 mt-4">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setActiveTab("mood")}
                            className="bg-[#005CB9] hover:bg-[#004285] text-white text-[10px] font-bold px-3 py-1.5 rounded-lg border-2 border-slate-900 cursor-pointer shadow-[2px_2px_0px_0px_rgba(21,30,40,1)]"
                          >
                            Log Mood
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleSeedDemoLogs}
                            className="bg-[#FFF200] hover:bg-yellow-400 text-slate-900 text-[10px] font-bold px-3 py-1.5 rounded-lg border-2 border-slate-900 cursor-pointer shadow-[2px_2px_0px_0px_rgba(21,30,40,1)]"
                          >
                            Seed 7-Day Demo Loops
                          </motion.button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Upcoming roadmap indices */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 flex flex-col justify-between">
                  <h3 className="font-display font-bold text-sm text-slate-800 flex items-center gap-1.5 leading-none">
                    <Calendar className="text-brand-sage w-4 h-4 animate-pulse" /> Ibadan Clinical Milestones
                  </h3>
                  
                  <div className="space-y-3 font-medium text-slate-600 text-[11px] flex-grow mt-3">
                    <div className="flex justify-between items-center bg-brand-cream/60 p-2.5 rounded-xl border border-brand-sage/10">
                      <span>1:1 Medical Video therapy</span>
                      <span className="bg-brand-coral/10 text-brand-coral text-[9px] font-bold px-2 py-0.5 rounded font-mono">Q2 2025</span>
                    </div>
                    <div className="flex justify-between items-center bg-brand-cream/60 p-2.5 rounded-xl border border-brand-sage/10">
                      <span>Oyo State Outreach meetups</span>
                      <span className="bg-brand-sage/15 text-brand-sage text-[9px] font-bold px-2 py-0.5 rounded font-mono">Q3 2025</span>
                    </div>
                    <div className="flex justify-between items-center bg-brand-cream/60 p-2.5 rounded-xl border border-brand-sage/10">
                      <span>SMS Daily Pidgin Reminders</span>
                      <span className="bg-slate-200 text-slate-600 text-[9px] font-bold px-2 py-0.5 rounded font-mono">STAGED</span>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400 italic text-center mt-3">All features comply strictly with sensitive information rules.</p>
                </div>

              </div>
            </motion.div>
          )}

          {/* ================= TAB 2: CBT THERAPY CHAT ================= */}
          {activeTab === "chat" && (
            <div className="flex flex-col gap-4 h-[calc(100vh-140px)] md:h-[calc(100vh-170px)] animate-fade-in text-slate-700">
              
              {/* Segmented sub tabs for mobile thumb navigation */}
              <div className="flex md:hidden bg-slate-200 p-1 rounded-xl shrink-0 select-none">
                <button
                  type="button"
                  onClick={() => setChatSubView("chat")}
                  className={`flex-1 py-1.5 text-center text-xs font-bold rounded-lg transition active:scale-[0.98] ${chatSubView === "chat" ? "bg-white text-slate-900 shadow-xs" : "text-slate-505 text-slate-500 hover:text-slate-800"}`}
                >
                  Active CBT Chat
                </button>
                <button
                  type="button"
                  onClick={() => setChatSubView("history")}
                  className={`flex-1 py-1.5 text-center text-xs font-bold rounded-lg transition relative active:scale-[0.98] ${chatSubView === "history" ? "bg-white text-slate-900 shadow-xs" : "text-slate-505 text-slate-500 hover:text-slate-800"}`}
                >
                  Sessions Loop History
                  {chatSessions.length > 0 && (
                    <span className="absolute top-1.5 right-4 w-1.5 h-1.5 rounded-full bg-brand-coral pulse-heart" />
                  )}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 flex-1 min-h-0">
                
                {/* Sessions thread manager sidebar */}
                <div className={`${chatSubView === "history" ? "flex" : "hidden md:flex"} md:col-span-3 bg-white p-4 border border-slate-200 rounded-2xl flex-col justify-between h-full min-h-0`}>
                  <div className="space-y-4 flex-grow overflow-y-auto">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="font-display font-bold text-slate-800 text-xs">COUNSELLING REPLICAS</h3>
                      <button 
                        onClick={handleCreateNewChatThread}
                        className="text-brand-coral hover:text-[#d36643] text-xs font-bold px-2 py-1 rounded"
                      >
                        + NEW
                      </button>
                    </div>

                    {chatSessions.length === 0 ? (
                      <p className="text-slate-400 font-medium text-[11px] text-center pt-8">No counseling loops indexed.</p>
                    ) : (
                      <div className="space-y-1.5 w-full">
                        {chatSessions.map(sess => (
                          <div 
                            key={sess.id}
                            onClick={() => { 
                              setActiveSession(sess); 
                              setAlertText(null); 
                              setChatSubView("chat"); // Auto focus conversational pane on selection
                            }}
                            className={`p-2.5 rounded-xl cursor-pointer transition border text-left flex justify-between items-center ${activeSession?.id === sess.id ? "bg-brand-cream border-brand-sage/40" : "border-slate-100 hover:bg-slate-50"}`}
                          >
                            <div className="truncate max-w-[120px]">
                              <p className="font-semibold text-slate-800 truncate text-[11px]">{sess.title}</p>
                              <p className="text-[9px] text-slate-400 font-mono mt-0.5">{new Date(sess.createdAt).toLocaleDateString()}</p>
                            </div>
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm("Delete this thread permanently?")) {
                                  fetch(`/api/chat/sessions/${sess.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` }})
                                    .then(() => {
                                      loadTherapySessions();
                                      if (activeSession?.id === sess.id) setActiveSession(null);
                                    });
                                }
                              }}
                              className="text-slate-300 hover:text-red-500 p-1.5 rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {activeSession && (
                    <button
                      onClick={handleFinishChatThread}
                      className="w-full bg-[#cbd5e1] hover:bg-slate-200 border border-slate-300 text-slate-800 font-bold py-2.5 rounded-xl text-xs mt-4 transition active:scale-[0.98]"
                    >
                      Finish Thread Log Wellness
                    </button>
                  )}
                </div>

                {/* Main chat viewport */}
                <div className={`${chatSubView === "chat" ? "flex" : "hidden md:flex"} md:col-span-9 bg-white border border-slate-200 rounded-2xl overflow-hidden flex-col justify-between h-full min-h-0`}>
                  
                  {/* Active header with dynamic language selector */}
                  <div className="bg-slate-50 border-b border-slate-100 px-4 md:px-5 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shrink-0 select-none">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                      <div>
                        <span className="font-display font-black text-slate-800 text-xs block">CBT AI Peer Helper</span>
                        <span className="text-[10px] text-slate-400 font-bold block">Secure Multilingual Channel</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 w-full sm:w-auto mt-1 sm:mt-0">
                      <label htmlFor="active-chat-lang-select" className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-slate-500 whitespace-nowrap hidden lg:inline">Active Accent:</label>
                      <select
                        id="active-chat-lang-select"
                        value={chatLanguage}
                        onChange={(e) => {
                          const newLang = e.target.value;
                          setChatLanguage(newLang);
                          stopSpeakingText();
                        }}
                        className="bg-white border-2 border-slate-900 text-slate-800 font-extrabold px-3 py-1.5 rounded-xl cursor-pointer text-xs focus:ring focus:ring-brand-coral/25 focus:outline-none w-full sm:w-auto"
                      >
                        {LANGUAGES_LIST.map((lang) => (
                          <option key={lang.code} value={lang.code}>
                            {lang.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Messages scrollarea */}
                  <div className="grow p-4 md:p-5 overflow-y-auto space-y-4">
                    {activeSession ? (
                      <>
                        <div className="bg-[#FAF8F5] border border-brand-sage/10 text-slate-600 rounded-2xl p-4 space-y-2 text-[11px] max-w-sm mx-auto shadow-xs select-none">
                          <p className="font-bold flex items-center gap-1"><Sparkles className="w-3.5 h-3.5 text-brand-sage" /> System CBT Session Guard</p>
                          <p className="leading-relaxed">This chatbot is a supportive companion designed to stand in your corner. Let's trace any distress, work-issues, or mental weights you are carrying. Take standard slow deep breaths while typing.</p>
                        </div>

                        {activeSession.messages.map((msg, i) => (
                          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[85%] md:max-w-md rounded-2xl p-3.5 shadow-xs space-y-1 relative group ${
                              msg.role === "user" 
                                ? "bg-slate-900 border border-slate-850 text-white" 
                                : msg.isCrisisMatch 
                                  ? "bg-red-50 border border-red-200 text-slate-800" 
                                  : "bg-brand-cream border border-brand-sage/20 text-slate-800"
                            }`}>
                              <div className="flex justify-between items-start gap-2">
                                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                  {msg.role === "user" ? "YOU" : "TalkItThrough AI"}
                                </p>
                                
                                {msg.role === "model" && (
                                  <button
                                    type="button"
                                    onClick={() => speakText(msg.content)}
                                    className="p-1 rounded-lg hover:bg-slate-200 transition-colors text-slate-500 hover:text-slate-950 cursor-pointer"
                                    title="Speak Response Aloud"
                                  >
                                    <Volume2 className={`w-3.5 h-3.5 ${isSpeaking ? "animate-bounce text-brand-blue" : ""}`} />
                                  </button>
                                )}
                              </div>
                              
                              <p className="leading-relaxed whitespace-pre-wrap text-xs font-semibold">{msg.content}</p>
                              
                              <p className="text-[9px] text-slate-400 text-right mt-1.5 font-mono">
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        ))}

                        {chatLoading && (
                          <div className="flex justify-start">
                            <div className="bg-brand-cream border border-brand-sage/2 w-48 rounded-2xl p-4 flex items-center justify-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-brand-coral animate-ping" />
                              <span className="text-xs text-slate-500 font-bold">Compass AI is writing...</span>
                            </div>
                          </div>
                        )}
                        
                        <div ref={chatEndRef} />
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-slate-400 text-center gap-2 max-w-xs mx-auto">
                        <MessageSquare className="w-12 h-12 opacity-30 animate-pulse" />
                        <p className="font-bold">Access a CBT chat room</p>
                        <p className="text-[11px] opacity-75">Click on the top right "+ NEW" button, rate your pre-chat mood state, and speak with TalkItThrough AI.</p>
                        <button onClick={handleCreateNewChatThread} className="bg-brand-coral hover:bg-[#d46643] text-white text-xs font-bold px-4 py-2 mt-2 rounded-xl shadow-xs">
                          Rate & Create Session
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Input form */}
                  {activeSession && (
                    <div className="bg-slate-50 border-t border-slate-100 p-4 shrink-0 space-y-2">
                      <form onSubmit={handleSendMessage} className="flex gap-2">
                        <input
                          required
                          type="text"
                          placeholder={isListening ? "Listening silently... speak into microphone" : "Type your message or click microphone..."}
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          disabled={isListening}
                          className="grow bg-white border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-brand-coral placeholder-slate-400 font-semibold text-slate-1500 text-slate-700 text-xs disabled:bg-slate-100 disabled:text-slate-500"
                        />
                        
                        {/* Mic Button with recording animation feedback */}
                        <button
                          type="button"
                          onClick={() => {
                            if (isListening) {
                              stopSpeechRecognition();
                            } else {
                              startSpeechRecognition();
                            }
                          }}
                          className={`p-3 rounded-xl border transition cursor-pointer active:scale-95 flex items-center justify-center gap-1 shrink-0 ${
                            isListening
                              ? "bg-red-500 text-white border-red-500 animate-pulse font-bold"
                              : "bg-slate-200 hover:bg-slate-300 border-transparent text-slate-700"
                          }`}
                          title={isListening ? "Stop voice listening" : "Speak using Microphone"}
                        >
                          <Mic className="w-4 h-4" />
                          {isListening && <span className="text-[10px] uppercase font-mono tracking-widest px-1">Active</span>}
                        </button>

                        {/* Stop Narrative / Synthesis button */}
                        {(isSpeaking || isListening) && (
                          <button
                            type="button"
                            onClick={() => {
                              stopSpeakingText();
                              stopSpeechRecognition();
                            }}
                            className="bg-slate-900 text-[#FFF200] hover:bg-slate-850 p-3 rounded-xl border border-slate-900 transition cursor-pointer active:scale-95 shrink-0 flex items-center justify-center"
                            title="Stop all speak audio output & mic intake"
                          >
                            <span className="text-[10px] uppercase font-mono tracking-widest font-black whitespace-nowrap px-1">🛑 Stop Audio</span>
                          </button>
                        )}
                        
                        <button
                          type="submit"
                          className="bg-brand-coral hover:bg-[#d66b49] text-white p-3 rounded-xl shadow transition cursor-pointer active:scale-95"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </form>

                      {/* Unified footer notification notes */}
                      <div className="flex flex-wrap items-center justify-between text-[10px] text-slate-400 select-none px-1 pt-0.5 leading-none gap-2">
                        <div className="flex items-center gap-1 text-slate-400">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                          <span>CBT Assistant Engine</span>
                        </div>
                        {asrFallbackTip && (
                          <div className="text-amber-600 font-semibold italic truncate">
                            {asrFallbackTip}
                          </div>
                        )}
                        <span className="font-semibold text-[9.5px] text-right font-mono text-slate-400">Powered by AVA AI & Gemini</span>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 3: MOOD TRACKER & ANALYSIS ================= */}
          {activeTab === "mood" && (
            <div className="space-y-6 animate-fade-in text-slate-700">
              
              <div>
                <h1 className="font-display text-2xl font-extrabold text-slate-800 leading-none">Trace Mental Fluctuations</h1>
                <p className="text-slate-500 text-xs mt-1">Submit daily indicators to paint your emotional recovery chart under secure standards.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Form column */}
                <div className="lg:col-span-5 bg-white p-6 border border-slate-200/80 rounded-2xl shadow-xs space-y-4">
                  <h3 className="font-display font-bold text-sm text-slate-800 flex items-center gap-1.5 leading-none">
                    <Calendar className="text-brand-coral" /> Create Daily Mood Log
                  </h3>

                  {moodSubmitted ? (
                    <div className="bg-emerald-50 text-emerald-800 p-4 border border-emerald-150 rounded-xl text-xs text-center space-y-1">
                      <p className="font-bold">Log Recorded Successfully!</p>
                      <p>Thank you, {user.gender === "Female" ? "sister" : user.gender === "Male" ? "brother" : "friend"}. Tracing results regularly develops clean subconscious awareness.</p>
                    </div>
                  ) : (
                    <form onSubmit={handleLogManualMood} className="space-y-4 text-xs font-semibold">
                      
                      <div className="space-y-1.5">
                        <div className="flex justify-between font-bold text-slate-600">
                          <span>Rate Current Mood:</span>
                          <span className="text-brand-coral">{moodForm.mood} / 10</span>
                        </div>
                        <input
                          type="range"
                          min={1}
                          max={10}
                          value={moodForm.mood}
                          onChange={(e) => setMoodForm(prev => ({ ...prev, mood: Number(e.target.value) }))}
                          className="w-full accent-brand-coral h-2 bg-slate-150 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-slate-400 pt-0.5">
                          <span>1 (Hurting / Despair)</span>
                          <span>10 (Balanced / Peace)</span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between font-bold text-slate-600">
                          <span>Rate Sleep Quality:</span>
                          <span className="text-brand-blue">{moodForm.sleepQuality} / 10</span>
                        </div>
                        <input
                          type="range"
                          min={1}
                          max={10}
                          value={moodForm.sleepQuality}
                          onChange={(e) => setMoodForm(prev => ({ ...prev, sleepQuality: Number(e.target.value) }))}
                          className="w-full accent-brand-blue h-2 bg-slate-155 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-slate-400 pt-0.5">
                          <span>1 (Exhausted)</span>
                          <span>10 (Deeply Rested)</span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-slate-600 font-bold">Write Journaling Comments (Optional):</label>
                        <textarea
                          placeholder="How is your spirit today? Any stress weights?"
                          rows={3}
                          value={moodForm.notes}
                          onChange={(e) => setMoodForm(prev => ({ ...prev, notes: e.target.value }))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 font-medium focus:outline-none focus:ring-1 focus:ring-brand-coral placeholder-slate-450 text-slate-700"
                        />
                      </div>

                      <button type="submit" className="w-full bg-brand-coral hover:bg-[#d66b49] text-white py-2.5 rounded-xl shadow transition font-display font-semibold">
                        Publish Safe Log
                      </button>

                    </form>
                  )}
                </div>

                {/* Analysis charts column */}
                <div className="lg:col-span-7 bg-white p-6 border border-slate-200/80 rounded-2xl shadow-xs space-y-6">
                  <h3 className="font-display font-bold text-sm text-slate-800 flex items-center gap-1.5 leading-none mb-2">
                    <Activity className="text-brand-blue" /> Weekly Statistical Chart (1-10 Metrics)
                  </h3>

                  <div className="h-64 w-full">
                    {chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272A" />
                          <XAxis dataKey="date" stroke="#a1a1aa" fontSize={10} tickLine={false} />
                          <YAxis stroke="#a1a1aa" fontSize={10} domain={[1, 10]} tickLine={false} axisLine={false} />
                          <Tooltip contentStyle={{ backgroundColor: "#16181A", borderColor: "#27272A", color: "#FFFFFF" }} />
                          <Line type="monotone" dataKey="Mood" stroke="#10B981" strokeWidth={2.5} activeDot={{ r: 6 }} />
                          <Line type="monotone" dataKey="Sleep" stroke="#38BDF8" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-8 text-slate-400 bg-slate-50 border border-dashed border-slate-200 rounded-xl h-full m-auto text-center justify-items-center">
                        <Activity className="w-10 h-10 animate-pulse opacity-40 mb-2" />
                        <p className="font-bold text-xs">No chart records found yet.</p>
                        <p className="text-[10px] opacity-70 mt-1">Rate and log your emotion first inside the left panel.</p>
                      </div>
                    )}
                  </div>

                  {/* Logs list trace */}
                  <div className="space-y-3.5 border-t border-slate-100 pt-5">
                    <p className="font-bold text-xs text-slate-800">Your Historic Log Trace (Cleaned):</p>
                    <div className="max-h-40 overflow-y-auto space-y-2 font-medium text-xs text-slate-600">
                      {moodLogs.length === 0 ? (
                        <p className="text-slate-400 italic text-[11px]">No reports analyzed.</p>
                      ) : (
                        moodLogs.map(log => (
                          <div key={log.id} className="p-3 bg-slate-50 rounded-xl border border-slate-150 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                            <div>
                              <p className="font-bold text-slate-800 text-[11px] flex items-center gap-2">
                                <span className="bg-brand-coral/10 text-brand-coral px-1.5 py-0.5 rounded">MOOD {log.mood}</span>
                                <span className="bg-brand-blue/10 text-brand-blue px-1.5 py-0.5 rounded">SLEEP {log.sleepQuality}</span>
                              </p>
                              <p className="text-[10px] text-slate-505 truncate mt-1 max-w-[280px]">"{log.notes || "No journaling text added."}"</p>
                            </div>
                            <span className="text-[9px] text-slate-400 shrink-0 font-mono">{new Date(log.createdAt).toLocaleString()}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>

              </div>
            </div>
          )}

          {/* ================= TAB 4: PEER SUPPORT BOARDS ================= */}
          {activeTab === "groups" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-170px)] animate-fade-in text-slate-700">
              
              {/* Rooms sidebar list */}
              <div className="lg:col-span-3 bg-white p-4 border border-slate-200 rounded-2xl space-y-4 h-full">
                <h3 className="font-display font-bold text-slate-800 text-xs border-b border-slate-100 pb-3">SUPPORT CHANNELS</h3>
                <div className="space-y-1.5 font-medium text-xs text-slate-600">
                  {[
                    "General Support",
                    "Faith & Healing",
                    "Workplace & Stress",
                    "Sleep & Anxiety",
                    "Health & Wellness"
                  ].map(room => (
                    <button
                      key={room}
                      onClick={() => setActiveGroupRoom(room)}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl transition ${activeGroupRoom === room ? "bg-brand-coral/10 border-l-4 border-brand-coral text-slate-900 font-bold" : "hover:bg-slate-50"}`}
                    >
                      {room}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat thread */}
              <div className="lg:col-span-9 bg-white border border-slate-200 rounded-2xl flex flex-col justify-between h-full overflow-hidden">
                
                {/* Active header */}
                <div className="bg-slate-50 px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="font-display font-extrabold text-[#2c2e2d] text-sm tracking-tight">{activeGroupRoom} Room</span>
                    <p className="text-slate-400 text-[10px]">Moderate respectful peer-to-peer boards.</p>
                  </div>
                  <span className="text-[9px] bg-[#fdf2ee] text-brand-coral font-bold tracking-tight px-2 py-0.5 rounded-full border border-brand-coral/10 select-none">
                    ANONYMOUS IDENTIFICATION GUARANTEED
                  </span>
                </div>

                {/* Messages scrollarea */}
                <div className="grow p-5 overflow-y-auto space-y-4">
                  <div className="bg-brand-cream border border-brand-sage/20 text-slate-700 rounded-2xl p-4 space-y-2 text-[11px] max-w-xl mx-auto shadow-xs select-none">
                    <p className="font-bold text-slate-750 flex items-center gap-1"><Users className="w-4 h-4 text-brand-coral" /> Community Code of Conduct</p>
                    <ul className="list-decimal pl-4 space-y-1.5 text-slate-650 leading-relaxed font-semibold">
                      {rules && rules.length > 0 ? (
                        rules.map((rule, idx) => (
                          <li key={idx}>{rule}</li>
                        ))
                      ) : (
                        <li>This board is moderated. No toxic arguments, self-harm promotions, or aggressive spiritual preaching allowed. Ensure comments remain supportive and uplifting.</li>
                      )}
                    </ul>
                  </div>

                  {groupMessages.map(msg => (
                    <div key={msg.id} className="bg-slate-50 p-4 border border-slate-150 rounded-2xl space-y-2.5 text-xs relative group animate-fade-in">
                      <div className="flex justify-between items-center bg-[#fafafa] pb-1.5 border-b border-slate-150">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-800 text-[10px] uppercase font-display">{msg.userName}</p>
                          {msg.userName.includes("Admin") && (
                            <span className="bg-amber-100 text-amber-850 font-mono text-[8px] font-bold px-1.5 py-0.5 rounded leading-none">STAFF</span>
                          )}
                        </div>
                        <p className="text-[9px] text-slate-400 font-mono">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>

                      {msg.isReported || reportedIds.includes(msg.id) ? (
                        <p className="text-rose-605 italic font-bold text-[11px] flex items-center gap-1"><Flag className="w-3.5 h-3.5" /> This post has been reported for compliance review by moderators.</p>
                      ) : (
                        <p className="text-slate-700 leading-relaxed font-semibold">{msg.content}</p>
                      )}

                      {/* Msg Action Bar */}
                      {(!msg.isReported && !reportedIds.includes(msg.id)) && (
                        <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-slate-150">
                          <div className="flex items-center gap-4 text-slate-400 font-bold select-none text-[10px]">
                            <button 
                              onClick={() => handleLikeMessage(msg.id)}
                              className={`flex items-center gap-1.5 hover:text-rose-500 transition-colors ${msg.likesUserIds?.includes(user?.email || "") ? "text-rose-500 font-extrabold" : ""}`}
                            >
                              <Heart className={`w-3.5 h-3.5 ${msg.likesUserIds?.includes(user?.email || "") ? "fill-rose-500 text-rose-500" : ""}`} />
                              <span>{msg.likesUserIds?.length || 0} Likes</span>
                            </button>

                            <button 
                              onClick={() => toggleReplies(msg.id)}
                              className={`flex items-center gap-1.5 hover:text-brand-coral transition-colors ${openReplies[msg.id] ? "text-brand-coral font-extrabold" : ""}`}
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>{msg.replies?.length || 0} Replies</span>
                            </button>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleReportMessage(msg.id)}
                              className="text-slate-400 hover:text-rose-500 text-[9px] font-bold flex items-center gap-0.5 transition bg-white px-2 py-1 rounded-md border border-slate-200"
                            >
                              <Flag className="w-2.5 h-2.5" /> Report
                            </button>

                            {user?.role === "admin" && (
                              <button
                                onClick={() => handleAdminDeletePost(msg.id)}
                                className="text-rose-650 hover:bg-rose-50 hover:text-rose-700 text-[9px] font-bold flex items-center gap-0.5 transition bg-white px-2 py-1 rounded-md border border-rose-200"
                                title="Purge post"
                              >
                                <Trash2 className="w-2.5 h-2.5" /> Purge Post
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Inline replies list */}
                      {openReplies[msg.id] && (
                        <div className="mt-3 pl-4 border-l-2 border-brand-coral/30 space-y-3.5 pt-1 bg-slate-50/40 p-2.5 rounded-lg">
                          {msg.replies && msg.replies.length > 0 ? (
                            <div className="space-y-2.5">
                              {msg.replies.map(rep => (
                                <div key={rep.id} className="bg-white p-2.5 rounded-xl border border-slate-150/80 text-[11px] font-medium relative group/reply shadow-xs">
                                  <div className="flex justify-between items-center text-[9px] text-slate-400 pb-1 mb-1 border-b border-slate-100">
                                    <span className="font-extrabold text-slate-700">{rep.userName}</span>
                                    <span>{new Date(rep.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                  </div>
                                  <p className="text-slate-650 font-semibold">{rep.content}</p>
                                  
                                  {user?.role === "admin" && (
                                    <button 
                                      onClick={() => handleDeleteReply(msg.id, rep.id)}
                                      className="absolute right-2 top-2 hover:text-rose-600 text-slate-400 opacity-0 group-hover/reply:opacity-100 transition"
                                      title="Delete Reply"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[10px] text-slate-400 italic">No replies posted yet. Share deep courage or words of backup.</p>
                          )}

                          {/* Post replies form */}
                          <form 
                            onSubmit={(e) => {
                              e.preventDefault();
                              handlePostReply(msg.id);
                            }}
                            className="flex gap-1.5 pt-1"
                          >
                            <input 
                              required
                              type="text"
                              placeholder="Add anonymous, moderated value..."
                              value={replyInputs[msg.id] || ""}
                              onChange={(e) => setReplyInputs(prev => ({ ...prev, [msg.id]: e.target.value }))}
                              className="grow bg-white border border-slate-200 rounded-lg px-3 py-2 text-[11px] focus:outline-none focus:ring-1 focus:ring-brand-coral placeholder-slate-400 font-semibold text-slate-700 shadow-inner"
                            />
                            <button 
                              type="submit" 
                              className="bg-brand-coral hover:bg-[#d66b49] text-white text-[10px] font-display font-bold px-3.5 rounded-lg transition uppercase duration-150"
                            >
                              Comment
                            </button>
                          </form>
                        </div>
                      )}

                    </div>
                  ))}
                </div>

                {/* Form submit */}
                <form onSubmit={handlePostGroupMessage} className="bg-slate-50 border-t border-slate-100 p-4 flex gap-2">
                  <input
                    required
                    type="text"
                    placeholder={`Contribute courageously and supportively to fellow ${user.gender === "Female" ? "sisters" : user.gender === "Male" ? "brothers" : "peers"}...`}
                    value={groupInput}
                    onChange={(e) => setGroupInput(e.target.value)}
                    className="grow bg-white border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-brand-coral placeholder-slate-400 font-semibold text-slate-700"
                  />
                  <button type="submit" className="bg-brand-coral hover:bg-[#d66b49] text-white font-display font-semibold px-4 rounded-xl transition shadow flex items-center gap-1 text-xs">
                    <Send className="w-3.5 h-3.5" /> Post
                  </button>
                </form>

              </div>
            </div>
          )}

          {/* ================= TAB 5: FAITH & WELLNESS RESOURCE LIBRARY ================= */}
          {activeTab === "faith" && (
            <div className="space-y-6 animate-fade-in text-slate-700">
              
              <div>
                <h1 className="font-display text-2xl font-extrabold text-slate-800 leading-none">Faith & Wellness Harbor</h1>
                <p className="text-slate-550 text-xs mt-1">Interweaving evidence-backed cognitive relaxation models with deep, neutral faith perspectives.</p>
              </div>

               {/* Row 1: Audio Meditative pacing + Interactive Breathing Coach */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Audio Loops Column */}
                <div className="lg:col-span-7 bg-white p-6 border-2 border-slate-900 rounded-2xl shadow-[3px_3px_0px_0px_rgba(21,30,40,1)] space-y-4 flex flex-col justify-between">
                  <div>
                    <h3 className="font-display font-extrabold text-brand-charcoal text-base flex items-center gap-1.5 leading-none">
                      <Volume2 className="text-brand-blue" /> Audio Loops & Meditations
                    </h3>
                    <p className="text-slate-500 text-xs mt-2.5">Breathe synchronously with therapeutic loops to decrease somatic fight-or-flight anxiety.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-slate-600 mt-4">
                    {[
                      { title: "5-Min Grounder", desc: "Short deep-sigh therapy for workplace pressure spikes." },
                      { title: "Night-Rest Wave", desc: "Slow sound waves embedded with soft Oyo nature breeze whispers." },
                      { title: "Morning Pidgin", desc: "Energizing mental alignment self-affirmations." }
                    ].map((track, i) => (
                      <div key={i} className="bg-[#FCFCFC] border-2 border-slate-900 p-3 rounded-xl flex flex-col justify-between space-y-3 shadow-[2.5px_2.5px_0px_0px_rgba(21,30,40,1)]">
                        <div>
                          <p className="font-display font-extrabold text-[#005CB9] text-xs leading-tight">{track.title}</p>
                          <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">{track.desc}</p>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => alert(`AUDIO LOOPER: Triggers "${track.title}" streaming download.`)}
                          className="bg-brand-blue text-white text-[9px] font-bold py-1.5 rounded-lg w-full cursor-pointer leading-none border border-slate-900"
                        >
                          Stream Loop
                        </motion.button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Animated Breathing Coach Widget */}
                <div className="lg:col-span-5 bg-[#FCFAF4] p-6 border-2 border-slate-900 rounded-2xl shadow-[4px_4px_0px_0px_rgba(21,30,40,1)] flex flex-col items-center justify-between min-h-[280px] relative overflow-hidden">
                  <div className="text-center z-10 w-full">
                    <span className="bg-[#00AFB2]/15 text-brand-sage border border-[#00AFB2]/30 font-extrabold tracking-widest text-[9px] px-2.5 py-1 rounded-full uppercase leading-none select-none">
                      PACED RESPIRATION HARMONIZER
                    </span>
                    <p className="text-xs text-slate-550 mt-2">Relieve central nervous tension using clinical Box-breathing pacing cycles.</p>
                  </div>

                  {/* Circular visual breathing driver */}
                  <div className="flex flex-col items-center justify-center py-6 relative z-10">
                    <motion.div
                      animate={{
                        scale: isBreathing
                          ? breathPhase === "Inhale"
                            ? [1, 1.25]
                            : breathPhase === "Hold (In)"
                            ? 1.25
                            : breathPhase === "Exhale"
                            ? [1.25, 0.95]
                            : 0.95
                          : 1
                      }}
                      transition={{
                        duration: isBreathing ? 4 : 0.6,
                        ease: "easeInOut"
                      }}
                      className={`w-28 h-28 handmade-circle border-3 border-slate-900 flex flex-col items-center justify-center text-center shadow-[4px_4px_0px_0px_rgba(21,30,40,1)] select-none transition-colors duration-500 ${
                        isBreathing
                          ? breathPhase === "Inhale"
                            ? "bg-[#FFF200]"
                            : breathPhase === "Hold (In)"
                            ? "bg-[#00AFB2] text-white"
                            : breathPhase === "Exhale"
                            ? "bg-[#005CB9] text-white"
                            : "bg-[#E62E6B] text-white"
                          : "bg-white"
                      }`}
                    >
                      {isBreathing ? (
                        <>
                          <span className="text-[10px] uppercase font-display font-extrabold tracking-wider leading-none">
                            {breathPhase}
                          </span>
                          <span className="text-xl font-display font-extrabold mt-1.5 leading-none">
                            {breathSeconds}s
                          </span>
                        </>
                      ) : (
                        <>
                          <Heart className="w-8 h-8 text-brand-coral pulse-heart" />
                          <span className="text-[9px] font-display font-bold mt-1 text-slate-600">IDLE PACER</span>
                        </>
                      )}
                    </motion.div>
                  </div>

                  {/* Breathing Control Trigger button */}
                  <div className="w-full z-10 flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsBreathing(!isBreathing)}
                      className={`w-full py-2.5 rounded-xl border-2 border-slate-900 font-display font-extrabold text-xs shadow-[2px_2px_0px_0px_rgba(21,30,40,1)] cursor-pointer text-center select-none ${
                        isBreathing 
                          ? "bg-[#E62E6B] hover:bg-red-600 text-white" 
                          : "bg-[#FFF200] hover:bg-yellow-400 text-slate-900"
                      }`}
                    >
                      {isBreathing ? "Pause Respiration Pacer" : "Activate Respiration Loop"}
                    </motion.button>
                  </div>
                </div>

              </div>

              {/* Row 2: Faith Structured Scripts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                
                {/* Christian Script */}
                <div className="bg-white p-6 border border-slate-200 rounded-2xl shadow-xs space-y-3">
                  <span className="bg-brand-blue/10 text-brand-blue font-bold tracking-wider text-[9px] px-2.5 py-0.5 rounded leading-none uppercase select-none">CHRISTIAN COPING HARMONY</span>
                  <p className="font-display font-bold text-slate-800 text-sm">Resiliency Prayer & CBT Scaffolding</p>
                  
                  <blockquote className="border-l-2 border-brand-blue pl-3 italic text-xs text-slate-550 leading-relaxed bg-[#f8fbfe] py-2.5 pr-2 rounded-r-xl">
                    "Do not fear, for I am with you; do not be dismayed, for I am your God. I will strengthen you and help you." — Isaiah 41:10
                  </blockquote>

                  <p className="text-[11px] text-slate-600 leading-relaxed pt-1.5">
                    <b>Psychological Integration:</b> This verse works to counteract cognitive "catastrophizing" by reinforcing structured attachment safety and external cognitive relief landmarks. Pair this with 3 rounds of circular breathing (Inhale 4s, Hold 4s, Exhale 4s).
                  </p>
                </div>

                {/* Islamic Script */}
                <div className="bg-white p-6 border border-slate-200 rounded-2xl shadow-xs space-y-3">
                  <span className="bg-brand-sage/10 text-brand-sage font-bold tracking-wider text-[9px] px-2.5 py-0.5 rounded leading-none uppercase select-none">ISLAMIC MINDFULNESS HARMONY</span>
                  <p className="font-display font-bold text-slate-850 text-sm">Dhikr Breathing Coordination</p>
                  
                  <blockquote className="border-l-2 border-brand-sage pl-3 italic text-xs text-slate-550 leading-relaxed bg-[#fbfdfb] py-2.5 pr-2 rounded-r-xl">
                    "Verily, in the remembrance of Allah do hearts find rest." — Surah Ar-Ra'd 13:28
                  </blockquote>

                  <p className="text-[11px] text-slate-600 leading-relaxed pt-1.5">
                    <b>Psychological Integration:</b> Engaging in repetitive meditative chants (Dhikr) paired with slow diaphragm patterns triggers high vagus nerve alignment, which decreases somatic fight-or-flight triggers by releasing restorative neuro-chemicals.
                  </p>
                </div>

                {/* Secular Worksheet */}
                <div className="bg-white p-6 border border-slate-200 rounded-2xl shadow-xs space-y-3">
                  <span className="bg-brand-coral/10 text-brand-coral font-bold tracking-wider text-[9px] px-2.5 py-0.5 rounded leading-none uppercase select-none">SECULAR STRESS DE-ESCALATION</span>
                  <p className="font-display font-bold text-slate-800 text-sm">The 5-4-3-2-1 Sensory Grounding Tool</p>
                  
                  <p className="text-[11px] text-slate-600 leading-relaxed space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-150">
                    • <b>5 things</b> you can physically see.
                    <br />• <b>4 things</b> you can somatic feel.
                    <br />• <b>3 things</b> you can auditory hear.
                    <br />• <b>2 things</b> you can nasal smell.
                    <br />• <b>1 thing</b> you can oral taste.
                  </p>
                  <p className="text-[10px] text-slate-400">Forces cognitive redirection, snapping neurons out of recursive panic cascades instantly.</p>
                </div>

                {/* Buddhist breathing */}
                <div className="bg-white p-6 border border-slate-200 rounded-2xl shadow-xs space-y-3">
                  <span className="bg-brand-taupe/10 text-brand-taupe font-bold tracking-wider text-[9px] px-2.5 py-0.5 rounded leading-none uppercase select-none">BUDDHIST MINDFUL COPING</span>
                  <p className="font-display font-bold text-slate-800 text-sm">Anapanasati Breath Awareness</p>
                  
                  <blockquote className="border-l-2 border-brand-taupe pl-3 italic text-xs text-slate-550 leading-relaxed bg-[#faf9f6] py-2.5 pr-2 rounded-r-xl">
                    "Breathing in, I calm body and mind. Breathing out, I smile. Dwelling in the present moment." — Zen Thich Nhat Hanh
                  </blockquote>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    <b>Insight:</b> Accepting emotional fluctuations like transient visual clouds on a high horizon reduces active cognitive avoidance, stripping stress patterns of recursive intensity.
                  </p>
                </div>

              </div>

              {/* Dynamic Seasonal Adviser Desk Feed */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-900 rounded-2xl p-6 shadow-[3px_3px_0px_0px_rgba(120,53,4,1)] space-y-4 pt-5 mt-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-amber-200 pb-3 gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="text-amber-600 w-5 h-5" />
                    <div>
                      <h3 className="font-display font-extrabold text-amber-950 text-sm leading-tight">Seasonal Support & Advisory Desk</h3>
                      <p className="text-amber-800 text-[10px] uppercase font-bold tracking-wider font-mono mt-0.5">Updated Live by TalkItThrough Admins</p>
                    </div>
                  </div>
                  <span className="text-[9px] bg-amber-600/15 text-amber-700 font-extrabold tracking-tight px-2.5 py-1 rounded-full border border-amber-300">
                    ACTIVE SENSORY ADVISORIES
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {seasonalResources && seasonalResources.length > 0 ? (
                    seasonalResources.map(res => (
                      <div key={res.id} className="bg-white p-4 rounded-xl border border-amber-150 flex flex-col justify-between space-y-3 shadow-xs">
                        <div>
                          <span className="bg-amber-100 text-amber-850 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider leading-none">
                            {res.category}
                          </span>
                          <p className="font-display font-extrabold text-slate-850 text-xs mt-2">{res.title}</p>
                          <p className="text-[10px] text-slate-550 mt-1 lines-2 leading-relaxed font-semibold">{res.description}</p>
                        </div>
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-amber-700">
                          <span className="font-mono text-slate-400">CONNECT ADVISER:</span>
                          {res.phoneOrLink.startsWith("http") ? (
                            <a href={res.phoneOrLink} target="_blank" rel="noopener noreferrer" className="hover:underline text-brand-blue flex items-center gap-0.5">
                              Open Resource Web Link
                            </a>
                          ) : (
                            <span className="font-sans font-bold text-amber-800 select-all">{res.phoneOrLink}</span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="md:col-span-2 text-center py-6 text-slate-400 italic font-semibold text-xs">
                      No active seasonal resources at this moment. TalkItThrough administrators are currently reviewing global resilience parameters for the upcoming quadrant.
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* ================= TAB 7: ADMINISTRATIVE CONTROL DESK ================= */}
          {(activeTab === "admin" && user.role === "admin") && (
            <div className="space-y-6 animate-fade-in text-slate-700">
              
              <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 p-5 rounded-2xl">
                <ShieldAlert className="w-8 h-8 text-amber-500 shrink-0" />
                <div>
                  <h1 className="font-display text-xl font-extrabold text-slate-850 leading-none">Administrative Regulation Deck</h1>
                  <p className="text-slate-600 text-xs mt-1 font-semibold">Authorized Staff Access Only. Take compliance actions, customize forum guardrails, and post seasonal resources live.</p>
                </div>
              </div>

              {/* Three components: Rules, Seasonal Resources form and list */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* 1. Community Rules editor */}
                <div className="lg:col-span-4 bg-white p-5 border border-slate-200 rounded-2xl shadow-xs space-y-4">
                  <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
                    <Sliders className="w-4 h-4 text-brand-coral" />
                    <span className="font-display font-bold text-[#1f2937] text-sm">Set Support Forum Rules</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium">Configure rules separated by newlines. Changes update the Code of Conduct immediately across the network.</p>
                  
                  <textarea
                    rows={8}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] font-mono font-semibold focus:outline-none focus:ring-1 focus:ring-brand-coral"
                    placeholder="Enter one rule per line..."
                    value={adminRulesText}
                    onChange={(e) => setAdminRulesText(e.target.value)}
                  />
                  
                  <button
                    onClick={handleAdminSaveRules}
                    className="w-full bg-brand-coral hover:bg-[#d66b49] text-white font-display font-bold text-xs py-2.5 rounded-xl transition shadow-xs text-center cursor-pointer"
                  >
                    Save Rules Publicly
                  </button>
                </div>

                {/* 2. Seasonal Resources posting desk */}
                <div className="lg:col-span-8 bg-white p-5 border border-slate-200 rounded-2xl shadow-xs space-y-4">
                  <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
                    <Sparkles className="text-amber-500 w-4 h-4" />
                    <span className="font-display font-bold text-[#1f2937] text-sm">Seasonal Resources & Advisories</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium">Post seasonal advisories for dry seasons, economic changes, or situational mental stress.</p>

                  <form onSubmit={handleAdminCreateSeasonal} className="grid grid-cols-1 md:grid-cols-2 gap-3.5 bg-slate-50 p-4 rounded-xl border border-slate-150">
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-[10px] uppercase font-bold text-slate-500 font-mono">Resource Title</label>
                      <input
                        required
                        type="text"
                        placeholder="e.g. Harmattan Somatic Fatigue Counseling Support"
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-coral"
                        value={adminNewSeasonal.title}
                        onChange={(e) => setAdminNewSeasonal(prev => ({ ...prev, title: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-500 font-mono">Advisory Category</label>
                      <select
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-coral"
                        value={adminNewSeasonal.category}
                        onChange={(e) => setAdminNewSeasonal(prev => ({ ...prev, category: e.target.value }))}
                      >
                        <option value="Seasonal Support Desk">Seasonal Support Desk</option>
                        <option value="Socio-Economic Well-being">Socio-Economic Well-being</option>
                        <option value="Somatic Health & Anxiety">Somatic Health & Anxiety</option>
                        <option value="Regional Support Circles">Regional Support Circles</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-500 font-mono">Phone Helpline / Web Link</label>
                      <input
                        required
                        type="text"
                        placeholder="e.g. 0800-RELIANCE or https://..."
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-coral"
                        value={adminNewSeasonal.phoneOrLink}
                        onChange={(e) => setAdminNewSeasonal(prev => ({ ...prev, phoneOrLink: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-1 md:col-span-2">
                      <label className="text-[10px] uppercase font-bold text-slate-500 font-mono">Detailed Guidance Description</label>
                      <textarea
                        required
                        rows={2}
                        placeholder="Specify mental exercises, protective masks, hydration, or faith check-ins during this window..."
                        className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-coral"
                        value={adminNewSeasonal.description}
                        onChange={(e) => setAdminNewSeasonal(prev => ({ ...prev, description: e.target.value }))}
                      />
                    </div>

                    <div className="md:col-span-2 pt-1">
                      <button
                        type="submit"
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-display font-bold py-2 rounded-lg text-xs cursor-pointer select-none"
                      >
                        Publish Seasonal Adviser
                      </button>
                    </div>
                  </form>

                  {/* List active seasonal resources with delete button */}
                  <div className="space-y-2.5">
                    <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Published directory listings ({seasonalResources?.length || 0})</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {seasonalResources && seasonalResources.map(res => (
                        <div key={res.id} className="bg-slate-50 p-3.5 border border-slate-150 rounded-xl space-y-2 relative group md:hover:border-slate-350 transition-all">
                          <button
                            onClick={() => handleAdminDeleteSeasonal(res.id)}
                            className="absolute right-2.5 top-2.5 text-slate-400 hover:text-red-500 transition opacity-0 group-hover:opacity-100"
                            title="Purge seasonal listing"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          
                          <div className="pr-5">
                            <span className="bg-[#f0fdf4] text-[#15803d] text-[8px] font-bold px-1.5 py-0.5 rounded leading-none mr-1">
                              {res.category}
                            </span>
                            <p className="font-display font-extrabold text-slate-850 text-xs mt-1.5">{res.title}</p>
                            <p className="text-[10px] text-slate-500 mt-1 line-clamp-2 leading-relaxed font-semibold">{res.description}</p>
                            <p className="text-[9px] font-mono font-bold text-slate-705 mt-1 bg-white border border-slate-150 px-2 py-0.5 rounded select-all break-all">{res.phoneOrLink}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>

              {/* 3. Forum Moderation Suite */}
              <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-xs space-y-4">
                
                <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-3 gap-3">
                  <div className="flex items-center gap-1.5">
                    <Users className="text-brand-coral w-4 h-4" />
                    <div>
                      <span className="font-display font-bold text-[#1f2937] text-sm">Board Moderation Hub & Abuse Reports</span>
                      <p className="text-[10.5px] text-slate-400 mt-0.5 font-medium">Real-time supervision of group messages across all support rooms.</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5 select-none shrink-0 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={reportedMessagesOnly}
                        onChange={(e) => setReportedMessagesOnly(e.target.checked)}
                        className="accent-brand-coral rounded focus:outline-none"
                      />
                      <span>Filter Reported Flags Only</span>
                    </label>
                    <button
                      onClick={loadAllMessagesForAdmin}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-lg text-[10.5px] transition"
                    >
                      Reload Logs
                    </button>
                  </div>
                </div>

                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  {adminAllMessages
                    .filter(m => (reportedMessagesOnly ? m.isReported : true))
                    .map(msg => (
                      <div key={msg.id} className={`p-4 border rounded-xl space-y-2.5 transition relative ${msg.isReported ? "bg-red-50/70 border-red-200" : "bg-slate-50/70 border-slate-150"}`}>
                        <div className="flex justify-between items-center pb-1.5 border-b border-slate-200/50">
                          <div>
                            <span className="bg-[#1e293b] text-white font-mono text-[8px] font-bold px-1.5 py-0.5 rounded leading-none mr-1.5">
                              {msg.room}
                            </span>
                            <span className="font-bold text-slate-700 text-[10.5px] font-display">{msg.userName}</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {msg.isReported && (
                              <span className="bg-red-100 text-red-805 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider animate-pulse border border-red-200">
                                REPORTED
                              </span>
                            )}
                            <span className="text-[9px] text-slate-400 font-mono">{new Date(msg.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                          </div>
                        </div>

                        <p className="text-slate-850 font-semibold text-xs leading-relaxed">{msg.content}</p>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-200/40">
                          <span className="text-[10px] text-slate-400 font-bold">
                            {msg.replies?.length || 0} Replies • {msg.likesUserIds?.length || 0} Likes
                          </span>

                          <div className="flex items-center gap-1.5">
                            {msg.isReported && (
                              <button
                                onClick={() => handleAdminDismissReport(msg.id)}
                                className="bg-white hover:bg-slate-100 border border-slate-250 text-slate-800 font-bold px-2.5 py-1 rounded text-[10.5px] transition cursor-pointer"
                              >
                                Clear Flag
                              </button>
                            )}

                            <button
                              onClick={() => handleAdminDeletePost(msg.id)}
                              className="bg-red-600 hover:bg-red-700 text-white font-bold px-2.5 py-1 rounded text-[10.5px] transition shadow-xs cursor-pointer"
                            >
                              Purge Message
                            </button>
                          </div>
                        </div>

                        {/* Granular reply moderation */}
                        {msg.replies && msg.replies.length > 0 && (
                          <div className="bg-white p-2.5 border border-slate-150 rounded-lg space-y-2 mt-2">
                            <p className="text-[9px] uppercase font-bold text-slate-400 font-mono">Replies Logged ({msg.replies.length})</p>
                            <div className="space-y-1.5 max-h-[120px] overflow-y-auto">
                              {msg.replies.map(rep => (
                                <div key={rep.id} className="flex justify-between items-start bg-slate-50 p-2 rounded border border-slate-100 text-[10px] font-semibold">
                                  <div className="grow pr-2">
                                    <div className="flex items-center gap-1.5 text-slate-400 text-[9px]">
                                      <span className="font-bold text-slate-700">{rep.userName}</span>
                                      <span>{new Date(rep.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <p className="text-slate-650 mt-0.5">{rep.content}</p>
                                  </div>
                                  <button
                                    onClick={() => handleDeleteReply(msg.id, rep.id)}
                                    className="text-red-500 hover:text-red-700 font-bold ml-2 shrink-0"
                                    title="Delete this reply"
                                  >
                                    Delete
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  }
                  {adminAllMessages.filter(m => (reportedMessagesOnly ? m.isReported : true)).length === 0 && (
                    <p className="text-center py-6 text-slate-400 italic font-semibold text-xs">No support messages found matching filters.</p>
                  )}
                </div>

              </div>

            </div>
          )}

          {/* ================= TAB 6: GDPR ACCOUNT SETTINGS ================= */}
          {activeTab === "settings" && (
            <div className="max-w-xl mx-auto bg-white p-6 border border-slate-200 rounded-2xl shadow-xs space-y-6 animate-fade-in text-slate-705 text-xs font-semibold">
              <div className="border-b border-slate-100 pb-3">
                <h1 className="font-display text-xl font-extrabold text-slate-800 leading-none">Your Private Profile Controls</h1>
                <p className="text-slate-400 font-medium text-[11px] mt-1.5">Manage contacts and trigger secure GDPR/NDPR erasure actions.</p>
              </div>

              {settingsSuccess && (
                <div className="bg-emerald-50 text-emerald-800 p-3 rounded-xl border border-emerald-100 text-[11px] text-center">
                  Profile adjustments updated successfully.
                </div>
              )}

              <form 
                onSubmit={(e) => { 
                  e.preventDefault(); 
                  const updatedUser = { 
                    ...user, 
                    preferredLanguage: settingsForm.preferredLanguage,
                    faithPreference: settingsForm.faithPreference,
                    gender: settingsForm.gender,
                    phone: settingsForm.phone
                  };
                  onUserUpdate(updatedUser);
                  setSettingsSuccess(true); 
                  setTimeout(() => setSettingsSuccess(false), 3000); 
                }} 
                className="space-y-4"
              >
                
                <div className="space-y-1.5 focus-within:text-brand-coral">
                  <label className="text-slate-650">Select Preferred Language Dialect</label>
                  <select 
                    value={settingsForm.preferredLanguage} 
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, preferredLanguage: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 font-bold focus:outline-none focus:ring-1 focus:ring-brand-coral"
                  >
                    <option value="English">English</option>
                    <option value="Yoruba">Yoruba (Yorùbá)</option>
                    <option value="English-Pidgin">English-Pidgin (Naija)</option>
                  </select>
                </div>

                <div className="space-y-1.5 focus-within:text-brand-coral">
                  <label className="text-slate-650">Religious / Secular Frameworks Profile</label>
                  <select 
                    value={settingsForm.faithPreference} 
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, faithPreference: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 font-bold focus:outline-none focus:ring-1 focus:ring-brand-coral"
                  >
                    <option value="None">Secular / Objective Focus Only</option>
                    <option value="Christian">Christian Coping Meditations</option>
                    <option value="Muslim">Islamic Coping Dhikr</option>
                    <option value="Other">Other / Multifaith Compass</option>
                  </select>
                </div>

                <div className="space-y-1.5 focus-within:text-brand-coral">
                  <label className="text-slate-650">Gender Identity</label>
                  <select 
                    value={settingsForm.gender} 
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, gender: e.target.value as any }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 font-bold focus:outline-none focus:ring-1 focus:ring-brand-coral"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Rather not say">Rather not say</option>
                  </select>
                </div>

                <div className="space-y-1.5 focus-within:text-brand-coral">
                  <label className="text-slate-650">Secure Telephone contact (Optional)</label>
                  <input
                    type="tel"
                    placeholder="+234 803 123 4567"
                    value={settingsForm.phone}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 font-medium focus:outline-none focus:ring-1 focus:ring-brand-coral placeholder-slate-400 text-slate-700"
                  />
                </div>

                <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-display font-semibold py-2.5 rounded-xl shadow transition">
                  Update Profile Safe
                </button>
              </form>

              {/* GDPR COMPLIANCE ACTIONS PANEL */}
              <div className="border-t border-slate-100 pt-6 space-y-4">
                <p className="font-display font-bold text-slate-800 text-sm leading-none flex items-center gap-1">
                  🛡️ GDPR Article 15 Data Subject Rights
                </p>
                <p className="text-slate-400 text-[10px] leading-relaxed">
                  Under global General Data Protection Regulation and Nigerian NDPR clauses, you possess direct ownership of your mental metrics and accounts history. Trace action buttons:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <button
                    onClick={handleExportDataGDPR}
                    className="bg-brand-cream border border-brand-sage/40 hover:bg-[#edf2ee] text-slate-800 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
                    title="Triggers Article 20 Portability Download"
                  >
                    <Download className="w-4 h-4 text-brand-sage" /> Export My Data (JSON)
                  </button>

                  <button
                    onClick={handleAccountErasure}
                    className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
                    title="Triggers Article 17 Purge Scrubbing"
                  >
                    <Trash2 className="w-4 h-4" /> GDPR Erasure Request
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>
      </main>

      {/* RESTRICTED ACCESS MODAL */}
      <AnimatePresence>
        {restrictAlertOpen && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border-2 border-slate-900 rounded-3xl p-6 max-w-sm w-full shadow-[6px_6px_0px_0px_rgba(21,30,40,1)] text-center relative"
            >
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-20 h-20 bg-[#FFF200] border-2 border-slate-900 rounded-full flex items-center justify-center shadow-md">
                <AlertCircle className="w-10 h-10 text-slate-900 animate-bounce" />
              </div>

              <div className="mt-10 space-y-4">
                <h3 className="font-display font-black text-xl text-slate-00 tracking-tight">Access Locked</h3>
                <p className="text-slate-600 text-xs leading-relaxed font-semibold">
                  This action is reserved for registered users only.
                </p>
                <div className="text-slate-400 text-[10px] leading-relaxed space-y-1">
                  <p>Guests / Sneak-peek accounts can fully experience the AI therapy chat and mood logging tools.</p>
                  <p>Register a full profile to access boards, faith alignment, and GDPR settings.</p>
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <button
                    onClick={() => setRestrictAlertOpen(false)}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-mono text-xs font-bold py-2.5 rounded-xl border-2 border-transparent transition shadow cursor-pointer"
                  >
                    Got it, thanks!
                  </button>
                  <button
                    onClick={() => {
                      setRestrictAlertOpen(false);
                      onLogout(true);
                    }}
                    className="w-full bg-brand-coral hover:bg-red-800 text-white font-mono text-xs font-bold py-2.5 rounded-xl shadow border-2 border-slate-900 transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    Register Full Profile
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
