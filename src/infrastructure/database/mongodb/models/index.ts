/**
 * Index des modèles MongoDB
 * 
 * Ce fichier centralise l'export de tous les modèles
 */

export { UserModel, IUser, IUserMethods, IUserModel } from './UserModel';
export { SessionModel, ISession, ISessionMethods, ISessionModel } from './SessionModel';

// Export par défaut d'un objet contenant tous les modèles
import UserModel from './UserModel';
import SessionModel from './SessionModel';

export default {
  User: UserModel,
  Session: SessionModel,
};