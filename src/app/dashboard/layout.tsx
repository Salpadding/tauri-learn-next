import { ReactNode } from "react";
import Wrapper from "./wrapper";
export default function Layout({ children }: { children: ReactNode }) {
  return <Wrapper>{children}</Wrapper>;
}
