import { ReactNode } from "react";
import { NodesProvider } from "@/context/nodes-context";

export default function MyPageLayout({ children }: { children: ReactNode }) {
  return <NodesProvider>{children}</NodesProvider>;
}
