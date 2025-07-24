import { Box, Text, VStack, Spinner } from "@chakra-ui/react";
import { useState, useEffect } from "react";

interface Board {
  id: number;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export function BoardViewer() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBoards = async () => {
      try {
        const response = await fetch('http://127.0.0.1:5150/api/boards', {
          method: "GET",
          headers: {
            'Content-Type': 'application/json',
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
            <Box
              key={board.id}
              p={3}
              borderWidth={1}
              borderRadius="md"
              bg="gray.50"
            >
              <Text fontWeight="semibold">{board.title}</Text>
            </Box>
          ))
        )}
      </VStack>
    </Box>
  );
}