/** jsdom lacks native dialog methods; keep their open/close behavior in one place. */
export function installDialogMock() {
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function () {
    this.open = false;
    this.dispatchEvent(new Event("close"));
  };
}
