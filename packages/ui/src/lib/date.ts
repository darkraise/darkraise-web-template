/**
 * Tiny native-Date formatter covering only the patterns DatePicker uses today
 * (PPP, LLL dd, y, yyyy-MM-dd, MMM d, yyyy, M/d/yyyy). Not a full date-fns
 * replacement — patterns outside this list fall through unchanged.
 */

const longMonths = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

const shortMonths = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
]

function pad(n: number, width = 2): string {
  return String(n).padStart(width, "0")
}

function ordinalSuffix(day: number): string {
  if (day % 100 >= 11 && day % 100 <= 13) return "th"
  switch (day % 10) {
    case 1:
      return "st"
    case 2:
      return "nd"
    case 3:
      return "rd"
    default:
      return "th"
  }
}

const TOKEN_PATTERN = /yyyy|yy|MMMM|MMM|MM|M|dd|d|Do|LLLL|LLL|y|PPP/g

function tokenToString(token: string, date: Date): string {
  switch (token) {
    case "yyyy":
      return String(date.getFullYear())
    case "yy":
      return String(date.getFullYear()).slice(-2)
    case "y":
      return String(date.getFullYear())
    case "MMMM":
    case "LLLL":
      return longMonths[date.getMonth()] ?? ""
    case "MMM":
    case "LLL":
      return shortMonths[date.getMonth()] ?? ""
    case "MM":
      return pad(date.getMonth() + 1)
    case "M":
      return String(date.getMonth() + 1)
    case "dd":
      return pad(date.getDate())
    case "d":
      return String(date.getDate())
    case "Do":
      return `${date.getDate()}${ordinalSuffix(date.getDate())}`
    case "PPP":
      return `${longMonths[date.getMonth()] ?? ""} ${date.getDate()}${ordinalSuffix(
        date.getDate(),
      )}, ${date.getFullYear()}`
    default:
      return token
  }
}

/**
 * Format a Date with a subset of date-fns tokens.
 *
 * Supported: PPP, yyyy, yy, y, MMMM, MMM, MM, M, LLLL, LLL, dd, d, Do.
 * Anything else passes through verbatim.
 */
export function format(date: Date, pattern: string): string {
  return pattern.replace(TOKEN_PATTERN, (token) => tokenToString(token, date))
}

export function isValid(date: unknown): date is Date {
  return date instanceof Date && !Number.isNaN(date.valueOf())
}
