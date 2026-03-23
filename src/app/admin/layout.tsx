import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.AUTH_SECRET || "fallback-secret";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    redirect("/login");
  }

  let user: { id: string; role: string };
  try {
    user = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
  } catch {
    redirect("/login");
  }

  if (user.role !== "ADMIN") {
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
