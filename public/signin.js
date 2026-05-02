const elements = {
  form: document.querySelector("#signInForm"),
  email: document.querySelector("#signInEmail"),
  submit: document.querySelector("#signInSubmit"),
  status: document.querySelector("#signInStatus")
};

let supabase = null;
let redirectUrl = window.location.origin;

await initializeSignIn();

elements.form.addEventListener("submit", async (event) => {
  event.preventDefault();
  await sendSignInLink();
});

async function initializeSignIn() {
  try {
    const config = await getJson("/api/auth/config");
    redirectUrl = config.appUrl || window.location.origin;

    if (!config.authRequired) {
      window.location.replace("/");
      return;
    }

    if (!config.supabaseReady || config.configError) {
      elements.status.textContent = config.configError || "Private access is not configured yet.";
      elements.submit.disabled = true;
      return;
    }

    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    supabase = createClient(config.supabaseUrl, config.supabaseAnonKey, {
      auth: {
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true
      }
    });

    const { data } = await supabase.auth.getSession();
    if (data.session) {
      window.location.replace("/");
      return;
    }

    supabase.auth.onAuthStateChange((_event, session) => {
      if (session) window.location.replace("/");
    });
  } catch (error) {
    elements.status.textContent = friendlyError(error);
    elements.submit.disabled = true;
  }
}

async function sendSignInLink() {
  if (!supabase) return;
  const email = elements.email.value.trim();
  if (!isLikelyEmail(email)) {
    elements.status.textContent = "Enter your complete approved email address.";
    return;
  }

  elements.submit.disabled = true;
  elements.status.textContent = "Sending sign-in link...";
  try {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: redirectUrl
      }
    });
    if (error) throw error;
    elements.status.textContent = "Check your email for the sign-in link.";
  } catch (error) {
    elements.status.textContent = friendlyError(error);
  } finally {
    elements.submit.disabled = false;
  }
}

async function getJson(url) {
  const response = await fetch(url, { headers: { "Cache-Control": "no-store" } });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};
  if (!response.ok) throw new Error(payload.error ?? text);
  return payload;
}

function isLikelyEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value ?? "").trim());
}

function friendlyError(error) {
  const message = String(error?.message ?? error ?? "");
  if (/signups?\s+not\s+allowed|otp|not\s+found/i.test(message)) {
    return "That email is not on the approved private-access list yet.";
  }
  return message || "Could not send a sign-in link.";
}
