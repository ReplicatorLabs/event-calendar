import { DateTime, Duration, Interval } from "luxon";
import { CalendarEvent, EventCalendarElement } from "calendar";

document.addEventListener('DOMContentLoaded', async function (event) {
  await customElements.whenDefined('replabs-event-calendar');
  const calendarElement = document.querySelector('#calendar');

  const now = DateTime.now();

  calendarElement.addEvent('example-1', new CalendarEvent({
    interval: Interval.fromDateTimes(
      now.startOf('day').plus({hour: 8}),
      now.startOf('day').plus({hour: 10})
    ),
    title: "Example 1"
  }));

  calendarElement.addEvent('example-2', new CalendarEvent({
    interval: Interval.fromDateTimes(
      now.startOf('day').minus({day: 1}),
      now.startOf('day').plus({day: 1})
    ),
    title: "Example 2"
  }));

  calendarElement.addEvent('example-3', new CalendarEvent({
    interval: Interval.fromDateTimes(
      now.startOf('month').minus({day: 5}).plus({hour: 12}),
      now.startOf('month').minus({day: 5}).plus({hour: 13})
    ),
    title: "Example 3"
  }));

  calendarElement.addEvent('example-4', new CalendarEvent({
    interval: Interval.fromDateTimes(
      now.endOf('month').plus({day: 12, hour: 12}),
      now.endOf('month').plus({day: 12, hour: 13})
    ),
    title: "Example 4"
  }));

  calendarElement.refresh();
});
