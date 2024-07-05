(configuration, util, elementWatcher) => {

    const audio = new Audio('data:audio/mpeg;base64,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');
    const sleepAmount = 2000;
    let enabled = false;
    let started = false;

    async function initialise() {
        configuration.registerCheckbox({
            category: 'Other',
            key: 'idle-beep-enabled',
            name: 'Idle beep',
            default: false,
            handler: handleConfigStateChange
        });
        elementWatcher.addRecursiveObserver(actionStart, 'nav-component > div.nav', 'action-component');
        elementWatcher.addRecursiveObserver(actionStart, 'nav-component > div.nav', 'combat-component');
        elementWatcher.addReverseRecursiveObserver(actionStop, 'nav-component > div.nav', 'action-component');
        elementWatcher.addReverseRecursiveObserver(actionStop, 'nav-component > div.nav', 'combat-component');
    }

    function handleConfigStateChange(state, name) {
        enabled = state;
    }

    function actionStart() {
        started = true;
    }

    async function actionStop() {
        started = false;
        console.debug(`Triggering beep in ${sleepAmount}ms`);
        await util.sleep(sleepAmount);
        beep();
    }

    function beep() {
        if(!started) {
            audio.play();
        }
    }

    initialise();

}
