<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { createChart, LineSeries, type IChartApi, ColorType, type LineData, type Time, type ISeriesApi } from 'lightweight-charts';
  import type { TimeSeriesPoint } from '../api';

  export let data: TimeSeriesPoint[] = [];
  export let variables: string[] = [];
  export let displayNames: Record<string, string> = {};
  export let height = 400;

  function getDisplayName(key: string): string {
    return displayNames[key] || key.replace(/^:/, '');
  }

  let chartContainer: HTMLDivElement;
  let chart: IChartApi | null = null;
  let series: Map<string, ISeriesApi<any>> = new Map();

  const colors = [
    '#2962FF', '#FF6D00', '#2E7D32', '#C62828', '#6A1B9A',
    '#00838F', '#EF6C00', '#1565C0', '#AD1457', '#00695C',
  ];

  function getColor(index: number): string {
    return colors[index % colors.length];
  }

  function initChart() {
    if (!chartContainer) return;

    chart = createChart(chartContainer, {
      width: chartContainer.clientWidth,
      height,
      layout: {
        background: { type: ColorType.Solid, color: '#1a1a2e' },
        textColor: '#d1d5db',
      },
      grid: {
        vertLines: { color: '#2d2d44' },
        horzLines: { color: '#2d2d44' },
      },
      timeScale: {
        borderColor: '#4a4a6a',
        timeVisible: false,
      },
      rightPriceScale: {
        borderColor: '#4a4a6a',
      },
      crosshair: {
        mode: 1,
      },
    });

    // Handle resize
    const resizeObserver = new ResizeObserver(() => {
      if (chart && chartContainer) {
        chart.applyOptions({ width: chartContainer.clientWidth });
      }
    });
    resizeObserver.observe(chartContainer);
  }

  function updateChart() {
    if (!chart || data.length === 0) return;

    // Remove old series
    for (const [name, s] of series) {
      if (!variables.includes(name)) {
        chart.removeSeries(s);
        series.delete(name);
      }
    }

    // Add/update series for each variable
    variables.forEach((varName, i) => {
      let lineSeries = series.get(varName);

      if (!lineSeries) {
        lineSeries = chart!.addSeries(LineSeries, {
          color: getColor(i),
          lineWidth: 2,
          title: getDisplayName(varName),
        });
        series.set(varName, lineSeries);
      }

      // Convert data to lightweight-charts format
      // Use actual simulation time from data points
      const lineData: LineData[] = data.map((point) => ({
        time: Math.round(point.t * 1000) as Time, // Convert to milliseconds for better precision
        value: point[varName] ?? 0,
      }));

      lineSeries.setData(lineData);
    });

    chart.timeScale().fitContent();
  }

  onMount(() => {
    initChart();
  });

  onDestroy(() => {
    if (chart) {
      chart.remove();
      chart = null;
    }
  });

  $: if (chart && (data || variables)) {
    updateChart();
  }
</script>

<div class="chart-wrapper">
  <div bind:this={chartContainer} class="chart-container"></div>
  {#if variables.length > 0}
    <div class="legend">
      {#each variables as varName, i}
        <span class="legend-item">
          <span class="legend-color" style="background-color: {getColor(i)}"></span>
          {getDisplayName(varName)}
        </span>
      {/each}
    </div>
  {/if}
</div>

<style>
  .chart-wrapper {
    width: 100%;
    background: #1a1a2e;
    border-radius: 8px;
    overflow: hidden;
  }

  .chart-container {
    width: 100%;
  }

  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    padding: 0.75rem 1rem;
    background: #16162a;
    border-top: 1px solid #2d2d44;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
    color: #d1d5db;
  }

  .legend-color {
    width: 12px;
    height: 3px;
    border-radius: 1px;
  }
</style>
