import LogicielModel from '@models/Logiciel';

class LogicielController extends GenericController {
  constructor() {
    super('Logiciel', '../database.db');
    this.Model = LogicielModel;
  }
}

export default new LogicielController();
