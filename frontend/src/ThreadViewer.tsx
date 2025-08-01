import { Box, Text, VStack, Spinner, HStack, IconButton, Breadcrumb, Button } from "@chakra-ui/react";
import { Pagination } from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ReplyEditor } from "./ReplyEditor";
import { API_ROOT } from "./config";
import { AuthState } from "./KBoard";

interface Reply {
  id: number;
  body: string;
  reply_to: [number, string] | null;
  thread_id: number;
  poster: number;
  poster_username: string;
  updated_at: string;
}

interface ThreadViewerProps {
  boardId: number;
  threadId: number;
  authState: AuthState;
  onAuthenticationError: () => void;
}

export function ThreadViewer({ boardId, threadId, authState, onAuthenticationError }: ThreadViewerProps) {
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState(25);
  const [pageNumber, setPageNumber] = useState(0);
  const [totalReplies, setTotalReplies] = useState(0);
  const [threadTitle, setThreadTitle] = useState<string>("");
  const [boardName, setBoardName] = useState<string>("");
  const [showReplyEditor, setShowReplyEditor] = useState(false);
  const [editingReplyId, setEditingReplyId] = useState<number | null>(null);

  const fetchReplies = async () => {
    try {
      setLoading(true);
      const url = `${API_ROOT}/boards/${boardId}/threads/${threadId}/replies?page_size=${pageSize}&page_number=${pageNumber}`;
      const response = await fetch(url, {
        method: "GET",
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setReplies(data.replies || []);
        setTotalReplies(data.total_count || 0);
        setThreadTitle(data.thread_title || "");
        setBoardName(data.board_name || "");
      } else {
        setError('Failed to fetch replies');
      }
    } catch (err) {
      console.log(err);
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReplies();
  }, [boardId, threadId, pageSize, pageNumber]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: 'UTC',
      timeZoneName: 'short'
    });
  };

  const handlePageChange = (page: number) => {
    setPageNumber(page - 1); // Chakra UI uses 1-based indexing, our API uses 0-based
  };

  const totalPages = Math.ceil(totalReplies / pageSize);

  if (loading) {
    return (
      <Box p={4}>
        <Spinner size="lg" />
        <Text ml={2}>Loading replies...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={4}>
        <Text color="red.500">{error}</Text>
      </Box>
    );
  }

  return (
    <Box p={4}>
      {boardName && threadTitle && (
        <Breadcrumb.Root mb={4} fontSize="xl">
          <Breadcrumb.List>
            <Breadcrumb.Item>
              <Link to={`/boards/${boardId}/threads`} style={{ textDecoration: 'none' }}>
                <Breadcrumb.Link fontSize="xl" fontWeight="semibold">
                  {boardName}
                </Breadcrumb.Link>
              </Link>
            </Breadcrumb.Item>
            <Breadcrumb.Separator />
            <Breadcrumb.Item>
              <Breadcrumb.CurrentLink fontSize="xl" fontWeight="bold">
                {threadTitle}
              </Breadcrumb.CurrentLink>
            </Breadcrumb.Item>
          </Breadcrumb.List>
        </Breadcrumb.Root>
      )}

      {/* New Reply Button */}
      {boardName && threadTitle && (
        <Button
          onClick={() => {
            if (authState.type === "logged_out") {
              setError("You must be logged in to reply to this thread. Please log in or register first.");
            } else {
              setShowReplyEditor(!showReplyEditor);
              setError(null);
            }
          }}
          colorScheme="blue"
          size="md"
          mb={4}
        >
          {showReplyEditor ? "Cancel Reply" : "New Reply"}
        </Button>
      )}

      {/* Reply Editor */}
      {showReplyEditor && (
        <Box mb={6}>
          <ReplyEditor 
            replyMode={{ type: "existing_thread", boardId: boardId, threadId: threadId }}
            onPostSucceeded={() => {
              setShowReplyEditor(false);
              fetchReplies();
            }}
            onAuthenticationError={onAuthenticationError}
            onCancel={() => setShowReplyEditor(false)}
          />
        </Box>
      )}
      
      <VStack align="stretch" gap={4}>
        {!Array.isArray(replies) || replies.length === 0 ? (
          <Text color="gray.500">No replies found</Text>
        ) : (
          replies.map((reply) => (
            <Box
              key={reply.id}
              p={4}
              borderWidth={1}
              borderRadius="md"
              bg="white"
              boxShadow="sm"
            >
              <HStack align="start" gap={4} w="full">
                {/* Left side - Username */}
                <Box
                  p={2}
                  bg="blue.50"
                  borderRadius="md"
                  minW="120px"
                >
                  <Text fontWeight="bold" color="blue.700">
                    {reply.poster_username}
                  </Text>
                </Box>

                {/* Right side - Posted date, reply-to, and body */}
                <VStack align="stretch" flex={1} gap={2}>
                  {/* Posted at date with edit button */}
                  <HStack justifyContent="space-between" alignItems="center">
                    <Text fontSize="sm" color="gray.600">
                      Last updated {formatDate(reply.updated_at)}
                    </Text>
                    {authState.type === "logged_in" && authState.username === reply.poster_username && (
                      <Button 
                        size="xs" 
                        variant="outline" 
                        colorScheme="blue"
                        onClick={() => setEditingReplyId(reply.id)}
                      >
                        Edit
                      </Button>
                    )}
                  </HStack>

                  {/* Reply-to quotation box (if exists) */}
                  {reply.reply_to && (
                    <Box
                      p={3}
                      bg="gray.100"
                      borderLeft="4px solid"
                      borderLeftColor="gray.400"
                      borderRadius="md"
                      fontStyle="italic"
                    >
                      <Text fontSize="sm" color="gray.700">
                        "{reply.reply_to[1]}"
                      </Text>
                    </Box>
                  )}

                  {/* Reply body */}
                  <Box>
                    {editingReplyId === reply.id ? (
                      <ReplyEditor 
                        replyMode={{ 
                          type: "edit_reply", 
                          boardId: boardId, 
                          threadId: threadId, 
                          replyId: reply.id, 
                          currentText: reply.body 
                        }}
                        onPostSucceeded={() => {
                          setEditingReplyId(null);
                          fetchReplies();
                        }}
                        onAuthenticationError={onAuthenticationError}
                        onCancel={() => setEditingReplyId(null)}
                      />
                    ) : (
                      <Text whiteSpace="pre-wrap">{reply.body}</Text>
                    )}
                  </Box>
                </VStack>
              </HStack>
            </Box>
          ))
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination.Root
            count={totalReplies}
            pageSize={pageSize}
            page={pageNumber + 1}
            onPageChange={(details) => handlePageChange(details.page)}
          >
            <>
              <Pagination.PrevTrigger />
              <Pagination.Items
                render={(page) => (
                  <IconButton variant={{ base: "ghost", _selected: "outline" }}>
                    {page.value}
                  </IconButton>
                )}
              />
              <Pagination.NextTrigger />
            </>
          </Pagination.Root>
        )}
      </VStack>
    </Box>
  );
}