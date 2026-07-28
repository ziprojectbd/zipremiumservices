type Listener = () => void;

let _isUnderMaintenance = false;
let _maintenanceMessage = '';
const listeners = new Set<Listener>();

const maintenanceStore = {
  get isUnderMaintenance() {
    return _isUnderMaintenance;
  },
  get maintenanceMessage() {
    return _maintenanceMessage;
  },
  setMaintenance(message: string) {
    _isUnderMaintenance = true;
    _maintenanceMessage = message;
    listeners.forEach((fn) => fn());
  },
  clearMaintenance() {
    _isUnderMaintenance = false;
    _maintenanceMessage = '';
    listeners.forEach((fn) => fn());
  },
  subscribe(fn: Listener) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};

export default maintenanceStore;
