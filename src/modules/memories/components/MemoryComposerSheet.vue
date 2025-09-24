<template>
  <Transition name="sheet">
    <div v-if="open" class="fixed inset-0 z-[80] flex items-end bg-black/50">
      <div class="relative w-full max-h-[90vh] rounded-t-3xl bg-surface shadow-2xl">
        <header class="flex items-center justify-between border-b border-outline/30 px-6 py-5">
          <div class="space-y-1">
            <h2 class="text-lg font-semibold text-content">{{ headerTitle }}</h2>
            <p class="text-xs text-content/60">记录文字、情绪与附件，让回忆更加完整。</p>
          </div>
          <UiIconButton aria-label="关闭" @click="emit('close')">
            <XMarkIcon class="h-5 w-5" />
          </UiIconButton>
        </header>

        <form class="flex max-h-[80vh] flex-col" @submit.prevent="handleSubmit">
          <div class="flex-1 overflow-y-auto px-6 pt-4 pb-6 space-y-6">
            <div class="space-y-3">
              <label class="block text-sm font-medium text-content">标题</label>
              <input
                v-model.trim="form.title"
                type="text"
                required
                placeholder="例如：与妈妈一起泡温泉的夜晚"
                class="w-full rounded-2xl border border-outline/40 bg-surface-muted/70 px-4 py-3 text-base text-content focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div class="grid grid-cols-2 gap-3 text-sm text-content/70">
              <label class="space-y-2">
                <span class="text-sm font-medium text-content">发生日期</span>
                <UiDatePicker v-model="form.eventDate" />
              </label>
              <label class="space-y-2">
                <span class="text-sm font-medium text-content">心情</span>
                <div class="relative">
                  <select
                    v-model="form.mood"
                    class="w-full appearance-none rounded-2xl border border-outline/40 bg-surface-muted/70 px-4 py-3 text-content focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="">请选择</option>
                    <option value="温馨">温馨</option>
                    <option value="感动">感动</option>
                    <option value="欣慰">欣慰</option>
                    <option value="轻松">轻松</option>
                    <option value="惆怅">惆怅</option>
                  </select>
                  <ChevronDownIcon class="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-content/40" />
                </div>
              </label>
            </div>

            <div class="space-y-2">
              <span class="text-sm font-medium text-content">地点（可选）</span>
              <input
                v-model.trim="form.location"
                type="text"
                placeholder="例如：箱根 · 温泉旅馆"
                class="w-full rounded-2xl border border-outline/40 bg-surface-muted/70 px-4 py-3 text-content focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div class="space-y-3">
              <label class="block text-sm font-medium text-content">标签</label>
              <div class="flex flex-wrap gap-2">
                <UiTag v-for="tag in form.tags" :key="tag" class="flex items-center gap-2 bg-primary/10 text-primary">
                  <span>#{{ tag }}</span>
                  <button type="button" class="text-xs text-primary/80" @click="removeTag(tag)">✕</button>
                </UiTag>
                <input
                  v-model="tagInput"
                  type="text"
                  placeholder="输入标签后按回车"
                  class="min-w-[140px] rounded-full border border-dashed border-outline/50 bg-transparent px-4 py-2 text-sm text-content focus:border-primary focus:outline-none"
                  @keydown.enter.prevent="addTag"
                  @keydown.tab="addTag"
                />
              </div>
            </div>

            <div class="space-y-3">
              <label class="block text-sm font-medium text-content">正文</label>
              <textarea
                v-model="contentInput"
                rows="6"
                placeholder="记录当时的对话、环境、感受或想法……"
                class="w-full rounded-2xl border border-outline/40 bg-surface-muted/70 px-4 py-3 text-sm leading-relaxed text-content focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-content">附件</span>
                <div class="flex items-center gap-2">
                  <input ref="fileInput" type="file" accept="image/*,video/*,audio/*" class="hidden" multiple @change="handleFileUpload" />
                  <UiIconButton aria-label="上传文件" @click="triggerFileInput">
                    <PhotoIcon class="h-5 w-5" />
                  </UiIconButton>
                  <UiIconButton aria-label="添加链接" @click="toggleLinkInput">
                    <LinkIcon class="h-5 w-5" />
                  </UiIconButton>
                </div>
              </div>
              <div v-if="showLinkInput" class="flex gap-2">
                <input
                  v-model.trim="linkInput"
                  type="url"
                  placeholder="粘贴网页或云端链接"
                  class="flex-1 rounded-2xl border border-outline/40 bg-surface-muted/70 px-4 py-2 text-sm text-content focus:border-primary focus:outline-none"
                />
                <button type="button" class="rounded-full border border-primary px-4 py-2 text-sm text-primary" @click="addLink">添加</button>
              </div>
              <div v-if="form.media.length" class="space-y-3">
                <UiCard
                  v-for="item in form.media"
                  :key="item.id"
                  padding="p-4"
                  class="flex items-center justify-between gap-3"
                >
                  <div class="flex items-center gap-3">
                    <div v-if="item.type === 'image'" class="h-16 w-16 overflow-hidden rounded-2xl bg-surface-muted">
                      <img :src="item.thumbnail ?? item.url" alt="" class="h-full w-full object-cover" />
                    </div>
                    <div v-else class="grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary">
                      <component :is="mediaIcon(item.type)" class="h-6 w-6" />
                    </div>
                    <div class="space-y-1 text-xs text-content/70">
                      <p class="font-medium text-content">{{ item.name ?? formatMediaName(item) }}</p>
                      <a v-if="isLink(item)" :href="item.url" target="_blank" rel="noopener" class="text-primary underline underline-offset-2">打开链接</a>
                    </div>
                  </div>
                  <div class="flex items-center gap-2 text-xs text-content/60">
                    <label class="flex items-center gap-1">
                      <input v-model="coverId" :value="item.id" type="radio" name="cover" class="h-4 w-4 accent-primary" />
                      封面
                    </label>
                    <button type="button" class="text-danger" @click="removeMedia(item.id)">删除</button>
                  </div>
                </UiCard>
              </div>
              <p v-else class="text-xs text-content/50">可一次上传图片、视频、音频，或添加外部链接。</p>
            </div>
          </div>

          <div
            class="flex flex-wrap items-center gap-3 border-t border-outline/30 bg-surface px-6 pt-4 pb-[calc(env(safe-area-inset-bottom)+16px)]"
          >
            <button type="button" class="flex-1 rounded-full border border-outline/40 px-4 py-3 text-sm text-content/70" @click="emit('close')">
              取消
            </button>
            <button type="submit" class="primary-button flex-1 justify-center" :disabled="isSubmitDisabled">
              {{ submitLabel }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { ChevronDownIcon, LinkIcon, PhotoIcon, XMarkIcon } from "@heroicons/vue/24/outline";

import UiIconButton from "@/components/atoms/UiIconButton.vue";
import UiTag from "@/components/atoms/UiTag.vue";
import UiCard from "@/components/atoms/UiCard.vue";
import UiDatePicker from "@/components/molecules/UiDatePicker.vue";
import type { MemoryDraft, MemoryItem, MemoryMedia, MemoryMediaType } from "@/stores/memories";

const props = defineProps<{
  open: boolean;
  memory?: MemoryItem | null;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "submit", payload: MemoryDraft): void;
}>();

const form = reactive<MemoryDraft>({
  title: "",
  content: "",
  richText: undefined,
  eventDate: new Date().toISOString().slice(0, 10),
  mood: "",
  tags: [],
  media: [],
  coverId: null,
  location: ""
});

const tagInput = ref("");
const linkInput = ref("");
const showLinkInput = ref(false);
const coverId = ref<string | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const contentInput = ref("");

const headerTitle = computed(() => (props.memory ? "编辑回忆" : "新增回忆"));
const submitLabel = computed(() => (props.memory ? "保存修改" : "确认添加"));
const isSubmitDisabled = computed(() => !form.title || !form.eventDate || !contentInput.value.trim());

watch(
  () => props.open,
  (value) => {
    if (value) {
      if (props.memory) {
        hydrateForm(props.memory);
      } else {
        resetForm();
      }
    }
  }
);

watch(coverId, (value) => {
  form.coverId = value ?? null;
});

function hydrateForm(memory: MemoryItem) {
  form.title = memory.title;
  form.content = memory.content;
  form.richText = memory.richText;
  form.eventDate = memory.eventDate;
  form.mood = memory.mood ?? "";
  form.tags = [...memory.tags];
  form.media = memory.media.map((item) => ({ ...item }));
  form.coverId = memory.coverId;
  form.location = memory.location ?? "";
  coverId.value = memory.coverId;
  contentInput.value = memory.richText ?? memory.content ?? "";
}

function resetForm() {
  form.title = "";
  form.content = "";
  form.richText = undefined;
  form.eventDate = new Date().toISOString().slice(0, 10);
  form.mood = "";
  form.tags = [];
  form.media = [];
  form.coverId = null;
  form.location = "";
  coverId.value = null;
  contentInput.value = "";
}

function triggerFileInput() {
  fileInput.value?.click();
}

function toggleLinkInput() {
  showLinkInput.value = !showLinkInput.value;
}

function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement;
  if (!target.files) return;
  const files = Array.from(target.files);
  const mediaItems = files.map((file) => ({
    id: createId(),
    type: classifyFile(file.type),
    url: URL.createObjectURL(file),
    name: file.name,
    thumbnail: file.type.startsWith("image") ? URL.createObjectURL(file) : undefined,
    meta: {
      size: file.size,
      mime: file.type
    }
  } satisfies MemoryMedia));
  form.media = [...form.media, ...mediaItems];
  if (!coverId.value && mediaItems.length) {
    coverId.value = mediaItems[0].id;
  }
  target.value = "";
}

function classifyFile(mime: string): MemoryMediaType {
  if (mime.startsWith("image")) return "image";
  if (mime.startsWith("video")) return "video";
  if (mime.startsWith("audio")) return "audio";
  return "document";
}

function mediaIcon(type: MemoryMediaType) {
  switch (type) {
    case "video":
      return PhotoIcon;
    case "audio":
      return LinkIcon;
    case "document":
      return LinkIcon;
    case "link":
      return LinkIcon;
    default:
      return PhotoIcon;
  }
}

function formatMediaName(item: MemoryMedia) {
  if (item.type === "link") return "链接";
  return item.name ?? "附件";
}

function isLink(item: MemoryMedia) {
  return item.type === "link";
}

function removeMedia(id: string) {
  form.media = form.media.filter((item) => item.id !== id);
  if (coverId.value === id) {
    coverId.value = form.media[0]?.id ?? null;
  }
}

function addLink() {
  if (!linkInput.value) return;
  form.media = [
    ...form.media,
    {
      id: createId(),
      type: "link",
      url: linkInput.value,
      name: linkInput.value
    }
  ];
  if (!coverId.value) {
    coverId.value = form.media[0]?.id ?? null;
  }
  linkInput.value = "";
  showLinkInput.value = false;
}

function addTag() {
  const value = tagInput.value.trim();
  if (!value) return;
  if (!form.tags.includes(value)) {
    form.tags.push(value);
  }
  tagInput.value = "";
}

function removeTag(tag: string) {
  form.tags = form.tags.filter((item) => item !== tag);
}

function handleSubmit() {
  if (isSubmitDisabled.value) return;
  form.content = contentInput.value.trim();
  form.richText = undefined;
  emit("submit", {
    id: props.memory?.id,
    title: form.title,
    content: form.content,
    richText: undefined,
    eventDate: form.eventDate,
    mood: form.mood,
    tags: [...form.tags],
    media: [...form.media],
    coverId: coverId.value,
    location: form.location
  });
  emit("close");
}

function createId() {
  return "mm-" + Math.random().toString(36).slice(2, 10);
}
</script>

<style scoped>
.sheet-enter-active,
.sheet-leave-active {
  transition: transform 0.24s ease, opacity 0.24s ease;
}
.sheet-enter-from,
.sheet-leave-to {
  transform: translateY(20%);
  opacity: 0;
}
</style>






