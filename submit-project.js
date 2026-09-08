const API_URL = "https://pindai-hackathon-api.vercel.app/api/submit";

// Dictionary 2 Bahasa (EN & TH)
const i18n = {
    en: {
        nav_about: "About",
        nav_program: "Program",
        nav_submit: "Submit Project",
        hero_eyebrow: "THAILAND AI HACKATHON 2026",
        hero_title: "Submit Your AI Project",
        hero_subheadline: "Submit your team's Gen AI project here. Ensure all details are filled accurately.",
        label_team_name: "Team Name",
        label_email: "Contact Email (Leader)",
        label_team_members: "Team Members (Up to 5 members)",
        label_project_title: "Title of Project",
        label_project_desc: "Description of Project (max 100 words)",
        label_html_url: "URL of HTML / Hosted Project",
        label_html_file: "OR Upload HTML File",
        choose_file: "Choose .html file",
        confirm_thai: "We confirm that all team members are Thai nationality and above 18 years old.",
        confirm_correct: "We confirm that all information provided is true and correct.",
        btn_submit: "Submit Project",
        sending: "Submitting...",
        err_words: "Description exceeds 100 words limit.",
        err_file_size: "File size must be under 5MB.",
        err_connect: "Failed to connect to server. Please try again.",
        success_msg: "Project submitted successfully! Check your email for confirmation."
    },
    th: {
        nav_about: "เกี่ยวกับ",
        nav_program: "โปรแกรม",
        nav_submit: "ส่งผลงาน",
        hero_eyebrow: "THAILAND AI HACKATHON 2026",
        hero_title: "ส่งผลงานโปรเจกต์ AI ของคุณ",
        hero_subheadline: "ส่งโปรเจกต์ Gen AI ของทีมคุณที่นี่ โปรดตรวจสอบให้แน่ใจว่าข้อมูลทั้งหมดถูกต้อง",
        label_team_name: "ชื่อทีม",
        label_email: "อีเมลติดต่อ (หัวหน้าทีม)",
        label_team_members: "สมาชิกในทีม (สูงสุด 5 คน)",
        label_project_title: "ชื่อโปรเจกต์",
        label_project_desc: "คำอธิบายโปรเจกต์ (ไม่เกิน 100 คำ)",
        label_html_url: "URL ของโปรเจกต์ HTML",
        label_html_file: "หรืออัปโหลดไฟล์ HTML",
        choose_file: "เลือกไฟล์ .html",
        confirm_thai: "เราขอยืนยันว่าสมาชิกทุกคนในทีมมีสัญชาติไทยและมีอายุมากกว่า 18 ปี",
        confirm_correct: "เราขอยืนยันว่าข้อมูลทั้งหมดที่ระบุเป็นความจริงและถูกต้อง",
        btn_submit: "ส่งผลงาน",
        sending: "กำลังส่ง...",
        err_words: "คำอธิบายเกินขีดจำกัด 100 คำ",
        err_file_size: "ขนาดไฟล์ต้องไม่เกิน 5MB",
        err_connect: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองอีกครั้ง",
        success_msg: "ส่งผลงานเรียบร้อยแล้ว! โปรดตรวจสอบอีเมลของคุณเพื่อยืนยัน"
    }
};

let currentLang = "en";

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("hackathon-form");
    const submitBtn = document.getElementById("submit-btn");
    const submitBtnText = document.getElementById("submit-btn-text");
    const messageBox = document.getElementById("form-message");
    const fileInput = document.getElementById("file_html");
    const fileChosenName = document.getElementById("file-chosen-name");
    const descInput = document.getElementById("project_description");

    // Handling Language Switcher
    const langBtns = document.querySelectorAll(".lang-btn");
    langBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            langBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentLang = btn.getAttribute("data-lang");
            updateLanguage(currentLang);
        });
    });

    function updateLanguage(lang) {
        document.querySelectorAll("[data-i18n]").forEach(el => {
            const key = el.getAttribute("data-i18n");
            if (i18n[lang] && i18n[lang][key]) {
                el.textContent = i18n[lang][key];
            }
        });
    }

    fileInput.addEventListener("change", () => {
        if (fileInput.files.length > 0) {
            fileChosenName.textContent = fileInput.files[0].name;
            fileChosenName.parentElement.classList.add("has-file");
        } else {
            fileChosenName.textContent = i18n[currentLang].choose_file;
            fileChosenName.parentElement.classList.remove("has-file");
        }
    });

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        clearMessage();

        // Validasi deskripsi (maksimal 100 kata)
        const wordCount = descInput.value.trim().split(/\s+/).filter(Boolean).length;
        if (wordCount > 100) {
            showMessage(i18n[currentLang].err_words, "error");
            return;
        }

        const formData = new FormData(form);

        // Kumpulkan anggota tim menjadi string
        const members = [
            form.querySelector('[name="member_1"]').value,
            form.querySelector('[name="member_2"]').value,
            form.querySelector('[name="member_3"]').value,
            form.querySelector('[name="member_4"]').value,
            form.querySelector('[name="member_5"]').value
        ].filter(Boolean).join(", ");

        formData.append("team_members_list", members);

        setLoading(true);

        try {
            const res = await fetch(API_URL, {
                method: "POST",
                body: formData,
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                showMessage(data.error || "Error occurred.", "error");
                return;
            }

            showMessage(i18n[currentLang].success_msg, "success");
            form.reset();
            fileChosenName.textContent = i18n[currentLang].choose_file;
            fileChosenName.parentElement.classList.remove("has-file");
        } catch (err) {
            console.error(err);
            showMessage(i18n[currentLang].err_connect, "error");
        } finally {
            setLoading(false);
        }
    });

    function setLoading(isLoading) {
        submitBtn.disabled = isLoading;
        submitBtnText.textContent = isLoading ? i18n[currentLang].sending : i18n[currentLang].btn_submit;
    }

    function showMessage(text, type) {
        messageBox.textContent = text;
        messageBox.className = "form-message " + type;
    }

    function clearMessage() {
        messageBox.textContent = "";
        messageBox.className = "form-message";
    }
});
