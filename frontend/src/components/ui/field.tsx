import { chakra } from "@chakra-ui/react";

const FieldRoot = chakra("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "2",
    marginBottom: "4",
  },
});

const FieldLabel = chakra("label", {
  base: {
    fontSize: "sm",
    fontWeight: "medium",
    color: "gray.700",
    marginBottom: "1",
  },
});

export const Field = {
  Root: FieldRoot,
  Label: FieldLabel,
};