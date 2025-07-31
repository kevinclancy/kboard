import { Box, Text, VStack, Spinner, HStack, IconButton } from "@chakra-ui/react";
import { Pagination } from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { API_ROOT } from "./config";

interface Reply {
  id: number;
  body: string;
  reply_to: [number, string] | null;
  thread_id: number;
  poster: number;
  poster_username: string;
  created_at: string;
}

interface ThreadViewerProps {
  boardId: number;
  threadId: number;
}

export function ThreadViewer({ boardId, threadId }: ThreadViewerProps) {
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState(25);
  const [pageNumber, setPageNumber] = useState(0);
  const [totalReplies, setTotalReplies] = useState(0);
  const [threadTitle, setThreadTitle] = useState<string>("");

  useEffect(() => {
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

    fetchReplies();
  }, [boardId, threadId, pageSize, pageNumber]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
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
      {threadTitle && (
        <Text fontSize="2xl" fontWeight="bold" mb={4} textAlign="left">
          {threadTitle}
        </Text>
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
                  {/* Posted at date */}
                  <Text fontSize="sm" color="gray.600">
                    Posted at {formatDate(reply.created_at)}
                  </Text>

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
                    <Text>{reply.body}</Text>
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