import React, { useState } from "react";
import { Box, Button, HStack, Separator, Stack } from "@chakra-ui/react";
import { Link } from "react-router-dom";
import { RegisterForm } from "./RegisterForm";
import { BoardViewer } from "./BoardViewer";
import { DiscussionBoard } from "./DiscussionBoard";
import { LoginForm } from "./LoginForm";
import { ResetPasswordForm } from "./ResetPasswordForm";
import { NewPasswordForm } from "./NewPasswordForm";

type AuthState =
  // User is not authenticated
  | { type: "logged_out" }
  // User is authenticated with token and username
  | { type: "logged_in"; token: string; username: string };

export type UIState =
  // Main board interface is displayed
  | { type: "board" }
  // Specific discussion board is displayed
  | { type: "discussion_board"; boardId: number }
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
  const [authState, setAuthState] = useState<AuthState>({ type: "logged_out" });

  const handleLogin = (token: string, username: string) => {
    setAuthState({ type: "logged_in", token, username });
  };

  const mainContent = (() => {
    switch (uiState.type) {
      case "board":
        return <BoardViewer />;
      case "discussion_board":
        return <DiscussionBoard boardId={uiState.boardId} />;
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