import pluginVue from 'eslint-plugin-vue'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'
import type { TSESLint } from '@typescript-eslint/utils'

type ConfigItem = TSESLint.FlatConfig.Config

// To allow more languages other than `ts` in `.vue` files, uncomment the following lines:
// import { configureVueProject } from '@vue/eslint-config-typescript'
// configureVueProject({ scriptLangs: ['ts', 'tsx'] })
// More info at https://github.com/vuejs/eslint-config-typescript/#advanced-setup

export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{ts,mts,tsx,vue}'],
  },

  {
    name: 'app/files-to-ignore',
    ignores: ['**/dist/**', '**/dist-ssr/**', '**/coverage/**'],
  },

  // Cast needed: eslint-plugin-vue and eslint-config-prettier use core ESLint
  // types that are structurally compatible but nominally incompatible with
  // @typescript-eslint's FlatConfig types (EcmaVersion mismatch).
  ...(pluginVue.configs['flat/essential'] as ConfigItem[]),
  vueTsConfigs.recommended,
  skipFormatting as ConfigItem,
)
