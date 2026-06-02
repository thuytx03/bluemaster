function randomString(length: number): string {
  const chars =
    "abcdefghijklmnorstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890_".split("")
  return Array.from(
    { length },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join("")
}

function generateCquick(): string {
  const num = Math.floor(6 * Math.random()) + 10
  return "jsc_c_" + num.toString(36)
}

function generateRequest(): string {
  const num = Math.floor(6 * Math.random()) + 10
  return "1" + num.toString(36)
}

function generateUsid(): string {
  return `${randomString(8)}:${randomString(14)}:${Math.floor(Math.random() * 11)}-${randomString(14)}-RV=6:F=`
}

function generateDyn(): string {
  return `${randomString(44)}-${randomString(183)}-${randomString(18)}-${randomString(80)}`
}

function generateCsr(): string {
  return [60, 14, 228, 54, 215, 109, 229, 100]
    .map((n) => randomString(n))
    .join("-")
}

function makeId(): string {
  return Math.random().toString(36).slice(2, 11)
}

function generateRequestId(): string {
  const num = Math.floor(6 * Math.random()) + 10
  return "1" + num.toString(36)
}

function generateS(): string {
  const r = (n: number) =>
    Math.random()
      .toString(36)
      .slice(2, 2 + n)
  return `${r(6)}:${r(6)}:${r(6)}`
}

export {
  randomString,
  generateCquick,
  generateRequest,
  generateUsid,
  generateDyn,
  generateCsr,
  makeId,
  generateRequestId,
  generateS
}
