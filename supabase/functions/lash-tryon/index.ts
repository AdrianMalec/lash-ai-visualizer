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
    "Apply CLASSIC 1:1 eyelash extensions: one fiber per natural lash, evenly spaced, soft natural density, subtle feminine enhancement.",
  volume:
    "Apply MEGA VOLUME Russian eyelash extensions: dense fluffy 5D-8D handmade fans of ultra-fine fibers, dark black, dramatic wide-open glamorous look, lush but fibers still individually visible.",
  cateye:
    "Apply CAT-EYE wispy eyelash extensions: gradient lengths, shortest in the inner corner growing to longest at the outer corner, elongated lifted winged shape, seductive feline effect, visible wispy spikes at the outer third.",
  doll:
    "Apply DOLL-LOOK eyelash extensions: rounded center-focused shape, longest fibers in the middle of the eye, opens the eye vertically, romantic sweet doll effect.",
  fox: "Apply FOX-EYE eyelash extensions: sharp horizontal wing, shortest inner corner growing to a dramatic elongated outer corner, editorial high-fashion elongated eye shape.",
  wet: "Apply WET-LOOK spiky Kim-K style eyelash extensions: separated glossy spikes with visible gaps between clusters, trendy Korean anime effect, wet shiny appearance.",
};

const CURL_DESCRIPTIONS: Record<string, string> = {
  J: "J-curl: almost straight, very subtle lift, most natural look",
  B: "B-curl: gentle soft curve, natural everyday lift",
  C: "C-curl: classic medium curl, visible open-eye lift, most popular",
  CC: "CC-curl: between C and D, stronger glamorous lift",
  D: "D-curl: dramatic strong curl, maximum lift and eye-opening effect",
  L: "L-curl: flat base with sharp upward angle, ideal for hooded and droopy eyelids",
  M: "M-curl: strong upward kick with a modern lifted effect",
};

const THICKNESS_DESCRIPTIONS: Record<string, string> = {
  "0.03": "0.03mm ultra-fine fibers, extremely light and feathery",
  "0.05": "0.05mm very fine fibers, soft fluffy volume fans",
  "0.07": "0.07mm fine fibers, classic volume fan thickness",
  "0.10": "0.10mm medium fibers, defined but still soft",
  "0.15": "0.15mm classic fibers, visible defined single lashes",
  "0.20": "0.20mm thick bold fibers, strong mascara-like definition",
};

const DENSITY_DESCRIPTIONS: Record<string, string> = {
  natural: "natural density: about 60-80 fibers per eye, every natural lash enhanced once",
  medium: "medium density: 2D-3D fans, clearly fuller but still elegant",
  full: "full density: 4D-6D fans, rich glamorous volume",
  mega: "mega density: 7D-10D fans, maximum dramatic black volume",
};

type Params = {
  lengthMm?: number;
  curl?: string;
  thickness?: string;
  density?: string;
};

function buildParamsPrompt(p: Params): string {
  const parts: string[] = [];
  if (typeof p.lengthMm === "number" && p.lengthMm >= 6 && p.lengthMm <= 18) {
    parts.push(`Fiber length: ${p.lengthMm}mm (scaled realistically to the eye size in the photo; use a natural length map — shorter 6-9mm at the inner corner, longest at the designed peak, slightly shorter again at the very outer tip).`);
  }
  if (p.curl && CURL_DESCRIPTIONS[p.curl]) {
    parts.push(`Curl: ${CURL_DESCRIPTIONS[p.curl]}. The curl shape must be clearly visible in side curvature of every fiber.`);
  }
  if (p.thickness && THICKNESS_DESCRIPTIONS[p.thickness]) {
    parts.push(`Fiber thickness: ${THICKNESS_DESCRIPTIONS[p.thickness]}.`);
  }
  if (p.density && DENSITY_DESCRIPTIONS[p.density]) {
    parts.push(`Density: ${DENSITY_DESCRIPTIONS[p.density]}.`);
  }
  if (!parts.length) return "";
  return (
    "TECHNICAL SPECIFICATION — follow it exactly, this is how a lash stylist would execute this set:\n" +
    parts.join("\n") +
    "\nThe result must look like a professional photo of exactly this specification."
  );
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageUrl, style, engine, customDescription, referenceImageUrl, params } = await req.json();
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

    const basePrompt =
      STYLE_PROMPTS[style] ??
      (typeof customDescription === "string" && customDescription.trim()
        ? `Apply eyelash extensions in this style: ${customDescription.slice(0, 400)}.`
        : STYLE_PROMPTS.classic);

    const paramsPrompt = buildParamsPrompt(typeof params === "object" && params ? params : {});

    const hasReference = typeof referenceImageUrl === "string" && referenceImageUrl.startsWith("data:image/");
    const referencePrompt = hasReference
      ? "REFERENCE IMAGE: the second image shows the exact lash set to copy (a reference/inspiration photo, e.g. from Pinterest). Reproduce its lash style faithfully on the FIRST image: same curl, length map, density, thickness, direction and overall character of the lashes. Do not copy anything else from the reference — no face, no makeup, no background. Transfer ONLY the lashes."
      : "";

    const prompt = [basePrompt, paramsPrompt, referencePrompt, REALISM].filter(Boolean).join("\n\n");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const content: unknown[] = [
      { type: "text", text: prompt },
      { type: "image_url", image_url: { url: imageUrl } },
    ];
    if (hasReference) {
      content.push({ type: "image_url", image_url: { url: referenceImageUrl } });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content }],
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
