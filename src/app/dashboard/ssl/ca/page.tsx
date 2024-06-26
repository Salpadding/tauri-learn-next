"use client";
import { EllipsisOutlined, PlusOutlined } from "@ant-design/icons";
import type { ActionType, ProColumns } from "@ant-design/pro-components";
import {
  ProTable,
  TableDropdown,
  ModalForm,
  ProFormDigit,
  ProFormSelect,
  ProFormText,
} from "@ant-design/pro-components";
import { Button, Dropdown, Space, Tag, Form, App as AntdApp } from "antd";
import { ReactNode, useRef } from "react";
import * as api from "./api";
import { subjects } from "../issue/page";

function Modal({
  trigger,
  onFinish,
}: {
  trigger: ReactNode;
  onFinish: () => any;
}) {
  const dn = ["CN", "C", "ST", "L", "O", "OU", "EMAIL"];
  const [form] = Form.useForm<{ name: string; company: string }>();
  const msg = AntdApp.useApp().message;
  return (
    <ModalForm
      title="新建CA证书"
      trigger={trigger as any}
      form={form}
      autoFocusFirstInput
      modalProps={{
        destroyOnClose: true,
      }}
      initialValues={{
        bits: 4096,
        days: 365,
        CN: "localhost",
      }}
      onFinish={async (values) => {
        await api.createCA(values);
        setTimeout(() => {
          msg.success("创建成功", 8);
          onFinish && onFinish();
        });
        return true;
      }}
    >
      <ProFormText
        label="证书名称"
        name="name"
        rules={[{ required: true }]}
        width="lg"
      />
      <ProFormSelect
        label="rsa bits"
        name="bits"
        request={async () => [
          { label: "4096", value: 4096 },
          { label: "2048", value: 2048 },
        ]}
        rules={[{ required: true }]}
        width="lg"
      />
      <ProFormDigit
        label="根证书有效时长(天)"
        name="days"
        width="lg"
        min={1}
        placeholder="365"
        rules={[{ required: true }]}
      />
      {dn.map((x) => subjects[x]({ key: x }))}
    </ModalForm>
  );
}

type Item = {
  name: string;
  keyfile: string;
  crtfile: string;
};

const columns: () => ProColumns<Item>[] = () => [
  {
    dataIndex: "name",
    search: false,
    title: "名称",
  },
  {
    dataIndex: "keyfile",
    search: false,
    title: "私钥文件",
    copyable: true,
  },
  {
    title: "证书文件",
    dataIndex: "crtfile",
    copyable: true,
    search: false,
  },
  {
    title: "描述",
    dataIndex: "description",
    search: false,
  },
  {
    title: "操作",
    dataIndex: "name",
    search: false,
  },
];

export default function Page() {
  const actionRef = useRef<ActionType>();
  const msg = AntdApp.useApp().message;
  const cols = columns();
  cols[cols.length - 1].render = (value: any) => [
    <Button
      onClick={async function () {
        await api.removeCA(value);
        setTimeout(() => {
          msg.success("删除成功", 8);
          actionRef.current?.reload();
        });
      }}
    >
      删除
    </Button>,
  ];

  return (
    <ProTable<Item>
      columns={cols}
      actionRef={actionRef}
      cardBordered
      request={async (params, sort, filter) => {
        const data = await api.listCa();
        return { total: data.length, data: data, success: true };
      }}
      rowKey="name"
      search={false}
      options={{}}
      form={{}}
      pagination={{
        defaultPageSize: 50,
      }}
      dateFormatter="string"
      headerTitle="CA根证书列表"
      toolBarRender={() => [
        <Modal
          trigger={
            <Button type="primary">
              <PlusOutlined />
              新建CA
            </Button>
          }
          onFinish={() => actionRef.current?.reload() as any}
        ></Modal>,
      ]}
    />
  );
}
