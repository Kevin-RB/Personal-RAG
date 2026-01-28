import {
  Attachment,
  AttachmentHoverCard,
  AttachmentHoverCardContent,
  AttachmentHoverCardTrigger,
  AttachmentInfo,
  AttachmentPreview,
  AttachmentRemove,
  Attachments,
  getAttachmentLabel,
  getMediaCategory,
} from "@/components/ai-elements/attachments";
import { usePromptInputAttachments } from "@/components/ai-elements/prompt-input";

const MessageAttachments = () => {
  const { files: attachments, remove } = usePromptInputAttachments();

  function handleRemoveAttachment(id: string) {
    remove(id);
  }

  return (
    <Attachments variant="inline">
      {attachments.map((attachment) => {
        const mediaCategory = getMediaCategory(attachment);
        const label = getAttachmentLabel(attachment);

        return (
          <AttachmentHoverCard key={attachment.id}>
            <AttachmentHoverCardTrigger asChild>
              <Attachment
                data={attachment}
                key={attachment.id}
                onRemove={() => handleRemoveAttachment(attachment.id)}
              >
                <AttachmentPreview />
                <AttachmentInfo />
                <AttachmentRemove />
              </Attachment>
            </AttachmentHoverCardTrigger>
            <AttachmentHoverCardContent>
              <div className="space-y-3">
                {mediaCategory === "image" &&
                  attachment.type === "file" &&
                  attachment.url && (
                    <div className="flex max-h-96 w-80 items-center justify-center overflow-hidden rounded-md border">
                      <img
                        alt={label}
                        className="max-h-full max-w-full object-contain"
                        height={384}
                        src={attachment.url}
                        width={320}
                      />
                    </div>
                  )}
                <div className="space-y-1 px-0.5">
                  <h4 className="font-semibold text-sm leading-none">
                    {label}
                  </h4>
                  {attachment.mediaType && (
                    <p className="font-mono text-muted-foreground text-xs">
                      {attachment.mediaType}
                    </p>
                  )}
                </div>
              </div>
            </AttachmentHoverCardContent>
          </AttachmentHoverCard>
        );
      })}
    </Attachments>
  );
};

export default MessageAttachments;
