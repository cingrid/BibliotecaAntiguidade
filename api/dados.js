// Lê e grava as marcações da biblioteca no Upstash Redis.
// Toda chamada precisa do cabeçalho x-app-password igual à variável APP_PASSWORD.
import { Redis } from "@upstash/redis";
import { timingSafeEqual } from "node:crypto";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
});

const COLECOES = ["est", "notas", "extras"];
const chave = (c) => "ba:" + c;

function senhaCerta(enviada) {
  const a = Buffer.from(String(enviada || ""));
  const b = Buffer.from(String(process.env.APP_PASSWORD || ""));
  return b.length > 0 && a.length === b.length && timingSafeEqual(a, b);
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (!process.env.APP_PASSWORD) {
    return res.status(500).json({ erro: "APP_PASSWORD não configurada na Vercel" });
  }
  if (!senhaCerta(req.headers["x-app-password"])) {
    await new Promise((r) => setTimeout(r, 700)); // atrasa tentativas de adivinhar a senha
    return res.status(401).json({ erro: "senha" });
  }
  try {
    if (req.method === "GET") {
      const [est, notas, extras] = await Promise.all(COLECOES.map((c) => redis.hgetall(chave(c))));
      return res.status(200).json({ est: est || {}, notas: notas || {}, extras: extras || {} });
    }
    if (req.method === "POST") {
      const corpo = req.body || {};
      if (corpo.importar) {
        for (const c of COLECOES) {
          const itens = corpo.importar[c];
          if (itens && typeof itens === "object" && Object.keys(itens).length) await redis.hset(chave(c), itens);
        }
        return res.status(200).json({ ok: true });
      }
      const { coll, id, value } = corpo;
      if (!COLECOES.includes(coll) || typeof id !== "string" || !/^[\w.-]{1,80}$/.test(id)) {
        return res.status(400).json({ erro: "pedido inválido" });
      }
      if (value === null) await redis.hdel(chave(coll), id);
      else await redis.hset(chave(coll), { [id]: value });
      return res.status(200).json({ ok: true });
    }
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ erro: "método não permitido" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ erro: "falha no banco" });
  }
}
