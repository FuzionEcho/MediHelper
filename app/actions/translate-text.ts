"use server"

import { translateTextWithGemini } from "./translate-text-fallback"
import { Anthropic } from "@anthropic-ai/sdk"

interface TranslationResult {
  success: boolean
  translatedText?: string
  error?: string
}

/**
 * Translates text to the specified language using Anthropic Claude AI
 * Falls back to Google Gemini if Anthropic fails
 */
export async function translateText(text: string, targetLanguage: string): Promise<TranslationResult> {
  try {
    if (!text || text.trim() === "") {
      return {
        success: false,
        error: "No text provided for translation",
      }
    }

    // Check if Anthropic API key is configured
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      console.log("Anthropic API key not found, falling back to Google Gemini")
      return translateTextWithGemini(text, targetLanguage)
    }

    // Get language name from code
    const languageNames: Record<string, string> = {
      en: "English",
      es: "Spanish",
      fr: "French",
      de: "German",
      zh: "Chinese",
      ar: "Arabic",
      hi: "Hindi",
      ru: "Russian",
    }

    const languageName = languageNames[targetLanguage] || targetLanguage

    // If target language is English, no need to translate
    if (targetLanguage === "en") {
      return {
        success: true,
        translatedText: text,
      }
    }

    // Initialize Anthropic client
    const anthropic = new Anthropic({
      apiKey: apiKey,
    })

    // Create the prompt for translation
    const prompt = `
     You are a professional translator. Please translate the following text from English to ${languageName}.
     Maintain the original formatting as much as possible.
     
     Text to translate:
     ${text}
     
     Translated text:
   `

    // Call Anthropic API
    const response = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }],
    })

    // Extract the translated text from the response
    const translatedText = response.content[0].text

    return {
      success: true,
      translatedText,
    }
  } catch (error) {
    console.error("Error in Anthropic translation:", error)
    // If any error occurs with Anthropic, try the Gemini fallback
    try {
      console.log("Attempting fallback to Google Gemini after Anthropic error")
      return translateTextWithGemini(text, targetLanguage)
    } catch (fallbackError) {
      console.error("Fallback translation also failed:", fallbackError)
      return {
        success: false,
        error: `Translation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      }
    }
  }
}
