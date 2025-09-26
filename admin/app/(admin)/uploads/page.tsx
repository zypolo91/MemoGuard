"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { createUpload, deleteUpload, listUploads, type UploadRecord } from "@/lib/api/uploads";

const uploadFormSchema = z.object({
  folder: z
    .string()
    .trim()
    .max(120, "存储路径需少于 120 个字符")
    .optional()
});

type UploadFormValues = z.infer<typeof uploadFormSchema>;

export default function UploadsPage() {
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const uploadsQuery = useQuery({
    queryKey: ["uploads", page, pageSize],
    queryFn: () => listUploads(page, pageSize),
    keepPreviousData: true
  });
  const history: UploadRecord[] = uploadsQuery.data?.data ?? [];
  const total = uploadsQuery.data?.pagination.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat("zh-CN", {
        dateStyle: "short",
        timeStyle: "short"
      }),
    []
  );

  const form = useForm<UploadFormValues>({
    resolver: zodResolver(uploadFormSchema),
    defaultValues: { folder: "" }
  });

  useEffect(() => {
    if (!selectedFile || !selectedFile.type.startsWith("image/")) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  const clearFilePreview = useCallback(() => {
    setSelectedFile(null);
    setPreviewUrl(null);
  }, []);

  const handleFileSelect = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const [file] = files;
      setSelectedFile(file);
      form.clearErrors("root");
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [form]
  );

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragging(false);
      handleFileSelect(event.dataTransfer.files);
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!isDragging) setIsDragging(true);
  }, [isDragging]);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (event.currentTarget.contains(event.relatedTarget as Node)) return;
    setIsDragging(false);
  }, []);

  const uploadMutation = useMutation({
    mutationFn: ({ file, folder }: { file: File; folder?: string }) => createUpload({ file, folder }),
    onSuccess: () => {
      // 刷新第一页方便看到最新
      setPage(1);
      uploadsQuery.refetch();
      clearFilePreview();
      form.reset();
    }
  });

  const removeMutation = useMutation({
    mutationFn: async ({ path, bucket }: { path: string; bucket?: string }) => deleteUpload({ path, bucket }),
    onSuccess: () => {
      uploadsQuery.refetch();
    }
  });

  const handleSubmit = form.handleSubmit((values) => {
    if (!selectedFile) {
      form.setError("root", { type: "manual", message: "请先选择要上传的文件" });
      return;
    }
    uploadMutation.mutate({
      file: selectedFile,
      folder: values.folder?.trim() ? values.folder.trim() : undefined
    });
  });

  const onManualPick = useCallback(() => fileInputRef.current?.click(), []);

  return (
    <div className="flex flex-1 flex-col gap-6">
      <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">文件上传</h2>
          <p className="text-sm text-muted-foreground">拖拽或点击选择文件，成功后返回可访问的 URL。</p>
        </div>
      </section>

      <section className="space-y-6 rounded-lg border border-border bg-card p-6 shadow-sm">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 text-center transition ${
            isDragging ? "border-primary bg-primary/10" : "border-muted-foreground/40 bg-muted/30"
          } ${uploadMutation.isPending ? "pointer-events-none opacity-80" : ""}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            disabled={uploadMutation.isPending}
            onChange={(e) => handleFileSelect(e.target.files)}
          />
          {selectedFile ? (
            <div className="flex flex-col items-center gap-3">
              {previewUrl ? (
                <img src={previewUrl} alt="预览" className="h-28 w-28 rounded-md object-cover shadow" />
              ) : (
                <div className="flex h-28 w-28 items-center justify-center rounded-md border border-border text-sm text-muted-foreground">
                  {selectedFile.name.split(".").pop()?.toUpperCase() || "FILE"}
                </div>
              )}
              <p className="max-w-[280px] truncate text-sm text-foreground">{selectedFile.name}</p>
              <div className="flex gap-2">
                <button type="button" onClick={onManualPick} className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-muted">
                  重新选择
                </button>
                <button
                  type="button"
                  onClick={clearFilePreview}
                  className="rounded-md border border-destructive px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10"
                >
                  移除
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
              <p>将文件拖拽到此处，或</p>
              <button type="button" onClick={onManualPick} className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90">
                选择文件
              </button>
            </div>
          )}
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-foreground" htmlFor="folder">
                存储路径（可选）
              </label>
              <input
                id="folder"
                type="text"
                {...form.register("folder")}
                disabled={uploadMutation.isPending}
                className="rounded-md border border-border px-3 py-2 text-sm"
                placeholder="例如 uploads/memories"
              />
            </div>
          </div>
          {form.formState.errors.root && <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>}
          {uploadMutation.isError && <p className="text-sm text-destructive">{(uploadMutation.error as Error).message}</p>}
          <div className="flex items-center justify-end">
            <button
              type="submit"
              disabled={uploadMutation.isPending || !selectedFile}
              className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-70"
            >
              {uploadMutation.isPending ? "上传中..." : "开始上传"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h3 className="text-base font-semibold">上传记录</h3>
        {uploadsQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">加载中...</p>
        ) : history.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">暂无记录。</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead>
                <tr className="bg-muted/50 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3">文件名</th>
                  <th className="px-4 py-3">时间</th>
                  <th className="px-4 py-3">链接</th>
                  <th className="px-4 py-3">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {history.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-2 text-foreground">{item.originalName}</td>
                    <td className="px-4 py-2 text-muted-foreground">{dateFormatter.format(new Date(item.createdAt))}</td>
                    <td className="px-4 py-2">
                      <a href={item.url} target="_blank" rel="noreferrer" className="max-w-[280px] truncate text-primary underline">
                        {item.url}
                      </a>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => navigator.clipboard.writeText(item.url).catch(() => {})}
                          className="rounded-md border border-border px-2 py-1 text-xs hover:bg-muted"
                        >
                          复制
                        </button>
                        <button
                          type="button"
                          disabled={removeMutation.isPending}
                          onClick={() => removeMutation.mutate({ path: item.path, bucket: item.bucket })}
                          className="rounded-md border border-destructive px-2 py-1 text-xs text-destructive hover:bg-destructive/10 disabled:opacity-60"
                        >
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 flex items-center justify-end gap-2 text-sm">
              <span>第 {page} / {pageCount} 页（共 {total} 条）</span>
              <button
                type="button"
                disabled={page <= 1 || uploadsQuery.isFetching}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-md border border-border px-3 py-1 hover:bg-muted disabled:opacity-50"
              >
                上一页
              </button>
              <button
                type="button"
                disabled={page >= pageCount || uploadsQuery.isFetching}
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                className="rounded-md border border-border px-3 py-1 hover:bg-muted disabled:opacity-50"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}