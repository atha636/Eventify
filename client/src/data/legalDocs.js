// One place for every legal document shown in the app's popups.
// Privacy, Terms and Refund match the wording on the home page.
// Vendor Terms and Content Policy are drafts based on how the platform works today —
// have them reviewed by a lawyer before relying on them.

const CONTACT = "admineventify2005@gmail.com";

export const LEGAL_DOCS = {
  vendorTerms: {
    icon: "🤝",
    title: "Vendor Terms",
    updated: "Applies to everyone who lists a service on Evencers",
    sections: [
      { title: "Your account", text: "You must be 18 or older and able to provide the services you list. Keep your login details private and make sure the contact details on your profile are accurate. You are responsible for everything done through your account." },
      { title: "Accurate listings", text: "Your title, description, photos, cities, availability and package prices must truthfully describe what you offer. Do not list services you cannot deliver, and update your listing when something changes." },
      { title: "Bookings and availability", text: "Respond to booking requests promptly and keep your availability calendar up to date. Once you approve a booking, you are committed to delivering the service on the agreed date and at the agreed price." },
      { title: "Payments", text: "Customers pay through Evencers using the payment plan they choose (25%, 75% or full payment with a 5% discount). Do not ask customers to pay outside the platform for bookings made through Evencers. Payments are processed securely through Razorpay." },
      { title: "Cancellations", text: "Please give at least 72 hours' notice if you must cancel a confirmed booking. If you cancel, the customer receives a full refund. Repeated cancellations can reduce your visibility or lead to an account review." },
      { title: "Conduct and suspension", text: "Treat customers and the Evencers team respectfully. An account may be suspended for repeated last-minute cancellations, ratings that stay below 3.0, fraud, misleading listings, or breaking these terms." },
      { title: "Reviews", text: "Customers can review your work after the event. You may not offer rewards for reviews, post fake reviews, or pressure customers to change or remove a review." },
      { title: "Your content", text: "You keep ownership of the photos and text you upload, and you give Evencers permission to display them on the platform and in related promotion. See the Content Policy for what you can upload." },
      { title: "Liability", text: "Evencers is a marketplace. You are an independent business, responsible for the quality, safety and legality of your own services, and for your own taxes." },
      { title: "Changes and contact", text: `We may update these terms from time to time, and continuing to use the platform means you accept the changes. Questions? Write to ${CONTACT}.` },
    ],
  },

  contentPolicy: {
    icon: "🖼️",
    title: "Content Policy",
    updated: "Rules for photos, text and anything else you publish",
    sections: [
      { title: "Use only what you own", text: "Upload photos and text that you created or have full permission to use. Do not use another vendor's work, stock images presented as your own work, or copyrighted material you do not have rights to." },
      { title: "Be honest", text: "Portfolio images should be real examples of your work. Do not heavily edit or fake results, and do not exaggerate experience, awards, client names or numbers." },
      { title: "Keep it appropriate", text: "No illegal, hateful, violent, sexually explicit or deceptive content. Do not include anything that harasses or discriminates against any person or group." },
      { title: "Respect privacy", text: "Do not publish photos or details of customers or guests without their clear permission. Do not share anyone's phone number, address or other personal information." },
      { title: "Keep bookings on Evencers", text: "Do not put external payment links, or ask customers to book or pay outside the platform, in your title, description, photos or messages." },
      { title: "Text written with AI", text: "If you use the AI writing helper, read and correct the result before publishing. You are responsible for making sure everything in your description is accurate." },
      { title: "Quality", text: "Use clear, well-lit, correctly cropped images and a description that helps customers decide. Listings with misleading or very poor content may be hidden until fixed." },
      { title: "Removal and reporting", text: `We may remove or hide content that breaks this policy and may suspend repeat offenders. To report a listing or ask for content to be removed, write to ${CONTACT}.` },
    ],
  },

  privacy: {
    icon: "🔒",
    title: "Privacy Policy",
    updated: "How we handle your information",
    sections: [
      { title: "Information We Collect", text: "We collect information you provide directly to us, such as your name, email address, phone number, and event details when you register or book a vendor through Evencers. We also collect usage data, device information, and cookies to improve your experience." },
      { title: "How We Use Your Information", text: "Your information is used to connect you with verified vendors, process bookings, send confirmations and updates, provide customer support, and improve our platform. We do not sell your personal information to third parties." },
      { title: "Data Security", text: "We implement industry-standard security measures to protect your personal data. All transactions are encrypted. However, no method of transmission over the internet is 100% secure." },
      { title: "Cookies", text: "We use cookies to enhance your browsing experience, remember your preferences, and analyze site traffic. You can control cookie settings through your browser." },
      { title: "Contact Us", text: `For any privacy-related concerns, please contact us at ${CONTACT} or call +91 70230 17517.` },
    ],
  },

  terms: {
    icon: "📋",
    title: "Terms & Conditions",
    updated: "Terms of Service for using Evencers",
    sections: [
      { title: "Acceptance of Terms", text: "By accessing and using Evencers, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our platform." },
      { title: "Use of Platform", text: "Evencers is a marketplace connecting event planners with vendors. You agree to use the platform only for lawful purposes. You must be at least 18 years of age to use our services." },
      { title: "Vendor Listings", text: "All vendors on Evencers are independently verified by our team. However, Evencers does not guarantee the quality, safety, or legality of services offered. Users are encouraged to review vendors carefully before booking." },
      { title: "Bookings & Payments", text: "All bookings made through Evencers are subject to vendor availability and confirmation. Payment terms are as agreed between the user and the vendor at the time of booking." },
      { title: "Limitation of Liability", text: "Evencers shall not be liable for any indirect, incidental, or consequential damages arising from the use of our platform or services provided by vendors." },
      { title: "Modifications", text: "We reserve the right to modify these terms at any time. Continued use of the platform after changes constitutes acceptance of the new terms." },
      { title: "Refunds", text: "Cancellations and refunds are covered by our Refund Policy, which forms part of these terms." },
    ],
  },

  refund: {
    icon: "💰",
    title: "Refund Policy",
    updated: "Cancellations and refunds",
    sections: [
      { title: "Cancellation by User", text: "If you cancel a booking more than 7 days before the event date, you are eligible for a full refund. Cancellations made 3–7 days before the event will receive a 50% refund. No refund is applicable for cancellations within 48 hours of the event." },
      { title: "Cancellation by Vendor", text: "If a vendor cancels your confirmed booking, you will receive a full refund within 5–7 business days. Evencers will also assist you in finding an alternative vendor at no additional charge." },
      { title: "Refund Process", text: "Refunds are processed to the original payment method. Processing time may vary between 5–10 business days depending on your bank or payment provider." },
      { title: "Disputes", text: "In case of any dispute regarding services rendered, please contact our support team within 48 hours of the event. We will mediate between you and the vendor to reach a fair resolution." },
      { title: "Non-Refundable Items", text: "Platform convenience fees and booking confirmation charges are non-refundable once a booking is confirmed." },
      { title: "Contact for Refunds", text: `To initiate a refund or for any refund-related queries, please reach out to ${CONTACT} with your booking ID and reason for cancellation.` },
    ],
  },
};