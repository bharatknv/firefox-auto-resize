const ScreenResolutions = Object.freeze({
    QUAD_HD: '2560x1440',
    FULL_HD: '1920x1080'
});

const idealWindowGeometries = new Map([
    [
        ScreenResolutions.QUAD_HD, { // x and y are coordinates of the top left of window. Pre-calculated here to center the window
            height: 1219,
            width: 2000,
            x: 280,
            y: 110
        }
    ],
    [
        ScreenResolutions.FULL_HD, {
            height: 1019,
            width: 1600,
            x: 160,
            y: 30
        }
    ],
]);

function trackWindowScreenChangesIfFirefox(win) {
    if (win.resourceName === 'librewolf') {
        trackWindowScreenChanges(win);
    }
}

function trackWindowScreenChanges(win) {
    console.info(`Tracking window ${win.internalId}`);
    win.outputChanged.connect(() => onWindowScreenChange(win));
}

function onWindowScreenChange(win) {
    console.info(`Window ${win.internalId} has changed screens`);

    if (win.fullScreen) {
        console.info(`Window ${win.internalId} is fullscreen; skip`);
        return;
    }

    if (win.maximizeMode !== 0) { // Can't find any documentation for this property but looks like 0 is un-maximized and 3 is maximized
        console.info(`Window is maximized; skip`);
        return;
    }

    const currentScreen = getCurrentScreen(win);

    console.info(`Current screen: ${currentScreen.name}`);

    const screenResolution = getScreenResolution(currentScreen);
    console.info(`Screen resolution: ${screenResolution}`);
    if (idealWindowGeometries.has(screenResolution)) {
        const idealWindowGeometry = idealWindowGeometries.get(screenResolution);
        console.info(`Ideal window geometry found: ${JSON.stringify(idealWindowGeometry)}`);
        resizeWindow(
            win,
            idealWindowGeometry.width,
            idealWindowGeometry.height,
            currentScreen.geometry.x + idealWindowGeometry.x,
            currentScreen.geometry.y + idealWindowGeometry.y
        );
    }
}

function getScreenResolution(scr) {
    const screenGeometry = scr.geometry;
    console.info(`Screen geometry: ${screenGeometry}`);

    if (screenGeometry.width === 2560 && screenGeometry.height === 1440) {
        return ScreenResolutions.QUAD_HD;
    } else if (screenGeometry.width === 1920 && screenGeometry.height === 1080) {
        return ScreenResolutions.FULL_HD;
    }

    return null;
}

function resizeWindow(win, width, height, x, y) {
    const desiredWindowGeometry = copy(win.frameGeometry);
    desiredWindowGeometry.width = width || win.frameGeometry.width;
    desiredWindowGeometry.height = height || win.frameGeometry.height;
    desiredWindowGeometry.x = x || win.frameGeometry.x;
    desiredWindowGeometry.y = y || win.frameGeometry.y;

    console.info(`Resizing window to ${JSON.stringify(desiredWindowGeometry)}`);

    win.frameGeometry = desiredWindowGeometry;
}

function getCurrentScreen(win) {
    return win.output;
}

function copy(obj) {
    return JSON.parse(JSON.stringify(obj));
}

function init() {
    workspace.stackingOrder.forEach(trackWindowScreenChangesIfFirefox);
    workspace.windowAdded.connect(trackWindowScreenChangesIfFirefox);
}

init();
