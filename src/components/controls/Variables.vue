<template>
	<n-tabs justify-content="space-evenly" animated>
		<n-tab-pane name="plants">
      <template #tab>
        <n-tooltip trigger="hover">
          <template #trigger>
            <n-icon size="28">
              <component :is="LeafTwo24Regular" />
            </n-icon>
          </template>
          <span>Plants</span>
        </n-tooltip>
      </template>

			<n-form label-placement="left">
				<n-form-item label="Other Growth Rate">
					<n-input-number :show-button="false" :value="50">
						<template #suffix>%</template>
					</n-input-number>
				</n-form-item>
			</n-form>

    </n-tab-pane>
		<n-tab-pane name="herbivores">
      <template #tab>
        <n-tooltip trigger="hover">
          <template #trigger>
            <n-icon size="28">
              <component :is="AnimalRabbit24Regular" />
            </n-icon>
          </template>
          <span>Herbivores</span>
        </n-tooltip>
      </template>
    </n-tab-pane>
		<n-tab-pane name="carnivores">
      <template #tab>
        <n-tooltip trigger="hover">
          <template #trigger>
            <n-icon size="28">
              <component :is="AnimalCat24Regular" />
            </n-icon>
          </template>
          <span>Carnivores</span>
        </n-tooltip>
      </template>
    </n-tab-pane>
	</n-tabs>
</template>
<script setup lang="ts">
import { AnimalCat24Regular, AnimalRabbit24Regular, LeafTwo24Regular } from '@vicons/fluent';

</script>
