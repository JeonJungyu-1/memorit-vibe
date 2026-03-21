import AsyncStorage from '@react-native-async-storage/async-storage';

const MONTHLY_BUDGET_KEY = 'memorit_fluid_monthly_budget_goal_krw';

/**
 * 월간 예산 목표(원). 미설정 시 0.
 */
export async function getMonthlyBudgetGoalKrw(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(MONTHLY_BUDGET_KEY);
    if (raw == null || raw === '') return 0;
    const n = Number(raw);
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
  } catch {
    return 0;
  }
}

export async function setMonthlyBudgetGoalKrw(amount: number): Promise<void> {
  const n = Math.max(0, Math.floor(amount));
  await AsyncStorage.setItem(MONTHLY_BUDGET_KEY, String(n));
}
