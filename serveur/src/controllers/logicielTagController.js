import LogicielTagModel from '../models/LogicielTag.js';

export default class LogicielTagController extends GenericController {
  constructor() {
    super('LogicielTag', '../database.db');
    this.Model = LogicielTagModel;
  }
}

const logicielTagCtrl = new LogicielTagController();
export { logicielTagCtrl };
