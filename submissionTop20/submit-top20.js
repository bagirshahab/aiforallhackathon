const API_BASE = "https://pindai-hackathon-api.vercel.app/api";
const SUBMIT_URL = `${API_BASE}/submit-top20`;
// Verifikasi email memakai endpoint yang sama dengan form utama.
const SEND_OTP_URL = `${API_BASE}/send-otp`;
const VERIFY_OTP_URL = `${API_BASE}/verify-otp`;

const SUBMIT_TIMEOUT_MS = 60000;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MSG = {
    sending: "กำลังส่ง... / Sending...",
    btn_submit: "ส่งผลงาน / Submit",
    err_required: "กรุณากรอกข้อมูลให้ครบทุกช่อง / Please fill in all required fields.",
    err_member: "กรุณากรอกสมาชิกอย่างน้อย 1 คน (หัวหน้าทีม) / Please enter at least 1 team member (Leader).",
    err_links: "กรุณาแก้ไขลิงก์ที่ไม่ถูกต้องก่อนส่ง / Please fix the invalid links before submitting.",
    err_choice: "กรุณาตอบทั้งสองข้อ: Amazon Bedrock และ AgentCore / Please answer both questions: Amazon Bedrock and AgentCore.",
    err_email: "กรุณากรอกอีเมลที่ถูกต้อง / Please enter a valid email address.",
    err_not_verified: "กรุณายืนยันอีเมลก่อนส่งผลงาน / Please verify your email before submitting.",
    err_connect: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองอีกครั้ง / Cannot connect to the server. Please try again.",
    err_network: "การเชื่อมต่อขัดข้อง กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่ / Connection failed. Please check your internet and try again.",
    err_timeout: "การส่งใช้เวลานานเกินไป กรุณาลองใหม่ / The submission took too long. Please try again.",
    verify_btn: "ยืนยันอีเมล / Verify",
    verify_sending: "กำลังส่งรหัส... / Sending code...",
    verify_sent: "ส่งรหัส OTP ไปที่อีเมลของคุณแล้ว / An OTP has been sent to your email.",
    verify_resend: "ส่งรหัสใหม่ / Resend",
    otp_checking: "กำลังตรวจสอบ... / Checking...",
    otp_confirm: "ตรวจสอบรหัส / Confirm",
    otp_empty: "กรุณากรอกรหัส OTP / Please enter the OTP code.",
    verified_ok: "✓ อีเมลได้รับการยืนยันแล้ว / Email verified.",
    // ข้อความของลิงก์ / link messages
    web_empty: "กรุณากรอกลิงก์เว็บไซต์ / Please enter the website link.",
    web_invalid: "ลิงก์เว็บไซต์ไม่ถูกต้อง ต้องเป็นลิงก์เต็มที่ขึ้นต้นด้วย https:// เช่น https://myproject.example.com / Invalid website link. It must be a full link starting with https:// (e.g. https://myproject.example.com).",
    web_is_repo: "ช่องนี้ต้องเป็นลิงก์เว็บไซต์ ไม่ใช่ลิงก์ repository / This field needs a live website link, not a repository link.",
    repo_empty: "กรุณากรอกลิงก์ repository / Please enter the repository link.",
    repo_invalid: "ลิงก์ repository ไม่ถูกต้อง ต้องเป็นลิงก์เต็มที่ขึ้นต้นด้วย https:// / Invalid repository link. It must be a full link starting with https://.",
    repo_not_repo: "ต้องเป็นลิงก์ AWS CodeCommit (private repository) เท่านั้น ไม่รับ GitHub, GitLab หรือ Bitbucket / Only AWS CodeCommit (private repository) links are accepted. GitHub, GitLab and Bitbucket are not allowed.",
    repo_incomplete: "ลิงก์ต้องชี้ไปที่ repository ใน AWS CodeCommit เช่น https://git-codecommit.ap-southeast-1.amazonaws.com/v1/repos/ชื่อ-repo / The link must point to a CodeCommit repository.",
};

// ---- Validasi link (aturan sama persis dengan server) ----
const REPO_HOSTS = ["github.com", "gitlab.com", "bitbucket.org", "codeberg.org"];
const GITHUB_RESERVED = ["about", "features", "pricing", "login", "logout", "join", "signup", "settings", "topics", "marketplace", "orgs", "sponsors", "explore", "notifications", "pulls", "issues", "search", "new", "organizations", "enterprise", "collections", "trending", "events", "apps", "readme", "security", "site", "contact", "customer-stories"];
const MAX_URL_LENGTH = 300;

function parseHttpUrl(raw) {
    const s = String(raw == null ? "" : raw).trim();
    if (!s || s.length > MAX_URL_LENGTH || /\s/.test(s)) return null;
    let u;
    try { u = new URL(s); } catch (e) { return null; }
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    if (u.username || u.password) return null;
    return u;
}

function isPublicHostname(host) {
    const h = String(host).toLowerCase();
    if (h === "localhost" || h.endsWith(".localhost") || h.endsWith(".local") || h.endsWith(".internal")) return false;
    if (h.includes(":") || /^\d{1,3}(\.\d{1,3}){3}$/.test(h)) return false;
    return /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+(xn--[a-z0-9-]{2,59}|[a-z]{2,63})$/.test(h);
}

function validateWebsiteUrl(raw) {
    const u = parseHttpUrl(raw);
    if (!u) return { ok: false, reason: "invalid" };
    const host = u.hostname.toLowerCase();
    if (!isPublicHostname(host)) return { ok: false, reason: "invalid" };
    if (REPO_HOSTS.includes(host.replace(/^www\./, ""))) return { ok: false, reason: "is_repo" };
    return { ok: true, value: u.href };
}

// Repository: hanya AWS CodeCommit.
// Diterima: URL clone HTTPS  https://git-codecommit.<region>.amazonaws.com/v1/repos/<nama>
//           URL console      https://<region>.console.aws.amazon.com/codesuite/codecommit/repositories/<nama>/...
function validateRepoUrl(raw) {
    const u = parseHttpUrl(raw);
    if (!u || u.protocol !== "https:") return { ok: false, reason: "invalid" };
    const host = u.hostname.toLowerCase();
    const segs = u.pathname.split("/").filter(Boolean);
    const nameRe = /^[A-Za-z0-9_.-]{1,100}$/;
    let m = host.match(/^git-codecommit(?:-fips)?\.([a-z]{2}(?:-[a-z]+)+-\d)\.amazonaws\.com(?:\.cn)?$/);
    if (m) {
        if (segs[0] !== "v1" || segs[1] !== "repos" || !segs[2]) return { ok: false, reason: "repo_incomplete" };
        const name = segs[2].replace(/\.git$/i, "");
        if (!nameRe.test(name)) return { ok: false, reason: "repo_incomplete" };
        return { ok: true, value: "https://" + host + "/v1/repos/" + name };
    }
    m = host.match(/^(?:[a-z]{2}(?:-[a-z]+)+-\d)\.console\.aws\.amazon\.com$/);
    if (m) {
        if (segs[0] !== "codesuite" || segs[1] !== "codecommit" || segs[2] !== "repositories" || !segs[3]) return { ok: false, reason: "repo_incomplete" };
        if (!nameRe.test(segs[3])) return { ok: false, reason: "repo_incomplete" };
        return { ok: true, value: u.origin + "/codesuite/codecommit/repositories/" + segs[3] + u.search };
    }
    return { ok: false, reason: "not_repo" };
}


// Hasil validasi -> pesan error (atau "" kalau valid)
function websiteError(raw) {
    if (!String(raw || "").trim()) return MSG.web_empty;
    const r = validateWebsiteUrl(raw);
    if (r.ok) return "";
    return r.reason === "is_repo" ? MSG.web_is_repo : MSG.web_invalid;
}
// Repository: WAJIB. Harus diisi dan harus link repo yang benar.
function repoError(raw) {
    if (!String(raw || "").trim()) return MSG.repo_empty;
    const r = validateRepoUrl(raw);
    if (r.ok) return "";
    if (r.reason === "not_repo") return MSG.repo_not_repo;
    if (r.reason === "repo_incomplete") return MSG.repo_incomplete;
    return MSG.repo_invalid;
}

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("top20-form");
    const submitBtn = document.getElementById("submit-btn");
    const submitBtnText = document.getElementById("submit-btn-text");
    const submitHint = document.getElementById("submit-hint");
    const messageBox = document.getElementById("form-message");

    const emailInput = document.getElementById("email");
    const verifyBtn = document.getElementById("verify-email-btn");
    const emailVerifyStatus = document.getElementById("email-verify-status");
    const otpBlock = document.getElementById("otp-block");
    const otpInput = document.getElementById("otp_code");
    const confirmOtpBtn = document.getElementById("confirm-otp-btn");
    const otpStatus = document.getElementById("otp-status");

    const websiteInput = document.getElementById("website_url");
    const repoInput = document.getElementById("repo_url");
    const websiteErr = document.getElementById("website_url-error");
    const repoErr = document.getElementById("repo_url-error");
    const bedrockGroup = document.getElementById("bedrock-group");
    const agentcoreGroup = document.getElementById("agentcore-group");

    const successModal = document.getElementById("success-modal");
    const successModalClose = document.getElementById("success-modal-close");

    let verifiedEmail = null;

    // ---- Validasi link langsung saat mengetik / pindah kolom ----
    function showFieldError(input, errEl, msg) {
        errEl.textContent = msg;
        input.classList.toggle("invalid", !!msg);
    }
    function checkWebsite() { const m = websiteError(websiteInput.value); showFieldError(websiteInput, websiteErr, m); return !m; }
    function checkRepo() { const m = repoError(repoInput.value); showFieldError(repoInput, repoErr, m); return !m; }

    // Pilihan Yes/No: true / false, atau null kalau belum dijawab.
    function choiceOf(name) {
        const el = form.querySelector(`input[name="${name}"]:checked`);
        return el ? el.value === "yes" : null;
    }
    function checkChoices() {
        const bedrockOk = choiceOf("bedrock_used") !== null;
        const agentcoreOk = choiceOf("agentcore_used") !== null;
        bedrockGroup.classList.toggle("invalid", !bedrockOk);
        agentcoreGroup.classList.toggle("invalid", !agentcoreOk);
        return bedrockOk && agentcoreOk;
    }

    websiteInput.addEventListener("blur", () => { if (websiteInput.value.trim()) checkWebsite(); });
    repoInput.addEventListener("blur", () => { if (repoInput.value.trim()) checkRepo(); });
    websiteInput.addEventListener("input", () => { if (websiteInput.classList.contains("invalid")) checkWebsite(); });
    repoInput.addEventListener("input", () => { if (repoInput.classList.contains("invalid")) checkRepo(); });
    form.querySelectorAll('input[type="radio"]').forEach((r) => r.addEventListener("change", () => {
        if (choiceOf("bedrock_used") !== null) bedrockGroup.classList.remove("invalid");
        if (choiceOf("agentcore_used") !== null) agentcoreGroup.classList.remove("invalid");
    }));

    // ---- Verifikasi email (sama dengan form utama) ----
    emailInput.addEventListener("input", () => {
        const current = emailInput.value.trim().toLowerCase();
        if (verifiedEmail && current !== verifiedEmail) resetVerification();
    });

    verifyBtn.addEventListener("click", async () => {
        const email = emailInput.value.trim();
        if (!email || !emailRegex.test(email)) {
            setStatus(emailVerifyStatus, MSG.err_email, "error");
            emailInput.focus();
            return;
        }

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

        const teamName = form.querySelector('[name="team_name"]').value.trim();
        const projectTitle = form.querySelector('[name="project_title"]').value.trim();
        if (!teamName || !projectTitle) {
            showMessage(MSG.err_required, "error");
            return;
        }

        const members = [1, 2, 3, 4, 5]
            .map((i) => form.querySelector(`[name="member_${i}"]`).value.trim())
            .filter(Boolean);
        if (!form.querySelector('[name="member_1"]').value.trim()) {
            showMessage(MSG.err_member, "error");
            return;
        }

        // Bedrock & AgentCore wajib dijawab
        if (!checkChoices()) {
            showMessage(MSG.err_choice, "error");
            return;
        }

        // Website & repo (CodeCommit) wajib valid.
        // Kalau ada yang salah, form tidak dikirim.
        const webOk = checkWebsite();
        const repoOk = checkRepo();
        if (!webOk || !repoOk) {
            showMessage(MSG.err_links, "error");
            (!webOk ? websiteInput : repoInput).focus();
            return;
        }

        const payload = {
            team_name: teamName,
            email: emailInput.value.trim(),
            project_title: projectTitle,
            members,
            website_url: websiteInput.value.trim(),
            repo_url: repoInput.value.trim(),
            notes: document.getElementById("notes").value.trim(), // opsional
            bedrock_used: choiceOf("bedrock_used"),
            agentcore_used: choiceOf("agentcore_used"),
        };

        setLoading(true);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), SUBMIT_TIMEOUT_MS);

        try {
            const res = await fetch(SUBMIT_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
                signal: controller.signal,
            });
            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                showMessage(data.error || "เกิดข้อผิดพลาดในการส่งข้อมูล / An error occurred.", "error");
                return;
            }

            form.reset();
            showFieldError(websiteInput, websiteErr, "");
            showFieldError(repoInput, repoErr, "");
            bedrockGroup.classList.remove("invalid");
            agentcoreGroup.classList.remove("invalid");
            resetVerification();
            openModal();
        } catch (err) {
            console.error(err);
            showMessage(err.name === "AbortError" ? MSG.err_timeout : MSG.err_network, "error");
        } finally {
            clearTimeout(timeoutId);
            setLoading(false);
        }
    });

    // ---- Modal ----
    function openModal() {
        if (!successModal) {
            showMessage("ส่งผลงานสำเร็จ! / Submission successful!", "success");
            return;
        }
        successModal.hidden = false;
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

    if (successModalClose) successModalClose.addEventListener("click", closeModal);
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
