<template>
  <div class="relative flex h-screen flex-col bg-surface">
    <div
      class="pointer-events-none absolute inset-x-0 top-[-240px] h-[480px] bg-[radial-gradient(circle_at_top,_rgba(90,103,255,0.25),_transparent_60%)]"
    />

    <header class="relative z-30">
      <slot name="header" />
    </header>

    <main class="relative z-20 flex-1 overflow-y-auto">
      <div class="mx-auto flex w-full max-w-5xl flex-col px-5 pb-32 pt-6 sm:pb-16">
        <slot />
      </div>
    </main>

    <div class="fixed bottom-0 left-0 right-0 z-40 sm:hidden">
      <slot name="mobile-nav" />
    </div>
  </div>
</template>
