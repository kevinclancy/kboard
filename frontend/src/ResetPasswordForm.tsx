import { Box, Button, Fieldset, Heading, HStack, Input, Stack } from "@chakra-ui/react";
import React, { useState } from "react";
import { Field } from "./components/ui/field";
import { API_ROOT } from "./config";

export function ResetPasswordForm() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("Enter your email address to reset your password.");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const response = await fetch(`${API_ROOT}/auth/forgot`, {
                method: "POST",
                credentials: 'include',
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: email,
                }),
            });

            if (response.ok) {
                setMessage(`Password reset instructions sent to ${email}!`);
            } else {
                setMessage("Failed to send reset instructions. Are you sure you typed the correct address?");
            }
        } catch (error) {
            console.error("Password reset failed:", error);
            setMessage("Password reset failed due to a network error. Please try again later.");
        }
    };

    return (
        <form onSubmit={handleSubmit}>
        <Fieldset.Root p={8} borderRadius="lg">
          <>
            <Heading>Reset Password</Heading>

            <HStack>
              <Stack mb={6} mt={6}>

              <Field.Root>
                <Field.Label>Email address</Field.Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} />
              </Field.Root>

              <Button type="submit" width="full" >
                Reset Password
              </Button>
              </Stack>

              <Box ml={10} alignSelf="stretch" bg="gray.100" display="flex" alignItems="flex-start" p={2} flex="1">
                {message}
              </Box>
            </HStack>
          </>
        </Fieldset.Root>
        </form>
    );
}