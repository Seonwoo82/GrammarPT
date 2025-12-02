import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { XMLParser } from "fast-xml-parser";
import yaml from "js-yaml";
import OpenAI from "openai";

export const runtime = "nodejs";

let promptCache = null;
let commonPromptCache = null;

const parser = new XMLParser({
  ignoreAttributes: false,
  trimValues: true,
});

const getDataPath = (file) => path.join(process.cwd(), "data", file);

const loadPrompts = () => {
  if (promptCache) {
    return promptCache;
  }

  const xmlContent = fs.readFileSync(getDataPath("prompts.xml"), "utf-8");
  const parsed = parser.parse(xmlContent);
  const promptListRaw = parsed?.prompts?.prompt || [];
  const promptList = Array.isArray(promptListRaw) ? promptListRaw : [promptListRaw];

  promptCache = new Map();
  promptList.forEach((item) => {
    const chapter = Number.parseInt(String(item.Chapter).trim(), 10);
    const type = String(item.Type).trim();
    const difficulty = String(item.Difficulty).trim();
    const key = `${chapter}|${type}|${difficulty}`;
    promptCache.set(key, item.Content?.trim() || "");
  });

  return promptCache;
};

const loadCommonPrompt = () => {
  if (commonPromptCache) {
    return commonPromptCache;
  }

  const yamlContent = fs.readFileSync(getDataPath("default.yaml"), "utf-8");
  const data = yaml.load(yamlContent);
  commonPromptCache = data?.template || "공통 프롬프트";
  return commonPromptCache;
};

const generatePrompt = (number, chapterType, difficulty) => {
  const prompts = loadPrompts();
  const commonPrompt = loadCommonPrompt();
  const key = `${number}|${chapterType}|${difficulty}`;
  const promptContent = prompts.get(key);

  if (!promptContent) {
    return `${commonPrompt} 해당하는 프롬프트를 찾을 수 없습니다.`;
  }

  return `${commonPrompt}\n${promptContent}`;
};

const extractQuestionsFromModel = (text) => {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("유효한 JSON 블록을 찾을 수 없습니다.");
  }

  const jsonText = jsonMatch[0];
  const parsed = JSON.parse(jsonText);
  if (parsed?.questions) {
    return parsed.questions;
  }
  if (Array.isArray(parsed)) {
    return parsed;
  }
  return [];
};

const logDuration = (label, start) => {
  const elapsed = Date.now() - start;
  console.log(`[prompt-timer] ${label}: ${elapsed}ms`);
};

async function getGptResponse(prompt) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY가 설정되지 않았습니다.");
  }

  const model = process.env.OPENAI_MODEL?.trim() || "gpt-5-nano-2025-08-07";
  const reasoningEffort = process.env.OPENAI_REASONING_EFFORT?.trim() || "low";
  const textVerbosity = process.env.OPENAI_TEXT_VERBOSITY?.trim() || "high";
  const apiStart = Date.now();
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const response = await client.responses.create({
    model,
    input: prompt,
    ...(reasoningEffort ? { reasoning: { effort: reasoningEffort } } : {}),
    ...(textVerbosity ? { text: { verbosity: textVerbosity } } : {}),
  });
  logDuration("OpenAI responses.create", apiStart);

  let fallbackText = "";
  if (response.output) {
    fallbackText = response.output
      .map((item) => {
        if (item.type !== "message") {
          return "";
        }
        return item.content
          .filter((contentItem) => contentItem.type === "output_text")
          .map((contentItem) => contentItem.text)
          .join("\n");
      })
      .filter(Boolean)
      .join("\n")
      .trim();
  }

  const content = response.output_text?.trim() || fallbackText;
  if (!content) {
    throw new Error("응답이 비어 있습니다.");
  }

  return extractQuestionsFromModel(content);
}

export async function POST(request) {
  try {
    const requestStart = Date.now();
    const data = await request.json();
    const input = data?.user_input;

    if (!Array.isArray(input) || input.length !== 3) {
      return NextResponse.json(
        { error: "입력 형식이 올바르지 않습니다. 형식: [숫자, 챕터이름, 난이도]" },
        { status: 400 }
      );
    }

    const [number, chapter, difficulty] = input;
    console.log(
      `[prompt] request received: chapter=${number}, type=${chapter}, difficulty=${difficulty}`
    );
    const promptStart = Date.now();
    const prompt = generatePrompt(number, chapter, difficulty);
    logDuration("prompt generation", promptStart);
    const questions = await getGptResponse(prompt);
    logDuration("request total", requestStart);

    return NextResponse.json(questions || []);
  } catch (error) {
    console.error("API 오류:", error);
    return NextResponse.json(
      { error: `오류가 발생했습니다: ${error.message}` },
      { status: 500 }
    );
  }
}
