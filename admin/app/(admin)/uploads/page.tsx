"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { createUpload } from "@/lib/api/uploads";
import type { UploadRecord } from "@/lib/api/uploads";

const uploadFormSchema = z.object({
  url: z.string().url("请输入合法的文件链接").optional().or(z.literal("")),
  thumbnail: z.string().url("请输入合法的缩略图链接").optional().or(z.literal(""))
});

type UploadFormValues = z.infer<typeof uploadFormSchema>;

export default function UploadsPage() {
  const [history, setHistory] = useState<UploadRecord[]>([]);

  const form = useForm<UploadFormValues>({
    resolver: zodResolver(uploadFormSchema),
    defaultValues: {
      url: "",
      thumbnail: ""
    }
  });

  const uploadMutation = useMutation({
    mutationFn: (values: UploadFormValues) =>
      createUpload({
        url: values.url?.trim() || undefined,
        thumbnail: values.thumbnail?.trim() || undefined
      }),
    onSuccess: (record) => {
      setHistory((prev) => [record, ...prev]);
      form.reset();
    }
  });

  const handleSubmit = form.handleSubmit((values) => uploadMutation.mutate(values));

  return (
    <div className="flex flex-1 flex-col gap-6">
      <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">上传记录</h2>
          <p className="text-sm text-muted-foreground">
            模拟上传接口以生成测试资源 ID。可填写现有文件链接，也可以保留为空以使用系统生成的示例地址。
          </p>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-foreground">文件链接</label>
              <input
                type="text"
                {...form.register("url")}
                className="rounded-md border border-border px-3 py-2 text-sm"
                placeholder="https://example.com/file.png"
              />
              {form.formState.errors.url && (
                <p className="text-sm text-destructive">{form.formState.errors.url.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-foreground">缩略图链接</label>
              <input
                type="text"
                {...form.register("thumbnail")}
                className="rounded-md border border-border px-3 py-2 text-sm"
                placeholder="https://example.com/thumb.jpg"
              />
              {form.formState.errors.thumbnail && (
                <p className="text-sm text-destructive">{form.formState.errors.thumbnail.message}</p>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <p>未填写字段时将由 API 自动生成示例地址。</p>
            <button
              type="submit"
              disabled={uploadMutation.isPending}
              className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-70"
            >
              {uploadMutation.isPending ? "上传中..." : "提交到上传 API"}
            </button>
          </div>
        </form>
        {uploadMutation.isError && (
          <p className="mt-4 text-sm text-destructive">{(uploadMutation.error as Error).message}</p>
        )}
      </section>

      <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h3 className="text-base font-semibold">最近生成的记录</h3>
        {history.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">尚未创建上传记录。</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead>
                <tr className="bg-muted/50 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3">资源 ID</th>
                  <th className="px-4 py-3">文件地址</th>
                  <th className="px-4 py-3">缩略图</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {history.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-2 font-medium text-foreground">{item.id}</td>
                    <td className="px-4 py-2 text-muted-foreground">
                      <a href={item.url} target="_blank" rel="noreferrer" className="text-primary underline">
                        {item.url}
                      </a>
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {item.thumbnail ? (
                        <a href={item.thumbnail} target="_blank" rel="noreferrer" className="text-primary underline">
                          {item.thumbnail}
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

