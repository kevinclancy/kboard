import { Box, Button, Fieldset, Heading, HStack, Stack } from "@chakra-ui/react";
import React, { useState } from "react";
import { Field } from "./components/ui/field";
import { PasswordInput } from "./components/ui/password-input";

interface NewPasswordFormProps {
  resetKey: string;
}

export function NewPasswordForm({ resetKey }: NewPasswordFormProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("Enter your new password and confirm it to complete the password reset process.");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setMessage("Passwords do not match. Please try again.");
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:5150/api/auth/reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: resetKey,
          password: password,
        }),
      });

      if (response.status === 200) {
        setMessage("Password was successfully changed.");
      } else {
        setMessage("The website encountered an error. Please try again later.");
      }
    } catch (error) {
      setMessage("The website encountered an error. Please try again later.");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Fieldset.Root p={8} borderRadius="lg">
        <Heading>Set New Password</Heading>
        
        <HStack>
          <Stack mb={6} mt={6}>
            <Field.Root>
              <Field.Label>New Password</Field.Label>
              <PasswordInput 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
              />
            </Field.Root>

            <Field.Root>
              <Field.Label>Confirm Password</Field.Label>
              <PasswordInput 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
              />
            </Field.Root>

            <Button type="submit" width="full">
              Submit
            </Button>
          </Stack>

          <Box ml={10} alignSelf="stretch" bg="gray.100" display="flex" alignItems="flex-start" p={2} flex="1">
            {message}
          </Box>
        </HStack>
      </Fieldset.Root>
    </form>
  );
}