import React, { useState, useEffect } from "react";
import { Box, Button, Fieldset, Heading, HStack, Input, Stack, Text } from "@chakra-ui/react";
import { Field } from "./components/ui/field";
import { API_ROOT } from "./config";
import { AuthState } from "./KBoard";
import { validateName, getNameValidationMessage } from "./validation";
import Cookies from 'js-cookie';

interface ProfileProps {
  authState: AuthState;
  onAuthenticationError: () => void;
  onUsernameUpdate?: (newUsername: string) => void;
}

interface UserInfo {
  id: number;
  pid: string;
  name: string;
  email: string;
}

type ProfileState =
  | { type: "loading" }
  | { type: "error"; message: string }
  | { type: "loaded"; userInfo: UserInfo; message: string }
  | { type: "submitting"; userInfo: UserInfo };

export function Profile({ authState, onAuthenticationError, onUsernameUpdate }: ProfileProps) {
  const [profileState, setProfileState] = useState<ProfileState>({ type: "loading" });
  const [name, setName] = useState("");

  // Fetch current user info when component mounts
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await fetch(`${API_ROOT}/auth/current`, {
          method: "GET",
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.status === 200) {
          const data: UserInfo = await response.json();
          setName(data.name);
          setProfileState({
            type: "loaded",
            userInfo: data,
            message: "Update your profile information below."
          });
        } else if (response.status === 401) {
          onAuthenticationError();
        } else {
          setProfileState({
            type: "error",
            message: "Failed to load profile information. Please try again."
          });
        }
      } catch (error) {
        setProfileState({
          type: "error",
          message: "Network error. Please check your connection."
        });
      }
    };

    if (authState.type === "logged_in") {
      fetchUserInfo();
    } else {
      setProfileState({
        type: "error",
        message: "You must be logged in to view your profile."
      });
    }
  }, [authState, onAuthenticationError]);

  const updateLocal = (newUsername: string) => {
    Cookies.set('username', newUsername);
    if (onUsernameUpdate) {
      onUsernameUpdate(newUsername);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (profileState.type !== "loaded") {
      return;
    }

    const nameValidation = validateName(name.trim());
    if (nameValidation.type === "invalid") {
      setProfileState({
        type: "loaded",
        userInfo: profileState.userInfo,
        message: nameValidation.errors.join(", ")
      });
      return;
    }

    setProfileState({
      type: "submitting",
      userInfo: profileState.userInfo
    });

    try {
      const response = await fetch(`${API_ROOT}/users/${profileState.userInfo.id}`, {
        method: "PATCH",
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
        }),
      });

      if (response.status === 200) {
        const updatedUserInfo = { ...profileState.userInfo, name: name.trim() };
        updateLocal(name.trim());
        setProfileState({
          type: "loaded",
          userInfo: updatedUserInfo,
          message: "Profile updated successfully!"
        });
      } else if (response.status === 401) {
        onAuthenticationError();
      } else {
        try {
          const errorData = await response.text();
          const message = errorData.includes("Name must be") 
            ? "Invalid name. Name must be between 2 and 38 characters long."
            : "Failed to update profile. Please try again.";
          setProfileState({
            type: "loaded",
            userInfo: profileState.userInfo,
            message
          });
        } catch {
          setProfileState({
            type: "loaded",
            userInfo: profileState.userInfo,
            message: "Failed to update profile. Please try again."
          });
        }
      }
    } catch (error) {
      setProfileState({
        type: "loaded",
        userInfo: profileState.userInfo,
        message: "Network error. Please check your connection."
      });
    }
  };

  if (authState.type !== "logged_in") {
    return (
      <form>
        <Fieldset.Root p={8} borderRadius="lg">
          <Heading mb={6}>Profile</Heading>
          <Text color="red.500">You must be logged in to view your profile.</Text>
        </Fieldset.Root>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <Fieldset.Root p={8} borderRadius="lg">
        <Heading>
          {profileState.type === "loaded" || profileState.type === "submitting"
            ? `Profile for ${profileState.userInfo.email}`
            : "Profile"
          }
        </Heading>

        {profileState.type === "loading" && (
          <Text mt={4}>Loading your profile...</Text>
        )}

        {profileState.type === "error" && (
          <Text color="red.500" mt={4}>{profileState.message}</Text>
        )}

        {(profileState.type === "loaded" || profileState.type === "submitting") && (
          <HStack>
            <Stack mb={6} mt={6}>
              <Field.Root>
                <Field.Label>Display Name</Field.Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your display name"
                  disabled={profileState.type === "submitting"}
                  width="38ch"
                />
                <Text fontSize="sm" color="gray.600" mt={1}>
                  {getNameValidationMessage(name)}
                </Text>
              </Field.Root>

              <Button
                type="submit"
                disabled={profileState.type === "submitting" || validateName(name.trim()).type !== "valid"}
                width="full"
              >
                {profileState.type === "submitting" ? "Updating..." : "Update Profile"}
              </Button>
            </Stack>

            <Box ml={10} alignSelf="stretch" bg="gray.100" display="flex" alignItems="flex-start" p={2} flex="1">
              <Box>
                {profileState.type === "loaded" && profileState.message}

                <Box mt={4}>
                  <Text fontWeight="bold" mb={2}>Profile Settings:</Text>
                  <Text color="gray.600" mb={2}>
                    • Your display name appears on all posts and replies
                  </Text>
                  <Text color="gray.600" mb={2}>
                    • Name must be between 2 and 38 characters
                  </Text>
                  <Text color="gray.600">
                    • Email address cannot be changed
                  </Text>
                </Box>
              </Box>
            </Box>
          </HStack>
        )}
      </Fieldset.Root>
    </form>
  );
}