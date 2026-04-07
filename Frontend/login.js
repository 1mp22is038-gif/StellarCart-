const API = CONFIG.API_URL;

let registeredEmail = "";

window.onload = () => {
    if (localStorage.getItem("token")) {
        window.location.href = "index.html";
    }
};

function showBox(id) {
    document.getElementById("login-box").classList.add("hidden");
    document.getElementById("register-box").classList.add("hidden");
    document.getElementById("otp-box").classList.add("hidden");
    document.getElementById(id).classList.remove("hidden");
}

function showToast(msg, type = "success") {
    const toast = document.getElementById("toast");
    toast.textContent = msg;
    toast.className = `toast show ${type === 'error' ? 'error' : ''}`;
    setTimeout(() => toast.classList.remove("show"), 4000);
}

// 1. Login Handler
document.getElementById("login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    try {
        const res = await fetch(`${API}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });
        let data;
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            data = await res.json();
        } else {
            throw new Error(`Server returned a ${res.status} error (Not JSON). Is the API URL correct?`);
        }
        if (!res.ok) throw new Error(data.error || "Login failed.");

        localStorage.setItem("token", data.token);
        window.location.href = "index.html";
    } catch (err) {
        showToast(err.message, "error");
    }
});

// 2. Register Handler
document.getElementById("register-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("reg-name").value;
    const phone = document.getElementById("reg-phone").value;
    const email = document.getElementById("reg-email").value;
    const password = document.getElementById("reg-password").value;

    try {
        const res = await fetch(`${API}/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, phone, email, password })
        });
        let data;
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            data = await res.json();
        } else {
            throw new Error(`Server returned a ${res.status} error (Not JSON). Is the API URL correct?`);
        }
        if (!res.ok) throw new Error(data.error || "Registration failed.");

        registeredEmail = email;
        showToast(data.message, "success");
        showBox("login-box");
        document.getElementById("login-email").value = email;
    } catch (err) {
        showToast(err.message, "error");
    }
});

// 3. OTP Verification Handler
document.getElementById("otp-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const otp = document.getElementById("verify-otp").value;

    try {
        const res = await fetch(`${API}/verify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: registeredEmail, otp })
        });
        let data;
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            data = await res.json();
        } else {
            throw new Error(`Server returned a ${res.status} error (Not JSON). Is the API URL correct?`);
        }
        if (!res.ok) throw new Error(data.error || "Verification failed.");

        showToast("Verified! Please Login.", "success");
        document.getElementById("login-email").value = registeredEmail;
        showBox("login-box");
    } catch (err) {
        showToast(err.message, "error");
    }
});
