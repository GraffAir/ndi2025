import LogicielCategorieModel from '@models/LogicielCategorie.js';

export default class LogicielCategorieController extends GenericController {
  constructor() {
    super('LogicielCategorie', '../database.db');
    this.Model = LogicielCategorieModel;
  }
}

const logicielCategorieCtrl = new LogicielCategorieController();
export { logicielCategorieCtrl };
