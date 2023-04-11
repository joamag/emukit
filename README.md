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

The following message may appear in you browser's console when this error occurs:

```text
Warning: Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for one of the following reasons:
1. You might have mismatching versions of React and the renderer (such as React DOM)
2. You might be breaking the Rules of Hooks
3. You might have more than one copy of React in the same app
See https://reactjs.org/link/invalid-hook-call for tips about how to debug and fix this problem.
```

## License

EmuKit is currently licensed under the [Apache License, Version 2.0](http://www.apache.org/licenses/).
