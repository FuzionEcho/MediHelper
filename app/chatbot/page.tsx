import type { Metadata } from "next"
import ChatbotInterface from "@/components/chatbot/chatbot-interface"
import { PageHeader } from "@/components/page-header"
import { Card } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Medical Assistant Chatbot",
  description: "Get help with your medical questions through our AI assistant",
}

export default function ChatbotPage() {
  return (
    <div className="container mx-auto py-6 space-y-8">
      <PageHeader
        heading="Medical Assistant Chatbot"
        text="Ask questions about your medical bills, insurance, appointments, and more."
      />

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 h-[600px]">
          <Card className="h-full">
            <ChatbotInterface />
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">What can I ask?</h2>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <span className="bg-primary/10 p-1 rounded">💰</span>
                <span>Questions about understanding your medical bills</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-primary/10 p-1 rounded">🏥</span>
                <span>Help finding nearby healthcare providers</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-primary/10 p-1 rounded">🚗</span>
                <span>Assistance with transportation to appointments</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-primary/10 p-1 rounded">📅</span>
                <span>Guidance on scheduling appointments</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-primary/10 p-1 rounded">📋</span>
                <span>Information about insurance coverage</span>
              </li>
            </ul>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Example Questions</h2>
            <ul className="space-y-2 text-sm">
              <li>"How do I read my medical bill?"</li>
              <li>"Find a doctor near me"</li>
              <li>"Does my insurance cover physical therapy?"</li>
              <li>"I need help getting to my appointment"</li>
              <li>"How do I schedule a follow-up visit?"</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  )
}
