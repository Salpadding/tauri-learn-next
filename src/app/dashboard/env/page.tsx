"use client";
import { EllipsisOutlined, PlusOutlined } from "@ant-design/icons";
import type { ActionType, ProColumns } from "@ant-design/pro-components";
import { ProTable, TableDropdown } from "@ant-design/pro-components";
import { Button, Dropdown, Space, Tag } from "antd";
import { useRef } from "react";
import * as env from "@/api/env";

type Item = {
  key: string;
  value: string;
  description: string;
};

const columns: ProColumns<Item>[] = [
  {
    dataIndex: "key",
    search: false,
    title: "Key",
  },
  {
    title: "Value",
    dataIndex: "value",
    copyable: true,
    ellipsis: false,
    search: false,
  },
  {
    title: "描述",
    dataIndex: "description",
    search: false,
  },
];

export default function Page() {
  const actionRef = useRef<ActionType>();
  return (
    <ProTable<Item>
      columns={columns}
      actionRef={actionRef}
      cardBordered
      request={async (params, sort, filter) => {
        const values = await env.getEnv();
        return { total: values.length, data: values, success: true };
      }}
      editable={{
        type: "multiple",
      }}
      rowKey="key"
      search={false}
      options={{}}
      form={{}}
      pagination={{
        defaultPageSize: 50,
      }}
      dateFormatter="string"
      headerTitle="环境变量"
      toolBarRender={() => []}
    />
  );
}
