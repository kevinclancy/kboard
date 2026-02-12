import React from "react";
import ReactDOM from "react-dom/client";
import { ChakraProvider } from "@chakra-ui/react";
import { BrowserRouter, Routes, Route, useParams } from "react-router-dom";
import { KBoard, UIState } from "./KBoard";
import { SearchResults } from "./SearchResults";
import system from "./theme";

function DiscussionBoardPage() {
  const { boardId } = useParams<{ boardId: string }>();
  const boardIdNum = Number(boardId) || 0;

  const uiState: UIState = {
    type: "discussion_board",
    boardId: boardIdNum
  };

  return <KBoard uiState={uiState} />;
}

function ThreadViewerPage() {
  const { boardId, threadId } = useParams<{ boardId: string; threadId: string }>();
  const boardIdNum = Number(boardId) || 0;
  const threadIdNum = Number(threadId) || 0;

  const uiState: UIState = {
    type: "thread_viewer",
    boardId: boardIdNum,
    threadId: threadIdNum
  };

  return <KBoard uiState={uiState} />;
}

function SearchPage() {
  const { query } = useParams<{ query: string }>();
  const searchQuery = query ? decodeURIComponent(query) : "";

  const uiState: UIState = {
    type: "search",
    searchQuery: searchQuery
  };

  return <KBoard uiState={uiState} />;
}

const root = document.getElementById("root");

if (!root) {
  throw new Error("No root element found");
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <BrowserRouter>
      <ChakraProvider value={system}>
        <Routes>
          <Route path="/boards" element={<KBoard uiState={{ type: "board" }} />} />
          <Route path="/boards/:boardId/threads" element={<DiscussionBoardPage />} />
          <Route path="/boards/:boardId/threads/:threadId" element={<ThreadViewerPage />} />
          <Route path="/about" element={<KBoard uiState={{ type: "about_me" }} />} />
          <Route path="/search/:query" element={<SearchPage />} />
          <Route path="/profile" element={<KBoard uiState={{ type: "profile" }} />} />
          <Route path="*" element={<KBoard uiState={{ type: "board" }} />} />
        </Routes>
      </ChakraProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
