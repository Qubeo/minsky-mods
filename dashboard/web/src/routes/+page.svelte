<script lang="ts">
  import { onMount } from 'svelte';
  import { api, type Variable, type TimeSeriesPoint } from '$lib/api';
  import TimeSeriesChart from '$lib/components/TimeSeriesChart.svelte';
  import {
    modelPath,
    modelLoaded,
    variables,
    simState,
    history,
    selectedVariables,
    apiError,
    loading,
  } from '$lib/stores';

  let version = '';
  let stepsToRun = 100;
  let modelPathInput = '/home/qubeo/prog/minsky-dev/minsky/examples/GoodwinLinear02.mky';

  onMount(async () => {
    try {
      version = await api.getVersion();
    } catch (e) {
      $apiError = 'Cannot connect to API server. Make sure it is running on localhost:3000';
    }
  });

  async function loadModel() {
    $loading = true;
    $apiError = null;
    try {
      await api.loadModel(modelPathInput);
      $modelPath = modelPathInput;
      $modelLoaded = true;

      // Fetch variables and state
      $variables = await api.getVariables();
      $simState = await api.getState();

      // Auto-select first few numeric variables
      $selectedVariables = $variables
        .filter((v) => v.value != null && !isNaN(v.value) && isFinite(v.value))
        .slice(0, 5)
        .map((v) => v.name);

      $history = [];
    } catch (e) {
      $apiError = e instanceof Error ? e.message : 'Failed to load model';
    } finally {
      $loading = false;
    }
  }

  async function reset() {
    $loading = true;
    try {
      await api.reset();
      $simState = await api.getState();
      $variables = await api.getVariables();
      $history = [];
    } catch (e) {
      $apiError = e instanceof Error ? e.message : 'Reset failed';
    } finally {
      $loading = false;
    }
  }

  async function step() {
    $loading = true;
    try {
      await api.step();
      $simState = await api.getState();
      $variables = await api.getVariables();
    } catch (e) {
      $apiError = e instanceof Error ? e.message : 'Step failed';
    } finally {
      $loading = false;
    }
  }

  async function run() {
    $loading = true;
    try {
      const result = await api.run(stepsToRun, $selectedVariables);
      $history = result.history;
      $simState = await api.getState();
      $variables = await api.getVariables();
    } catch (e) {
      $apiError = e instanceof Error ? e.message : 'Run failed';
    } finally {
      $loading = false;
    }
  }

  function toggleVariable(name: string) {
    if ($selectedVariables.includes(name)) {
      $selectedVariables = $selectedVariables.filter((v) => v !== name);
    } else {
      $selectedVariables = [...$selectedVariables, name];
    }
  }

  // Create display name mapping for chart
  $: displayNames = Object.fromEntries(
    $variables.map((v) => [v.name, v.displayName])
  );
</script>

<svelte:head>
  <title>Minsky Dashboard</title>
</svelte:head>

<main>
  <header>
    <h1>Minsky Dashboard</h1>
    {#if version}
      <span class="version">v{version}</span>
    {/if}
  </header>

  {#if $apiError}
    <div class="error">{$apiError}</div>
  {/if}

  <section class="controls">
    <div class="model-loader">
      <input
        type="text"
        bind:value={modelPathInput}
        placeholder="Path to .mky file"
        disabled={$loading}
      />
      <button onclick={loadModel} disabled={$loading}>
        {$loading ? 'Loading...' : 'Load Model'}
      </button>
    </div>

    {#if $modelLoaded}
      <div class="sim-controls">
        <button onclick={reset} disabled={$loading}>Reset</button>
        <button onclick={step} disabled={$loading}>Step</button>
        <input type="number" bind:value={stepsToRun} min="1" max="10000" />
        <button onclick={run} disabled={$loading} class="primary">
          Run {stepsToRun} steps
        </button>
      </div>

      {#if $simState}
        <div class="state-info">
          <span>t = {$simState.t.toFixed(4)}</span>
        </div>
      {/if}
    {/if}
  </section>

  {#if $modelLoaded}
    <div class="dashboard-grid">
      <section class="chart-section">
        <h2>Time Series</h2>
        {#if $history.length > 0}
          <TimeSeriesChart data={$history} variables={$selectedVariables} {displayNames} height={450} />
        {:else}
          <div class="placeholder">Run simulation to see time series data</div>
        {/if}
      </section>

      <aside class="variables-panel">
        <h2>Variables</h2>
        <div class="variable-list">
          {#each $variables as v}
            <label class="variable-item" class:selected={$selectedVariables.includes(v.name)}>
              <input
                type="checkbox"
                checked={$selectedVariables.includes(v.name)}
                onchange={() => toggleVariable(v.name)}
              />
              <span class="var-name" title={v.name}>{v.displayName}</span>
              <span class="var-type">{v.type}</span>
              <span class="var-value">{v.value != null && isFinite(v.value) ? v.value.toFixed(4) : 'N/A'}</span>
            </label>
          {/each}
        </div>
      </aside>
    </div>
  {:else}
    <div class="welcome">
      <p>Load a Minsky model (.mky file) to get started.</p>
      <p class="hint">
        Example models are in <code>minsky/examples/</code>
      </p>
    </div>
  {/if}
</main>

<style>
  :global(body) {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #0f0f1a;
    color: #e0e0e0;
  }

  main {
    max-width: 1400px;
    margin: 0 auto;
    padding: 1rem 2rem;
  }

  header {
    display: flex;
    align-items: baseline;
    gap: 1rem;
    margin-bottom: 1.5rem;
    border-bottom: 1px solid #2d2d44;
    padding-bottom: 1rem;
  }

  h1 {
    margin: 0;
    font-size: 1.75rem;
    font-weight: 600;
  }

  .version {
    color: #888;
    font-size: 0.9rem;
  }

  h2 {
    margin: 0 0 1rem;
    font-size: 1.1rem;
    font-weight: 500;
    color: #aaa;
  }

  .error {
    background: #4a1515;
    border: 1px solid #7a2020;
    color: #ff8080;
    padding: 0.75rem 1rem;
    border-radius: 6px;
    margin-bottom: 1rem;
  }

  .controls {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  .model-loader {
    display: flex;
    gap: 0.5rem;
    flex: 1;
    min-width: 300px;
  }

  .model-loader input {
    flex: 1;
    padding: 0.6rem 0.75rem;
    border: 1px solid #3d3d5c;
    border-radius: 6px;
    background: #1a1a2e;
    color: #e0e0e0;
    font-size: 0.9rem;
  }

  .sim-controls {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .sim-controls input[type='number'] {
    width: 80px;
    padding: 0.6rem 0.5rem;
    border: 1px solid #3d3d5c;
    border-radius: 6px;
    background: #1a1a2e;
    color: #e0e0e0;
    text-align: center;
  }

  button {
    padding: 0.6rem 1rem;
    border: 1px solid #3d3d5c;
    border-radius: 6px;
    background: #252540;
    color: #e0e0e0;
    cursor: pointer;
    font-size: 0.9rem;
    transition: background 0.15s;
  }

  button:hover:not(:disabled) {
    background: #353560;
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  button.primary {
    background: #2962ff;
    border-color: #2962ff;
  }

  button.primary:hover:not(:disabled) {
    background: #1e50d9;
  }

  .state-info {
    font-family: monospace;
    font-size: 0.95rem;
    color: #88f;
    padding: 0.5rem 1rem;
    background: #1a1a2e;
    border-radius: 6px;
  }

  .dashboard-grid {
    display: grid;
    grid-template-columns: 1fr 280px;
    gap: 1.5rem;
  }

  .chart-section {
    background: #16162a;
    border-radius: 8px;
    padding: 1rem;
  }

  .placeholder {
    height: 400px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #666;
    background: #1a1a2e;
    border-radius: 8px;
  }

  .variables-panel {
    background: #16162a;
    border-radius: 8px;
    padding: 1rem;
    max-height: 550px;
    overflow-y: auto;
  }

  .variable-list {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .variable-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.4rem 0.5rem;
    border-radius: 4px;
    cursor: pointer;
    transition: background 0.1s;
  }

  .variable-item:hover {
    background: #252540;
  }

  .variable-item.selected {
    background: #1e3a5f;
  }

  .variable-item input {
    accent-color: #2962ff;
  }

  .var-name {
    flex: 1;
    font-size: 0.85rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .var-type {
    font-size: 0.7rem;
    padding: 0.1rem 0.3rem;
    border-radius: 3px;
    background: #2d2d44;
    color: #888;
    text-transform: uppercase;
  }

  .var-value {
    font-family: monospace;
    font-size: 0.8rem;
    color: #8a8;
  }

  .welcome {
    text-align: center;
    padding: 4rem 2rem;
    color: #888;
  }

  .welcome p {
    margin: 0.5rem 0;
  }

  .hint {
    font-size: 0.9rem;
  }

  code {
    background: #252540;
    padding: 0.2rem 0.4rem;
    border-radius: 4px;
    font-size: 0.85rem;
  }

  @media (max-width: 900px) {
    .dashboard-grid {
      grid-template-columns: 1fr;
    }

    .variables-panel {
      max-height: 300px;
    }
  }
</style>
