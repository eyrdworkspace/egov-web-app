import { SHOW_TOAST } from "./actionTypes";
import isEmpty from "lodash/isEmpty";

const app = (store) => (next) => (action) => {
  const { type } = action;
  if (type === SHOW_TOAST) {
    const state = store.getState();
    const { toast } = state.app;
    // dispatch the action only if the intetipon
    // if (
    //   (action.open && action.message && action.message.length) ||
    //   (toast.open && toast.message && toast.message.length && !action.open && (!action.message || !action.message.length))
    // ) {
    //   next(action);
    // }

    if ((action.open && action.message && !isEmpty(action.message)) || (toast.open && toast.message && !isEmpty(action.message) && !action.open)) {
      next(action);
    }
    return;
  }
  next(action);
};

export default app;
