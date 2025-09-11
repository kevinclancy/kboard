import { Box, Button, Fieldset, Heading, HStack, Input, Stack, Text } from "@chakra-ui/react";
import React, { useState } from "react";
import { PasswordInput } from "./components/ui/password-input";
import { Field } from "./components/ui/field";
import { API_ROOT } from "./config";
import { validateName, validatePassword, getNameValidationMessage } from "./validation";

export function RegisterForm() {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [registerSucceeded, setRegisterSucceeded] = useState(false);
    const [message, setMessage] = useState("Welcome! Please fill out the registration form. We recommend against reusing an existing password.");


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const nameValidation = validateName(username);
        if (nameValidation.type === "invalid") {
            setMessage(nameValidation.errors.join(", "));
            return;
        }

        const passwordValidation = validatePassword(password);
        if (passwordValidation.type === "invalid") {
            setMessage(`Password requirements: ${passwordValidation.errors.join(", ")}.`);
            return;
        }

        if (password !== confirmPassword) {
            setMessage("Passwords do not match. Please make sure both password fields are identical.");
            return;
        }

        try {
            const response = await fetch(`${API_ROOT}/auth/register`, {
                method: "POST",
                credentials: 'include',
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
                <Input 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                  maxLength={38}
                />
                <Text fontSize="sm" color="gray.600" mt={1}>
                  {getNameValidationMessage(username)}
                </Text>
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
                <Box>
                  {message}
                  
                  {password.length > 0 && (
                    <Box mt={4}>
                      <Text fontWeight="bold" mb={2}>Password Requirements:</Text>
                      {validatePassword(password).length === 0 ? (
                        <Text color="green.600">✓ All requirements met</Text>
                      ) : (
                        <Box>
                          <Text color="gray.600" mb={1}>Must contain:</Text>
                          <Text color={password.length >= 8 ? "green.600" : "orange.600"}>
                            • At least 8 characters {password.length >= 8 ? "✓" : ""}
                          </Text>
                          <Text color={/[a-zA-Z]/.test(password) ? "green.600" : "orange.600"}>
                            • At least one letter {/[a-zA-Z]/.test(password) ? "✓" : ""}
                          </Text>
                          <Text color={/\d/.test(password) ? "green.600" : "orange.600"}>
                            • At least one digit {/\d/.test(password) ? "✓" : ""}
                          </Text>
                          <Text color={/[^\w\s]/.test(password) ? "green.600" : "orange.600"}>
                            • At least one punctuation mark {/[^\w\s]/.test(password) ? "✓" : ""}
                          </Text>
                        </Box>
                      )}
                    </Box>
                  )}
                </Box>
              </Box>
            </HStack>
          </>
        </Fieldset.Root>
        </form>
    );
}