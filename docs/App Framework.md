# App Framework
The app is a *single page application* (SPA) that communicates with a REST API webservice, and to perform that tasks a range of base features needs to be covered, like manage view changes, routing, templating, data, authentication and authorization. Some third party libraries are used to assist but most is done with own code and conventions, as explained in this document.

The app *entry point* is located at (/app/source/js/**app.js**), it loads modules, initialize components and manages the start-up.

## SPA
A *shell* manages changes in the URL (history events, clicks on links) to switch between views and trigger the logic of the entering view. All that avoids browser page reloads and move the responsibility to manage *state changes* and *content load* to the app.

At the folder /app/source/js/**utils/shell** is the code for the Shell class and dependent utilities. It performs the tasks commented but delegates the 'trigger the view logic' to external code by providing events for view changes.

The Shell class keeps it's responsabilities at the minimun, and the utilities in the folder, performing specifics tasks like touching DOM, parse the URL or track history, can be replaced just providing alternatives at instantiation.

At the entry point, the Shell is instantiated with the specific set-up of the project, and handlers are set-up for the shell events to connect with the logic of each view.

## Activities
The views of the app are called **activities**, located under the /app/source/js/activities folder, they are classes managed as singletons that inherit from the Activity component (/app/source/js/components/Activity.js). Their **lifecycle** is:
- shell enters a URL that matches an activity name
- app.js looks at the app.activities object for the Activity module by name
- the Activity 'init' method is called, creating an instance or retrieving and existent one (singleton pattern, where the same instance is reused all time; the class constructor is executed only once, the first time is needed)
- app.js triggers the activity.show method
- app.js triggers the activity.hide method of the previous activity

Activities are made to work with Knockout.js library, and so they have a viewModel property attached. The call to the usual 'ko.applyBindings' happens automatically the first time the activity is displayed (at 'show' method), requiring the viewModel is set-up at each activity constructor. They perform tasks on data through models and data modules.

Activities have too an accessLevel property that lets assign a value to manage authorization (the value must be one from the internal UserType enumeration, and logic is managed by app.js and /utils/accessControl.js).

More details on inherit behavior and methods at the Activity.js component.

Note that the Shell class knows nothing about activities, knockout, models or data modules. It's independent and usable alone. It's the app.js who connect them. The Shell has a hook for accessControl, but implementation is provided externally.

## Routing
A simple routing is implemented, where the first segment of a URL matches an activity name, (in case not, a page not found error is displayed). So routing is implicit, guided by pattern.

The activity.show method receives as single parameter an object containing a property 'route', parsed by the Shell and that looks like:
<pre>
{
    url: '/example/with/parameters?that=is',
    name: 'example',
    segments: ['with', 'parameters'],
    path: '/example/with/parameters',
    query: { that: 'is' },
    root: false // Only true if URL is '/', and name, segments and path will be null
}
</pre>

Analyzing that, each activity can performs different actions dependent on segments or query values provided (that way more advanced routing is delegated to the activity receiving the call).

To assist with that, we have a **Router class** (/app/source/js/utils/Router.js); can be optionally used to make more declarative the list of available URLs inside the activity and processing them. *It's something introduced recently and still used in few cases*.

**Will change:** we have an [open issue](https://github.com/loconomics/loconomics/issues/365) proposing to change this routing. Let's speak and work there to enhance this.

## Managing data
Data structures are defined as Model classes, where properties are Knockout observables and the base class provide utilities to easily generate plain objects, being updated with external data or being cloned in an effective way.

All inherit from the Model class (/app/source/js/**models/Model.js**) and use the method `this.model.defineProperties` at constructor to create all observable properties that, at some point, must be serialized or updated with external data.
They can include computed observables, created at the standard way of Knockout (*pureComputed* is recommented).

## External data
The data modules (/app/source/js/data directory) provides the APIs to access and modify the app data.
They follow common patterns (by reusing helper classes), keep cached copies and uses Models and Knockout observables. Some APIs here may return shared model instances, plain data or observables, depending on what's useful for each case.

Data sources includes remote data (from our REST API webservice mainly), local copy (for persistent cache and set-up) and in memory cache for faster results.

Sub-directories of /app/source/js/data holds modules with drivers and helpers exclusively used by data modules.
