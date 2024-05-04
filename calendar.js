import { DateTime } from "luxon";

class Event {
  constructor(data) {
    this.start = data.start;
    this.end = data.end;
    this.title = data.title;

    if (!DateTime.isDateTime(this.start)) {
      throw new Error("start parameter must be a DateTime instance");
    }

    if (!DateTime.isDateTime(this.end)) {
      throw new Error("end parameter must be a DateTime instance");
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
  grid-template-rows: repeat(5, minmax(2em, 1fr)); /* 5 weeks per month */
}

.item {
}

.item-present {
  background-color: #88f;
}

.item-nearby {
  background-color: #888;
}

.item-faraway {
  background-color: #ccc;
}

.item-header {
  margin: 0;
  padding: 0 0.5rem;

  background-color: #888;
  border: 1px solid black;
}
`);

// https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements
class EventCalendarElement extends HTMLElement {
  constructor() {
    super();

    // internal state
    this.cursor = DateTime.now().startOf('day');

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
    for (var wi = 0; wi < 5; wi++) {
      for (var di = 0; di < 7; di++) {
        const itemElement = this.dataElement.appendChild(document.createElement('div'));
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

    // initial refresh
    this.refresh();
  }

  /**
   * Web Component Lifecycle Hooks
   */

  async connectedCallback() {
    // TODO: connect event handlers

    // connect event handlers for controls
    const previousButtonElement = this.headerElement.querySelector('button[data-calendar-control="previous"]');
    console.log(previousButtonElement);
  }

  async disconnectedCallback() {
    // console.log("Custom element removed from page.");
    // TODO: disconnect event handlers
  }

  async adoptedCallback() {
    // console.log("Custom element moved to new page.");
  }

  async attributeChangedCallback(name, oldValue, newValue) {
    // console.log(`Attribute ${name} has changed.`);
  }

  /**
   * Public Interface
   */

  refresh() {
    // update item elements based on the cursor
    const viewStart = this.cursor.startOf('month').startOf('week');
    var viewDayIndex = 0;

    for (var wi = 0; wi < 5; wi++) {
      for (var di = 0; di < 7; di++) {
        const itemElement = this.itemElements.get(`${wi}-${di}`);
        const itemHeaderElement = itemElement.querySelector('.item-header');

        const itemDateTime = viewStart.plus({day: viewDayIndex});
        viewDayIndex++;

        // update the item header
        itemHeaderElement.innerText = itemDateTime.toFormat('M/dd'); // XXX: customize format through config

        // update item style to indicate the current day
        if (itemDateTime.hasSame(this.cursor, 'day')) {
          itemElement.classList.add('item-present');
        }
        // current month
        else if (itemDateTime.hasSame(this.cursor, 'month')) {
          itemElement.classList.add('item-nearby');
        }
        // everything else
        else {
          itemElement.classList.add('item-faraway');
        }
      }
    }

    // TODO: update event elements
  }

  addEvent(id, event) {
    if (!(event instanceof Event)) {
      throw new Error("event parameter must be an Event instance");
    }

    // TODO: implement this
  }
}

// https://developer.mozilla.org/en-US/docs/Web/API/Window/customElements
customElements.define("event-calendar", EventCalendarElement);

export { Event, EventCalendarElement };
