import React, { useState, useEffect } from "react";
import { FileCode, Database, RefreshCw, Layers, ShieldCheck, Copy, Check } from "lucide-react";

interface BlueprintData {
  schemas: Record<string, string>;
  apis: Array<{ method: string; path: string; desc: string }>;
}

export default function BlueprintHub() {
  const [activeTab, setActiveTab] = useState<"architecture" | "database" | "api" | "legal">("architecture");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [blueprints, setBlueprints] = useState<BlueprintData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/blueprint")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load blueprint schema metadata");
        return res.json();
      })
      .then((data) => {
        setBlueprints(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden max-w-5xl mx-auto my-8">
      {/* Header */}
      <div className="bg-slate-900 px-6 py-5 flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Layers className="text-brand-coral w-8 h-8" />
          <div>
            <h2 className="font-display text-xl font-bold text-white tracking-tight">TalkItThrough Developer Workspace</h2>
            <p className="text-slate-400 text-xs">Production Architectures, SQL Schemas, API Gateways & Legal Blueprints</p>
          </div>
        </div>
        <div className="flex bg-slate-800 p-1 rounded-lg mt-4 md:mt-0 border border-slate-700">
          <button
            onClick={() => setActiveTab("architecture")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${activeTab === "architecture" ? "bg-brand-coral text-white shadow" : "text-slate-400 hover:text-white"}`}
          >
            System Journeys
          </button>
          <button
            onClick={() => setActiveTab("database")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${activeTab === "database" ? "bg-brand-coral text-white shadow" : "text-slate-400 hover:text-white"}`}
          >
            SQL Tables
          </button>
          <button
            onClick={() => setActiveTab("api")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${activeTab === "api" ? "bg-brand-coral text-white shadow" : "text-slate-400 hover:text-white"}`}
          >
            API Endpoints
          </button>
          <button
            onClick={() => setActiveTab("legal")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${activeTab === "legal" ? "bg-brand-coral text-white shadow" : "text-slate-400 hover:text-white"}`}
          >
            GDPR / NDPR Legal
          </button>
        </div>
      </div>

      {/* Tabs Content */}
      <div className="p-6 md:p-8">
        
        {/* TAB 1: ARCHITECTURE JOURNEYS */}
        {activeTab === "architecture" && (
          <div className="space-y-8 animate-fade-in">
            <div>
              <h3 className="font-display font-bold text-lg text-slate-800">Unified Architecture Mapping</h3>
              <p className="text-slate-500 text-sm mt-1">TalkItThrough handles requests with a split stack: Client (React SPA), Server Proxy (Express Gateway on Cloud Run), and localized storage safeguards. This ensures no private therapy text is ever logged in cleartext externally.</p>
            </div>

            {/* Diagram 1: Registration Pipeline */}
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
              <h4 className="font-display font-medium text-sm text-slate-700 mb-4 flex items-center gap-2">
                <span className="bg-brand-sage text-white text-xs px-2.5 py-1 rounded">JOURNEY 1</span>
                User Onboarding & NDPR Consent Journey
              </h4>
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-4 overflow-x-auto text-xs">
                <div className="bg-white p-3 border border-slate-200 shadow-sm rounded-lg text-center w-full md:w-1/4">
                  <p className="font-bold text-slate-700">1. UI Registration Form</p>
                  <p className="text-slate-500 text-[10px] mt-1">Zod validates email, age check (18+) & language preference</p>
                </div>
                <div className="text-brand-taupe font-bold text-lg rotate-90 md:rotate-0">→</div>
                <div className="bg-brand-cream border border-brand-sage/40 p-3 shadow-sm rounded-lg text-center w-full md:w-1/4">
                  <p className="font-bold text-brand-charcoal text-[11px]">2. Explicit Legal Prompt</p>
                  <p className="text-slate-600 text-[10px] mt-1">User toggles terms checkbook & NDPR data-consent triggers</p>
                </div>
                <div className="text-brand-taupe font-bold text-lg rotate-90 md:rotate-0">→</div>
                <div className="bg-slate-900 text-white p-3 shadow-sm rounded-lg text-center w-full md:w-1/4">
                  <p className="font-bold text-brand-coral">3. Express API Guard</p>
                  <p className="text-slate-400 text-[10px] mt-1">Password crypt SHA-256 hashed. Session token generated & cached</p>
                </div>
                <div className="text-brand-taupe font-bold text-lg rotate-90 md:rotate-0">→</div>
                <div className="bg-white p-3 border border-slate-200 shadow-sm rounded-lg text-center w-full md:w-1/4">
                  <p className="font-bold text-brand-sage">4. Account Secure</p>
                  <p className="text-slate-500 text-[10px] mt-1">Token stored in local storage for authenticated routing headers</p>
                </div>
              </div>
            </div>

            {/* Diagram 2: AI Therapy Chat Request Loop */}
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
              <h4 className="font-display font-medium text-sm text-slate-700 mb-4 flex items-center gap-2">
                <span className="bg-brand-blue text-white text-xs px-2.5 py-1 rounded">JOURNEY 2</span>
                Safe AI Therapy Chat Loop & Localized Crisis Detect
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
                <div className="bg-white p-4 border border-slate-200 shadow-sm rounded-lg">
                  <p className="font-bold text-slate-700 text-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-brand-coral animate-pulse"></span> Client Message
                  </p>
                  <p className="text-slate-500 text-[10px] mt-2">Men writes prompt. System checks pre-chat mood context (1-10 slider).</p>
                  <div className="mt-3 bg-red-50 text-red-700 border border-red-100 rounded p-1.5 text-[9px] font-mono leading-tight">
                    CRITICAL FILTERS LISTENTING: "suicide", "Sniper insecticide", etc.
                  </div>
                </div>

                <div className="bg-slate-900 text-white p-4 shadow-sm rounded-lg flex flex-col justify-between">
                  <div>
                    <p className="font-bold text-brand-coral text-xs">Express Server Routing Node</p>
                    <p className="text-slate-400 text-[10px] mt-1">Scans string against safety keywords map.</p>
                  </div>
                  <div className="mt-3 bg-slate-800 p-2 rounded text-[10px] font-mono border border-slate-700 space-y-1">
                    <p className="text-green-400">if (isCrisis) {"{"}</p>
                    <p className="text-slate-300">  // Bypass LLM, return local Crisis Help alert</p>
                    <p className="text-slate-300">{"}"} else {"{"}</p>
                    <p className="text-slate-300">  // Proxies to server-contained Gemini API</p>
                    <p className="text-green-400">{"}"}</p>
                  </div>
                </div>

                <div className="bg-white p-4 border border-slate-200 shadow-sm rounded-lg">
                  <p className="font-bold text-brand-sage text-xs">AI Response Rendering</p>
                  <p className="text-slate-500 text-[10px] mt-2">Model response compiled with tailored Nigerian cultural parameters & CB peer-guidance frameworks.</p>
                  <div className="mt-3 bg-slate-50 text-slate-600 border border-slate-200 rounded p-2 text-[9px]">
                    User selects post-chat mood. Results are saved in DB to gauge therapy progress.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SQL SCHEMA SCHEMATICS */}
        {activeTab === "database" && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h3 className="font-display font-bold text-lg text-slate-800">PostgreSQL Schema Specifications</h3>
              <p className="text-slate-500 text-sm mt-1">Our relational architecture enforces security and clean constraints for scaling up to 100k users. Run this directly inside your Supabase SQL editor or local PostgreSQL shell.</p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center p-8 text-slate-500 text-xs">
                <RefreshCw className="animate-spin w-4 h-4 mr-2" /> Loading SQL Blueprints...
              </div>
            ) : blueprints ? (
              <div className="grid grid-cols-1 gap-6">
                {Object.entries(blueprints.schemas).map(([name, sql]) => (
                  <div key={name} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-slate-950">
                    <div className="bg-slate-900 px-4 py-2 flex items-center justify-between border-b border-slate-800">
                      <span className="font-mono text-xs text-slate-300 font-bold flex items-center gap-1.5">
                        <Database className="w-3.5 h-3.5 text-brand-sage" /> {name.toUpperCase()} TABLE DEFINITION
                      </span>
                      <button
                        onClick={() => handleCopy(sql as string, name)}
                        className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition"
                        title="Copy SQL To Clipboard"
                      >
                        {copiedKey === name ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <pre className="p-4 overflow-x-auto text-[11px] font-mono text-slate-300 leading-relaxed bg-slate-950">{sql}</pre>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-red-500 text-xs">Failed to load schema information</p>
            )}
          </div>
        )}

        {/* TAB 3: API ENDPOINTS DIRECTORY */}
        {activeTab === "api" && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h3 className="font-display font-bold text-lg text-slate-800">REST API Gateway Methods</h3>
              <p className="text-slate-500 text-sm mt-1">The server hosts a protected API gateway. All endpoints mapped with authorization checks mandate a secure `Authorization: Bearer &lt;token&gt;` header.</p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center p-8 text-slate-500 text-xs">
                <RefreshCw className="animate-spin w-4 h-4 mr-2" /> Loading API Catalog...
              </div>
            ) : blueprints ? (
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 font-semibold text-slate-700 border-b border-slate-200">
                    <tr>
                      <th className="p-3 md:p-4">METHOD</th>
                      <th className="p-3 md:p-4">API ENDPOINT PATH</th>
                      <th className="p-3 md:p-4">SECURE GATEWAY FUNCTION DESCRIPTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600">
                    {blueprints.apis.map((api, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition">
                        <td className="p-3 md:p-4 font-mono font-bold">
                          <span className={`px-2 py-0.5 rounded text-[10px] ${api.method === "POST" ? "bg-emerald-50 text-emerald-700" : api.method === "DELETE" ? "bg-rose-50 text-rose-700" : "bg-blue-50 text-blue-700"}`}>
                            {api.method}
                          </span>
                        </td>
                        <td className="p-3 md:p-4 font-mono font-medium text-slate-800">{api.path}</td>
                        <td className="p-3 md:p-4 text-slate-500">{api.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-red-500 text-xs">Failed to fetch API directory listings</p>
            )}
          </div>
        )}

        {/* TAB 4: LEGAL DOCUMENTS & REGULATORY DATA POLICIES */}
        {activeTab === "legal" && (
          <div className="space-y-6 text-slate-700 animate-fade-in text-xs leading-relaxed">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-4 mb-4">
              <ShieldCheck className="text-emerald-500 w-6 h-6 shrink-0" />
              <div>
                <h3 className="font-display font-bold text-base text-slate-800">Compliance & Mental Health Privacy Guard</h3>
                <p className="text-slate-500 text-[11px]">TalkItThrough adheres seamlessly to Nigeria Data Protection Regulation (NDPR 2019), GDPR, and CCPA standards.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-[11px]">
              
              <div className="space-y-4 bg-slate-50 p-5 border border-slate-200 rounded-xl max-h-[400px] overflow-y-auto">
                <h4 className="font-display font-bold text-brand-charcoal border-b border-slate-200 pb-2 flex items-center justify-between text-xs">
                  <span>TERMS & CONDITIONS (T&C) template</span>
                  <button onClick={() => handleCopy("TalkItThrough T&C", "tc")} className="text-[10px] text-slate-500 hover:text-slate-800 flex items-center gap-1 font-sans">
                    <Copy className="w-3 h-3" /> Copy
                  </button>
                </h4>
                <div className="space-y-2.5 font-mono text-[10px] text-slate-600">
                  <p className="font-bold">SECTION 1: NATURE OF THE SERVICE</p>
                  <p>TalkItThrough is a digital supportive ecosystem. <b>IT DOES NOT PROVIDE LICENSED CLINICAL THERAPY, MEDICAL ADVICE, OR PROFESSIONAL DIAGNOSIS.</b> The in-app chat is an AI-powered peer companion designed for emotional journaling and stress containment. All advice is conversational and best-effort.</p>
                  
                  <p className="font-bold text-red-500">SECTION 2: CRISIS DISCLAIMER & EMERGENCY ACTIONS</p>
                  <p className="border-l-2 border-red-400 pl-2 bg-red-50/50 text-slate-700">If you are thinking about self-harm or suicide, or struggling with extreme mental clinical crises, you agree to immediately log off this app and contact the emergency services. TalkItThrough is not an emergency clinical responder.</p>
                  
                  <p className="font-bold">SECTION 3: ELIGIBILITY & USER ACCOUNTS</p>
                  <p>Accounts are strictly restricted to males aged 18 and older. Standard password protection mandates the user maintains unique and hashed credentials. TalkItThrough is not responsible for credentials compromise.</p>

                  <p className="font-bold">SECTION 4: PAYMENTS & DONATIONS</p>
                  <p>Merchandise and donations are processed via external PCI-DSS compliant providers (Stripe/Paystack). 100% of profits are distributed directly towards backing NGO health initiatives and mental subsidies in Ibadan.</p>

                  <p className="font-bold">SECTION 5: INDEMNIFICATION & CAPPED LIABILITY</p>
                  <p>To the maximum extent under global laws, the app creators are not liable for direct, incidental, psychological, or consequential outcomes resulting from accessing our AI model outputs or group boards.</p>
                </div>
              </div>

              <div className="space-y-4 bg-slate-50 p-5 border border-slate-200 rounded-xl max-h-[400px] overflow-y-auto">
                <h4 className="font-display font-bold text-brand-charcoal border-b border-slate-200 pb-2 flex items-center justify-between text-xs">
                  <span>GDPR / CCPA / NDPR PRIVACY POLICY</span>
                  <button onClick={() => handleCopy("TalkItThrough Privacy Policy", "pp")} className="text-[10px] text-slate-500 hover:text-slate-800 flex items-center gap-1 font-sans">
                    <Copy className="w-3 h-3" /> Copy
                  </button>
                </h4>
                <div className="space-y-2.5 font-mono text-[10px] text-slate-600">
                  <p className="font-bold">SECTION 1: SENSITIVE DATA ENCRYPTION</p>
                  <p>Personal variables (e.g., first names, email addresses, phone contacts) and private conversational notes are stored using robust encryption algorithms (AES-256) at rest. No system engineers have access to cleartext counseling logs.</p>

                  <p className="font-bold">SECTION 2: GDPR ARTICLE 15-22 INTEGRATED CONTROLS</p>
                  <p>Users hold the absolute legal right to:
                    <br />1. Access & Export records in structured JSON.
                    <br />2. Rectify wrong contact information instantly.
                    <br />3. Execute the "Right to Erasure" (erasure triggers scrub of users, chat logs, and mood history in our live database within 1 cycle).
                  </p>

                  <p className="font-bold">SECTION 3: DATA RETENTION SCHEDULES</p>
                  <p>Registered account logs remain archived for 5 years after the last active session to comply with legal record frameworks. Stale anonymous support room chats purge after 1 year automatically.</p>

                  <p className="font-bold">SECTION 4: NO-SALE PROMOTION & COOKIES</p>
                  <p>We do not sell, rent, or lease personal identifiers to demographic marketers. Essential cookies are leveraged strictly to track login security. Analytics cookies can be opted-out instantly.</p>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
