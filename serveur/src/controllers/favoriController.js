import FavoriModel from '@models/Favori.js';

export default class FavoriController extends GenericController {
  constructor() {
    super('Favori', '../database.db');
    this.Model = FavoriModel;
  }
}

const favoriCtrl = new FavoriController();
export { favoriCtrl };
