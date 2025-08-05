import { Box, Text, Spinner, VStack } from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { API_ROOT } from "./config";
import Cookies from "js-cookie";

interface VerifyEmailProps {
  verifyToken: string;
  login: (token: string, username: string) => void;
}

type VerificationState =
  | { type: "loading" }
  | { type: "success" }
  | { type: "error"; message: string };

export function VerifyEmail({ verifyToken, login }: VerifyEmailProps) {
  const [verificationState, setVerificationState] = useState<VerificationState>({ type: "loading" });

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const response = await fetch(`${API_ROOT}/auth/verify/${verifyToken}`, {
          method: "GET",
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          setVerificationState({ type: "success" });
          // Wait a moment for cookies to be set, then check if the user was automatically logged in
          setTimeout(() => {
            const username = Cookies.get('username');
            const jwt = Cookies.get('jwt');
            
            if (username && jwt) {
              login(jwt, username);
            }
          }, 100);
        } else {
          setVerificationState({ 
            type: "error", 
            message: "Error occurred during verification. Please try again or contact support." 
          });
        }
      } catch (err) {
        console.error("Verification error:", err);
        setVerificationState({ 
          type: "error", 
          message: "Error occurred during verification. Please try again or contact support." 
        });
      }
    };

    verifyEmail();
  }, [verifyToken, login]);

  if (verificationState.type === "loading") {
    return (
      <Box p={8} textAlign="center">
        <VStack gap={4}>
          <Spinner size="lg" />
          <Text>Verifying your email...</Text>
        </VStack>
      </Box>
    );
  }

  if (verificationState.type === "success") {
    return (
      <Box p={8} textAlign="center">
        <VStack gap={4}>
          <Text fontSize="2xl" fontWeight="bold" color="green.600">
            Registration Complete!
          </Text>
          <Text color="gray.600">
            Your email has been successfully verified. You can now access all features of KBoard.
          </Text>
        </VStack>
      </Box>
    );
  }

  return (
    <Box p={8} textAlign="center">
      <VStack gap={4}>
        <Text fontSize="2xl" fontWeight="bold" color="red.600">
          Verification Failed
        </Text>
        <Text color="gray.600">
          {verificationState.message}
        </Text>
      </VStack>
    </Box>
  );
}