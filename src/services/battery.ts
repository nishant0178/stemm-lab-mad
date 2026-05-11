import * as Battery from 'expo-battery';

export type BatteryInfo = {
  level: number;       // 0–1, or -1 if unavailable
  state: Battery.BatteryState;
};

export async function getBatteryLevel(): Promise<number> {
  return Battery.getBatteryLevelAsync();
}

export async function getBatteryState(): Promise<Battery.BatteryState> {
  return Battery.getBatteryStateAsync();
}

export function subscribeBatteryUpdates(
  onUpdate: (info: Partial<BatteryInfo>) => void,
): () => void {
  const levelSub = Battery.addBatteryLevelListener(({ batteryLevel }) => {
    onUpdate({ level: batteryLevel });
  });
  const stateSub = Battery.addBatteryStateListener(({ batteryState }) => {
    onUpdate({ state: batteryState });
  });
  return () => {
    levelSub.remove();
    stateSub.remove();
  };
}

export function batteryStateLabel(state: Battery.BatteryState): string {
  switch (state) {
    case Battery.BatteryState.CHARGING:   return 'Charging';
    case Battery.BatteryState.FULL:       return 'Full';
    case Battery.BatteryState.UNPLUGGED:  return 'Unplugged';
    default:                              return 'Unknown';
  }
}

export function batteryStateIcon(state: Battery.BatteryState): string {
  switch (state) {
    case Battery.BatteryState.CHARGING:   return 'battery-charging';
    case Battery.BatteryState.FULL:       return 'battery-full';
    case Battery.BatteryState.UNPLUGGED:  return 'battery-half';
    default:                              return 'battery-dead';
  }
}
