const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("AI_ALLOWED_ORIGIN") || "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
  });

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método não permitido." }, 405);

  // A função é pública para visitantes, mas só aceita a chave pública do próprio portal.
  const publishableKeys = (() => {
    try { return JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS") || "{}"); } catch { return {}; }
  })();
  const expectedPublicKey = Deno.env.get("SUPABASE_ANON_KEY") || publishableKeys.default || Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || "";
  const suppliedKey = req.headers.get("apikey") || "";
  if (!expectedPublicKey || suppliedKey !== expectedPublicKey) {
    return json({ error: "Pedido não autorizado." }, 401);
  }

  const geminiKey = Deno.env.get("GEMINI_API_KEY");
  if (!geminiKey) return json({ error: "O serviço de IA ainda não está configurado." }, 503);

  let body: { messages?: unknown };
  try {
    const raw = await req.text();
    if (raw.length > 18000) return json({ error: "A conversa é demasiado longa. Inicie uma nova conversa." }, 413);
    body = JSON.parse(raw);
  } catch {
    return json({ error: "Pedido inválido." }, 400);
  }

  if (!Array.isArray(body.messages) || body.messages.length < 1 || body.messages.length > 12) {
    return json({ error: "Envie uma pergunta válida." }, 400);
  }
  const messages = body.messages.map((item: any) => {
    if (!item || !["user", "model"].includes(item.role) || typeof item.content !== "string") return null;
    const content = item.content.trim();
    if (!content || content.length > 1200) return null;
    return { role: item.role, parts: [{ text: content }] };
  });
  if (messages.some((m) => m === null) || messages[messages.length - 1]?.role !== "user") {
    return json({ error: "Formato da conversa inválido." }, 400);
  }

  // Limite por IP com hash; o endereço IP bruto não é guardado na base de dados.
  const secretKeys = (() => {
    try { return JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}"); } catch { return {}; }
  })();
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || secretKeys.default || Deno.env.get("SUPABASE_SECRET_KEY");
  const salt = Deno.env.get("AI_RATE_LIMIT_SALT");
  if (!supabaseUrl || !serviceKey || !salt) {
    return json({ error: "A protecção de utilização ainda não está configurada." }, 503);
  }
  const ip = (req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown").trim();
  const ipHash = await sha256(`${salt}:${ip}`);
  const { createClient } = await import("npm:@supabase/supabase-js@2");
  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  const minuteAgo = new Date(Date.now() - 60_000).toISOString();
  const { count, error: countError } = await admin.from("ai_chat_limits").select("id", { count: "exact", head: true }).eq("ip_hash", ipHash).gte("created_at", minuteAgo);
  if (countError) return json({ error: "Não foi possível validar o limite de utilização." }, 503);
  if ((count || 0) >= 8) return json({ error: "Atingiu o limite temporário de perguntas. Aguarde um minuto e tente novamente." }, 429);
  const { error: insertError } = await admin.from("ai_chat_limits").insert({ ip_hash: ipHash });
  if (insertError) return json({ error: "Não foi possível iniciar a conversa." }, 503);
  // Limpeza simples de registos antigos para a tabela não crescer indefinidamente.
  await admin.from("ai_chat_limits").delete().lt("created_at", new Date(Date.now() - 86_400_000).toISOString());

  const systemPrompt = `És o assistente virtual geral do portal da Associação dos Estudantes do Magistério Nº 1028 CNO, Comandante Benedito. Responde em português claro, natural e respeitoso, salvo se o visitante escrever noutra língua. És um chatbot de utilização pública e podes ajudar com assuntos gerais como educação, tecnologia, cultura, ciência, escrita e dúvidas do quotidiano. Não afirmes que és uma pessoa nem que representas oficialmente a Direcção. Não inventes comunicados, regras, datas, contactos ou decisões da instituição. Se perguntarem por informação interna ou actual da Associação que não esteja incluída na conversa, explica que não tens acesso confirmado a essa informação e orienta a pessoa a consultar os canais oficiais. Não afirmes que pesquisaste na Internet nem que tens informação em tempo real. Se não souberes algo, admite-o. Mantém respostas úteis e proporcionais à pergunta. Não peças nem repitas palavras-passe, códigos de verificação ou dados pessoais desnecessários.`;

  try {
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${encodeURIComponent(geminiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: messages,
        generationConfig: { temperature: 0.7, maxOutputTokens: 700 },
      }),
    });
    const result = await geminiResponse.json().catch(() => ({}));
    if (!geminiResponse.ok) {
      if (geminiResponse.status === 429) return json({ error: "A IA atingiu temporariamente o limite gratuito. Tente novamente mais tarde." }, 429);
      console.error("Gemini API error:", geminiResponse.status, result?.error?.message || "unknown");
      return json({ error: "O serviço de IA está temporariamente indisponível." }, 502);
    }
    const reply = result?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || "").join("").trim();
    if (!reply) return json({ error: "Não foi possível gerar uma resposta. Reformule a pergunta." }, 502);
    return json({ reply });
  } catch (error) {
    console.error("AI chat failure:", error);
    return json({ error: "Falha de ligação ao serviço de IA. Tente novamente." }, 502);
  }
});
