<template>
  <n-space justify="end" style="padding: 5px;">
    <n-tooltip placement="top" trigger="hover">
      <template #trigger>
        <n-button strong circle>
          <template #icon>
            <n-icon><about-icon /></n-icon>
          </template>
        </n-button>
      </template>
      <span>About</span>
    </n-tooltip>
    <n-tooltip placement="top" trigger="hover">
      <template #trigger>
        <n-button strong circle>
          <template #icon>
            <n-icon><version-icon /></n-icon>
          </template>
        </n-button>
      </template>
      <span>Version History</span>
    </n-tooltip>
    <n-tooltip placement="top" trigger="hover">
      <template #trigger>
        <n-button strong circle @click="switchTheme">
          <template #icon>
            <n-icon>
              <light-mode-icon v-if="!lightMode" />
              <dark-mode-icon v-if="lightMode" />
            </n-icon>
          </template>
        </n-button>
      </template>
      <span>{{ otherThemeName }}</span>
    </n-tooltip>
    <n-tooltip placement="top" trigger="hover">
      <template #trigger>
        <n-button strong circle>
          <template #icon>
            <n-icon><pause-icon /></n-icon>
          </template>
        </n-button>
      </template>
      <span>Pause</span>
    </n-tooltip>
    <n-tooltip placement="top" trigger="hover">
      <template #trigger>
        <n-button strong circle>
          <template #icon>
            <n-icon><import-icon /></n-icon>
          </template>
        </n-button>
      </template>
      <span>Import</span>
    </n-tooltip>
    <n-tooltip placement="top" trigger="hover">
      <template #trigger>
        <n-button strong circle>
          <template #icon>
            <n-icon><export-icon /></n-icon>
          </template>
        </n-button>
      </template>
      <span>Export</span>
    </n-tooltip>
    <n-tooltip placement="top" trigger="hover">
      <template #trigger>
        <n-button strong circle>
          <template #icon>
            <n-icon><restart-icon /></n-icon>
          </template>
        </n-button>
      </template>
      <span>Restart</span>
    </n-tooltip>
  </n-space>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { QuestionOutlined as AboutIcon, PauseOutlined as PauseIcon } from '@vicons/antd';
import { IosGitBranch as VersionIcon } from '@vicons/ionicons4';
import {
  DarkModeOutlined as DarkModeIcon,
  FileUploadOutlined as ImportIcon,
  LightModeOutlined as LightModeIcon,
  RestartAltOutlined as RestartIcon,
  SaveOutlined as ExportIcon
} from '@vicons/material';
import { NButton, NIcon, NSpace, NTooltip } from 'naive-ui';
import useTheme from '../../composables/useTheme';

const { lightMode, switchTheme } = useTheme();

const otherThemeName = computed(() => (lightMode.value ? 'Dark Mode' : 'Light Mode'));
</script>
