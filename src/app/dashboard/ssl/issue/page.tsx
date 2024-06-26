"use client";
import { MutableRefObject, useEffect, useState, ReactNode } from "react";
import * as tauri from "@/api/api";
import type { ProFormInstance } from "@ant-design/pro-components";
import { ModalForm } from "@ant-design/pro-components";
import {
  ProCard,
  ProFormSelect,
  ProFormText,
  ProFormDigit,
  StepsForm,
  ProFormTextArea,
} from "@ant-design/pro-components";
import { message, Button, Form, App } from "antd";
import { useRef } from "react";
import lo from "lodash";
import * as api from "../ca/api";
import { useRouter } from "next/navigation";

async function createKey(bits: number) {
  const keyfile = (await tauri.exec("mktemp")).stdout.trim();
  await tauri.exec("openssl", ["genrsa", "-out", keyfile, bits.toString()]);
  return keyfile;
}

const defaults = {
  ca: "",
  csr: {
    bits: 4096,
    csrfile: "",
    keyfile: "",
    CN: "localhost",
  },
  sign: {
    file: "",
    days: 365,
  },
};

export const subjects: Record<string, ({ key }: { key: string }) => ReactNode> =
  {
    CN: (opts) => (
      <ProFormText
        key={opts.key}
        name="CN"
        label="Common Name(CN)"
        width="lg"
        placeholder="localhost"
        rules={[{ required: true }]}
      />
    ),
    O: (opts) => (
      <ProFormText
        key={opts.key}
        name="O"
        label="Organization(O)"
        width="lg"
        placeholder="localhost"
      />
    ),
    OU: (opts) => (
      <ProFormText
        key={opts.key}
        name="OU"
        label="Organizational Unit(OU)"
        width="lg"
        placeholder="localhost"
      />
    ),
    L: (opts) => (
      <ProFormText
        key={opts.key}
        name="L"
        label="City/Locality(L)"
        width="lg"
        placeholder="New York"
      />
    ),
    ST: (opts) => (
      <ProFormText
        key={opts.key}
        name="ST"
        label="State/County/Region(ST)"
        width="lg"
        placeholder="China"
      />
    ),
    C: (opts) => (
      <ProFormText
        key={opts.key}
        name="C"
        label="Country(C)"
        width="lg"
        placeholder="CN"
      />
    ),
    EMAIL: (opts) => (
      <ProFormText
        key={opts.key}
        name="EMAIL"
        label="Email Address(EMAIL)"
        width="lg"
        placeholder="user@localhost"
      />
    ),
  };

function CA({
  formRef,
  options,
}: {
  formRef: MutableRefObject<ProFormInstance | undefined>;
  options: MutableRefObject<typeof defaults>;
}) {
  return (
    <StepsForm.StepForm
      name="CA"
      title="选择CA"
      stepProps={{
        description: "选择CA",
      }}
      onFinish={async (values: any) => {
        return (options.current.ca = values.ca);
      }}
    >
      <ProFormSelect
        width="lg"
        name="ca"
        request={async () => {
          const caList = await api.listCa();
          return caList.map((x) => ({ label: x.name, value: x.name }));
        }}
        rules={[{ required: true }]}
      />
    </StepsForm.StepForm>
  );
}

function CSR({
  formRef,
  options,
}: {
  formRef: MutableRefObject<ProFormInstance | undefined>;
  options: MutableRefObject<typeof defaults>;
}) {
  const dn = ["CN", "O", "OU", "L", "ST", "C", "EMAIL"];
  return (
    <StepsForm.StepForm
      name="csr"
      request={async () => options.current.csr}
      title="生成私钥和证书请求"
      stepProps={{
        description: "生成私钥和证书请求",
      }}
      onFinish={async () => {
        const opts = formRef.current?.getFieldsValue();
        let subj = "";
        for (const key of dn) {
          if (!opts[key]) continue;
          subj += `/${key}=${opts[key]}`;
        }

        options.current.csr.keyfile = await createKey(opts.bits);
        options.current.csr.csrfile = (
          await tauri.exec("mktemp")
        ).stdout.trim();
        const resp = await tauri.exec("openssl", [
          "req",
          "-new",
          "-subj",
          subj,
          "-key",
          options.current.csr.keyfile,
          "-out",
          options.current.csr.csrfile,
        ]);
        return true;
      }}
    >
      <ProFormSelect
        width="lg"
        label="rsa bits"
        name="bits"
        rules={[{ required: true }]}
        request={async () => [
          { label: "4096", value: 4096 },
          { label: "2048", value: 2048 },
        ]}
      />
      {dn.map((x) => subjects[x]({ key: x }))}
    </StepsForm.StepForm>
  );
}

const ext = (alt: string) => {
  const ret = `
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage = digitalSignature, nonRepudiation, keyEncipherment, dataEncipherment
subjectAltName = @alt_names
[alt_names]
${alt}
`;
  return ret;
};

function Component() {
  const formRef = useRef<ProFormInstance>();
  const options = useRef(defaults);
  const router = useRouter();
  const msg = App.useApp().message;

  async function finish() {
    const opts = formRef.current?.getFieldsValue();
    const file = (await tauri.exec("mktemp")).stdout.trim();
    options.current.sign.file = file;

    const extfile = (await tauri.exec("mktemp")).stdout.trim();
    let dns = 1;
    let ip = 1;
    let alts = "";
    for (const n of opts.names.split("\n")) {
      if (!n.trim()) continue;
      // ip 地址
      if (/^([0-9]{1,3}\.){3}[0-9]{1,3}$/.test(n.trim())) {
        alts += `IP.${ip} = ${n.trim()}\n`;
        ip++;
        continue;
      }
      alts += `DNS.${dns} = ${n.trim()}\n`;
      dns++;
    }
    await tauri.tauri().fs.writeTextFile(extfile, ext(alts));

    const resp = await tauri.exec("openssl", [
      "x509",
      "-req",
      "-in",
      options.current.csr.csrfile,
      "-CAcreateserial",
      "-CA",
      await api.resolve(`${options.current.ca}.crt`),
      "-CAkey",
      await api.resolve(`${options.current.ca}.pem`),
      "-days",
      opts.days.toString(),
      "-extfile",
      extfile,
      "-out",
      file,
    ]);

    const dir = (await tauri.tauri().dialog.open({
      multiple: false,
      directory: true,
    })) as string;

    if (!dir) return false;
    const mvs = {
      [options.current.csr.keyfile]: "server.pem",
      [options.current.sign.file]: "server.crt",
    };

    for (const key of Object.keys(mvs)) {
      await tauri
        .tauri()
        .fs.copyFile(key, await tauri.tauri().path.join(dir, mvs[key]));
    }

    setTimeout(() => {
      msg.success(`创建成功: server.pem server.crt`);
      router.push("/dashboard/env");
    });
    return true;
  }
  return (
    <ProCard>
      <StepsForm
        formRef={formRef}
        onFinish={finish}
        formProps={{
          validateMessages: {
            required: "此项为必填项",
          },
        }}
      >
        <CA formRef={formRef} options={options} />
        <CSR formRef={formRef} options={options} />
        <StepsForm.StepForm
          name="sign"
          title="证书签名"
          stepProps={{
            description: "证书签名",
          }}
          request={async () => options.current.sign}
        >
          <ProFormDigit
            label="签名有效时长(天)"
            name="days"
            width="lg"
            min={1}
            placeholder="365"
          />
          <ProFormTextArea
            name="names"
            label="域名/IP 列表"
            placeholder={"127.0.0.1\nlocalhost"}
            width="lg"
          />
        </StepsForm.StepForm>
      </StepsForm>
    </ProCard>
  );
}

export default function Page() {
  return (
    <div className="w-full">
      <Component />
    </div>
  );
}
