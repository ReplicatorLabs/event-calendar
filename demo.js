import { DateTime } from "luxon";
import { Calendar } from "calendar";

document.addEventListener('DOMContentLoaded', function (event) {
  const calendarElement = document.querySelector('#calendar');
  const calendar = new Calendar(calendarElement);
});
