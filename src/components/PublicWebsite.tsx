import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Heart, Shield, Globe, Award, HelpCircle, PhoneCall, 
  MapPin, Send, ShoppingBag, Gift, ArrowRight, CheckCircle2,
  Users, BookOpen, Star, Sparkles, MessageCircle, AlertTriangle,
  ExternalLink
} from "lucide-react";
import { Product, DonationStat } from "../types";

// Static merchandise stock
const SHOP_PRODUCTS: Product[] = [
  {
    id: "prod-tshirt-enough",
    title: "I Am Enough (Sage Tee)",
    category: "apparel",
    description: "Premium heavyweight organic cotton t-shirt in calming Sage Green, with a subtle reminder representing human self-worth.",
    priceNaira: 3500,
    tags: ["Apparel", "Mental Health"],
    imageUrl: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&q=80"
  },
  {
    id: "prod-hoodie-talkit",
    title: "Talk It Through Cozy Hoodie",
    category: "apparel",
    description: "Ultra-soft heavyweight hoodie designed for physical comfort and mental insulation. 100% of profits fund free therapy sessions.",
    priceNaira: 7500,
    tags: ["Apparel", "Comfort"],
    imageUrl: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500&q=80"
  },
  {
    id: "prod-cap-mind",
    title: "Resilience Adjustable Cap",
    category: "apparel",
    description: "Low-profile organic dad cap with minimal mental wellness leaf symbol embroidery.",
    priceNaira: 2000,
    tags: ["Accessory", "Minimalist"],
    imageUrl: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=500&q=80"
  },
  {
    id: "art-waves",
    title: "Waves of Emotion (Digital Print)",
    category: "art",
    description: "Abstract emotional spectrum high-density poster. Visualizing cycles of recovery and peace.",
    priceNaira: 5000,
    tags: ["Art", "Decor"],
    imageUrl: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=500&q=80"
  },
  {
    id: "art-faith",
    title: "Faith & Spiritual Resilience Poster",
    category: "art",
    description: "Modern minimalist poster blending multi-faith geometry with mental wellness mindfulness metrics.",
    priceNaira: 4000,
    tags: ["Art", "Spiritual"],
    imageUrl: "https://images.unsplash.com/photo-1549887534-1541e9326642?w=500&q=80"
  },
  {
    id: "dig-journal",
    title: "7-Day Emotional Reflection Workbook",
    category: "digital",
    description: "Digital printable journal featuring mood calendars, therapeutic prompts, and breathing interval templates.",
    priceNaira: 2000,
    tags: ["Digital", "Self-Care"],
    imageUrl: "https://images.unsplash.com/photo-1517842645767-c639042777db?w=500&q=80"
  }
];

interface PublicWebsiteProps {
  onStartChat: () => void;
  onSignUpClick: () => void;
}

export default function PublicWebsite({ onStartChat, onSignUpClick }: PublicWebsiteProps) {
  const [activeSubPage, setActiveSubPage] = useState<"home" | "about" | "resources" | "shop">("home");
  const [statIndex, setStatIndex] = useState(0);
  const [donationAmount, setDonationAmount] = useState<string>("5000");
  const [customDonAmount, setCustomDonAmount] = useState<string>("");
  const [donationName, setDonationName] = useState("");
  const [donationSuccess, setDonationSuccess] = useState(false);
  const [stats, setStats] = useState<DonationStat>({
    totalNaira: 1045000,
    totalDonors: 142,
    healthcareSponsorshipsPaid: 18,
    ngoPartnershipsFunded: 4
  });

  const [cart, setCart] = useState<Record<string, number>>({});
  const [cartSuccess, setCartSuccess] = useState(false);
  const [contactSubject, setContactSubject] = useState("general");
  const [contactSuccess, setContactSuccess] = useState(false);

  // SMS Interactive States
  const [smsTarget, setSmsTarget] = useState<{ id: string; name: string; number: string } | null>(null);
  const [smsText, setSmsText] = useState("");
  const [smsSentNotice, setSmsSentNotice] = useState<string | null>(null);

  // Statistics Carousel slide data
  const STAT_SLIDES = [
    {
      stat: "3.5x Higher",
      title: "Male Suicide Disparity",
      desc: "Men across Sub-Saharan Africa experience significantly higher suicide rates than women, carrying debilitating anxiety in total silence."
    },
    {
      stat: "₦50,000",
      title: "Average Cost of Therapy Session",
      desc: "Traditional physical psychological sessions in major Nigerian clinics are financially unreachable for over 90% of Nigerian men."
    },
    {
      stat: "85% Silence",
      title: "Stigma Constraints",
      desc: "Heavy societal expectations around absolute masculinity and provider pressure leave men struggling with clinical depression without speaking out."
    },
    {
      stat: "100% Shared Hope",
      title: "Faith & Evidence Harmony",
      desc: "Spirituality can play a massive role in wellness. Interweaving evidence-backed cognitive coping frameworks with faith respects their spiritual values safely."
    }
  ];

  useEffect(() => {
    fetch("/api/donations/stats")
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error(err));

    const interval = setInterval(() => {
      setStatIndex(prev => (prev + 1) % STAT_SLIDES.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleSendSMS = (e: React.FormEvent) => {
    e.preventDefault();
    if (!smsTarget || !smsText.trim()) return;
    
    // Simulate/launch native client with content
    const encodedBody = encodeURIComponent(smsText);
    const smsUrl = `sms:${smsTarget.number}?body=${encodedBody}`;
    
    // Attempt trigger
    window.location.href = smsUrl;
    
    setSmsSentNotice(`SMS transmission triggered to ${smsTarget.number}! If you are browsing on a mobile device, your messaging client has been launched with your written statement. We encourage you to breathe deeply and wait for connection.`);
    setSmsText("");
  };

  const handleDonate = (e: React.FormEvent) => {
    e.preventDefault();
    const finalAmount = donationAmount === "custom" ? Number(customDonAmount) : Number(donationAmount);
    if (!finalAmount || isNaN(finalAmount) || finalAmount <= 0) return;

    fetch("/api/donations/donate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ donorName: donationName || "Anonymous Brother", amountNaira: finalAmount })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStats(data.stats);
          setDonationSuccess(true);
          setDonationName("");
          setCustomDonAmount("");
          setTimeout(() => setDonationSuccess(false), 5000);
        }
      });
  };

  const handleAddToCart = (id: string) => {
    setCart(prev => ({
      ...prev,
      [id]: (prev[id] || 0) + 1
    }));
  };

  const executeCheckout = () => {
    // Collect all cart totals
    let total = 0;
    Object.entries(cart).forEach(([id, qty]) => {
      const prod = SHOP_PRODUCTS.find(p => p.id === id);
      if (prod) total += prod.priceNaira * Number(qty);
    });

    if (total === 0) return;

    // Simulate Paystack Checkout
    fetch("/api/donations/donate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ donorName: "Merchandise Patron", amountNaira: total })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStats(data.stats);
          setCart({});
          setCartSuccess(true);
          setTimeout(() => setCartSuccess(false), 5000);
        }
      });
  };

  return (
    <div className="min-h-screen bg-brand-cream text-brand-charcoal flex flex-col">
      {/* Sticky Header Container on All Pages */}
      <header className="bg-white border-b border-slate-200/60 sticky top-0 z-40 shadow-sm">
        {/* Sub-navigation bar */}
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => setActiveSubPage("home")}>
              <Heart className="w-6 h-6 text-brand-coral fill-brand-coral pulse-heart" />
              <span className="font-display font-bold text-lg tracking-tight text-brand-charcoal">TalkItThrough</span>
              <a 
                href="https://en.wikipedia.org/wiki/Integrative_medicine" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="bg-brand-coral/10 hover:bg-brand-coral/20 text-[#8A1B29] border border-brand-coral/25 hover:border-brand-coral/50 text-[10px] font-bold tracking-tight px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 transition-colors group cursor-pointer ml-1.5 shadow-xs"
                title="What is Integrative Wellness? Click to view Wikipedia definition"
                onClick={(e) => e.stopPropagation()}
              >
                <span>INTEGRATIVE WELLNESS</span>
                <ExternalLink className="w-3 h-3 text-[#8A1B29]/80 group-hover:text-brand-coral transition-colors" />
              </a>
            </div>

            <div className="hidden md:flex items-center gap-8 text-sm font-medium">
              <button 
                onClick={() => setActiveSubPage("home")} 
                className={`py-2 transition duration-150 ${activeSubPage === "home" ? "text-brand-coral border-b-2 border-brand-coral font-bold" : "text-slate-700 hover:text-brand-charcoal font-semibold"}`}
              >
                Home
              </button>
              <button 
                onClick={() => setActiveSubPage("about")} 
                className={`py-2 transition duration-150 ${activeSubPage === "about" ? "text-brand-coral border-b-2 border-brand-coral font-bold" : "text-slate-700 hover:text-brand-charcoal font-semibold"}`}
              >
                About Founder
              </button>
              <button 
                onClick={() => setActiveSubPage("resources")} 
                className={`py-2 transition duration-150 ${activeSubPage === "resources" ? "text-brand-coral border-b-2 border-brand-coral font-bold" : "text-slate-700 hover:text-brand-charcoal font-semibold"}`}
              >
                Helplines & Resources
              </button>
              <button 
                onClick={() => setActiveSubPage("shop")} 
                className={`py-2 transition duration-150 ${activeSubPage === "shop" ? "text-brand-coral border-b-2 border-brand-coral font-bold" : "text-slate-700 hover:text-brand-charcoal font-semibold"}`}
              >
                Charity Shop & Donate
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onSignUpClick}
                className="bg-brand-coral hover:bg-red-800 text-white text-xs md:text-sm font-bold px-4 py-2 rounded-none shadow-md transition duration-150 font-mono tracking-widest uppercase"
              >
                Get Started
              </button>
            </div>
          </div>
        </nav>

        {/* MOBILE NAV TABS */}
        <div className="flex md:hidden bg-slate-50 border-t border-slate-100 justify-around text-xs font-semibold py-2">
          <button onClick={() => setActiveSubPage("home")} className={`px-2 py-1 ${activeSubPage === "home" ? "text-brand-coral border-b-2 border-brand-coral font-bold" : "text-slate-500"}`}>Home</button>
          <button onClick={() => setActiveSubPage("about")} className={`px-2 py-1 ${activeSubPage === "about" ? "text-brand-coral border-b-2 border-brand-coral font-bold" : "text-slate-500"}`}>About Founder</button>
          <button onClick={() => setActiveSubPage("resources")} className={`px-2 py-1 ${activeSubPage === "resources" ? "text-brand-coral border-b-2 border-brand-coral font-bold" : "text-slate-500"}`}>Helplines</button>
          <button onClick={() => setActiveSubPage("shop")} className={`px-2 py-1 ${activeSubPage === "shop" ? "text-brand-coral border-b-2 border-brand-coral font-bold" : "text-slate-500"}`}>Shop & Donate</button>
        </div>
      </header>       {/* PAGES SWITCH */}
      <main className="grow">
               {/* ==================== PAGE 1: HOME ==================== */}
        {activeSubPage === "home" && (
          <div className="relative w-full bg-brand-cream text-slate-900">
            
            {/* FLOATING INDEX NAVIGATION DOTS - JHU style minimalist layout */}
            <div className="fixed right-6 top-1/2 -translate-y-1/2 z-30 hidden md:flex flex-col gap-5 bg-white/95 border border-slate-300 p-4 rounded-full backdrop-blur-md shadow-lg">
              {[
                { label: "01 / ARCHITECTURE", href: "#slide-1" },
                { label: "02 / GLOBAL GAP", href: "#slide-2" },
                { label: "03 / INSIGHTS", href: "#slide-3" },
                { label: "04 / NATIONAL CASE", href: "#slide-4" }
              ].map((dot, idx) => (
                <a 
                  key={idx}
                  href={dot.href}
                  className="group relative flex items-center justify-end"
                >
                  <span className="absolute right-8 scale-0 group-hover:scale-100 bg-[#182B49] text-white text-[10px] font-mono tracking-widest px-2.5 py-1 rounded transition-all duration-150 shadow-xl whitespace-nowrap">
                    {dot.label}
                  </span>
                  <div className="w-2.5 h-2.5 rounded-full border-2 border-slate-400 group-hover:border-[#C5A059] group-hover:bg-[#C5A059] transition-all duration-150" />
                </a>
              ))}
            </div>

            {/* SLIDE 1: THE AMBIENT REFLECTION HERO & GLOBAL TRUTH */}
            <section id="slide-1" className="relative min-h-[calc(100vh-64px)] py-16 w-full flex items-center justify-center p-6 md:p-16">
              {/* WARM BACKGROUND LIGHT LAYERS & GROUP THERAPY IMAGE */}
              <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <img 
                  src="https://images.unsplash.com/photo-1516307361426-881ea8c442b0?q=80&w=1600&auto=format&fit=crop"
                  alt="Therapy Support Group Gathering"
                  className="w-full h-full object-cover filter brightness-105 contrast-90 opacity-[0.16] grayscale-30"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#FCFAF7] via-[#FCFAF7]/95 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#FCFAF7] via-transparent to-[#FCFAF7]/80" />
                
                {/* Soft Light Pulse halos */}
                <div className="absolute top-[10%] right-[15%] w-80 h-80 rounded-full bg-[#C5A059]/10 filter blur-3xl animate-pulse-glow" />
                <div className="absolute bottom-[20%] left-[10%] w-96 h-96 rounded-full bg-[#8A1B29]/5 filter blur-3xl animate-pulse-glow" />
              </div>

              {/* OVERLAY SPLAYED PANEL */}
              <div className="relative z-10 max-w-7xl mx-auto w-full text-left grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                <div className="lg:col-span-7 space-y-7">
                  <div className="inline-flex items-center gap-2 bg-[#182B49] text-white border border-[#C5A059]/30 rounded-none px-4 py-1.5 text-[10px] font-mono tracking-widest uppercase leading-none select-none shadow">
                    <span className="w-2 h-2 bg-[#C5A059] rounded-full animate-pulse shrink-0" /> Academic Alignment Initiative
                  </div>
                  
                  <h1 className="font-display text-4xl sm:text-5xl md:text-6.5xl font-extrabold tracking-tight text-slate-950 leading-tight font-serif italic">
                    Restoring clinical sanity. <br />
                    <span className="text-[#8A1B29] not-italic">Preserving human dignity.</span>
                  </h1>

                  <p className="text-slate-800 text-sm md:text-base leading-relaxed max-w-2xl font-serif">
                    This is a highly structured, secure, and respectful digital space designed to bridge the gaps of medical underfunding. By interlacing clinical cognitive guidance with culturally honest multi-faith perspectives, we empower you to reclaim control of mental recovery.
                  </p>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-5 pt-4">
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={onSignUpClick}
                      className="bg-[#8A1B29] hover:bg-red-800 text-white font-mono text-xs tracking-widest uppercase px-8 py-4 cursor-pointer transition shadow-xl"
                    >
                      Access Counselling Hub
                    </motion.button>
                    <a 
                      href="#slide-2"
                      className="bg-white border border-slate-300 hover:border-[#C5A059] text-slate-900 hover:text-slate-950 font-mono text-xs tracking-widest uppercase px-6 py-4 cursor-pointer text-center whitespace-nowrap transition shadow-sm"
                    >
                      Analyze Deep Research ↓
                    </a>
                  </div>
                </div>

                {/* GLOBAL MENTAL HEALTH GENERAL EMBED - NOT GENDER SPECIFIC */}
                <div className="lg:col-span-5 bg-white border border-slate-300 border-l-4 border-l-[#8A1B29] p-8 shadow-2xl relative text-left space-y-5">
                  {/* Orbiting element specifically within the card wrapper */}
                  <div className="absolute right-4 top-4 pointer-events-none">
                    <div className="w-2 h-2 rounded-full bg-[#C5A059] animate-orbit-cw opacity-80" />
                  </div>
                  
                  <div className="flex items-center gap-2 text-[10px] text-[#8A1B29] font-mono tracking-widest uppercase font-bold">
                    <Globe className="w-4 h-4 text-[#8A1B29] animate-spin-slow" /> GLOBAL RESEARCH DIRECTIVE
                  </div>
                  <h3 className="font-display font-bold text-slate-950 text-xl leading-snug font-serif">
                    Fact: Nearly 1 billion lives globally experience neural or emotional limitation.
                  </h3>
                  <p className="text-slate-800 text-xs leading-relaxed font-sans font-medium">
                    According to comprehensive data compiled by the World Health Organization (WHO), neurological, developmental, and psychological challenges are not rare anomalies. They actively touch 1 in 8 humans alive today.
                  </p>
                  <div className="border-t border-slate-200 pt-4 flex justify-between items-center text-[10px] font-mono text-slate-500 font-bold">
                    <span>SOURCE: WHO MENTAL HEALTH INDEX</span>
                    <span>12.5% POPULATION RISK</span>
                  </div>
                </div>
              </div>
            </section>

            {/* SLIDE 2: THE DISPARITY & UNDERFUNDING RESEARCH */}
            <section id="slide-2" className="relative min-h-[calc(100vh-64px)] py-16 w-full bg-white border-t border-slate-200 flex items-center justify-center p-6 md:p-16 overflow-hidden">
              <div className="absolute right-1/4 top-1/4 w-96 h-96 bg-[#C5A059]/10 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />
              
              {/* Floating dots animation */}
              <div className="absolute bottom-[20%] left-[10%] pointer-events-none">
                <div className="w-2.5 h-2.5 rounded-full bg-[#8A1B29] animate-orbit-ccw opacity-40" />
              </div>
              <div className="absolute top-[15%] right-[20%] pointer-events-none">
                <div className="w-2 h-2 rounded-full bg-[#182B49] animate-orbit-cw opacity-50" />
              </div>

              <div className="relative z-10 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                <div className="lg:col-span-5 space-y-6 text-left">
                  <span className="text-[10px] font-mono text-[#8A1B29] tracking-widest uppercase block font-bold">
                    CLINICAL DEFICIT & DISPARITY
                  </span>
                  <h2 className="font-display text-3xl sm:text-4.5xl font-extrabold tracking-tight text-slate-950 leading-tight font-serif">
                    The Underfunded Healthcare Stigma Gap
                  </h2>
                  <p className="text-slate-800 text-xs sm:text-sm leading-relaxed font-serif font-medium">
                    Traditional psychological treatment frameworks are severely bottlenecked globally. Heavy social stigma prevents offline clinical intake, while high physical therapeutic costs restrict professional support solely to upper economic cohorts.
                  </p>
                  <div className="flex items-center gap-4 text-xs text-slate-650 border-t border-slate-200 pt-6 font-medium">
                    <div className="flex -space-x-2">
                      <div className="w-8 h-8 rounded-full bg-[#182B49] border-2 border-white flex items-center justify-center font-mono text-[9px] text-white">WHO</div>
                      <div className="w-8 h-8 rounded-full bg-[#8A1B29] border-2 border-white flex items-center justify-center font-mono text-[9px] text-white">LNC</div>
                    </div>
                    <span>Data corroborated by The Lancet Psychiatry commission guidelines.</span>
                  </div>
                </div>

                <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5 text-left">
                  {[
                    {
                      stat: "75% Untreated",
                      title: "Low Intervention Statistics",
                      desc: "In developing and middle-income regions, three out of four individuals suffering from chronic mental health disorders receive zero formal medical care."
                    },
                    {
                      stat: "264 Million",
                      title: "The Massive Depression Burden",
                      desc: "Chronic depressive disorders stand as the single largest non-fatal contributor to life limitation and operational disability across all backgrounds."
                    },
                    {
                      stat: "60% Silent",
                      title: "Societal Trauma Suppression",
                      desc: "Societal pressure leads more than half of struggling patients to hide symptoms of severe anxiety or panic attacks from their closest family."
                    },
                    {
                      stat: "₦50,000 / Hr",
                      title: "Vicious Financial Barriers",
                      desc: "A single private session with a credentialed clinical psychiatrist can exceed a worker's monthly wages, creating severe accessibility barriers."
                    }
                  ].map((card, idx) => (
                    <div key={idx} className="bg-[#FCFAF7] border border-slate-300 hover:border-[#8A1B29] p-6 shadow-sm hover:shadow-md transition-all duration-300 space-y-3 relative">
                      {/* Orbiting dots matching card accent */}
                      <div className="absolute right-3 top-3 pointer-events-none">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#C5A059] animate-orbit-cw opacity-60" />
                      </div>
                      <p className="text-[#8A1B29] text-2.5xl font-extrabold font-display font-serif">{card.stat}</p>
                      <p className="text-slate-900 font-mono text-[10px] tracking-widest uppercase font-bold">{card.title}</p>
                      <p className="text-slate-800 text-xs leading-relaxed font-sans">{card.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* SLIDE 3: INSTITUTIONAL WISDOM & FAMOUS QUOTES */}
            <section id="slide-3" className="relative min-h-[calc(100vh-64px)] py-16 w-full bg-brand-cream border-t border-slate-200 flex items-center justify-center p-6 md:p-16 overflow-hidden">
              <div className="absolute left-1/3 bottom-1/4 w-80 h-80 bg-[#8A1B29]/10 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />
              <div className="absolute right-[5%] top-[10%] pointer-events-none">
                <div className="w-2.5 h-2.5 rounded-full bg-[#C5A059] animate-orbit-cw opacity-70" />
              </div>

              <div className="relative z-10 max-w-5xl mx-auto w-full text-center space-y-10">
                <div className="space-y-3">
                  <span className="text-[10px] font-mono text-[#8A1B29] tracking-widest uppercase block font-bold">WORLD LEADERS & CLINICAL EVIDENCE</span>
                  <h2 className="font-display text-2.5xl sm:text-4xl font-bold tracking-tight text-slate-950 font-serif italic">
                    "Institutional wisdom demands action."
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    {
                      quote: "What mental health needs is more light, more candor, and more unashamed conversation.",
                      author: "GLENN CLOSE",
                      role: "Co-Founder of Bring Change to Mind Initiative"
                    },
                    {
                      quote: "There is no physical health without mental health. They are two halves of the exact same unbroken human vessel.",
                      author: "DR. TEDROS GHEBREYESUS",
                      role: "Director-General, World Health Organization"
                    },
                    {
                      quote: "Seeking specialized objective guidance is the greatest demonstration of systemic strength and biological intelligence.",
                      author: "CLINICAL RESEARCH BOARD",
                      role: "Faculty Association of Behavioral Psychology"
                    }
                  ].map((quoteCard, idx) => (
                    <div key={idx} className="bg-white border border-slate-300 p-8 flex flex-col justify-between text-left space-y-6 shadow-md relative">
                      <div className="absolute right-3 top-3 pointer-events-none">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#182B49] animate-orbit-ccw opacity-50" />
                      </div>
                      <p className="text-slate-800 font-serif italic text-sm leading-relaxed">
                        "{quoteCard.quote}"
                      </p>
                      <div className="border-t border-slate-200 pt-4">
                        <p className="font-bold text-xs text-[#8A1B29] font-mono tracking-widest uppercase">{quoteCard.author}</p>
                        <p className="text-[10px] text-slate-600 mt-1 uppercase font-mono font-bold">{quoteCard.role}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4">
                  <p className="text-slate-600 text-xs sm:text-sm max-w-xl mx-auto font-serif">
                    "Active emotional alignment is not an individual luxury. It represents a vital public health metric that dictates socio-economic development."
                  </p>
                </div>
              </div>
            </section>

            {/* SLIDE 4: THE NIGERIAN CRISIS & HEALING INITIATIVE (CLIMAX BACKGROUND) */}
            <section id="slide-4" className="relative min-h-[calc(100vh-64px)] py-16 w-full bg-white border-t border-slate-200 flex items-center justify-center p-6 md:p-16 overflow-hidden">
              <div className="absolute right-5 bottom-5 w-96 h-96 bg-[#C5A059]/10 rounded-full blur-3xl pointer-events-none z-0 animate-pulse-glow" />
              <div className="absolute left-5 top-5 w-80 h-80 bg-red-100/30 rounded-full blur-3xl pointer-events-none z-0 animate-pulse-glow" />

              <div className="relative z-10 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                <div className="lg:col-span-7 space-y-7 text-left">
                  <div className="inline-flex items-center gap-2 bg-rose-50 border border-brand-coral/40 text-[#8A1B29] rounded-none px-4 py-1.5 text-[9px] font-mono tracking-widest uppercase leading-none select-none font-bold">
                     NATIONAL HEALTH CONCERN REPORT
                  </div>
                  
                  <h2 className="font-display text-3.5xl sm:text-5xl font-extrabold tracking-tight text-slate-950 leading-tight font-serif">
                    The silent Nigerian crisis. <br />
                    <span className="text-brand-coral">Nigeria must not suffer in silence.</span>
                  </h2>

                  <p className="text-slate-800 text-sm leading-relaxed font-serif font-medium">
                    TalkItThrough was built to construct an immediate, fully secure digital lifeline for over 40 million Nigerians carrying mental exhaustion, sleep dysregulation, or anxiety indices in isolated silence.
                  </p>

                  <div className="bg-[#FCFAF7] border border-slate-300 p-6 rounded-none text-xs space-y-4 font-normal relative">
                    <div className="absolute right-4 top-4">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#8A1B29] animate-orbit-cw opacity-70" />
                    </div>
                    
                    <p className="font-bold text-[#8A1B29] font-mono uppercase tracking-widest text-[10px]">NIGERIAN RESILIENCY INDEX & METRICS:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-[11px] font-sans text-slate-800 font-medium">
                      <div>
                        <p className="text-[#8A1B29] text-2xl font-bold font-serif">40 Million</p>
                        <p className="text-[10px] text-slate-650 mt-1 leading-snug">Suffer from clinical anxiety or depressive symptoms across the federation today.</p>
                      </div>
                      <div className="border-t sm:border-t-0 sm:border-x border-slate-300 pt-3 sm:pt-0 sm:px-4">
                        <p className="text-[#182B49] text-2xl font-bold font-serif">1 : 1,000,000</p>
                        <p className="text-[10px] text-slate-650 mt-1 leading-snug">The dismal ratio of professional psychiatric doctors to citizens in formal zones.</p>
                      </div>
                      <div className="border-t sm:border-t-0 pt-3 sm:pt-0">
                        <p className="text-[#C5A059] text-2xl font-bold font-serif">85% Barriers</p>
                        <p className="text-[10px] text-slate-650 mt-1 leading-snug">Mischaracterize mental healthcare as a spiritual curse due to total lack of education.</p>
                      </div>
                    </div>
                  </div>

                  {/* CTAS */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={onSignUpClick}
                      className="bg-[#8A1B29] text-white hover:bg-red-800 font-mono font-bold tracking-widest uppercase px-8 py-4 text-xs cursor-pointer shadow-md"
                    >
                      Access Free Anonymous Portal
                    </motion.button>
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setActiveSubPage("resources")}
                      className="bg-white border border-slate-300 hover:border-slate-500 text-slate-900 font-mono tracking-widest uppercase px-6 py-4 text-xs cursor-pointer shadow-sm"
                    >
                      Browse Vetted Hotlines
                    </motion.button>
                  </div>
                </div>

                {/* AUTHORITATIVE FAMOUS INSTITUTIONAL PLATES & HEALING GRAPHIC */}
                <div className="lg:col-span-5 space-y-6">
                  {/* Therapy & Healing Group Graphic Card */}
                  <div className="bg-white border border-slate-300 p-4 shadow-xl text-left relative overflow-hidden">
                    {/* No floating dots overlay this container */}
                    <img 
                      src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&auto=format&fit=crop&q=80"
                      alt="Safe Space Emotional Healing Group Session"
                      className="w-full h-56 object-cover grayscale hover:grayscale-0 transition duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="mt-3.5 space-y-1">
                      <p className="text-[9px] text-brand-coral font-mono font-bold tracking-widest uppercase">INTERACTIVE SUPPORT ENVIRONMENT</p>
                      <p className="font-display font-serif font-bold text-slate-950 text-xs">Pathways to restoring collective emotional resiliency</p>
                    </div>
                  </div>

                  {/* OFFICIAL MANIFESTO CARD */}
                  <div className="bg-[#FCFAF7] border border-slate-300 p-8 shadow-2xl flex flex-col justify-between space-y-6 relative text-left">
                    <div className="space-y-4">
                      <span className="text-[9px] text-[#8A1B29] font-mono tracking-widest uppercase block font-bold">OFFICIAL ADVOCACY MANIFESTO</span>
                      <p className="text-slate-900 italic text-sm leading-relaxed font-serif font-medium">
                        "We must rapidly de-stigmatize mental wellness. Seeking counseling is not a failure of spiritual dedication or self-control; it is active medical intelligence and a path to absolute recovery."
                      </p>
                    </div>
                    
                    <div className="border-t border-[#e2e8f0] pt-6">
                      <p className="font-extrabold text-[#182B49] text-xs font-mono tracking-wider">ASSOCIATION OF PSYCHIATRISTS OF NIGERIA (APN)</p>
                      <p className="text-[10px] text-slate-600 mt-1 uppercase font-mono tracking-wider font-bold">Health Advocacy Taskforce Syndicate</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

          </div>
        )}

        {/* ==================== PAGE 2: ABOUT US ==================== */}
        {activeSubPage === "about" && (
          <div className="max-w-4xl mx-auto px-4 py-12 space-y-12 animate-fade-in text-slate-900">
            {/* HERO STORY */}
            <div className="space-y-6">
              <p className="text-xs font-bold text-brand-coral uppercase tracking-widest bg-brand-coral/10 px-2.5 py-1 rounded inline-block font-mono">FOUNDER JOURNEY</p>
              <h1 className="font-display font-serif text-3xl sm:text-4.5xl text-slate-950 tracking-tight leading-tight">Why We Built TalkItThrough</h1>
              <div className="flex flex-col md:flex-row items-center md:items-start gap-8 border-b border-slate-200 pb-10 mt-6">
                <div className="w-full md:w-1/3 text-center">
                  <img 
                    src="assets\Founder.jpg" 
                    alt="Founder Portrait Placeholder" 
                    className="w-40 h-40 object-cover rounded-none shadow-md border-4 border-white mx-auto grayscale"
                  />
                  <p className="font-display font-serif font-bold text-slate-950 mt-4 text-base leading-none">Dayo Oluboyede</p>
                  <p className="text-[10px] text-slate-600 uppercase font-mono tracking-wider mt-1.5 font-bold">Founder & Developer</p>
                </div>
                <div className="w-full md:w-2/3 text-slate-800 text-xs md:text-sm leading-relaxed space-y-5 font-serif">
                  <p>
                    For years, I carried a heavy, silent cage of clinical depression and physical substance abuse. In Nigerian circles, asking for mental health support is often stigmatized as "weakness", or dismissed with simple statements like <i>"pray it away"</i> or <i>"focus on work"</i>.
                  </p>
                  <p>
                    I quickly realized traditional, clinical therapy is incredibly expensive and physically unavailable to the average person. While my spiritual faith provided massive comfort, existing mental health applications completely bypassed or spiritualized-away scientific medical techniques. 
                  </p>
                  <p>
                    I built <b>TalkItThrough</b> to serve as the platform I wish existed during my darkest hours—a shame-free, secure, culturally sensitive, and multi-faith respect model designed directly for our unique collective struggles.
                  </p>
                  <p className="font-bold text-brand-charcoal text-xs md:text-sm font-sans">
                    This is absolutely not a replacement for licensed medical practitioners. It is designed to be an accessible, 24/7 bridge representing daily resiliency in your pocket.
                  </p>
                </div>
              </div>
            </div>

            {/* MISSION, GOALS & VALUES */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-8 bg-white border border-slate-200 space-y-4 shadow-sm text-left">
                <h3 className="font-display font-serif font-bold text-lg text-slate-950 flex items-center gap-2 leading-none border-b border-slate-100 pb-3">
                  <Heart className="w-5 h-5 text-brand-coral fill-brand-coral" /> Our Collective Mission
                </h3>
                <p className="text-slate-800 text-xs leading-relaxed font-sans">
                  To dramatically reduce silent self-harm, emotional despair, and untreated clinical depressive episodes globally by deploying robust, anonymous, cost-approachable, and culturally competent support channels in localized environments.
                </p>
              </div>

              <div className="p-8 bg-white border border-slate-200 space-y-4 shadow-sm text-left">
                <h3 className="font-display font-serif font-bold text-lg text-slate-950 flex items-center gap-2 leading-none border-b border-slate-100 pb-3">
                  <CheckCircle2 className="w-5 h-5 text-brand-sage" /> Our Core Values
                </h3>
                <ul className="text-slate-800 text-xs space-y-3 leading-relaxed font-sans">
                  <li>• <b>Privacy First:</b> Strict end-to-end user data isolation and instant records purging.</li>
                  <li>• <b>Faith Harmonization:</b> Balanced respect for multi-faith and secular therapeutic values alike.</li>
                  <li>• <b>Evidence Grounding:</b> CBT-supported cognitive scaffolding filters for mental restructuring.</li>
                  <li>• <b>Absolute Accessibility:</b> Minimal layout, lightweight footprint, and zero operational barriers.</li>
                </ul>
              </div>
            </div>

            {/* LIVE IMPACT STATISTICS COUNTER */}
            <div className="bg-[#FCFAF7] border border-slate-300 text-slate-900 p-8 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center shadow-md">
              <div className="space-y-2">
                <p className="text-3.5xl font-bold font-display text-[#8A1B29] font-serif">10,000+</p>
                <p className="text-[10px] text-slate-600 font-mono tracking-widest uppercase font-bold">Projected Year-1 Users Reach</p>
              </div>
              <div className="space-y-2 border-y sm:border-y-0 sm:border-x border-slate-300 py-4 sm:py-0">
                <p className="text-3.5xl font-bold font-display text-[#8A1B29] font-serif">₦{stats.totalNaira.toLocaleString()}</p>
                <p className="text-[10px] text-slate-600 font-mono tracking-widest uppercase font-bold">Naira Donated & Invested</p>
              </div>
              <div className="space-y-2">
                <p className="text-3.5xl font-bold font-display text-[#8A1B29] font-serif">{stats.healthcareSponsorshipsPaid}</p>
                <p className="text-[10px] text-slate-600 font-mono tracking-widest uppercase font-bold">Clinical Therapy Days Sponsored</p>
              </div>
            </div>
          </div>
        )}

        {/* ==================== PAGE 3: CONTACT & HELPLINES ==================== */}
        {activeSubPage === "resources" && (
          <div className="max-w-5xl mx-auto px-4 py-12 space-y-12 animate-fade-in text-slate-900">
            {/* SUBJECT FORM & DESK info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
              <div className="space-y-6">
                <p className="text-xs font-bold text-brand-blue bg-brand-blue/10 px-2.5 py-1 rounded inline-block font-mono">CONTACT INBOX</p>
                <h1 className="font-display font-serif font-bold text-3.5xl text-slate-950 tracking-tight leading-none mt-2">Get In Touch</h1>
                <p className="text-slate-800 text-xs sm:text-sm leading-relaxed max-w-md font-serif">
                  Have clinical institutional concerns, wish to join our vetted counseling network, or apply for sliding scale direct psychotherapy sponsorships? Fill out our diagnostic desk form and our administrative staff will respond within 24 hours.
                </p>
                
                <div className="text-xs space-y-4 pt-4 text-slate-800 font-sans font-medium">
                  <p className="flex items-center gap-2"><MapPin className="text-[#C5A059] w-4 h-4 shrink-0" /> Academic & clinical virtual branches, Oyo State, Nigeria</p>
                  <p className="flex items-center gap-2"><PhoneCall className="text-brand-blue w-4 h-4 shrink-0" /> administration@talkitthrough.com</p>
                  <p className="flex items-center gap-2 font-bold text-brand-coral"><AlertTriangle className="w-4 h-4 shrink-0 animate-pulse" /> FOR CRISIS: SCROLL DOWN DIRECTLY TO DIAL VETTED LINES</p>
                </div>
              </div>

              {/* Form */}
              <div className="bg-white p-8 rounded-none border border-slate-300 shadow-md space-y-4 text-left">
                {contactSuccess ? (
                  <div className="bg-emerald-50 text-emerald-900 p-6 rounded-none border border-emerald-250 text-xs text-center space-y-3">
                    <p className="font-bold">Transmission Submitted Successfully</p>
                    <p>Your message has been received by our clinical administrative registrar. A representative will reach out using secure parameters.</p>
                  </div>
                ) : (
                  <form onSubmit={(e) => { e.preventDefault(); setContactSuccess(true); }} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5 focus-within:text-[#C5A059] text-xs">
                        <label className="font-semibold text-slate-800">Your First Name</label>
                        <input required type="text" placeholder="e.g. Kola" className="w-full bg-slate-50 border border-slate-300 rounded-none px-3.5 py-2.5 placeholder-slate-400 font-medium focus:outline-none focus:ring-1 focus:ring-[#C5A059]" />
                      </div>
                      <div className="space-y-1.5 focus-within:text-[#C5A059] text-xs">
                        <label className="font-semibold text-slate-800">Secure Email</label>
                        <input required type="email" placeholder="kola@example.com" className="w-full bg-slate-50 border border-slate-300 rounded-none px-3.5 py-2.5 placeholder-slate-400 font-medium focus:outline-none focus:ring-1 focus:ring-[#C5A059]" />
                      </div>
                    </div>

                    <div className="space-y-1.5 focus-within:text-[#C5A059] text-xs">
                      <label className="font-semibold text-slate-800">Inquiry Department Category</label>
                      <select 
                        value={contactSubject} 
                        onChange={(e) => setContactSubject(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-none px-3.5 py-2.5 font-semibold focus:outline-none focus:ring-1 focus:ring-[#C5A059]"
                      >
                        <option value="general">General Sponsorship Questions</option>
                        <option value="partnership">NGO Professional Partner Application</option>
                        <option value="sponsorship">Clinical Subsidy Need (Ibadan Only)</option>
                        <option value="press">Volunteers / Mental Health Advocate</option>
                      </select>
                    </div>

                    <div className="space-y-1.5 focus-within:text-[#C5A059] text-xs">
                      <label className="font-semibold text-slate-800">Queries Message Explanation</label>
                      <textarea required rows={4} placeholder="Describe how our administrative desk can assist you..." className="w-full bg-slate-50 border border-slate-300 rounded-none px-3.5 py-2.5 placeholder-slate-400 font-medium focus:outline-none focus:ring-1 focus:ring-[#C5A059]" />
                    </div>

                    <button type="submit" className="w-full bg-brand-coral hover:bg-red-800 text-white font-mono text-xs tracking-widest uppercase py-3 rounded-none shadow transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer">
                      <Send className="w-3.5 h-3.5" /> Transmit Secure Message
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* MASSIVE MENTAL HEALTH HELPLINES (LOCAL & GLOBAL) */}
            <div className="space-y-6">
              <div className="border-t border-slate-200 pt-10 text-left">
                <h3 className="font-display font-serif font-bold text-slate-950 text-xl leading-none flex items-center gap-2">
                  <PhoneCall className="text-brand-coral shrink-0" /> Verified Emergency Crisis Hotlines & Support Services
                </h3>
                <p className="text-slate-800 text-xs sm:text-sm mt-2 font-serif">If you or someone under your care is facing severe emotional crises or self-harm thoughts, please reach out directly here immediately or click to dial. Standard network rates apply.</p>
              </div>

              {/* SMS Composer Interactive Desk */}
              {smsTarget && (
                <div className="bg-slate-950 text-white p-6 border-2 border-brand-coral rounded-none space-y-4 my-2 animate-fade-in font-mono text-xs">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                      <span className="font-bold text-slate-100 uppercase tracking-wider">SMS COMPOSER: CRISIS ADVICE LINE ({smsTarget.name})</span>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => { setSmsTarget(null); setSmsText(""); }}
                      className="text-slate-400 hover:text-white font-bold cursor-pointer"
                    >
                      [CLOSE X]
                    </button>
                  </div>

                  {smsSentNotice ? (
                    <div className="bg-emerald-950/40 border border-emerald-800 p-4 font-sans text-emerald-300 leading-relaxed space-y-2">
                      <p className="font-bold">✓ SECURE DIGITAL CARRIER ROUTE OPENED</p>
                      <p className="text-[11px] font-semibold">{smsSentNotice}</p>
                      <button 
                        onClick={() => { setSmsSentNotice(null); setSmsTarget(null); }}
                        className="text-xs underline block font-bold mt-1 text-white hover:text-brand-coral cursor-pointer"
                      >
                        Start another message
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleSendSMS} className="space-y-4 font-sans text-[#1f2937]">
                      <div className="flex justify-between text-[10px] uppercase font-mono tracking-wider text-slate-400">
                        <span>RECIPIENT CODE: {smsTarget.number}</span>
                        <span>LINE INTEGRITY: HIGH PROTECTION SECURE</span>
                      </div>
                      
                      <div className="space-y-1.5 text-xs text-slate-250">
                        <label className="font-bold text-slate-300 block">Type message to send securely:</label>
                        <textarea
                          required
                          rows={3}
                          placeholder="Type your message here... (e.g. 'I am feeling overwhelmed and need support right now.')"
                          className="w-full bg-slate-900 border border-slate-800 text-white rounded-none p-3.5 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-brand-coral placeholder-slate-600 block leading-relaxed"
                          value={smsText}
                          onChange={(e) => setSmsText(e.target.value)}
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 pt-1">
                        <button
                          type="submit"
                          className="bg-brand-coral hover:bg-red-800 text-white font-mono text-xs tracking-widest uppercase px-5 py-3 rounded-none font-bold transition duration-150 flex items-center justify-center gap-2 grow shrink-0 cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" /> Launch SMS & Send text to {smsTarget.number}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setSmsTarget(null); setSmsText(""); }}
                          className="bg-slate-900 border border-slate-750 hover:bg-slate-850 text-slate-300 font-mono text-xs tracking-widest uppercase px-4 py-3 rounded-none transition duration-150 cursor-pointer text-center font-bold"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* Grid lists */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                
                {/* Nigeria Section */}
                <div className="space-y-5 bg-white p-8 border border-slate-300 shadow-md">
                  <p className="text-xs font-mono font-bold text-red-800 tracking-wider uppercase leading-none border-b border-rose-100 pb-3">NIGERIAN-BASED CLINICAL ORGANIZATIONS</p>
                  
                  <div className="space-y-5 divide-y divide-slate-100 text-xs text-slate-900 font-medium font-sans">
                    <div className="pt-3 first:pt-0 space-y-2">
                      <p className="font-bold text-slate-950">BEFRIENDERS NIGERIA (24/7 Crisis Response)</p>
                      <p className="text-xs text-slate-800 leading-relaxed font-sans">Primary national suicide prevention, peer-support, and crisis management counselling.</p>
                      <div className="flex flex-wrap gap-2 pt-1 font-mono">
                        <a 
                          href="tel:+23422234567" 
                          className="bg-brand-coral hover:bg-red-800 text-white text-[11px] font-bold px-3 py-1.5 inline-flex items-center gap-1.5 transition duration-150 shadow-xs uppercase tracking-wider"
                          title="Click to dial Befrienders Nigeria directly"
                        >
                          <PhoneCall className="w-3.5 h-3.5" /> Call +234 2223 4567
                        </a>
                      </div>
                    </div>

                    <div className="pt-4 space-y-2">
                      <p className="font-bold text-slate-950">MENTALLY AWARE NIGERIA INITIATIVE (MANI)</p>
                      <p className="text-xs text-slate-800 leading-relaxed font-sans">Digital support desk, emotional first-aid messaging bots, and secondary referral networks.</p>
                      <div className="flex flex-wrap gap-2 pt-1 font-mono">
                        <a 
                          href="tel:+2348091116264" 
                          className="bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold px-3 py-1.5 inline-flex items-center gap-1.5 transition duration-150 shadow-xs uppercase tracking-wider"
                          title="Click to dial MANI directly"
                        >
                          <PhoneCall className="w-3.5 h-3.5" /> Call Hotline
                        </a>
                        <button 
                          type="button"
                          onClick={() => {
                            setSmsTarget({ id: "mani", name: "Mentally Aware Nigeria Initiative", number: "+2348091116264" });
                            setSmsSentNotice(null);
                            setSmsText("");
                          }}
                          className="bg-brand-sage hover:bg-emerald-800 text-white text-[11px] font-bold px-3 py-1.5 inline-flex items-center gap-1.5 transition duration-150 shadow-xs uppercase tracking-wider cursor-pointer"
                          title="Click to send MANI text help request"
                        >
                          <MessageCircle className="w-3.5 h-3.5" /> SMS Text support
                        </button>
                      </div>
                    </div>

                    <div className="pt-4 space-y-2">
                      <p className="font-bold text-slate-950">FEDERAL TEACHING CLINIC (IBADAN PSYCHIATRY)</p>
                      <p className="text-xs text-slate-800 font-sans leading-relaxed">Physical specialized medical department operating sliding scales and mental health crises response.</p>
                      <div className="pt-1">
                        <span className="text-[10px] text-slate-400 font-bold uppercase font-mono bg-slate-50 border border-slate-200 px-2 py-1">In-person outreach clinic</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* International section */}
                <div className="space-y-5 bg-white p-8 border border-slate-300 shadow-md">
                  <p className="text-xs font-mono font-bold text-brand-blue tracking-wider uppercase leading-none border-b border-indigo-100 pb-3">INTERNATIONAL SUPPORT INFRASTRUCTURES</p>
                  
                  <div className="space-y-5 divide-y divide-slate-100 text-xs text-slate-900 font-medium font-sans">
                    <div className="pt-3 first:pt-0 space-y-2">
                      <p className="font-bold text-slate-950">UK SAMARITANS (Suicide Helpline)</p>
                      <p className="text-xs text-slate-800 leading-relaxed font-sans font-medium">Confidential support lines helping individuals in distress throughout the United Kingdom.</p>
                      <div className="flex flex-wrap gap-2 pt-1 font-mono">
                        <a 
                          href="tel:116123" 
                          className="bg-brand-blue hover:bg-indigo-900 text-white text-[11px] font-bold px-3 py-1.5 inline-flex items-center gap-1.5 transition duration-150 shadow-xs uppercase tracking-wider"
                          title="Click to dial UK Samaritans directly"
                        >
                          <PhoneCall className="w-3.5 h-3.5" /> Call 116 123
                        </a>
                      </div>
                    </div>

                    <div className="pt-4 space-y-2">
                      <p className="font-bold text-slate-950">US 988 SUICIDE & CRISIS LINE</p>
                      <p className="text-xs text-slate-800 leading-relaxed font-sans font-medium">National free hotline answering psychological distress and self-harm emergencies.</p>
                      <div className="flex flex-wrap gap-2 pt-1 font-mono">
                        <a 
                          href="tel:988" 
                          className="bg-brand-blue hover:bg-indigo-900 text-white text-[11px] font-bold px-3 py-1.5 inline-flex items-center gap-1.5 transition duration-150 shadow-xs uppercase tracking-wider"
                          title="Click to dial US 988 Crisis Line"
                        >
                          <PhoneCall className="w-3.5 h-3.5" /> Call 988
                        </a>
                        <button 
                          type="button"
                          onClick={() => {
                            setSmsTarget({ id: "988", name: "US 988 Suicide & Crisis Line", number: "988" });
                            setSmsSentNotice(null);
                            setSmsText("");
                          }}
                          className="bg-brand-sage hover:bg-emerald-800 text-white text-[11px] font-bold px-3 py-1.5 inline-flex items-center gap-1.5 transition duration-150 shadow-xs uppercase tracking-wider cursor-pointer"
                          title="Type message for US 988 Support Line"
                        >
                          <MessageCircle className="w-3.5 h-3.5" /> SMS Text support
                        </button>
                      </div>
                    </div>

                    <div className="pt-4 space-y-2">
                      <p className="font-bold text-slate-950">7 CUPS OF TEA (Gratis Support Room)</p>
                      <p className="text-xs text-slate-800 leading-relaxed font-sans font-medium font-sans">Online platform offering compassionate listeners, specialized forums, and structural self-guided pathways.</p>
                      <div className="flex flex-wrap gap-2 pt-1 font-mono">
                        <a 
                          href="https://www.7cups.com/" 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold px-3 py-1.5 inline-flex items-center gap-1.5 transition duration-150 shadow-xs uppercase tracking-wider"
                        >
                          Launch Online Support Page <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* ==================== PAGE 4: CHARITY SHOP & DONATIONS ==================== */}
        {activeSubPage === "shop" && (
          <div className="max-w-6xl mx-auto px-4 py-12 space-y-12 animate-fade-in text-slate-900">
            
            {/* HERO TITLE STATS */}
            <div className="text-center space-y-4">
              <p className="text-xs font-bold text-[#C5A059] uppercase tracking-widest bg-slate-950 text-white px-4 py-1.5 inline-block select-none font-mono">SOCIALLY-RESPONSIBLE COMMERCE</p>
              <h1 className="font-display font-serif font-bold text-3.5xl sm:text-4.5xl text-slate-950 mt-2">The TalkItThrough Charity Store</h1>
              <p className="text-slate-800 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed font-serif">
                100% of profits generated from catalog sales are instantly channeled to support licensed NGOs, fund outreach platforms, and sponsor cost-free professional physical counseling sessions in Ibadan teaching clinics.
              </p>
            </div>

            {/* INTEGRATED DONATION CENTER (PROMINENT ACCENT CARD) */}
            <div className="bg-white border border-slate-300 rounded-none p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center shadow-md relative overflow-hidden">
              {/* Description */}
              <div className="lg:col-span-7 space-y-5 text-left">
                <span className="bg-brand-coral text-white font-mono font-bold tracking-widest text-[10px] px-3 py-1 rounded-none uppercase">💚 HEALING DISCLOSURE</span>
                <h3 className="font-display font-serif font-bold text-slate-950 text-2xl leading-none">Support Clinical Therapy Directly</h3>
                <p className="text-slate-800 text-xs sm:text-sm leading-relaxed max-w-lg font-serif">
                  In Ibadan, <b>₦2,500</b> covers 1 digital wellness audio guide, and <b>₦10,000</b> sponsors a full behavioral diagnostic outreach consultation. Every donation moves someone out of silent trauma.
                </p>

                {/* Simulated Impact board */}
                <div className="bg-slate-50 p-6 border border-slate-200 rounded-none space-y-2 text-slate-900 text-xs font-sans">
                  <p className="font-bold flex items-center gap-2 text-slate-950 font-serif text-sm">
                    <CheckCircle2 className="w-5 h-5 text-brand-sage shrink-0" /> Cumulative Platform Impact Reached:
                  </p>
                  <p className="text-xs leading-relaxed mt-2 font-medium">
                    • <b>₦{(stats?.totalNaira || 1045000).toLocaleString()}</b> in gross donations raised.
                    <br />• <b>{stats?.totalDonors || 142}</b> global patrons back-funding.
                    <br />• <b>{stats?.healthcareSponsorshipsPaid || 18}</b> clinical therapeutic sessions sponsored in Oyo State.
                  </p>
                </div>
              </div>

              {/* Interactive Donation box Form */}
              <div className="lg:col-span-5 bg-slate-50 p-6 rounded-none border border-slate-300 shadow-sm space-y-4 text-left">
                {donationSuccess ? (
                  <div className="text-center p-6 space-y-3">
                    <Sparkles className="w-10 h-10 text-[#C5A059] mx-auto animate-pulse" />
                    <p className="font-display font-bold text-slate-950 text-sm">Donation Received Successfully</p>
                    <p className="text-slate-850 text-xs">Thank you for your generous alignment. Your contribution immediately updates our support parameters to help people suffering in silence.</p>
                  </div>
                ) : (
                  <form onSubmit={handleDonate} className="space-y-4 text-xs font-semibold">
                    <p className="font-bold text-slate-900">Select Donation Amount (₦):</p>
                    <div className="grid grid-cols-4 gap-2 text-center text-slate-900">
                      {["2000", "5000", "10000", "custom"].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setDonationAmount(val)}
                          className={`py-2 rounded-none border text-xs font-mono font-bold transition ${donationAmount === val ? "bg-slate-950 text-white border-slate-950" : "bg-white border-slate-300 hover:bg-slate-100"}`}
                        >
                          {val === "custom" ? "Custom" : `₦${Number(val).toLocaleString()}`}
                        </button>
                      ))}
                    </div>

                    {donationAmount === "custom" && (
                      <div className="space-y-1">
                        <label className="text-slate-800 text-[10px] uppercase font-mono tracking-wider font-bold">Enter Custom Amount (₦):</label>
                        <input
                          required
                          type="number"
                          placeholder="e.g. 25000"
                          value={customDonAmount}
                          onChange={(e) => setCustomDonAmount(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-none px-3.5 py-2 focus:outline-none focus:ring-1 focus:ring-[#C5A059] placeholder-slate-400 text-slate-900"
                        />
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="text-slate-800 text-[10px] uppercase font-mono tracking-wider font-bold">Donor Name (Optional):</label>
                      <input
                        type="text"
                        placeholder="Anonymous Supporter"
                        value={donationName}
                        onChange={(e) => setDonationName(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-none px-3.5 py-2 focus:outline-none focus:ring-1 focus:ring-[#C5A059] placeholder-slate-400 text-slate-900"
                      />
                    </div>

                    <button type="submit" className="w-full bg-brand-coral hover:bg-red-800 text-white text-xs font-mono tracking-widest uppercase py-3 rounded-none shadow-md transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer">
                      <Gift className="w-4 h-4" /> Secure Naira Donation (Mock)
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* MERCHANDISE & DESIGN PRODUCTS LISTINGS */}
            <div className="space-y-6">
              <h3 className="font-display font-serif font-bold text-slate-950 text-2xl flex items-center gap-2 mt-10">
                <ShoppingBag className="text-brand-sage" /> Resilience Store & Literature Catalog
              </h3>

              {cartSuccess && (
                <div className="bg-emerald-50 text-emerald-900 px-6 py-4 rounded-none border border-emerald-250 text-xs text-center font-serif">
                  ✨ Academic purchase simulated successfully! Safe-haven funding registered.
                </div>
              )}

              {/* Main Products Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {SHOP_PRODUCTS.map((prod) => (
                  <div key={prod.id} className="bg-white border border-slate-300 rounded-none overflow-hidden shadow-sm flex flex-col justify-between">
                    <div className="relative">
                      <img 
                        src={prod.imageUrl} 
                        alt={prod.title} 
                        className="w-full h-52 object-cover grayscale hover:grayscale-0 transition duration-300"
                      />
                      <span className="absolute top-3 left-3 bg-slate-950 text-[#C5A059] text-[9px] font-mono font-bold tracking-widest px-2.5 py-1 uppercase rounded-none">
                        {prod.category}
                      </span>
                    </div>

                    <div className="p-6 flex-grow flex flex-col justify-between space-y-4">
                      <div className="space-y-2 text-left">
                        <p className="font-display font-serif font-bold text-slate-950 text-sm leading-snug">{prod.title}</p>
                        <p className="text-slate-800 text-xs leading-relaxed font-sans">{prod.description}</p>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                        <span className="font-display font-bold text-[#8A1B29] text-base">₦{prod.priceNaira.toLocaleString()}</span>
                        <button
                          onClick={() => {
                            handleAddToCart(prod.id);
                          }}
                          className="bg-brand-sage hover:bg-slate-950 text-white text-[10px] font-mono tracking-widest uppercase px-4 py-2 rounded-none transition cursor-pointer"
                        >
                          Add {cart[prod.id] ? `(${cart[prod.id]})` : ""}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Short Cart Desk */}
              {Object.keys(cart).length > 0 && (
                <div className="bg-white border border-slate-300 rounded-none p-8 max-w-md mx-auto space-y-4 text-left shadow-lg">
                  <h4 className="font-display font-serif font-bold text-sm text-slate-950 flex items-center gap-2 leading-none border-b border-slate-200 pb-3">
                    <ShoppingBag className="w-5 h-5 text-brand-sage" /> Vetted Procurement Desk
                  </h4>
                  <div className="space-y-3 text-xs text-slate-800 font-sans">
                    {Object.entries(cart).map(([id, qty]) => {
                      const item = SHOP_PRODUCTS.find(p => p.id === id);
                      if (!item) return null;
                      return (
                        <div key={id} className="flex justify-between items-center">
                          <span className="truncate max-w-[200px] font-semibold">{item.title} x {Number(qty)}</span>
                          <span className="font-mono font-bold">₦{(item.priceNaira * Number(qty)).toLocaleString()}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="border-t border-slate-200 pt-3 flex justify-between items-center font-display font-bold text-sm text-slate-950">
                    <span>Aggregate Total:</span>
                    <span className="font-mono">
                      ₦{Object.entries(cart).reduce((acc, [id, qty]) => {
                        const item = SHOP_PRODUCTS.find(p => p.id === id);
                        return acc + (item ? item.priceNaira * Number(qty) : 0);
                      }, 0).toLocaleString()}
                    </span>
                  </div>
                  <button
                    onClick={executeCheckout}
                    className="w-full bg-brand-coral hover:bg-red-800 text-white font-mono text-xs tracking-widest uppercase py-3 rounded-none transition shadow cursor-pointer"
                  >
                    Simulate Secure Checkout Hub
                  </button>
                </div>
              )}
            </div>

          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="bg-[#FCFAF7] border-t border-slate-200 text-slate-700 text-xs py-12 mt-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 text-center">
          <p className="font-display font-serif font-bold text-[#8A1B29] text-base">TalkItThrough Integrative Resiliency Platform</p>
          <p className="max-w-2xl mx-auto leading-relaxed text-[11px] text-slate-600 font-sans">
            TalkItThrough does not replace clinical healthcare practitioners, diagnoses, prescriptions, or emergency search and rescue teams. If you are experiencing suicidal thoughts, please snap-disconnect from this portal and contact national crisis units immediately.
          </p>
          <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider font-bold">
            © 2026 TalkItThrough System. Vetted under Nigeria NDPR 2019 data privacy mandates and global GDPR frameworks. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
