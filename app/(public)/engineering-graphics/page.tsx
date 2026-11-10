import type { Metadata } from "next";
import { EngineeringGraphicsStudio } from "@/components/engineering-graphics/EngineeringGraphicsStudio";

export const metadata: Metadata = {
  title: "Engineering Graphics Studio | EngiVault",
  description: "A guided interactive Engineering Graphics workspace for solid projections, sections, true shapes, surface development, isometric and orthographic views.",
};

export default function EngineeringGraphicsPage() {
  return <EngineeringGraphicsStudio />;
}
