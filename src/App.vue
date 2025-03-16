<script setup lang="ts">
import AppHeader from './components/AppHeader.vue'
import AppMain from './components/AppMain.vue'
import AppFooter from './components/AppFooter.vue'
</script>

<template>
  <div id="wrapper">
    <AppHeader id="header" />
    <AppMain id="main" />
    <AppFooter id="footer" />
  </div>
</template>

<style scoped>
#wrapper {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

#header {
  position: sticky;
}

#header,
#footer {
  background: var(--color-background);
}

#header {
  top: 0;
}

#footer {
  padding-top: 1rem;
}

#main {
  overflow-y: scroll;
}
</style>
