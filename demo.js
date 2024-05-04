import { DateTime } from "luxon";
import { Event, EventCalendarElement } from "calendar";

document.addEventListener('DOMContentLoaded', async function (event) {
  await customElements.whenDefined('event-calendar');
  const calendarElement = document.querySelector('#calendar');

  calendarElement.addEvent(new Event({
    start: DateTime.fromISO("2024-10-12T12:00:00-00:00"),
    end: DateTime.fromISO("2024-10-12T12:30:00-00:00"),
    title: "Sample Event"
  }));
});
