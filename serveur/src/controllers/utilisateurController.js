import GenericController from './genericController.js';
import UtilisateurModel from '@models/Utilisateur.js';

export default class UtilisateurController extends GenericController {
  constructor() {
    super('Utilisateur', '../database.db');
    this.Model = UtilisateurModel;
  }
}

const utilisateurCtrl = new UtilisateurController();
export { utilisateurCtrl };
