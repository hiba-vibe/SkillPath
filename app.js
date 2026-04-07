/*
  app.js  —  SkillPath AI Learning Roadmap
  ============================================================
  This file contains ALL React components and the app's state logic.

  What is React?
    React is a JavaScript library for building user interfaces.
    Instead of manually updating the HTML when data changes, you
    describe WHAT the UI should look like and React handles the rest.

  What is a "component"?
    A component is a JavaScript function that returns JSX (HTML-like
    syntax).  Components can receive data ("props") and hold their
    own state (useState).

  Component tree in this file:
    <App>               ← root component, holds all state
      <ProgressBar />   ← reads progress from App's state
      <HeroSection />   ← static heading + tagline
      <InputSection />  ← text input + Generate button
      <ApiKeyInput />   ← small input for the OpenAI API key
      <Timeline />      ← renders the list of StepCard components
        <StepCard />    ← individual step with check button
      <CompletionBanner /> ← shown when 100% complete
  ============================================================
*/


/* ─── DESTRUCTURING React hooks from the global React object ────────────────
   Because we loaded React from a CDN (no npm/import), it lives on window.React
   We destructure to get cleaner names: useState, useEffect, useRef           */
const { useState, useEffect, useRef } = React;


/* ══════════════════════════════════════════════════════════════════════════════
   COMPONENT 1 — ProgressBar
   Reads the DOM #progress-fill element directly and updates its width.
   We pass "percent" as a prop from the parent <App> component.
   ══════════════════════════════════════════════════════════════════════════ */
function ProgressBar({ percent }) {
  /*
    useEffect(fn, [dependencies])
    ─────────────────────────────
    Runs the function AFTER the component renders.
    The dependency array [percent] means: "re-run whenever percent changes".
    
    We use this to update a plain DOM element (#progress-fill) that lives
    OUTSIDE our React component tree — it's defined directly in index.html.
    Normally React manages the DOM for us, but here we need direct access.
  */
  useEffect(() => {
    const fill = document.getElementById('progress-fill');
    /* getElementById returns the HTML element with id="progress-fill"        */
    if (fill) {
      fill.style.width = `${percent}%`;
      /* directly set the inline style width — the CSS transition in styles.css
         will animate this change smoothly                                    */
    }
  }, [percent]); /* only re-run when the percent value changes                */

  return null;
  /* This component doesn't render any visible JSX itself —
     its only job is the side-effect above (updating the DOM element).
     Returning null is valid in React and renders nothing.                   */
}


/* ══════════════════════════════════════════════════════════════════════════════
   COMPONENT 2 — HeroSection
   Pure presentational component — just static markup, no state or logic.
   ══════════════════════════════════════════════════════════════════════════ */
function HeroSection() {
  return (
    <div className="hero">
      {/* className is React's way of writing class="" because "class" is a
          reserved word in JavaScript                                          */}
      <div className="hero-badge">✦ AI-Powered</div>
      <h1>
        Your <em>Personal</em><br />Learning Roadmap
      </h1>
      <p>
        Type any skill you want to master — our AI builds a step-by-step 
        personalised path, tracked right here in your browser.
      </p>
    </div>
  );
}


/* ══════════════════════════════════════════════════════════════════════════════
   COMPONENT 3 — ApiKeyInput
   A small collapsible section where the user can enter their OpenAI API key.
   Props received:
     apiKey    — current key value (controlled by parent)
     setApiKey — function to update the key in parent's state
   ══════════════════════════════════════════════════════════════════════════ */
function ApiKeyInput({ apiKey, setApiKey }) {
  /* showInput — local state to show/hide the text field                      */
  const [showInput, setShowInput] = useState(false);

  return (
    <div className="api-notice">
      {/* This is the info/notice box */}
      <strong>🔑 Gemini API Key</strong>{' '}
      {/* {' '} inserts a space character in JSX                              */}
      {apiKey
        ? <span style={{ color: '#4a9b6f', fontWeight: 600 }}>✓ Key saved</span>
        : <span>Not set — running in <strong>Mock Mode</strong> with demo data.</span>
      }
      {/* The ternary operator: condition ? valueIfTrue : valueIfFalse        */}
      {' '}
      <button
        onClick={() => setShowInput(!showInput)}
        /* !showInput flips the boolean — clicking toggles the input          */
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--accent-dark)', fontWeight: 600, fontSize: '14px',
          textDecoration: 'underline', fontFamily: 'inherit'
        }}
      >
        {showInput ? 'Hide' : (apiKey ? 'Change key' : 'Enter key')}
        {/* Show different label depending on state                           */}
      </button>

      {/* Only render the input field if showInput is true
          This is called "conditional rendering" in React                     */}
      {showInput && (
        <div style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
          <input
            type="password"
            /* type="password" hides the text — important for API keys!      */
            placeholder="sk-..."
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            /* Controlled input: value comes from state, onChange updates state
               e is the event object, e.target.value is what the user typed   */
            style={{
              flex: 1, padding: '8px 12px', borderRadius: '8px',
              border: '1.5px solid var(--border)', fontFamily: 'inherit',
              fontSize: '14px', outline: 'none'
            }}
          />
          <button
            onClick={() => {
              setShowInput(false);
              /* Close the input field after saving                           */
            }}
            style={{
              padding: '8px 14px', borderRadius: '8px',
              background: 'var(--accent)', border: 'none',
              color: 'white', fontWeight: 600, cursor: 'pointer',
              fontFamily: 'inherit', fontSize: '14px'
            }}
          >
            Save
          </button>
        </div>
      )}

      {!apiKey && (
        <div style={{ marginTop: '8px', fontSize: '13px' }}>
          Get a free key at{' '}
          <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer">
            aistudio.google.com
          </a>
          {/* target="_blank" opens in a new tab; rel="noreferrer" is a 
              security best practice when opening external links              */}
          . Without a key, a demo Web Dev roadmap is shown. Uses gemini-1.5-flash with auto-fallback to 2 backup models if rate limited.
        </div>
      )}
    </div>
  );
}


/* ══════════════════════════════════════════════════════════════════════════════
   COMPONENT 4 — InputSection
   The large search-bar style input and "Generate Path" button.
   Props:
     goal        — current input value
     setGoal     — updates goal in parent state
     onGenerate  — called when button is clicked
     loading     — boolean, true while AI is working
   ══════════════════════════════════════════════════════════════════════════ */
function InputSection({ goal, setGoal, onGenerate, loading }) {

  /*
    handleKeyDown — allow pressing Enter to trigger generation
    The event object "e" has a .key property with the key name.
  */
  function handleKeyDown(e) {
    if (e.key === 'Enter' && !loading) {
      onGenerate();
    }
  }

  return (
    <div className="input-wrapper">
      <input
        className="goal-input"
        type="text"
        placeholder="e.g. Learn Machine Learning, Master Guitar, Speak Spanish…"
        value={goal}
        onChange={e => setGoal(e.target.value)}
        /* Controlled input — syncs with parent state on every keystroke      */
        onKeyDown={handleKeyDown}
        disabled={loading}
        /* disabled prevents typing while the AI is working                   */
      />
      <button
        className="generate-btn"
        onClick={onGenerate}
        disabled={loading || !goal.trim()}
        /* !goal.trim() disables the button if the input is empty/whitespace  */
      >
        {loading
          ? '⏳ Generating…'
          /* Show a loading message while the API call is in progress         */
          : '✦ Generate Path'
        }
      </button>
    </div>
  );
}


/* ══════════════════════════════════════════════════════════════════════════════
   COMPONENT 5 — ShimmerCard
   A single fake "loading" card with the shimmer animation.
   We render 5 of these while the AI is thinking.
   ══════════════════════════════════════════════════════════════════════════ */
function ShimmerCard() {
  return (
    <div className="skeleton-card">
      {/* The actual content doesn't matter — the ::after CSS overlay
          creates the shimmer effect on top of everything inside              */}
      <div className="skeleton-line" style={{ width: '70%' }}></div>
      <div className="skeleton-line short"></div>
    </div>
  );
}


/* ══════════════════════════════════════════════════════════════════════════════
   COMPONENT 6 — StepCard
   Renders one step in the timeline.
   Props:
     step     — the step object { id, text, subtext, isCompleted }
     index    — position in the array (0-based) used for stagger animation
     onToggle — function to call when the circle button is clicked
   ══════════════════════════════════════════════════════════════════════════ */
function StepCard({ step, index, onToggle }) {
  return (
    <div
      className={`step-card ${step.isCompleted ? 'completed' : ''}`}
      /* Template literal: always has "step-card", plus "completed" if done   */
      style={{ animationDelay: `${index * 0.07}s` }}
      /* Each card's fade-up animation starts a bit later than the previous,
         creating a staggered "cascade" reveal effect                         */
    >
      {/* Circle check button ──────────────────────────────────────────────── */}
      <button
        className="check-btn"
        onClick={() => onToggle(step.id)}
        /* Arrow function: calls onToggle with this step's id when clicked    */
        aria-label={step.isCompleted ? `Mark step ${index + 1} incomplete` : `Complete step ${index + 1}`}
        /* aria-label improves accessibility for screen reader users          */
      >
        {step.isCompleted ? '✓' : ''}
        {/* Show a checkmark when done, empty circle when not               */}
      </button>

      {/* Step text content ─────────────────────────────────────────────── */}
      <div className="step-content">
        <div className="step-number">Step {index + 1}</div>
        {/* index + 1 because index is 0-based but humans count from 1        */}
        <div className="step-text">{step.text}</div>
        <div className="step-subtext">{step.subtext}</div>
      </div>
    </div>
  );
}


/* ══════════════════════════════════════════════════════════════════════════════
   COMPONENT 7 — Timeline
   Wraps the vertical timeline container.
   Props:
     steps      — the array of step objects
     loading    — boolean, true while AI works
     onToggle   — passed down to each StepCard
     roadmapTitle — the goal string to show as a subtitle
     onClear    — function to clear/reset the roadmap
   ══════════════════════════════════════════════════════════════════════════ */
function Timeline({ steps, loading, onToggle, roadmapTitle, onClear }) {

  /* Calculate how many steps are complete and the total count                */
  const completedCount = steps.filter(s => s.isCompleted).length;
  /* .filter returns a new array with only steps where isCompleted is true    */
  /* .length gives the size of that filtered array                            */

  /* ── LOADING STATE ──────────────────────────────────────────────────────  */
  if (loading) {
    return (
      <div>
        {/* Array.from creates an array of 5 elements so we can map over it   */}
        {Array.from({ length: 5 }).map((_, i) => (
          <ShimmerCard key={i} />
          /* key={i} is required by React when rendering lists.  It lets React
             track and efficiently update individual items.                    */
        ))}
      </div>
    );
  }

  /* ── EMPTY STATE (no steps yet) ──────────────────────────────────────────*/
  if (steps.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🗺️</div>
        <p>Your personalised learning path will appear here.<br />Type a goal above to get started!</p>
      </div>
    );
  }

  /* ── NORMAL STATE (steps exist) ─────────────────────────────────────────*/
  const allDone = completedCount === steps.length && steps.length > 0;
  /* true only if every step is complete AND there's at least one step        */

  return (
    <div>
      {/* Section header ──────────────────────────────────────────────────── */}
      <div className="timeline-header">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span className="timeline-title">Your Roadmap</span>
          <span className="step-count">{completedCount}/{steps.length} done</span>
        </div>
        <button className="clear-btn" onClick={onClear}>
          ✕ Clear
        </button>
      </div>

      {/* Roadmap goal subtitle */}
      {roadmapTitle && (
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '20px' }}>
          📌 Goal: <strong style={{ color: 'var(--text-main)' }}>{roadmapTitle}</strong>
        </p>
      )}

      {/* The vertical timeline ───────────────────────────────────────────── */}
      <div className="timeline">
        {steps.map((step, index) => (
          /* .map() transforms each step object into a <StepCard> component   */
          <StepCard
            key={step.id}
            /* key must be unique — using step.id is better than index because
               React can reorder items without confusion                       */
            step={step}
            index={index}
            onToggle={onToggle}
          />
        ))}
      </div>

      {/* Completion banner — rendered AFTER the timeline when all done ────── */}
      {allDone && <CompletionBanner goal={roadmapTitle} />}
    </div>
  );
}


/* ══════════════════════════════════════════════════════════════════════════════
   COMPONENT 8 — CompletionBanner
   Appears with a pop-in animation when every step is checked off.
   ══════════════════════════════════════════════════════════════════════════ */
function CompletionBanner({ goal }) {
  return (
    <div className="completion-banner">
      <div className="trophy">🏆</div>
      <h2>Roadmap Complete!</h2>
      <p>
        You've finished all steps{goal ? ` for "${goal}"` : ''}.
        <br />Time to set your next goal! 🚀
      </p>
    </div>
  );
}


/* ══════════════════════════════════════════════════════════════════════════════
   ROOT COMPONENT — App
   This is the top-level component.  It owns ALL the application state and 
   passes pieces of it down to child components as props.

   State summary:
     steps       — the array of step objects (core data)
     goal        — text in the search input (what user typed)
     roadmapTitle— the goal string that was used to generate current roadmap
     loading     — true while waiting for the API
     error       — error message string (or null if no error)
     apiKey      — the OpenAI API key (stored in state so the input is controlled)
     percent     — completion percentage (0–100), derived from steps
   ══════════════════════════════════════════════════════════════════════════ */
function App() {

  /* useState(initialValue) returns [currentValue, setterFunction]            */
  const [steps, setSteps]             = useState([]);      /* no steps yet    */
  const [goal, setGoal]               = useState('');      /* empty input     */
  const [roadmapTitle, setRoadmapTitle] = useState('');    /* displayed goal  */
  const [loading, setLoading]         = useState(false);   /* not loading     */
  const [error, setError]             = useState(null);    /* no error        */
  const [apiKey, setApiKey]           = useState('');      /* no key yet      */
  const [percent, setPercent]         = useState(0);       /* 0% done         */


  /* ── EFFECT: Restore from localStorage on first load ──────────────────────
     The empty dependency array [] means this runs ONCE when the component 
     first mounts (like a "componentDidMount" in older React style).
  */
  useEffect(() => {
    const saved = loadFromStorage();
    /* loadFromStorage() is defined in roadmap.js and returns { steps, title }
       or null if nothing was saved                                            */
    if (saved && saved.steps && saved.steps.length > 0) {
      setSteps(saved.steps);
      setRoadmapTitle(saved.title || '');
      /* Recalculate percent from the restored steps                          */
      const done = saved.steps.filter(s => s.isCompleted).length;
      setPercent(Math.round((done / saved.steps.length) * 100));
    }
  }, []); /* [] = run only once, on component mount                          */


  /* ── EFFECT: Save to localStorage whenever steps change ───────────────────
     The dependency [steps, roadmapTitle] means this runs whenever 
     either of those values changes.                                          */
  useEffect(() => {
    if (steps.length > 0) {
      saveToStorage({ steps, title: roadmapTitle });
      /* Save an object containing both the steps array and the goal title    */
    }
  }, [steps, roadmapTitle]);


  /* ── FUNCTION: toggleStep ─────────────────────────────────────────────────
     Called when the user clicks a circle button.
     Flips the isCompleted property of the matching step.
     Then recalculates and updates the progress percentage.
  */
  function toggleStep(id) {
    /* .map() creates a NEW array — we never mutate state directly in React!  */
    const updated = steps.map(step =>
      step.id === id
        ? { ...step, isCompleted: !step.isCompleted }
        /* spread the existing step, then override isCompleted with the flip  */
        : step
        /* all other steps stay unchanged                                     */
    );

    setSteps(updated);

    /* Recalculate progress percentage                                        */
    const doneCount = updated.filter(s => s.isCompleted).length;
    const newPercent = Math.round((doneCount / updated.length) * 100);
    /* Math.round avoids ugly decimals like 33.333...                        */
    setPercent(newPercent);
  }


  /* ── FUNCTION: handleGenerate ─────────────────────────────────────────────
     Called when the user clicks "Generate Path" or presses Enter.
     Calls generateRoadmap() (from roadmap.js) and updates state with results.
  */
  async function handleGenerate() {
    if (!goal.trim()) return; /* do nothing if input is blank                  */

    setLoading(true);    /* show shimmer skeleton cards                        */
    setError(null);      /* clear any previous error message                   */
    setSteps([]);        /* clear old roadmap while new one loads              */
    setPercent(0);       /* reset progress bar to 0%                           */
    clearStorage();      /* wipe old localStorage data                         */

    try {
      /*
        await pauses execution until generateRoadmap() resolves.
        generateRoadmap is defined in roadmap.js (loaded before app.js).
        It returns an array of step objects.
      */
      const newSteps = await generateRoadmap(goal.trim(), apiKey);

      setSteps(newSteps);             /* put steps into state → triggers re-render */
      setRoadmapTitle(goal.trim());   /* remember the goal that was used           */

    } catch (err) {
      /* If anything threw an error inside generateRoadmap, catch it here     */
      setError(err.message || 'Something went wrong. Please try again.');
      console.error('SkillPath error:', err);
    } finally {
      /* finally runs whether the try succeeded OR the catch ran              */
      setLoading(false);  /* always stop showing the loading state             */
    }
  }


  /* ── FUNCTION: handleClear ────────────────────────────────────────────────
     Resets everything back to the initial empty state.
  */
  function handleClear() {
    setSteps([]);
    setRoadmapTitle('');
    setGoal('');
    setPercent(0);
    clearStorage();
    /* clearStorage() removes the saved roadmap from localStorage             */
  }


  /* ── RENDER ───────────────────────────────────────────────────────────────
     JSX returned here becomes the actual HTML on the page.
     React calls this function and updates the DOM whenever state changes.
  */
  return (
    <div className="container">

      {/* ProgressBar reads percent but renders nothing itself — it only 
          updates the #progress-fill div in index.html via useEffect          */}
      <ProgressBar percent={percent} />

      {/* Hero heading */}
      <HeroSection />

      {/* API key notice + input */}
      <ApiKeyInput apiKey={apiKey} setApiKey={setApiKey} />

      {/* Search bar + generate button */}
      <InputSection
        goal={goal}
        setGoal={setGoal}
        onGenerate={handleGenerate}
        loading={loading}
      />

      {/* Error message — only shown when error state is not null.
          error.split('\n') breaks the message on newlines so multi-line
          instructions (like the 429 fix guide) display as separate paragraphs. */}
      {error && (
        <div style={{
          background: '#fff5f5', border: '1.5px solid #f5c6cb',
          borderRadius: '12px', padding: '16px 20px',
          marginBottom: '24px', fontSize: '13.5px', lineHeight: '1.6'
        }}>
          {error.split('\n').map((line, i) => (
            line.trim() === ''
              ? <br key={i} />
              : <p key={i} style={{
                  margin: '0 0 6px 0',
                  color: line.startsWith('What to do') ? '#92400e'
                       : line.match(/^\d\./)         ? '#111827'
                       : '#c0504a',
                  fontWeight: line.startsWith('What to do') || line.match(/^\d\./) ? '600' : '400'
                }}>
                  {i === 0 ? '⚠️ ' : line.match(/^\d\./) ? '' : ''}{line}
                </p>
          ))}
          <button
            onClick={() => { setError(null); handleGenerate(); }}
            style={{
              marginTop: '10px', background: '#c0504a', color: 'white',
              border: 'none', borderRadius: '8px', padding: '8px 18px',
              fontSize: '13px', fontWeight: '600', cursor: 'pointer',
              fontFamily: 'inherit'
            }}
          >
            🔄 Try Again
          </button>
        </div>
      )}

      {/* The vertical timeline with all step cards                           */}
      <Timeline
        steps={steps}
        loading={loading}
        onToggle={toggleStep}
        roadmapTitle={roadmapTitle}
        onClear={handleClear}
      />

    </div>
  );
}


/* ── MOUNT REACT INTO THE DOM ───────────────────────────────────────────────
   ReactDOM.createRoot() takes the #root div from index.html and hands it 
   to React.  .render(<App />) tells React to render our App component inside.
   This is the single "entry point" that kicks everything off.                */
const rootElement = document.getElementById('root');
/* getElementById finds the <div id="root"> we put in index.html              */

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    {/*
      StrictMode is a developer helper — it doesn't add any visible UI,
      but it runs extra checks and warnings to help catch bugs early.
      It double-invokes some functions in development to detect side effects.
    */}
    <App />
  </React.StrictMode>
);
