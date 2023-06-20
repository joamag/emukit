# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

*

### Changed

* Made background color on fullscreen #000000

### Fixed

*

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
