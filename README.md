# EmuKit

Emulation Web UI toolkit written in Typescript with the help of React.js 🕹️.

## Troubleshooting

### I'm getting a React error when using local package link `yarn link emukit`

If your're facing a duplicated React instance error when using `yarn link` you may need to create an alias to the Emulator's react package.

Try to add the following code to your project's `package.json` file:

```json
"alias": {
    "react": "<your-emulator-path>/node_modules/react",
    "react-dom": "<your-emulator-path>/node_modules//react-dom"
}
```

## License

EmuKit is currently licensed under the [Apache License, Version 2.0](http://www.apache.org/licenses/).
