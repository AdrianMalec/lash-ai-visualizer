import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const STYLE_PROMPTS: Record<string, string> = {
  classic:
    "Add elegant CLASSIC eyelash extensions to this person's eyes: subtle, natural-looking 9-11mm lashes with C-curl, evenly spaced, soft and feminine. Keep skin texture, eye color, makeup and lighting identical. Only modify the lashes.",
  volume:
    "Add dramatic MEGA VOLUME russian eyelash extensions to this person's eyes: ultra full, thick, fluffy 13-15mm lashes with D-curl, lush and glamorous. Keep skin texture, eye color, makeup and lighting identical. Only modify the lashes.",
  cateye:
    "Add wispy CAT-EYE eyelash extensions to this person's eyes: elongated outer corners 10-13mm, CC-curl, seductive lifted look. Keep skin texture, eye color, makeup and lighting identical. Only modify the lashes.",
  doll:
    "Add DOLL-LOOK eyelash extensions to this person's eyes: rounded center-focused 10-12mm lashes with D-curl, opens up the eyes, romantic and sweet. Keep skin texture, eye color, makeup and lighting identical. Only modify the lashes.",
  fox: "Add FOX-EYE eyelash extensions to this person's eyes: sharp dramatic outer wing 11-14mm with L-curl, editorial high-fashion look. Keep skin texture, eye color, makeup and lighting identical. Only modify the lashes.",
  wet: "Add WET-LOOK SPIKY anime eyelash extensions to this person's eyes: glossy textured separated 12-14mm spikes with M-curl, trendy korean style. Keep skin texture, eye color, makeup and lighting identical. Only modify the lashes.",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageUrl, style } = await req.json();

    if (!imageUrl || typeof imageUrl !== "string") {
      return new Response(JSON.stringify({ error: "imageUrl is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = STYLE_PROMPTS[style] ?? STYLE_PROMPTS.classic;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: imageUrl } },
            ],
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (response.status === 429) {
      return new Response(
        JSON.stringify({ error: "Zbyt wiele żądań. Spróbuj ponownie za chwilę." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (response.status === 402) {
      return new Response(
        JSON.stringify({ error: "Wymagane uzupełnienie kredytów Lovable AI." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const generated = data?.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!generated) {
      console.error("No image returned:", JSON.stringify(data).slice(0, 500));
      return new Response(JSON.stringify({ error: "AI nie zwróciło obrazu" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ image: generated }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("lash-tryon error:", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
