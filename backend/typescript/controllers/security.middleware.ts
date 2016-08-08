import {logger} from '../logger';
import * as colors from 'colors';
import {Request, Response} from 'express';
import {Headers} from './headers';
import {ErrorResponse, ICreateIdentityDTO} from '../../../commons/RamAPI';
import {AgencyUser, IAgencyUserProgramRole, AgencyUserProgramRole} from '../models/agencyUser.model';
import {IPrincipal, Principal} from '../models/principal.model';
import {IIdentity, IdentityModel} from '../models/identity.model';
import {IAgencyUser} from '../models/agencyUser.model';
import {DOB_SHARED_SECRET_TYPE_CODE} from '../models/sharedSecretType.model';

// todo determine if we need to base64 decode header values to be spec compliant?

class Security {

    public prepareRequest(): (req: Request, res: Response, next: () => void) => void {
        return (req: Request, res: Response, next: () => void) => {
            //this.logHeaders(req);
            const agencyUserLoginIdValue = this.getValueFromHeaderLocalsOrCookie(req, res, Headers.AgencyUserLoginId);
            const identityIdValue = this.getValueFromHeaderLocalsOrCookie(req, res, Headers.IdentityIdValue);
            //console.log('agencyUserLoginIdValue=', agencyUserLoginIdValue);
            //console.log('identityIdValue=', identityIdValue);
            if (agencyUserLoginIdValue) {
                // agency login supplied, carry on
                Promise.resolve(agencyUserLoginIdValue)
                    .then(this.prepareAgencyUserResponseLocals(req, res, next))
                    .then(this.prepareCommonResponseLocals(req, res, next))
                    .catch(this.reject(res, next));
            } else if (identityIdValue) {
                // identity id supplied, try to lookup and if not found create a new identity before carrying on
                IdentityModel.findByIdValue(identityIdValue)
                    .then(this.createIdentityIfNotFound(req, res))
                    .then(this.prepareIdentityResponseLocals(req, res, next))
                    .then(this.prepareCommonResponseLocals(req, res, next))
                    .catch(this.reject(res, next));
            } else {
                // no id supplied, carry on
                Promise.resolve(null)
                    .then(this.prepareIdentityResponseLocals(req, res, next))
                    .then(this.prepareCommonResponseLocals(req, res, next))
                    .catch(this.reject(res, next));
            }
        };
    }

    private getValueFromHeaderLocalsOrCookie(req: Request, res: Response, key: string): string {

        // look for id in headers
        if (req.get(key)) {
            // logger.info('found header', req.get(key));
            return req.get(key);
        }

        // look for id in locals
        if (res.locals[key]) {
            // logger.info('found local', res.locals[key]);
            return res.locals[key];
        }

        // look for id in cookies
        return SecurityHelper.getValueFromCookies(req, key);

    }

    /* tslint:disable:max-func-body-length */
    private createIdentityIfNotFound(req: Request, res: Response) {
        return (identity?: IIdentity) => {
            const rawIdValue = req.get(Headers.IdentityRawIdValue);
            if (identity) {
                logger.info('Identity context: Using existing identity ...');
                return Promise.resolve(identity);
            } else if (!rawIdValue) {
                logger.info('Identity context: Unable to create identity as raw id value was not supplied ...'.red);
                return Promise.resolve(null);
            } else {
                const dto: ICreateIdentityDTO = {
                    rawIdValue: rawIdValue,
                    partyType: req.get(Headers.PartyType),
                    givenName: req.get(Headers.GivenName),
                    familyName: req.get(Headers.FamilyName),
                    unstructuredName: req.get(Headers.UnstructuredName),
                    sharedSecretTypeCode: DOB_SHARED_SECRET_TYPE_CODE,
                    sharedSecretValue: req.get(Headers.DOB),
                    identityType: req.get(Headers.IdentityType),
                    agencyScheme: req.get(Headers.AgencyScheme),
                    agencyToken: req.get(Headers.AgencyToken),
                    linkIdScheme: req.get(Headers.LinkIdScheme),
                    linkIdConsumer: req.get(Headers.LinkIdConsumer),
                    publicIdentifierScheme: req.get(Headers.PublicIdentifierScheme),
                    profileProvider: req.get(Headers.ProfileProvider)
                };
                logger.info('Identity context: Creating new identity ... ');
                return IdentityModel.createFromDTO(dto);
            }
        };
    }

    private prepareAgencyUserResponseLocals(req: Request, res: Response, next: () => void) {
        return (idValue: string) => {
            logger.info('Agency User context:', (idValue ? colors.magenta(idValue) : colors.red('[not found]')));
            if (idValue) {
                const givenName = this.getValueFromHeaderLocalsOrCookie(req, res, Headers.GivenName);
                const familyName = this.getValueFromHeaderLocalsOrCookie(req, res, Headers.FamilyName);
                const displayName = givenName ?
                    givenName + (familyName ? ' ' + familyName : '') :
                    (familyName ? familyName : '');
                const programRoles: IAgencyUserProgramRole[] = [];
                const programRolesRaw = this.getValueFromHeaderLocalsOrCookie(req, res, Headers.AgencyUserProgramRoles);
                if (programRolesRaw) {
                    const programRowStrings = programRolesRaw.split(',');
                    for (let programRoleString of programRowStrings) {
                        programRoles.push(new AgencyUserProgramRole(
                            programRoleString.split(':')[0],
                            programRoleString.split(':')[1]
                        ));
                    }
                }
                res.locals[Headers.Principal] = new Principal(idValue, displayName, true);
                res.locals[Headers.PrincipalIdValue] = idValue;
                res.locals[Headers.AgencyUser] = new AgencyUser(
                    idValue,
                    givenName,
                    familyName,
                    displayName,
                    this.getValueFromHeaderLocalsOrCookie(req, res, Headers.AgencyUserAgency),
                    programRoles
                );
            }
        };
    }

    private prepareIdentityResponseLocals(req: Request, res: Response, next: () => void) {
        return (identity?: IIdentity) => {
            logger.info('Identity context:', (identity ? colors.magenta(identity.idValue) : colors.red('[not found]')));
            if (identity) {
                res.locals[Headers.Principal] = new Principal(identity.idValue, identity.profile.name._displayName, false);
                res.locals[Headers.PrincipalIdValue] = identity.idValue;
                res.locals[Headers.Identity] = identity;
                res.locals[Headers.IdentityIdValue] = identity.idValue;
                res.locals[Headers.IdentityRawIdValue] = identity.rawIdValue;
                res.locals[Headers.GivenName] = identity.profile.name.givenName;
                res.locals[Headers.FamilyName] = identity.profile.name.familyName;
                res.locals[Headers.UnstructuredName] = identity.profile.name.unstructuredName;
                for (let sharedSecret of identity.profile.sharedSecrets) {
                    res.locals[`${Headers.Prefix}-${sharedSecret.sharedSecretType.code}`.toLowerCase()] = sharedSecret.value;
                }
            }
        };
    }

    private prepareCommonResponseLocals(req: Request, res: Response, next: () => void) {
        return () => {
            for (let key of Object.keys(req.headers)) {
                // headers should be lowercase, but lets make sure
                const keyLower = key.toLowerCase();
                // if it's an application header, copy it to locals
                if (keyLower.startsWith(Headers.Prefix)) {
                    const value = req.get(key);
                    res.locals[keyLower] = value;
                }
            }
            next();
        };
    }

    private reject(res: Response, next: () => void) {
        return (err: Error): void => {
            logger.error(('Unable to look up identity: ' + err).red);
            res.status(401);
            res.send(new ErrorResponse('Unable to look up identity.'));
        };
    }

    public getAuthenticatedIdentityIdValue(res: Response): string {
        return res.locals[Headers.IdentityIdValue];
    }

    public getAuthenticatedIdentity(res: Response): IIdentity {
        return res.locals[Headers.Identity];
    }

    public getAuthenticatedAgencyUserLoginId(res: Response): string {
        return res.locals[Headers.AgencyUserLoginId];
    }

    public getAuthenticatedAgencyUser(res: Response): IAgencyUser {
        return res.locals[Headers.AgencyUser];
    }

    public getAuthenticatedPrincipalIdValue(res: Response): string {
        return res.locals[Headers.PrincipalIdValue];
    }

    public getAuthenticatedPrincipal(res: Response): IPrincipal {
        return res.locals[Headers.Principal];
    }

    public isAuthenticated(req: Request, res: Response, next: () => void) {
        const id = res.locals[Headers.PrincipalIdValue];
        if (id) {
            next();
        } else {
            logger.error('Unable to invoke route requiring authentication'.red);
            res.status(401);
            res.send(new ErrorResponse('Not authenticated.'));
        }
    }

    public isAuthenticatedAsAgencyUser(req: Request, res: Response, next: () => void) {
        const principal = res.locals[Headers.Principal];
        if (principal && principal.agencyUserInd) {
            next();
        } else {
            logger.error('Unable to invoke route requiring agency user'.red);
            res.status(401);
            res.send(new ErrorResponse('Not authenticated as agency user.'));
        }
    }

    public getAuthenticatedABN(res: Response): string {
        return res.locals[Headers.ABN];
    }

    public getAuthenticatedAUSkey(res: Response): string {
        return res.locals[Headers.AUSkey];
    }

    public getAuthenticatedClientAuth(res: Response): string {
        return res.locals[Headers.ClientAuth];
    }

    // private logHeaders(req:Request) {
    //     for (let header of Object.keys(req.headers)) {
    //         if(Headers.isXRAMHeader(header)) {
    //             logger.debug(header, '=', req.headers[header]);
    //         }
    //     }
    // }

}

export class SecurityHelper {

    public static getValueFromCookies(req: Request, keyToMatch: string): string {
        const keyToMatchLower = keyToMatch.toLowerCase();
        for (let key of Object.keys(req.cookies)) {
            const keyLower = key.toLowerCase();
            if (keyLower === keyToMatchLower) {
                const encodedValue = req.cookies[key];
                if (encodedValue) {
                    return new Buffer(encodedValue, 'base64').toString('ascii');
                }
            }
        }
        return null;
    }

}

export const security = new Security();
