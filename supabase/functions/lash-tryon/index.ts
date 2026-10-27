import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const REALISM = `
STRICT LOCAL EDIT — THIS IS A PHOTO RETOUCH, NOT A NEW IMAGE.
The ONLY pixels you may change are the eyelashes growing from the upper eyelid margin (and, only if needed, a few tiny lower lashes). Everything else must stay pixel-identical to the input photo.

DO NOT CHANGE (absolutely forbidden):
- face shape, jaw, nose, lips, mouth, cheeks, chin, ears, forehead
- skin tone, skin texture, pores, freckles, moles, wrinkles, blemishes — no smoothing, no beautify filter
- eye shape, eyelid shape, eye size, iris color, pupils, eye whites, catchlights, eye direction
- eyebrows, eyeshadow, eyeliner, makeup, hair, hairline, accessories, clothing
- background, framing, crop, resolution, camera angle, perspective, head pose, expression
- lighting, white balance, color grading, contrast, sharpness, noise/grain
Do not re-render or regenerate the face. Do not make the person look younger, slimmer or more attractive. Same person, same photo — only the lashes are new.

LASH REALISM:
Individual fibers with natural taper, rooted exactly on the lash line, following the eyelid curvature, slight natural variation in length and direction, subtle micro-shadow on the lid. Lighting and focus of the lashes must match the photo. No painted, sticker, CGI or cartoon look, no mascara clumps, no perfect symmetry.

Return the full original photo with only the lashes edited.`;

const STYLE_PROMPTS: Record<string, string> = {
  classic:
    "Apply CLASSIC 1:1 eyelash extensions: one 10mm C-curl 0.15 fiber per natural lash, evenly spaced, soft natural density, subtle feminine enhancement. " + REALISM,
  volume:
    "Apply MEGA VOLUME Russian eyelash extensions: dense fluffy 5D-8D fans of 0.05 fibers, 13-14mm D-curl, dark black, dramatic wide-open glamorous look, lush but fibers still individually visible. " + REALISM,
  cateye:
    "Apply CAT-EYE wispy eyelash extensions: gradient lengths 9mm inner to 13mm outer corner with CC-curl, elongated lifted winged shape, seductive feline effect, visible wispy spikes at the outer third. " + REALISM,
  doll:
    "Apply DOLL-LOOK eyelash extensions: rounded center-focused shape, longest 12mm in the middle with D-curl, opens the eye vertically, romantic sweet doll effect. " + REALISM,
  fox: "Apply FOX-EYE eyelash extensions: sharp horizontal wing, shortest inner corner 8mm growing to dramatic 13-14mm L-curl outer corner, editorial high-fashion elongated eye shape. " + REALISM,
  wet: "Apply WET-LOOK spiky Kim-K style eyelash extensions: separated glossy 12-14mm M-curl spikes with visible gaps between clusters, trendy Korean anime effect, wet shiny appearance. " + REALISM,
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageUrl, style, engine, customDescription } = await req.json();
    const ENGINES: Record<string, string> = {
      fast: "google/gemini-3.1-flash-lite-image",
      pro: "google/gemini-3-pro-image",
      classic: "google/gemini-2.5-flash-image",
    };
    const model = ENGINES[engine] ?? ENGINES.classic;

    if (!imageUrl || typeof imageUrl !== "string") {
      return new Response(JSON.stringify({ error: "imageUrl is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt =
      STYLE_PROMPTS[style] ??
      (typeof customDescription === "string" && customDescription.trim()
        ? `Apply eyelash extensions in this style: ${customDescription.slice(0, 400)}. ` + REALISM
        : STYLE_PROMPTS.classic);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
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
