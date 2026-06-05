import { useState } from "react";

const OPENROUTER_API_KEY = "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";
const AI_MODEL = "meta-llama/llama-4-maverick:free";

const CATEGORIES = ["Birds", "Critters", "Butterflies"];
const CATEGORY_ICONS = { Birds: "🐦", Critters: "🐾", Butterflies: "🦋" };
const CATEGORY_COLORS = {
  Birds: { bg: "#1a3a2a", accent: "#4ade80", light: "#bbf7d0", card: "#14532d" },
  Critters: { bg: "#3a2a1a", accent: "#fb923c", light: "#fed7aa", card: "#7c2d12" },
  Butterflies: { bg: "#2a1a3a", accent: "#c084fc", light: "#e9d5ff", card: "#581c87" },
};
const FOOD_OPTIONS = {
  Birds: ["Safflower Seed", "Peanut Butter Suet", "Fruit Suet", "Sunflower Seeds", "Whole Peanuts", "Mixed Seed", "Mealworms", "Nectar"],
  Critters: ["Corn", "Sunflower Seeds", "Peanuts", "Mixed Nuts", "Fruit", "Water", "Acorns", "Berries"],
  Butterflies: ["Gatorade/Nectar Mix", "Flower Nectar", "Sugar Water", "Fruit Juice"],
};
const VISIT_FREQ = ["Daily", "A Few Times a Week", "Weekly", "Occasional", "Rare"];
const FUN_FACTS = {
  Birds: [
    "Birds have hollow bones to help them fly!",
    "Some birds can sleep with one eye open.",
    "Hummingbirds are the only birds that can fly backwards.",
    "Cardinals mate for life and often feed each other.",
    "Blue Jays can mimic hawk calls to scare other birds.",
    "Robins can hear earthworms moving underground.",
    "Mourning doves mate for life.",
    "Woodpeckers have shock-absorbing skulls.",
  ],
  Critters: [
    "Squirrels forget where they bury about half their nuts!",
    "A squirrel's front teeth never stop growing.",
    "Chipmunks can carry up to 9 nuts at once in their cheek pouches!",
    "Baby squirrels are called kittens.",
    "Chipmunks hibernate in winter and wake up every few days to eat stored food.",
    "A chipmunk's burrow can be up to 11 feet long!",
    "Raccoons can remember solutions to tasks for up to 3 years.",
    "Rabbits can leap up to 9 feet in a single bound!",
  ],
  Butterflies: [
    "Butterflies taste with their feet!",
    "A butterfly's wings are actually transparent.",
    "Butterflies can only fly if their body is warm enough.",
    "Some butterflies migrate thousands of miles.",
    "Butterflies drink from mud puddles for minerals — called puddling!",
  ],
};

function getRandomFact(category) {
  const facts = FUN_FACTS[category];
  return facts[Math.floor(Math.random() * facts.length)];
}

async function analyzeImageWithAI(base64Image, category) {
  const categoryHint = category === "Birds" ? "bird" : category === "Critters" ? "small mammal, squirrel, chipmunk, or critter" : "butterfly or insect";
  const prompt = `You are a wildlife identification expert. Look at this photo and identify what ${categoryHint} species this is.

Respond ONLY with a valid JSON object in this exact format, no other text:
{
  "species": "Common name of the species",
  "scientificName": "Scientific name",
  "confidence": "High/Medium/Low",
  "funFact": "One fascinating and specific fun fact about this exact species in one sentence",
  "description": "Brief 1 sentence description of key identifying features you can see",
  "foodTip": "One specific food or feeding tip for attracting this species"
}`;

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
      "HTTP-Referer": "https://wildlife-journal.vercel.app",
      "X-Title": "Wildlife Journal",
    },
    body: JSON.stringify({
      model: AI_MODEL,
      max_tokens: 400,
      messages: [{
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: compressed } },
        ],
      }],
    }),
  });

  if (!response.ok) throw new Error(`API error: ${response.status}`);
  const data = await response.json();
  const text = data.choices[0].message.content;
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

function Lightbox({ photos, startIndex, onClose }) {
  const [idx, setIdx] = useState(startIndex);
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.95)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 2000, flexDirection: "column", padding: "20px",
    }}>
      <div onClick={e => e.stopPropagation()} style={{ position: "relative", maxWidth: "90vw", maxHeight: "75vh" }}>
        <img src={photos[idx]} alt="" style={{ maxWidth: "90vw", maxHeight: "70vh", borderRadius: "16px", objectFit: "contain" }} />
        {photos.length > 1 && (<>
          <button onClick={() => setIdx(i => (i - 1 + photos.length) % photos.length)} style={{ position: "absolute", left: "-50px", top: "50%", transform: "translateY(-50%)", background: "#ffffff22", border: "none", borderRadius: "50%", width: "40px", height: "40px", color: "#fff", fontSize: "20px", cursor: "pointer" }}>‹</button>
          <button onClick={() => setIdx(i => (i + 1) % photos.length)} style={{ position: "absolute", right: "-50px", top: "50%", transform: "translateY(-50%)", background: "#ffffff22", border: "none", borderRadius: "50%", width: "40px", height: "40px", color: "#fff", fontSize: "20px", cursor: "pointer" }}>›</button>
        </>)}
      </div>
      <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
        {photos.map((p, i) => (
          <img key={i} src={p} onClick={e => { e.stopPropagation(); setIdx(i); }} alt="" style={{ width: "52px", height: "52px", borderRadius: "8px", objectFit: "cover", border: i === idx ? "2px solid #fff" : "2px solid transparent", cursor: "pointer", opacity: i === idx ? 1 : 0.6 }} />
        ))}
      </div>
      <button onClick={onClose} style={{ marginTop: "16px", background: "#ffffff22", border: "none", borderRadius: "20px", color: "#fff", padding: "8px 24px", cursor: "pointer", fontFamily: "'Nunito', sans-serif", fontSize: "14px" }}>✕ Close</button>
    </div>
  );
}

function DragToReposition({ image, position, onChange, accent, light }) {
  const [dragging, setDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startX, setStartX] = useState(0);
  const [startPos, setStartPos] = useState(position);
  const clamp = (val, min, max) => Math.min(Math.max(val, min), max);
  const onMouseDown = (e) => { e.preventDefault(); setDragging(true); setStartY(e.clientY); setStartX(e.clientX); setStartPos(position); };
  const onMouseMove = (e) => { if (!dragging) return; onChange({ x: clamp(startPos.x - (e.clientX - startX) / 1.5, 0, 100), y: clamp(startPos.y - (e.clientY - startY) / 1.5, 0, 100) }); };
  const onMouseUp = () => setDragging(false);
  const onTouchStart = (e) => { const t = e.touches[0]; setDragging(true); setStartY(t.clientY); setStartX(t.clientX); setStartPos(position); };
  const onTouchMove = (e) => { if (!dragging) return; const t = e.touches[0]; onChange({ x: clamp(startPos.x - (t.clientX - startX) / 1.5, 0, 100), y: clamp(startPos.y - (t.clientY - startY) / 1.5, 0, 100) }); };
  return (
    <div style={{ marginBottom: "16px" }}>
      <label style={{ color: light, fontSize: "13px", fontFamily: "'Nunito', sans-serif", fontWeight: "700", display: "block", marginBottom: "6px" }}>🖼️ Drag photo to reposition</label>
      <div onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onMouseUp}
        style={{ height: "120px", borderRadius: "14px", overflow: "hidden", border: `2px solid ${accent}`, backgroundImage: `url(${image})`, backgroundSize: "cover", backgroundPosition: `${position.x}% ${position.y}%`, cursor: dragging ? "grabbing" : "grab", userSelect: "none", position: "relative" }}>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", opacity: dragging ? 0 : 0.8, transition: "opacity 0.2s", pointerEvents: "none" }}>
          <div style={{ background: "rgba(0,0,0,0.6)", borderRadius: "20px", padding: "6px 14px", color: "#fff", fontFamily: "'Nunito', sans-serif", fontSize: "12px", fontWeight: "700" }}>✋ Drag to reposition</div>
        </div>
      </div>
      <div style={{ fontSize: "11px", color: "#666", fontFamily: "'Nunito', sans-serif", marginTop: "4px" }}>This is exactly how it will look on the card</div>
    </div>
  );
}

function AIResultBanner({ result, colors, onAccept, onDismiss }) {
  return (
    <div style={{ background: `linear-gradient(135deg, ${colors.card}, #0a0a1a)`, border: `2px solid ${colors.accent}`, borderRadius: "16px", padding: "16px", marginBottom: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
        <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: "18px", color: colors.accent }}>
          🤖 AI Identified!
        </div>
        <span style={{ background: result.confidence === "High" ? "#4ade8044" : result.confidence === "Medium" ? "#fbbf2444" : "#ff444444", color: result.confidence === "High" ? "#4ade80" : result.confidence === "Medium" ? "#fbbf24" : "#ff4444", borderRadius: "20px", padding: "2px 10px", fontSize: "11px", fontFamily: "'Nunito', sans-serif", fontWeight: "700" }}>
          {result.confidence} Confidence
        </span>
      </div>
      <div style={{ fontFamily: "'Nunito', sans-serif", marginBottom: "8px" }}>
        <div style={{ fontSize: "18px", fontWeight: "800", color: "#fff" }}>{result.species}</div>
        <div style={{ fontSize: "12px", color: "#888", fontStyle: "italic" }}>{result.scientificName}</div>
      </div>
      <div style={{ fontSize: "12px", color: colors.light, background: `${colors.accent}11`, borderRadius: "10px", padding: "8px 12px", marginBottom: "8px", fontFamily: "'Nunito', sans-serif", lineHeight: 1.5 }}>
        💡 {result.funFact}
      </div>
      <div style={{ fontSize: "12px", color: "#aaa", fontFamily: "'Nunito', sans-serif", marginBottom: "12px", lineHeight: 1.4 }}>
        🍽️ <strong style={{ color: colors.light }}>Feeding tip:</strong> {result.foodTip}
      </div>
      <div style={{ display: "flex", gap: "8px" }}>
        <button onClick={onAccept} style={{ flex: 2, background: `linear-gradient(135deg, ${colors.accent}, ${colors.light})`, border: "none", borderRadius: "10px", color: "#000", padding: "10px", cursor: "pointer", fontFamily: "'Fredoka One', cursive", fontSize: "15px" }}>
          ✅ Use This Info
        </button>
        <button onClick={onDismiss} style={{ flex: 1, background: "#ffffff11", border: "1px solid #ffffff22", borderRadius: "10px", color: "#fff", padding: "10px", cursor: "pointer", fontFamily: "'Nunito', sans-serif", fontSize: "13px" }}>
          Dismiss
        </button>
      </div>
    </div>
  );
}

function AnimalCard({ animal, onEdit, onDelete }) {
  const colors = CATEGORY_COLORS[animal.category];
  const [flipped, setFlipped] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(null);
  const allPhotos = [...(animal.image ? [animal.image] : []), ...(animal.extraPhotos || [])];
  const mainPhoto = animal.image || null;
  return (
    <>
      {lightboxIdx !== null && <Lightbox photos={allPhotos} startIndex={lightboxIdx} onClose={() => setLightboxIdx(null)} />}
      <div onClick={() => setFlipped(!flipped)} style={{ cursor: "pointer", borderRadius: "20px", overflow: "hidden", background: flipped ? `linear-gradient(135deg, ${colors.card}, ${colors.bg})` : `linear-gradient(135deg, #1e1e2e, #2a2a3e)`, border: `2px solid ${colors.accent}33`, boxShadow: `0 8px 32px ${colors.accent}22`, transition: "all 0.3s ease", transform: flipped ? "scale(1.02)" : "scale(1)", position: "relative", minHeight: "280px" }}>
        <div style={{ height: "140px", background: mainPhoto ? `url(${mainPhoto}) ${animal.imgPos ? animal.imgPos.x + '% ' + animal.imgPos.y + '%' : '50% 30%'}/cover no-repeat` : `linear-gradient(135deg, ${colors.card}88, ${colors.bg})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "64px", position: "relative" }}>
          {!mainPhoto && <span style={{ filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.5))" }}>{CATEGORY_ICONS[animal.category]}</span>}
          <div style={{ position: "absolute", top: "10px", right: "10px", background: colors.accent, borderRadius: "20px", padding: "2px 10px", fontSize: "11px", fontWeight: "700", color: "#000", fontFamily: "'Fredoka One', cursive" }}>{animal.frequency}</div>
          {allPhotos.length > 1 && (
            <div onClick={e => { e.stopPropagation(); setLightboxIdx(0); }} style={{ position: "absolute", bottom: "8px", left: "8px", background: "rgba(0,0,0,0.7)", borderRadius: "12px", padding: "3px 10px", fontSize: "11px", color: "#fff", fontFamily: "'Nunito', sans-serif", fontWeight: "700", cursor: "pointer" }}>
              📸 {allPhotos.length} photos
            </div>
          )}
          {animal.aiIdentified && (
            <div style={{ position: "absolute", bottom: "8px", right: "8px", background: "rgba(0,0,0,0.7)", borderRadius: "12px", padding: "3px 8px", fontSize: "11px", color: "#4ade80", fontFamily: "'Nunito', sans-serif", fontWeight: "700" }}>
              🤖 AI
            </div>
          )}
        </div>
        {allPhotos.length > 1 && (
          <div onClick={e => e.stopPropagation()} style={{ display: "flex", gap: "4px", padding: "6px 8px", background: "#00000033", overflowX: "auto" }}>
            {allPhotos.map((p, i) => (
              <img key={i} src={p} alt="" onClick={() => setLightboxIdx(i)} style={{ width: "44px", height: "44px", borderRadius: "8px", objectFit: "cover", flexShrink: 0, cursor: "pointer", border: i === 0 ? `2px solid ${colors.accent}` : "2px solid transparent" }} />
            ))}
          </div>
        )}
        <div style={{ padding: "14px 16px 40px" }}>
          {!flipped ? (<>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <span style={{ fontSize: "20px" }}>{CATEGORY_ICONS[animal.category]}</span>
              <div>
                <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: "20px", color: colors.accent, lineHeight: 1 }}>{animal.nickname || animal.name}</div>
                {animal.nickname && <div style={{ fontSize: "11px", color: "#888", fontFamily: "'Nunito', sans-serif" }}>aka {animal.name}</div>}
                {animal.scientificName && <div style={{ fontSize: "10px", color: "#666", fontFamily: "'Nunito', sans-serif", fontStyle: "italic" }}>{animal.scientificName}</div>}
              </div>
            </div>
            {animal.favoriteFood.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "8px" }}>
                {animal.favoriteFood.slice(0, 2).map(f => (
                  <span key={f} style={{ background: `${colors.accent}22`, color: colors.light, borderRadius: "10px", padding: "2px 8px", fontSize: "11px", fontFamily: "'Nunito', sans-serif" }}>🍽️ {f}</span>
                ))}
              </div>
            )}
            <div style={{ fontSize: "11px", color: "#666", fontFamily: "'Nunito', sans-serif" }}>📅 First seen: {animal.firstSeen || "Unknown"} • Tap for more!</div>
          </>) : (<>
            <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: "16px", color: colors.accent, marginBottom: "8px" }}>💡 Fun Fact!</div>
            <div style={{ fontSize: "13px", color: colors.light, fontFamily: "'Nunito', sans-serif", lineHeight: 1.5, marginBottom: "10px" }}>{animal.funFact}</div>
            {animal.notes && <div style={{ fontSize: "12px", color: "#aaa", fontFamily: "'Nunito', sans-serif", fontStyle: "italic", borderTop: `1px solid ${colors.accent}33`, paddingTop: "8px" }}>📝 "{animal.notes}"</div>}
          </>)}
        </div>
        <div style={{ position: "absolute", bottom: "10px", right: "10px", display: "flex", gap: "6px" }} onClick={e => e.stopPropagation()}>
          <button onClick={() => onEdit(animal)} style={{ background: `${colors.accent}33`, border: `1px solid ${colors.accent}`, borderRadius: "8px", color: colors.accent, padding: "4px 10px", fontSize: "12px", cursor: "pointer", fontFamily: "'Nunito', sans-serif", fontWeight: "700" }}>✏️</button>
          <button onClick={() => onDelete(animal.id)} style={{ background: "#ff444422", border: "1px solid #ff4444", borderRadius: "8px", color: "#ff4444", padding: "4px 10px", fontSize: "12px", cursor: "pointer", fontFamily: "'Nunito', sans-serif", fontWeight: "700" }}>🗑️</button>
        </div>
      </div>
    </>
  );
}

function AddEditModal({ animal, category, onSave, onClose }) {
  const colors = CATEGORY_COLORS[category];
  const [form, setForm] = useState(animal || {
    name: "", nickname: "", scientificName: "", category,
    firstSeen: new Date().toLocaleDateString(),
    frequency: "Occasional", favoriteFood: [],
    usesBath: false, notes: "", image: null, imgPos: { x: 50, y: 50 },
    extraPhotos: [], funFact: getRandomFact(category), aiIdentified: false,
  });
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiError, setAiError] = useState(null);

  const handleMainImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target.result;
      setForm(f => ({ ...f, image: dataUrl }));
      // Auto-trigger AI analysis
      setAiLoading(true);
      setAiError(null);
      setAiResult(null);
      try {
        const result = await analyzeImageWithAI(dataUrl, category);
        setAiResult(result);
      } catch (err) {
        setAiError("AI couldn't identify this one. Fill in details manually!");
      } finally {
        setAiLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAcceptAI = () => {
    setForm(f => ({
      ...f,
      name: aiResult.species,
      scientificName: aiResult.scientificName,
      funFact: aiResult.funFact,
      aiIdentified: true,
    }));
    setAiResult(null);
  };

  const handleExtraPhotos = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => setForm(f => ({ ...f, extraPhotos: [...(f.extraPhotos || []), ev.target.result] }));
      reader.readAsDataURL(file);
    });
  };

  const removeExtraPhoto = (idx) => setForm(f => ({ ...f, extraPhotos: f.extraPhotos.filter((_, i) => i !== idx) }));
  const toggleFood = (food) => setForm(f => ({ ...f, favoriteFood: f.favoriteFood.includes(food) ? f.favoriteFood.filter(x => x !== food) : [...f.favoriteFood, food] }));

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
      <div style={{ background: "#1a1a2e", border: `2px solid ${colors.accent}`, borderRadius: "24px", padding: "28px", width: "100%", maxWidth: "480px", maxHeight: "85vh", overflowY: "auto", boxShadow: `0 0 60px ${colors.accent}44` }}>
        <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: "28px", color: colors.accent, marginBottom: "20px", textAlign: "center" }}>
          {CATEGORY_ICONS[category]} {animal ? "Edit" : "Add New"} {category.slice(0, -1)}
        </div>

        {/* Main photo upload */}
        <div style={{ textAlign: "center", marginBottom: "16px" }}>
          <label style={{ cursor: "pointer" }}>
            <div style={{ width: "120px", height: "120px", borderRadius: "50%", border: `3px dashed ${colors.accent}`, background: form.image ? `url(${form.image}) center/cover` : `${colors.accent}11`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto", fontSize: "40px", overflow: "hidden" }}>
              {!form.image && "📸"}
            </div>
            <input type="file" accept="image/*" onChange={handleMainImage} style={{ display: "none" }} />
            <div style={{ color: colors.accent, fontSize: "12px", marginTop: "6px", fontFamily: "'Nunito', sans-serif" }}>
              {form.image ? "Tap to change photo" : "📸 Tap to add photo — AI will identify it!"}
            </div>
          </label>
        </div>

        {/* AI Loading */}
        {aiLoading && (
          <div style={{ background: `${colors.accent}11`, border: `1px solid ${colors.accent}44`, borderRadius: "14px", padding: "16px", marginBottom: "16px", textAlign: "center" }}>
            <div style={{ fontSize: "28px", marginBottom: "8px" }}>🤖</div>
            <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: "16px", color: colors.accent }}>AI is identifying your photo...</div>
            <div style={{ fontSize: "12px", color: "#888", fontFamily: "'Nunito', sans-serif", marginTop: "4px" }}>Analyzing species, generating fun facts...</div>
          </div>
        )}

        {/* AI Error */}
        {aiError && (
          <div style={{ background: "#ff444411", border: "1px solid #ff444444", borderRadius: "14px", padding: "12px", marginBottom: "16px", fontFamily: "'Nunito', sans-serif", fontSize: "13px", color: "#ff8888", textAlign: "center" }}>
            ⚠️ {aiError}
          </div>
        )}

        {/* AI Result */}
        {aiResult && <AIResultBanner result={aiResult} colors={colors} onAccept={handleAcceptAI} onDismiss={() => setAiResult(null)} />}

        {/* Drag reposition */}
        {form.image && <DragToReposition image={form.image} position={form.imgPos || { x: 50, y: 50 }} onChange={(pos) => setForm(f => ({ ...f, imgPos: pos }))} accent={colors.accent} light={colors.light} />}

        {/* Extra photos */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ color: colors.light, fontSize: "13px", fontFamily: "'Nunito', sans-serif", fontWeight: "700", display: "block", marginBottom: "8px" }}>📸 Extra Photos Gallery</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "8px" }}>
            {(form.extraPhotos || []).map((p, i) => (
              <div key={i} style={{ position: "relative" }}>
                <img src={p} alt="" style={{ width: "64px", height: "64px", borderRadius: "10px", objectFit: "cover", border: `2px solid ${colors.accent}44` }} />
                <button onClick={() => removeExtraPhoto(i)} style={{ position: "absolute", top: "-6px", right: "-6px", background: "#ff4444", border: "none", borderRadius: "50%", width: "20px", height: "20px", color: "#fff", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
              </div>
            ))}
            <label style={{ cursor: "pointer" }}>
              <div style={{ width: "64px", height: "64px", borderRadius: "10px", border: `2px dashed ${colors.accent}44`, background: `${colors.accent}08`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", color: colors.accent }}>+</div>
              <input type="file" accept="image/*" multiple onChange={handleExtraPhotos} style={{ display: "none" }} />
            </label>
          </div>
          <div style={{ fontSize: "11px", color: "#666", fontFamily: "'Nunito', sans-serif" }}>Add multiple photos. Tap + to add more.</div>
        </div>

        {/* Text fields */}
        {[
          { label: "Species Name *", key: "name", placeholder: "e.g. American Robin" },
          { label: "Nickname 😄", key: "nickname", placeholder: "e.g. Professor Poopy Pants" },
          { label: "Scientific Name", key: "scientificName", placeholder: "e.g. Turdus migratorius" },
          { label: "First Seen", key: "firstSeen", placeholder: "e.g. June 2, 2026" },
        ].map(({ label, key, placeholder }) => (
          <div key={key} style={{ marginBottom: "14px" }}>
            <label style={{ color: colors.light, fontSize: "13px", fontFamily: "'Nunito', sans-serif", fontWeight: "700", display: "block", marginBottom: "4px" }}>{label}</label>
            <input value={form[key] || ""} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder}
              style={{ width: "100%", background: "#0a0a1a", border: `1px solid ${colors.accent}44`, borderRadius: "10px", padding: "10px 14px", color: "#fff", fontFamily: "'Nunito', sans-serif", fontSize: "14px", outline: "none", boxSizing: "border-box" }} />
          </div>
        ))}

        {/* Frequency */}
        <div style={{ marginBottom: "14px" }}>
          <label style={{ color: colors.light, fontSize: "13px", fontFamily: "'Nunito', sans-serif", fontWeight: "700", display: "block", marginBottom: "6px" }}>How often do you see it?</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {VISIT_FREQ.map(f => (
              <button key={f} onClick={() => setForm(x => ({ ...x, frequency: f }))} style={{ background: form.frequency === f ? colors.accent : `${colors.accent}11`, color: form.frequency === f ? "#000" : colors.light, border: `1px solid ${colors.accent}44`, borderRadius: "20px", padding: "5px 12px", fontSize: "12px", cursor: "pointer", fontFamily: "'Nunito', sans-serif", fontWeight: "700" }}>{f}</button>
            ))}
          </div>
        </div>

        {/* Food */}
        <div style={{ marginBottom: "14px" }}>
          <label style={{ color: colors.light, fontSize: "13px", fontFamily: "'Nunito', sans-serif", fontWeight: "700", display: "block", marginBottom: "6px" }}>Favorite Foods</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {FOOD_OPTIONS[category].map(food => (
              <button key={food} onClick={() => toggleFood(food)} style={{ background: form.favoriteFood.includes(food) ? colors.accent : `${colors.accent}11`, color: form.favoriteFood.includes(food) ? "#000" : colors.light, border: `1px solid ${colors.accent}44`, borderRadius: "20px", padding: "5px 12px", fontSize: "12px", cursor: "pointer", fontFamily: "'Nunito', sans-serif", fontWeight: "700" }}>🍽️ {food}</button>
            ))}
          </div>
        </div>

        {/* Uses bath */}
        {category === "Birds" && (
          <div style={{ marginBottom: "14px" }}>
            <button onClick={() => setForm(f => ({ ...f, usesBath: !f.usesBath }))} style={{ background: form.usesBath ? colors.accent : `${colors.accent}11`, border: `1px solid ${colors.accent}`, borderRadius: "10px", padding: "8px 16px", color: form.usesBath ? "#000" : colors.light, cursor: "pointer", fontFamily: "'Nunito', sans-serif", fontWeight: "700", fontSize: "13px" }}>
              🛁 {form.usesBath ? "Uses the bird bath! ✅" : "Uses bird bath?"}
            </button>
          </div>
        )}

        {/* Notes */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ color: colors.light, fontSize: "13px", fontFamily: "'Nunito', sans-serif", fontWeight: "700", display: "block", marginBottom: "4px" }}>Personal Notes</label>
          <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Anything special? Funny behaviors? Memorable moments?" rows={3}
            style={{ width: "100%", background: "#0a0a1a", border: `1px solid ${colors.accent}44`, borderRadius: "10px", padding: "10px 14px", color: "#fff", fontFamily: "'Nunito', sans-serif", fontSize: "14px", outline: "none", resize: "vertical", boxSizing: "border-box" }} />
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={onClose} style={{ flex: 1, background: "#ffffff11", border: "1px solid #ffffff22", borderRadius: "12px", color: "#fff", padding: "12px", cursor: "pointer", fontFamily: "'Fredoka One', cursive", fontSize: "16px" }}>Cancel</button>
          <button onClick={() => { if (!form.name.trim()) return alert("Please enter a species name!"); onSave({ ...form, id: form.id || Date.now() }); }}
            style={{ flex: 2, background: `linear-gradient(135deg, ${colors.accent}, ${colors.light})`, border: "none", borderRadius: "12px", color: "#000", padding: "12px", cursor: "pointer", fontFamily: "'Fredoka One', cursive", fontSize: "16px" }}>
            {animal ? "💾 Save Changes" : "✨ Add to Journal!"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function WildlifeJournal() {
  const [activeCategory, setActiveCategory] = useState("Birds");
  const [animals, setAnimals] = useState([
    { id: 1, name: "American Robin", nickname: "", scientificName: "Turdus migratorius", category: "Birds", firstSeen: "June 2, 2026", frequency: "Daily", favoriteFood: ["Peanut Butter Suet"], usesBath: true, notes: "Super special — uses the feeder AND the bird bath! Very unusual for a robin.", image: null, extraPhotos: [], funFact: "Robins can hear earthworms moving underground.", aiIdentified: false },
    { id: 2, name: "Mourning Dove", nickname: "Professor Poopy Pants", scientificName: "Zenaida macroura", category: "Birds", firstSeen: "Before 2026", frequency: "Daily", favoriteFood: ["Mixed Seed"], usesBath: false, notes: "Partner showed up too — was likely nesting nearby this whole time! 🥹", image: null, extraPhotos: [], funFact: "Mourning doves mate for life.", aiIdentified: false },
    { id: 3, name: "Eastern Gray Squirrel", nickname: "", scientificName: "Sciurus carolinensis", category: "Critters", firstSeen: "June 2, 2026", frequency: "Daily", favoriteFood: ["Sunflower Seeds"], usesBath: false, notes: "Was caught soaking its head in the brand new bird bath on day one!", image: null, extraPhotos: [], funFact: "Squirrels forget where they bury about half their nuts!", aiIdentified: false },
  ]);
  const [showModal, setShowModal] = useState(false);
  const [editAnimal, setEditAnimal] = useState(null);
  const colors = CATEGORY_COLORS[activeCategory];
  const filtered = animals.filter(a => a.category === activeCategory);
  const totalSpecies = new Set(animals.map(a => a.name)).size;

  const handleSave = (animal) => {
    setAnimals(prev => prev.find(a => a.id === animal.id) ? prev.map(a => a.id === animal.id ? animal : a) : [...prev, animal]);
    setShowModal(false);
    setEditAnimal(null);
  };

  const handleDelete = (id) => {
    if (confirm("Remove this entry from your journal?")) setAnimals(prev => prev.filter(a => a.id !== id));
  };

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet" />
      <div style={{ minHeight: "100vh", background: `radial-gradient(ellipse at top, ${colors.bg} 0%, #0a0a0f 60%)`, transition: "background 0.5s ease", fontFamily: "'Nunito', sans-serif", padding: "0 0 40px 0" }}>

        {/* Header */}
        <div style={{ textAlign: "center", padding: "32px 20px 20px" }}>
          <div style={{ fontSize: "48px", marginBottom: "8px" }}>🌿</div>
          <h1 style={{ fontFamily: "'Fredoka One', cursive", fontSize: "clamp(28px, 6vw, 42px)", background: `linear-gradient(135deg, ${colors.accent}, ${colors.light})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", margin: "0 0 4px 0", lineHeight: 1.1 }}>My Wildlife Journal</h1>
          <p style={{ color: "#888", fontSize: "14px", margin: "0 0 4px 0" }}>Front Garden Nature Diary 🪟</p>
          <p style={{ color: "#555", fontSize: "11px", margin: "0 0 16px 0" }}>🤖 AI-Powered Species Identification</p>

          {/* Stats */}
          <div style={{ display: "inline-flex", gap: "20px", background: "#ffffff08", border: "1px solid #ffffff11", borderRadius: "20px", padding: "10px 24px", marginBottom: "24px" }}>
            {CATEGORIES.map(cat => (
              <div key={cat} style={{ textAlign: "center" }}>
                <div style={{ fontSize: "20px" }}>{CATEGORY_ICONS[cat]}</div>
                <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: "18px", color: CATEGORY_COLORS[cat].accent }}>{animals.filter(a => a.category === cat).length}</div>
                <div style={{ fontSize: "10px", color: "#666" }}>{cat}</div>
              </div>
            ))}
            <div style={{ textAlign: "center", borderLeft: "1px solid #ffffff11", paddingLeft: "20px" }}>
              <div style={{ fontSize: "20px" }}>⭐</div>
              <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: "18px", color: "#fbbf24" }}>{totalSpecies}</div>
              <div style={{ fontSize: "10px", color: "#666" }}>Species</div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", justifyContent: "center", gap: "10px", flexWrap: "wrap" }}>
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)} style={{ background: activeCategory === cat ? `linear-gradient(135deg, ${CATEGORY_COLORS[cat].accent}, ${CATEGORY_COLORS[cat].light})` : "#ffffff11", border: activeCategory === cat ? "none" : `1px solid ${CATEGORY_COLORS[cat].accent}44`, borderRadius: "20px", padding: "10px 22px", color: activeCategory === cat ? "#000" : CATEGORY_COLORS[cat].accent, cursor: "pointer", fontFamily: "'Fredoka One', cursive", fontSize: "16px", transition: "all 0.3s ease", transform: activeCategory === cat ? "scale(1.05)" : "scale(1)" }}>{CATEGORY_ICONS[cat]} {cat}</button>
            ))}
          </div>
        </div>

        {/* Butterfly Recipe */}
        {activeCategory === "Butterflies" && (
          <div style={{ maxWidth: "900px", margin: "0 auto 20px", padding: "0 16px" }}>
            <div style={{ background: "linear-gradient(135deg, #2a1a3a, #1a0a2a)", border: "2px solid #c084fc66", borderRadius: "20px", padding: "20px 24px", boxShadow: "0 8px 32px #c084fc22" }}>
              <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: "20px", color: "#c084fc", marginBottom: "14px" }}>🦋 Butterfly Feeder Recipe</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
                {[
                  { emoji: "🧃", amount: "1 cup", ingredient: "Orange Gatorade", note: "Electrolytes butterflies love!" },
                  { emoji: "🍬", amount: "1 tbsp", ingredient: "White Sugar", note: "Extra energy source" },
                  { emoji: "🍶", amount: "1 tsp", ingredient: "White Vinegar", note: "Keeps bees & wasps away" },
                ].map(({ emoji, amount, ingredient, note }) => (
                  <div key={ingredient} style={{ background: "#c084fc11", border: "1px solid #c084fc33", borderRadius: "14px", padding: "12px 16px", flex: "1", minWidth: "140px" }}>
                    <div style={{ fontSize: "28px", marginBottom: "4px" }}>{emoji}</div>
                    <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: "18px", color: "#c084fc" }}>{amount}</div>
                    <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: "13px", color: "#e9d5ff", fontWeight: "700" }}>{ingredient}</div>
                    <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: "11px", color: "#888", marginTop: "2px" }}>{note}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: "14px", background: "#c084fc11", borderRadius: "12px", padding: "10px 14px", fontFamily: "'Nunito', sans-serif", fontSize: "12px", color: "#888", lineHeight: 1.6 }}>
                💡 <strong style={{ color: "#e9d5ff" }}>How to use:</strong> Mix together and soak a sponge in the mixture. Place sponge in a shallow red dish. Change every 2-3 days in warm weather!
              </div>
            </div>
          </div>
        )}

        {/* Cards */}
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0 16px" }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#555" }}>
              <div style={{ fontSize: "64px", marginBottom: "16px" }}>{CATEGORY_ICONS[activeCategory]}</div>
              <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: "22px", color: colors.accent, marginBottom: "8px" }}>No {activeCategory} yet!</div>
              <div style={{ fontSize: "14px" }}>Add your first {activeCategory.slice(0, -1).toLowerCase()} — AI will identify it from your photo! 🤖</div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "16px", marginBottom: "24px" }}>
              {filtered.map(animal => (
                <AnimalCard key={animal.id} animal={animal} onEdit={(a) => { setEditAnimal(a); setShowModal(true); }} onDelete={handleDelete} />
              ))}
            </div>
          )}

          {filtered.length > 0 && <p style={{ textAlign: "center", color: "#555", fontSize: "12px", marginBottom: "20px" }}>💡 Tap any card to reveal a fun fact • 📸 Tap photo count to view gallery • 🤖 AI identifies new photos automatically</p>}

          <div style={{ textAlign: "center" }}>
            <button onClick={() => { setEditAnimal(null); setShowModal(true); }} style={{ background: `linear-gradient(135deg, ${colors.accent}, ${colors.light})`, border: "none", borderRadius: "50px", padding: "16px 36px", color: "#000", fontFamily: "'Fredoka One', cursive", fontSize: "20px", cursor: "pointer", boxShadow: `0 8px 32px ${colors.accent}44` }}>
              {CATEGORY_ICONS[activeCategory]} Add New {activeCategory.slice(0, -1)}!
            </button>
          </div>
        </div>

        {showModal && <AddEditModal animal={editAnimal} category={activeCategory} onSave={handleSave} onClose={() => { setShowModal(false); setEditAnimal(null); }} />}
      </div>
    </>
  );
}
