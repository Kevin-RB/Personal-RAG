import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { MessageSquare, SendIcon } from "lucide-react";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Response } from "@/components/ai-elements/response";
import { Shimmer } from "@/components/ai-elements/shimmer";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";
import MessageAttachments from "@/components/message-attachment";
import type { RagAgentUIMessage } from "@/lib/message-types";

function App() {
  const { sendMessage, messages, status } = useChat<RagAgentUIMessage>({
    transport: new DefaultChatTransport({
      api: "http://localhost:3000/api/chat",
    }),
  });

  const handleSubmit = (message: PromptInputMessage) => {
    const hasText = Boolean(message.text);

    if (!hasText) {
      return;
    }

    sendMessage({
      text: message.text || "",
    });
    return;
  };

  return (
    <main className="flex h-dvh flex-col items-center p-16">
      <Conversation className="w-full">
        <ConversationContent>
          {messages.length === 0 ? (
            <ConversationEmptyState
              description="Start a conversation to see messages here"
              icon={<MessageSquare className="size-12" />}
              title="No messages yet"
            />
          ) : (
            messages.map((message) => (
              <Message from={message.role} key={message.id}>
                <MessageContent>
                  {message.parts.map((part, i) => {
                    switch (part.type) {
                      case "text":
                        return (
                          <Response key={`${message.id}-${i}`}>
                            {part.text}
                          </Response>
                        );
                      case "tool-getInformationTool": {
                        const hasOutput = part.state === "output-available";
                        const isStreaming =
                          hasOutput && part.preliminary === true;

                        if (!hasOutput) {
                          return null;
                        }

                        return (
                          <>
                            {isStreaming && part.output.step !== "complete" && (
                              <pre>
                                <Shimmer duration={6}>
                                  {part.output.message}
                                </Shimmer>
                              </pre>
                            )}

                            <Tool key={`${message.id}-${i}`}>
                              <ToolHeader
                                state={part.state}
                                type="tool-Knowledge Retrieval"
                              />
                              <ToolContent>
                                <ToolInput input={part.input} />
                                <ToolOutput
                                  errorText={part.errorText}
                                  output={part.output}
                                />
                              </ToolContent>
                            </Tool>
                          </>
                        );
                      }
                      default:
                        return null;
                    }
                  })}
                </MessageContent>
              </Message>
            ))
          )}
          {status === "submitted" && <Shimmer duration={1}>Thinking</Shimmer>}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <PromptInput globalDrop multiple onSubmit={handleSubmit}>
        <PromptInputBody>
          <MessageAttachments />
          <PromptInputTextarea />
        </PromptInputBody>

        <PromptInputFooter>
          <PromptInputSubmit
            className="h-8 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            status={status}
            variant="outline"
          >
            <SendIcon />
          </PromptInputSubmit>
        </PromptInputFooter>
      </PromptInput>
    </main>
  );
}

export default App;
