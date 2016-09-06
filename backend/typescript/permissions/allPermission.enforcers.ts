import {IPermissionEnforcer} from '../models/base';
import {IIdentity} from '../models/identity.model';
import {IName} from '../models/name.model';
import {IParty} from '../models/party.model';
import {IProfile} from '../models/profile.model';
import {IRole} from '../models/role.model';
import {IRelationship} from '../models/relationship.model';
import {ISharedSecret} from '../models/sharedSecret.model';
import {RelationshipCanAcceptPermissionEnforcer} from './relationshipCanAcceptPermission.enforcer';
import {RelationshipCanClaimPermissionEnforcer} from './relationshipCanClaimPermission.enforcer';
import {RelationshipCanModifyPermissionEnforcer} from './relationshipCanModifyPermission.enforcer';
import {RelationshipCanNotifyDelegatePermissionEnforcer} from './relationshipCanNotifyDelegatePermission.enforcer';
import {RelationshipCanRejectPermissionEnforcer} from './relationshipCanRejectPermission.enforcer';
import {RelationshipCanViewPermissionEnforcer} from './relationshipCanViewPermission.enforcer';
import {IRelationshipAttributeNameUsage} from '../models/relationshipAttributeNameUsage.model';
import {IRelationshipAttribute} from '../models/relationshipAttribute.model';
import {IRoleAttribute} from '../models/roleAttribute.model';
import {IRoleAttributeNameUsage} from '../models/roleAttributeNameUsage.model';

export class PermissionEnforcers {

    public static identity: IPermissionEnforcer<IIdentity>[] = [];

    public static iname: IPermissionEnforcer<IName>[] = [];

    public static party: IPermissionEnforcer<IParty>[] = [];

    public static profile: IPermissionEnforcer<IProfile>[] = [];

    public static relationship: IPermissionEnforcer<IRelationship>[] = [
        new RelationshipCanAcceptPermissionEnforcer(),
        new RelationshipCanClaimPermissionEnforcer(),
        new RelationshipCanModifyPermissionEnforcer(),
        new RelationshipCanNotifyDelegatePermissionEnforcer(),
        new RelationshipCanRejectPermissionEnforcer(),
        new RelationshipCanViewPermissionEnforcer(),
    ];

    public static relationshipAttribute: IPermissionEnforcer<IRelationshipAttribute>[] = [];

    public static relationshipAttributeNameUsage: IPermissionEnforcer<IRelationshipAttributeNameUsage>[] = [];

    public static role: IPermissionEnforcer<IRole>[] = [];

    public static sharedSecret: IPermissionEnforcer<ISharedSecret>[] = [];

    public static roleAttribute: IPermissionEnforcer<IRoleAttribute>[] = [];

    public static roleAttributeNameUsage: IPermissionEnforcer<IRoleAttributeNameUsage>[] = [];

}