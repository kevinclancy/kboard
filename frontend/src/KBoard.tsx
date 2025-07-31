import React, { useState, useEffect } from "react";
import { Box, Button, HStack, Separator, Stack } from "@chakra-ui/react";
import { Link } from "react-router-dom";
import Cookies from 'js-cookie';
import { RegisterForm } from "./RegisterForm";
import { BoardSelector } from "./BoardSelector";
import { DiscussionBoard } from "./DiscussionBoard";
import { ThreadViewer } from "./ThreadViewer";
import { LoginForm } from "./LoginForm";
import { ResetPasswordForm } from "./ResetPasswordForm";
import { NewPasswordForm } from "./NewPasswordForm";

type AuthState =
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
  // Registration form is displayed
  | { type: "register" }
  // Login form is displayed
  | { type: "login" }
  // Reset password form is displayed
  | { type: "reset_password" }
  // New password with key is displayed
  | { type: "new_password" };

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

  const handleLogin = (token: string, username: string) => {
    setAuthState({ type: "logged_in", username });
  };

  const mainContent = (() => {
    switch (uiState.type) {
      case "board":
        return <BoardSelector />;
      case "discussion_board":
        return <DiscussionBoard boardId={uiState.boardId} />;
      case "thread_viewer":
        return <ThreadViewer boardId={uiState.boardId} threadId={uiState.threadId} />;
      case "register":
        return <RegisterForm />;
      case "login":
        return <LoginForm onLogin={handleLogin} />;
      case "reset_password":
        return <ResetPasswordForm />;
      case "new_password":
        const resetKey = window.location.hash.substring(1);
        return <NewPasswordForm resetKey={resetKey} />;
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
          <HStack>
            <Link to="/boards">
              <Button bgColor="brown">
                Discussion Boards
              </Button>
            </Link>
            {authState.type === "logged_out" && (
              <Link to="/login">
                <Button bgColor="brown">
                  Login
                </Button>
              </Link>
            )}
            <Link to="/register">
              <Button bgColor="brown">Register</Button>
            </Link>
            <Link to="/request_reset">
              <Button bgColor="brown">Reset Password</Button>
            </Link>
          </HStack>
        </HStack>
        <Separator borderColor="gray" orientation='horizontal' size = "md" />
        {mainContent}
      </Stack>
    </Box>
  );
}