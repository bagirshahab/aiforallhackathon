const translations = {
  en: {
    title: "Submit Your Project",
    subtitle: "Fill in the form below to register your team and project for the AI For All Hackathon.",
    secTeam: "1. Team Information",
    lblTeamName: "Team Name *",
    lblLeaderName: "Team Leader Name *",
    lblEmail: "Leader Email *",
    lblPhone: "WhatsApp / Phone Number *",
    secProject: "2. Project Details",
    lblProjectName: "Project Title *",
    lblTrack: "Category / Track *",
    optTrackDefault: "Select Category",
    lblDescription: "Project Description *",
    lblRepoUrl: "Repository URL (GitHub / GitLab) *",
    lblDemoUrl: "Demo / Video Link (Optional)",
    btnSubmit: "Submit Project"
  },
  th: {
    title: "ส่งผลงานโครงการ",
    subtitle: "กรอกข้อมูลในแบบฟอร์มด้านล่างเพื่อลงทะเบียนทีมและโครงการของคุณสำหรับ AI For All Hackathon",
    secTeam: "1. ข้อมูลทีม",
    lblTeamName: "ชื่อทีม *",
    lblLeaderName: "ชื่อหัวหน้าทีม *",
    lblEmail: "อีเมลหัวหน้าทีม *",
    lblPhone: "เบอร์โทรศัพท์ / WhatsApp *",
    secProject: "2. รายละเอียดโครงการ",
    lblProjectName: "ชื่อโครงการ *",
    lblTrack: "หมวดหมู่ / สาขา *",
    optTrackDefault: "เลือกหมวดหมู่",
    lblDescription: "คำอธิบายโครงการ *",
    lblRepoUrl: "ลิงก์ Repository (GitHub / GitLab) *",
    lblDemoUrl: "ลิงก์ Demo / วิดีโอ (ถ้ามี)",
    btnSubmit: "ส่งโครงการ"
  }
};

function switchLanguage(lang) {
  document.getElementById("title-text").innerText = translations[lang].title;
  document.getElementById("subtitle-text").innerText = translations[lang].subtitle;
  document.getElementById("sec-team-title").innerText = translations[lang].secTeam;
  document.getElementById("lbl-teamName").innerText = translations[lang].lblTeamName;
  document.getElementById("lbl-leaderName").innerText = translations[lang].lblLeaderName;
  document.getElementById("lbl-email").innerText = translations[lang].lblEmail;
  document.getElementById("lbl-phone").innerText = translations[lang].lblPhone;
  document.getElementById("sec-project-title").innerText = translations[lang].secProject;
  document.getElementById("lbl-projectName").innerText = translations[lang].lblProjectName;
  document.getElementById("lbl-track").innerText = translations[lang].lblTrack;
  document.getElementById("opt-track-default").innerText = translations[lang].optTrackDefault;
  document.getElementById("lbl-description").innerText = translations[lang].lblDescription;
  document.getElementById("lbl-repoUrl").innerText = translations[lang].lblRepoUrl;
  document.getElementById("lbl-demoUrl").innerText = translations[lang].lblDemoUrl;
  document.getElementById("btn-submit").innerText = translations[lang].btnSubmit;

  // Toggle active class on language buttons
  document.getElementById("lang-en").classList.toggle("active", lang === "en");
  document.getElementById("lang-th").classList.toggle("active", lang === "th");
}
