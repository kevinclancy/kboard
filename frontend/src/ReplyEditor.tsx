import { Box, Text, VStack, Input, Textarea, Button } from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { ThreadViewer } from "./ThreadViewer";
import { API_ROOT } from "./config";

type ReplyMode =
  | { type: "new_thread"; boardId: number }
  | { type: "existing_thread"; boardId: number; threadId: number; replyTo?: number };

interface ReplyEditorProps {
  replyMode: ReplyMode;
  onPostSucceeded: () => void;
}

interface Reply {
  id: number;
  body: string;
  reply_to: [number, string] | null;
  thread_id: number;
  poster: number;
  poster_username: string;
  created_at: string;
}

export function ReplyEditor({ replyMode, onPostSucceeded }: ReplyEditorProps) {
  const [title, setTitle] = useState("");
  const [replyText, setReplyText] = useState("");
  const [replyToData, setReplyToData] = useState<Reply | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch reply_to data if in existing thread mode with replyTo
  useEffect(() => {
    if (replyMode.type === "existing_thread" && replyMode.replyTo) {
      const fetchReplyToData = async () => {
        try {
          const response = await fetch(
            `${API_ROOT}/boards/${replyMode.boardId}/threads/${replyMode.threadId}/replies?page_size=100&page_number=0`,
            {
              method: "GET",
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json',
              },
            }
          );

          if (response.ok) {
            const data = await response.json();
            const targetReply = data.replies.find((r: Reply) => r.id === replyMode.replyTo);
            if (targetReply) {
              setReplyToData(targetReply);
            }
          }
        } catch (err) {
          console.error("Failed to fetch reply data:", err);
        }
      };

      fetchReplyToData();
    }
  }, [replyMode]);

  const handleSubmit = async () => {
    if (!replyText.trim()) {
      setError("Reply text is required");
      return;
    }

    if (replyMode.type === "new_thread" && !title.trim()) {
      setError("Thread title is required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (replyMode.type === "new_thread") {
        // Create new thread
        const response = await fetch(`${API_ROOT}/boards/${replyMode.boardId}/threads`, {
          method: "POST",
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: title,
            initial_reply_text: replyText,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          // TODO: Navigate to the new thread
          console.log("Thread created with ID:", data.thread_id);
          setTitle("");
          setReplyText("");
          onPostSucceeded();
        } else {
          setError("Failed to create thread");
        }
      } else {
        // Create reply to existing thread
        // TODO: Implement reply creation endpoint
        console.log("Would create reply to thread:", replyMode.threadId);
        setReplyText("");
        onPostSucceeded();
      }
    } catch (err) {
      console.error("Submit error:", err);
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box p={4}>
      <VStack align="stretch" gap={4}>
        {/* Title input for new threads */}
        {replyMode.type === "new_thread" && (
          <Box>
            <Text fontWeight="bold" mb={2}>Thread Title</Text>
            <Input
              placeholder="Enter thread title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </Box>
        )}

        {/* Reply-to display for existing thread replies */}
        {replyMode.type === "existing_thread" && replyToData && (
          <Box>
            <Text fontWeight="bold" mb={2}>Replying to:</Text>
            <Box
              p={3}
              bg="gray.100"
              borderLeft="4px solid"
              borderLeftColor="blue.400"
              borderRadius="md"
            >
              <Text fontSize="sm" fontWeight="semibold" color="blue.700" mb={1}>
                {replyToData.poster_username}
              </Text>
              <Text fontSize="sm">{replyToData.body}</Text>
            </Box>
          </Box>
        )}

        {/* Reply text editor */}
        <Box>
          <Text fontWeight="bold" mb={2}>
            {replyMode.type === "new_thread" ? "Initial Post" : "Reply"}
          </Text>
          <Textarea
            placeholder={
              replyMode.type === "new_thread"
                ? "Write your initial post..."
                : "Write your reply..."
            }
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            rows={6}
          />
        </Box>

        {/* Submit button */}
        <Button
          onClick={handleSubmit}
          loading={loading}
          loadingText="Submitting..."
          colorScheme="blue"
          size="lg"
        >
          {replyMode.type === "new_thread" ? "Create Thread" : "Post Reply"}
        </Button>

        {/* Error display */}
        {error && (
          <Text color="red.500" fontSize="sm">
            {error}
          </Text>
        )}

        {/* Thread viewer for existing threads */}
        {replyMode.type === "existing_thread" && (
          <Box mt={6}>
            <ThreadViewer
              boardId={replyMode.boardId}
              threadId={replyMode.threadId}
            />
          </Box>
        )}
      </VStack>
    </Box>
  );
}