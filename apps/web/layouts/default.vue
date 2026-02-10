<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
    <AppHeader />
    <main class="flex-1">
      <UContainer class="py-6">
        <slot />
      </UContainer>
    </main>
  </div>
</template>
