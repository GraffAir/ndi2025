import AvisModel from '@models/Avis.js';

export default class AvisController extends GenericController {
  constructor() {
    super('Avis', '../database.db');
    this.Model = AvisModel;
  }
}

const avisCtrl = new AvisController();
export { avisCtrl };
