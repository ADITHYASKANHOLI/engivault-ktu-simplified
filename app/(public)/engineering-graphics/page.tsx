import type { Metadata } from "next";
import { EngineeringGraphicsStudio } from "@/components/engineering-graphics/EngineeringGraphicsStudio";

export const metadata: Metadata = {
  title: "FOLE DraftLab | Engineering Graphics | EngiVault",
  description:
    "Precision-first engineering graphics workspace for solid geometry, orthographic projections, isometric views and section previews.",
};

export default function EngineeringGraphicsPage() {
  return <EngineeringGraphicsStudio />;
}
