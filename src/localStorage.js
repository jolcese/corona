export function getLocalData(storageVariable, defaultValue) {
  var local = window.localStorage.getItem(storageVariable);
  if (local == null ) {
    return defaultValue;
  } else {
    return local;
  }
};

export function setLocalData(storageVariable, value) {
  window.localStorage.setItem(storageVariable, value);
};