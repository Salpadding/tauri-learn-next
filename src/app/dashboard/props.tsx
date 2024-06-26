"use client";
import {
  ChromeFilled,
  CrownFilled,
  SmileFilled,
  TabletFilled,
  ToolOutlined,
  DollarOutlined,
} from "@ant-design/icons";

export default function props() {
  const ret = {
    title: "",
    logo: <ToolOutlined />,
    route: {
      children: [
        { path: "/dashboard/env", name: "环境变量", icon: <SmileFilled /> },
        {
          path: "/dashboard/ssl",
          name: "ssl",
          icon: <DollarOutlined />,
          children: [
            {
              path: "/dashboard/ssl/ca",
              name: "CA",
            },
            {
              path: "/dashboard/ssl/issue",
              name: "签发证书",
            },
          ],
        },
      ],
    },
    // 用于展示 app 菜单
    appList: [],
  };
  return ret;
}
