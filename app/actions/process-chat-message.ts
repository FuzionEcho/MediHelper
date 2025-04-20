"use server"

import OpenAI from "openai"

// Initialize OpenAI client with the API key from environment variables
const openai = new OpenAI({
  apiKey:
    process.env.OPENAI_API_KEY ||
    "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",
  dangerouslyAllowBrowser: true, // Add this line to address the error
})

// Simple in-memory cache for responses
const responseCache = new Map<string, string>()

export async function processChatMessage(message: string): Promise<string> {
  try {
    // Check if this is a voice command
    const isVoiceCommand =
      message.toLowerCase().startsWith("hey medihelper") ||
      message.toLowerCase().startsWith("hey medi helper") ||
      message.toLowerCase().startsWith("medihelper")

    // If it's a voice command, extract the actual command
    let processedMessage = message
    if (isVoiceCommand) {
      // Remove the wake word
      processedMessage = message.replace(/^(hey\s+)?medihelper\s+/i, "").trim()

      // If it's just the wake word with no command, prompt for a command
      if (!processedMessage) {
        return "I'm listening. What would you like me to do?"
      }
    }

    // Check cache first for quick responses to common questions
    const normalizedMessage = processedMessage.toLowerCase().trim()
    if (responseCache.has(normalizedMessage)) {
      return responseCache.get(normalizedMessage)!
    }

    // System prompt to define the assistant's behavior
    const systemPrompt = `
You are a helpful medical billing assistant named MediHelper. You help users navigate the MediHelper medical billing website.

The website has the following main sections:
- Dashboard: Overview of medical expenses, bills, and appointments
- Bills & Payments: Scan and manage medical bills
- Appointments: Schedule medical appointments and find nearby clinics
- Insurance: Find and manage insurance information
- Transportation: Arrange transportation to medical appointments
- Settings: Configure account settings
- Chatbot: Chat with the medical assistant (that's you!)

When users ask about navigating to a specific section or finding information that's in a specific section, 
suggest they go to that section and explain what they can do there. For example, if they ask about bills, 
suggest they go to the Bills & Payments section.

If the user seems to be asking for directions or navigation help, respond with phrases like:
- "You can find that in the [Section] section. Would you like me to take you there?"
- "Let me help you navigate to the [Section] section where you can..."
- "I can help you get to the [Section] page. That's where you can..."

The user may be using voice commands, so be responsive to phrases like "go to [section]", "open [section]", 
"show me [section]", etc. Treat these as navigation requests.

Keep your responses concise, friendly, and helpful. Always maintain a helpful, supportive tone as users may be dealing with stressful healthcare situations.
`

    // Call the OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: processedMessage },
      ],
      max_tokens: 150,
      temperature: 0.7,
    })

    // Extract the response
    const response =
      completion.choices[0]?.message?.content ||
      "I'm sorry, I'm having trouble understanding. Could you try asking about medical bills, insurance, finding doctors, or scheduling appointments?"

    // Cache the response for future use
    responseCache.set(normalizedMessage, response)

    return response
  } catch (error) {
    console.error("Error processing chat message:", error)

    // Fallback to pattern matching if API call fails
    return fallbackProcessMessage(message)
  }
}

// Fallback function using pattern matching
function fallbackProcessMessage(message: string): string {
  // Check if this is a voice command
  const isVoiceCommand =
    message.toLowerCase().startsWith("hey medihelper") ||
    message.toLowerCase().startsWith("hey medi helper") ||
    message.toLowerCase().startsWith("medihelper")

  // If it's a voice command, extract the actual command
  let processedMessage = message
  if (isVoiceCommand) {
    // Remove the wake word
    processedMessage = message.replace(/^(hey\s+)?medihelper\s+/i, "").trim()

    // If it's just the wake word with no command, prompt for a command
    if (!processedMessage) {
      return "I'm listening. What would you like me to do?"
    }
  }

  const normalizedMessage = processedMessage.toLowerCase().trim()

  // Direct navigation commands
  if (normalizedMessage.match(/^(go|navigate|take me|open|show)\s+to\s+(the\s+)?(dashboard|home)/i)) {
    return "I'll take you to the Dashboard right away."
  }

  if (normalizedMessage.match(/^(go|navigate|take me|open|show)\s+to\s+(the\s+)?(bills?|payments?|scan)/i)) {
    return "I'll take you to the Bills & Payments section right away."
  }

  if (normalizedMessage.match(/^(go|navigate|take me|open|show)\s+to\s+(the\s+)?(appointments?|schedule)/i)) {
    return "I'll take you to the Appointments section right away."
  }

  if (normalizedMessage.match(/^(go|navigate|take me|open|show)\s+to\s+(the\s+)?(insurance|coverage)/i)) {
    return "I'll take you to the Insurance section right away."
  }

  if (normalizedMessage.match(/^(go|navigate|take me|open|show)\s+to\s+(the\s+)?(transportation|rides?)/i)) {
    return "I'll take you to the Transportation section right away."
  }

  if (normalizedMessage.match(/^(go|navigate|take me|open|show)\s+to\s+(the\s+)?(settings|preferences)/i)) {
    return "I'll take you to the Settings section right away."
  }

  // Medical-specific intents for fallback
  const medicalIntents = [
    {
      patterns: ["bill", "payment", "charge", "cost", "scan"],
      response:
        "You can manage your medical bills in the Bills & Payments section. Would you like me to take you there?",
    },
    {
      patterns: ["appointment", "schedule", "doctor", "clinic", "visit"],
      response: "You can schedule appointments in the Appointments section. Would you like me to take you there?",
    },
    {
      patterns: ["insurance", "coverage", "plan", "policy"],
      response: "You can find insurance information in the Insurance section. Would you like me to take you there?",
    },
    {
      patterns: ["transport", "ride", "car", "pickup"],
      response: "You can arrange transportation in the Transportation section. Would you like me to take you there?",
    },
    {
      patterns: ["dashboard", "overview", "summary", "home"],
      response:
        "The Dashboard provides an overview of your healthcare information. Would you like me to take you there?",
    },
    {
      patterns: ["setting", "account", "profile", "preference"],
      response: "You can adjust your settings in the Settings section. Would you like me to take you there?",
    },
    {
      patterns: ["help", "guide", "navigate", "find", "where", "take me", "go to", "show me"],
      response: "I'm here to help you navigate the MediHelper app! What would you like assistance with today?",
    },
  ]

  // Check for matches in our intents
  for (const intent of medicalIntents) {
    if (intent.patterns.some((pattern) => normalizedMessage.includes(pattern))) {
      return intent.response
    }
  }

  // Default response if no match is found
  return "I'm here to help you navigate the MediHelper app. You can ask about bills, appointments, insurance, or transportation!"
}
