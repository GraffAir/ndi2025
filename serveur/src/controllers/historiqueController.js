import HistoriqueModel from '@models/Historique.js';

export default class HistoriqueController extends GenericController {
  constructor() {
    super('Historique', '../database.db');
    this.Model = HistoriqueModel;
  }
}

const historiqueCtrl = new HistoriqueController();
export { historiqueCtrl };
