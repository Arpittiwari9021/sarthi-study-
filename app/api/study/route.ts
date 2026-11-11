import { NextResponse } from "next/server";
export async function POST(req: Request) {
  try {
    const { action, topic, material, context } = await req.json();
    const key = process.env.OPENROUTER_API_KEY; const ollama = process.env.OLLAMA_URL;
    const system = `You are Sarthi Study Engine. Create educational content, not generic chatbot fluff. Use simple Hinglish if context suggests it. For NIMCET, make questions mathematically correct, show concise solutions, track likely weak concepts, and never invent source content. Return clean plain text with headings.`;
    const prompt = action === "quiz" ? `Create 5 ${topic || "NIMCET"} practice questions. Mix MCQ and short-answer. Start easy and increase difficulty. Do NOT reveal answers yet. Material:\n${material || ""}` : action === "lesson" ? `Teach ${topic || "this topic"} from zero to exam level. Give intuition, formulas/rules, 2 examples, common mistakes and 3 practice prompts. Material:\n${material || ""}` : `Make a 7-day study plan for ${topic || "my studies"} using this context: ${JSON.stringify(context || {})}`;
    if (key) { const r=await fetch("https://openrouter.ai/api/v1/chat/completions",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${key}`,"HTTP-Referer":process.env.APP_URL||"http://localhost:3000","X-Title":"Sarthi Study Engine"},body:JSON.stringify({model:process.env.OPENROUTER_MODEL||"openrouter/free",messages:[{role:"system",content:system},{role:"user",content:prompt}],temperature:.25,max_tokens:1400})}); if(r.ok){const d=await r.json();return NextResponse.json({content:d.choices?.[0]?.message?.content||""})} }
    if (ollama) { const r=await fetch(`${ollama.replace(/\/$/,"")}/api/chat`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:process.env.OLLAMA_MODEL||"qwen3:4b",stream:false,messages:[{role:"system",content:system},{role:"user",content:prompt}]})}); if(r.ok){const d=await r.json();return NextResponse.json({content:d.message?.content||""})} }
    return NextResponse.json({content:"AI provider configured nahi hai. OpenRouter ya Ollama connect karo."},{status:503});
  } catch { return NextResponse.json({error:"Study generation failed"},{status:500}); }
}
