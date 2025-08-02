# Claude Development Guidelines for KBoard

This file contains development preferences and guidelines for working on the KBoard project.

## Code Documentation

### Tuple Type Comments
- Use triple-slash comments (`///`) for VS Code IntelliSense support
- Place comments on the line above the field
- For tuple types, use format: `/// [component1, component2] - description`
- Avoid redundant text like "Tuple containing" since the type definition makes it clear

Example:
```typescript
/// [reply_id, reply_body_text] - the ID and text of the reply being responded to
reply_to: [number, string] | null;
```

## Type Design Patterns

### Discriminated Unions
- Prefer discriminated union types over separate boolean/nullable state variables
- Use discriminated unions to make illegal states unrepresentable
- This prevents invalid state combinations and improves type safety

Example:
```typescript
// Preferred: Discriminated union
type ReplyEditorState =
  | { type: "closed" }
  | { type: "new_reply"; replyToId?: number }
  | { type: "editing_reply"; replyId: number };

// Avoid: Separate state variables that can create invalid combinations
const [showEditor, setShowEditor] = useState(false);
const [editingId, setEditingId] = useState<number | null>(null);
const [replyToId, setReplyToId] = useState<number | null>(null);
```

## General Principles

- Prioritize type safety and clear state management
- Use meaningful variable and type names
- Document complex data structures with appropriate comments