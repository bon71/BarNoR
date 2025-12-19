export function buildTestID(screen: string, element?: string): string {
  return element ? `${screen}-${element}` : screen;
}
