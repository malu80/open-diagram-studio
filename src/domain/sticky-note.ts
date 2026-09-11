export function fittedStickyFontSize(fits: (size: number) => boolean): number {
  let minimum = 1
  let maximum = 20
  let result = minimum
  while (minimum <= maximum) {
    const candidate = Math.floor((minimum + maximum) / 2)
    if (fits(candidate)) {
      result = candidate
      minimum = candidate + 1
    } else {
      maximum = candidate - 1
    }
  }
  return result
}