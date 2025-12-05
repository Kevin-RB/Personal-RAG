import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { MessageSquare, SendIcon } from "lucide-react";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "./components/ai-elements/conversation";
import { Message, MessageContent } from "./components/ai-elements/message";
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputBody,
  PromptInputFooter,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "./components/ai-elements/prompt-input";
import { Response } from "./components/ai-elements/response";
import { Shimmer } from "./components/ai-elements/shimmer";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "./components/ai-elements/tool";
import type {
  GetDateToolUIPart,
  GetInformationToolUIPart,
} from "./components/tool-calls";

function App() {
  const transportInstance = new DefaultChatTransport({
    api: "http://localhost:3000/api/chat",
  });

  const { sendMessage, messages, status } = useChat({
    transport: transportInstance,
  });

  const handleSubmit = (message: PromptInputMessage) => {
    const hasText = Boolean(message.text);
    const hasAttachments = Boolean(message.files?.length);

    if (!(hasText || hasAttachments)) {
      return;
    }
    sendMessage({
      text: message.text || "Sent with attachments",
    });
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
            messages.map((message) => {
              const isLastMessage = message.id === messages.at(-1)?.id;
              return (
                <Message from={message.role} key={message.id}>
                  <MessageContent>
                    {isLastMessage && status === "streaming" ? (
                      <Shimmer duration={1}>Streaming</Shimmer>
                    ) : null}
                    {message.parts.map((part, i) => {
                      switch (part.type) {
                        case "text":
                          return (
                            <Response key={`${message.id}-${i}`}>
                              {part.text}
                            </Response>
                          );
                        case "file":
                          return (
                            <iframe
                              height={600}
                              key={`${message.id}-pdf-${i}`}
                              src={part.url}
                              title={`pdf-${i}`}
                              width={500}
                            />
                          );
                        case "tool-getInformationTool": {
                          const getInformationToolMessage =
                            part as GetInformationToolUIPart;
                          return (
                            <Tool
                              defaultOpen={false}
                              key={`${message.id}-${i}`}
                            >
                              <ToolHeader
                                state={getInformationToolMessage.state}
                                type="tool-Retrieval Augmented Generation"
                              />
                              <ToolContent>
                                <ToolInput
                                  input={getInformationToolMessage.input}
                                />
                                <ToolOutput
                                  errorText={
                                    getInformationToolMessage.errorText
                                  }
                                  output={getInformationToolMessage.output}
                                />
                              </ToolContent>
                            </Tool>
                          );
                        }
                        case "tool-getDateTool": {
                          const getDateToolMessage = part as GetDateToolUIPart;
                          return (
                            <Tool
                              defaultOpen={false}
                              key={`${message.id}-${i}`}
                            >
                              <ToolHeader
                                state={getDateToolMessage.state}
                                type="tool-Sharknado summoning"
                              />
                              <ToolContent>
                                <ToolInput input={getDateToolMessage.input} />
                                <ToolOutput
                                  errorText={getDateToolMessage.errorText}
                                  output={getDateToolMessage.output}
                                />
                              </ToolContent>
                            </Tool>
                          );
                        }
                        default:
                          return null;
                      }
                    })}
                  </MessageContent>
                </Message>
              );
            })
          )}
          {status === "submitted" && <Shimmer duration={1}>Thinking</Shimmer>}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
      <PromptInput globalDrop multiple onSubmit={handleSubmit}>
        <PromptInputAttachments>
          {(attachments) => <PromptInputAttachment data={attachments} />}
        </PromptInputAttachments>
        <PromptInputBody>
          <PromptInputTextarea />
        </PromptInputBody>
        <PromptInputFooter>
          <PromptInputTools>
            <PromptInputActionMenu>
              <PromptInputActionMenuTrigger />
              <PromptInputActionMenuContent>
                <PromptInputActionAddAttachments />
              </PromptInputActionMenuContent>
            </PromptInputActionMenu>
          </PromptInputTools>
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
