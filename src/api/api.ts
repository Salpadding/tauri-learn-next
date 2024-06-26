import * as api from "@tauri-apps/api";

export function tauri(): typeof api {
  if (typeof window === "undefined") return {} as any;
  let w = window as any;
  return w["__TAURI__"];
}

export async function exec(program: string, args?: string[]) {
  const Cmd = tauri().shell.Command;
  console.log(program);
  console.log(args);
  const cmd = new Cmd(program, args);
  return await cmd.execute();
}
