import { atom } from "recoil";

const localStorageEffect = key => ({ setSelf, onSet }) => {
    const savedValue = localStorage.getItem(key)
    if (savedValue != null) {
        setSelf(JSON.parse(savedValue));
    }

    onSet(newValue => {
        //   if (newValue instanceof DefaultValue) {
        //     localStorage.removeItem(key);
        //   } else {
        localStorage.setItem(key, JSON.stringify(newValue));
        //   }
    });
};

export const cmtheme = atom({
    key: "cmtheme",
    default: "darcula",
    effects_UNSTABLE: [
        localStorageEffect('cmtheme'),
    ]
});