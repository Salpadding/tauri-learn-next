import { tauri } from "./api";
import lo from "lodash";

export async function envs() {
  const data = await tauri().path.appDataDir();
  return {
    APP_DATA: data,
    CA_DATA: await tauri().path.join(data, "ca"),
  };
}

const descriptions: Record<string, string> = {
  APP_DATA: "app 数据存放目录",
  CA_DATA: "ca 存放目录",
};

export async function getEnv(): Promise<
  { key: string; value: string; description: string }[]
> {
  return lo.toPairs(await envs()).map((x) => ({
    key: x[0],
    value: x[1],
    description: descriptions[x[0]],
  }));
}
