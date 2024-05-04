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

.controls {
  /* parent flex layout */
  flex: none;

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
}

.data-month {
  /* items are days in the month */
  grid-template-columns: repeat(7, 1fr); /* 7 days per week */
  grid-template-rows: repeat(5, minmax(2em, 1fr)); /* 5 weeks per month */
}
`);

// https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements
class EventCalendarElement extends HTMLElement {
  constructor() {
    super();

    // internal state
    this.cursor = DateTime.now();
    this.events = new Array();

    // DOM
    this.rootElement = this.attachShadow({mode: "open"});
    this.rootElement.adoptedStyleSheets = [EventCalendarStyleSheet];

    this.containerElement = this.rootElement.appendChild(document.createElement('div'));
    this.containerElement.classList.add('container');

    this.headerElement = this.containerElement.appendChild(document.createElement('slot'));
    this.headerElement.setAttribute('name', 'controls');
    this.headerElement.classList.add('controls');

    this.dataElement = this.containerElement.appendChild(document.createElement('div'));
    this.dataElement.classList.add('data');
    this.dataElement.classList.add('data-month');

    // DEBUG: need to specify grid-area explicitly though to allow overlap
    for (var i = 0; i < 32; i++) {
      const element = this.dataElement.appendChild(document.createElement('div'));
      element.innerText = i;
    }

    /*
    const foo = this.dataElement.appendChild(document.createElement('div'));
    foo.innerText = 'foo';
    foo.style = 'grid-area: 2 / 2 / 2 / 2;';

    const bar = this.dataElement.appendChild(document.createElement('div'));
    foo.innerText = 'bar';
    foo.style = 'grid-area: 2 / 2 / 2 / 2;';
    */
  }

  async connectedCallback() {
    // console.log("Custom element added to page.");
    // TODO: connect event handlers
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

  addEvent(event) {
    if (!(event instanceof Event)) {
      throw new Error("event parameter must be an Event instance");
    }

    this.events.push(event);
  }
}

// https://developer.mozilla.org/en-US/docs/Web/API/Window/customElements
customElements.define("event-calendar", EventCalendarElement);

export { Event, EventCalendarElement };
