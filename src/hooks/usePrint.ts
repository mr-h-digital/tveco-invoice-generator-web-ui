export function usePrint() {
  function print() {
    window.print();
  }
  return { print };
}
