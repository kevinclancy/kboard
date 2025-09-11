/// Shared validation utilities for forms

export type ValidationResult =
  | { type: "valid" }
  | { type: "invalid"; errors: string[] };

/// Validates a display name/username
export function validateName(name: string): ValidationResult {
  const errors: string[] = [];
  
  if (name.length < 2) {
    errors.push("Name must be at least 2 characters long");
  }
  
  if (name.length > 38) {
    errors.push("Name must be no more than 38 characters long");
  }
  
  if (errors.length === 0) {
    return { type: "valid" };
  }
  
  return {
    type: "invalid",
    errors
  };
}

/// Validates a password according to the application requirements
export function validatePassword(password: string): ValidationResult {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push("At least 8 characters");
  }
  
  if (!/[a-zA-Z]/.test(password)) {
    errors.push("At least one letter");
  }
  
  if (!/\d/.test(password)) {
    errors.push("At least one digit");
  }
  
  if (!/[^\w\s]/.test(password)) {
    errors.push("At least one punctuation mark");
  }
  
  if (errors.length === 0) {
    return { type: "valid" };
  }
  
  return {
    type: "invalid",
    errors
  };
}


/// Gets a user-friendly name validation message for display
export function getNameValidationMessage(name: string): string {
  const validation = validateName(name);
  if (validation.type === "valid") {
    return `${name.length}/38 characters`;
  }
  return `${name.length}/38 characters (${validation.errors.join(", ")})`;
}