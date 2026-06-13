export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { image, category } = req.body;

    const categoryHint =
      category === "Birds"
        ? "bird"
        : category === "Critters"
        ? "small mammal, squirrel, chipmunk, or critter"
        : "butterfly or insect";

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
        "Authorization": `Bearer ${process.env.VITE_OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://wildlife-journal.vercel.app",
        "X-Title": "Wildlife Journal",
      },
      body: JSON.stringify({
        model: "meta-llama/llama-4-maverick:free",
        max_tokens: 400,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: image } },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({
        error: `API error: ${response.status} - ${errText}`,
      });
    }

    const data = await response.json();
    const text = data.choices[0].message.content;
    const clean = text.replace(/```json|```/g, "").trim();
    const result = JSON.parse(clean);

    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
