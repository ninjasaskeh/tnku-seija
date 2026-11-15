// Entry buat build preview satu-file (npm run preview:single). Bukan bagian dari app Next.js.
import "@fontsource-variable/archivo/wdth.css";
import "@fontsource/space-mono/400.css";
import "@fontsource/space-mono/700.css";
import "./preview.css";
import { createRoot } from "react-dom/client";
import Home from "../src/app/page";

createRoot(document.getElementById("root")!).render(<Home />);
