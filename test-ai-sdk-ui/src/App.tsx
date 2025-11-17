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
      files: message.files,
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
            messages.map((message) => (
              <Message from={message.role} key={message.id}>
                <MessageContent
                  className={`${message.role === "user" ? "bg-blue-500" : "bg-gray-200"}`}
                >
                  {message.parts.map((part, i) => {
                    switch (part.type) {
                      case "text": // we don't use any reasoning or tool calls in this example
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
                      case "tool-addResource":
                        return (
                          <p className="my-2" key={`${message.id}-${i}`}>
                            call
                            {part.state === "output-available" ? "ed" : "ing"}{" "}
                            tool: {part.type}
                            <pre className="my-4 rounded-sm bg-zinc-900 p-2">
                              {JSON.stringify(part.input, null, 2)}
                            </pre>
                          </p>
                        );
                      default:
                        return null;
                    }
                  })}
                </MessageContent>
              </Message>
            ))
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      {(status === "submitted" || status === "streaming") && (
        <div>{status === "submitted" && <Shimmer>Loading...</Shimmer>}</div>
      )}

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
