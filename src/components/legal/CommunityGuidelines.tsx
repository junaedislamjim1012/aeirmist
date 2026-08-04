import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, ShieldCheck, HeartHandshake, FileText, Ban, AlertTriangle, HelpCircle } from 'lucide-react';

const CommunityGuidelines: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen text-white/90 bg-[#030712] relative overflow-y-auto no-scrollbar pb-16">
      {/* Ambient glowing fields */}
      <div className="fixed top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-aeirmist-cyan/5 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-aeirmist-magenta/5 rounded-full blur-[140px] pointer-events-none z-0" />

      {/* Persistent Header */}
      <header className="sticky top-0 z-50 bg-[#030712]/80 backdrop-blur-xl border-b border-white/5 py-4 px-6 flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-white/70 hover:text-white transition-all flex items-center justify-center cursor-pointer"
          title="Back"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-sm md:text-base font-display font-bold uppercase tracking-[0.25em] bg-gradient-to-r from-aeirmist-cyan to-aeirmist-magenta bg-clip-text text-transparent">
            Community Guidelines
          </h1>
          <p className="text-[8px] md:text-[9px] text-white/30 uppercase tracking-[0.2em] font-bold mt-0.5">
            Community Guidelines
          </p>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-4xl mx-auto px-6 pt-12 relative z-10 space-y-10">
        
        {/* Page Hero */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-aeirmist-cyan/10 border border-aeirmist-cyan/25">
            <span className="w-1.5 h-1.5 rounded-full bg-aeirmist-cyan animate-pulse shadow-[0_0_8px_rgba(0,242,255,0.7)]" />
            <span className="text-[9px] font-mono text-aeirmist-cyan font-bold uppercase tracking-widest">July 2026</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent uppercase">
            AEIRMIST COMMUNITY GUIDELINES
          </h1>
          <p className="text-xs text-white/40 font-mono tracking-widest uppercase">
            Last updated: July 2026
          </p>
        </div>

        {/* Introduction */}
        <div className="glass-panel p-8 rounded-[2.5rem] border border-white/5 bg-white/[0.01] backdrop-blur-md space-y-4 leading-relaxed text-xs md:text-sm text-white/70">
          <p>
            Aeirmist is a platform where people connect, communicate, create, and share their Loop — their moments, ideas, creativity, and communities. To keep that space safe, welcoming, and genuine for everyone, every person on Aeirmist agrees to follow these guidelines. They apply to all content and behavior on the platform: posts, Stories, comments, messages, group chats, profiles, usernames, live broadcasts, and the Aeirmist Marketplace — and they apply regardless of the language used.
          </p>
          <p>
            Content intended to evade moderation through alternative spellings, symbols, or coded language may still violate these rules. The examples given throughout this document are illustrative and not exhaustive — content substantially similar in nature may also violate these Community Guidelines even if not specifically listed.
          </p>
          <p>
            Violating these guidelines can result in content removal, warnings, feature restrictions, temporary suspension, or permanent account termination, depending on severity — see Enforcement below.
          </p>
        </div>

        {/* Guidelines Grid */}
        <div className="space-y-6">

          {/* 1. ELIGIBILITY */}
          <div className="glass-panel p-6 md:p-8 rounded-3xl border border-white/5 bg-white/[0.01] backdrop-blur-md space-y-4">
            <h2 className="text-base md:text-lg font-bold uppercase tracking-widest text-aeirmist-cyan flex items-center gap-3">
              <span className="text-xs font-mono text-white/30">01 /</span> Eligibility
            </h2>
            <ul className="list-disc list-inside pl-2 space-y-2 text-xs md:text-sm text-white/70 leading-relaxed">
              <li>You must be at least 13 years old to create an Aeirmist account (or the minimum age required by the laws of your country, if higher).</li>
              <li>If you are under 18, you should have a parent or guardian's permission to use Aeirmist.</li>
              <li>You may only create and use an account that represents you — accounts must not be created for a child under the minimum age by an adult on their behalf.</li>
              <li>One person may not maintain multiple accounts for the purpose of evading a suspension, manipulating engagement, or harassing others.</li>
            </ul>
          </div>

          {/* 2. AUTHENTICITY */}
          <div className="glass-panel p-6 md:p-8 rounded-3xl border border-white/5 bg-white/[0.01] backdrop-blur-md space-y-4">
            <h2 className="text-base md:text-lg font-bold uppercase tracking-widest text-aeirmist-cyan flex items-center gap-3">
              <span className="text-xs font-mono text-white/30">02 /</span> Authenticity
            </h2>
            <ul className="list-disc list-inside pl-2 space-y-2 text-xs md:text-sm text-white/70 leading-relaxed">
              <li>No impersonation. Do not create an account or post content pretending to be another real person, brand, or organization in a misleading way.</li>
              <li>No fake engagement. Do not use bots, purchased followers, engagement pods, or automation tools to artificially inflate likes, follows, views, or comments.</li>
              <li>No coordinated inauthentic behavior. Do not operate networks of fake or duplicate accounts to mislead others about popularity, identity, or intent.</li>
              <li>Profile pictures, usernames, and bios should not be used to deceive others about who you are.</li>
            </ul>
            <div className="pt-2 border-t border-white/5 space-y-2">
              <h3 className="text-xs md:text-sm font-bold uppercase tracking-wider text-aeirmist-magenta flex items-center gap-2">
                <ShieldCheck className="text-aeirmist-cyan shrink-0" size={14} /> Fake Verification
              </h3>
              <ul className="list-disc list-inside pl-2 space-y-2 text-xs md:text-sm text-white/70 leading-relaxed">
                <li>Users may not falsely claim to be verified or imply an official/verified status they do not have.</li>
                <li>Fake, purchased, or imitation verification badges — including edited screenshots or icons designed to resemble Aeirmist's verification mark — are prohibited.</li>
              </ul>
            </div>
          </div>

          {/* 3. USERNAMES */}
          <div className="glass-panel p-6 md:p-8 rounded-3xl border border-white/5 bg-white/[0.01] backdrop-blur-md space-y-4">
            <h2 className="text-base md:text-lg font-bold uppercase tracking-widest text-aeirmist-cyan flex items-center gap-3">
              <span className="text-xs font-mono text-white/30">03 /</span> Usernames
            </h2>
            <p className="text-xs md:text-sm text-white/50 pl-2">Usernames may not:</p>
            <ul className="list-disc list-inside pl-2 space-y-2 text-xs md:text-sm text-white/70 leading-relaxed">
              <li>Impersonate Aeirmist, its staff, or official Aeirmist accounts/branding.</li>
              <li>Impersonate government agencies, law enforcement, or public institutions.</li>
              <li>Contain hate speech or slurs.</li>
              <li>Promote scams, fraudulent schemes, or illegal goods/services.</li>
            </ul>
          </div>

          {/* 4. PROFILE CONTENT */}
          <div className="glass-panel p-6 md:p-8 rounded-3xl border border-white/5 bg-white/[0.01] backdrop-blur-md space-y-4">
            <h2 className="text-base md:text-lg font-bold uppercase tracking-widest text-aeirmist-cyan flex items-center gap-3">
              <span className="text-xs font-mono text-white/30">04 /</span> Profile Content
            </h2>
            <p className="text-xs md:text-sm text-white/70 pl-2 leading-relaxed">
              Your profile bio, profile picture, cover photo, and status are all public-facing content and are moderated under these same guidelines — the standards for hate speech, nudity, harassment, and impersonation described throughout this document apply to every part of your profile, not just your posts.
            </p>
          </div>

          {/* 5. PRIVACY */}
          <div className="glass-panel p-6 md:p-8 rounded-3xl border border-white/5 bg-white/[0.01] backdrop-blur-md space-y-4">
            <h2 className="text-base md:text-lg font-bold uppercase tracking-widest text-aeirmist-cyan flex items-center gap-3">
              <span className="text-xs font-mono text-white/30">05 /</span> Privacy
            </h2>
            <p className="text-xs md:text-sm text-white/50 pl-2">Respect the privacy of others. Do not share another person's private information without their consent, including:</p>
            <ul className="list-disc list-inside pl-2 space-y-2 text-xs md:text-sm text-white/70 leading-relaxed">
              <li>Home addresses</li>
              <li>Phone numbers</li>
              <li>Email addresses</li>
              <li>Government-issued identification</li>
              <li>Financial information</li>
              <li>Medical records</li>
              <li>Private conversations</li>
              <li>Private photos or videos</li>
            </ul>
            <p className="text-xs md:text-sm text-white/50 pl-2 pt-2 border-t border-white/5">
              Even if the information is publicly available elsewhere, using it to harass or intimidate others may violate these guidelines.
            </p>
          </div>

          {/* 6. SAFETY & RESPECTFUL CONDUCT */}
          <div className="glass-panel p-6 md:p-8 rounded-3xl border border-white/5 bg-white/[0.01] backdrop-blur-md space-y-6">
            <h2 className="text-base md:text-lg font-bold uppercase tracking-widest text-aeirmist-cyan flex items-center gap-3">
              <span className="text-xs font-mono text-white/30">06 /</span> Safety & Respectful Conduct
            </h2>
            
            <div className="space-y-3">
              <h3 className="text-xs md:text-sm font-bold uppercase tracking-wider text-aeirmist-magenta">Harassment & Bullying</h3>
              <ul className="list-disc list-inside pl-2 space-y-2 text-xs md:text-sm text-white/70 leading-relaxed">
                <li>Do not target another person with repeated unwanted contact, threats, degrading comments, or content designed to shame, humiliate, or intimidate them.</li>
                <li>Do not organize or participate in "pile-on" harassment against an individual.</li>
                <li>Sharing someone's private information without consent (addresses, phone numbers, private photos, financial details) — doxxing — is strictly prohibited.</li>
              </ul>
            </div>

            <div className="space-y-3 pt-4 border-t border-white/5">
              <h3 className="text-xs md:text-sm font-bold uppercase tracking-wider text-aeirmist-magenta">Hate Speech & Discrimination</h3>
              <p className="text-xs md:text-sm text-white/70 pl-2 leading-relaxed">
                Content that attacks, demeans, or incites hatred against people based on race, ethnicity, national origin, religion, caste, sexual orientation, gender identity, disability, or serious illness is not allowed — including slurs, dehumanizing comparisons, and hateful symbols or imagery.
              </p>
            </div>

            <div className="space-y-3 pt-4 border-t border-white/5">
              <h3 className="text-xs md:text-sm font-bold uppercase tracking-wider text-aeirmist-magenta">Violence & Dangerous Content</h3>
              <ul className="list-disc list-inside pl-2 space-y-2 text-xs md:text-sm text-white/70 leading-relaxed">
                <li>No credible threats of violence against any person or group.</li>
                <li>No glorification, promotion, or instruction for terrorism, organized crime, or violent extremism.</li>
                <li>No graphic gore or violent content shared to shock, glorify suffering, or incite harm.</li>
                <li>No content that provides instructions for making weapons, explosives, or other tools intended to cause mass harm.</li>
              </ul>
            </div>

            <div className="space-y-3 pt-4 border-t border-white/5">
              <h3 className="text-xs md:text-sm font-bold uppercase tracking-wider text-aeirmist-magenta">Self-Harm & Suicide</h3>
              <ul className="list-disc list-inside pl-2 space-y-2 text-xs md:text-sm text-white/70 leading-relaxed">
                <li>Content that promotes, glorifies, or gives instructions for suicide, self-harm, or eating disorders is not allowed.</li>
                <li>If you or someone you know is struggling, Aeirmist supports connecting with local crisis helplines. This is a safety issue we take seriously and will act on quickly, prioritizing getting help to people who need it over strict enforcement.</li>
              </ul>
            </div>

            <div className="space-y-3 pt-4 border-t border-white/5">
              <h3 className="text-xs md:text-sm font-bold uppercase tracking-wider text-aeirmist-magenta">Child Safety</h3>
              <ul className="list-disc list-inside pl-2 space-y-2 text-xs md:text-sm text-white/70 leading-relaxed">
                <li>Aeirmist has zero tolerance for content that sexualizes, exploits, or endangers minors in any way.</li>
                <li>Any account found sharing, soliciting, or facilitating child sexual abuse material (CSAM) will be permanently banned immediately and reported to the National Center for Missing & Exploited Children (NCMEC) and relevant law enforcement, as required by law.</li>
                <li>Grooming behavior, or attempts to arrange in-person meetings with minors for inappropriate purposes, will result in immediate and permanent removal.</li>
              </ul>
            </div>
          </div>

          {/* 7. NUDITY & SENSITIVE CONTENT */}
          <div className="glass-panel p-6 md:p-8 rounded-3xl border border-white/5 bg-white/[0.01] backdrop-blur-md space-y-4">
            <h2 className="text-base md:text-lg font-bold uppercase tracking-widest text-aeirmist-cyan flex items-center gap-3">
              <span className="text-xs font-mono text-white/30">07 /</span> Nudity & Sensitive Content
            </h2>
            <ul className="list-disc list-inside pl-2 space-y-2 text-xs md:text-sm text-white/70 leading-relaxed">
              <li>Aeirmist is not a platform for pornography or explicit sexual content. Content depicting real or simulated sexual acts, or explicit nudity, is not allowed.</li>
              <li>Non-consensual intimate imagery ("revenge porn") is strictly prohibited and will result in immediate account termination and content removal.</li>
              <li>Artistic, educational, health-related, or breastfeeding-related content involving nudity is generally permitted with appropriate context, but sexually explicit framing is not.</li>
            </ul>
            <div className="pt-2 border-t border-white/5 space-y-2">
              <h3 className="text-xs md:text-sm font-bold uppercase tracking-wider text-aeirmist-magenta">Additional Sensitive Content</h3>
              <p className="text-xs md:text-sm text-white/50 pl-2">The following must be clearly marked as sensitive/graphic where the app supports it, or may otherwise be removed:</p>
              <ul className="list-disc list-inside pl-2 space-y-2 text-xs md:text-sm text-white/70 leading-relaxed">
                <li>Graphic medical procedures</li>
                <li>Animal abuse or cruelty</li>
                <li>Graphic injuries</li>
                <li>Extreme gore</li>
              </ul>
            </div>
          </div>

          {/* 8. AI-GENERATED & SYNTHETIC CONTENT */}
          <div className="glass-panel p-6 md:p-8 rounded-3xl border border-white/5 bg-white/[0.01] backdrop-blur-md space-y-4">
            <h2 className="text-base md:text-lg font-bold uppercase tracking-widest text-aeirmist-cyan flex items-center gap-3">
              <span className="text-xs font-mono text-white/30">08 /</span> AI-Generated & Synthetic Content
            </h2>
            <p className="text-xs md:text-sm text-white/50 pl-2">Users may share AI-generated content for creative purposes. However:</p>
            <ul className="list-disc list-inside pl-2 space-y-2 text-xs md:text-sm text-white/70 leading-relaxed">
              <li>AI-generated media must not be used to impersonate real people.</li>
              <li>AI content intended to deceive users is prohibited.</li>
              <li>Deepfake videos or voices used to mislead others may be removed.</li>
              <li>AI-generated explicit imagery involving real individuals is strictly prohibited.</li>
            </ul>
          </div>

          {/* 9. INTELLECTUAL PROPERTY */}
          <div className="glass-panel p-6 md:p-8 rounded-3xl border border-white/5 bg-white/[0.01] backdrop-blur-md space-y-4">
            <h2 className="text-base md:text-lg font-bold uppercase tracking-widest text-aeirmist-cyan flex items-center gap-3">
              <span className="text-xs font-mono text-white/30">09 /</span> Intellectual Property
            </h2>
            <ul className="list-disc list-inside pl-2 space-y-2 text-xs md:text-sm text-white/70 leading-relaxed">
              <li>Only post content you created or have the rights/permission to share.</li>
              <li>Do not upload copyrighted music, video, images, or text you don't own or have a license for.</li>
              <li>Impersonating a brand's official presence or misusing trademarks to mislead users is not allowed.</li>
              <li>Aeirmist responds to valid copyright removal requests from rights holders. Users may submit counter-notifications where applicable by law.</li>
              <li>Repeated copyright infringement may result in account suspension or termination.</li>
            </ul>
          </div>

          {/* 10. MISINFORMATION & MANIPULATED MEDIA */}
          <div className="glass-panel p-6 md:p-8 rounded-3xl border border-white/5 bg-white/[0.01] backdrop-blur-md space-y-4">
            <h2 className="text-base md:text-lg font-bold uppercase tracking-widest text-aeirmist-cyan flex items-center gap-3">
              <span className="text-xs font-mono text-white/30">10 /</span> Misinformation & Manipulated Media
            </h2>
            <ul className="list-disc list-inside pl-2 space-y-2 text-xs md:text-sm text-white/70 leading-relaxed">
              <li>Do not knowingly share false information likely to cause real-world harm (e.g., false health claims, fabricated emergency alerts, election misinformation).</li>
              <li>Manipulated media (deepfakes, digitally altered images/video) presented as authentic and intended to deceive is not allowed. Clearly labeled satire, parody, or creative editing is fine.</li>
            </ul>
          </div>

          {/* 11. HEALTH & MEDICAL INFORMATION */}
          <div className="glass-panel p-6 md:p-8 rounded-3xl border border-white/5 bg-white/[0.01] backdrop-blur-md space-y-4">
            <h2 className="text-base md:text-lg font-bold uppercase tracking-widest text-aeirmist-cyan flex items-center gap-3">
              <span className="text-xs font-mono text-white/30">11 /</span> Health & Medical Information
            </h2>
            <p className="text-xs md:text-sm text-white/70 pl-2 leading-relaxed">
              Content promoting dangerous medical misinformation or discouraging people from seeking legitimate medical care may be removed.
            </p>
          </div>

          {/* 12. CIVIC INTEGRITY */}
          <div className="glass-panel p-6 md:p-8 rounded-3xl border border-white/5 bg-white/[0.01] backdrop-blur-md space-y-4">
            <h2 className="text-base md:text-lg font-bold uppercase tracking-widest text-aeirmist-cyan flex items-center gap-3">
              <span className="text-xs font-mono text-white/30">12 /</span> Civic Integrity
            </h2>
            <p className="text-xs md:text-sm text-white/70 pl-2 leading-relaxed">
              Content intended to interfere with elections, voting processes, or public institutions through deception may be subject to removal.
            </p>
          </div>

          {/* 13. FINANCIAL FRAUD */}
          <div className="glass-panel p-6 md:p-8 rounded-3xl border border-white/5 bg-white/[0.01] backdrop-blur-md space-y-4">
            <h2 className="text-base md:text-lg font-bold uppercase tracking-widest text-aeirmist-cyan flex items-center gap-3">
              <span className="text-xs font-mono text-white/30">13 /</span> Financial Fraud
            </h2>
            <p className="text-xs md:text-sm text-white/50 pl-2">Users may not:</p>
            <ul className="list-disc list-inside pl-2 space-y-2 text-xs md:text-sm text-white/70 leading-relaxed">
              <li>Create fake giveaways.</li>
              <li>Impersonate banks or financial institutions.</li>
              <li>Promote fake investment opportunities or pyramid/Ponzi schemes.</li>
              <li>Run cryptocurrency scams.</li>
              <li>Share fake payment screenshots.</li>
              <li>Offer or promote fake escrow services.</li>
            </ul>
          </div>

          {/* 14. AEIRMIST MARKETPLACE */}
          <div className="glass-panel p-6 md:p-8 rounded-3xl border border-white/5 bg-white/[0.01] backdrop-blur-md space-y-6">
            <h2 className="text-base md:text-lg font-bold uppercase tracking-widest text-aeirmist-cyan flex items-center gap-3">
              <span className="text-xs font-mono text-white/30">14 /</span> Aeirmist Marketplace
            </h2>
            <ul className="list-disc list-inside pl-2 space-y-2 text-xs md:text-sm text-white/70 leading-relaxed">
              <li>Sellers must accurately describe products and their condition.</li>
              <li>Counterfeit goods are prohibited.</li>
              <li>Fraudulent listings are prohibited.</li>
              <li>Repeated scams may result in permanent removal from the Marketplace and the platform.</li>
            </ul>

            <div className="space-y-3 pt-4 border-t border-white/5">
              <h3 className="text-xs md:text-sm font-bold uppercase tracking-wider text-aeirmist-magenta">Digital Goods</h3>
              <ul className="list-disc list-inside pl-2 space-y-2 text-xs md:text-sm text-white/70 leading-relaxed">
                <li>Digital products must accurately represent what buyers will receive.</li>
                <li>Fraudulent digital listings are prohibited.</li>
              </ul>
            </div>

            <div className="space-y-3 pt-4 border-t border-white/5">
              <h3 className="text-xs md:text-sm font-bold uppercase tracking-wider text-aeirmist-magenta">Reviews</h3>
              <p className="text-xs md:text-sm text-white/70 pl-2 leading-relaxed">
                Users may not manipulate product reviews or post fake reviews to deceive buyers.
              </p>
            </div>

            <div className="space-y-3 pt-4 border-t border-white/5">
              <h3 className="text-xs md:text-sm font-bold uppercase tracking-wider text-aeirmist-magenta">Marketplace Transactions</h3>
              <ul className="list-disc list-inside pl-2 space-y-2 text-xs md:text-sm text-white/70 leading-relaxed">
                <li>Aeirmist provides the platform for buyers and sellers. Unless explicitly stated, Aeirmist is not the seller of products listed by users.</li>
                <li>Buyers and sellers remain responsible for fulfilling applicable legal obligations.</li>
              </ul>
            </div>
          </div>

          {/* 15. ILLEGAL SERVICES */}
          <div className="glass-panel p-6 md:p-8 rounded-3xl border border-white/5 bg-white/[0.01] backdrop-blur-md space-y-4">
            <h2 className="text-base md:text-lg font-bold uppercase tracking-widest text-aeirmist-cyan flex items-center gap-3">
              <span className="text-xs font-mono text-white/30">15 /</span> Illegal Services
            </h2>
            <p className="text-xs md:text-sm text-white/50 pl-2">Users may not buy, sell, advertise, or facilitate illegal services, including but not limited to:</p>
            <ul className="list-disc list-inside pl-2 space-y-2 text-xs md:text-sm text-white/70 leading-relaxed">
              <li>Hacking services</li>
              <li>Fake documents</li>
              <li>Identity theft</li>
              <li>Stolen accounts</li>
              <li>Malware</li>
              <li>Credential theft</li>
              <li>Money laundering</li>
              <li>Human trafficking</li>
              <li>Exploitation services</li>
            </ul>
          </div>

          {/* 16. ADVERTISING */}
          <div className="glass-panel p-6 md:p-8 rounded-3xl border border-white/5 bg-white/[0.01] backdrop-blur-md space-y-4">
            <h2 className="text-base md:text-lg font-bold uppercase tracking-widest text-aeirmist-cyan flex items-center gap-3">
              <span className="text-xs font-mono text-white/30">16 /</span> Advertising
            </h2>
            <ul className="list-disc list-inside pl-2 space-y-2 text-xs md:text-sm text-white/70 leading-relaxed">
              <li>Paid promotions and sponsored content must comply with applicable laws and clearly disclose that they are advertisements where required.</li>
              <li>Misleading advertisements are prohibited.</li>
            </ul>
          </div>

          {/* 17. REGULATED & ILLEGAL GOODS */}
          <div className="glass-panel p-6 md:p-8 rounded-3xl border border-white/5 bg-white/[0.01] backdrop-blur-md space-y-4">
            <h2 className="text-base md:text-lg font-bold uppercase tracking-widest text-aeirmist-cyan flex items-center gap-3">
              <span className="text-xs font-mono text-white/30">17 /</span> Regulated & Illegal Goods
            </h2>
            <ul className="list-disc list-inside pl-2 space-y-2 text-xs md:text-sm text-white/70 leading-relaxed">
              <li>Do not use Aeirmist to sell, promote, or facilitate access to illegal drugs, weapons, counterfeit goods, or other content illegal in the regions Aeirmist operates in.</li>
              <li>Content promoting illegal gambling or unlicensed financial schemes is not allowed.</li>
            </ul>
          </div>

          {/* 18. SPAM & PLATFORM INTEGRITY */}
          <div className="glass-panel p-6 md:p-8 rounded-3xl border border-white/5 bg-white/[0.01] backdrop-blur-md space-y-6">
            <h2 className="text-base md:text-lg font-bold uppercase tracking-widest text-aeirmist-cyan flex items-center gap-3">
              <span className="text-xs font-mono text-white/30">18 /</span> Spam & Platform Integrity
            </h2>
            <ul className="list-disc list-inside pl-2 space-y-2 text-xs md:text-sm text-white/70 leading-relaxed">
              <li>No mass unsolicited messaging, repetitive posting, or link spam.</li>
              <li>No phishing, scam links, or content designed to steal login credentials or financial information.</li>
              <li>No exploiting bugs, using unauthorized third-party tools, or scraping the platform in ways that harm other users or the service.</li>
            </ul>

            <div className="space-y-3 pt-4 border-t border-white/5">
              <h3 className="text-xs md:text-sm font-bold uppercase tracking-wider text-aeirmist-magenta">Automation</h3>
              <p className="text-xs md:text-sm text-white/50 pl-2">The following are prohibited:</p>
              <ul className="list-disc list-inside pl-2 space-y-2 text-xs md:text-sm text-white/70 leading-relaxed">
                <li>Automated posting</li>
                <li>Scraping</li>
                <li>Unauthorized API usage</li>
                <li>Bot farms</li>
              </ul>
            </div>
          </div>

          {/* 19. MESSAGING & GROUP CHATS */}
          <div className="glass-panel p-6 md:p-8 rounded-3xl border border-white/5 bg-white/[0.01] backdrop-blur-md space-y-4">
            <h2 className="text-base md:text-lg font-bold uppercase tracking-widest text-aeirmist-cyan flex items-center gap-3">
              <span className="text-xs font-mono text-white/30">19 /</span> Messaging & Group Chats
            </h2>
            <ul className="list-disc list-inside pl-2 space-y-2 text-xs md:text-sm text-white/70 leading-relaxed">
              <li>The same standards for harassment, hate speech, and safety apply in private messages and group chats — reports from these spaces are reviewed the same way as public posts.</li>
              <li>Group admins are expected to moderate their own spaces reasonably; repeated failure to address abuse in a group may result in restrictions on that group.</li>
              <li>Do not use Aeirmist's calling or messaging features to harass, stalk, or repeatedly contact someone who has asked you to stop.</li>
              <li>Repeated unsolicited DMs, mass follow-unfollow behavior, mass invites, and auto-messaging are prohibited.</li>
            </ul>
          </div>

          {/* 20. LIVE BROADCASTS */}
          <div className="glass-panel p-6 md:p-8 rounded-3xl border border-white/5 bg-white/[0.01] backdrop-blur-md space-y-4">
            <h2 className="text-base md:text-lg font-bold uppercase tracking-widest text-aeirmist-cyan flex items-center gap-3">
              <span className="text-xs font-mono text-white/30">20 /</span> Live Broadcasts
            </h2>
            <p className="text-xs md:text-sm text-white/70 pl-2 leading-relaxed">
              All Community Guidelines apply equally during live broadcasts. Repeated or severe violations during a live stream may result in the stream being immediately terminated, in addition to any other enforcement action.
            </p>
          </div>

          {/* 21. ACCOUNT SECURITY */}
          <div className="glass-panel p-6 md:p-8 rounded-3xl border border-white/5 bg-white/[0.01] backdrop-blur-md space-y-4">
            <h2 className="text-base md:text-lg font-bold uppercase tracking-widest text-aeirmist-cyan flex items-center gap-3">
              <span className="text-xs font-mono text-white/30">21 /</span> Account Security
            </h2>
            <ul className="list-disc list-inside pl-2 space-y-2 text-xs md:text-sm text-white/70 leading-relaxed">
              <li>Users are responsible for maintaining the security of their own accounts.</li>
              <li>Sharing your login credentials with others is strongly discouraged.</li>
            </ul>
          </div>

          {/* 22. BAN EVASION */}
          <div className="glass-panel p-6 md:p-8 rounded-3xl border border-white/5 bg-white/[0.01] backdrop-blur-md space-y-4">
            <h2 className="text-base md:text-lg font-bold uppercase tracking-widest text-aeirmist-cyan flex items-center gap-3">
              <span className="text-xs font-mono text-white/30">22 /</span> Ban Evasion
            </h2>
            <p className="text-xs md:text-sm text-white/70 pl-2 leading-relaxed">
              Creating new accounts to avoid an enforcement action (such as a suspension or ban) is prohibited. Accounts created to evade enforcement may be removed immediately upon discovery, without additional warning.
            </p>
          </div>

          {/* 23. INACTIVE ACCOUNTS */}
          <div className="glass-panel p-6 md:p-8 rounded-3xl border border-white/5 bg-white/[0.01] backdrop-blur-md space-y-4">
            <h2 className="text-base md:text-lg font-bold uppercase tracking-widest text-aeirmist-cyan flex items-center gap-3">
              <span className="text-xs font-mono text-white/30">23 /</span> Inactive Accounts
            </h2>
            <p className="text-xs md:text-sm text-white/70 pl-2 leading-relaxed">
              Aeirmist may reclaim inactive usernames after an extended period of inactivity, to keep usernames available across the community.
            </p>
          </div>

          {/* 24. SECURITY RESEARCH */}
          <div className="glass-panel p-6 md:p-8 rounded-3xl border border-white/5 bg-white/[0.01] backdrop-blur-md space-y-4">
            <h2 className="text-base md:text-lg font-bold uppercase tracking-widest text-aeirmist-cyan flex items-center gap-3">
              <span className="text-xs font-mono text-white/30">24 /</span> Security Research
            </h2>
            <p className="text-xs md:text-sm text-white/70 pl-2 leading-relaxed">
              Responsible, good-faith vulnerability disclosure is encouraged. Exploitation of vulnerabilities for unauthorized access, data theft, or disruption of the service is prohibited and may be referred to law enforcement.
            </p>
          </div>

          {/* 25. REPORTING & APPEALS */}
          <div className="glass-panel p-6 md:p-8 rounded-3xl border border-white/5 bg-white/[0.01] backdrop-blur-md space-y-4">
            <h2 className="text-base md:text-lg font-bold uppercase tracking-widest text-aeirmist-cyan flex items-center gap-3">
              <span className="text-xs font-mono text-white/30">25 /</span> Reporting & Appeals
            </h2>
            <ul className="list-disc list-inside pl-2 space-y-2 text-xs md:text-sm text-white/70 leading-relaxed">
              <li>If you see content or behavior that violates these guidelines, use the Report option available on posts, comments, profiles, and messages.</li>
              <li>Knowingly submitting false abuse reports in order to harm another user may itself result in enforcement action.</li>
              <li>If you believe your content was removed or your account was actioned in error, you may submit an appeal through Settings → Support → Appeal a Decision. Most appeals are reviewed within 7 days; complex cases may take longer. Submitting multiple duplicate appeals for the same decision may delay the review process.</li>
            </ul>
          </div>

          {/* 26. ENFORCEMENT */}
          <div className="glass-panel p-6 md:p-8 rounded-3xl border border-white/5 bg-white/[0.01] backdrop-blur-md space-y-6">
            <h2 className="text-base md:text-lg font-bold uppercase tracking-widest text-aeirmist-cyan flex items-center gap-3">
              <span className="text-xs font-mono text-white/30">26 /</span> Enforcement
            </h2>
            
            <p className="text-xs md:text-sm text-white/70 pl-2 leading-relaxed">
              Depending on the severity and context of a violation, Aeirmist may take one or more of the following actions:
            </p>

            {/* Responsive Table Wrapper */}
            <div className="overflow-x-auto w-full border border-white/10 rounded-2xl bg-white/[0.01]">
              <table className="w-full border-collapse text-left min-w-[500px]">
                <thead>
                  <tr className="bg-white/5 border-b border-white/10">
                    <th className="p-4 text-[10px] font-black uppercase tracking-wider text-white/60 w-1/3">Action</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-wider text-white/60">When it applies</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <tr className="hover:bg-white/[0.01] transition-colors">
                    <td className="p-4 text-[11px] font-bold uppercase tracking-wider text-aeirmist-cyan">Content removal</td>
                    <td className="p-4 text-[11px] text-white/70 leading-relaxed">A specific post, comment, story, or message violates guidelines</td>
                  </tr>
                  <tr className="hover:bg-white/[0.01] transition-colors">
                    <td className="p-4 text-[11px] font-bold uppercase tracking-wider text-amber-400">Warning</td>
                    <td className="p-4 text-[11px] text-white/70 leading-relaxed">First-time or lower-severity violations</td>
                  </tr>
                  <tr className="hover:bg-white/[0.01] transition-colors">
                    <td className="p-4 text-[11px] font-bold uppercase tracking-wider text-aeirmist-magenta">Feature restriction</td>
                    <td className="p-4 text-[11px] text-white/70 leading-relaxed">Temporary limits on posting, commenting, or messaging</td>
                  </tr>
                  <tr className="hover:bg-white/[0.01] transition-colors">
                    <td className="p-4 text-[11px] font-bold uppercase tracking-wider text-red-400">Account suspension</td>
                    <td className="p-4 text-[11px] text-white/70 leading-relaxed">Repeated or more serious violations</td>
                  </tr>
                  <tr className="hover:bg-white/[0.01] transition-colors">
                    <td className="p-4 text-[11px] font-black uppercase tracking-wider text-[#ff003c]">Permanent ban</td>
                    <td className="p-4 text-[11px] text-white/70 leading-relaxed">Severe violations (e.g., CSAM, credible threats, doxxing) or repeated offenses after warnings</td>
                  </tr>
                  <tr className="hover:bg-white/[0.01] transition-colors">
                    <td className="p-4 text-[11px] font-bold uppercase tracking-wider text-aeirmist-cyan flex items-center gap-1">
                      Verified badge removal
                    </td>
                    <td className="p-4 text-[11px] text-white/70 leading-relaxed">Misuse of verification or identity deception</td>
                  </tr>
                  <tr className="hover:bg-white/[0.01] transition-colors">
                    <td className="p-4 text-[11px] font-bold uppercase tracking-wider text-[#ff003c]">Law enforcement referral</td>
                    <td className="p-4 text-[11px] text-white/70 leading-relaxed">Where required by law (e.g., child safety, credible threats of violence)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="space-y-4 pt-4 border-t border-white/5 text-xs md:text-sm text-white/70 leading-relaxed">
              <p>
                We consider intent, context, severity, and history when deciding on enforcement action. Guidelines may be updated periodically as the platform grows; significant changes will be communicated to users.
              </p>
              <p>
                Aeirmist reserves the right to investigate behavior both on and off the platform when it presents a credible risk to the safety of our users or the integrity of the service, where permitted by applicable law. Enforcement decisions consider context, intent, severity, history, and potential real-world harm.
              </p>
              <p>
                These Community Guidelines form part of Aeirmist's Terms of Service. By using Aeirmist, you agree to comply with these Guidelines in addition to all applicable laws and regulations in your jurisdiction.
              </p>
              <p>
                These guidelines work alongside Aeirmist's Terms of Service and Privacy Policy. Together they govern your use of Aeirmist.
              </p>
            </div>
          </div>

        </div>

        {/* Footer info branding */}
        <div className="text-center pt-8 border-t border-white/5">
          <p className="text-[10px] text-white/20 uppercase tracking-[0.4em] font-bold">
            Constructed by Nova_X Cluster
          </p>
        </div>

      </div>
    </div>
  );
};

export default CommunityGuidelines;
