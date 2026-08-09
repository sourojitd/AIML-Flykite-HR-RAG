(() => {
  const STEPS = [
    {
      id: "ingest",
      label: "Ingest & clean",
      title: "Handbook ingestion",
      body: "Load the Flykite HR PDF, extract text, and strip repeating watermark/footer boilerplate from the extracted stream only — the source file is never modified. Real contacts such as ethics email addresses stay intact.",
      tags: ["PyPDF", "corpus hygiene", "14 pages"],
    },
    {
      id: "chunk",
      label: "Chunk",
      title: "Recursive splitting",
      body: "RecursiveCharacterTextSplitter with hierarchical separators. Default 800/150 yields 25 chunks; the winning C3 config uses larger 1200/250 windows so each hit carries broader policy context.",
      tags: ["chunk_size", "overlap", "separators"],
    },
    {
      id: "embed",
      label: "Embed & index",
      title: "Embeddings → FAISS",
      body: "Default all-MiniLM-L6-v2 (384-d, normalized). Fine-tuning also trials Qwen3-Embedding-0.6B (1024-d). Vectors land in a FAISS CPU index for exact similarity search on a small corpus.",
      tags: ["MiniLM", "Qwen3-Embedding", "FAISS"],
    },
    {
      id: "retrieve",
      label: "Retrieve",
      title: "Top-k evidence",
      body: "Similarity search is the workhorse; MMR is tested for diversity. k ranges from 3–6. Precision@4 on default retrieval is high, but one noisy exit-procedure chunk on Q2 shows why tuning matters.",
      tags: ["similarity", "MMR", "k=3…6"],
    },
    {
      id: "generate",
      label: "Generate",
      title: "Grounded generation",
      body: "Retrieved passages inject into an HR system prompt that demands citations and honest refusal when evidence is missing. Notebook LLM: Qwen3-4B Instruct in 4-bit, greedy decoding (temperature 0).",
      tags: ["Qwen3-4B", "4-bit", "citations"],
    },
    {
      id: "eval",
      label: "Evaluate",
      title: "Deterministic scoring",
      body: "Relevance, groundedness proxy, and fact coverage — no external judge API. Citations stripped before scoring. Qualitative review and citation audits sit beside the numbers.",
      tags: ["rel", "gnd", "fact coverage"],
    },
  ];

  const TOPICS = [
    {
      cat: "nlp",
      title: "LLM-only failure modes",
      body: "Baseline answers are fluent (relevance 0.765) but invent company-agnostic policy. Q1 fact coverage hits 0.000 — the model claims benefits continue without Flykite evidence. Shows why a bare chatbot is a compliance risk.",
    },
    {
      cat: "nlp",
      title: "Prompt engineering as safety layer",
      body: "Knowledge-boundary prompts raise groundedness (0.489 → 0.597) by forcing refusal of unverified entitlements. Relevance falls because safer answers spend tokens on the uncertainty boundary — a deliberate trade-off.",
    },
    {
      cat: "retrieval",
      title: "Corpus hygiene & chunking",
      body: "Watermark stripping prevents boilerplate from dominating the index. Chunk size / overlap is treated as a first-class hyperparameter: C3’s larger windows with fewer hits outperform small-chunk high-k on this handbook.",
    },
    {
      cat: "retrieval",
      title: "Embedding model A/B",
      body: "MiniLM vs Qwen3-Embedding-0.6B under matched generation. Stronger embeddings help some configs (C5 ranks #2) but do not automatically beat a well-tuned MiniLM + chunking pair (C3).",
    },
    {
      cat: "retrieval",
      title: "Similarity vs MMR",
      body: "MMR (C4) ranks last on the weighted compliance score here — diversity did not help a 14-page single-doc corpus where overlapping coverage of the right clause matters more than novelty.",
    },
    {
      cat: "eval",
      title: "Multi-metric evaluation design",
      body: "Combined score = 0.30·relevance + 0.40·groundedness + 0.30·fact coverage. Groundedness is an embedding proxy, not claim-level entailment — documented explicitly so scores are never over-claimed.",
    },
    {
      cat: "engineering",
      title: "Quantized local inference",
      body: "bitsandbytes nf4 4-bit load of Qwen3-4B on Colab T4, greedy decoding, fixed seed. Reproducible factual generation without paid APIs in the graded notebook.",
    },
    {
      cat: "engineering",
      title: "Productized Gradio demo",
      body: "Public Hugging Face Space uses the same retrieval idea with Groq LLaMA 3.3 70B for latency. Separates research reproducibility (open local LLM) from demo UX (hosted API).",
    },
    {
      cat: "responsible",
      title: "Citations & escalation",
      body: "Answers carry handbook/section/page/clause evidence. Recommendations include low-confidence escalation to HR — accuracy without an escalation path is incomplete for policy domains.",
    },
  ];

  const FILTERS = [
    { id: "all", label: "All" },
    { id: "nlp", label: "NLP / prompts" },
    { id: "retrieval", label: "Retrieval" },
    { id: "eval", label: "Evaluation" },
    { id: "engineering", label: "Engineering" },
    { id: "responsible", label: "Responsible AI" },
  ];

  /* Nav */
  const nav = document.getElementById("nav");
  const navToggle = document.getElementById("navToggle");
  const navLinks = document.getElementById("navLinks");

  window.addEventListener(
    "scroll",
    () => {
      nav.classList.toggle("scrolled", window.scrollY > 24);
    },
    { passive: true }
  );

  navToggle?.addEventListener("click", () => {
    const open = navLinks.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(open));
  });

  navLinks?.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => {
      navLinks.classList.remove("open");
      navToggle?.setAttribute("aria-expanded", "false");
    });
  });

  /* Pipeline */
  const stepsEl = document.getElementById("pipelineSteps");
  const panelEl = document.getElementById("stepPanel");
  let activeStep = 0;

  function renderStep(i) {
    activeStep = i;
    stepsEl.querySelectorAll(".step-btn").forEach((btn, idx) => {
      btn.classList.toggle("active", idx === i);
      btn.setAttribute("aria-selected", String(idx === i));
    });
    const s = STEPS[i];
    panelEl.innerHTML = `
      <h3>${s.title}</h3>
      <p>${s.body}</p>
      <div class="tag-row">${s.tags.map((t) => `<span class="tag">${t}</span>`).join("")}</div>
    `;
  }

  STEPS.forEach((s, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "step-btn" + (i === 0 ? " active" : "");
    btn.setAttribute("role", "tab");
    btn.setAttribute("aria-selected", String(i === 0));
    btn.innerHTML = `<span class="idx">0${i + 1}</span>${s.label}`;
    btn.addEventListener("click", () => renderStep(i));
    stepsEl.appendChild(btn);
  });
  renderStep(0);

  /* Topics */
  const filtersEl = document.getElementById("topicFilters");
  const listEl = document.getElementById("topicList");
  let activeFilter = "all";

  function renderTopics() {
    listEl.innerHTML = "";
    TOPICS.forEach((t) => {
      const details = document.createElement("details");
      details.className = "topic";
      if (activeFilter !== "all" && t.cat !== activeFilter) details.classList.add("hidden");
      details.innerHTML = `
        <summary>
          <span class="topic-title">${t.title}</span>
          <span class="cat">${t.cat}</span>
          <span class="topic-toggle" aria-hidden="true"></span>
        </summary>
        <div class="body"><p>${t.body}</p></div>
      `;
      listEl.appendChild(details);
    });
  }

  FILTERS.forEach((f) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "filter-chip" + (f.id === "all" ? " active" : "");
    chip.textContent = f.label;
    chip.addEventListener("click", () => {
      activeFilter = f.id;
      filtersEl.querySelectorAll(".filter-chip").forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      renderTopics();
    });
    filtersEl.appendChild(chip);
  });
  renderTopics();

  /* Scroll reveal */
  const reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("visible"));
  }

  document.getElementById("year").textContent = String(new Date().getFullYear());
})();
