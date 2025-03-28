<template>
  <n-layout 
    position="absolute" 
    :native-scrollbar="false"
    content-style="height: 100%; display: flex; flex-direction: column"
  >
    <n-layout-header bordered style="padding-top: 5px">
      <game-header />
    </n-layout-header>

    <n-layout has-sider>
      <n-layout-sider
        bordered
        show-trigger
        collapse-mode="width"
        :collapsed-width="15"
        :collapsed="leftCollapsed"
        :width="245"
        :native-scrollbar="false"
        @collapse="() => handleCollapse('left')"
        @expand="() => handleExpand('left')"
      >
        <game-sidebar-left :collapsed="leftCollapsed" />
      </n-layout-sider>

      <n-layout has-sider sider-placement="right">
        <n-layout-content>
        </n-layout-content>

        <n-layout-sider
          bordered
          show-trigger
          collapse-mode="width"
          :collapsed-width="15"
          :collapsed="rightCollapsed"
          :width="245"
          :native-scrollbar="false"
          @collapse="() => handleCollapse('right')"
          @expand="() => handleExpand('right')"
        >
          <game-sidebar-right :collapsed="rightCollapsed"/>
        </n-layout-sider>
      </n-layout>
    </n-layout>

    <n-layout-footer bordered style="flex-shrink: 0">
      <game-footer />
    </n-layout-footer>
  </n-layout>
</template>

<script setup lang="ts">
  import { ref, watchEffect, onBeforeUnmount, onMounted } from 'vue';
  import GameFooter from './GameFooter.vue';
  import GameHeader from './GameHeader.vue';
  import GameSidebarRight from './GameSidebarRight.vue';
  import GameSidebarLeft from './GameSidebarLeft.vue';

  const leftCollapsed = ref(isSmallWindow());
  const rightCollapsed = ref(isSmallWindow());
  const isSmallScreen = ref(isSmallWindow());

  const handleExpand = (side: 'left' | 'right') => {
    if (side === 'left') {
      leftCollapsed.value = false;
      if (isSmallScreen.value) rightCollapsed.value = true;
    } else {
      rightCollapsed.value = false;
      if (isSmallScreen.value) leftCollapsed.value = true;
    }
  };

  const handleCollapse = (side: 'left' | 'right') => {
    if (side === 'left') {
      leftCollapsed.value = true;
    }
    else {
      rightCollapsed.value = true;
    }
  };

  const updateScreenSize = () => {
    const wasSmallScreen = isSmallScreen.value;
    isSmallScreen.value = window.innerWidth < 730;
    
    if (isSmallScreen.value && !wasSmallScreen) {
      rightCollapsed.value = true;
    }
  };

  function isSmallWindow() {
    return window.innerWidth < 730;
  }

  window.addEventListener('resize', updateScreenSize);

  onMounted(() => {
  });

  onBeforeUnmount(() => {
    window.removeEventListener('resize', updateScreenSize);
  });

  watchEffect(() => {
    updateScreenSize();
  });
</script>

<style scoped>
.n-layout-content {
  background-color: transparent !important;
}

.n-layout-header, .n-layout-footer {
  z-index: 2;
}
</style>
