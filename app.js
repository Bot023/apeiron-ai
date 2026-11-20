
const API_URL = window.APEIRON_API_URL;

const form = document.getElementById("chatForm");
const input = document.getElementById("messageInput");
const messagesEl = document.getElementById("messages");
const welcome = document.getElementById("welcome");
const sendButton = document.getElementById("sendButton");

let history = [];
let busy = false;

function addMessage(role, content) {
  welcome.hidden = true;

  const message = document.createElement("div");
  message.className = `message ${role}`;

  const label = document.createElement("span");
  label.className = "message-label";
  label.textContent = role === "user" ? "YOU" : "APEIRON";

  const body = document.createElement("div");
  body.textContent = content;

  message.append(label, body);
  messagesEl.appendChild(message);
  messagesEl.scrollTop = messagesEl.scrollHeight;

  return message;
}

function setBusy(value) {
  busy = value;
  sendButton.disabled = value;
  sendButton.textContent = value ? "…" : "↑";
  input.disabled = value;
}

async function sendMessage(text) {
  const content = text.trim();

  if (!content || busy) return;

  if (!API_URL || API_URL.includes("YOUR-WORKER-URL")) {
    addMessage("assistant", "Apeiron needs its backend URL configured. Please complete the deployment setup first.");
    return;
  }

  addMessage("user", content);
  history.push({ role: "user", content });

  input.value = "";
  input.style.height = "auto";
  setBusy(true);

  const thinking = addMessage("assistant", "Connecting to the intelligence engine...");

  try {
    const response = await fetch(`${API_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: history.slice(-12)
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `Server returned ${response.status}`);
    }

    if (typeof data.reply !== "string" || !data.reply.trim()) {
      throw new Error("The AI returned an empty response.");
    }

    thinking.querySelector("div").textContent = data.reply;

    history.push({
      role: "assistant",
      content: data.reply
    });

    messagesEl.scrollTop = messagesEl.scrollHeight;

  } catch (error) {
    thinking.querySelector("div").textContent =
      `Connection error: ${error.message}. Please try again.`;

    // Keep the user's message in the conversation context.
    history.pop();
  } finally {
    setBusy(false);
    input.focus();
  }
}

form.addEventListener("submit", event => {
  event.preventDefault();
  sendMessage(input.value);
});

input.addEventListener("input", () => {
  input.style.height = "auto";
  input.style.height = `${Math.min(input.scrollHeight, 160)}px`;
});

document.querySelectorAll(".suggestion").forEach(button => {
  button.addEventListener("click", () => {
    sendMessage(button.dataset.prompt);
  });
});

document.querySelectorAll("[data-prompt]").forEach(button => {
  button.addEventListener("click", () => {
    showPage("chat");
    sendMessage(button.dataset.prompt);
  });
});

document.querySelectorAll("[data-page]").forEach(button => {
  button.addEventListener("click", () => {
    showPage(button.dataset.page);
  });
});

function showPage(name) {
  document.querySelectorAll(".page").forEach(page => {
    page.classList.remove("active");
  });

  document.querySelectorAll(".nav-item").forEach(button => {
    button.classList.toggle("active", button.dataset.page === name);
  });

  const target = document.getElementById(`${name}Page`);

  if (target) target.classList.add("active");

  document.getElementById("pageName").textContent =
    name.replace(/([A-Z])/g, " $1").toUpperCase();

  document.getElementById("sidebar").classList.remove("open");
}

document.querySelectorAll(".nav-item").forEach(button => {
  button.addEventListener("click", () => showPage(button.dataset.page));
});

document.getElementById("newChat").addEventListener("click", () => {
  history = [];
  messagesEl.replaceChildren();
  welcome.hidden = false;
  showPage("chat");
  input.value = "";
});

document.getElementById("menuToggle").addEventListener("click", () => {
  document.getElementById("sidebar").classList.toggle("open");
});

document.getElementById("generateCode").addEventListener("click", () => {
  const language = document.getElementById("language").value;
  const request = document.getElementById("codeRequest").value.trim();

  if (!request) {
    document.getElementById("codeRequest").focus();
    return;
  }

  showPage("chat");
  sendMessage(
    `Act as a senior software engineer. Generate complete ${language} code for: ${request}. Include dependencies, error handling, setup and testing instructions.`
  );
});
