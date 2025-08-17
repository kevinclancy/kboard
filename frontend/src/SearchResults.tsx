import { Box, Text, VStack, Spinner, IconButton, HStack } from "@chakra-ui/react";
import { Pagination } from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { API_ROOT } from "./config";

interface SearchResult {
  reply_id: number;
  reply_body: string;
  thread_id: number;
  thread_title: string;
  board_id: number;
  board_title: string;
  poster_id: number;
  poster_name: string;
}

interface SearchResponse {
  results: SearchResult[];
  total_found: number;
}

interface SearchResultsProps {
  searchQuery: string;
  onSearchError?: (error: string) => void;
}

export function SearchResults({ searchQuery, onSearchError }: SearchResultsProps) {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalFound, setTotalFound] = useState(0);
  const [pageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchSearchResults = async (query: string, page: number) => {
    if (!query.trim()) {
      setResults([]);
      setTotalFound(0);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const offset = (page - 1) * pageSize;
      const url = `${API_ROOT}/search/replies?q=${encodeURIComponent(query)}&limit=${pageSize}&offset=${offset}`;
      
      const response = await fetch(url, {
        method: "GET",
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data: SearchResponse = await response.json();
        setResults(data.results);
        setTotalFound(data.total_found);
      } else {
        const errorMsg = 'Failed to fetch search results';
        setError(errorMsg);
        onSearchError?.(errorMsg);
      }
    } catch (err) {
      console.error("Search error:", err);
      const errorMsg = 'Network error. Please check your connection.';
      setError(errorMsg);
      onSearchError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when search query changes
  }, [searchQuery]);

  useEffect(() => {
    fetchSearchResults(searchQuery, currentPage);
  }, [searchQuery, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const totalPages = Math.ceil(totalFound / pageSize);

  if (loading) {
    return (
      <Box p={4}>
        <HStack>
          <Spinner size="md" />
          <Text>Searching...</Text>
        </HStack>
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

  if (!searchQuery.trim()) {
    return (
      <Box p={4}>
        <Text color="gray.500">Enter a search term to find replies.</Text>
      </Box>
    );
  }

  if (results.length === 0) {
    return (
      <Box p={4}>
        <Text color="gray.500">No results found for "{searchQuery}"</Text>
      </Box>
    );
  }

  return (
    <Box p={4}>
      <Text fontSize="lg" fontWeight="bold" mb={4}>
        {totalFound} result{totalFound !== 1 ? 's' : ''} for "{searchQuery}"
      </Text>
      
      <VStack align="stretch" gap={4} mb={6}>
        {results.map((result) => (
          <Box
            key={result.reply_id}
            p={4}
            borderWidth={1}
            borderRadius="md"
            bg="white"
            boxShadow="sm"
          >
            <VStack align="stretch" gap={2}>
              {/* Board and Thread navigation */}
              <HStack fontSize="sm" color="gray.600">
                <Link to={`/boards/${result.board_id}/threads`}>
                  <Text color="blue.600" _hover={{ color: "blue.800" }}>
                    {result.board_title}
                  </Text>
                </Link>
                <Text>›</Text>
                <Link to={`/boards/${result.board_id}/threads/${result.thread_id}#reply-${result.reply_id}`}>
                  <Text color="blue.600" _hover={{ color: "blue.800" }}>
                    {result.thread_title}
                  </Text>
                </Link>
              </HStack>

              {/* Reply content */}
              <Text fontSize="md" lineHeight="1.5">
                {result.reply_body}
              </Text>

              {/* Author */}
              <Text fontSize="sm" color="gray.500">
                By {result.poster_name}
              </Text>
            </VStack>
          </Box>
        ))}
      </VStack>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination.Root
          count={totalFound}
          pageSize={pageSize}
          page={currentPage}
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
    </Box>
  );
}