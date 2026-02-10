import { Button, Fieldset, Heading, Stack, Text } from "@chakra-ui/react";
import { API_ROOT } from "./config";

export function LoginForm() {
    const handleGoogleLogin = () => {
        window.location.href = `${API_ROOT}/auth/google`;
    };

    return (
        <Fieldset.Root p={8} borderRadius="lg" maxW="400px" mx="auto">
            <Stack gap={6} alignItems="center">
                <Heading>Login</Heading>

                <Text color="gray.600" textAlign="center">
                    Sign in with your Google account to access BrokenJaw.net
                </Text>

                <Button
                    onClick={handleGoogleLogin}
                    width="full"
                    size="lg"
                    colorScheme="blue"
                >
                    Sign in with Google
                </Button>
            </Stack>
        </Fieldset.Root>
    );
}