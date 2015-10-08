# Loconomics

Root folders include documentation (/docs and /styleguide*1) and sub-projects (/app, /web and the /iCalendarLib library).

*1: Styleguide is currently obsolete, the design is implemented in /app.

## App
It's a web app that targets mobile (using Phonegap) and the front-end for the web.

It uses:
- Web platform: html, css, js
- Preprocessors: Stylus (CSS), Browserify (js), Bliss (html)
- Main libraries: jQuery-2, Bootstrap-3, Knockoutjs-3.3, polyfills for ES5 and ES6-Promise, momentjs.
- Nodejs to assist front-end development, using Grunt as tasks runner.

### Prepare dev environment
- Clone the git repository, master branch.
- Install NodeJS (minimum version 0.10, not tested with the newest ones like 4.1 but must work): https://nodejs.org/ (it has packages/installers for Windows, Mac and Linux)
- From the command line, use the NodeJS Package Manager (npm) to globally install
  - [Grunt](http://gruntjs.com/), type:

    > npm install -g grunt
  - [Phonegap](http://phonegap.com/), type:

    > npm install -g phonegap
  
  Linux and Mac may require root/elevated rights in order to install globally.
- From the command line at the project directory type

  > npm install

  It will install all the modules listed on the package.json file, needed to build the app source code.

### Organization (main folders)
- /source: source code of the app and templates of configuration files
- /build: automatic content, generated by the build process from source
- /phonegap: automatic content, generated by the build process targetting Phonegap.
- /build/latest.zip: It's a compressed bundled of the /phonegap content, ready to use in the PhoneGap Build service, used to compile the project for iOS and Android in the cloud (file ignored by git).
- /node_modules: automatic content, managed by npm
- /grunt: javascript files that define automated tasks using the Grunt task runner.
- /trials: some testing files for things being developed, to try in a isolated context, temporary content.
- /vendor: third party modules that are not at npm, or needed some custom build, or forked third party modules.
- /package.js: NodeJS package definition file, keeps modules dependencies (npm) and some set-up variables.
- /Gruntfile.js: file required by the Grunt task runner on the project root folder; more code is organized in the /grunt folder to don't have a fat Gruntfile.js file.

### Build the source code
**All next commands must be executed in a command line/terminal at the project directory**

Run next command:
> grunt build

It will recreate the content of the /build and /phonegap folders.

To test the webapp in the browser, a lightweight built-in http server is being used (*connect*), to start it, run next command and keep the task alive:
> grunt connect:atbuild

But *it's better* to run next special task, that performs the previous one and other things:
> grunt atwork

- runs the *connect* server at http://localhost:8811/
- runs the *watch* task that will listen for changes on source files to automatically rebuild the needed files
(specific builds are performed, like build-js, build-css, depending on the modified files;
when they finish, the browser can be refreshed to try latest changes).
- by modifying the package.json file (to update the version number, for example :-), the *watch* task will
run the *grunt build* task, rebuilding everything; when it finishs, the /build/latest.zip file is ready to be sent
to PhoneGap Build, and the phonegap folder is ready to perform local PhoneGap builds.
- when the build ends, a notification is sent to the system (more info at https://github.com/dylang/grunt-notify).

**PhoneGap Build** cloud service is used to create the intallation packages for iOS and Android.

To perform that task in your own computer, you need the SDKs of each platform:
- Apple XCode installed to create the iOS app; run the command:

  > phonegap build ios
  
- Android SDKsinstalled to create the Android app; run the command:

  > phonegap build android
  
Remember that the Phonegap plugins must be installed previously in order to be included in the local build.
It's done by placing you in the /app/phonegap directory from the command line/terminal and running something like:

> phonegap plugin add https://git-wip-us.apache.org/repos/asf/cordova-plugin-inappbrowser.git

The file /app/source/cordova-config.js.xml has a list of all the plugins in use (look at the *gap:plugin* elements),
this config is used by the PhoneGap Build service to automatically install them. The version in use is there too, but not
git URL, the package name can be used to locate it at [npm](https://www.npmjs.com/) and found the project git URL there.

