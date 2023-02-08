chrome.commands.onCommand.addListener((shortcut) => {
    console.log('lets reload');
    console.log(shortcut);
    if (shortcut.includes("+M")) {
        // reload current tab
        chrome.tabs.reload();
        chrome.runtime.reload();

    }
})


