import { tauri, exec } from "@/api/api";
import { envs } from "@/api/env";
import { FileEntry } from "@tauri-apps/api/fs";
import lo from "lodash";

export async function listCa(): Promise<
  { name: string; keyfile: string; crtfile: string }[]
> {
  const vars = await envs();
  let entries = [];
  try {
    entries = await tauri().fs.readDir(vars.CA_DATA);
  } catch (e) {
    return [];
  }
  const set: Record<string, FileEntry> = {};
  for (const entry of entries) {
    if (entry.name?.endsWith(".crt") || entry.name?.endsWith(".pem")) {
      set[entry.name] = entry;
    }
  }

  return lo
    .toPairs(set)
    .filter((x) => x[0].endsWith(".pem"))
    .filter((x) => set[x[0].replace(/.pem$/, ".crt")])
    .map((x) => ({
      name: x[0].replace(/.pem$/, ""),
      keyfile: x[1].path,
      crtfile: set[x[0].replace(/.pem$/, ".crt")].path,
    }));
}

export async function resolve(base: string): Promise<string> {
  const vars = await envs();
  return tauri().path.join(vars.CA_DATA, base);
}

export async function removeCA(name: string) {
  await tauri().fs.removeFile(await resolve(`${name}.pem`));
  await tauri().fs.removeFile(await resolve(`${name}.crt`));
}

export async function createCA(props: any) {
  const dn = ["CN", "C", "ST", "L", "O", "OU", "EMAIL"];
  const vars = await envs();
  try {
    await tauri().fs.createDir(vars.CA_DATA, { recursive: true });
  } catch (e) {}
  // 1 生成私钥
  await exec("openssl", [
    "genrsa",
    "-out",
    await resolve(`${props.name}.pem`),
    props.bits.toString(),
  ]);

  let subj = "";
  for (const key of dn) {
    if (!props[key]) continue;
    subj = `${subj}/${key}=${props[key]}`;
  }

  // 生成根证书
  await exec("openssl", [
    "req",
    "-x509",
    "-key",
    await resolve(`${props.name}.pem`),
    "-subj",
    subj,
    "-days",
    props.days.toString(),
    "-out",
    await resolve(`${props.name}.crt`),
  ]);
}
