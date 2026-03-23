"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Log {
  id: string;
  method: string;
  path: string;
  statusCode: number;
  errorMsg: string | null;
  duration: number;
  ip: string | null;
  createdAt: string;
  apiKey: {
    keyBody: string;
    prefix: string;
  };
  skill: {
    name: string;
    customSlug: string;
  };
}

export default function LogsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchLogs();
  }, [page]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/developer/logs?page=${page}&limit=20`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (err) {
      console.error("Failed to fetch logs:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleString("zh-CN");
  };

  const getStatusColor = (code: number) => {
    if (code >= 200 && code < 300) return "text-green-400";
    if (code >= 400 && code < 500) return "text-yellow-400";
    if (code >= 500) return "text-red-400";
    return "text-gray-400";
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">请求日志</h1>
        <p className="text-gray-400">查看 API 请求记录</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-400">加载中...</div>
        </div>
      ) : logs.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-gray-400">还没有请求日志</p>
        </Card>
      ) : (
        <>
          <Card className="overflow-hidden">
            <table className="w-full">
              <thead className="bg-[#0a0a0a]">
                <tr className="text-left text-sm text-gray-400">
                  <th className="px-4 py-3 font-medium">时间</th>
                  <th className="px-4 py-3 font-medium">方法</th>
                  <th className="px-4 py-3 font-medium">路径</th>
                  <th className="px-4 py-3 font-medium">状态</th>
                  <th className="px-4 py-3 font-medium">耗时</th>
                  <th className="px-4 py-3 font-medium">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262626]">
                {logs.map((log) => (
                  <tr key={log.id} className="text-sm">
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                      {formatTime(log.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 text-xs rounded ${
                          log.method === "POST"
                            ? "bg-blue-600/20 text-blue-400"
                            : log.method === "GET"
                            ? "bg-green-600/20 text-green-400"
                            : "bg-gray-600/20 text-gray-400"
                        }`}
                      >
                        {log.method}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-300 font-mono text-xs">
                      {log.path}
                    </td>
                    <td className={`px-4 py-3 font-medium ${getStatusColor(log.statusCode)}`}>
                      {log.statusCode}
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      {log.duration}ms
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {log.ip || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-gray-400 text-sm">
              第 {page} / {totalPages} 页
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                上一页
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                下一页
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
