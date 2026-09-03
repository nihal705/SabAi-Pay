// test-models.js
require("dotenv").config();

async function testModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log("❌ GEMINI_API_KEY not found in .env");
    return;
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`,
    );
    const data = await response.json();

    console.log("\n📋 Available Gemini Models:\n");
    console.log("Model Name".padEnd(35) + " | Supports Generation");
    console.log("-".repeat(65));

    const available = [];
    if (data.models) {
      data.models.forEach((model) => {
        const name = model.name.replace("models/", "");
        const supportsGen =
          model.supportedGenerationMethods?.includes("generateContent");
        const supportsFC =
          model.supportedGenerationMethods?.includes("generateContent");
        const emoji = supportsGen ? "✅" : "❌";
        console.log(`${name.padEnd(35)} | ${emoji}`);
        if (supportsGen) available.push(name);
      });
    }

    console.log("\n✅ Recommended Models for Function Calling:");
    const recommended = [
      "gemini-2.5-flash",
      "gemini-2.5-flash-002",
      "gemini-2.5-flash",
      "gemini-1.5-pro",
      "gemini-2.0-flash",
    ];
    recommended.forEach((m) => {
      const found = available.includes(m);
      console.log(`  ${found ? "✅" : "❌"} ${m}`);
    });

    console.log("\n💡 Set in .env: GEMINI_MODEL=gemini-2.5-flash");
  } catch (error) {
    console.error("Error:", error.message);
    console.log(
      "\n⚠️  Make sure your API key is valid and you have internet connection",
    );
  }
}

testModels();
