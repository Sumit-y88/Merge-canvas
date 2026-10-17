import FreeCanvas from "../../src/screens/FreeCanvas";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free Whiteboard Canvas - MergeCanvas",
  description:
    "Try MergeCanvas instantly without signing in. Draw, sketch ideas, create diagrams, and export your canvas for free.",
};

export default function CanvasPage() {
  return <FreeCanvas />;
}
