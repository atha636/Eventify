// ── Shared Blog Data ─────────────────────────────────────────────────
// Used by both Blogs.jsx (listing) and BlogDetail.jsx (article page)

export const CATEGORIES = ["All", "Wedding", "Corporate", "Decor", "Photography", "Catering", "Tips & Tricks"];

export const ALL_POSTS = [
  {
    id: 1,
    slug: "complete-guide-indian-wedding-2025",
    category: "Wedding",
    featured: true,
    title: "The Complete Guide to Planning Your Dream Indian Wedding in 2025",
    excerpt:
      "From finding the perfect venue to coordinating 500 guests across three days of ceremonies — we break down every step, timeline, and vendor checklist you need for an unforgettable shaadi.",
    author: "Akarsh Gupta & Atharv Patidar",
    authorRole: "CEO & C0-founder",
    authorInitial: "A",
    authorGradient: "135deg, #c9a84c 0%, #e8d5a3 100%",
    date: "April 18, 2025",
    readTime: "12 min read",
    tag: "Editor's Pick",
    emoji: "💒",
    accent: "#c9a84c",
    gradient: "135deg, #c9a84c 0%, #7b5ea7 100%",
    content: [
      {
        type: "intro",
        text: "Planning an Indian wedding is one of the most joyful — and complex — undertakings a family can take on. With multiple ceremonies spanning two to four days, hundreds of guests, and dozens of vendors to coordinate, it can feel overwhelming. But with the right framework, it becomes manageable, even magical.",
      },
      {
        type: "heading",
        text: "Start 12 Months Out: The Foundation",
      },
      {
        type: "paragraph",
        text: "The earlier you start, the more choices you have. At the 12-month mark, your primary focus should be locking in the big three: venue, date, and rough guest count. These three decisions affect everything else — from the number of caterers you need to the size of the décor team.",
      },
      {
        type: "paragraph",
        text: "Begin by setting a realistic budget. In India, weddings typically cost between ₹10 lakh for intimate gatherings to ₹2 crore+ for grand celebrations. Be honest about what you can spend and allocate roughly: 30% venue, 20% catering, 15% décor, 15% photography & videography, 10% outfits & jewellery, 10% miscellaneous.",
      },
      {
        type: "callout",
        emoji: "💡",
        text: "Pro tip: Always keep 10–15% of your budget as a contingency fund. Unexpected costs are not the exception — they are the rule.",
      },
      {
        type: "heading",
        text: "9 Months Out: Vendor Sourcing",
      },
      {
        type: "paragraph",
        text: "With your venue confirmed, you can now approach vendors with confidence. Start with your photographer and videographer — good ones book up 8–12 months in advance. View their full portfolios, not just highlight reels. Ask to see a complete wedding album from a recent event.",
      },
      {
        type: "paragraph",
        text: "Next, shortlist caterers. For an Indian wedding, you likely need specialists: one team for the main reception, possibly another for the Mehendi and Haldi. Insist on a tasting session before signing any contract. A caterer who is resistant to tastings is a red flag.",
      },
      {
        type: "list",
        heading: "The 9-Month Vendor Checklist",
        items: [
          "Photographer & videographer (book first — they fill up fastest)",
          "Main catering team confirmed with tasting scheduled",
          "Décor vendor shortlisted — review at least 3 portfolios",
          "Mehendi artist booked (the best ones have 6-month waitlists)",
          "Wedding planner or coordinator if using one",
          "DJ or live music band",
          "Hair & makeup artists for bride and close family",
        ],
      },
      {
        type: "heading",
        text: "6 Months Out: The Details Come Together",
      },
      {
        type: "paragraph",
        text: "At this stage you should finalise your invitation design and guest list. In Indian weddings, the guest list has a way of expanding — budget for 10–20% more guests than your initial count. Invitations should go out 6–8 weeks before the wedding for local guests, and 10–12 weeks for outstation or international guests.",
      },
      {
        type: "paragraph",
        text: "This is also the time to finalise your outfit selections. Bridal lehengas and sherwanis often require 4–6 months for custom tailoring. Do not leave this to the last minute — fittings take time, and alterations are almost always needed.",
      },
      {
        type: "callout",
        emoji: "📋",
        text: "Create a shared Google Sheet with your family. Divide responsibilities clearly — who is tracking RSVPs, who is coordinating with vendors on the day, who handles accommodation for outstation guests.",
      },
      {
        type: "heading",
        text: "1 Month Out: The Final Sprint",
      },
      {
        type: "paragraph",
        text: "Confirm every vendor in writing with a finalised timeline. Create a master schedule for each day of the wedding with exact timings: when the baraat arrives, when ceremonies begin, when the catering service starts, when the DJ plays, when pheras happen.",
      },
      {
        type: "paragraph",
        text: "Assign a point-of-contact (ideally a trusted family member or hired coordinator) who will manage vendor communication on the wedding days so the couple and parents can be present in the moment, not troubleshooting.",
      },
      {
        type: "list",
        heading: "Final Week Must-Dos",
        items: [
          "Confirm all vendor arrival times and payment schedules",
          "Ensure someone holds all final vendor payments in cash/UPI",
          "Pack an emergency kit: safety pins, double-sided tape, pain relief, energy snacks",
          "Brief your 'vendor coordinator' family member with the full schedule",
          "Get a full night's sleep the night before — you'll need it",
        ],
      },
      {
        type: "paragraph",
        text: "Remember: something will go slightly off-plan. That is the nature of large celebrations. What matters is not perfection — it is presence. Be in the moments, trust your vendors, and let the joy of the day carry you through.",
      },
    ],
    relatedIds: [2, 3, 6],
  },
  {
    id: 2,
    slug: "decor-trends-indian-weddings-2025",
    category: "Decor",
    title: "10 Decor Trends Dominating Indian Weddings Right Now",
    excerpt:
      "From dried floral arches to maximalist mehndi setups — here's what's trending in 2025 and how to pull it off on any budget.",
    author: "Akarsh Gupta",
    authorRole: "Head of Content",
    authorInitial: "P",
    authorGradient: "135deg, #f472b6 0%, #fca5a5 100%",
    date: "April 12, 2025",
    readTime: "6 min read",
    emoji: "🌸",
    accent: "#f472b6",
    content: [
      {
        type: "intro",
        text: "Indian wedding decor has undergone a quiet revolution. Gone are the days when every mandap looked identical. Today's couples are demanding personality, intentionality, and aesthetics that photograph beautifully. Here are the 10 trends our Evencers decor vendors are being asked about most in 2025.",
      },
      {
        type: "heading",
        text: "1. Dried Floral Everything",
      },
      {
        type: "paragraph",
        text: "Pampas grass, dried roses, wheat stalks, and preserved palm leaves have taken over Indian wedding decor. The appeal is obvious: they look stunning, photograph beautifully, and last the entire wedding without wilting. They work especially well for mehndi and haldi setups where the color palette tends toward earthy yellows and terracottas.",
      },
      {
        type: "heading",
        text: "2. Maximalist Mehndi Stages",
      },
      {
        type: "paragraph",
        text: "The mehndi setup has become its own design moment. We're seeing elaborate stage setups with hanging macramé, cascading flower curtains, and custom neon signs. Budget allocation for mehndi decor has nearly doubled in the last two years as couples recognise how much their guests photograph this event.",
      },
      {
        type: "callout",
        emoji: "🌿",
        text: "Budget tip: Dried florals can cost 30–40% less than fresh flowers for the same visual impact. Ask your vendor specifically about preserved arrangements.",
      },
      {
        type: "heading",
        text: "3. Intimate Phera Setups",
      },
      {
        type: "paragraph",
        text: "Rather than the traditional large mandap with the entire guest list watching, couples are now creating intimate phera spaces — smaller, beautifully designed structures where only immediate family sits close, while other guests watch from a comfortable distance. This creates more meaningful photographs and a more focused ceremony.",
      },
      {
        type: "heading",
        text: "4. Sustainable Decor",
      },
      {
        type: "paragraph",
        text: "Eco-conscious couples are requesting setups that can be reused, composted, or donated. Potted plants as centrepieces (gifted to guests afterward), seed-paper invitations, and fabric draping that gets repurposed — sustainability is no longer niche, it's becoming an expectation.",
      },
      {
        type: "list",
        heading: "All 10 Trends at a Glance",
        items: [
          "Dried and preserved florals",
          "Maximalist mehndi stages with custom lighting",
          "Intimate phera setups",
          "Sustainable and reusable decor elements",
          "Arch installations (floral, geometric, mirrored)",
          "Moody, candlelit reception aesthetics",
          "Personalised neon signs",
          "Garden party aesthetics for daytime events",
          "Vintage furniture rentals as focal points",
          "Color-blocked decor schemes (one dominant color throughout)",
        ],
      },
      {
        type: "paragraph",
        text: "The best decor is intentional decor. Choose two or three trends that feel authentic to you as a couple and build your visual identity around them. Chasing every trend produces a cluttered look that doesn't photograph well and doesn't feel cohesive.",
      },
    ],
    relatedIds: [1, 5, 7],
  },
  {
    id: 3,
    slug: "choosing-wedding-photographer-questions",
    category: "Photography",
    title: "How to Choose the Right Wedding Photographer: 7 Questions to Ask",
    excerpt:
      "Albums last forever. We spoke to 12 top photographers to compile the questions every couple must ask before signing a contract.",
    author: "Atharv Patidar",
    authorRole: "Photography Editor",
    authorInitial: "R",
    authorGradient: "135deg, #38bdf8 0%, #7dd3fc 100%",
    date: "April 8, 2025",
    readTime: "5 min read",
    emoji: "📸",
    accent: "#38bdf8",
    content: [
      {
        type: "intro",
        text: "Your wedding photographs are the only physical thing that remains after the day is over. The flowers will wilt, the food will be eaten, the guests will go home — but the images last a lifetime. Choosing the right photographer is possibly the most important vendor decision you'll make. Here are the 7 questions you must ask.",
      },
      {
        type: "heading",
        text: "Question 1: Can I see a full wedding, not just highlights?",
      },
      {
        type: "paragraph",
        text: "Any photographer can curate 30 stunning images from a day. What you need to see is consistency across a full event — 200 to 400 photos. This reveals how they handle boring moments (the signing of the register, the meal, the transitions between ceremonies), how they manage low light, and how they tell a story from start to finish.",
      },
      {
        type: "heading",
        text: "Question 2: Who exactly will shoot my wedding?",
      },
      {
        type: "paragraph",
        text: "Many popular wedding photography studios book weddings under the lead photographer's name but send a second-in-command to shoot. Always clarify: is the person whose work you fell in love with actually the one who will be there on your day? Get this in writing in the contract.",
      },
      {
        type: "callout",
        emoji: "⚠️",
        text: "Red flag: If a photographer can't show you a complete wedding album from the last 3 months, be cautious. Recent work matters — styles evolve, and you want to see their current output.",
      },
      {
        type: "heading",
        text: "Question 3: What is your backup plan if you're ill on the day?",
      },
      {
        type: "paragraph",
        text: "This is non-negotiable. Any professional photographer should have a contingency plan — a trusted colleague or second shooter who could step in if an emergency arises. If a photographer is offended by this question, that itself is a red flag.",
      },
      {
        type: "heading",
        text: "Question 4: How and when will I receive my photos?",
      },
      {
        type: "paragraph",
        text: "Get specific timelines in writing. How many edited photos will you receive? When will you get a preview gallery (usually 1–2 weeks)? When will the full gallery be delivered (usually 6–12 weeks)? What format — online gallery, USB drive, prints? Will you receive RAW files?",
      },
      {
        type: "list",
        heading: "All 7 Questions",
        items: [
          "Can I see a full wedding gallery, not just highlights?",
          "Who exactly will be photographing my wedding?",
          "What is your backup plan if you're unwell on the day?",
          "How many edited photos will I receive, and when?",
          "What is your shooting style — posed, candid, documentary, or a mix?",
          "Do you have liability insurance?",
          "What happens to my images — can I print them commercially?",
        ],
      },
      {
        type: "paragraph",
        text: "Take your time. Meet at least three photographers in person before deciding. The relationship between a couple and their photographer is intimate — you need to feel comfortable with this person being present during the most personal moments of your day.",
      },
    ],
    relatedIds: [1, 2, 6],
  },
  {
    id: 4,
    slug: "corporate-event-planning-timeline",
    category: "Corporate",
    title: "Corporate Event Planning: A Timeline That Actually Works",
    excerpt:
      "Whether it's a product launch or an annual gala — this 12-week reverse timeline has helped 200+ companies deliver flawless events.",
    author: "Atharv Patidar",
    authorRole: "Co-founder & CTO",
    authorInitial: "A",
    authorGradient: "135deg, #34d399 0%, #6ee7b7 100%",
    date: "March 29, 2025",
    readTime: "8 min read",
    emoji: "💼",
    accent: "#34d399",
    content: [
      {
        type: "intro",
        text: "Corporate events fail not because of bad vendors or bad budgets — they fail because of poor planning timelines. Having run operations for 200+ corporate events across Delhi and Chandigarh, we've distilled what works into a 12-week reverse timeline you can steal and use immediately.",
      },
      {
        type: "heading",
        text: "Week 12: Define the Brief",
      },
      {
        type: "paragraph",
        text: "Before touching a vendor or venue, get absolute clarity on your brief. What is the purpose of this event? What does success look like? Who is the audience? What is the exact budget, including contingency? Who are the internal stakeholders and who has final approval on decisions? Document all of this in a single 1-page brief that everyone signs off on.",
      },
      {
        type: "callout",
        emoji: "📊",
        text: "The most common reason corporate events go over budget: the brief was vague at the start, leading to scope creep throughout. A tight brief prevents this.",
      },
      {
        type: "heading",
        text: "Week 10: Venue and Date Locked",
      },
      {
        type: "paragraph",
        text: "Corporate venues for 50–500 people need to be booked at least 8–10 weeks out, especially in Delhi NCR and Chandigarh where premium venues fill up fast. Consider: AV capabilities, parking, catering exclusivity (can you bring your own caterer?), and tech infrastructure for presentations or streaming.",
      },
      {
        type: "heading",
        text: "Week 8: Vendor Contracts Signed",
      },
      {
        type: "paragraph",
        text: "By week 8, all primary vendors should be contracted: AV team, catering, photography if required, and any speakers or performers. Get itemised quotes — never accept a lump-sum figure without a line-item breakdown.",
      },
      {
        type: "list",
        heading: "12-Week Reverse Timeline Summary",
        items: [
          "Week 12: Brief finalized, budget approved, team assigned",
          "Week 10: Venue booked, date confirmed, save-the-dates sent",
          "Week 8: All vendor contracts signed",
          "Week 6: Invitations sent, agenda drafted",
          "Week 4: Confirmed RSVPs, catering numbers finalized",
          "Week 2: Full run-of-show document completed",
          "Week 1: Venue walkthrough with all vendors",
          "Day before: Full tech rehearsal",
          "Day of: Vendor check-in 3 hours before guests arrive",
        ],
      },
      {
        type: "paragraph",
        text: "The secret ingredient in every successful corporate event is the run-of-show document: a minute-by-minute schedule shared with every vendor and internal team member. It removes ambiguity, prevents miscommunication, and gives everyone a single source of truth on the day.",
      },
    ],
    relatedIds: [6, 7, 5],
  },
  {
    id: 5,
    slug: "wedding-menu-design-guide",
    category: "Catering",
    title: "How to Design a Wedding Menu Your Guests Will Talk About for Years",
    excerpt:
      "Live counters, fusion desserts, and regional specialties — a master caterer shares the secrets to creating an unforgettable food experience.",
    author: "Meera Nair",
    authorRole: "Catering Specialist",
    authorInitial: "M",
    authorGradient: "135deg, #fb923c 0%, #fcd34d 100%",
    date: "March 22, 2025",
    readTime: "7 min read",
    emoji: "🍽",
    accent: "#fb923c",
    content: [
      {
        type: "intro",
        text: "Ask any wedding guest what they remember most, and after the bride's outfit, it's almost always the food. A thoughtfully designed wedding menu is not just sustenance — it's an experience that sets the tone for the entire event. Here's how the best caterers approach it.",
      },
      {
        type: "heading",
        text: "Start with Your Story",
      },
      {
        type: "paragraph",
        text: "The best wedding menus tell the couple's story. If the bride is from Lucknow and the groom from Chennai, your menu should reflect both — Awadhi kebabs alongside Chettinad dishes, filter coffee next to shahi tukda. This personalisation creates talking points and makes guests feel like they're part of something specific.",
      },
      {
        type: "heading",
        text: "The Live Counter Revolution",
      },
      {
        type: "paragraph",
        text: "Static buffets are giving way to live counters, and for good reason. A live pani puri station, a live dosa counter, or a freshly-prepared chaat stall creates entertainment and ensures food is served hot. Guests congregate around these stations, conversations happen, and the energy in the room lifts.",
      },
      {
        type: "callout",
        emoji: "🍡",
        text: "Most popular live counter requests in 2025: Kulfi faluda, live pasta, gourmet sandwich bar, and regional Indian thali counters. The kulfi counter especially always draws a crowd.",
      },
      {
        type: "heading",
        text: "Handling Dietary Requirements",
      },
      {
        type: "paragraph",
        text: "A modern Indian wedding guest list includes vegetarians, vegans, Jains, guests with gluten sensitivities, and diabetes-conscious elderly family members. Design your menu with clear labelling, and ensure at least 40% of your offerings are vegetarian even for non-vegetarian weddings. Brief your catering staff on common allergens.",
      },
      {
        type: "list",
        heading: "The Five Principles of a Great Wedding Menu",
        items: [
          "Tell your story — regional dishes that reflect both families",
          "Include at least two live counters for energy and freshness",
          "Balance indulgence with lighter options (salads, fruits, lighter mains)",
          "Have a signature cocktail or mocktail that gets named after the couple",
          "End with a spectacular dessert station, not just a single cake",
        ],
      },
      {
        type: "paragraph",
        text: "Finally: always do a tasting with your full family panel, not just the couple. Your aunt who hates too much oil and your father-in-law who needs salt in everything are both valid diners. A caterer worth their fee will accommodate feedback graciously.",
      },
    ],
    relatedIds: [1, 2, 6],
  },
  {
    id: 6,
    slug: "budget-hacks-wedding-savings",
    category: "Tips & Tricks",
    title: "5 Budget Hacks That Save Couples ₹50,000+ on Their Wedding",
    excerpt:
      "Real savings from real couples. We've compiled the smartest negotiation tactics, off-peak tricks, and vendor bundling strategies.",
    author: "Akarsh Gupta",
    authorRole: "Co-founder & CEO",
    authorInitial: "A",
    authorGradient: "135deg, #a78bfa 0%, #c4b5fd 100%",
    date: "March 15, 2025",
    readTime: "4 min read",
    emoji: "💰",
    accent: "#a78bfa",
    content: [
      {
        type: "intro",
        text: "Weddings don't have to be expensive to be extraordinary. After facilitating hundreds of bookings through Evencers, we've noticed that the couples who get the most value aren't the ones with the biggest budgets — they're the ones who plan smartest. Here are the five tactics that consistently save the most money.",
      },
      {
        type: "heading",
        text: "Hack 1: Book Off-Peak Days",
      },
      {
        type: "paragraph",
        text: "Sunday evening to Friday afternoon — that's peak season pricing for most venues and vendors. A Saturday wedding at a premium venue in Chandigarh might cost ₹3 lakh, while the exact same venue on a Thursday costs ₹1.5–1.8 lakh. That's ₹1+ lakh saved on the venue alone, and vendors often offer similar discounts for weekday bookings.",
      },
      {
        type: "callout",
        emoji: "📅",
        text: "The sweet spot: Thursday evenings and Sunday afternoons offer the best balance of pricing discounts (20–35% cheaper) and guest convenience for local weddings.",
      },
      {
        type: "heading",
        text: "Hack 2: Bundle Vendors",
      },
      {
        type: "paragraph",
        text: "Many decor vendors also do florals, lighting, and furniture rental. Instead of booking three separate vendors, ask if one vendor can handle all three — they will almost always offer a 10–20% package discount. The same applies to photography + videography + drone coverage.",
      },
      {
        type: "heading",
        text: "Hack 3: Negotiate the Deposit Structure",
      },
      {
        type: "paragraph",
        text: "Most vendors ask for 50% upfront. But if you're booking well in advance (9–12 months out), you have negotiating leverage. Ask for a lower deposit (20–30%) with the balance due closer to the date. This keeps your capital free and reduces risk if plans change.",
      },
      {
        type: "list",
        heading: "All 5 Money-Saving Hacks",
        items: [
          "Book off-peak days (Thursday or Sunday) for 20–35% venue savings",
          "Bundle vendors — decor + florals + lighting with one team",
          "Negotiate deposit structures when booking far in advance",
          "Use seasonal flowers (always 30–50% cheaper than exotic imports)",
          "Cut the guest list ruthlessly — the per-head cost at Indian weddings averages ₹1,500–3,000 per guest",
        ],
      },
      {
        type: "paragraph",
        text: "The most powerful savings tip of all: be decisive. Vendors charge more for indecisive clients who require multiple revisions, extended consultations, and last-minute changes. Know what you want, communicate clearly, and stick to your decisions. Your vendors will respect you for it, and your wallet will thank you.",
      },
    ],
    relatedIds: [1, 4, 7],
  },
  {
    id: 7,
    slug: "chandigarh-wedding-real-event",
    category: "Wedding",
    title: "Real Event: A 200-Guest Chandigarh Wedding Planned in 6 Weeks",
    excerpt:
      "When Neha & Rajan had just 42 days, Evencers helped them find 8 vendors, confirm a venue, and pull off a stunning celebration. Here's the full story.",
    author: "Priya Sharma",
    authorRole: "Head of Content",
    authorInitial: "P",
    authorGradient: "135deg, #f472b6 0%, #fca5a5 100%",
    date: "March 8, 2025",
    readTime: "9 min read",
    emoji: "💍",
    accent: "#c9a84c",
    content: [
      {
        type: "intro",
        text: "When Neha called us on a Tuesday morning in January, she had exactly 42 days until her wedding. Her previous planner had fallen through, two vendor contracts had collapsed, and her venue was confirmed but nothing else was. This is the story of how we pulled it off.",
      },
      {
        type: "heading",
        text: "Day 1: The Emergency Call",
      },
      {
        type: "paragraph",
        text: "Neha and Rajan had been engaged for eight months and had been working with a local planner who had, without warning, become unresponsive. No contracts were signed with secondary vendors. The venue (a beautiful farmhouse in Zirakpur) was the only confirmed element. They had 200 confirmed guests and a wedding date they could not move.",
      },
      {
        type: "paragraph",
        text: "We immediately ran a triage assessment: what was locked in, what was critical, and what was flexible. Venue: confirmed. Catering: nothing signed. Photography: one photographer in discussions but nothing agreed. Décor: zero. Outfits: complete. Invitations: sent (physically — digital follow-ups possible).",
      },
      {
        type: "callout",
        emoji: "⚡",
        text: "In emergency wedding planning, the 80/20 rule applies: 80% of the guest experience comes from 20% of the elements. Prioritise food, photography, and the main ceremony space. Everything else is secondary.",
      },
      {
        type: "heading",
        text: "Days 2–7: Vendor Sprint",
      },
      {
        type: "paragraph",
        text: "Using Evencers, we shortlisted and contacted 18 vendors across catering, photography, décor, and music. Within 48 hours, we had responses from 14. By day 7, we had signed contracts with 8 vendors: a catering team, photographer + videographer, décor vendor (who also handled flowers and lighting), a DJ, a mehendi artist, and a makeup artist.",
      },
      {
        type: "heading",
        text: "The Wedding Day",
      },
      {
        type: "paragraph",
        text: "The farmhouse was transformed with a colour palette of ivory, dusty rose, and gold. The phera setup was intimate and elegant. The catering received special praise — a live chaat counter and a kulfi station became the talking points of the evening. The photographer captured 847 images, of which Neha says at least 200 are frame-worthy.",
      },
      {
        type: "paragraph",
        text: "Was it perfect? No. The DJ arrived 40 minutes late, creating a gap that the catering team filled by opening the cocktail counter early (which, honestly, the guests preferred). One of the floral arch arrangements needed emergency repairs on the morning of the wedding. But these were minor issues in a celebration that most guests described as one of the most beautiful weddings they had attended.",
      },
      {
        type: "list",
        heading: "What Made It Work in 6 Weeks",
        items: [
          "Immediate, honest triage of what was truly essential",
          "A platform (Evencers) that gave access to pre-vetted vendors quickly",
          "A clear decision-making process — Neha and Rajan said yes or no within 24 hours of each vendor proposal",
          "Flexibility on secondary elements (menu was simplified, décor was focused)",
          "A designated family coordinator who managed vendor communication on the day",
        ],
      },
      {
        type: "paragraph",
        text: "Neha's advice to anyone in a similar situation: 'Don't panic, prioritize, and trust the vendors you choose. You can't micromanage 8 vendors in 6 weeks. You have to brief them, trust them, and let them do their job.'",
      },
    ],
    relatedIds: [1, 3, 6],
  },
];

export const FEATURED_POST = ALL_POSTS.find((p) => p.featured) || ALL_POSTS[0];
export const POSTS = ALL_POSTS.filter((p) => !p.featured);

export const SIDEBAR_POSTS = [
  { id: 8, title: "What Every Bride Should Know Before Hiring a Mehndi Artist", date: "Apr 5", category: "Wedding" },
  { id: 9, title: "The New Rules of Corporate Gift-Giving at Events", date: "Mar 30", category: "Corporate" },
  { id: 10, title: "How Lighting Can Transform Any Event Venue", date: "Mar 24", category: "Decor" },
  { id: 11, title: "Drone Photography: Is It Worth the Extra Cost?", date: "Mar 18", category: "Photography" },
];