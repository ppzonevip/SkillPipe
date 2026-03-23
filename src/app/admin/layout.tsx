import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <aside className="w-64 bg-[#161616] border-r border-[#262626] p-4">
        <nav className="space-y-1">
          <Link
            href="/admin/settings"
            className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-[#262626] rounded-lg transition-colors"
          >
            系统设置
          </Link>
          <Link
            href="/admin/tiers"
            className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-[#262626] rounded-lg transition-colors"
          >
            会员套餐
          </Link>
          <Link
            href="/admin/users"
            className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-[#262626] rounded-lg transition-colors"
          >
            用户管理
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 p-8">{children}</div>
    </div>
  );
}
