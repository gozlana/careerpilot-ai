require("dotenv").config();

const { OpenAI } = require("openai");

const client = new OpenAI({
  apiKey: process.env.AZURE_FOUNDRY_API_KEY,
  baseURL: process.env.AZURE_FOUNDRY_ENDPOINT,
});

async function callFoundry(prompt) {
  const response = await client.chat.completions.create({
    model: process.env.AZURE_FOUNDRY_MODEL,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.7,
  });

  return response.choices[0].message.content;
}

module.exports = callFoundry;
