import { createRoot } from "react-dom/client";
import App from "./App-simple";
// import "./index.css";  // Temporarily disable CSS to test

console.log("main.tsx is loading...");

const rootElement = document.getElementById("root");
console.log("Root element found:", rootElement);

if (rootElement) {
  try {
    const root = createRoot(rootElement);
    console.log("React root created");
    root.render(<App />);
    console.log("App rendered");
  } catch (error) {
    console.error("Error rendering app:", error);
  }
} else {
  console.error("Root element not found!");
}
