import { Box, Text, VStack, Spinner, Grid, GridItem, IconButton, Button } from "@chakra-ui/react";
import { Pagination } from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ReplyEditor } from "./ReplyEditor";
import { API_ROOT } from "./config";
import { AuthState } from "./KBoard";

/**
 * DiscussionBoard component represents many threads discussing a specific named topic.
 * It displays a paginated list of threads for a given board with navigation controls.
 */

interface Thread {
  id: number;
  title: string;
  description: string;
  board_id: number;
  poster: number;
  poster_username: string;
  last_active: string;
  num_replies: number;
  created_at: string;
  updated_at: string;
}

interface Board {
  id: number;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
}

interface DiscussionBoardProps {
  boardId: number;
  authState: AuthState;
  onAuthenticationError: () => void;
}

export function DiscussionBoard({ boardId, authState, onAuthenticationError }: DiscussionBoardProps) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState(25);
  const [pageNumber, setPageNumber] = useState(0);
  const [totalThreads, setTotalThreads] = useState(0);
  const [showNewThreadEditor, setShowNewThreadEditor] = useState(false);

  const fetchThreads = async () => {
    try {
      setLoading(true);
      const url = `${API_ROOT}/boards/${boardId}/threads?page_size=${pageSize}&page_number=${pageNumber}`;
      const response = await fetch(url, {
        method: "GET",
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setThreads(data.threads || []);
        setTotalThreads(data.total_count || 0);
      } else {
        setError('Failed to fetch threads');
      }
    } catch (err) {
      console.log(err);
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThreads();
  }, [boardId, pageSize, pageNumber]);

  useEffect(() => {
    const fetchBoard = async () => {
      try {
        const response = await fetch(`${API_ROOT}/boards`, {
          method: "GET",
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const boards = await response.json();
        const foundBoard = boards.find((b: Board) => b.id === boardId);
        if (foundBoard) {
          setBoard(foundBoard);
        }
      } catch (err) {
        console.error('Error fetching board:', err);
      }
    };

    fetchBoard();
  }, [boardId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handlePageChange = (page: number) => {
    setPageNumber(page - 1); // Chakra UI uses 1-based indexing, our API uses 0-based
  };

  const totalPages = Math.ceil(totalThreads / pageSize);

  if (loading) {
    return (
      <Box p={4}>
        <Spinner size="lg" />
        <Text ml={2}>Loading threads...</Text>
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
      {board && (
        <Box mb={4}>
          <Text fontSize="2xl" fontWeight="bold" mb={2} textAlign="left">
            {board.title}
          </Text>
          {board.description && (
            <Box mb={4} p={3} bg="gray.50" borderRadius="md" borderLeft="4px solid" borderLeftColor="blue.400">
              <Text fontSize="md" color="gray.700" lineHeight="1.5">
                {board.description}
              </Text>
            </Box>
          )}
          <Button
            onClick={() => {
              if (authState.type === "logged_out") {
                setError("You must be logged in to create a thread. Please log in or register first.");
              } else {
                setShowNewThreadEditor(!showNewThreadEditor);
                setError(null);
              }
            }}
            colorScheme="blue"
            size="md"
          >
            {showNewThreadEditor ? "Cancel" : "New Thread"}
          </Button>
        </Box>
      )}

      {/* New Thread Editor */}
      {showNewThreadEditor && (
        <Box mb={6}>
          <ReplyEditor 
            replyMode={{ type: "new_thread", boardId: boardId }}
            onPostSucceeded={() => {
              setShowNewThreadEditor(false);
              fetchThreads();
            }}
            onAuthenticationError={onAuthenticationError}
            onCancel={() => setShowNewThreadEditor(false)}
          />
        </Box>
      )}

      <VStack align="stretch" gap={2}>
        {!Array.isArray(threads) || threads.length === 0 ? (
          <Text color="gray.500">{!Array.isArray(threads) ? 'Loading threads...' : 'No threads found'}</Text>
        ) : (
          <>
            {/* Header row */}
            <Grid templateColumns="2fr 1fr 1fr" gap={4} p={3} bg="gray.100" borderRadius="md">
              <GridItem>
                <Text fontWeight="bold">Title</Text>
              </GridItem>
              <GridItem>
                <Text fontWeight="bold">Last Active</Text>
              </GridItem>
              <GridItem>
                <Text fontWeight="bold">Poster</Text>
              </GridItem>
            </Grid>

            {/* Thread rows */}
            {Array.isArray(threads) && threads.map((thread) => (
              <Grid
                key={thread.id}
                templateColumns="2fr 1fr 1fr"
                gap={4}
                p={3}
                borderWidth={1}
                borderRadius="md"
                bg="gray.50"
                _hover={{ bg: "gray.100" }}
              >
                <GridItem>
                  <Link to={`/boards/${boardId}/threads/${thread.id}`}>
                    <Text fontWeight="semibold" color="blue.600" _hover={{ color: "blue.800" }}>
                      {thread.title}
                    </Text>
                  </Link>
                </GridItem>
                <GridItem>
                  <Text color="gray.600">{formatDate(thread.last_active)}</Text>
                </GridItem>
                <GridItem>
                  <Text color="gray.600">{thread.poster_username}</Text>
                </GridItem>
              </Grid>
            ))}
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination.Root
            count={totalThreads}
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