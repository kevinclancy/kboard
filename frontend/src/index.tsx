import React from "react";
import ReactDOM from "react-dom/client";
import { ChakraProvider } from "@chakra-ui/react";
import { KBoard } from "./KBoard";
import system from "./theme";

const root = document.getElementById("root");

if (!root) {
  throw new Error("No root element found");
}

const pathSegment = window.location.pathname.split("/").pop() || "";
console.log("pathname: " + window.location.pathname);
const isResetPage = pathSegment.startsWith("reset");
console.log("path segment: " + pathSegment);
const getInitialUIState = () => {
  if (isResetPage) {
    const resetKey = window.location.hash.substring(1); // Remove "reset" prefix
    console.log("reset key is " + resetKey);
    return { type: "new_password" as const, resetKey };
  }
  return { type: "board" as const };
};

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <ChakraProvider value={system}>
      <KBoard initialUIState={getInitialUIState()} />
    </ChakraProvider>
  </React.StrictMode>,
);
