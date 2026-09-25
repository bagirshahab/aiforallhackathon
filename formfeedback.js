const API_URL = "https://pindai-hackathon-api.vercel.app/api/feedback";

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("feedback-form");
    const submitBtn = document.getElementById("submit-btn");
    const submitBtnText = document.getElementById("submit-btn-text");
    const messageBox = document.getElementById("form-message");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        clearMessage();

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        // Validasi sederhana
        if (!data.full_name || !data.email || !data.q1_score || !data.q2_score || !data.q3_score) {
            showMessage("กรุณากรอกข้อมูลและเลือกคะแนนให้ครบทุกข้อ", "error");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });

            const result = await res.json().catch(() => ({}));

            if (!res.ok) {
                showMessage(result.error || "เกิดข้อผิดพลาดในการส่งข้อมูล", "error");
                return;
            }

            showMessage("ส่งแบบประเมินเรียบร้อยแล้ว ขอบคุณสำหรับความคิดเห็นของคุณ!", "success");
            form.reset();
        } catch (err) {
            console.error(err);
            showMessage("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองอีกครั้ง", "error");
        } finally {
            setLoading(false);
        }
    });

    function setLoading(isLoading) {
        submitBtn.disabled = isLoading;
        submitBtnText.textContent = isLoading ? "กำลังส่ง..." : "ส่งแบบ评估 / Submit Feedback";
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
