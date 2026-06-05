const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'src', 'i18n', 'locales');
const languages = ['en', 'hi', 'ta', 'mr', 'te', 'gu'];

const dashboardUpdates = {
  en: {
    memberSnapshot: "Member Snapshot",
    gigWorker: "Gig Worker",
    deliveryPartner: "Delivery Partner",
    inString: "in",
    claimsRecorded: "claims recorded",
    paidOut: "paid out",
    phoneTitle: "Phone",
    notAdded: "Not added",
    emailTitle: "Email",
    locationTitle: "Location",
    policyTitle: "Policy",
    planActive: "plan active",
    noPlanSelected: "No plan selected",
    planPending: "Plan pending",
    daysActive: "Days Active",
    highestHoursWorked: "Highest Hours Worked",
    averageDailyHours: "Average Daily Hours",
    weeklyEarningsProtected: "Weekly Earnings Protected",
    activeCoverage: "Active Coverage",
    maximumPayoutAvailable: "Maximum payout available",
    latestDisruption: "Latest Disruption",
    noEvents: "No events",
    severityAndDemand: "{{severity}}% severity and {{demand}}% demand left",
    runClaimToStartTracking: "Run a claim to start tracking disruption history",
    earningsVsProtected: "Earnings vs Protected Income",
    actualEarnings: "Actual Earnings",
    protectedIncome: "Protected Income",
    activeAlerts: "Active Alerts",
    noDisruptionAlerts: "No disruption alerts yet. Once claims run, this panel will show your latest triggers.",
    recentActivity: "Recent Activity",
    noClaimActivity: "No claim activity yet. Complete a payout flow from Claims to populate this feed.",
    claimApproved: "claim approved",
    welcomeBack: "Welcome back! Here's your weekly overview.",
    changePhoto: "Change",
    addPhoto: "Add Photo"
  },
  hi: {
    memberSnapshot: "सदस्य स्नैपशॉट",
    gigWorker: "गिग वर्कर",
    deliveryPartner: "डिलीवरी पार्टनर",
    inString: "में",
    claimsRecorded: "दावे दर्ज किए गए",
    paidOut: "भुगतान किया गया",
    phoneTitle: "फ़ोन",
    notAdded: "नहीं जोड़ा गया",
    emailTitle: "ईमेल",
    locationTitle: "स्थान",
    policyTitle: "पॉलिसी",
    planActive: "प्लान सक्रिय",
    noPlanSelected: "कोई प्लान नहीं चुना गया",
    planPending: "प्लान लंबित",
    daysActive: "सक्रिय दिन",
    highestHoursWorked: "सर्वाधिक काम के घंटे",
    averageDailyHours: "औसत दैनिक घंटे",
    weeklyEarningsProtected: "साप्ताहिक आय सुरक्षित",
    activeCoverage: "सक्रिय कवरेज",
    maximumPayoutAvailable: "अधिकतम भुगतान उपलब्ध",
    latestDisruption: "नवीनतम व्यवधान",
    noEvents: "कोई घटना नहीं",
    severityAndDemand: "{{severity}}% गंभीरता और {{demand}}% मांग शेष",
    runClaimToStartTracking: "व्यवधान इतिहास को ट्रैक करने के लिए दावा चलाएं",
    earningsVsProtected: "आय बनाम सुरक्षित आय",
    actualEarnings: "वास्तविक आय",
    protectedIncome: "सुरक्षित आय",
    activeAlerts: "सक्रिय अलर्ट",
    noDisruptionAlerts: "अभी तक कोई व्यवधान अलर्ट नहीं। दावों के चलने के बाद यह आपके नवीनतम ट्रिगर दिखाएगा।",
    recentActivity: "हाल की गतिविधि",
    noClaimActivity: "अभी तक कोई दावा गतिविधि नहीं। इस फ़ीड को भरने के लिए भुगतान प्रवाह पूरा करें।",
    claimApproved: "दावा स्वीकृत",
    welcomeBack: "वापसी पर स्वागत है! यहाँ आपका साप्ताहिक अवलोकन है।",
    changePhoto: "बदलें",
    addPhoto: "फ़ोटो जोड़ें"
  },
  ta: {
    memberSnapshot: "உறுப்பினர் சுருக்கம்",
    gigWorker: "கிக் தொழிலாளி",
    deliveryPartner: "விநியோக கூட்டாளர்",
    inString: "இல்",
    claimsRecorded: "உரிமைகோரல்கள் பதிவு செய்யப்பட்டன",
    paidOut: "வழங்கப்பட்டது",
    phoneTitle: "தொலைபேசி",
    notAdded: "சேர்க்கப்படவில்லை",
    emailTitle: "மின்னஞ்சல்",
    locationTitle: "இடம்",
    policyTitle: "கொள்கை",
    planActive: "திட்டம் செயலில்",
    noPlanSelected: "எந்த திட்டமும் தேர்ந்தெடுக்கப்படவில்லை",
    planPending: "திட்டம் நிலுவையில்",
    daysActive: "செயலில் உள்ள நாட்கள்",
    highestHoursWorked: "அதிகபட்ச வேலை நேரங்கள்",
    averageDailyHours: "சராசரி தினசரி நேரங்கள்",
    weeklyEarningsProtected: "வாராந்திர வருமானம் பாதுகாக்கப்பட்டது",
    activeCoverage: "செயலில் உள்ள பாதுகாப்பு",
    maximumPayoutAvailable: "அதிகபட்ச கொடுப்பனவு கிடைக்கிறது",
    latestDisruption: "சமீபத்திய இடையூறு",
    noEvents: "நிகழ்வுகள் இல்லை",
    severityAndDemand: "{{severity}}% தீவிரம் மற்றும் {{demand}}% தேவை எஞ்சியுள்ளது",
    runClaimToStartTracking: "இடையூறு வரலாற்றைக் கண்காணிக்க உரிமைகோரலை இயக்கவும்",
    earningsVsProtected: "வருமானம் vs பாதுகாக்கப்பட்ட வருமானம்",
    actualEarnings: "உண்மையான வருமானம்",
    protectedIncome: "பாதுகாக்கப்பட்ட வருமானம்",
    activeAlerts: "செயலில் உள்ள எச்சரிக்கைகள்",
    noDisruptionAlerts: "இன்னும் இடையூறு எச்சரிக்கைகள் இல்லை.",
    recentActivity: "சமீபத்திய செயல்பாடு",
    noClaimActivity: "உரிமைகோரல் செயல்பாடு இல்லை.",
    claimApproved: "உரிமைகோரல் அங்கீகரிக்கப்பட்டது",
    welcomeBack: "மீண்டும் வருக! உங்கள் வாராந்திர கண்ணோட்டம் இதோ.",
    changePhoto: "மாற்று",
    addPhoto: "படம் சேர்"
  }
};

const historyUpdates = {
  en: {
    disruptionHistory: "Disruption History",
    historyDesc: "A record of each disruption event and the payout released for that event",
    totalDisruptions: "Total Disruptions",
    loggedEvents: "Logged events",
    claimedAgainst: "Claimed against disruptions",
    disruptionRecords: "Disruption Records",
    breakdownByType: "Breakdown By Disruption Type",
    noDisruptionSummaries: "No disruption summaries yet.",
    eventCount: "{{count}} event",
    eventsCount: "{{count}} events",
    noHistoryYet: "No disruption history yet. Run a claim from the Claims page to populate this table."
  },
  hi: {
    disruptionHistory: "व्यवधान इतिहास",
    historyDesc: "प्रत्येक व्यवधान घटना और उस घटना के लिए जारी भुगतान का रिकॉर्ड",
    totalDisruptions: "कुल व्यवधान",
    loggedEvents: "लॉग की गई घटनाएं",
    claimedAgainst: "व्यवधानों के खिलाफ दावा किया गया",
    disruptionRecords: "व्यवधान रिकॉर्ड",
    breakdownByType: "व्यवधान प्रकार से विवरण",
    noDisruptionSummaries: "कोई व्यवधान सारांश नहीं।",
    eventCount: "{{count}} घटना",
    eventsCount: "{{count}} घटनाएं",
    noHistoryYet: "कोई व्यवधान इतिहास नहीं। इस तालिका को भरने के लिए दावा चलाएं।"
  },
  ta: {
    disruptionHistory: "இடையூறு வரலாறு",
    historyDesc: "ஒவ்வொரு இடையூறு நிகழ்வு மற்றும் அதற்காக வழங்கப்பட்ட கொடுப்பனவின் பதிவு",
    totalDisruptions: "மொத்த இடையூறுகள்",
    loggedEvents: "பதிவு செய்யப்பட்ட நிகழ்வுகள்",
    claimedAgainst: "இடையூறுகளுக்கு எதிராக கோரப்பட்டது",
    disruptionRecords: "இடையூறு பதிவுகள்",
    breakdownByType: "இடையூறு வகையின் அடிப்படையில் முறிவு",
    noDisruptionSummaries: "இடையூறு சுருக்கங்கள் இல்லை.",
    eventCount: "{{count}} நிகழ்வு",
    eventsCount: "{{count}} நிகழ்வுகள்",
    noHistoryYet: "இடையூறு வரலாறு இல்லை. இந்த அட்டவணையை நிரப்ப உரிமைகோரலை இயக்கவும்."
  }
};

languages.forEach(lang => {
  // dashboard
  const dashPath = path.join(localesDir, lang, 'dashboard.json');
  if (fs.existsSync(dashPath)) {
    let raw = fs.readFileSync(dashPath, 'utf8');
    let data = JSON.parse(raw);
    const updates = dashboardUpdates[lang] || dashboardUpdates['en'];
    data = { ...data, ...updates };
    fs.writeFileSync(dashPath, JSON.stringify(data, null, 2));
  }
  
  // history
  const histPath = path.join(localesDir, lang, 'history.json');
  if (fs.existsSync(histPath)) {
    let raw = fs.readFileSync(histPath, 'utf8');
    let data = JSON.parse(raw);
    const updates = historyUpdates[lang] || historyUpdates['en'];
    data = { ...data, ...updates };
    fs.writeFileSync(histPath, JSON.stringify(data, null, 2));
  }
});
console.log("Locales updated!");
