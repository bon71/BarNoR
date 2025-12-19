fastlane documentation
----

# Installation

Make sure you have the latest version of the Xcode command line tools installed:

```sh
xcode-select --install
```

For _fastlane_ installation instructions, see [Installing _fastlane_](https://docs.fastlane.tools/#installing-fastlane)

# Available Actions

## iOS

### ios build

```sh
[bundle exec] fastlane ios build
```

Build the app

### ios beta

```sh
[bundle exec] fastlane ios beta
```

Upload to TestFlight (beta build)

### ios release

```sh
[bundle exec] fastlane ios release
```

Upload to TestFlight and submit for review

### ios test

```sh
[bundle exec] fastlane ios test
```

Run tests

### ios match

```sh
[bundle exec] fastlane ios match
```

Sync certificates and provisioning profiles (readonly)

### ios match_setup

```sh
[bundle exec] fastlane ios match_setup
```

Setup certificates and provisioning profiles (creates new if needed)

### ios version_bump

```sh
[bundle exec] fastlane ios version_bump
```

Increment version number

### ios version_info

```sh
[bundle exec] fastlane ios version_info
```

Get current version and build number

----

This README.md is auto-generated and will be re-generated every time [_fastlane_](https://fastlane.tools) is run.

More information about _fastlane_ can be found on [fastlane.tools](https://fastlane.tools).

The documentation of _fastlane_ can be found on [docs.fastlane.tools](https://docs.fastlane.tools).
