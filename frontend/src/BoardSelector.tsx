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
      <Box mb={6} p={4} bg="blue.50" borderRadius="md" borderLeft="4px solid" borderLeftColor="blue.400">
        <Text fontSize="md" color="gray.700" lineHeight="1.6">
Welcome to BrokenJaw.com, a community space for anyone who's experienced a broken jaw and the long journey that follows.
Whether your injury came from an accident, surgery, or something less expected, this board is here to support open discussion
about the entire experience—from the moment of trauma to the complexities of treatment, recovery, and lasting effects like facial
asymmetry, bite issues, and emotional impact. Share your story, ask questions, and connect with others who understand what you're
going through. You're not alone—this space exists so we can heal, vent, and learn together.
        </Text>
      </Box>
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
                <Text fontWeight="semibold" color="blue.600" _hover={{ color: "blue.800" }} mb={1}>
                  {board.title}
                </Text>
                {board.description && (
                  <Text fontSize="sm" color="gray.600">
                    {board.description}
                  </Text>
                )}
              </Box>
            </Link>
          ))
        )}
      </VStack>
    </Box>
  );
}