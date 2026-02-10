<script setup lang="ts">
const adminStore = useAdminStore()
const keywordsStore = useKeywordsStore()
const toast = useToast()

// Auth
const secretKeyInput = ref('')
const verifying = ref(false)

async function handleVerify() {
  const key = secretKeyInput.value.trim()
  if (!key) return
  verifying.value = true
  const ok = await adminStore.verify(key)
  verifying.value = false
  if (ok) {
    toast.add({ title: 'Admin access granted', color: 'green', icon: 'i-heroicons-check-circle' })
    keywordsStore.fetch()
  } else {
    toast.add({ title: 'Invalid secret key', color: 'red', icon: 'i-heroicons-x-circle' })
    secretKeyInput.value = ''
  }
}

// Keywords management
const newKeyword = ref('')
const newGroupName = ref('')
const adding = ref(false)
const deleteModalOpen = ref(false)
const keywordToDelete = ref<{ id: number; keyword: string } | null>(null)

// Compute unique group names for autocomplete suggestions
const existingGroups = computed(() => {
  const groups = new Set<string>()
  for (const kw of keywordsStore.keywords) {
    if (kw.groupName) groups.add(kw.groupName)
  }
  return Array.from(groups)
})

onMounted(() => {
  if (adminStore.authenticated) {
    keywordsStore.fetch()
  }
})

async function addKeyword() {
  const kw = newKeyword.value.trim()
  if (!kw) return

  // Check for duplicates
  if (keywordsStore.keywords.some((k) => k.keyword.toLowerCase() === kw.toLowerCase())) {
    toast.add({ title: `"${kw}" already exists`, color: 'amber', icon: 'i-heroicons-exclamation-triangle' })
    return
  }

  adding.value = true
  try {
    const group = newGroupName.value.trim() || undefined
    await keywordsStore.create(kw, group)
    newKeyword.value = ''
    newGroupName.value = ''
    toast.add({ title: `Added "${kw}"`, color: 'green', icon: 'i-heroicons-check-circle' })
  } catch {
    toast.add({ title: 'Failed to add keyword', color: 'red', icon: 'i-heroicons-x-circle' })
  } finally {
    adding.value = false
  }
}

async function toggleKeyword(id: number) {
  try {
    const updated = await keywordsStore.toggle(id)
    toast.add({
      title: `"${updated.keyword}" ${updated.isActive ? 'activated' : 'deactivated'}`,
      color: 'green',
      icon: 'i-heroicons-check-circle',
    })
  } catch {
    toast.add({ title: 'Failed to toggle keyword', color: 'red', icon: 'i-heroicons-x-circle' })
  }
}

function confirmDelete(id: number, keyword: string) {
  keywordToDelete.value = { id, keyword }
  deleteModalOpen.value = true
}

async function deleteKeyword() {
  if (!keywordToDelete.value) return
  try {
    await keywordsStore.remove(keywordToDelete.value.id)
    toast.add({
      title: `Deleted "${keywordToDelete.value.keyword}"`,
      color: 'green',
      icon: 'i-heroicons-check-circle',
    })
  } catch {
    toast.add({ title: 'Failed to delete keyword', color: 'red', icon: 'i-heroicons-x-circle' })
  } finally {
    deleteModalOpen.value = false
    keywordToDelete.value = null
  }
}

const columns = [
  { key: 'keyword', label: 'Keyword' },
  { key: 'groupName', label: 'Group' },
  { key: 'isActive', label: 'Status' },
  { key: 'createdAt', label: 'Created' },
  { key: 'actions', label: 'Actions' },
]

useSeoMeta({
  title: 'Keywords - Nostr Watch',
})
</script>

<template>
  <div>
    <!-- Auth gate -->
    <div v-if="!adminStore.authenticated" class="max-w-md mx-auto mt-20">
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-lock-closed" class="w-5 h-5 text-primary-500" />
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Admin Access Required</h2>
          </div>
        </template>
        <p class="text-sm text-gray-500 mb-4">Enter the admin secret key to manage keywords.</p>
        <div class="flex gap-2">
          <UInput
            v-model="secretKeyInput"
            type="password"
            placeholder="Secret key..."
            icon="i-heroicons-key"
            class="flex-1"
            @keyup.enter="handleVerify"
          />
          <UButton
            label="Verify"
            :loading="verifying"
            :disabled="!secretKeyInput.trim()"
            @click="handleVerify"
          />
        </div>
      </UCard>
    </div>

    <!-- Admin content -->
    <div v-else>
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Keyword Management</h1>
        <UButton
          label="Logout"
          icon="i-heroicons-arrow-right-on-rectangle"
          variant="ghost"
          color="gray"
          size="xs"
          @click="adminStore.logout()"
        />
      </div>

      <!-- Add keyword form -->
      <div class="flex flex-wrap gap-2 mb-6">
        <UInput
          v-model="newKeyword"
          placeholder="Keyword..."
          icon="i-heroicons-tag"
          size="md"
          class="w-48"
          @keyup.enter="addKeyword"
        />
        <UInput
          v-model="newGroupName"
          placeholder="Group (optional)..."
          icon="i-heroicons-folder"
          size="md"
          class="w-48"
          :list="existingGroups.length ? 'group-suggestions' : undefined"
          @keyup.enter="addKeyword"
        />
        <datalist v-if="existingGroups.length" id="group-suggestions">
          <option v-for="g in existingGroups" :key="g" :value="g" />
        </datalist>
        <UButton
          label="Add Keyword"
          icon="i-heroicons-plus"
          :loading="adding"
          :disabled="!newKeyword.trim()"
          @click="addKeyword"
        />
      </div>

      <!-- Keywords table -->
      <UCard>
        <UTable
          :columns="columns"
          :rows="keywordsStore.keywords"
          :loading="keywordsStore.loading"
        >
          <template #keyword-data="{ row }">
            <span class="font-medium text-gray-900 dark:text-white">{{ row.keyword }}</span>
          </template>

          <template #groupName-data="{ row }">
            <UBadge v-if="row.groupName" color="blue" variant="subtle" size="xs">
              {{ row.groupName }}
            </UBadge>
            <span v-else class="text-sm text-gray-400">-</span>
          </template>

          <template #isActive-data="{ row }">
            <UBadge
              :color="row.isActive ? 'green' : 'gray'"
              variant="subtle"
              size="xs"
            >
              {{ row.isActive ? 'Active' : 'Inactive' }}
            </UBadge>
          </template>

          <template #createdAt-data="{ row }">
            <span class="text-sm text-gray-500">
              {{ new Date(row.createdAt).toLocaleDateString() }}
            </span>
          </template>

          <template #actions-data="{ row }">
            <div class="flex items-center gap-1">
              <UTooltip :text="row.isActive ? 'Deactivate' : 'Activate'">
                <UButton
                  :icon="row.isActive ? 'i-heroicons-pause' : 'i-heroicons-play'"
                  variant="ghost"
                  :color="row.isActive ? 'amber' : 'green'"
                  size="xs"
                  @click="toggleKeyword(row.id)"
                />
              </UTooltip>
              <UTooltip text="Delete">
                <UButton
                  icon="i-heroicons-trash"
                  variant="ghost"
                  color="red"
                  size="xs"
                  @click="confirmDelete(row.id, row.keyword)"
                />
              </UTooltip>
            </div>
          </template>
        </UTable>

        <!-- Empty state -->
        <div v-if="!keywordsStore.loading && !keywordsStore.keywords.length" class="text-center py-12">
          <UIcon name="i-heroicons-tag" class="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p class="text-gray-500 mb-2">No keywords yet</p>
          <p class="text-sm text-gray-400">Add keywords above to start tracking nostr events</p>
        </div>
      </UCard>

      <!-- Delete confirmation modal -->
      <UModal v-model="deleteModalOpen">
        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Delete Keyword</h3>
          </template>
          <p class="text-gray-600 dark:text-gray-400">
            Are you sure you want to delete "<strong>{{ keywordToDelete?.keyword }}</strong>"?
            This will not remove already crawled events.
          </p>
          <template #footer>
            <div class="flex justify-end gap-2">
              <UButton
                label="Cancel"
                variant="ghost"
                color="gray"
                @click="deleteModalOpen = false"
              />
              <UButton
                label="Delete"
                color="red"
                @click="deleteKeyword"
              />
            </div>
          </template>
        </UCard>
      </UModal>
    </div>
  </div>
</template>
