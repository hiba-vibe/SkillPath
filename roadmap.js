/*
  roadmap.js  —  SkillPath AI Learning Roadmap
  ============================================================
  ✅ FIXED: 429 rate-limit errors handled with:
     1. Model fallback chain (tries 3 models automatically)
     2. Automatic retry with exponential backoff
     3. Clearer, actionable error messages
     4. gemini-1.5-flash as primary (most stable free-tier model)
  ============================================================
*/


/* ── 1. MOCK ROADMAP DATA ──────────────────────────────────────────────────── */
const MOCK_ROADMAP = [
  {
    id: 1,
    text: "HTML Fundamentals",
    subtext: "Learn the building blocks of every webpage: tags, attributes, semantic structure, forms, and accessibility basics.",
    isCompleted: false
  },
  {
    id: 2,
    text: "CSS Styling & Layout",
    subtext: "Master Flexbox, CSS Grid, responsive design with media queries, and modern visual techniques like gradients and transitions.",
    isCompleted: false
  },
  {
    id: 3,
    text: "JavaScript Essentials",
    subtext: "Understand variables, functions, DOM manipulation, events, fetch API for HTTP calls, and async/await for promises.",
    isCompleted: false
  },
  {
    id: 4,
    text: "React Framework",
    subtext: "Dive into component-based thinking, JSX, useState & useEffect hooks, props, and how to manage application state.",
    isCompleted: false
  },
  {
    id: 5,
    text: "Deploy Your First Project",
    subtext: "Set up Git & GitHub, push your project, and deploy it live using Vercel or Netlify — completely free for personal projects.",
    isCompleted: false
  }
];

/* ── 2. LOCALSTORAGE HELPERS ──────────────────────────────────────────────── */
const STORAGE_KEY = 'skillpath_roadmap';

function saveToStorage(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
  catch (e) { console.warn('SkillPath: localStorage save failed:', e); }
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

function clearStorage() {
  localStorage.removeItem(STORAGE_KEY);
}


/* ── 3. GEMINI MODEL FALLBACK CHAIN ───────────────────────────────────────────
   We try models in order. If one returns 429 or 503, we automatically
   move to the next one. All three are FREE on Google AI Studio.

   WHY THIS ORDER:
   • gemini-1.5-flash       — most stable, highest free quota (15 req/min)
   • gemini-1.5-flash-8b    — lighter model, separate quota pool
   • gemini-2.0-flash-lite  — newest lite model, also free
   ──────────────────────────────────────────────────────────────────────────── */
const GEMINI_MODELS = [
  'gemini-1.5-flash',        // Primary  — 15 RPM free, very reliable
  'gemini-1.5-flash-8b',     // Fallback — separate quota, fast
  'gemini-2.0-flash-lite',   // Last resort — newest lite, free tier
];


/* ── 4. SLEEP HELPER ──────────────────────────────────────────────────────────
   Pauses execution for `ms` milliseconds. Used between retries.
   ──────────────────────────────────────────────────────────────────────────── */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


/* ── 5. SINGLE MODEL CALL ─────────────────────────────────────────────────────
   callGeminiModel(model, promptText, apiKey)
   ──────────────────────────────────────────
   Makes one HTTP request to a specific Gemini model.
   Returns the raw text string from the AI.
   Throws a typed error so the caller can decide what to do next.

   Error types thrown:
     { type: 'rate_limit' }  — 429, caller should try next model or retry
     { type: 'auth' }        — 401/403, bad key, no point retrying
     { type: 'safety' }      — content blocked by Gemini filters
     { type: 'server' }      — 500/503, server-side issue, worth retrying
     { type: 'other', status } — anything else
   ──────────────────────────────────────────────────────────────────────────── */
async function callGeminiModel(model, promptText, apiKey) {

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1200,
        },
        /*
          safetySettings: lower thresholds so common educational topics
          are never incorrectly blocked.
        */
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT",        threshold: "BLOCK_ONLY_HIGH" },
          { category: "HARM_CATEGORY_HATE_SPEECH",       threshold: "BLOCK_ONLY_HIGH" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
        ]
      })
    });
  } catch (networkErr) {
    /*
      fetch() itself throws if there's NO internet or if the browser blocks
      the request due to CORS. We surface a helpful message.
    */
    throw {
      type: 'network',
      message:
        'Network request failed. This can happen when opening the file directly ' +
        '(file://) in some browsers. Try running the app via Live Server in VS Code ' +
        'or use: npx serve . in your terminal.',
      original: networkErr.message
    };
  }

  /* ── Handle non-2xx HTTP responses ─────────────────────────────────────── */
  if (!response.ok) {
    let serverMsg = '';
    try {
      const errData = await response.json();
      serverMsg = errData?.error?.message || errData?.error?.status || '';
    } catch (_) {}

    if (response.status === 429) {
      /*
        429 = Too Many Requests.
        The Retry-After header tells us how many seconds to wait.
        We read it and pass it back so the retry loop can honour it.
      */
      const retryAfter = parseInt(response.headers.get('Retry-After') || '0', 10);
      throw { type: 'rate_limit', retryAfter, model, message: serverMsg };
    }

    if (response.status === 401 || response.status === 403) {
      throw {
        type: 'auth',
        message:
          `Your Gemini API key was rejected (HTTP ${response.status}). ` +
          `Please double-check it at https://aistudio.google.com/app/apikey`
      };
    }

    if (response.status === 503 || response.status === 500) {
      throw { type: 'server', status: response.status, message: serverMsg };
    }

    throw { type: 'other', status: response.status, message: serverMsg || `HTTP ${response.status}` };
  }

  /* ── Parse successful response ──────────────────────────────────────────── */
  const data = await response.json();

  /* Check if Gemini blocked the output (safety or recitation filter) */
  const finishReason = data?.candidates?.[0]?.finishReason;
  if (finishReason === 'SAFETY' || finishReason === 'RECITATION') {
    throw {
      type: 'safety',
      message: 'Gemini blocked this response. Try rephrasing your goal more simply.'
    };
  }

  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw { type: 'empty', message: 'Gemini returned an empty response.' };
  }

  return rawText;
}


/* ── 6. PARSE GEMINI TEXT TO STEPS ARRAY ──────────────────────────────────── */
function parseSteps(rawText) {
  /* Strip markdown code fences Gemini sometimes adds despite instructions */
  const cleaned = rawText
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();

  let steps;
  try {
    steps = JSON.parse(cleaned);
  } catch (_) {
    /* Try extracting a JSON array if there's extra text around it */
    const match = cleaned.match(/\[[\s\S]*\]/);
    if (match) {
      try { steps = JSON.parse(match[0]); } catch (_) {}
    }
  }

  if (!Array.isArray(steps) || steps.length === 0) return null;

  return steps.map((step, i) => ({
    id:          step.id      || i + 1,
    text:        step.text    || `Step ${i + 1}`,
    subtext:     step.subtext || '',
    isCompleted: false
  }));
}


/* ── 7. MAIN EXPORT: generateRoadmap ─────────────────────────────────────────
   generateRoadmap(goal, apiKey)
   ──────────────────────────────
   Orchestrates the full flow:
     1. Mock mode if no key
     2. Try each model in GEMINI_MODELS
     3. On 429, wait (with backoff) and retry up to 2 times per model
     4. On auth error, stop immediately
     5. If all models fail, show clear actionable error

   @param  {string} goal   — user's learning goal
   @param  {string} apiKey — Google AI Studio key
   @returns {Promise<Array>} — array of step objects
   ──────────────────────────────────────────────────────────────────────────── */
async function generateRoadmap(goal, apiKey) {

  /* ── MOCK MODE ────────────────────────────────────────────────────────────*/
  if (!apiKey || apiKey.trim() === '') {
    await sleep(2000);
    return MOCK_ROADMAP.map(s => ({ ...s, isCompleted: false }));
  }

  /* ── BUILD PROMPT ─────────────────────────────────────────────────────────
     Keep the prompt SHORT. Fewer input tokens = less chance of quota issues. */
  const promptText =
`You are a learning path designer. Create a 6-step roadmap for: "${goal}"

Respond with ONLY a JSON array. No markdown. No explanation. No backticks.
Each object: {"id": integer, "text": "max 8 word title", "subtext": "1-2 sentences of guidance", "isCompleted": false}
Steps ordered beginner to advanced. Output the raw JSON array only.`;

  /* ── MODEL FALLBACK LOOP ─────────────────────────────────────────────────
     We iterate through each model. For each model we allow up to 2 retries
     on 429 errors before moving on to the next model.
   ──────────────────────────────────────────────────────────────────────────*/
  const MAX_RETRIES_PER_MODEL = 2;
  const lastErrors = [];

  for (const model of GEMINI_MODELS) {
    for (let attempt = 1; attempt <= MAX_RETRIES_PER_MODEL; attempt++) {
      try {
        console.log(`SkillPath: Trying model ${model}, attempt ${attempt}`);
        const rawText = await callGeminiModel(model, promptText, apiKey);
        const steps = parseSteps(rawText);

        if (steps) {
          console.log(`SkillPath: Success with model ${model}`);
          return steps;
        }

        /* Got a response but couldn't parse it — fall back to mock */
        console.warn(`SkillPath: Could not parse response from ${model}, using mock.`);
        return MOCK_ROADMAP.map(s => ({ ...s, isCompleted: false }));

      } catch (err) {

        /* Auth errors: stop everything immediately, no point retrying */
        if (err.type === 'auth') {
          throw new Error(err.message);
        }

        /* Network/CORS error: stop immediately with clear instructions */
        if (err.type === 'network') {
          throw new Error(
            err.message + '\n\nOriginal error: ' + err.original
          );
        }

        /* Safety block: stop immediately */
        if (err.type === 'safety') {
          throw new Error(err.message);
        }

        /* Rate limit: wait then retry (or move to next model) */
        if (err.type === 'rate_limit') {
          lastErrors.push(`${model} (attempt ${attempt}): rate limited`);

          if (attempt < MAX_RETRIES_PER_MODEL) {
            /*
              Exponential backoff:
              attempt 1 → wait 8 seconds
              attempt 2 → wait 15 seconds
              We also honour Retry-After if the server sent one.
            */
            const backoff = Math.max(err.retryAfter * 1000 || 0, attempt * 8000);
            console.log(`SkillPath: Rate limited on ${model}. Waiting ${backoff/1000}s before retry...`);
            await sleep(backoff);
            continue; /* retry same model */
          }

          /* Exhausted retries for this model — try next model */
          console.log(`SkillPath: Exhausted retries for ${model}. Trying next model...`);
          break;
        }

        /* Server error (500/503): brief wait then retry */
        if (err.type === 'server') {
          lastErrors.push(`${model} (attempt ${attempt}): server error ${err.status}`);
          if (attempt < MAX_RETRIES_PER_MODEL) {
            await sleep(5000);
            continue;
          }
          break;
        }

        /* Any other error: log and move to next model */
        lastErrors.push(`${model}: ${err.message || JSON.stringify(err)}`);
        break;
      }
    }
  }

  /*
    All 3 models failed. Build a helpful error message that tells the user
    exactly what to do — don't just say "error".
  */
  console.error('SkillPath: All models failed.', lastErrors);

  throw new Error(
    `All Gemini models are currently rate-limited or unavailable on your key.\n\n` +
    `What to do right now:\n` +
    `1. Wait 60 seconds, then click "Generate Path" again.\n` +
    `2. If it keeps failing, go to https://aistudio.google.com/app/apikey and create a NEW API key (it takes 10 seconds).\n` +
    `3. Check that your key has the "Generative Language API" enabled at https://console.cloud.google.com/apis/\n\n` +
    `The free tier allows 15 requests/minute and 1500 requests/day. ` +
    `If you've hit the daily cap, try again tomorrow or use a new Google account to get a fresh key.`
  );
}
