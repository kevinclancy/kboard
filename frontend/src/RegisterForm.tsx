import { Box, Button, Fieldset, Heading, HStack, Input, Stack } from "@chakra-ui/react";
import React, { useState } from "react";
import { PasswordInput } from "./components/ui/password-input";
import { Field } from "./components/ui/field";
import { API_ROOT } from "./config";

export function RegisterForm() {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [registerSucceeded, setRegisterSucceeded] = useState(false);
    const [message, setMessage] = useState("Welcome! Please fill out the registration form.");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setMessage("Passwords do not match. Please make sure both password fields are identical.");
            return;
        }

        try {
            const response = await fetch(`${API_ROOT}/auth/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: username,
                    email: email,
                    password: password,
                }),
            });

            if (response.status === 400) {
                const errorData = await response.json();
                if (errorData.description === "There is already an account associated with this email.") {
                    setMessage(`The email ${email} is already registered to a user.`);
                }
            } else if (response.ok) {
                setMessage(`Registration successful! Click the activation link in the email we sent to ${email}!`);
            }
        } catch (error) {
            console.error("Registration failed:", error);
            setMessage("Registration failed due to a website bug. Please try again later.");
        }
    };

    return (
        <form onSubmit={handleSubmit}>
        <Fieldset.Root p={8} borderRadius="lg">
          <>
            <Heading>Register new account</Heading>

            <HStack>
              <Stack mb={6} mt={6}>

              <Field.Root>
                <Field.Label>Username</Field.Label>
                <Input value={username} onChange={(e) => setUsername(e.target.value)} />
              </Field.Root>

              <Field.Root>
                <Field.Label>Email address</Field.Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} />
              </Field.Root>

              <Field.Root>
                <Field.Label>Password</Field.Label>
                <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} />
              </Field.Root>

              <Field.Root>
                <Field.Label>Confirm password</Field.Label>
                <PasswordInput value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              </Field.Root>
              <Button type="submit" width="full" >
                Submit
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