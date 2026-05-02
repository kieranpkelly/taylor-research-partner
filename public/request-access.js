const elements = {
  form: document.querySelector("#accessRequestForm"),
  email: document.querySelector("#requestEmail"),
  name: document.querySelector("#requestName"),
  note: document.querySelector("#requestNote"),
  submit: document.querySelector("#requestSubmit"),
  status: document.querySelector("#requestStatus")
};

elements.form.addEventListener("submit", async (event) => {
  event.preventDefault();
  await submitAccessRequest();
});

async function submitAccessRequest() {
  const email = elements.email.value.trim();
  if (!isLikelyEmail(email)) {
    elements.status.textContent = "Enter a complete email address.";
    return;
  }

  elements.submit.disabled = true;
  elements.status.textContent = "Sending request...";
  try {
    const response = await fetch("/api/access-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        name: elements.name.value.trim(),
        note: elements.note.value.trim()
      })
    });
    const text = await response.text();
    const payload = text ? JSON.parse(text) : {};
    if (!response.ok) throw new Error(payload.error ?? text);
    elements.status.textContent = payload.message || "Access request received.";
    elements.form.reset();
  } catch (error) {
    elements.status.textContent = error.message || "Could not submit the request.";
  } finally {
    elements.submit.disabled = false;
  }
}

function isLikelyEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value ?? "").trim());
}
