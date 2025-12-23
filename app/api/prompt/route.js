import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { XMLParser } from "fast-xml-parser";
import yaml from "js-yaml";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";

let promptCache = null;
let commonPromptCache = null;
let difficultyPromptCache = null;

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
    const key = `${chapter}|${type}`;
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

const loadDifficultyPrompts = () => {
  if (difficultyPromptCache) {
    return difficultyPromptCache;
  }

  const yamlContent = fs.readFileSync(getDataPath("difficulty.yaml"), "utf-8");
  const data = yaml.load(yamlContent);
  const levels = data?.levels || {};

  difficultyPromptCache = new Map();
  Object.entries(levels).forEach(([level, template]) => {
    difficultyPromptCache.set(String(level).trim(), (template || "").trim());
  });

  return difficultyPromptCache;
};

const generatePrompt = (number, chapterType, difficulty) => {
  const prompts = loadPrompts();
  const commonPrompt = loadCommonPrompt();
  const difficultyPrompts = loadDifficultyPrompts();

  const chapterKey = `${Number.parseInt(String(number).trim(), 10)}|${String(chapterType).trim()}`;
  const difficultyKey = String(difficulty).trim();

  const chapterPrompt = prompts.get(chapterKey);
  const difficultyPrompt = difficultyPrompts.get(difficultyKey);

  const promptParts = [commonPrompt];

  if (difficultyPrompt) {
    promptParts.push(difficultyPrompt);
  } else {
    promptParts.push(`선택한 난이도(${difficulty}) 프롬프트를 찾을 수 없습니다.`);
  }

  if (chapterPrompt) {
    promptParts.push(chapterPrompt);
  } else {
    promptParts.push(`선택한 챕터/타입(${chapterKey}) 프롬프트를 찾을 수 없습니다.`);
  }

  return promptParts.join("\n");
};

const cleanJsonCandidate = (raw = "") => {
  const withoutFences = raw.replace(/```(?:json)?/gi, "").trim();
  const withoutControlChars = withoutFences.replace(/[\u0000-\u001f]+/g, " ");
  // remove trailing commas before } or ]
  return withoutControlChars.replace(/,\s*([}\]])/g, "$1");
};

const extractQuestionsFromModel = (text) => {
  const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error("유효한 JSON 블록을 찾을 수 없습니다.");
  }

  const candidate = cleanJsonCandidate(jsonMatch[0]);
  let parsed;
  try {
    parsed = JSON.parse(candidate);
  } catch (error) {
    console.warn("[prompt] JSON.parse 실패, 후처리 재시도", error?.message);
    // 흔한 파싱 오류를 더 정제해서 한 번 더 시도
    const fallback = cleanJsonCandidate(candidate.replace(/\\(?!["\\/bfnrtu])/g, "\\\\"));
    try {
      parsed = JSON.parse(fallback);
    } catch (err) {
      throw new Error(`모델 응답 JSON 파싱 실패: ${err.message}`);
    }
  }

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

const getAiProvider = () => {
  const provider = process.env.USE_AI || "GPT";
  return String(provider).trim().toUpperCase();
};

async function getGptResponse(prompt) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY가 설정되지 않았습니다.");
  }

  // Fast model defaults: override via env if needed
  const model =
    process.env.OPENAI_MODEL?.trim() ||
    process.env.OPENAI_FAST_MODEL?.trim() ||
    "gpt-5.1";
  const reasoningEffort = process.env.OPENAI_REASONING_EFFORT?.trim();
  const textVerbosity = process.env.OPENAI_TEXT_VERBOSITY?.trim();
  const apiStart = Date.now();
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const requestBody = { model, input: prompt };
  if (reasoningEffort) {
    requestBody.reasoning = { effort: reasoningEffort };
  }
  if (textVerbosity) {
    requestBody.text = { verbosity: textVerbosity };
  }

  const response = await client.responses.create(requestBody);
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

async function getGeminiResponse(prompt) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY가 설정되지 않았습니다.");
  }

  const apiStart = Date.now();
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY, {
    apiVersion: process.env.GEMINI_API_VERSION?.trim() || "v1beta",
  });
  const modelName = process.env.GEMINI_MODEL?.trim() || "gemini-3-flash-preview";
  const model = genAI.getGenerativeModel({ model: modelName });
  const localizedPrompt = `${prompt}\n\n모든 응답은 한국어로 작성하세요. JSON 형식은 유지하세요.`;
  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: localizedPrompt }] }],
    generationConfig: {
      thinking: { level: "low" },
    },
  });
  logDuration(`Gemini generateContent (${modelName})`, apiStart);

  const content = result?.response?.text()?.trim();
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
    const aiProvider = getAiProvider();
    console.log(`[prompt] provider selected: ${aiProvider}`);
    const questions =
      aiProvider === "GEMINI" ? await getGeminiResponse(prompt) : await getGptResponse(prompt);
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
