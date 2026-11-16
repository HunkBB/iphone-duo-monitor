// Dependencies and HTML are embedded by scripts/build.mjs.
export default createBackend({collectFn:city=>collect(fetch,city),html:HTML,cities:CITIES});
