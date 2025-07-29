import { Box, Text, VStack, Spinner } from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { API_ROOT } from "./config";

interface Board {
  id: number;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export function BoardSelector() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBoards = async () => {
      try {
        const response = await fetch(`${API_ROOT}/boards`, {
          method: "GET",
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          },
        });

        if (response.ok) {
          const data = await response.json();
          setBoards(data);
        } else {
          setError('Failed to fetch boards');
        }
      } catch (err) {
        console.log(err);
        setError('Network error. Please check your connection.');
      } finally {
        setLoading(false);
      }
    };

    fetchBoards();
  }, []);

  if (loading) {
    return (
      <Box p={4}>
        <Spinner size="lg" />
        <Text ml={2}>Loading boards...</Text>
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
      <Text fontSize="2xl" fontWeight="bold" mb={4}>
        Discussion Boards
      </Text>
      <VStack align="stretch" gap={2}>
        {boards.length === 0 ? (
          <Text color="gray.500">No boards found</Text>
        ) : (
          boards.map((board) => (
            <Link
              key={board.id}
              to={`/boards/${board.id}/threads`}
            >
              <Box
                p={3}
                borderWidth={1}
                borderRadius="md"
                bg="gray.50"
                _hover={{ bg: "gray.100" }}
                cursor="pointer"
              >
                <Text fontWeight="semibold" color="blue.600" _hover={{ color: "blue.800" }}>
                  {board.title}
                </Text>
              </Box>
            </Link>
          ))
        )}
      </VStack>
    </Box>
  );
}