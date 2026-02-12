import { useState } from "react";
import { Box, Button, HStack, Separator, Stack, Text } from "@chakra-ui/react";
import { Link } from "react-router-dom";
import Cookies from 'js-cookie';
import { API_ROOT } from "./config";
import { BoardSelector } from "./BoardSelector";
import { DiscussionBoard } from "./DiscussionBoard";
import { ThreadViewer } from "./ThreadViewer";
import { AboutMe } from "./AboutMe";
import { SearchResults } from "./SearchResults";
import { Profile } from "./Profile";

export type AuthState =
  // User is not authenticated
  | { type: "logged_out" }
  // User is authenticated with token and username
  | { type: "logged_in"; username: string };

export type UIState =
  // Main board interface is displayed
  | { type: "board" }
  // Specific discussion board is displayed
  | { type: "discussion_board"; boardId: number }
  // Specific thread viewer is displayed
  | { type: "thread_viewer"; boardId: number; threadId: number }
  // About Me page is displayed
  | { type: "about_me" }
  // Search results page is displayed
  | { type: "search"; searchQuery: string }
  // User profile form is displayed
  | { type: "profile" };

interface KBoardProps {
  uiState: UIState;
}

export function KBoard({ uiState }: KBoardProps) {
  const usernameCookie = Cookies.get('username');
  const [authState, setAuthState] = useState<AuthState>(
    usernameCookie
      ? { type: "logged_in", username: usernameCookie}
      : { type: "logged_out" }
  );

  const handleUsernameUpdate = (newUsername: string) => {
    setAuthState({ type: "logged_in", username: newUsername });
  };

  const logout = () => {
    Cookies.remove('username');
    Cookies.remove('jwt');
    setAuthState({ type: "logged_out" });
  };

  const mainContent = (() => {
    switch (uiState.type) {
      case "board":
        return <BoardSelector />;
      case "discussion_board":
        return <DiscussionBoard boardId={uiState.boardId} authState={authState} onAuthenticationError={logout} />;
      case "thread_viewer":
        return <ThreadViewer boardId={uiState.boardId} threadId={uiState.threadId} authState={authState} onAuthenticationError={logout} />;
      case "about_me":
        return <AboutMe />;
      case "search":
        return <SearchResults searchQuery={uiState.searchQuery} />;
      case "profile":
        return <Profile authState={authState} onAuthenticationError={logout} onUsernameUpdate={handleUsernameUpdate} />;
    }
  })();

  return (
    <Box m={8}>
      <Stack>
        <HStack m={1} justifyContent="space-between">
          {authState.type === "logged_in" ? (
            <Box>Welcome, {authState.username}!</Box>
          ) : (
            <Box />
          )}
          <Text fontSize="3xl" fontWeight="bold" color="brown">
            BrokenJaw.net
          </Text>
          <HStack>
            <Link to="/boards">
              <Button bgColor="brown">
                Discussion Boards
              </Button>
            </Link>
            {authState.type === "logged_out" ? (
              <a href={`${API_ROOT}/auth/google`}>
                <Button bgColor="brown">
                  Login with Google
                </Button>
              </a>
            ) : (
              <>
                <Link to="/profile">
                  <Button bgColor="brown">
                    Profile
                  </Button>
                </Link>
                <Button bgColor="brown" onClick={logout}>
                  Logout
                </Button>
              </>
            )}
            <Link to="/about">
              <Button bgColor="blue.700">
                About Me
              </Button>
            </Link>
          </HStack>
        </HStack>
        <Separator borderColor="gray" orientation='horizontal' size = "md" />
        {mainContent}
      </Stack>
    </Box>
  );
}