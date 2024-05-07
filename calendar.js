import { DateTime, Duration, Interval } from "luxon";

class Event {
  constructor(data) {
    this.interval = data.interval;
    this.title = data.title;

    if (!Interval.isInterval(this.interval)) {
      throw new Error("interval parameter must be an Interval instance");
    }
  }
}

// https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleSheet
const EventCalendarStyleSheet = new CSSStyleSheet();
EventCalendarStyleSheet.replaceSync(`
.container {
  width: 100%;
  height: 100%;

  /* children flex layout */
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: stretch;
  row-gap: 1em;

  /* style */
  padding: 1rem;
  border: 1px solid black;
}

.header {
  /* parent flex layout */
  flex: 0 0 auto;

  /* children flex layout */
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  justify-content: space-between;
  align-items: baseline;
}

.footer {
  /* parent flex layout */
  flex: 0 0 auto;

  /* children flex layout */
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  justify-content: space-between;
  align-items: baseline;
}

.data {
  /* parent flex layout */
  flex: 1 0 auto;

  /* child grid layout */
  display: grid;

  /* style */
  grid-gap: 0.5rem;
}

.data-month {
  /* items are days in the month */
  grid-template-columns: repeat(7, 1fr); /* 7 days per week */
  /* grid-template-rows: repeat(6, 1fr); */ /* 6 weeks per month, disabled due to sizing issue */
  grid-auto-rows: fit-content(1fr);
}

/* items */

.item {
}

.item-present {
  background-color: #88f;
}

.item-nearby {
  background-color: #aaa;
}

.item-faraway {
  background-color: #ccc;
}

/* item headers */

.item-header {
  margin: 0;
  padding: 0 0.5rem;

  border: 1px solid black;
}

.item-present > .item-header {
  background-color: #888;
}

.item-nearby > .item-header {
  background-color: #888;
}

.item-faraway > .item-header {
  background-color: #ccc;
  border-color: #888;
  color: #888;
}

/* events */

.event {
  height: max-content;

  background-color: #8f8;
  border: 1px solid black;
}
`);

// https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements
class EventCalendarElement extends HTMLElement {
  constructor() {
    super();

    // internal state
    this.cursor = null;  // XXX
    this.events = new Map();

    // DOM
    this.rootElement = this.attachShadow({mode: "open"});
    this.rootElement.adoptedStyleSheets = [EventCalendarStyleSheet];

    this.containerElement = this.rootElement.appendChild(document.createElement('div'));
    this.containerElement.classList.add('container');

    this.headerElement = this.containerElement.appendChild(document.createElement('slot'));
    this.headerElement.setAttribute('name', 'header');
    this.headerElement.classList.add('header');

    this.dataElement = this.containerElement.appendChild(document.createElement('div'));
    this.dataElement.classList.add('data');

    this.footerElement = this.containerElement.appendChild(document.createElement('slot'));
    this.footerElement.setAttribute('name', 'footer');
    this.footerElement.classList.add('footer');

    // DOM for Month view
    this.dataElement.classList.add('data-month');

    this.itemElements = new Map();
    for (var wi = 0; wi < 6; wi++) {
      for (var di = 0; di < 7; di++) {
        const itemElement = this.dataElement.appendChild(document.createElement('div'));
        itemElement.setAttribute('data-week-index', wi);
        itemElement.setAttribute('data-day-index', di);
        itemElement.classList.add('item');

        // track the item element
        this.itemElements.set(`${wi}-${di}`, itemElement);

        // position the item in the data grid
        itemElement.style = `
          grid-column-start: ${di + 1};
          grid-column-end: ${di + 2};
          grid-row-start: ${wi + 1};
          grid-row-end: ${wi + 2};
        `;

        // create the item header
        const itemHeaderElement = itemElement.appendChild(document.createElement('h2'));
        itemHeaderElement.classList.add('item-header');
      }
    }

    // DOM for events
    this.eventElements = new Map();

    // initial navigation
    this.navigatePresent();
  }

  /**
   * Web Component Lifecycle Hooks
   */

  async connectedCallback() {
    // XXX: connect event handlers for controls
    this.headerElement.assignedElements().forEach(function (element) {
      if (element.getAttribute('data-calendar-control')) {
        const selectedControl = element.getAttribute('data-calendar-control');

        element.addEventListener('click', function (event) {
          event.preventDefault();

          if (selectedControl == 'next') {
            this.navigateNext();
          }
          else if (selectedControl == 'previous') {
            this.navigatePrevious();
          }
          else if (selectedControl == 'present') {
            this.navigatePresent();
          }
        }.bind(this));
      }
    }.bind(this));
  }

  async disconnectedCallback() {
    // TODO: disconnect event handlers for controls
  }

  async adoptedCallback() {
    // XXX: do we need to do anything?
  }

  async attributeChangedCallback(name, oldValue, newValue) {
    // TODO: update configuration
  }

  /**
   * Public Interface
   */

  refresh() {
    const currentDateTime = DateTime.now();
  
    // determine the view interval
    const viewInterval = Interval.after(
      this.cursor.startOf('month').startOf('week'),
      Duration.fromObject({days: this.itemElements.size}));

    // update item elements
    const viewDayIntervals = viewInterval.splitBy(Duration.fromObject({days: 1}));
    const viewElements = Array.from(this.itemElements.values());

    const viewPairs = Array.from(
      Array(Math.max(viewDayIntervals.length, viewElements.length)),
      function (_, i) {
        return [viewDayIntervals[i].start, viewElements[i]];
      });

    viewPairs.forEach(function (pair) {
      const itemDateTime = pair[0];
      const itemElement = pair[1];

      // reset the highest event offset in preparation for placing events
      // on the calendar below
      itemElement.setAttribute('data-event-offset', 0);

      // remove any attached CSS classes
      itemElement.classList.remove('item-present');
      itemElement.classList.remove('item-nearby');
      itemElement.classList.remove('item-faraway');

      // update item style to indicate the current day
      if (itemDateTime.hasSame(currentDateTime, 'day')) {
        itemElement.classList.add('item-present');
      }
      // cursor month
      else if (itemDateTime.hasSame(this.cursor, 'month')) {
        itemElement.classList.add('item-nearby');
      }
      // everything else
      else {
        itemElement.classList.add('item-faraway');
      }

      // update the item header
      // XXX: customize format through config
      const itemHeaderElement = itemElement.querySelector('.item-header');
      itemHeaderElement.innerText = itemDateTime.toFormat('M/dd');
    }.bind(this));

    // delete existing event elements
    this.eventElements.forEach(function (value, key) {
      value.forEach(function (element) {
        this.dataElement.removeChild(element);
      }.bind(this));
    }.bind(this));

    this.eventElements.clear();

    // filter events to ones overlapping with the current view
    // reason: avoid doing work for events that we can't see at all
    const visibleEventIds = new Array();
    this.events.forEach(function (event, eventId) {
      if (viewInterval.overlaps(event.interval)) {
        visibleEventIds.push(eventId);
      }
    });

    // corner case: no visible events
    if (visibleEventIds.length == 0) {
      // skip the remaining work
      return;
    }

    // sort events based on the number of days they encompass in decreasing order
    // reason: place events onto the calendar in a consistent order
    // reason: place events that span multiple days earlier than events that span fewer days
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort#comparefn
    visibleEventIds.sort(function (a, b) {
      const ad = this.events.get(a).interval.length('day');
      const bd = this.events.get(b).interval.length('day');
      return bd - ad;
    }.bind(this));

    // create event elements for visible events
    visibleEventIds.forEach(function (eventId) {
      const event = this.events.get(eventId);
      const visibleInterval = (Interval
        .fromDateTimes(
          event.interval.start.startOf('day'),
          event.interval.end.endOf('day'))
        .intersection(viewInterval));

      // XXX
      const visibleDayDateTimes = (visibleInterval
        .splitBy(Duration.fromObject({days: 1}))
        .map((interval) => interval.start));

      // XXX
      const itemElements = (visibleDayDateTimes
        .map((dayDateTime) => dayDateTime.diff(viewInterval.start).as('days'))
        .map((dayIndex) => viewElements[dayIndex]));

      const eventOffset = 1 + Math.max(...itemElements
        .map((element) => parseInt(element.getAttribute('data-event-offset'), 10)));

      // XXX
      itemElements.forEach(function (element) {
        element.setAttribute('data-event-offset', eventOffset);
      });

      // XXX
      const eventElements = new Array();
      const visibleWeekIntervals = visibleInterval.splitBy(Duration.fromObject({weeks: 1}));
      visibleWeekIntervals.forEach(function (weekInterval) {
        const firstDayElement = viewElements[Math.floor(weekInterval.start.diff(viewInterval.start).as('days'))];
        const weekStart = parseInt(firstDayElement.getAttribute('data-week-index'), 10);
        const dayStart = parseInt(firstDayElement.getAttribute('data-day-index'), 10);

        const lastDayElement = viewElements[Math.floor(weekInterval.end.diff(viewInterval.start).as('days'))];
        const dayEnd = parseInt(lastDayElement.getAttribute('data-day-index'), 10);

        // XXX
        const eventElement = this.dataElement.appendChild(document.createElement('div'));
        eventElement.setAttribute('data-event-id', eventId);
        eventElement.setAttribute('data-event-offset', eventOffset);
        eventElement.classList.add('event');

        // update event element title
        // XXX: customize this from config
        eventElement.innerText = event.title;

        // update event element grid position and offset
        // TODO: the problem with this is the grid cell minimum size is based
        // on the minimum size of it's contents which in this case is dominated
        // by the largest margin-top of it's event elements. each grid cell is
        // going to have the same height so unfortunately that means a few
        // events on one day stretch out the entire calendar size including for
        // weeks that have nothing on them.
        eventElement.style = `
          grid-column-start: ${dayStart + 1};
          grid-column-end: ${dayEnd + 2};
          grid-row-start: ${weekStart + 1};
          grid-row-end: ${weekStart + 2};
          margin-top: calc(2.1rem + (1.5rem * ${eventOffset - 1}));
        `;

        // XXX
        eventElements.push(eventElement);
      }.bind(this));

      // XXX
      this.eventElements.set(eventId, eventElements);
    }.bind(this));
  }

  // XXX: switch to batches instead individual instances by default
  addEvent(id, event) {
    if (this.events.has(id)) {
      throw new Error("id parameter is already in use in this calendar instance");
    }

    if (!(event instanceof Event)) {
      throw new Error("event parameter must be an Event instance");
    }

    this.events.set(id, event);
  }

  // XXX: switch to batches instead individual instances by default
  removeEvent(id) {
    if (!this.events.has(id)) {
      throw new Error(`event not found in calendar: ${id}`);
    }

    this.events.remove(id);
  }

  navigatePresent() {
    this.cursor = DateTime.now().startOf('month');
    this.refresh();
  }

  navigateNext() {
    this.cursor = this.cursor.plus({month: 1});
    this.refresh();
  }

  navigatePrevious() {
    this.cursor = this.cursor.minus({month: 1});
    this.refresh();
  }
}

// https://developer.mozilla.org/en-US/docs/Web/API/Window/customElements
customElements.define("replabs-event-calendar", EventCalendarElement);

export { Event, EventCalendarElement };
