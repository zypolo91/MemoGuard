<template>
  <div class="space-y-2">
    <VDatePicker
      v-model="innerValue"
      :model-config="modelConfig"
      :min-date="minDate"
      :max-date="maxDate"
      :locale="locale"
      :popover="popoverOptions"
      :masks="masks"
      color="purple"
    >
      <template #default="{ togglePopover, updateValue }">
        <div class="flex flex-col gap-2">
          <button
            type="button"
            class="flex w-full items-center justify-between rounded-2xl border border-outline border-opacity-40 bg-surface-muted/70 px-4 py-3 text-left text-sm text-content transition hover:border-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-30"
            @click="togglePopover()"
          >
            <span class="flex flex-col">
              <span v-if="selectedLabel" class="text-sm font-medium text-content">{{ selectedLabel }}</span>
              <span v-else class="text-sm text-content/50">{{ placeholder }}</span>
              <span v-if="selectedLabel" class="text-xs text-content/50">{{ helperLabel }}</span>
            </span>
            <ChevronDownIcon class="h-4 w-4 text-content/40 transition" />
          </button>
          <div class="flex items-center justify-between text-xs text-content/60">
            <button
              type="button"
              class="rounded-full px-3 py-1 font-medium text-primary transition hover:bg-primary/10"
              @click.stop="selectToday(updateValue, togglePopover)"
            >
              今天
            </button>
            <button
              type="button"
              class="rounded-full px-3 py-1 transition hover:bg-outline/10"
              :class="{ 'pointer-events-none opacity-40': !innerValue }"
              @click.stop="clearSelection(updateValue, togglePopover)"
            >
              清除
            </button>
          </div>
        </div>
      </template>
    </VDatePicker>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useMediaQuery } from "@vueuse/core";
import { ChevronDownIcon } from "@heroicons/vue/24/outline";

type UpdateFn = (value: unknown) => void;

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    placeholder?: string;
    min?: string;
    max?: string;
  }>(),
  {
    modelValue: undefined,
    placeholder: "选择日期",
    min: undefined,
    max: undefined
  }
);

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();

const isMobile = useMediaQuery("(max-width: 640px)");

const innerValue = computed<string | null>({
  get: () => (props.modelValue && props.modelValue.trim().length ? props.modelValue : null),
  set: (value) => {
    emit("update:modelValue", value ?? "");
  }
});

const modelConfig = { type: "string", mask: "YYYY-MM-DD" } as const;
const masks = { input: "YYYY年M月D日" } as const;
const locale = computed(() => ({
  id: "zh-CN",
  firstDayOfWeek: 1
}));

const minDate = computed(() => parseISO(props.min));
const maxDate = computed(() => parseISO(props.max));

const popoverOptions = computed(() => ({
  placement: "bottom-start",
  visibility: isMobile.value ? "click" : "hover-focus",
  contentClass: isMobile.value ? "vc-popover--sheet" : "vc-popover--surface"
}));

const selectedLabel = computed(() => {
  const value = innerValue.value;
  if (!value) return "";
  const date = parseISO(value);
  if (!date) return "";
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(date);
});

const helperLabel = computed(() => {
  const value = innerValue.value;
  if (!value) return "";
  const date = parseISO(value);
  if (!date) return "";
  return new Intl.DateTimeFormat("zh-CN", { weekday: "long" }).format(date);
});

function selectToday(updateValue: UpdateFn, togglePopover: () => void) {
  updateValue(formatISO(new Date()));
  togglePopover();
}

function clearSelection(updateValue: UpdateFn, togglePopover: () => void) {
  if (!innerValue.value) {
    togglePopover();
    return;
  }
  updateValue(null);
  togglePopover();
}

function parseISO(value?: string) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map((part) => Number.parseInt(part, 10));
  if (!year || !month || !day) return null;
  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function formatISO(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
</script>

<style scoped>
 :deep(.vc-popover--surface) {
  border-radius: 1.5rem;
  background-color: rgb(var(--surface));
  box-shadow: 0 12px 24px rgba(17, 24, 39, 0.14);
  border: 1px solid rgba(var(--outline), 0.3);
}

:deep(.vc-popover--sheet) {
  width: 100vw;
  max-width: none;
  border-radius: 1.5rem 1.5rem 0 0;
  background-color: rgb(var(--surface));
  box-shadow: 0 -8px 32px rgba(17, 24, 39, 0.18);
  border: 1px solid rgba(var(--outline), 0.2);
}
</style>
