import { Box, Button, Fieldset, Heading, HStack, Input, Stack } from "@chakra-ui/react";
import React, { useState } from "react";
import { PasswordInput } from "./components/ui/password-input";
import { Field } from "./components/ui/field";
import { API_ROOT } from "./config";

interface LoginFormProps {
    onLogin: (token: string, username: string) => void;
}

export function LoginForm({ onLogin }: LoginFormProps) {
    const [username, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("Welcome! Please enter your login credentials.");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const response = await fetch(`${API_ROOT}/auth/login`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: username,
                    password: password
                })
            });

            if (response.status === 200) {
                const data = await response.json();
                onLogin(data.token, data.name);
                return;
            }

            setMessage("Login failed.");
        } catch (error) {
            setMessage("Network error. Please check your connection.");
        }
    };

    return (
        <form onSubmit={handleSubmit}>
        <Fieldset.Root p={8} borderRadius="lg">
          <>
            <Heading>Login</Heading>

            <HStack>
              <Stack mb={6} mt={6}>

              <Field.Root>
                <Field.Label>Email Address</Field.Label>
                <Input value={username} onChange={(e) => setEmail(e.target.value)} />
              </Field.Root>

              <Field.Root>
                <Field.Label>Password</Field.Label>
                <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} />
              </Field.Root>
              <Button type="submit" width="full" >
                Login
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