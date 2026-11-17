import Anthropic from "@anthropic-ai/sdk";
import {
  CHAT_MODEL,
  checkLimits,
  HISTORY_LIMIT,
  MAX_MESSAGE_CHARS,
  MAX_OUTPUT_TOKENS,
  supportsFallback,
  systemPrompt,
} from "@/lib/chat";
import { getContent } from "@/lib/content";
import { db } from "@/lib/db";
import { clientIp, hashIp, json } from "@/lib/request";

/** Jawaban di-stream; kasih waktu cukup di platform serverless. */
export const maxDuration = 60;

const SESSION_RE = /^[a-z0-9]{20,40}$/i;

let client: Anthropic | null = null;
const anthropic = () => (client ??= new Anthropic());

/**
 * POST /api/chat  { message, sessionId? }
 * → stream teks (text/plain) jawaban Claude. Id sesi dikirim balik di header `x-chat-session`.
 *
 * Riwayat percakapan disimpen di DB dan dibaca dari sana (bukan dari client),
 * jadi pengunjung nggak bisa nyelipin jawaban "assistant" palsu ke konteks.
 */
export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return json({ error: "The AI is offline right now. The commands still work (type help)." }, 503);
  }

  let body: { message?: unknown; sessionId?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Bad request." }, 400);
  }
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) return json({ error: "Empty question." }, 400);
  if (message.length > MAX_MESSAGE_CHARS) return json({ error: `Keep it under ${MAX_MESSAGE_CHARS} characters.` }, 400);

  const prisma = db();
  const ipHash = hashIp(clientIp(req.headers));

  // sesi lama cuma dipake kalau milik IP yang sama; selain itu bikin baru
  let sessionId: string | null = null;
  if (typeof body.sessionId === "string" && SESSION_RE.test(body.sessionId)) {
    const s = await prisma.chatSession.findUnique({ where: { id: body.sessionId }, select: { ipHash: true } });
    if (s?.ipHash === ipHash) sessionId = body.sessionId;
  }

  const limit = await checkLimits(ipHash, sessionId);
  if (!limit.ok) {
    return json({ error: limit.error }, 429, limit.retryAfter ? { "retry-after": String(limit.retryAfter) } : undefined);
  }

  if (!sessionId) {
    const s = await prisma.chatSession.create({
      data: { ipHash, userAgent: req.headers.get("user-agent")?.slice(0, 200) ?? null },
    });
    sessionId = s.id;
  }

  // jawaban yang gagal (stopReason "error") nggak ikut jadi konteks
  const history = await prisma.chatMessage.findMany({
    where: { sessionId, OR: [{ stopReason: null }, { stopReason: { not: "error" } }] },
    orderBy: { createdAt: "desc" },
    take: HISTORY_LIMIT,
    select: { role: true, content: true },
  });
  await prisma.chatMessage.create({ data: { sessionId, role: "user", content: message, ipHash } });

  const messages: Anthropic.Beta.BetaMessageParam[] = [
    ...history
      .reverse()
      .filter((m) => m.content)
      .map((m) => ({ role: m.role === "assistant" ? ("assistant" as const) : ("user" as const), content: m.content })),
    { role: "user", content: message },
  ];
  // percakapan harus dimulai dari user (kalau riwayat kepotong di tengah)
  while (messages.length && messages[0]!.role !== "user") messages.shift();

  const content = await getContent();
  const sid = sessionId;
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let text = "";
      let stopReason = "error";
      let usage: { input_tokens: number; output_tokens: number } | null = null;
      let model = CHAT_MODEL;
      const write = (t: string) => {
        text += t;
        controller.enqueue(encoder.encode(t));
      };

      try {
        const run = anthropic().beta.messages.stream({
          model: CHAT_MODEL,
          max_tokens: MAX_OUTPUT_TOKENS,
          // chat santai: effort rendah = mikir seperlunya, jawaban cepat & hemat token
          output_config: { effort: "low" },
          // model yang mendukung: kalau nolak karena kebijakan, server otomatis coba model cadangan
          ...(supportsFallback(CHAT_MODEL)
            ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const }
            : {}),
          system: [{ type: "text", text: systemPrompt(content), cache_control: { type: "ephemeral" } }],
          messages,
        });

        for await (const event of run) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") write(event.delta.text);
        }
        const final = await run.finalMessage();
        stopReason = final.stop_reason ?? "end_turn";
        // input_tokens nggak termasuk token yang ditulis/dibaca dari prompt cache; dijumlah semua
        // biar estimasi biaya di admin nggak kerendahan (cache read sebenernya cuma 0.1x harga)
        const u = final.usage;
        usage = {
          input_tokens: u.input_tokens + (u.cache_creation_input_tokens ?? 0) + (u.cache_read_input_tokens ?? 0),
          output_tokens: u.output_tokens,
        };
        model = final.model;
        if (final.stop_reason === "refusal") {
          write(`${text ? "\n" : ""}I can't help with that one. Ask me about my work instead.`);
        } else if (final.stop_reason === "max_tokens") {
          write("…");
        }
      } catch (err) {
        console.error("[chat]", err instanceof Anthropic.APIError ? `${err.status} ${err.message}` : err);
        const msg =
          err instanceof Anthropic.RateLimitError || err instanceof Anthropic.InternalServerError
            ? "The AI is busy right now. Try again in a minute."
            : "Something broke on my side. Try again, or use email.";
        write(`${text ? "\n" : ""}[${msg}]`);
      } finally {
        controller.close();
        await prisma.chatMessage
          .create({
            data: {
              sessionId: sid,
              role: "assistant",
              content: text,
              ipHash,
              model,
              stopReason,
              inputTokens: usage?.input_tokens ?? null,
              outputTokens: usage?.output_tokens ?? null,
            },
          })
          .catch((e) => console.error("[chat] gagal nyimpen jawaban:", e));
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
      "x-chat-session": sid,
    },
  });
}
