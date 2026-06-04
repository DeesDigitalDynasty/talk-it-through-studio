import React, { useState, useEffect } from "react";
import PublicWebsite from "./components/PublicWebsite";
import AppDashboard from "./components/AppDashboard";
import BlueprintHub from "./components/BlueprintHub";
import { 
  Heart, Lock, Mail, Users, FileText, CheckCircle2, 
  HelpCircle, Sparkles, Layers, Terminal, AlertCircle, Loader2 
} from "lucide-react";
import { SignUpInput } from "./types";

export default function App() {
  // Authentication states
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [token, setToken] = useState<string | null>(null);
  
  // Navigation states
  const [authModal, setAuthModal] = useState<"login" | "register" | "forgot" | "reset" | null>(null);
  const [showWorkspace, setShowWorkspace] = useState(false);

  // Recovery States
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Registration states
  const [regForm, setRegForm] = useState({
    name: "",
    email: "",
    password: "",
    age: 18,
    preferredLanguage: "English" as any,
    faithPreference: "None" as any,
    phone: ""
  });
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // GDPR agreement checkbox
  const [gdprChecked, setGdprChecked] = useState(false);

  useEffect(() => {
    // Attempt local retrieval of cached token
    const cachedToken = localStorage.getItem("talkitthrough_token");
    if (cachedToken) {
      fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${cachedToken}` }
      })
        .then(res => {
          if (!res.ok) throw new Error("Stale token parsed");
          return res.json();
        })
        .then(data => {
          if (data.user) {
            setToken(cachedToken);
            setCurrentUser(data.user);
          }
        })
        .catch(() => {
          localStorage.removeItem("talkitthrough_token");
        });
    }
  }, []);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gdprChecked) {
      setAuthError("You must explicitly review and accept our NDPR / GDPR Data Sovereignty Agreement to sign up.");
      return;
    }
    setAuthLoading(true);
    setAuthError(null);

    fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(regForm)
    })
      .then(res => res.json())
      .then(data => {
        setAuthLoading(false);
        if (data.error) {
          setAuthError(data.error);
        } else if (data.token) {
          localStorage.setItem("talkitthrough_token", data.token);
          setToken(data.token);
          setCurrentUser(data.user);
          setAuthModal(null);
          // Reset forms to fresh
          setRegForm({
            name: "",
            email: "",
            password: "",
            age: 18,
            preferredLanguage: "English",
            faithPreference: "None",
            phone: ""
          });
        }
      })
      .catch(err => {
        setAuthLoading(false);
        setAuthError("Registration failed: " + err.message);
      });
  };

  const handleStartAsAnonymous = () => {
    setAuthLoading(true);
    setAuthError(null);
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const anonForm = {
      name: `AnonymousPeer${randomSuffix}`,
      email: `anon-${Math.random().toString(36).substring(2, 11)}@talkitthrough.org`,
      password: `anon-pin-${Math.random().toString(36).substring(2, 10)}`,
      age: 25,
      preferredLanguage: "English" as any,
      faithPreference: "None" as any,
      phone: ""
    };

    fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(anonForm)
    })
      .then(res => res.json())
      .then(data => {
        setAuthLoading(false);
        if (data.error) {
          setAuthError(data.error);
        } else if (data.token) {
          localStorage.setItem("talkitthrough_token", data.token);
          setToken(data.token);
          setCurrentUser(data.user);
          setAuthModal(null);
        }
      })
      .catch(err => {
        setAuthLoading(false);
        setAuthError("Anonymous entry failed: " + err.message);
      });
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(loginForm)
    })
      .then(res => res.json())
      .then(data => {
        setAuthLoading(false);
        if (data.error) {
          setAuthError(data.error);
        } else if (data.token) {
          localStorage.setItem("talkitthrough_token", data.token);
          setToken(data.token);
          setCurrentUser(data.user);
          setAuthModal(null);
          setLoginForm({ email: "", password: "" });
        }
      })
      .catch(err => {
        setAuthLoading(false);
        setAuthError("Sign-in failed: " + err.message);
      });
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    setSuccessMessage(null);

    fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: forgotEmail })
    })
      .then(res => res.json())
      .then(data => {
        setAuthLoading(false);
        if (data.error) {
          setAuthError(data.error);
        } else if (data.success) {
          const helperMsg = data.code 
            ? `${data.message} (For testing: use code ${data.code})`
            : data.message;
          setSuccessMessage(helperMsg);
          // Set fields & auto transition to verification screen
          setResetCode(data.code || "");
          setAuthModal("reset");
        }
      })
      .catch(err => {
        setAuthLoading(false);
        setAuthError("Failed to request recovery code: " + err.message);
      });
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    setSuccessMessage(null);

    fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        email: forgotEmail, 
        code: resetCode, 
        newPassword: resetPassword 
      })
    })
      .then(res => res.json())
      .then(data => {
        setAuthLoading(false);
        if (data.error) {
          setAuthError(data.error);
        } else if (data.success) {
          setSuccessMessage(data.message);
          setAuthModal("login");
          // Clear reset input fields
          setResetCode("");
          setResetPassword("");
        }
      })
      .catch(err => {
        setAuthLoading(false);
        setAuthError("Failed to reset password: " + err.message);
      });
  };

  const handleLogout = () => {
    if (token) {
      fetch("/api/auth/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
    }
    localStorage.removeItem("talkitthrough_token");
    setToken(null);
    setCurrentUser(null);
  };

  return (
    <div className="relative">
      
      {/* CORE VIEW LAYOUT */}
      {currentUser && token ? (
        <AppDashboard 
          token={token} 
          user={currentUser} 
          onLogout={handleLogout}
          onUserUpdate={(updatedUser) => setCurrentUser(updatedUser)}
        />
      ) : (
        <PublicWebsite 
          onStartChat={() => setAuthModal("register")} 
          onSignUpClick={() => setAuthModal("register")} 
        />
      )}

      {/* MODAL AUTH OVERLAYS */}
      {authModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-none p-8 w-full max-w-md border border-slate-300 shadow-2xl relative animate-fade-in text-xs font-semibold text-slate-900 space-y-4 text-left">
            
            <button 
              onClick={() => { setAuthModal(null); setAuthError(null); }}
              className="absolute right-4 top-4 hover:bg-slate-100 p-2 rounded-none text-slate-500 hover:text-slate-900 transition"
            >
              ✕
            </button>

            {authLoading && (
              <div className="absolute inset-0 bg-white/90 backdrop-blur-[2px] flex flex-col items-center justify-center z-20 animate-fade-in select-none">
                <div className="text-center space-y-3 p-4">
                  <Loader2 className="w-9 h-9 text-[#8A1B29] animate-spin mx-auto" />
                  <p className="text-[10px] uppercase font-mono tracking-widest text-[#8A1B29] font-extrabold">
                    Processing Request...
                  </p>
                  <p className="text-slate-500 text-[10px] font-sans antialiased">
                    Please wait while we secure your residency profile.
                  </p>
                </div>
              </div>
            )}

            {/* Title */}
            <div className="text-center space-y-1 select-none">
              <Heart className="w-10 h-10 text-[#8A1B29] fill-[#8A1B29] mx-auto" />
              <h3 className="font-display font-serif font-bold text-slate-950 text-xl mt-3">
                {authModal === "login" && "Enter the Safe Haven"}
                {authModal === "register" && "Create Your Anonymous Account"}
                {authModal === "forgot" && "Secure Password Recovery"}
                {authModal === "reset" && "Set Your New Password PIN"}
              </h3>
              <p className="text-slate-700 text-[11px] font-sans">
                {authModal === "login" && "Verify your cached credentials."}
                {authModal === "register" && "NDPR Compliant support system for general mental residency."}
                {authModal === "forgot" && "Trigger safety code dispatch to retrieve verified email account."}
                {authModal === "reset" && "Input your temporary 6-digit recovery PIN to set new credentials."}
              </p>
            </div>

            {authError && (
              <div className="bg-red-50 text-red-900 p-4 rounded-none border border-red-300 text-[11px] leading-relaxed flex items-start gap-1.5 font-bold">
                <AlertCircle className="w-4 h-4 text-red-800 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            {successMessage && (
              <div className="bg-[#FAF6EC] text-[#8A1B29] p-4 rounded-none border border-[#C5A059] text-[11px] leading-relaxed flex items-start gap-1.5 font-bold">
                <CheckCircle2 className="w-4 h-4 text-[#C5A059] shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* LOGIN PORT */}
            {authModal === "login" && (
              <form onSubmit={handleLogin} className="space-y-4 font-semibold text-left">
                <div className="space-y-1.5 focus-within:text-[#C5A059]">
                  <label className="text-slate-800 text-[10px] uppercase font-mono tracking-wider">Secure Identifier (Email)</label>
                  <input
                    required
                    type="email"
                    placeholder="kola@example.com"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-none px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#C5A059] placeholder-slate-400 font-medium text-slate-900"
                  />
                </div>

                <div className="space-y-1.5 focus-within:text-[#C5A059]">
                  <div className="flex justify-between items-center">
                    <label className="text-slate-800 text-[10px] uppercase font-mono tracking-wider">Password PIN</label>
                    <button 
                      type="button"
                      onClick={() => {
                        setAuthModal("forgot");
                        setAuthError(null);
                        setSuccessMessage(null);
                        setForgotEmail(loginForm.email);
                      }}
                      className="text-[#8A1B29] hover:underline hover:text-red-800 text-[10px] font-bold cursor-pointer"
                    >
                      Forgot PIN?
                    </button>
                  </div>
                  <input
                    required
                    type="password"
                    placeholder="••••••••"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-none px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#C5A059] text-slate-900"
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={authLoading}
                  className="w-full bg-brand-coral hover:bg-red-800 text-white font-mono text-xs tracking-widest uppercase py-3 rounded-none shadow transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {authLoading ? "Decrypting profile..." : "Enter Secure Hub"}
                </button>

                <p className="text-center text-[11px] text-slate-800 mt-4 leading-none select-none">
                  New to platform? {" "}
                  <button type="button" onClick={() => { setAuthModal("register"); setAuthError(null); setSuccessMessage(null); }} className="text-[#8A1B29] hover:underline font-bold cursor-pointer">
                     Create anonymous account
                  </button>
                </p>
              </form>
            )}

            {/* REGISTER PORT */}
            {authModal === "register" && (
              <form onSubmit={handleRegister} className="space-y-4 font-semibold scrollbar overflow-y-auto max-h-[420px] pr-1 pb-1 text-left">
                <div className="space-y-1.5 focus-within:text-[#C5A059]">
                  <label className="text-slate-800 text-[10px] uppercase font-mono tracking-wider">Anonymous Nickname / Alias</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Kola (Do NOT use full real names)"
                    value={regForm.name}
                    onChange={(e) => setRegForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-none px-3.5 py-2 focus:outline-none focus:ring-1 focus:ring-[#C5A059] placeholder-slate-400 font-medium text-slate-900"
                  />
                </div>

                <div className="space-y-1.5 focus-within:text-[#C5A059]">
                  <label className="text-slate-800 text-[10px] uppercase font-mono tracking-wider">Encrypted Email Profile</label>
                  <input
                    required
                    type="email"
                    placeholder="kola@example.com"
                    value={regForm.email}
                    onChange={(e) => setRegForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-none px-3.5 py-2 focus:outline-none focus:ring-1 focus:ring-[#C5A059] placeholder-slate-400 font-medium text-slate-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5 focus-within:text-[#C5A059]">
                    <label className="text-slate-800 text-[10px] uppercase font-mono tracking-wider">PIN (Password)</label>
                    <input
                      required
                      type="password"
                      placeholder="Min 6 keys"
                      value={regForm.password}
                      onChange={(e) => setRegForm(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-none px-3.5 py-2 focus:outline-none focus:ring-1 focus:ring-[#C5A059] placeholder-slate-400 text-slate-900"
                    />
                  </div>
                  <div className="space-y-1.5 focus-within:text-[#C5A059]">
                    <label className="text-slate-800 text-[10px] uppercase font-mono tracking-wider">Age (18+ Mandatory)</label>
                    <input
                      required
                      type="number"
                      min={18}
                      max={120}
                      value={regForm.age}
                      onChange={(e) => setRegForm(prev => ({ ...prev, age: Number(e.target.value) }))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-none px-3.5 py-2 focus:outline-none focus:ring-1 focus:ring-[#C5A059] text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5 focus-within:text-[#C5A059]">
                    <label className="text-slate-800 text-[10px] uppercase font-mono tracking-wider">Preferred Language</label>
                    <select
                      value={regForm.preferredLanguage}
                      onChange={(e) => setRegForm(prev => ({ ...prev, preferredLanguage: e.target.value as any }))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-none px-3.5 py-2 font-bold focus:outline-none focus:ring-1 focus:ring-[#C5A059] text-slate-900"
                    >
                      <option value="English">English</option>
                      <option value="Yoruba">Yorùbá</option>
                      <option value="English-Pidgin">Naija Pidgin</option>
                    </select>
                  </div>
                  <div className="space-y-1.5 focus-within:text-[#C5A059]">
                    <label className="text-slate-800 text-[10px] uppercase font-mono tracking-wider">Spiritual Focus</label>
                    <select
                      value={regForm.faithPreference}
                      onChange={(e) => setRegForm(prev => ({ ...prev, faithPreference: e.target.value as any }))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-none px-3.5 py-2 font-bold focus:outline-none focus:ring-1 focus:ring-[#C5A059] text-slate-900"
                    >
                      <option value="None">Secular Focus</option>
                      <option value="Christian">Christian</option>
                      <option value="Muslim">Muslim</option>
                      <option value="Other">Other / Neutral</option>
                    </select>
                  </div>
                </div>

                {/* Explicit GDPR Consent Checkbox */}
                <div className="bg-slate-50 border border-slate-300 p-4 rounded-none flex items-start gap-2.5 text-slate-900 font-medium text-[11px] leading-relaxed">
                  <input
                    required
                    type="checkbox"
                    checked={gdprChecked}
                    onChange={(e) => setGdprChecked(e.target.checked)}
                    className="mt-1 accent-[#8A1B29] select-none shrink-0"
                  />
                  <label className="cursor-pointer">
                    I explicitly authorize TalkItThrough to index my registration, encrypted profile database, and mood analytics logs. I understand my <b>Right to Erasure (instant purge)</b> is available under settings.
                  </label>
                </div>

                <button 
                  type="submit" 
                  disabled={authLoading}
                  className="w-full bg-brand-coral hover:bg-red-800 text-white font-mono text-xs tracking-widest uppercase py-3 rounded-none shadow transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {authLoading ? "Salting secure credentials..." : "Agree & Register Account"}
                </button>

                <div className="space-y-3 pt-3 border-t border-slate-200 text-center">
                  <p className="text-[11px] text-slate-855 select-none font-semibold">
                    Already have an account?{" "}
                    <button type="button" onClick={() => { setAuthModal("login"); setAuthError(null); setSuccessMessage(null); }} className="text-[#8A1B29] hover:underline font-bold cursor-pointer">
                      Sign in here
                    </button>
                  </p>

                  <div className="flex items-center justify-between gap-2 px-1 text-slate-400 text-[9px] uppercase font-mono font-bold select-none">
                    <span className="h-px bg-slate-200 grow" />
                    <span>OR</span>
                    <span className="h-px bg-slate-200 grow" />
                  </div>

                  <button 
                    type="button" 
                    onClick={handleStartAsAnonymous}
                    disabled={authLoading}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-[#8A1B29] font-mono text-xs tracking-widest uppercase py-2.5 rounded-none border border-slate-300 transition duration-150 cursor-pointer text-center font-bold"
                  >
                    Start as Anonymous
                  </button>
                </div>
              </form>
            )}

            {/* FORGOT PASSWORD PORT */}
            {authModal === "forgot" && (
              <form onSubmit={handleForgotPassword} className="space-y-4 font-semibold text-left">
                <div className="space-y-1.5 focus-within:text-[#C5A059]">
                  <label className="text-slate-800 text-[10px] uppercase font-mono tracking-wider">Email Address</label>
                  <input
                    required
                    type="email"
                    placeholder="kola@example.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-none px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#C5A059] placeholder-slate-400 font-medium text-slate-900"
                  />
                  <p className="text-slate-500 text-[10px] italic">
                    Enter your registered email address. We will simulate sending a secure 6-digit recovery PIN instantly.
                  </p>
                </div>

                <div className="flex gap-2 pt-2">
                  <button 
                    type="button" 
                    onClick={() => { setAuthModal("login"); setAuthError(null); setSuccessMessage(null); }}
                    className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-xs tracking-wider uppercase py-3 rounded-none border border-slate-300 transition text-center cursor-pointer font-bold"
                  >
                    Go Back
                  </button>
                  <button 
                    type="submit" 
                    disabled={authLoading}
                    className="flex-1 bg-brand-coral hover:bg-red-800 text-white font-mono text-xs tracking-widest uppercase py-3 rounded-none shadow transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {authLoading ? "Verifying..." : "Send Reset Link"}
                  </button>
                </div>
              </form>
            )}

            {/* RESET PASSWORD PORT */}
            {authModal === "reset" && (
              <form onSubmit={handleResetPassword} className="space-y-4 font-semibold text-left">
                <div className="space-y-1.5 focus-within:text-[#C5A059]">
                  <label className="text-slate-800 text-[10px] uppercase font-mono tracking-wider">Email Profile</label>
                  <input
                    required
                    type="email"
                    placeholder="kola@example.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-none px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#C5A059] placeholder-slate-400 font-medium text-slate-900"
                  />
                </div>

                <div className="space-y-1.5 focus-within:text-[#C5A059]">
                  <label className="text-slate-800 text-[10px] uppercase font-mono tracking-wider">6-Digit Recovery PIN</label>
                  <input
                    required
                    type="text"
                    maxLength={6}
                    placeholder="e.g. 123456"
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-none px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#C5A059] text-center font-bold tracking-widest text-slate-950 text-base"
                  />
                </div>

                <div className="space-y-1.5 focus-within:text-[#C5A059]">
                  <label className="text-slate-800 text-[10px] uppercase font-mono tracking-wider">New Password PIN</label>
                  <input
                    required
                    type="password"
                    placeholder="Min 6 characters"
                    value={resetPassword}
                    onChange={(e) => setResetPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-none px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#C5A059] text-slate-900 font-medium"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button 
                    type="button" 
                    onClick={() => { setAuthModal("forgot"); setAuthError(null); setSuccessMessage(null); }}
                    className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-xs tracking-wider uppercase py-3 rounded-none border border-slate-300 transition text-center cursor-pointer font-bold"
                  >
                    Back
                  </button>
                  <button 
                    type="submit" 
                    disabled={authLoading}
                    className="flex-1 bg-brand-coral hover:bg-amber-800 text-white font-mono text-xs tracking-widest uppercase py-3 rounded-none shadow transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {authLoading ? "Updating..." : "Update PIN"}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
