<script lang="ts">
  import favicon from '$lib/assets/favicon.svg';

  let { children } = $props();
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

{@render children()}

<style>
  :global(*), :global(*::before), :global(*::after) {
    box-sizing: border-box;
  }

  :global(:root) {
    color-scheme: dark;
  }
</style>
