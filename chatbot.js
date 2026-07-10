/* ===== FAQ Chatbot Widget — rule-based, no API, answers from resume data ===== */
(function () {
  "use strict";

  // ---------------------------------------------------------------------
  // EDIT THIS: knowledge base. Add/remove entries, tweak keywords/answers
  // to match your real resume info once you fill in the site pages.
  // Each entry: keywords (lowercase words/phrases to match) + answer (HTML ok).
  // ---------------------------------------------------------------------
  var KB = [
    {
      keywords: ["who are you", "who is murugavel", "about you", "introduce", "yourself"],
      answer: "I'm Murugavel's site assistant. Murugavel is currently working as [Your Job Title Here]. Check the <a href='about.html'>About page</a> for the full story."
    },
    {
      keywords: ["skill", "tech stack", "technology", "tools", "know"],
      answer: "Murugavel's key skills are listed on the <a href='about.html'>About page</a>. Feel free to head there for the full list."
    },
    {
      keywords: ["experience", "work history", "job", "worked", "company", "employer"],
      answer: "You can see Murugavel's full work history on the <a href='experience.html'>Experience page</a>."
    },
    {
      keywords: ["education", "degree", "college", "university", "study", "studied"],
      answer: "Education details are on the <a href='experience.html'>Experience page</a>, under the Education section."
    },
    {
      keywords: ["project", "built", "portfolio", "work sample", "github"],
      answer: "Take a look at the <a href='projects.html'>Projects page</a> for things Murugavel has built."
    },
    {
      keywords: ["contact", "email", "phone", "reach", "hire", "linkedin", "connect"],
      answer: "Best way to connect is via the <a href='contact.html'>Contact page</a> — it has email, phone, and social links."
    },
    {
      keywords: ["available", "open to work", "hiring", "looking for", "job opportunity"],
      answer: "Yes — Murugavel is currently open to new opportunities. Reach out via the <a href='contact.html'>Contact page</a>."
    },
    {
      keywords: ["hello", "hi", "hey", "good morning", "good evening"],
      answer: "Hey there! I can answer quick questions about Murugavel's background, skills, experience, or how to get in touch. What would you like to know?"
    },
    {
      keywords: ["thank", "thanks", "thank you"],
      answer: "You're welcome! Let me know if you have any other questions."
    },
    {
      keywords: ["notice period", "how soon", "start date", "join immediately", "when can you start"],
      answer: "Notice period: [Your notice period here — e.g. 'Immediate' or '30 days']. You can confirm details via the <a href='contact.html'>Contact page</a>."
    },
    {
      keywords: ["relocate", "relocation", "move to", "willing to move", "shift city"],
      answer: "Relocation: [Your relocation preference here — e.g. 'Open to relocating' or 'Prefer remote']. Feel free to ask directly via <a href='contact.html'>Contact</a>."
    },
    {
      keywords: ["remote", "work from home", "onsite", "hybrid", "wfh"],
      answer: "Work mode preference: [Your preference here — e.g. Remote / Hybrid / Onsite]. Happy to discuss specifics — <a href='contact.html'>get in touch</a>."
    },
    {
      keywords: ["salary", "compensation", "ctc", "pay", "expected package"],
      answer: "Salary expectations are best discussed directly — please reach out via the <a href='contact.html'>Contact page</a> and Murugavel will respond."
    },
    {
      keywords: ["resume", "cv", "download resume", "download cv"],
      answer: "You can download the full resume here: <a href='#' target='_blank'>[Add your resume PDF link here]</a>. (Tip: upload a PDF to your repo and link it.)"
    },
    {
      keywords: ["interview", "schedule", "call", "meeting", "book a call"],
      answer: "Happy to set up a call — please share your availability via the <a href='contact.html'>Contact page</a> and Murugavel will follow up."
    },
    {
      keywords: ["freelance", "contract", "part time", "internship", "full time"],
      answer: "Open to discussing full-time, contract, or freelance opportunities depending on fit — reach out via <a href='contact.html'>Contact</a> to talk specifics."
    },
    {
      keywords: ["language", "spoken language", "english", "tamil"],
      answer: "Language details are listed on the <a href='about.html'>About page</a> under 'Beyond work'."
    },
    {
      keywords: ["certification", "certificate", "certified"],
      answer: "Any certifications are listed on the <a href='about.html'>About page</a>. Let me know if you're looking for something specific."
    },
    {
      keywords: ["location", "based in", "where are you", "city", "based"],
      answer: "Location: Tamil Nadu, India (see the <a href='contact.html'>Contact page</a> for full details)."
    },
    {
      keywords: ["bye", "goodbye", "see you", "exit"],
      answer: "Thanks for stopping by! Feel free to reach out anytime via the <a href='contact.html'>Contact page</a>. 👋"
    }
  ];

  var FALLBACK =
    "I don't have an answer for that yet, but you can reach Murugavel directly via the <a href='contact.html'>Contact page</a>.";

  // ---------------------------------------------------------------------
  // AI fallback config. Set ENABLE_AI_FALLBACK to true once you've:
  //   1. Added your OPENAI_API_KEY in Vercel (Settings -> Environment Variables)
  //   2. Deployed the /api/chat.js function that ships with this project
  // Until then, leave this false — the bot stays 100% free (FAQ-only).
  // ---------------------------------------------------------------------
  var ENABLE_AI_FALLBACK = false;
  var AI_ENDPOINT = "/api/chat";

  var SUGGESTIONS = [
    "Skills", "Experience", "Projects", "Contact", "Education",
    "Notice period", "Remote work", "Relocation", "Salary",
    "Resume", "Interview", "Certifications", "Location",
    "Freelance", "Languages", "Available?"
  ];
  var CHIP_BATCH_SIZE = 5;

  // ---------------------------------------------------------------------
  // Matching: score each KB entry by number of keyword hits in the message.
  // Returns null if nothing matched well enough (caller decides fallback).
  // ---------------------------------------------------------------------
  function findAnswer(message) {
    var msg = message.toLowerCase();
    var best = null;
    var bestScore = 0;

    for (var i = 0; i < KB.length; i++) {
      var entry = KB[i];
      var score = 0;
      for (var j = 0; j < entry.keywords.length; j++) {
        if (msg.indexOf(entry.keywords[j]) !== -1) score++;
      }
      if (score > bestScore) {
        bestScore = score;
        best = entry;
      }
    }
    return best ? best.answer : null;
  }

  // ---------------------------------------------------------------------
  // Calls the /api/chat serverless function (OpenAI-backed). Only used
  // when ENABLE_AI_FALLBACK is true and no FAQ match was found.
  // ---------------------------------------------------------------------
  async function askAI(message) {
    try {
      var res = await fetch(AI_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message })
      });
      var data = await res.json();
      if (!res.ok) {
        return data.error
          ? "AI error: " + data.error
          : FALLBACK;
      }
      return data.reply || FALLBACK;
    } catch (err) {
      return FALLBACK;
    }
  }

  // ---------------------------------------------------------------------
  // Build widget DOM
  // ---------------------------------------------------------------------
  function buildWidget() {
    var toggle = document.createElement("button");
    toggle.id = "faq-bot-toggle";
    toggle.setAttribute("aria-label", "Open chat assistant");
    toggle.textContent = "💬";

    var panel = document.createElement("div");
    panel.id = "faq-bot-panel";
    panel.innerHTML =
      '<div id="faq-bot-header">' +
        '<span>Ask about Murugavel</span>' +
        '<button id="faq-bot-close" aria-label="Close chat">&times;</button>' +
      '</div>' +
      '<div id="faq-bot-messages"></div>' +
      '<div id="faq-bot-suggestions-row">' +
        '<div id="faq-bot-suggestions"></div>' +
        '<button id="faq-bot-rotate" type="button" aria-label="Show more topics" title="Show more topics">⟳</button>' +
      '</div>' +
      '<div id="faq-bot-inputrow">' +
        '<input id="faq-bot-input" type="text" placeholder="Type a question..." autocomplete="off">' +
        '<button id="faq-bot-send">Send</button>' +
      '</div>';

    document.body.appendChild(toggle);
    document.body.appendChild(panel);

    var messages = panel.querySelector("#faq-bot-messages");
    var suggestionsBox = panel.querySelector("#faq-bot-suggestions");
    var rotateBtn = panel.querySelector("#faq-bot-rotate");
    var input = panel.querySelector("#faq-bot-input");
    var sendBtn = panel.querySelector("#faq-bot-send");
    var closeBtn = panel.querySelector("#faq-bot-close");

    function addMessage(text, who) {
      var div = document.createElement("div");
      div.className = "faq-msg " + who;
      div.innerHTML = text;
      messages.appendChild(div);
      messages.scrollTop = messages.scrollHeight;
    }

    function handleSend(text) {
      text = (text || "").trim();
      if (!text) return;
      addMessage(text.replace(/</g, "&lt;"), "user");
      input.value = "";

      var faqAnswer = findAnswer(text);

      if (faqAnswer) {
        setTimeout(function () {
          addMessage(faqAnswer, "bot");
        }, 300);
        return;
      }

      if (!ENABLE_AI_FALLBACK) {
        setTimeout(function () {
          addMessage(FALLBACK, "bot");
        }, 300);
        return;
      }

      // No FAQ match, AI fallback is enabled: show a thinking indicator,
      // call the serverless function, then replace it with the real reply.
      var thinkingEl = document.createElement("div");
      thinkingEl.className = "faq-msg bot";
      thinkingEl.textContent = "Thinking...";
      messages.appendChild(thinkingEl);
      messages.scrollTop = messages.scrollHeight;

      askAI(text).then(function (reply) {
        thinkingEl.innerHTML = reply;
        messages.scrollTop = messages.scrollHeight;
      });
    }

    // Render all chips into the scrollable row (drag/swipe to browse)
    function renderChips() {
      suggestionsBox.innerHTML = "";
      SUGGESTIONS.forEach(function (label) {
        var chip = document.createElement("button");
        chip.className = "faq-chip-btn";
        chip.type = "button";
        chip.textContent = label;
        chip.addEventListener("click", function () { handleSend(label); });
        suggestionsBox.appendChild(chip);
      });
    }
    renderChips();

    // Rotate button: pages the scroll position forward by one batch,
    // looping back to the start once it reaches the end
    rotateBtn.addEventListener("click", function () {
      rotateBtn.classList.add("spin");
      setTimeout(function () { rotateBtn.classList.remove("spin"); }, 250);

      var chipWidth = suggestionsBox.firstChild
        ? suggestionsBox.firstChild.getBoundingClientRect().width + 6
        : 90;
      var step = chipWidth * CHIP_BATCH_SIZE;
      var atEnd =
        suggestionsBox.scrollLeft + suggestionsBox.clientWidth >=
        suggestionsBox.scrollWidth - 4;

      if (atEnd) {
        suggestionsBox.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        suggestionsBox.scrollBy({ left: step, behavior: "smooth" });
      }
    });

    toggle.addEventListener("click", function () {
      panel.classList.toggle("open");
      if (panel.classList.contains("open") && messages.children.length === 0) {
        addMessage(
          "Hi! I'm a quick FAQ assistant for Murugavel's profile. Ask me about skills, experience, projects, or how to get in touch.",
          "bot"
        );
      }
      if (panel.classList.contains("open")) input.focus();
    });

    closeBtn.addEventListener("click", function () {
      panel.classList.remove("open");
    });

    sendBtn.addEventListener("click", function () { handleSend(input.value); });
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") handleSend(input.value);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", buildWidget);
  } else {
    buildWidget();
  }
})();
