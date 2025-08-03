import { Box, Text, VStack, Spinner, HStack, IconButton, Breadcrumb, Button } from "@chakra-ui/react";
import { Pagination } from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ReplyEditor } from "./ReplyEditor";
import { API_ROOT } from "./config";
import { AuthState } from "./KBoard";
import Cookies from "js-cookie";

interface Reply {
  id: number;
  body: string;
  /// Tuple containing [reply_id, reply_body_text] - the ID and text of the reply being responded to
  reply_to: [number, string] | null;
  thread_id: number;
  poster: number;
  poster_username: string;
  updated_at: string;
  is_deleted: boolean;
}

type ReplyEditorState =
  | { type: "closed" }
  | { type: "new_reply"; replyToId?: number }
  | { type: "editing_reply"; replyId: number };

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
  const [replyEditorState, setReplyEditorState] = useState<ReplyEditorState>({ type: "closed" });

  const isCurrentUserModerator = Cookies.get("is_moderator") === "true";

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

  const handleDeleteReply = async (replyId: number) => {
    try {
      const response = await fetch(`${API_ROOT}/boards/${boardId}/threads/${threadId}/replies/${replyId}`, {
        method: "DELETE",
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        fetchReplies(); // Refresh the replies list
      } else if (response.status === 401 || response.status === 403) {
        onAuthenticationError();
        setError("Authentication error. Please log in to delete replies.");
      } else {
        setError("Failed to delete reply");
      }
    } catch (err) {
      console.error("Delete error:", err);
      setError("Network error. Please check your connection.");
    }
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
              setReplyEditorState(
                replyEditorState.type === "new_reply" 
                  ? { type: "closed" }
                  : { type: "new_reply" }
              );
              setError(null);
            }
          }}
          colorScheme="blue"
          size="md"
          mb={4}
        >
          {replyEditorState.type === "new_reply" ? "Cancel Reply" : "New Reply"}
        </Button>
      )}

      {/* Reply Editor */}
      {replyEditorState.type === "new_reply" && (
        <Box mb={6}>
          <ReplyEditor 
            replyMode={{ 
              type: "existing_thread", 
              boardId: boardId, 
              threadId: threadId,
              replyTo: replyEditorState.replyToId
            }}
            onPostSucceeded={() => {
              setReplyEditorState({ type: "closed" });
              fetchReplies();
            }}
            onAuthenticationError={onAuthenticationError}
            onCancel={() => setReplyEditorState({ type: "closed" })}
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
              id={`reply-${reply.id}`}
              p={4}
              borderWidth={1}
              borderRadius="md"
              bg="white"
              boxShadow="sm"
              _target={{
                bg: "yellow.100",
                borderColor: "yellow.400",
                borderWidth: 2,
                boxShadow: "md"
              }}
              transition="all 0.3s ease"
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
                  {/* Posted at date with edit and reply buttons */}
                  <HStack justifyContent="space-between" alignItems="center">
                    <Text fontSize="sm" color="gray.600">
                      Last updated {formatDate(reply.updated_at)}
                    </Text>
                    <HStack gap={2}>
                      {authState.type === "logged_in" && !reply.is_deleted && (
                        <Button 
                          size="xs" 
                          variant="outline" 
                          colorScheme="green"
                          onClick={() => {
                            if (replyEditorState.type === "new_reply" && replyEditorState.replyToId === reply.id) {
                              setReplyEditorState({ type: "closed" });
                            } else {
                              setReplyEditorState({ type: "new_reply", replyToId: reply.id });
                            }
                          }}
                        >
                          Reply
                        </Button>
                      )}
                      {authState.type === "logged_in" && authState.username === reply.poster_username && !reply.is_deleted && (
                        <Button 
                          size="xs" 
                          variant="outline" 
                          colorScheme="blue"
                          onClick={() => setReplyEditorState({ type: "editing_reply", replyId: reply.id })}
                        >
                          Edit
                        </Button>
                      )}
                      {authState.type === "logged_in" && (authState.username === reply.poster_username || isCurrentUserModerator) && !reply.is_deleted && (
                        <Button 
                          size="xs" 
                          variant="outline" 
                          colorScheme="red"
                          onClick={() => {
                            if (window.confirm("Are you sure you want to delete this reply?")) {
                              handleDeleteReply(reply.id);
                            }
                          }}
                        >
                          Delete
                        </Button>
                      )}
                    </HStack>
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
                      <Text fontSize="sm" mb={2}>
                        <a 
                          href={`#reply-${reply.reply_to[0]}`}
                          style={{ color: "#2563eb", textDecoration: "underline" }}
                          onMouseEnter={(e) => (e.target as HTMLAnchorElement).style.color = "#1d4ed8"}
                          onMouseLeave={(e) => (e.target as HTMLAnchorElement).style.color = "#2563eb"}
                        >
                          Reply #{reply.reply_to[0]}
                        </a>
                      </Text>
                      <Text fontSize="sm" color="gray.700">
                        "{reply.reply_to[1]}"
                      </Text>
                    </Box>
                  )}

                  {/* Reply body */}
                  <Box>
                    {replyEditorState.type === "editing_reply" && replyEditorState.replyId === reply.id && !reply.is_deleted ? (
                      <ReplyEditor 
                        replyMode={{ 
                          type: "edit_reply", 
                          boardId: boardId, 
                          threadId: threadId, 
                          replyId: reply.id, 
                          currentText: reply.body 
                        }}
                        onPostSucceeded={() => {
                          setReplyEditorState({ type: "closed" });
                          fetchReplies();
                        }}
                        onAuthenticationError={onAuthenticationError}
                        onCancel={() => setReplyEditorState({ type: "closed" })}
                      />
                    ) : (
                      <Text whiteSpace="pre-wrap" color={reply.is_deleted ? "gray.500" : "inherit"} fontStyle={reply.is_deleted ? "italic" : "normal"}>
                        {reply.is_deleted ? "This reply has been deleted" : reply.body}
                      </Text>
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