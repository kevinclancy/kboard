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
  /// [reply_id, reply_body_text, reply_status] - the ID, text, and status of the reply being responded to
  reply_to: [number, string, number] | null;
  thread_id: number;
  poster: number;
  poster_username: string;
  poster_is_banned: boolean;
  updated_at: string;
  reply_status: number;
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
  const [initialTargetHandled, setInitialTargetHandled] = useState(false);

  const isCurrentUserModerator = Cookies.get("is_moderator") === "true";

  // Reply status constants
  const LIVE = 1;
  const HIDDEN = 2;
  const DELETED = 3;

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

  const handleBanUser = async (userId: number, username: string) => {
    if (!window.confirm(`Are you sure you want to ban user "${username}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`${API_ROOT}/auth/ban`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: userId })
      });

      if (response.ok) {
        // Refresh the replies to show updated ban status
        fetchReplies();
      } else if (response.status === 401 || response.status === 403) {
        onAuthenticationError();
      } else {
        console.error('Failed to ban user');
      }
    } catch (err) {
      console.error('Network error:', err);
    }
  };

  // Function to find which page contains a specific reply
  const findReplyPage = async (replyId: number) => {
    try {
      const url = `${API_ROOT}/boards/${boardId}/threads/${threadId}/replies/find_page?reply_id=${replyId}&page_size=${pageSize}`;
      const response = await fetch(url, {
        method: "GET",
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data.page_number;
      }
    } catch (err) {
      console.error('Error finding reply page:', err);
    }
    return null;
  };

  // Handle initial target reply navigation
  useEffect(() => {
    const handleInitialTarget = async () => {
      if (!window.location.hash || initialTargetHandled) {
        return;
      }

      const targetId = window.location.hash.substring(1);
      if (!targetId.startsWith('reply-')) {
        setInitialTargetHandled(true);
        return;
      }

      const replyId = parseInt(targetId.replace('reply-', ''));
      if (isNaN(replyId)) {
        setInitialTargetHandled(true);
        return;
      }

      const correctPage = await findReplyPage(replyId);
      if (correctPage !== null && correctPage !== pageNumber) {
        setPageNumber(correctPage);
      }
      setInitialTargetHandled(true);
    };

    handleInitialTarget();
  }, [boardId, threadId]);

  // Normal fetch replies
  useEffect(() => {
    fetchReplies();
  }, [boardId, threadId, pageSize, pageNumber]);

  // Reset target handling when route changes
  useEffect(() => {
    setInitialTargetHandled(false);
  }, [boardId, threadId]);

  // Handle scrolling to target reply after page loads
  useEffect(() => {
    if (loading) return;
    if (!window.location.hash) return;

    const targetId = window.location.hash.substring(1);
    const element = document.getElementById(targetId);
    if (!element) return;

    setTimeout(() => {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Manually apply highlight styles since React Router navigation doesn't trigger :target
      element.style.backgroundColor = '#fef3c7'; // yellow.100
      element.style.borderColor = '#facc15'; // yellow.400
      element.style.borderWidth = '2px';
      element.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'; // md shadow
    }, 100);
  }, [loading, replies]);

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

  const handleReplyAction = async (replyId: number, action: 'delete' | 'hide') => {
    try {
      const response = await fetch(`${API_ROOT}/boards/${boardId}/threads/${threadId}/replies/${replyId}`, {
        method: "DELETE",
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        fetchReplies(); // Refresh the replies list
      } else if (response.status === 401 || response.status === 403) {
        onAuthenticationError();
        setError(`Authentication error. Please log in to ${action} replies.`);
      } else {
        setError(`Failed to ${action} reply`);
      }
    } catch (err) {
      console.error(`${action} error:`, err);
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

      <VStack align="stretch" gap={4} mt={totalPages > 1 ? 4 : 0}>
        {!Array.isArray(replies) || replies.length === 0 ? (
          <Text color="gray.500">No replies found</Text>
        ) : (
          replies
            .filter(reply => reply.reply_status !== HIDDEN) // Don't display hidden replies at all
            .map((reply) => (
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
                  <VStack align="start" gap={1}>
                    <HStack align="center" gap={2}>
                      <Text fontWeight="bold" color="blue.700">
                        {reply.poster_username}
                      </Text>
                      {isCurrentUserModerator && (
                        <Button 
                          size="xs" 
                          colorScheme="red" 
                          variant="outline"
                          onClick={() => handleBanUser(reply.poster, reply.poster_username)}
                        >
                          Ban
                        </Button>
                      )}
                    </HStack>
                    {reply.poster_is_banned && (
                      <Text fontSize="xs" color="red.600" fontWeight="semibold">
                        banned
                      </Text>
                    )}
                  </VStack>
                </Box>

                {/* Right side - Posted date, reply-to, and body */}
                <VStack align="stretch" flex={1} gap={2}>
                  {/* Posted at date with edit and reply buttons */}
                  <HStack justifyContent="space-between" alignItems="center">
                    <Text fontSize="sm" color="gray.600">
                      Last updated {formatDate(reply.updated_at)}
                    </Text>
                    <HStack gap={2}>
                      {authState.type === "logged_in" && reply.reply_status === LIVE && (
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
                      {authState.type === "logged_in" && authState.username === reply.poster_username && reply.reply_status === LIVE && (
                        <Button
                          size="xs"
                          variant="outline"
                          colorScheme="blue"
                          onClick={() => setReplyEditorState({ type: "editing_reply", replyId: reply.id })}
                        >
                          Edit
                        </Button>
                      )}
                      {authState.type === "logged_in" && (authState.username === reply.poster_username || isCurrentUserModerator) && reply.reply_status === LIVE && (
                        <Button
                          size="xs"
                          variant="outline"
                          colorScheme="red"
                          onClick={() => {
                            if (window.confirm("Are you sure you want to delete this reply?")) {
                              handleReplyAction(reply.id, 'delete');
                            }
                          }}
                        >
                          Delete
                        </Button>
                      )}
                      {authState.type === "logged_in" && isCurrentUserModerator && reply.reply_status === LIVE && (
                        <Button
                          size="xs"
                          variant="outline"
                          colorScheme="orange"
                          onClick={() => {
                            if (window.confirm("Are you sure you want to hide this reply? Hidden replies are completely invisible to users.")) {
                              handleReplyAction(reply.id, 'hide');
                            }
                          }}
                        >
                          Hide
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
                        {reply.reply_to[2] === HIDDEN ? (
                          <Text as="span" color="gray.500">
                            In Response To:
                          </Text>
                        ) : (
                          <a
                            href={`#reply-${reply.reply_to[0]}`}
                            style={{ color: "#2563eb", textDecoration: "underline" }}
                            onMouseEnter={(e) => (e.target as HTMLAnchorElement).style.color = "#1d4ed8"}
                            onMouseLeave={(e) => (e.target as HTMLAnchorElement).style.color = "#2563eb"}
                          >
                            In Response To:
                          </a>
                        )}
                      </Text>
                      <Text fontSize="sm" color="gray.700">
                        {reply.reply_to[2] === HIDDEN ? (
                          "[Hidden reply]"
                        ) : reply.reply_to[2] === DELETED ? (
                          "[Deleted reply]"
                        ) : (
                          `"${reply.reply_to[1]}"`
                        )}
                      </Text>
                    </Box>
                  )}

                  {/* Reply body */}
                  <Box>
                    {replyEditorState.type === "editing_reply" && replyEditorState.replyId === reply.id && reply.reply_status === LIVE ? (
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
                      <Text whiteSpace="pre-wrap" color={reply.reply_status === DELETED ? "gray.500" : "inherit"} fontStyle={reply.reply_status === DELETED ? "italic" : "normal"}>
                        {reply.reply_status === DELETED ? "This reply has been deleted" : reply.body}
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