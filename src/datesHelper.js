// Dates Helper

// Create a list of day and month names.
var weekdays = [
  "Sunday", "Monday", "Tuesday",
  "Wednesday", "Thursday", "Friday",
  "Saturday"
];

var months = [
  "January", "February", "March",
  "April", "May", "June", "July",
  "August", "September", "October",
  "November", "December"
];

// Append a suffix to dates.
// Example: 23 => 23rd, 1 => 1st.
function nth(d) {
  if (d > 3 && d < 21) return 'th';
  switch (d % 10) {
      case 1:
          return "st";
      case 2:
          return "nd";
      case 3:
          return "rd";
      default:
          return "th";
  }
}

// Create a string representation of the date.
export function formatDate(date) {
  return weekdays[date.getDay()] + ", " +
      date.getDate() + nth(date.getDate()) + " " +
      months[date.getMonth()] + " " +
      date.getFullYear();
}

// Create a new date from a string, return as a timestamp.
export function timestamp(str) {
  return new Date(str).getTime();
}
