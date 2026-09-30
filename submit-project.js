const API_BASE = "https://pindai-hackathon-api.vercel.app/api";
const API_URL = `${API_BASE}/submit`;
const SEND_OTP_URL = `${API_BASE}/send-otp`;
const VERIFY_OTP_URL = `${API_BASE}/verify-otp`;

// Pesan bilingual (Thai / English)
const MSG = {
    choose_html: "เลือกไฟล์ .html / Choose .html file",
    choose_md: "เลือกไฟล์ .md / Choose .md file",
    sending: "กำลังส่ง... / Sending...",
    btn_submit: "ส่งผลงาน / Submit",
    err_words: "คำอธิบายเกินขีดจำกัด 100 คำ / Description exceeds the 100-word limit.",
    err_theme: "กรุณาเลือกธีมหัวข้อโปรเจกต์ / Please select a project theme.",
    err_required: "กรุณากรอกข้อมูลให้ครบทุกช่อง / Please fill in all required fields.",
    err_member: "กรุณากรอกสมาชิกอย่างน้อย 1 คน (หัวหน้าทีม) / Please enter at least 1 team member (Leader).",
    err_file_html: "กรุณาอัปโหลดไฟล์ HTML / Please upload an HTML file.",
    err_file_md: "กรุณาอัปโหลดไฟล์ Markdown (.md) / Please upload a Markdown (.md) file.",
    err_checkbox: "กรุณายืนยันเงื่อนไขทั้งหมด / Please confirm all the conditions.",
    err_connect: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองอีกครั้ง / Cannot connect to the server. Please try again.",
    err_email: "กรุณากรอกอีเมลที่ถูกต้อง / Please enter a valid email address.",
    err_not_verified: "กรุณายืนยันอีเมลก่อนส่งผลงาน / Please verify your email before submitting.",
    // OTP flow
    verify_btn: "ยืนยันอีเมล / Verify",
    verify_sending: "กำลังส่งรหัส... / Sending code...",
    verify_sent: "ส่งรหัส OTP ไปที่อีเมลของคุณแล้ว / An OTP has been sent to your email.",
    verify_resend: "ส่งรหัสใหม่ / Resend",
    otp_checking: "กำลังตรวจสอบ... / Checking...",
    otp_confirm: "ตรวจสอบรหัส / Confirm",
    otp_empty: "กรุณากรอกรหัส OTP / Please enter the OTP code.",
    verified_ok: "✓ อีเมลได้รับการยืนยันแล้ว / Email verified.",
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("hackathon-form");
    const submitBtn = document.getElementById("submit-btn");
    const submitBtnText = document.getElementById("submit-btn-text");
    const submitHint = document.getElementById("submit-hint");
    const messageBox = document.getElementById("form-message");

    // File elements
    const fileInput = document.getElementById("file_html");
    const fileChosenName = document.getElementById("file-chosen-name");
    const mdInput = document.getElementById("file_md");
    const mdChosenName = document.getElementById("md-file-chosen-name");

    const descInput = document.getElementById("project_description");
    const themeSelect = document.getElementById("project_theme");

    // Email verification elements
    const emailInput = document.getElementById("email");
    const verifyBtn = document.getElementById("verify-email-btn");
    const emailVerifyStatus = document.getElementById("email-verify-status");
    const otpBlock = document.getElementById("otp-block");
    const otpInput = document.getElementById("otp_code");
    const confirmOtpBtn = document.getElementById("confirm-otp-btn");
    const otpStatus = document.getElementById("otp-status");

    // Modal elements
    const successModal = document.getElementById("success-modal");
    const successModalClose = document.getElementById("success-modal-close");

    // Guard: jika elemen verifikasi OTP tidak ditemukan, berarti HTML belum diperbarui.
    // Hentikan setup verifikasi agar script tidak crash dan form tetap bisa diisi.
    if (!verifyBtn || !confirmOtpBtn || !otpBlock || !otpInput) {
        console.error("Elemen verifikasi OTP tidak ditemukan. Pastikan index.html sudah diperbarui.");
        if (submitBtn) submitBtn.disabled = false; // jangan kunci form kalau UI verifikasi belum ada
        return;
    }

    // State
    let verifiedEmail = null; // email yang sudah lolos verifikasi OTP

    // ---- File preview ----
    fileInput.addEventListener("change", () => {
        if (fileInput.files.length > 0) {
            fileChosenName.textContent = fileInput.files[0].name;
            fileChosenName.parentElement.classList.add("has-file");
        } else {
            fileChosenName.textContent = MSG.choose_html;
            fileChosenName.parentElement.classList.remove("has-file");
        }
    });

    mdInput.addEventListener("change", () => {
        if (mdInput.files.length > 0) {
            mdChosenName.textContent = mdInput.files[0].name;
            mdChosenName.parentElement.classList.add("has-file");
        } else {
            mdChosenName.textContent = MSG.choose_md;
            mdChosenName.parentElement.classList.remove("has-file");
        }
    });

    // ---- Email verification ----

    // Jika user mengubah email setelah verifikasi, reset status verifikasi
    emailInput.addEventListener("input", () => {
        const current = emailInput.value.trim().toLowerCase();
        if (verifiedEmail && current !== verifiedEmail) {
            resetVerification();
        }
    });

    verifyBtn.addEventListener("click", async () => {
        const email = emailInput.value.trim();
        if (!email || !emailRegex.test(email)) {
            setStatus(emailVerifyStatus, MSG.err_email, "error");
            emailInput.focus();
            return;
        }

        // Teks tombol yang akan dipulihkan setelah loading selesai.
        // Sekali OTP pernah dikirim, tombol berubah jadi "Resend".
        const restoreText = otpBlock.hidden ? MSG.verify_btn : MSG.verify_resend;
        setButtonLoading(verifyBtn, true, MSG.verify_sending);
        setStatus(emailVerifyStatus, "", "");

        let sentOk = false;
        try {
            const res = await fetch(SEND_OTP_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                setStatus(emailVerifyStatus, data.error || MSG.err_connect, "error");
                return;
            }

            sentOk = true;
            otpBlock.hidden = false;
            otpInput.focus();
            setStatus(emailVerifyStatus, MSG.verify_sent, "success");
        } catch (err) {
            console.error(err);
            setStatus(emailVerifyStatus, MSG.err_connect, "error");
        } finally {
            // Kalau berhasil kirim, tombol jadi "Resend"; kalau gagal, kembali ke teks semula.
            setButtonLoading(verifyBtn, false, sentOk ? MSG.verify_resend : restoreText);
        }
    });

    confirmOtpBtn.addEventListener("click", async () => {
        const email = emailInput.value.trim();
        const code = otpInput.value.trim();

        if (!code) {
            setStatus(otpStatus, MSG.otp_empty, "error");
            otpInput.focus();
            return;
        }

        setButtonLoading(confirmOtpBtn, true, MSG.otp_checking);
        setStatus(otpStatus, "", "");

        try {
            const res = await fetch(VERIFY_OTP_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, otp_code: code }),
            });
            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                setStatus(otpStatus, data.error || MSG.err_connect, "error");
                return;
            }

            // Verifikasi sukses
            verifiedEmail = email.toLowerCase();
            markVerified();
        } catch (err) {
            console.error(err);
            setStatus(otpStatus, MSG.err_connect, "error");
        } finally {
            setButtonLoading(confirmOtpBtn, false, MSG.otp_confirm);
        }
    });

    function markVerified() {
        setStatus(emailVerifyStatus, MSG.verified_ok, "success");
        otpStatus.textContent = "";
        otpBlock.hidden = true;
        emailInput.readOnly = true;
        verifyBtn.disabled = true;
        verifyBtn.classList.add("verified");
        // Aktifkan submit
        submitBtn.disabled = false;
        submitHint.hidden = true;
    }

    function resetVerification() {
        verifiedEmail = null;
        otpBlock.hidden = true;
        otpInput.value = "";
        otpStatus.textContent = "";
        emailInput.readOnly = false;
        verifyBtn.disabled = false;
        verifyBtn.classList.remove("verified");
        verifyBtn.textContent = MSG.verify_btn;
        setStatus(emailVerifyStatus, "", "");
        submitBtn.disabled = true;
        submitHint.hidden = false;
    }

    // ---- Submit ----
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        clearMessage();

        if (!verifiedEmail || emailInput.value.trim().toLowerCase() !== verifiedEmail) {
            showMessage(MSG.err_not_verified, "error");
            return;
        }

        // Field teks wajib: team name, project title, description
        const teamName = form.querySelector('[name="team_name"]').value.trim();
        const projectTitle = form.querySelector('[name="project_title"]').value.trim();
        const description = descInput.value.trim();

        if (!teamName || !projectTitle || !description) {
            showMessage(MSG.err_required, "error");
            return;
        }

        if (!themeSelect.value) {
            showMessage(MSG.err_theme, "error");
            return;
        }

        // Team members: minimal member_1 (leader) wajib, sisanya opsional
        const member1 = form.querySelector('[name="member_1"]').value.trim();
        if (!member1) {
            showMessage(MSG.err_member, "error");
            return;
        }

        // Hitung kata untuk teks berspasi (EN). Untuk teks Thai yang tidak
        // memakai spasi antar kata, gunakan batas karakter sebagai pengganti
        // (perkiraan sekitar 6 karakter per kata, jadi 100 kata kira-kira 600 karakter).
        const wordCount = description.split(/\s+/).filter(Boolean).length;
        const charCount = description.replace(/\s/g, "").length;
        if (wordCount > 100 || charCount > 600) {
            showMessage(MSG.err_words, "error");
            return;
        }

        // File HTML dan MD wajib diunggah
        if (!fileInput.files || fileInput.files.length === 0) {
            showMessage(MSG.err_file_html, "error");
            return;
        }
        if (!mdInput.files || mdInput.files.length === 0) {
            showMessage(MSG.err_file_md, "error");
            return;
        }

        // Kedua checkbox konfirmasi wajib dicentang
        const confirmNat = document.getElementById("confirm_nationality");
        const confirmTruth = document.getElementById("confirm_truth");
        if (!confirmNat.checked || !confirmTruth.checked) {
            showMessage(MSG.err_checkbox, "error");
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
                showMessage(data.error || "เกิดข้อผิดพลาดในการส่งข้อมูล / An error occurred.", "error");
                return;
            }

            // Sukses: tampilkan modal terima kasih
            form.reset();
            fileChosenName.textContent = MSG.choose_html;
            fileChosenName.parentElement.classList.remove("has-file");
            mdChosenName.textContent = MSG.choose_md;
            mdChosenName.parentElement.classList.remove("has-file");
            resetVerification();
            openModal();
        } catch (err) {
            console.error(err);
            showMessage(MSG.err_connect, "error");
        } finally {
            setLoading(false);
        }
    });

    // ---- Modal ----
    function openModal() {
        if (!successModal) {
            // Fallback jika markup modal belum ada di halaman
            showMessage(MSG.verify_sent ? "ส่งผลงานสำเร็จ! / Submission successful!" : "OK", "success");
            return;
        }
        successModal.hidden = false;
        // Force reflow agar animasi berjalan
        void successModal.offsetWidth;
        successModal.classList.add("visible");
        document.body.style.overflow = "hidden";
    }

    function closeModal() {
        if (!successModal) return;
        successModal.classList.remove("visible");
        document.body.style.overflow = "";
        setTimeout(() => { successModal.hidden = true; }, 300);
    }

    if (successModalClose) {
        successModalClose.addEventListener("click", closeModal);
    }
    if (successModal) {
        const backdrop = successModal.querySelector(".success-modal-backdrop");
        if (backdrop) backdrop.addEventListener("click", closeModal);
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && !successModal.hidden) closeModal();
        });
    }

    // ---- Helpers ----
    function setLoading(isLoading) {
        submitBtn.disabled = isLoading || !verifiedEmail;
        submitBtnText.textContent = isLoading ? MSG.sending : MSG.btn_submit;
    }

    function setButtonLoading(btn, isLoading, text) {
        btn.disabled = isLoading;
        if (text) btn.textContent = text;
    }

    function setStatus(el, text, type) {
        el.textContent = text;
        el.className = "verify-status" + (type ? " " + type : "");
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
