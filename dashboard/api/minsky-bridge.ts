// Bridge to Minsky C++ backend via native addon

import type { Variable, SimulationState, TimeSeriesPoint } from './types';

const ADDON_PATH = '/home/qubeo/prog/minsky-dev/minsky/gui-js/build/minskyRESTService.node';

let addon: MinskyAddon | null = null;

interface MinskyAddon {
  call(command: string, args: string): string | Promise<string>;
}

function getAddon(): MinskyAddon {
  if (!addon) {
    addon = require(ADDON_PATH) as MinskyAddon;
  }
  return addon;
}

/** Call Minsky backend synchronously */
function callSync(command: string, ...args: unknown[]): unknown {
  const addon = getAddon();
  const argsJson = args.length === 0 ? '[]' :
                   args.length === 1 ? JSON.stringify(args[0]) :
                   JSON.stringify(args);
  const result = addon.call(`${command}.$sync`, argsJson);
  return JSON.parse(result as string);
}

/** Minsky API wrapper */
export const minsky = {
  version(): string {
    return callSync('minsky.minskyVersion') as string;
  },

  load(path: string): void {
    callSync('minsky.load', path);
  },

  save(path: string): void {
    callSync('minsky.save', path);
  },

  reset(): void {
    callSync('minsky.reset');
  },

  step(): void {
    callSync('minsky.step');
  },

  /** Get current simulation time */
  t(): number {
    return callSync('minsky.t') as number;
  },

  /** Set simulation time */
  setT(t: number): void {
    callSync('minsky.t', t);
  },

  /** Get step min */
  stepMin(): number {
    return callSync('minsky.stepMin') as number;
  },

  /** Get step max */
  stepMax(): number {
    return callSync('minsky.stepMax') as number;
  },

  /** Get number of steps */
  nSteps(): number {
    return callSync('minsky.nSteps') as number;
  },

  /** Get all variable names */
  variableNames(): string[] {
    const keys = callSync('minsky.variableValues.@keys') as string[];
    // Filter out internal wiring variables (numeric prefix like "993733488:0")
    // Keep: ":Investment", "constant:one", "stock:K", etc.
    return keys.filter(k => {
      const prefix = k.split(':')[0];
      // If prefix is a number, it's internal wiring - filter it out
      return prefix === '' || isNaN(Number(prefix));
    });
  },

  /** Get variable value by name */
  variableValue(name: string): number {
    try {
      // Variable values are accessed via variableValues[name].value()
      return callSync(`minsky.variableValues.@elem."${name}".value`) as number;
    } catch {
      return NaN;
    }
  },

  /** Parse display name from full variable key */
  parseVarName(key: string): { displayName: string; type: Variable['type'] } {
    // Patterns:
    // ":Investment" -> displayName="Investment", type=flow
    // "constant:one" -> displayName="one", type=constant
    // "stock:K" -> displayName="K", type=stock
    // "parameter:rate" -> displayName="rate", type=parameter
    const colonIdx = key.indexOf(':');
    if (colonIdx === -1) {
      return { displayName: key, type: 'flow' };
    }

    const prefix = key.substring(0, colonIdx);
    const name = key.substring(colonIdx + 1);

    if (prefix === '') {
      // ":Name" format - regular variable
      return { displayName: name, type: 'flow' };
    }

    // "type:name" format
    let type: Variable['type'] = 'flow';
    if (prefix === 'stock') type = 'stock';
    else if (prefix === 'parameter') type = 'parameter';
    else if (prefix === 'constant') type = 'constant';

    return { displayName: name, type };
  },

  /** Get all variables with values */
  variables(): Variable[] {
    const keys = this.variableNames();
    return keys.map(key => {
      const { displayName, type } = this.parseVarName(key);
      return {
        name: key,  // Keep full key for API lookups
        displayName,
        value: this.variableValue(key),
        type,
      };
    });
  },

  /** Run simulation for n steps and collect time series */
  run(nSteps: number, variables?: string[]): TimeSeriesPoint[] {
    const varsToTrack = variables || this.variableNames().slice(0, 10); // Limit default
    const history: TimeSeriesPoint[] = [];

    for (let i = 0; i < nSteps; i++) {
      const point: TimeSeriesPoint = { t: this.t() };
      for (const v of varsToTrack) {
        point[v] = this.variableValue(v);
      }
      history.push(point);
      this.step();
    }

    // Add final point
    const finalPoint: TimeSeriesPoint = { t: this.t() };
    for (const v of varsToTrack) {
      finalPoint[v] = this.variableValue(v);
    }
    history.push(finalPoint);

    return history;
  },

  /** Get simulation state */
  state(): SimulationState {
    return {
      t: this.t(),
      running: false, // We don't track running state yet
      stepMin: this.stepMin(),
      stepMax: this.stepMax(),
      nSteps: this.nSteps(),
    };
  },
};
