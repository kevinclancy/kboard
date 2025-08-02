import { Box, Text, VStack, Input, Textarea, Button, HStack } from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { API_ROOT } from "./config";

type ReplyMode =
  | { type: "new_thread"; boardId: number }
  | { type: "existing_thread"; boardId: number; threadId: number; replyTo?: number }
  | { type: "edit_reply"; boardId: number; threadId: number; replyId: number; currentText: string };

interface ReplyEditorProps {
  replyMode: ReplyMode;
  onPostSucceeded: () => void;
  onAuthenticationError: () => void;
  onCancel: () => void;
}

interface Reply {
  id: number;
  body: string;
  /// [reply_id, reply_body_text] - the ID and text of the reply being responded to
  reply_to: [number, string] | null;
  thread_id: number;
  poster: number;
  poster_username: string;
  created_at: string;
}

export function ReplyEditor({ replyMode, onPostSucceeded, onAuthenticationError, onCancel }: ReplyEditorProps) {
  const [title, setTitle] = useState("");
  const [replyText, setReplyText] = useState(replyMode.type === "edit_reply" ? replyMode.currentText : "");
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
        } else if (response.status === 401 || response.status === 403) {
          onAuthenticationError();
          setError("Authentication error. Please log in or register to create threads.");
        } else {
          setError("Failed to create thread");
        }
      } else if (replyMode.type === "existing_thread") {
        // Create reply to existing thread
        const response = await fetch(`${API_ROOT}/boards/${replyMode.boardId}/threads/${replyMode.threadId}/replies`, {
          method: "POST",
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            body: replyText,
            reply_to: replyMode.replyTo || null,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          console.log("Reply created with ID:", data.reply_id);
          setReplyText("");
          onPostSucceeded();
        } else if (response.status === 401 || response.status === 403) {
          onAuthenticationError();
          setError("Authentication error. Please log in or register to reply to threads.");
        } else {
          setError("Failed to create reply");
        }
      } else if (replyMode.type === "edit_reply") {
        // Update existing reply
        const response = await fetch(`${API_ROOT}/boards/${replyMode.boardId}/threads/${replyMode.threadId}/replies/${replyMode.replyId}`, {
          method: "PATCH",
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            body: replyText,
          }),
        });

        if (response.ok) {
          console.log("Reply updated successfully");
          setReplyText("");
          onPostSucceeded();
        } else if (response.status === 401 || response.status === 403) {
          onAuthenticationError();
          setError("Authentication error. Please log in or register to edit replies.");
        } else {
          setError("Failed to update reply");
        }
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

        {/* Submit and Cancel buttons */}
        <HStack gap={2}>
          <Button
            onClick={handleSubmit}
            loading={loading}
            loadingText="Submitting..."
            colorScheme="blue"
            size="lg"
          >
            {replyMode.type === "new_thread" ? "Create Thread" : 
             replyMode.type === "edit_reply" ? "Update Reply" : "Post Reply"}
          </Button>
          <Button
            onClick={onCancel}
            variant="outline"
            size="lg"
          >
            Cancel
          </Button>
        </HStack>

        {/* Error display */}
        {error && (
          <Text color="red.500" fontSize="sm">
            {error}
          </Text>
        )}

      </VStack>
    </Box>
  );
}