import { getEnv } from "./utils";

export async function generateArticleAI(prompt: string) {
  const apiKey = getEnv("VITE_OPENAI_API_KEY") || getEnv("OPENAI_API_KEY");
  if (!apiKey) {
    throw new Error("OpenAI API key not found in environment variables.");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o", // You can change this to gpt-3.5-turbo if needed
      messages: [
        {
          role: "system",
          content:
            "You are an expert article writer for a business directory platform. Create engaging, informative, and professional articles based on the given prompts. Return a JSON object with 'title' (string) and 'content' (markdown string).",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || "Failed to generate article");
  }

  const data = await response.json();
  const content = JSON.parse(data.choices[0].message.content);
  return content;
}

export async function generateListingInsights(listingsData: any[]) {
  const apiKey = getEnv("VITE_OPENAI_API_KEY") || getEnv("OPENAI_API_KEY");
  if (!apiKey) {
    throw new Error("OpenAI API key not found. Please set VITE_OPENAI_API_KEY.");
  }

  const prompt = `Analyze the following business listings and provide performance predictions and growth insights:
  ${JSON.stringify(listingsData.map((l) => ({ name: l.name, category: l.category, city: l.city, views: l.views })))}
  
  Return a JSON object with:
  - "score": (number 0-100) overall market potential
  - "summary": (string) 2-sentence executive summary
  - "predictions": (array of strings) 3 specific predictions for the next quarter
  - "recommendations": (array of strings) 3 actionable steps to improve performance`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are a senior business consultant and market analyst specializing in the African market. Return only JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || "Failed to generate insights");
  }

  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}
