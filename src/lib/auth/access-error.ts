export class PanelAccessError extends Error {
  constructor(message = "Bu kayda erisim yetkiniz bulunmuyor.") { super(message); this.name = "PanelAccessError"; }
}
