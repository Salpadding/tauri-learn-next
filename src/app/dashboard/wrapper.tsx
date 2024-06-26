"use client";
import { PageContainer, ProCard, ProLayout } from "@ant-design/pro-components";
import { ReactNode } from "react";
import props from "./props";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { App } from "antd";

export default function Page({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const container = (
    <div className="min-h-[100vh]">
      <ProLayout
        bgLayoutImgList={[]}
        {...props()}
        location={{
          pathname,
        }}
        // 左下角头像
        avatarProps={{}}
        // 左下角图标
        actionsRender={(props) => {
          if (props.isMobile) return [];
          return [];
        }}
        menuItemRender={(item, dom) => <Link href={item.path!}>{dom}</Link>}
      >
        <PageContainer>
          <ProCard
            style={{
              height: "100vh",
              minHeight: 800,
            }}
          >
            {children}
          </ProCard>
        </PageContainer>
      </ProLayout>
    </div>
  );
  return (
    <AntdRegistry>
      <App>{container}</App>
    </AntdRegistry>
  );
}
