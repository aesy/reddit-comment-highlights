import "options/module.scss";
import { Options } from "options/ExtensionOptions"
import { Actions } from "common/Actions";
import { extensionFunctionRegistry } from "common/Registries";

const element = {
    content: document.querySelector(".main-content")!,
    CSSTextArea: document.getElementById("CSS-text") as HTMLInputElement,
    CSSClassNameInput: document.getElementById("class-name") as HTMLInputElement,
    CSSClassName: document.querySelector(".class-name")!,
    borderInput: document.getElementById("border") as HTMLInputElement,
    clearCommentInput: document.getElementById("clear-comment") as HTMLInputElement,
    clearChildrenInput: document.getElementById("clear-child-comments") as HTMLInputElement,
    frequencyInput: document.getElementById("frequency") as HTMLInputElement,
    frequencyNumber: document.getElementById("frequency-number")!,
    frequencyUnit: document.getElementById("frequency-unit")!,
    colorPickerRadioButton: document.getElementById("color-pickers")!,
    customCSSRadioButton: document.getElementById("custom-css") as HTMLInputElement,
    statusMessage: document.getElementById("status-message")!,
    styleModes: document.querySelectorAll("input[name=\"style-mode\"]")!,
    advancedDialog: document.getElementById("advanced")!,
    advancedSettings: document.querySelectorAll(".advanced")!,
    advancedButton: document.getElementById("show-advanced")!,
    saveButton: document.getElementById("save-options")!,
    tabs: document.querySelectorAll(".main-content__tab")!,
    resetButton: document.getElementById("clear-all")!,
    year: document.getElementById("footer__year")!,
    compressedStorage: document.getElementById("compressed-storage") as HTMLInputElement,
    syncedStorage: document.getElementById("sync-storage") as HTMLInputElement,
    debug: document.getElementById("debug-mode") as HTMLInputElement,
    backgroundColorPicker: document.getElementById("back-color") as HTMLInputElement,
    backgroundNightColorPicker: document.getElementById("back-color-night") as HTMLInputElement,
    textColorPicker: document.getElementById("front-color") as HTMLInputElement,
    textNightColorPicker: document.getElementById("front-color-night") as HTMLInputElement,
    customLinkColor: document.getElementById("custom-link-color") as HTMLInputElement,
    linkColorPicker: document.getElementById("link-color") as HTMLInputElement,
    linkNightColorPicker: document.getElementById("link-color-night") as HTMLInputElement,
    customQuoteColor: document.getElementById("custom-quote-color") as HTMLInputElement,
    quoteTextColorPicker: document.getElementById("quote-text-color") as HTMLInputElement,
    quoteTextNightColorPicker: document.getElementById("quote-text-color-night") as HTMLInputElement
};

const state = {
    showAdvancedSettings: false
};

class Message {
    private static timeOutId: number;

    public static show(text: string, isError = false): void {
        element.statusMessage.textContent = text;
        element.statusMessage.classList.add("status-message--is-visible");

        if (Message.timeOutId) {
            clearTimeout(Message.timeOutId);
        }

        element.statusMessage.classList.toggle("status-message--success", !isError);
        element.statusMessage.classList.toggle("status-message--error", isError);

        Message.timeOutId = window.setTimeout(() => {
            element.statusMessage.classList.remove("status-message--is-visible");
        }, 3000);
    }
}

function isValidCSSClassName(className: string): boolean {
    return /^[a-z_]|-[a-z_-][a-z\d_-]*$/i.test(className);
}

async function save(): Promise<void> {
    // noinspection ConditionalExpressionJS
    const options: Partial<Options> = {
        backColor: element.backgroundColorPicker.value,
        backNightColor: element.backgroundNightColorPicker.value,
        frontColor: element.textColorPicker.value,
        frontNightColor: element.textNightColorPicker.value,
        linkColor: element.customLinkColor.checked ? element.linkColorPicker.value : null,
        linkNightColor: element.customLinkColor.checked ? element.linkNightColorPicker.value : null,
        quoteTextColor: element.customQuoteColor.checked ? element.quoteTextColorPicker.value : null,
        quoteTextNightColor: element.customQuoteColor.checked ? element.quoteTextNightColorPicker.value : null,
        threadRemovalTimeSeconds: parseInt(element.frequencyInput.value) * 86400,
        border: element.borderInput.checked ? undefined : null, // undefined = default, null = none
        clearCommentOnClick: element.clearCommentInput.checked,
        clearCommentincludeChildren: element.clearChildrenInput.checked,
        customCSS: element.customCSSRadioButton.checked ? element.CSSTextArea.value : null,
        customCSSClassName: element.customCSSRadioButton.checked ? element.CSSClassNameInput.value : undefined,
        useCompression: element.compressedStorage.checked,
        sync: element.syncedStorage.checked,
        debug: element.debug.checked
    };

    try {
        await extensionFunctionRegistry.invoke(Actions.SAVE_OPTIONS, options);
    } catch (error) {
        Message.show("Save unsuccessful (see console for detailed error message)", true);
        return console.warn(error);
    }

    Message.show("Settings saved!", false);
}

async function update(): Promise<void> {
    const className = element.CSSClassNameInput.value.trim();
    const valid = isValidCSSClassName(className);

    element.CSSClassNameInput.classList.toggle("text-input--invalid", !valid);
    element.CSSClassNameInput.textContent = className;
    element.CSSClassName.textContent = className;
    element.clearChildrenInput.disabled = !element.clearCommentInput.checked;
    element.linkColorPicker.disabled = !element.customLinkColor.checked;
    element.linkNightColorPicker.disabled = !element.customLinkColor.checked;
    element.quoteTextColorPicker.disabled = !element.customQuoteColor.checked;
    element.quoteTextNightColorPicker.disabled = !element.customQuoteColor.checked;

    const selection = document.querySelector("input[name=\"style-mode\"]:checked")!;

    for (const tab of element.tabs) {
        tab.classList.toggle(
            "main-content__tab--is-visible",
            tab.classList.contains(selection.id)
        );
    }

    const frequencyValue = element.frequencyInput.value;

    switch (parseInt(frequencyValue, 10)) {
        case 1:
            element.frequencyNumber.textContent = String(1);
            element.frequencyUnit.textContent = "day";
            break;
        case 7:
            element.frequencyNumber.textContent = String(1);
            element.frequencyUnit.textContent = "week";
            break;
        case 14:
            element.frequencyNumber.textContent = String(2);
            element.frequencyUnit.textContent = "weeks";
            break;
        default:
            element.frequencyNumber.textContent = frequencyValue;
            element.frequencyUnit.textContent = "days";
    }

    element.advancedDialog.classList.toggle(
        "options-section--hidden",
        state.showAdvancedSettings
    );

    for (const setting of element.advancedSettings) {
        setting.classList.toggle("options-section--hidden", !state.showAdvancedSettings);
    }

    element.content.classList.remove("main-content--hidden");
}

async function load(): Promise<void> {
    let options: Options;

    try {
        options = await extensionFunctionRegistry.invoke<void, Options>(Actions.GET_OPTIONS);
    } catch (error) {
        Message.show("Load unsuccessful (see console for detailed error message)", true);
        return console.warn(error);
    }

    element.backgroundColorPicker.value = options.backColor;
    element.backgroundNightColorPicker.value = options.backNightColor;
    element.textColorPicker.value = options.frontColor;
    element.textNightColorPicker.value = options.frontNightColor;
    element.frequencyInput.value = String(options.threadRemovalTimeSeconds / 86400);
    element.borderInput.checked = Boolean(options.border);
    element.clearCommentInput.checked = options.clearCommentOnClick;
    element.clearChildrenInput.checked = options.clearCommentincludeChildren;
    element.customLinkColor.checked = Boolean(options.linkColor);
    element.customQuoteColor.checked = Boolean(options.quoteTextColor);
    element.compressedStorage.checked = options.useCompression;
    element.syncedStorage.checked = options.sync;
    element.debug.checked = options.debug;

    if (options.linkColor) {
        element.linkColorPicker.value = options.linkColor;
    }

    if (options.linkNightColor) {
        element.linkNightColorPicker.value = options.linkNightColor;
    }

    if (options.quoteTextColor) {
        element.quoteTextColorPicker.value = options.quoteTextColor;
    }

    if (options.quoteTextNightColor) {
        element.quoteTextNightColorPicker.value = options.quoteTextNightColor;
    }

    if (options.customCSS) {
        element.customCSSRadioButton.click();
        element.CSSTextArea.value = options.customCSS;
    } else {
        element.colorPickerRadioButton.click();
    }

    if (options.customCSSClassName) {
        element.CSSClassNameInput.value = options.customCSSClassName;
    }

    element.year.textContent = String(new Date().getFullYear());

    await update();
}

async function reset(): Promise<void> {
    state.showAdvancedSettings = false;

    window.scrollTo({
        top: 0,
        left: 0,
        behavior: "smooth"
    });

    try {
        await extensionFunctionRegistry.invoke(Actions.CLEAR_STORAGE, undefined);
    } catch (error) {
        Message.show("Reset unsuccessful (see console for detailed error message)", true);
        return console.warn(error);
    }

    Message.show("Settings reset!", false);
    await load();
}

async function initializeListeners(): Promise<void> {
    element.saveButton.addEventListener("click", save);
    element.resetButton.addEventListener("click", reset);
    element.advancedButton.addEventListener("click", async () => {
        state.showAdvancedSettings = true;
        await update();
    });
    element.clearCommentInput.addEventListener("click", update);
    element.customLinkColor.addEventListener("click", update);
    element.customQuoteColor.addEventListener("click", update);
    element.frequencyInput.addEventListener("input", update);
    element.CSSClassNameInput.addEventListener("input", async () => {
        const selection = {
            start: element.CSSClassNameInput.selectionStart!,
            end: element.CSSClassNameInput.selectionEnd!
        };

        // This loses the selection of the input for some reason
        await update();

        // Restore selection (has to be async)
        setTimeout(() => {
            element.CSSClassNameInput.setSelectionRange(selection.start, selection.end);
        }, 0);
    });

    for (const styleMode of element.styleModes) {
        styleMode.addEventListener("click", update);
    }
}

async function initialize(): Promise<void> {
    await Promise.all([
        initializeListeners(),
        load()
    ]);
}

document.addEventListener("DOMContentLoaded", async () => {
    try {
        await initialize()
    } catch (error) {
        Message.show("An error occured (see console for detailed error message)", true);
        console.warn(error);
    }
});
