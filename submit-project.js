const API_URL = "https://pindai-hackathon-api.vercel.app/api/submit";

const THAI_MESSAGES = {
    choose_html: "เลือกไฟล์ .html",
    choose_md: "เลือกไฟล์ .md",
    sending: "กำลังส่ง...",
    btn_submit: "ส่งผลงาน",
    err_words: "คำอธิบายเกินขีดจำกัด 100 คำ",
    err_theme: "กรุณาเลือกธีมหัวข้อโปรเจกต์",
    err_connect: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองอีกครั้ง",
    success_msg: "ส่งผลงานเรียบร้อยแล้ว! โปรดตรวจสอบอีเมลของคุณเพื่อยืนยัน"
};

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("hackathon-form");
    const submitBtn = document.getElementById("submit-btn");
    const submitBtnText = document.getElementById("submit-btn-text");
    const messageBox = document.getElementById("form-message");
    
    // File HTML elements
    const fileInput = document.getElementById("file_html");
    const fileChosenName = document.getElementById("file-chosen-name");

    // File Markdown (.md) elements (Tambahan)
    const mdInput = document.getElementById("file_md");
    const mdChosenName = document.getElementById("md-file-chosen-name");

    const descInput = document.getElementById("project_description");
    const themeSelect = document.getElementById("project_theme");

    // Event listener untuk preview nama file HTML
    fileInput.addEventListener("change", () => {
        if (fileInput.files.length > 0) {
            fileChosenName.textContent = fileInput.files[0].name;
            fileChosenName.parentElement.classList.add("has-file");
        } else {
            fileChosenName.textContent = THAI_MESSAGES.choose_html;
            fileChosenName.parentElement.classList.remove("has-file");
        }
    });

    // Event listener untuk preview nama file Markdown (.md) (Tambahan)
    mdInput.addEventListener("change", () => {
        if (mdInput.files.length > 0) {
            mdChosenName.textContent = mdInput.files[0].name;
            mdChosenName.parentElement.classList.add("has-file");
        } else {
            mdChosenName.textContent = THAI_MESSAGES.choose_md;
            mdChosenName.parentElement.classList.remove("has-file");
        }
    });

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        clearMessage();

        if (!themeSelect.value) {
            showMessage(THAI_MESSAGES.err_theme, "error");
            return;
        }

        const wordCount = descInput.value.trim().split(/\s+/).filter(Boolean).length;
        if (wordCount > 100) {
            showMessage(THAI_MESSAGES.err_words, "error");
            return;
        }

        const formData = new FormData(form);

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
                showMessage(data.error || "เกิดข้อผิดพลาดในการส่งข้อมูล", "error");
                return;
            }

            showMessage(THAI_MESSAGES.success_msg, "success");
            form.reset();
            
            // Reset tampilan nama file terpilih
            fileChosenName.textContent = THAI_MESSAGES.choose_html;
            fileChosenName.parentElement.classList.remove("has-file");
            
            mdChosenName.textContent = THAI_MESSAGES.choose_md;
            mdChosenName.parentElement.classList.remove("has-file");
        } catch (err) {
            console.error(err);
            showMessage(THAI_MESSAGES.err_connect, "error");
        } finally {
            setLoading(false);
        }
    });

    function setLoading(isLoading) {
        submitBtn.disabled = isLoading;
        submitBtnText.textContent = isLoading ? THAI_MESSAGES.sending : THAI_MESSAGES.btn_submit;
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
