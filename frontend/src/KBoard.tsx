import React, { useState } from "react";
import { Box, Button, HStack, Separator, Stack } from "@chakra-ui/react";
import { RegisterForm } from "./RegisterForm";
import { BoardViewer } from "./BoardViewer";
import { LoginForm } from "./LoginForm";
import { ResetPasswordForm } from "./ResetPasswordForm";
import { NewPasswordForm } from "./NewPasswordForm";

type AuthState =
  // User is not authenticated
  | { type: "logged_out" }
  // User is authenticated with token and username
  | { type: "logged_in"; token: string; username: string };

type UIState =
  // Main board interface is displayed
  | { type: "board" }
  // Registration form is displayed
  | { type: "register" }
  // Login form is displayed
  | { type: "login" }
  // Reset password form is displayed
  | { type: "reset_password" }
  // New password with key is displayed
  | { type: "new_password"; resetKey: string };

interface KBoardProps {
  initialUIState?: UIState;
}

export function KBoard({ initialUIState }: KBoardProps) {
  const [authState, setAuthState] = useState<AuthState>({ type: "logged_out" });
  const [uiState, setUIState] = useState<UIState>(initialUIState || { type: "board" });

  const handleLogin = (token: string, username: string) => {
    setAuthState({ type: "logged_in", token, username });
    setUIState({ type: "board" });
  };

  const mainContent = (() => {
    switch (uiState.type) {
      case "board":
        return <BoardViewer />;
      case "register":
        return <RegisterForm />;
      case "login":
        return <LoginForm onLogin={handleLogin} />;
      case "reset_password":
        return <ResetPasswordForm />;
      case "new_password":
        return <NewPasswordForm resetKey={uiState.resetKey} />;
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
            {authState.type === "logged_out" && (
              <Button bgColor="brown" onClick={() => setUIState({ type: "login" })}>
                Login
              </Button>
            )}
            <Button bgColor="brown" onClick={() => setUIState({ type: "register" })}>Register</Button>
            <Button bgColor="brown" onClick={() => setUIState({ type: "reset_password" })}>Reset Password</Button>
          </HStack>
        </HStack>
        <Separator borderColor="gray" orientation='horizontal' size = "md" />
        {mainContent}
      </Stack>
    </Box>
  );
}