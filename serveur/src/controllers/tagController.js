import TagModel from '@models/Tag.js';

export default class TagController extends GenericController {
  constructor() {
    super('Tag', '../database.db');
    this.Model = TagModel;
  }
}

const tagCtrl = new TagController();
export { tagCtrl };
