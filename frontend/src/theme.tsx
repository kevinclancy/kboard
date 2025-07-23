
import { createSystem, defaultConfig, defineConfig, defineRecipe } from "@chakra-ui/react"
import { defineLayerStyles } from "@chakra-ui/react"

const layerStyles = defineLayerStyles({
  container: {
    description: "container styles",
    value: {
      background: "gray.50",
      border: "2px solid",
      borderColor: "gray.500",
    },
  },
});

const inputRecipe = defineRecipe({
  className: "input",
  base: {
    borderColor: "red.300",
    _hover: {
      borderColor: "gray.400",
    },
    _focus: {
      borderColor: "blue.500",
      boxShadow: "0 0 0 1px blue.500",
    },
  },
});

const config = defineConfig({
  theme: {
    layerStyles,
    recipes: {
      input: inputRecipe,
    },
  },
})

export default createSystem(defaultConfig, config)