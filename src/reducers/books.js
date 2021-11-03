import showToast from "../components/Toast";

const INITIAL_STATE = [];

export default function(state = INITIAL_STATE, action) {
  switch (action.type) {
    case "add_books": {
      let itemIndex = state.findIndex(
        (item) => action.payload.url === item.url
      );
      if (itemIndex > -1) {
        showToast("This book is already in your library");
        let stateClone = [...state];
        let removedItems = stateClone.splice(itemIndex, 1);
        stateClone.unshift(...removedItems);
        return stateClone;
      }
      return [action.payload, ...state];
    }
    case "add_metadata": {
      let { data, index } = action.payload;
      let stateCopy = [...state];
      stateCopy[index] = { ...stateCopy[index], ...data };
      return stateCopy;
    }
    case "remove_book": {
      let newState = [...state];
      newState.splice(action.payload, 1);
      return newState;
    }
    case "sort_book": {
      if (action.payload < 1) return state;
      let stateDup = [...state];
      let item = stateDup.splice(action.payload, 1);
      stateDup.unshift(...item);
      return stateDup;
    }
    case "edit_book": {
      let { isEncrypted, url } = action.payload;
      let itemIndex = state.findIndex((item) => url === item.url);
      let newState = [...state];
      newState[itemIndex].isEncrypted = isEncrypted;
      return newState;
    }
    default:
      return state;
  }
}
