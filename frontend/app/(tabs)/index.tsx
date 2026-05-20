import { Redirect } from 'expo-router';

export default function TabsIndex() {
  // Default tab: Register Expense (fricción cero)
  return <Redirect href="/register" />;
}
