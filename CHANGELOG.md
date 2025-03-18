# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

*

### Changed

*

### Fixed

*

## [0.10.21] - 2025-03-18

### Fixed

* Debumped react

## [0.10.20] - 2025-03-18

### Fixed

* Bumping of package

## [0.10.19] - 2025-03-18

### Changed

* De-bumped some packages

## [0.10.18] - 2025-03-18

### Changed

* De-bumped some packages

## [0.10.17] - 2025-03-18

### Changed

* Bumped some packages

## [0.10.16] - 2025-03-18

### Added

* Support for the new download button

## [0.10.15] - 2024-09-02

### Fixed

* Small restore issues

## [0.10.14] - 2024-09-02

### Fixed

* Small first time loading issue with desynced mode

## [0.10.13] - 2024-09-02

### Added

* Skipped ticks log support
* Support for state validation
* Support for desync mode of visual execution

### Changed

* State related operation to async

## [0.10.12] - 2024-08-31

### Changed

* State related operation to async

## [0.10.11] - 2024-08-28

### Fixed

* Memo related issue with compilation details

## [0.10.10] - 2024-08-28

### Changed

* Memoised all of the class generation

## [0.10.9] - 2024-08-26

### Fixed

* Major issue with stack overflow in keyboard display toggling via `CTRL+K`

## [0.10.8] - 2024-08-26

### Changed

* Better responsive approach with efficiency in mind
* Started using [recoil](https://recoiljs.org/) for global state management

## [0.10.7] - 2024-08-08

### Added

* Improved CSS structure
* Support for the `SaveInfo` panel

## [0.10.6] - 2024-08-04

### Added

* Support for `SaveState` error handling

## [0.10.5] - 2024-07-20

### Fixed

* Animation frame loop mode frame skipping, making loop more fluid

## [0.10.4] - 2024-07-15

### Added

* Support for display frequency control

## [0.10.3] - 2024-07-15

### Fixed

* Much improved animation frame loop mode frame skipping

## [0.10.2] - 2024-07-15

### Added

* Support for the FPS, CPS and EmulationSpeed features, for diagnostics

## [0.10.1] - 2024-07-08

### Added

* `BootRomInfo` support for Boot ROM information display

## [0.10.0] - 2024-06-19

### Added

* Support for inversion of game loop control

## [0.9.8] - 2024-03-03

### Fixed

* Made all imports explicit (with extensions) to prevent file resolution issues

## [0.9.7] - 2024-03-03

### Added

* Initial rudimentary logging support

### Changed

* Separated `./ts` and `./react` folders to prevents issues with `.tsx` vs `.ts` files

## [0.9.6] - 2024-02-25

### Added

* Initial rudimentary logging support

## [0.9.5] - 2024-02-24

### Changed

* Made `boot()`, `pause()`, `resume()` and `reset()` async methods

## [0.9.4] - 2023-10-30

### Fixed

* Deployment issue with previous version

## [0.9.3] - 2023-10-30

### Added

* Support for `buildRomData()` allowing ROM data processing indirection (eg: zip support)

## [0.9.2] - 2023-09-22

### Added

* Better support for `text-input`

## [0.9.1] - 2023-08-16

### Added

* Download save state support

## [0.9.0] - 2023-08-16

### Added

* Support for save states - [#7](https://github.com/joamag/emukit/issues/7)

## [0.8.9] - 2023-08-07

### Added

* Default implementation for `audioOutput()` in `Emulator` interface

### Changed

* Made background color on fullscreen #000000

## [0.8.8] - 2023-06-20

### Added

* Support for haptic feedback (vibrate) in mobile devices

## [0.8.7] - 2023-05-18

### Changed

* Colors and style of multiple components

### Fixed

* Fast speed issue when Control key as released before D key
* Small issue with joypads listing and responsiveness

## [0.8.6] - 2023-04-20

### Added

* Improved `ButtonSwitch` component with `uppercase` prop and support for initial `value`

## [0.8.5] - 2023-04-20

### Added

* `PanelTab` component with contents selected dynamically using `display: none` approach

## [0.8.4] - 2023-04-20

### Added

* Automatic title change according to ROM name
* Support for emulator sections

## [0.8.3] - 2023-04-11

### Added

* Flexible support for the debug panels using the `debug()` method

## [0.8.2] - 2023-04-11

### Fixed

* Removed unneeded peer dependency

## [0.8.1] - 2023-04-11

### Added

* Support for WebGL plotting of charts (much faster)

### Fixed

* Issue with dragging of ROM files in Safari

## [0.8.0] - 2023-04-02

### Added

* Crude support for audio debug in GB
* Greatly improved quality of the `Canvas` element in high density displays

## [0.7.2] - 2023-03-04

### Added

* Support for audio enable and disable

## [0.7.1] - 2023-03-02

### Added

* Support for CTRL+P to change palettes

### Fixed

* Major audio bootstrap issue that prevented iOS devices from paying audio

## [0.7.0] - 2023-03-01

* Support for audio from `Emulator` instances 🎧

### Fixed

* Case insensitive issues with both GBand CHIP-8 keyboards

## [0.6.6] - 2023-02-27

### Added

* High performance `no()` function for better timing

## [0.6.5] - 2023-02-21

### Fixed

* Palette name in side panel when bootstrapping

## [0.6.4] - 2023-02-21

### Added

* Support for `compiler()` and `compilation()` getter methods in the `Emulator` interface

## [0.6.3] - 2023-01-09

### Added

* Support for version and theme printing

## [0.6.2] - 2022-12-09

### Added

* Support for forward references in `Toast` and `Modal` for easier usage

## [0.6.1] - 2022-12-07

### Added

* Support for the `icon()` getter

### Changed

* Better background callback handling

## [0.6.0] - 2022-11-27

### Added

* Support for background selection using params

## [0.5.0] - 2022-11-22

### Changed

* Improved support for gamepad

## [0.4.1] - 2022-11-22

### Fixed

* Issue related to double registration

## [0.4.0] - 2022-11-21

### Added

* Support for the `frequencySpecs()` to obtain information on how to handle frequency

## [0.3.0] - 2022-11-21

### Added

* More flexible support for help panel

### Fixed

* Load ROM extension problem

## [0.2.2] - 2022-11-20

### Changed

* Made `getTile()` optional

## [0.2.1] - 2022-11-20

### Added

* Support for dynamic frequency units

## [0.2.0] - 2022-11-20

### Changed

* Improved CHP-8 keyboard

### Fixed

* Added missing res folder

## [0.1.1] - 2022-11-19

### Fixed

* Added missing res folder

## [0.1.0] - 2022-11-19

### Added

* Initial test release
